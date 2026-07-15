import { handleAccountGet } from './getAccount.js';
import { handleAccountCreate } from './createAccount.js';
import { handleAccountUpdate } from './updateAccount.js';
import { handleAccountDelete } from './deleteAccount.js';

export const registerAccountHandlers = (ipcMain, sendToWorker) => {
  handleAccountGet(ipcMain, sendToWorker);
  handleAccountCreate(ipcMain, sendToWorker);
  handleAccountUpdate(ipcMain, sendToWorker);
  handleAccountDelete(ipcMain, sendToWorker);
};
