import { initDB } from './utils/db.js';
import { getLocalConfig } from './utils/config.js';
import { handleAccountMessage } from './features/account/index.js';
import { AccountManager } from './features/account/AccountManager.js';
import { StreamBuffer } from '../shared/StreamBuffer.js';

// Global State
let store;
let activeAccountManager = null;
let storageDir = "./corestore"; // In production, this should be passed from Electron via boot payload

const startWorker = async () => {
  try {
    // Boot DB
    store = await initDB(storageDir);

    // Auto-boot if config exists
    const localConfig = await getLocalConfig(storageDir);
    if (localConfig && localConfig.authLedgerPublicKeyHex && localConfig.devicePublicKeyHex) {
      activeAccountManager = new AccountManager(
        store, 
        localConfig.authLedgerPublicKeyHex, 
        localConfig.devicePublicKeyHex
      );
      await activeAccountManager.start();
    }

    // Set up IPC Stream Listener
    const stream = new StreamBuffer(async (message) => {
      const { id, action, payload } = message;
      const [feature, subAction] = action.split(":");

      try {
        let result;
        
        if (feature === "account") {
          const response = await handleAccountMessage(subAction, payload, store, storageDir, activeAccountManager);
          if (response && response.accountManager) {
            activeAccountManager = response.accountManager;
          }
          if (response && response.clearManager) {
            activeAccountManager = null;
          }
          result = response ? response.result : null;
        } else {
          throw new Error(`Unknown feature: ${feature}`);
        }

        // We assume Bare IPC is available if running via Holepunch stack.
        // If not using Bare, replace with process.send or standard streams.
        Bare.IPC.write(StreamBuffer.serialize({ id, result }));
      } catch (error) {
        Bare.IPC.write(StreamBuffer.serialize({ id, error: error.message }));
      }
    });

    Bare.IPC.on("data", (data) => stream.processData(data));
    
    Bare.IPC.on("close", async () => {
      console.log("IPC closed, shutting down worker...");
      if (activeAccountManager) await activeAccountManager.close();
      if (store) await store.close();
      Bare.exit(0);
    });

    // Notify Main process that we are ready
    Bare.IPC.write(StreamBuffer.serialize({ type: "worker-ready" }));

  } catch (err) {
    console.error("Worker failed to start:", err);
    try {
      Bare.IPC.write(StreamBuffer.serialize({ type: "worker-error", error: err.message }));
    } catch (_) {}
  }
};

startWorker();
