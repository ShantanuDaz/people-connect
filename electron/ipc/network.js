export const registerNetworkHandlers = (ipcMain, sendToWorker) => {
  ipcMain.handle("api:join-swarm", async (_, keyPair) => {
    return await sendToWorker("network:joinSwarm", keyPair);
  });
};
