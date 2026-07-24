import * as bip39 from "bip39";
import { HDKey } from "ed25519-keygen/hdkey";

export function generateMnemonic() {
  return bip39.generateMnemonic(256); // 24 words
}

export function deriveKeys(mnemonic) {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const hdKey = HDKey.fromMasterSeed(seed);
  const keypair = hdKey.derive(`m/44'/501'/0'/0'`);
  return {
    publicKey: Buffer.from(keypair.publicKey).toString("hex"),
    privateKey: Buffer.from(keypair.privateKey).toString("hex"),
  };
}

export function createAccount() {
  const mnemonic = generateMnemonic();
  const keys = deriveKeys(mnemonic);
  return {
    mnemonic,
    ...keys,
  };
}
