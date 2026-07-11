import * as bip39 from "bip39";

export const importProfile = async (rl) => {
  const mnemonic = await rl.question("Enter your 24-word phrase: ");

  if (!bip39.validateMnemonic(mnemonic)) {
    console.log("Invalid seed phrase! Please try again.");
    process.exit(1);
  }

  // We don't have the name yet. We could ask for it, or wait to fetch from swarm.
  // For now, we just return the mnemonic.
  return { mnemonic };
};
