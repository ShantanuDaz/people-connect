import { app, BrowserWindow, ipcMain } from "electron";
import createMainWindow from "./util/window.js";
import { sendToWorker } from "./util/workerClient.js";
import { registerProfileHandlers } from "./ipc/profile.js";
import { registerNetworkHandlers } from "./ipc/network.js";

app.whenReady().then(() => {
  // Register all feature handlers!
  registerProfileHandlers(ipcMain, sendToWorker);
  registerNetworkHandlers(ipcMain, sendToWorker);

  // Ping test
  ipcMain.handle("ping", () => {
    console.log("Backend received a ping from React!");
    return "Pong from the Holepunch Backend!";
  });

  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
