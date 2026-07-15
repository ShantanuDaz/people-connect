import { registerProfileHandlers } from "./profile.js";
import { registerNetworkHandlers } from "./network.js";
import { registerAccountHandlers } from "./account.js";
import { registerPairingHandlers } from "./pairing.js";

export const registerAllHandlers = (ipcMain, sendToWorker) => {
  registerProfileHandlers(ipcMain, sendToWorker);
  registerNetworkHandlers(ipcMain, sendToWorker);
  registerAccountHandlers(ipcMain, sendToWorker);
  registerPairingHandlers(ipcMain, sendToWorker);
};
