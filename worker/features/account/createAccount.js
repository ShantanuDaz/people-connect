import Autobase from "autobase";
import b4a from "b4a";
import { generateMasterKeyPair } from "../../utils/crypto.js";
import { saveLocalConfig } from "../../utils/config.js";
import { AccountManager } from "./AccountManager.js";

/**
 * Executes the secure "Primary User Account Creation" choreography.
 *
 * @param {Corestore} store - The active Corestore instance.
 * @param {string} storageDir - The path to save the worker-config.json.
 * @param {string} seedHex - The 32-byte master seed.
 * @param {Object} profileData - The user's profile info.
 * @returns {Promise<AccountManager>} The live session manager.
 */
export const createAccount = async (
  store,
  storageDir,
  seedHex,
  profileData,
) => {
  console.log("1. Derive Master Key");
  const masterKeyPair = generateMasterKeyPair(seedHex);
  const authLedgerPublicKeyHex = b4a.toString(masterKeyPair.publicKey, "hex");

  const apply = async (nodes, view, host) => {
    for (const node of nodes) {
      if (node.value.type === "OP_ADD_WRITER") {
        await host.addWriter(b4a.from(node.value.deviceKey, "hex"), {
          indexer: true,
        });
      }
    }
  };

  console.log("2. Get device local key directly from corestore");
  const deviceLocalCore = store.get({ name: "local" });
  await deviceLocalCore.ready();
  const devicePublicKeyHex = b4a.toString(deviceLocalCore.key, "hex");

  console.log("3. Initialize master autobase with temp store");
  const tempStore = store.session();
  const masterBase = new Autobase(tempStore, null, {
    apply,
    keyPair: masterKeyPair,
    valueEncoding: "json",
  });
  await masterBase.ready();

  console.log("4. Append genesis and device auth");
  await masterBase.append({
    type: "OP_INIT_ACCOUNT",
    profile: profileData,
    timestamp: Date.now(),
  });

  await masterBase.append({
    type: "OP_ADD_WRITER",
    deviceKey: devicePublicKeyHex,
    timestamp: Date.now(),
  });

  console.log("5. Close master autobase");
  await masterBase.close();

  console.log("6. Wipe memory and save config");
  b4a.fill(masterKeyPair.secretKey, 0);

  await saveLocalConfig(storageDir, {
    authLedgerPublicKeyHex,
    devicePublicKeyHex,
  });

  console.log("7. Start AccountManager");
  const accountManager = new AccountManager(
    store,
    authLedgerPublicKeyHex,
    devicePublicKeyHex,
  );
  await accountManager.start();

  console.log("8. createAccount complete");
  return accountManager;
};
