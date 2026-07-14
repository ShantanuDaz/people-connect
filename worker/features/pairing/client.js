import crypto from "hypercore-crypto";
import b4a from "b4a";
import { initNetwork } from "../network/setupNetwork.js";
import { state, cleanupSession } from "./state.js";
import { sendEvent } from "./events.js";

export const startClient = async (payload, opId) => {
  await cleanupSession();
  if (opId !== state.currentOpId) return { success: false, error: "Aborted" };

  const roomCode = payload.roomCode.trim().toUpperCase();
  const topic = crypto.discoveryKey(crypto.hash(b4a.from(roomCode, "utf-8")));

  const swarm = await initNetwork();
  if (opId !== state.currentOpId) {
    await swarm.destroy();
    return { success: false, error: "Aborted" };
  }
  
  state.activeSwarm = swarm;
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (opId === state.currentOpId) cleanupSession();
      reject(new Error("Timeout connecting to host."));
    }, 30000);

    swarm.on("connection", (connection) => {
      clearTimeout(timeout);
      console.log("Client: Connected to host");
      state.activeConnection = connection;
      
      sendEvent({ status: "connected" });

      connection.on("data", async (rawPayload) => {
        try {
          const messageString = b4a.toString(rawPayload, "utf-8");
          const messages = messageString.split("\n").filter(m => m.trim());
          for (const msg of messages) {
            const data = JSON.parse(msg);
            if (data.type === "RES_COPY_APPROVED") {
              const bootstrapPublicKeyHex = data.bootstrapKeyHex;
              
              // Save them
              const { saveIdentityConfig } = await import("../../Util/config.js");
              await saveIdentityConfig(
                null,
                bootstrapPublicKeyHex,
                state.pendingDeviceKeyHex,
                state.pendingInputCoreKeyHex,
              );

              sendEvent({ 
                status: "pairing_success",
                bootstrapKeyHex: bootstrapPublicKeyHex,
                deviceKeyHex: state.pendingDeviceKeyHex 
              });
              await cleanupSession();
            }
          }
        } catch (err) {
          console.error("Client parsing error", err);
        }
      });

      connection.on("error", (err) => {
        console.error("Client connection error:", err);
      });

      resolve({ success: true });
    });

    const discovery = swarm.join(topic, { server: false, client: true });
    discovery.flushed().then(() => {
      if (opId !== state.currentOpId) {
        clearTimeout(timeout);
        reject(new Error("Aborted"));
      }
    });
  });
};

export const requestCopy = async (store) => {
  if (!state.activeConnection) {
    throw new Error("No active connection to host.");
  }
  
  const { generateDeviceKeyPair } = await import("../../Util/crypto.js");
  const { keyPair: deviceKeyPair, publicKeyHex: deviceKeyHex } = generateDeviceKeyPair();

  const localInputCore = store.get({
    name: "local-input-log",
    keyPair: deviceKeyPair,
    valueEncoding: "json",
  });
  await localInputCore.ready();
  const inputCoreKeyHex = b4a.toString(localInputCore.key, "hex");

  state.pendingDeviceKeyHex = deviceKeyHex;
  state.pendingInputCoreKeyHex = inputCoreKeyHex;

  const msg = JSON.stringify({
    type: "REQ_COPY",
    deviceKeyHex,
    inputCoreKeyHex,
  }) + "\n";

  state.activeConnection.write(b4a.from(msg, "utf-8"));
  return { success: true };
};
