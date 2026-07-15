export const registerAccountHandlers = (ipcMain, sendToWorker) => {
  ipcMain.handle("api:account-get", async () => {
    // Stubbed for now so the UI doesn't crash on startup
    return { success: false, error: "Not implemented yet" };
  });

  ipcMain.handle("api:account-create", async (_, payload) => {
    return { success: false, error: "Not implemented yet" };
  });

  ipcMain.handle("api:account-update", async (_, payload) => {
    return { success: false, error: "Not implemented yet" };
  });

  ipcMain.handle("api:account-delete", async () => {
    return { success: false, error: "Not implemented yet" };
  });
};
