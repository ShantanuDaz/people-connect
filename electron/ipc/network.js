export const registerNetworkHandlers = (ipcMain, sendToWorker) => {
  ipcMain.handle("api:join-swarm", async (_, keyPair) => {
    try {
      return await sendToWorker("network:joinSwarm", keyPair);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
};
