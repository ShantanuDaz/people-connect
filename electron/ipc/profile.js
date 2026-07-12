export const registerProfileHandlers = (ipcMain, sendToWorker) => {
  ipcMain.handle("api:get-profile", async () => {
    try {
      return await sendToWorker("profile:getProfile");
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("api:save-profile", async (_, seedHex, name, mnemonic) => {
    try {
      return await sendToWorker("profile:saveProfile", { seedHex, name, mnemonic });
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("api:clear-profile", async () => {
    try {
      return await sendToWorker("profile:clearProfile");
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
};
