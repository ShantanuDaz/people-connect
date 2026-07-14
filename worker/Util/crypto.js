import hypercoreCrypto from "hypercore-crypto";
import b4a from "b4a";

/**
 * Derives the root Master Keypair from a 32-byte raw seed.
 */
export const generateKeysFromSeed = (seedHex) => {
  // 1. Convert the hex string from React back into a buffer
  const hyperCoreSeed = b4a.from(seedHex, "hex");

  // 2. Generate the cryptographic keypair using the seed (using first 32 bytes if needed)
  const keyPair = hypercoreCrypto.keyPair(hyperCoreSeed.slice(0, 32));

  // 3. Convert the raw buffer public key into a readable hex string
  const publicKeyHex = b4a.toString(keyPair.publicKey, "hex");

  return { keyPair, publicKeyHex };
};

/**
 * Generates a completely randomized, unique device identity keypair.
 */
export const generateDeviceKeyPair = () => {
  const keyPair = hypercoreCrypto.keyPair();
  const publicKeyHex = b4a.toString(keyPair.publicKey, "hex");
  return { keyPair, publicKeyHex };
};
