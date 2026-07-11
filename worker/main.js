import initDB from "./Util/db.js";
import { initNetwork } from "./features/network/setupNetwork.js";
import handleProfileMessage from "./features/profile/index.js";

let db, profileDB, swarm;

const startWorker = async () => {
  // 1. Boot the database immediately when the worker starts
  db = await initDB();
  profileDB = db.sub("profile", { valueEncoding: "utf-8" });

  // 2. Listen for stringified JSON messages from Electron
  Bare.IPC.on("data", async (data) => {
    const message = JSON.parse(data.toString());

    const { id, action, payload } = message;

    const [feature, subAction] = action.split(":");

    try {
      let result;

      if (feature === "profile") {
        result = await handleProfileMessage(subAction, payload, profileDB);
      } else if (feature === "network") {
        // We can move joinSwarm into a handleNetworkMessage router later!
        if (subAction === "joinSwarm") {
          swarm = await initNetwork(payload);
          result = true;
        }
      } else {
        throw new Error(`Unknown feature: ${feature}`);
      }

      Bare.IPC.write(Buffer.from(JSON.stringify({ id, result })));
    } catch (error) {
      Bare.IPC.write(Buffer.from(JSON.stringify({ id, error: error.message })));
    }
  });

  // Let Electron know the worker is booted and ready
  Bare.IPC.write(Buffer.from(JSON.stringify({ type: "worker-ready" })));
};

startWorker();
