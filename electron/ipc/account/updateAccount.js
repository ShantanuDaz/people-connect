import fs from 'fs/promises';
import path from 'path';
import { app } from 'electron';

export const handleAccountUpdate = async (ipcMain, sendToWorker) => {
  ipcMain.handle("api:account-update", async (_, payload) => {
    try {
      // 1. Update the local file so the next boot is fast and accurate
      const profilePath = path.join(app.getPath("userData"), "profile.json");
      let existingProfile = {};
      
      try {
        const fileContent = await fs.readFile(profilePath, 'utf8');
        existingProfile = JSON.parse(fileContent);
      } catch (e) {
        // If file doesn't exist, we can still proceed with just the payload
      }
      
      const updatedProfile = { ...existingProfile, ...payload };
      await fs.writeFile(profilePath, JSON.stringify(updatedProfile, null, 2));

      // 2. Tell the Worker to write an update block to the P2P Auth Ledger
      // We wait for this to ensure the P2P ledger successfully logs the update
      await sendToWorker("account:update", payload);

      return { success: true, user: updatedProfile };
    } catch (err) {
      console.error("Failed to update account in Main process:", err);
      return { success: false, error: err.message };
    }
  });
};
