import { generateKeysFromMnemonic } from "../../Util/crypto.js";
import { createProfile } from "./createProfile.js";
import { importProfile } from "./importProfile.js";

export const getProfile = async (rl, profileDB) => {
  // 1. Check if we already have a saved mnemonic
  const existingMnemonic = await profileDB.get("mnemonic");
  const existingName = await profileDB.get("name");

  if (existingMnemonic) {
    console.log("Welcome back! Found existing profile in database.");
    if (existingName) {
      console.log(`Hello, ${existingName.value}!`);
    }

    // Regenerate the keys from the saved phrase
    const { keyPair, publicKeyHex } = generateKeysFromMnemonic(existingMnemonic.value);
    console.log(`Your Public ID is: ${publicKeyHex}`);
    
    return { keyPair, publicKeyHex, mnemonic: existingMnemonic.value, name: existingName?.value };
  }

  // 2. If it doesn't exist, we run the prompt
  console.log("No profile found. Let's set one up!");
  const answer = await rl.question(
    "Do you want to (1) Create a new identity or (2) Import an existing phrase? [1/2]: "
  );

  let mnemonic, name;

  if (answer === "1") {
    ({ mnemonic, name } = await createProfile(rl));
  } else if (answer === "2") {
    ({ mnemonic } = await importProfile(rl));
  } else {
    console.log("Invalid choice");
    process.exit(1);
  }

  // GENERATE THE KEYPAIR
  const { keyPair, publicKeyHex } = generateKeysFromMnemonic(mnemonic);
  console.log(`\nYour Public ID is: ${publicKeyHex}\n`);

  // Save the newly created/imported data to the sub-database
  await profileDB.put("mnemonic", mnemonic);
  if (name) {
    await profileDB.put("name", name);
  }
  
  console.log("Profile saved to local database securely.");

  return { keyPair, publicKeyHex, mnemonic, name };
};
