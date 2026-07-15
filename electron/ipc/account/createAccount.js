import * as bip39 from 'bip39';
import { safeStorage, app } from 'electron';
import fs from 'fs/promises';
import path from 'path';

export const handleAccountCreate = async (ipcMain, sendToWorker) => {
  ipcMain.handle("api:account-create", async (_, payload) => {
    try {
      const { mnemonic, ...profileData } = payload;
      
      if (!mnemonic) {
        return { success: false, error: "Mnemonic is required" };
      }

      // Generate the 64-byte seed and take the first 32 bytes for ed25519 (Hypercore)
      const fullSeed = bip39.mnemonicToSeedSync(mnemonic);
      const masterSeed = fullSeed.subarray(0, 32);
      const seedHex = masterSeed.toString('hex');
      let encryptedSeed;

      // Check if OS-level encryption is available
      if (safeStorage.isEncryptionAvailable()) {
        encryptedSeed = safeStorage.encryptString(seedHex);
      } else {
        // Fallback for systems without a keyring (e.g. some Linux setups)
        encryptedSeed = Buffer.from(seedHex, 'utf8');
      }

      // Pass the seed and data to the worker to initialize the P2P ledger
      await sendToWorker("account:create", { 
        seedHex, 
        profileData 
      });

      // ONLY Save it into the app's userData folder securely AFTER the worker succeeds
      const keyPath = path.join(app.getPath("userData"), "master_key.dat");
      await fs.writeFile(keyPath, encryptedSeed);

      // Save basic non-secret profile info locally so the UI can boot instantly next time
      const profilePath = path.join(app.getPath("userData"), "profile.json");
      await fs.writeFile(profilePath, JSON.stringify(profileData, null, 2));

      // Read publicKeyHex from worker-config.json
      const configPath = path.join(process.cwd(), "corestore", "worker-config.json");
      const configData = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(configData);
      const publicKeyHex = config.authLedgerPublicKeyHex;

      return { success: true, user: { ...profileData, seedHex, publicKeyHex } };
    } catch (err) {
      console.error("Failed to create account in Main process:", err);
      return { success: false, error: err.message };
    }
  });
};
