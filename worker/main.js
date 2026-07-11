import readline from "readline/promises";
import { getProfile } from "./features/profile/getProfile.js";
import initDB from "./Util/db.js";
import { initNetwork } from "./features/network/setupNetwork.js";
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const main = async () => {
  console.log("=== Welcome to the P2P Node ===");

  console.log("Initializing the Database...");

  const db = await initDB();

  // 1. Create a sub-database just for profile data
  const profileDB = db.sub("profile", { valueEncoding: "utf-8" });
  // 2. Get or create the profile
  const profile = await getProfile(rl, profileDB);

  console.log("---------------------------\n");
  // 3. Initialize the P2P Network using our identity!
  console.log("Booting up the P2P Network...");
  const swarm = await initNetwork(profile.keyPair);

  rl.close();
};

main();
