import PearRuntime from "pear-runtime";
import { app, BrowserWindow } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamically load config from package.json!
const require = createRequire(import.meta.url);
const pkg = require("../../package.json");

// 1. Initialize Pear with a proper storage directory for your app!
const pear = new PearRuntime({
  dir: path.join(app.getPath("userData"), "people-connect-data"),
  name: pkg.name,
  version: pkg.version,
  upgrade: pkg.upgrade,
  updates: false, // Turn off OTA updates for local dev
});

// 2. Boot the Pear worker using __dirname so it doesn't break in production!
const workerPath = path.join(__dirname, "..", "..", "worker", "main.js");
export const worker = pear.run(workerPath, [pear.storage]);

let messageIdCounter = 1;
const pendingRequests = new Map();

import { StreamBuffer } from "../../shared/StreamBuffer.js";

let workerReady = false;

// Health check heartbeat for worker
const heartbeatTimeout = setTimeout(() => {
  if (!workerReady) {
    console.error("❌ Pear worker failed to emit 'worker-ready' within 3 seconds. Killing worker...");
    worker.kill();
    // In a real app we might want to alert the UI explicitly here
  }
}, 3000);

const stream = new StreamBuffer((message) => {
  if (message.type === "worker-ready") {
    workerReady = true;
    clearTimeout(heartbeatTimeout);
    console.log("🚀 Pear worker booted successfully!");
    return;
  }
  
  if (message.id !== undefined) {
    const pending = pendingRequests.get(message.id);
    if (pending) {
      clearTimeout(pending.timeoutId);
      if (message.error) pending.reject(new Error(message.error));
      else pending.resolve(message.result);
      pendingRequests.delete(message.id);
    }
  } else {
    // If there is no ID, it's a spontaneous Push Event! 
    const windows = BrowserWindow.getAllWindows();
    windows.forEach((w) => {
      if (!w.isDestroyed()) {
        w.webContents.send("worker:event", message);
      }
    });
  }
});

worker.on("data", (data) => stream.processData(data));

// Global Reject on Exit
worker.on("exit", (code) => {
  console.error(`Pear worker exited with code ${code}`);
  for (const [id, pending] of pendingRequests.entries()) {
    clearTimeout(pending.timeoutId);
    pending.reject(new Error("Worker crashed or exited unexpectedly."));
  }
  pendingRequests.clear();
});

worker.on("error", (error) => {
  console.error("Pear worker encountered an error:", error);
});

export const sendToWorker = (action, payload) => {
  return new Promise((resolve, reject) => {
    const id = messageIdCounter++;
    
    // Setup a 2 minute timeout for this request (some P2P operations take time)
    const timeoutId = setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        reject(new Error(`Worker request timeout for action: ${action}`));
      }
    }, 120000);

    pendingRequests.set(id, { resolve, reject, timeoutId });
    
    // NEW: Use Length-Prefixed Framing and Serializer
    const messageBuffer = StreamBuffer.serialize({ id, action, payload });
    worker.write(messageBuffer);
  });
};
