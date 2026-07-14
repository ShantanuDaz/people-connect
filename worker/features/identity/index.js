import { createNewAccount } from "./account.js";
import { SystemIdentityManager } from "./SystemIdentityManager.js";
import { saveIdentityConfig, getIdentityConfig, clearIdentityConfig } from "../../Util/config.js";

const handleIdentityMessage = async (subAction, payload, store, currentManager) => {
  if (subAction === "getStatus") {
    const config = await getIdentityConfig();
    const debug = {
      hasManager: !!currentManager,
      isLoggedOut: currentManager ? currentManager.isLoggedOut : null,
      hasConfig: !!config
    };
    
    if (currentManager && !currentManager.isLoggedOut && config) {
      return { result: { success: true, isLoggedOut: false, config, debug } };
    }
    
    return { result: { success: false, isLoggedOut: true, debug } };
  } else if (subAction === "createAccount") {
    const result = await createNewAccount(store, payload.mnemonicSeedHex, payload.displayName);
    
    // Persist securely to local hard drive (not swarmed)
    await saveIdentityConfig(payload.mnemonicSeedHex, result.accountId, result.deviceKey, result.inputCoreKeyHex);
    
    return { result };
  } else if (subAction === "startRuntime") {
    const newManager = new SystemIdentityManager(store, payload.bootstrapKeyHex, payload.deviceKeyHex);
    await newManager.startRuntimeEngine();
    return { result: { success: true, isLoggedOut: newManager.isLoggedOut }, identityManager: newManager };
  } else if (subAction === "processRecovery") {
    // Auto-generate new physical device keys for this recovering device
    const { generateKeysFromSeed, generateDeviceKeyPair } = await import("../../Util/crypto.js");
    const { keyPair: masterKeyPair, publicKeyHex: accountId } = generateKeysFromSeed(payload.mnemonicSeedHex);
    const { keyPair: deviceKeyPair, publicKeyHex: deviceKeyHex } = generateDeviceKeyPair();
    
    // Create the input core for this new device
    const localInputCore = store.get({ name: 'local-input-log', keyPair: deviceKeyPair, valueEncoding: 'json' });
    await localInputCore.ready();
    const inputCoreKeyHex = (await import('b4a')).default.toString(localInputCore.key, 'hex');

    // Spin up a new SystemIdentityManager if one isn't active
    let manager = currentManager;
    if (!manager) {
      manager = new SystemIdentityManager(store, accountId, deviceKeyHex);
      await manager.startRuntimeEngine();
    }

    const result = await manager.processMasterRecovery(masterKeyPair, deviceKeyHex, inputCoreKeyHex);
    
    // Save new recovered keys locally
    await saveIdentityConfig(payload.mnemonicSeedHex, accountId, deviceKeyHex, inputCoreKeyHex);
    
    return { result: { success: true, accountId }, identityManager: manager };
  } else if (subAction === "clearConfig") {
    await clearIdentityConfig();
    if (currentManager) {
      if (currentManager.engine) {
        try {
          await currentManager.engine.close();
        } catch (e) {
          console.error("Error closing Autobase engine:", e);
        }
      }
      currentManager.isLoggedOut = true;
    }
    return { result: true, identityManager: null };
  }
  
  throw new Error(`Unknown identity action: ${subAction}`);
};

export default handleIdentityMessage;
