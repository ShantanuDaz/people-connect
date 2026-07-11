import PearRuntime from "pear-runtime";
import { app } from "electron";
import path from "path";

// 1. Initialize Pear with a proper storage directory for your app!
const pear = new PearRuntime({
  dir: path.join(app.getPath("userData"), "people-connect-data"),
  name: "people-connect",
  updates: false, // Turn off OTA updates for local dev
  upgrade: "pear://qxenz5wmspmryjc13m9yzsqj1conqotn8fb4ocbufwtz9mtbqq5o" // Dummy link required by pear-runtime
});

// 2. Boot the Pear worker!
export const worker = pear.run("./worker/main.js", [pear.storage]);

let messageIdCounter = 1;
const pendingRequests = new Map();

worker.on("data", (data) => {
  const message = JSON.parse(data.toString());

  if (message.type === "worker-ready") {
    console.log("🚀 Pear worker booted successfully!");
    return;
  }

  const { id, result, error } = message;
  const pending = pendingRequests.get(id);
  if (pending) {
    if (error) pending.reject(new Error(error));
    else pending.resolve(result);
    pendingRequests.delete(id);
  }
});

export const sendToWorker = (action, payload) => {
  return new Promise((resolve, reject) => {
    const id = messageIdCounter++;
    pendingRequests.set(id, { resolve, reject });
    worker.write(Buffer.from(JSON.stringify({ id, action, payload })));
  });
};
