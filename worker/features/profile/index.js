const getProfile = async (identityManager) => {
  const existingName = await identityManager.view.get("profile"); // Ensure we use the correct key 'profile'
  
  if (existingName) {
    return { name: existingName.value.name, displayName: existingName.value.displayName };
  }

  return null;
};

const saveProfile = async (identityManager, name, displayName) => {
  await identityManager.engine.append({ type: 'SET_PROFILE', name, displayName });
  return { name, displayName };
};

const clearProfile = async (identityManager) => {
  // Autobase view deletion logic needs to be append as well if we support deletion.
  // For now, since Autobase applies SET_PROFILE, we can append a CLEAR_PROFILE op, or just let it be.
  await identityManager.engine.append({ type: 'CLEAR_PROFILE' });
  return true;
};

const handleProfileMessage = async (subAction, payload, identityManager) => {
  if (subAction === "getProfile") {
    return await getProfile(identityManager);
  } else if (subAction === "saveProfile") {
    return await saveProfile(identityManager, payload.name, payload.displayName || payload.name);
  } else if (subAction === "clearProfile") {
    return await clearProfile(identityManager);
  }

  throw new Error(`Unknown profile action: ${subAction}`);
};

export default handleProfileMessage;
