import { DatabaseManager } from "./DatabaseManager.mjs";
import { NetworkManager } from "./NetworkManager.mjs";
import { IpcHandler } from "./IpcHandler.mjs";
import tcp from "bare-tcp";

const seedHex = Bare.argv[2];
const name = Bare.argv[3];
const storagePath = Bare.argv[4];

async function main() {
  const dbManager = new DatabaseManager(storagePath);
  const ipcHandler = new IpcHandler(name);
  const networkManager = new NetworkManager(seedHex, dbManager, ipcHandler);

  // Wire them up
  await dbManager.initSystemDb();
  ipcHandler.setDependencies(networkManager, dbManager);
  
  dbManager.onDbChange = (event) => {
    ipcHandler.sendDbState(event);
  };
  
  await networkManager.init();
  
  ipcHandler.startListening();

  // Expose TCP socket for visualizer
  const visualizerServer = tcp.createServer((socket) => {
    socket.on('data', async (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.action === 'getDbData') {
          const records = [];
          for await (const { key, value } of dbManager.systemDb.createReadStream()) {
            records.push({ key, value });
          }
          socket.write(JSON.stringify(records));
          socket.end();
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
    });
  });
  
  visualizerServer.listen(3001, () => {
    console.log("Worker Visualizer IPC listening on port 3001");
  });
}

main().catch(err => {
  console.error("Worker fatal error:", err);
});
