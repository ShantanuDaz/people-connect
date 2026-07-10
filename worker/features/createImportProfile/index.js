import * as bip39 from "bip39";
import hypercoreCrypto from "hypercore-crypto";
import b4a from "b4a";

const createImportProfile = async (rl) => {
  const answer = await rl.question(
    "Do you want to (1) Create a new identity or (2) Import an existing phrase? [1/2]: ",
  );

  let mnemonic; // Declare it here so we can use it later

  if (answer === "1") {
    mnemonic = bip39.generateMnemonic(256);
    console.log("\n=== YOUR 24-WORD PHRASE ===");
    console.log("SAVE THIS. IT IS THE ONLY WAY TO RECOVER YOUR ACCOUNT:");
    console.log(`\n${mnemonic}\n`);
  } else if (answer === "2") {
    mnemonic = await rl.question("Enter your 24-word phrase: ");

    if (!bip39.validateMnemonic(mnemonic)) {
      console.log("Invalid seed phrase! Please try again.");
      process.exit(1);
    }
  } else {
    console.log("Invalid choice");
    process.exit(1);
  }

  // GENERATE THE KEYPAIR ---

  // 1. Convert the 24 words into a 32-byte seed for Hypercore
  const fullSeed = bip39.mnemonicToSeedSync(mnemonic);
  const hyperCoreSeed = fullSeed.subarray(0, 32);

  // 2. Generate the cryptographic keypair using the seed
  const keyPair = hypercoreCrypto.keyPair(hyperCoreSeed);

  // 3. Convert the raw buffer public key into a readable hex string
  const publicKeyHex = b4a.toString(keyPair.publicKey, "hex");
  console.log(`\nYour Public ID is: ${publicKeyHex}\n`);
  console.log(`And your keyPair ${keyPair}`);

  // Return these so we can use them in the main function later
  return { keyPair, publicKeyHex, mnemonic };
};

export default createImportProfile;
