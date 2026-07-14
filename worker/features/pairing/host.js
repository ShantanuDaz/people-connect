import crypto from "hypercore-crypto";
import b4a from "b4a";
import { initNetwork } from "../network/setupNetwork.js";
import { state, cleanupSession } from "./state.js";
import { sendEvent } from "./events.js";

export const startHost = async (payload, identityManager, opId) => {
  if (!identityManager || !identityManager.engine) {
    throw new Error("Identity manager must be running to host pairing.");
  }

  await cleanupSession();
  if (opId !== state.currentOpId) return { success: false, error: "Aborted" };

  state.activeBootstrapKeyHex = payload.bootstrapKeyHex;
  
  // Generate Room Code: PC-XXXXXX
  const randomBytes = crypto.randomBytes(3);
  const code = b4a.toString(randomBytes, "hex").toUpperCase();
  const roomCode = `PC-${code}`;

  // Hash room code for topic
  const topic = crypto.discoveryKey(crypto.hash(b4a.from(roomCode, "utf-8")));

  const swarm = await initNetwork();
  if (opId !== state.currentOpId) {
    await swarm.destroy();
    return { success: false, error: "Aborted" };
  }
  
  state.activeSwarm = swarm;

  swarm.on("connection", (connection) => {
    console.log("Host: Client connected");
    state.activeConnection = connection;
    sendEvent({ status: "client_connected" });

    connection.on("data", async (rawPayload) => {
      try {
        const messageString = b4a.toString(rawPayload, "utf-8");
        // line buffered JSON
        const messages = messageString.split("\n").filter(m => m.trim());
        for (const msg of messages) {
          const data = JSON.parse(msg);
          if (data.type === "REQ_COPY") {
            state.pendingDeviceKeyHex = data.deviceKeyHex;
            state.pendingInputCoreKeyHex = data.inputCoreKeyHex;
            sendEvent({ 
              status: "request_received", 
              deviceKeyHex: data.deviceKeyHex, 
              inputCoreKeyHex: data.inputCoreKeyHex 
            });
          }
        }
      } catch (err) {
        console.error("Host parsing error", err);
      }
    });

    connection.on("error", (err) => {
      console.error("Host connection error:", err);
    });
    
    connection.on("close", () => {
      console.log("Host connection closed");
      if (state.activeConnection === connection) {
        state.activeConnection = null;
      }
    });
  });
  
  const discovery = swarm.join(topic, { server: true, client: false });
  await discovery.flushed();

  if (opId !== state.currentOpId) return { success: false, error: "Aborted" };

  return { success: true, roomCode };
};

export const approveRequest = async (payload, identityManager) => {
  if (!identityManager || !identityManager.engine) {
    throw new Error("Identity manager must be running to approve.");
  }
  if (!state.activeConnection) {
    throw new Error("No active connection to client.");
  }

  const { deviceKeyHex, inputCoreKeyHex } = payload;

  await identityManager.engine.append({
    type: "OP_ADD_WRITER",
    epoch: 1,
    deviceKey: deviceKeyHex,
    inputCoreKey: inputCoreKeyHex,
    timestamp: Date.now(),
  });

  const msg = JSON.stringify({
    type: "RES_COPY_APPROVED",
    bootstrapKeyHex: b4a.toString(identityManager.bootstrapKey, 'hex'),
  }) + "\n";

  state.activeConnection.write(b4a.from(msg, "utf-8"));
  
  // Wait a moment for replication/write to flush
  setTimeout(async () => {
    await cleanupSession();
  }, 1000);

  return { success: true };
};
