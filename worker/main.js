import initDB from "./Util/db.js";
import { initNetwork } from "./features/network/setupNetwork.js";
import handleProfileMessage from "./features/profile/index.js";
import { StreamBuffer } from "../shared/StreamBuffer.js";

let db, profileDB, swarm;

const startWorker = async () => {
  // 1. Boot the database immediately when the worker starts
  db = await initDB();
  profileDB = db.sub("profile", { valueEncoding: "utf-8" });

  const stream = new StreamBuffer(async (message) => {
    const { id, action, payload } = message;
    const [feature, subAction] = action.split(":");

    try {
      let result;
      if (feature === "profile") {
        result = await handleProfileMessage(subAction, payload, profileDB);
      } else if (feature === "network") {
        if (subAction === "joinSwarm") {
          swarm = await initNetwork(payload);
          result = true;
        }
      } else {
        throw new Error(`Unknown feature: ${feature}`);
      }

      Bare.IPC.write(StreamBuffer.serialize({ id, result }));
    } catch (error) {
      Bare.IPC.write(StreamBuffer.serialize({ id, error: error.message }));
    }
  });

  Bare.IPC.on("data", (data) => stream.processData(data));

  Bare.IPC.on("close", async () => {
    console.log("IPC closed, safely closing database...");
    if (db && db.core) {
      await db.core.close();
    }
    Bare.exit(0);
  });

  // Let Electron know the worker is booted and ready
  Bare.IPC.write(StreamBuffer.serialize({ type: "worker-ready" }));
};

startWorker();
