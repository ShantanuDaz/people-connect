import * as bip39 from "bip39";

export const createProfile = async (rl) => {
  const name = await rl.question("Please enter your name: ");
  const mnemonic = bip39.generateMnemonic(256);
  
  console.log("\n=== YOUR 24-WORD PHRASE ===");
  console.log("SAVE THIS. IT IS THE ONLY WAY TO RECOVER YOUR ACCOUNT:");
  console.log(`\n${mnemonic}\n`);
  
  return { mnemonic, name };
};
