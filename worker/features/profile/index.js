import { generateKeysFromSeed } from "../../Util/crypto.js";

const getProfile = async (profileDB) => {
  const existingSeedHex = await profileDB.get("seedHex");
  const existingName = await profileDB.get("name");

  if (existingSeedHex && existingName) {
    const { keyPair, publicKeyHex } = generateKeysFromSeed(existingSeedHex);
    return { keyPair, publicKeyHex, name: existingName };
  }

  return null;
};

const saveProfile = async (profileDB, seedHex, name) => {
  const { keyPair, publicKeyHex } = generateKeysFromSeed(seedHex);

  await profileDB.put("seedHex", seedHex);
  await profileDB.put("name", name);

  return { keyPair, publicKeyHex, name };
};

const handleProfileMessage = async (subAction, payload, profileDB) => {
  if (subAction === "getProfile") {
    return await getProfile(profileDB);
  } else if (subAction === "saveProfile") {
    return await saveProfile(profileDB, payload.seedHex, payload.name);
  }

  throw new Error(`Unknown profile action: ${subAction}`);
};

export default handleProfileMessage;
