import Hyperbee from 'hyperbee';

let configDB = null;

export const initConfigStore = async (storeInstance) => {
  if (configDB) return configDB;
  
  const configCore = storeInstance.get({ name: 'local-config' });
  await configCore.ready();
  
  configDB = new Hyperbee(configCore, {
    keyEncoding: 'utf-8',
    valueEncoding: 'json'
  });
  
  await configDB.ready();
  return configDB;
};

export const getConfigStore = () => {
  if (!configDB) throw new Error('Config store not initialized');
  return configDB;
};

export const saveIdentityConfig = async (mnemonicSeedHex, bootstrapKeyHex, deviceKeyHex, inputCoreKeyHex) => {
  const db = getConfigStore();
  await db.put('identity', {
    mnemonicSeedHex,
    bootstrapKeyHex,
    deviceKeyHex,
    inputCoreKeyHex
  });
};

export const getIdentityConfig = async () => {
  const db = getConfigStore();
  const node = await db.get('identity');
  return node ? node.value : null;
};

export const clearIdentityConfig = async () => {
  const db = getConfigStore();
  await db.del('identity');
};
