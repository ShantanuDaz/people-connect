import Autobase from 'autobase';
import b4a from 'b4a';
import { generateKeysFromSeed, generateDeviceKeyPair } from '../../Util/crypto.js';

export async function createNewAccount(storeInstance, rawMnemonicSeedHex, displayName) {
  // 1. Derive the supreme master keypair from the 24-word seed
  const { keyPair: masterKeyPair, publicKeyHex: accountId } = generateKeysFromSeed(rawMnemonicSeedHex);
  const bootstrapPublicKey = masterKeyPair.publicKey;
  
  // 2. Generate the local, physical device identity keypair
  const { keyPair: deviceKeyPair, publicKeyHex: deviceKeyHex } = generateDeviceKeyPair();

  // 3. Mount the foundational cores inside Corestore
  const bootstrapCore = storeInstance.get({
    key: bootstrapPublicKey,
    keyPair: masterKeyPair,
    valueEncoding: 'json'
  });
  await bootstrapCore.ready();

  const localInputCore = storeInstance.get({
    name: 'local-input-log',
    keyPair: deviceKeyPair,
    valueEncoding: 'json'
  });
  await localInputCore.ready();

  // 4. Append the authorization lineage to the blank Bootstrap Core
  // Ensure we're at length 0, otherwise it's already initialized
  if (bootstrapCore.length === 0) {
    const session = storeInstance.session();
    const base = new Autobase(session, bootstrapPublicKey, {
      valueEncoding: 'json',
      localInput: bootstrapCore
    });
    await base.ready();

    await base.append({
      type: 'OP_INIT_ACCOUNT',
      displayName: displayName,
      createdAt: Date.now()
    });

    await base.append({
      type: 'OP_ADD_WRITER',
      epoch: 1, // Base operational timeline
      deviceKey: deviceKeyHex,
      inputCoreKey: b4a.toString(localInputCore.key, 'hex'),
      timestamp: Date.now()
    });

    await base.close();
    await session.close();
  }

  return {
    accountId,
    deviceKey: deviceKeyHex,
    inputCoreKeyHex: b4a.toString(localInputCore.key, 'hex')
  };
}
