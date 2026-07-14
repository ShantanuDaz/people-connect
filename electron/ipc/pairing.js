export const registerPairingHandlers = (ipcMain, sendToWorker) => {
  ipcMain.handle("api:pairing-host", async (_, bootstrapKeyHex) => {
    try {
      return await sendToWorker("pairing:host", { bootstrapKeyHex });
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("api:pairing-client", async (_, roomCode) => {
    try {
      return await sendToWorker("pairing:client", { roomCode });
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("api:pairing-request-copy", async (_) => {
    try {
      return await sendToWorker("pairing:requestCopy", {});
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("api:pairing-approve", async (_, deviceKeyHex, inputCoreKeyHex) => {
    try {
      return await sendToWorker("pairing:approve", { deviceKeyHex, inputCoreKeyHex });
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("api:pairing-cleanup", async (_) => {
    try {
      return await sendToWorker("pairing:cleanup", {});
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
};
