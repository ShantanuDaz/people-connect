import { createAccount } from './createAccount.js';
import fs from 'bare-fs/promises';
import path from 'bare-path';

export const handleAccountMessage = async (subAction, payload, store, storageDir, activeAccountManager) => {
  if (subAction === 'create') {
    const { seedHex, profileData } = payload;
    
    if (!seedHex || !profileData) {
      throw new Error("Missing seedHex or profileData for account:create");
    }

    const accountManager = await createAccount(store, storageDir, seedHex, profileData);
    
    return {
      result: { success: true },
      accountManager
    };
  }

  if (subAction === 'update') {
    if (!activeAccountManager) throw new Error("Account not active. Please log in first.");
    await activeAccountManager.updateProfile(payload);
    return { result: { success: true } };
  }

  if (subAction === 'delete') {
    if (!activeAccountManager) throw new Error("Account not active. Please log in first.");
    
    // 1. Write the tombstone block
    await activeAccountManager.deleteAccount();
    
    // 2. Shut down the core connections
    await activeAccountManager.close();
    
    // 3. Delete the local config so the user logs out on the device
    try {
      const configPath = path.join(storageDir, 'worker-config.json');
      await fs.unlink(configPath);
    } catch (err) {
      // Ignore if file doesn't exist
    }

    return { 
      result: { success: true },
      clearManager: true // Tells main.js to nullify the active manager
    };
  }

  throw new Error(`Unknown account subAction: ${subAction}`);
};
