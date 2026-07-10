import readline from "readline/promises";
import createImportProfile from "./features/createImportProfile/index.js";
import initDB from "./Util/db.js";
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

  // 2. Check if we already have a saved mnemonic
  const existingMnemonic = await profileDB.get("mnemonic");

  if (existingMnemonic) {
    // If it exists, Hyperbee returns an object like { seq, key, value }
    console.log("Welcome back! Found existing profile in database.");
    // (We will regenerate the keys from existingMnemonic.value in the next step)
  } else {
    // If it doesn't exist, we run the prompt
    console.log("No profile found. Let's set one up!");
    const { keyPair, publicKeyHex, mnemonic } = await createImportProfile(rl);

    // Save the newly created/imported mnemonic to the sub-database!
    await profileDB.put("mnemonic", mnemonic);
    console.log("Profile saved to local database securely.");
  }

  rl.close();
};

main();
