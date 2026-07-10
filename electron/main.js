const { app, BrowserWindow } = require("electron");
const path = require("path");

const setupStoreIpc = require("./ipc/store");
const { setupConnectionIpc, cleanupWorker } = require("./ipc/connection");

function createWindow() {
  const win = new BrowserWindow({
    width: 480,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  if (process.env.NODE_ENV === "development") {
    win.loadURL("http://localhost:5173");
  } else {
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

app.whenReady().then(() => {
  // Initialize IPC handlers
  setupStoreIpc(cleanupWorker);
  setupConnectionIpc();

  createWindow();
});

app.on("window-all-closed", () => {
  cleanupWorker();
  app.quit();
});
