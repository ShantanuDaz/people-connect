export const state = {
  activeSwarm: null,
  activeConnection: null,
  pendingDeviceKeyHex: null,
  pendingInputCoreKeyHex: null,
  activeBootstrapKeyHex: null,
  currentOpId: 0,
};

export const cleanupSession = async () => {
  if (state.activeConnection) {
    state.activeConnection.end();
    state.activeConnection = null;
  }
  if (state.activeSwarm) {
    await state.activeSwarm.destroy();
    state.activeSwarm = null;
  }
  state.pendingDeviceKeyHex = null;
  state.pendingInputCoreKeyHex = null;
  state.activeBootstrapKeyHex = null;
};

export const incrementOpId = () => {
  return ++state.currentOpId;
};
