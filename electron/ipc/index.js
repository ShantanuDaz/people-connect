import { registerProfileHandlers } from "./profile.js";
import { registerNetworkHandlers } from "./network.js";
import { registerIdentityHandlers } from "./identity.js";
import { registerPairingHandlers } from "./pairing.js";

export const registerAllHandlers = (ipcMain, sendToWorker) => {
  registerProfileHandlers(ipcMain, sendToWorker);
  registerNetworkHandlers(ipcMain, sendToWorker);
  registerIdentityHandlers(ipcMain, sendToWorker);
  registerPairingHandlers(ipcMain, sendToWorker);
};
