export const registerIdentityHandlers = (ipcMain, sendToWorker) => {
  ipcMain.handle("api:identity-status", async () => {
    try {
      return await sendToWorker("identity:getStatus");
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("api:create-account", async (_, mnemonicSeedHex, displayName) => {
    try {
      return await sendToWorker("identity:createAccount", { mnemonicSeedHex, displayName });
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("api:start-runtime", async (_, bootstrapKeyHex, deviceKeyHex) => {
    try {
      return await sendToWorker("identity:startRuntime", { bootstrapKeyHex, deviceKeyHex });
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("api:process-recovery", async (_, mnemonicSeedHex, newDeviceKeyHex, newInputCoreKeyHex, bootstrapKeyHex) => {
    try {
      return await sendToWorker("identity:processRecovery", { mnemonicSeedHex, newDeviceKeyHex, newInputCoreKeyHex, bootstrapKeyHex });
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("api:clear-config", async () => {
    try {
      return await sendToWorker("identity:clearConfig");
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
};
