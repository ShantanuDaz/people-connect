import Hypercore from "hypercore";
import Hyperbee from "hyperbee";

const initDB = async () => {
  // 1. Create a Hypercore. We pass a local folder path where it will save the files.
  const core = new Hypercore("./db/local-user");

  // 2. Wrap the core in a Hyperbee so we can use it like a Key-Value store.
  // We specify utf-8 encoding so we can save normal text strings.
  const db = new Hyperbee(core, {
    keyEncoding: "utf-8",
    valueEncoding: "utf-8",
  });

  // 3. Wait for the database to be fully ready
  await db.ready();

  return db;
};

export default initDB;
