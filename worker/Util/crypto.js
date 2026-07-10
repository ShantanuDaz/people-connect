import * as bip39 from "bip39";
import hypercoreCrypto from "hypercore-crypto";
import b4a from "b4a";

export const generateKeysFromMnemonic = (mnemonic) => {
  // 1. Convert the 24 words into a 32-byte seed for Hypercore
  const fullSeed = bip39.mnemonicToSeedSync(mnemonic);
  const hyperCoreSeed = fullSeed.subarray(0, 32);

  // 2. Generate the cryptographic keypair using the seed
  const keyPair = hypercoreCrypto.keyPair(hyperCoreSeed);

  // 3. Convert the raw buffer public key into a readable hex string
  const publicKeyHex = b4a.toString(keyPair.publicKey, "hex");

  return { keyPair, publicKeyHex };
};
