import { app, BrowserWindow, ipcMain } from "electron";
import createMainWindow from "./window.js";

app.whenReady().then(() => {
  // Listen for the 'ping' message from our React frontend!
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
