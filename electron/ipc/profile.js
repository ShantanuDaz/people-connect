export const registerProfileHandlers = (ipcMain, sendToWorker) => {
  ipcMain.handle("api:get-profile", async () => {
    return await sendToWorker("profile:getProfile");
  });

  ipcMain.handle("api:save-profile", async (_, mnemonic, name) => {
    return await sendToWorker("profile:saveProfile", { mnemonic, name });
  });
};
