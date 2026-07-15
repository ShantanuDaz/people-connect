import Corestore from 'corestore';

export const initDB = async (storagePath) => {
  const store = new Corestore(storagePath);
  await store.ready();
  return store;
};
