import readLine from "readline/promises";
import InitializeApp from "./features/initializeApp/initializeApp.js";
import { P2PEngine } from "./features/p2p-engine/index.js";
import { startChatLoop } from "./utils/chatLoop.js";

console.log("=== Simplified P2P Hyperswarm Chat ===");
const rl = readLine.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const profile = await InitializeApp(rl);
if (!profile) {
  console.log("Failed to load profile. Exiting.");
  rl.close();
  process.exit(0);
}

const roomTopic =
  (await rl.question("Enter room topic (e.g., 'global-room'): ")) ||
  "global-room";

const engine = new P2PEngine(profile.name);

const roomManager = await engine.joinRoom(roomTopic, {
  onPeerConnect: (peerIdHex) => {
    console.log(`\n[System] Connected to peer: ${peerIdHex}`);
    process.stdout.write("> ");
  },
  onMessage: (payload) => {
    console.log(`\n[${payload.sender}]: ${payload.text}`);
    process.stdout.write("> ");
  },
  onError: (err) => {
    console.error("\n[Error] Room error:", err.message);
    process.stdout.write("> ");
  },
});

await startChatLoop(rl, profile, roomManager);

console.log("Leaving room and stopping Hyperswarm node...");
await engine.close();
rl.close();
process.exit(0);
