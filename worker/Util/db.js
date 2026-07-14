import Corestore from "corestore";

const initDB = async () => {
  // Use the storage path passed from the Pear Runtime or default fallback!
  const storagePath = Bare.argv[2] || "./corestore-data";
  const store = new Corestore(storagePath);

  // Wait for the store to be fully ready
  await store.ready();

  return store;
};

export default initDB;
