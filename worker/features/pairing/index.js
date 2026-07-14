import { cleanupSession, incrementOpId } from "./state.js";
import { startHost, approveRequest } from "./host.js";
import { startClient, requestCopy } from "./client.js";

const handlePairingMessage = async (
  subAction,
  payload,
  store,
  identityManager,
  globalSwarm,
) => {
  const opId = incrementOpId();

  if (subAction === "cleanup") {
    await cleanupSession();
    return { success: true };
  }

  if (subAction === "host") {
    return await startHost(payload, identityManager, opId);
  } 
  
  if (subAction === "client") {
    return await startClient(payload, opId);
  }

  if (subAction === "requestCopy") {
    return await requestCopy(store);
  }

  if (subAction === "approve") {
    return await approveRequest(payload, identityManager);
  }

  throw new Error(`Unknown pairing action: ${subAction}`);
};

export default handlePairingMessage;
