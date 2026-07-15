import fs from 'fs/promises';
import path from 'path';
import { app } from 'electron';

export const handleAccountDelete = async (ipcMain, sendToWorker) => {
  ipcMain.handle("api:account-delete", async () => {
    try {
      // 1. Delete local secrets and profile cache
      const keyPath = path.join(app.getPath("userData"), "master_key.dat");
      const profilePath = path.join(app.getPath("userData"), "profile.json");
      
      // We use catch on unlink so we don't throw an error if they are already missing
      await fs.unlink(keyPath).catch(() => {});
      await fs.unlink(profilePath).catch(() => {});

      // 2. Tell the Worker to wipe its storage or destroy the ledger locally
      await sendToWorker("account:delete", {});

      return { success: true };
    } catch (err) {
      console.error("Failed to delete account in Main process:", err);
      return { success: false, error: err.message };
    }
  });
};
