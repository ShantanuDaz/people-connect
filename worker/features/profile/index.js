import { generateKeysFromSeed } from "../../Util/crypto.js";

const getProfile = async (profileDB) => {
  const existingSeedHex = await profileDB.get("seedHex");
  const existingName = await profileDB.get("name");
  let existingMnemonic = null;
  
  try {
    existingMnemonic = await profileDB.get("mnemonic");
  } catch (err) {
    // Ignore if mnemonic is not found (for backwards compatibility)
  }

  if (existingSeedHex && existingName) {
    const { keyPair, publicKeyHex } = generateKeysFromSeed(existingSeedHex);
    return { keyPair, publicKeyHex, name: existingName, seedHex: existingSeedHex, mnemonic: existingMnemonic };
  }

  return null;
};

const saveProfile = async (profileDB, seedHex, name, mnemonic) => {
  const { keyPair, publicKeyHex } = generateKeysFromSeed(seedHex);

  await profileDB.put("seedHex", seedHex);
  await profileDB.put("name", name);
  
  if (mnemonic) {
    await profileDB.put("mnemonic", mnemonic);
  }

  return { keyPair, publicKeyHex, name, seedHex, mnemonic };
};

const clearProfile = async (profileDB) => {
  await profileDB.del("seedHex");
  await profileDB.del("name");
  try {
    await profileDB.del("mnemonic");
  } catch (err) {}
  return true;
};

const handleProfileMessage = async (subAction, payload, profileDB) => {
  if (subAction === "getProfile") {
    return await getProfile(profileDB);
  } else if (subAction === "saveProfile") {
    return await saveProfile(profileDB, payload.seedHex, payload.name, payload.mnemonic);
  } else if (subAction === "clearProfile") {
    return await clearProfile(profileDB);
  }

  throw new Error(`Unknown profile action: ${subAction}`);
};

export default handleProfileMessage;
