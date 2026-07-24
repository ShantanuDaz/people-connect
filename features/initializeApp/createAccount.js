import * as bip39 from "bip39";
import { HDKey } from "ed25519-keygen/hdkey";
import fs from "fs/promises";

export function createAccount() {
  const mnemonic = bip39.generateMnemonic(256); // 24 words
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const hdKey = HDKey.fromMasterSeed(seed);
  const keypair = hdKey.derive(`m/44'/501'/0'/0'`);
  return {
    mnemonic,
    publicKey: Buffer.from(keypair.publicKey).toString("hex"),
    privateKey: Buffer.from(keypair.privateKey).toString("hex"),
  };
}

export async function saveLocalProfile(name, mnemonic, pubKey) {
  const dir = `./profiles/${name}`;
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    `${dir}/profile.json`,
    JSON.stringify({ name, mnemonic, pubKey }, null, 2)
  );
}

export async function getLocalProfile(name) {
  try {
    const path = name ? `./profiles/${name}/profile.json` : "./profiles/profile.json";
    const data = await fs.readFile(path, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    // Return null if the profile doesn't exist yet
    if (error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}
