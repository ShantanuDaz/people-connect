import hypercoreCrypto from "hypercore-crypto";
import b4a from "b4a";

export const generateKeysFromSeed = (seedHex) => {
  // 1. Convert the hex string from React back into a buffer
  const hyperCoreSeed = b4a.from(seedHex, "hex");

  // 2. Generate the cryptographic keypair using the seed
  const keyPair = hypercoreCrypto.keyPair(hyperCoreSeed);

  // 3. Convert the raw buffer public key into a readable hex string
  const publicKeyHex = b4a.toString(keyPair.publicKey, "hex");

  return { keyPair, publicKeyHex };
};
