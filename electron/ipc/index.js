import { registerProfileHandlers } from "./profile.js";
import { registerNetworkHandlers } from "./network.js";

export const registerAllHandlers = (ipcMain, sendToWorker) => {
  registerProfileHandlers(ipcMain, sendToWorker);
  registerNetworkHandlers(ipcMain, sendToWorker);
};
