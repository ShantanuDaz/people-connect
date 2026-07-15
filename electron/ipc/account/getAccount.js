import fs from 'fs/promises';
import path from 'path';
import { app, safeStorage } from 'electron';

export const handleAccountGet = async (ipcMain, sendToWorker) => {
  ipcMain.handle("api:account-get", async () => {
    try {
      const profilePath = path.join(app.getPath("userData"), "profile.json");
      const profileData = await fs.readFile(profilePath, 'utf8');
      
      const user = JSON.parse(profileData);
      
      try {
        const keyPath = path.join(app.getPath("userData"), "master_key.dat");
        const encryptedSeed = await fs.readFile(keyPath);
        if (safeStorage.isEncryptionAvailable()) {
          user.seedHex = safeStorage.decryptString(encryptedSeed);
        } else {
          user.seedHex = encryptedSeed.toString('utf8');
        }
        
        const configPath = path.join(process.cwd(), "corestore", "worker-config.json");
        const configData = await fs.readFile(configPath, 'utf8');
        const config = JSON.parse(configData);
        user.publicKeyHex = config.authLedgerPublicKeyHex;
      } catch (e) {
        console.error("Could not load keys:", e);
      }
      
      // We fetch the local profile for an instant boot.
      // In the future, we could also fetch the latest from the Worker to ensure sync!
      return { success: true, user };
    } catch (err) {
      // If file doesn't exist, user is not logged in.
      return { success: false, error: "No account found locally" };
    }
  });
};
