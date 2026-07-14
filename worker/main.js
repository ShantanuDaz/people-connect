import initDB from "./Util/db.js";
import { initNetwork } from "./features/network/setupNetwork.js";
import handleProfileMessage from "./features/profile/index.js";
import { StreamBuffer } from "../shared/StreamBuffer.js";
import handleIdentityMessage from "./features/identity/index.js";
import handlePairingMessage from "./features/pairing/index.js";
import { initConfigStore, getIdentityConfig } from "./Util/config.js";
import { SystemIdentityManager } from "./features/identity/SystemIdentityManager.js";
import crypto from "hypercore-crypto";
import b4a from "b4a";

let store, identityManager, swarm;

const startWorker = async () => {
  try {
    // Boot the Corestore
    store = await initDB();
    
    // Boot the Local Config DB
    await initConfigStore(store);
    const localConfig = await getIdentityConfig();
    
    // Auto-boot Identity Manager if keys exist locally
    if (localConfig && localConfig.bootstrapKeyHex && localConfig.deviceKeyHex) {
      console.log("Found local config. Auto-starting SystemIdentityManager...");
      identityManager = new SystemIdentityManager(store, localConfig.bootstrapKeyHex, localConfig.deviceKeyHex);
      await identityManager.startRuntimeEngine();
    }

    const stream = new StreamBuffer(async (message) => {
      const { id, action, payload } = message;
      const [feature, subAction] = action.split(":");

      try {
        let result;
        
        if (feature === "identity") {
          const identityResponse = await handleIdentityMessage(subAction, payload, store, identityManager);
          if (Object.prototype.hasOwnProperty.call(identityResponse, "identityManager")) {
            identityManager = identityResponse.identityManager;
          }
          result = identityResponse.result;
        } else if (feature === "pairing") {
          result = await handlePairingMessage(subAction, payload, store, identityManager, swarm);
        } else if (feature === "profile") {
          if (!identityManager || identityManager.isLoggedOut) throw new Error("Identity manager not active or logged out.");
          result = await handleProfileMessage(subAction, payload, identityManager);
        } else if (feature === "network") {
          if (subAction === "joinSwarm") {
            swarm = await initNetwork(store);
            const globalTopic = crypto.discoveryKey(crypto.hash(b4a.from("people-connect-global", "utf-8")));
            const discovery = swarm.join(globalTopic, { client: true, server: true });
            await discovery.flushed();
            result = true;
          }
        } else {
          throw new Error(`Unknown feature: ${feature}`);
        }

        Bare.IPC.write(StreamBuffer.serialize({ id, result }));
      } catch (error) {
        Bare.IPC.write(StreamBuffer.serialize({ id, error: error.message }));
      }
    });

    Bare.IPC.on("data", (data) => stream.processData(data));

    Bare.IPC.on("close", async () => {
      console.log("IPC closed, safely closing database...");
      if (store) {
        await store.close();
      }
      Bare.exit(0);
    });

    // Let Electron know the worker is booted and ready
    Bare.IPC.write(StreamBuffer.serialize({ type: "worker-ready" }));
  } catch (err) {
    console.error("❌ Worker failed to start:", err);
    // Still try to notify Electron so it doesn't hang
    try {
      Bare.IPC.write(StreamBuffer.serialize({ type: "worker-error", error: err.message }));
    } catch (_) { /* IPC may already be dead */ }
  }
};

startWorker();

