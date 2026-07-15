import hypercoreCrypto from "hypercore-crypto";
import b4a from "b4a";

/**
 * Derives the root Master Keypair from a 32-byte raw seed.
 */
export const generateMasterKeyPair = (seedHex) => {
  const hyperCoreSeed = b4a.from(seedHex, "hex");
  const keyPair = hypercoreCrypto.keyPair(hyperCoreSeed.slice(0, 32));
  return keyPair;
};

/**
 * Generates a completely randomized, unique device identity keypair.
 */
export const generateDeviceKeyPair = () => {
  const keyPair = hypercoreCrypto.keyPair();
  return keyPair;
};
