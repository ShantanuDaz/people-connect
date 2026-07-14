import Hyperswarm from "hyperswarm";

/**
 * Creates and returns a Hyperswarm instance.
 * When a storeInstance is provided, every new connection automatically
 * replicates Corestore data (Hypercores, Autobase) with the remote peer.
 *
 * @param {Corestore} [storeInstance] - The Corestore to replicate on connections
 * @param {Object}    [keyPair]       - Optional Hyperswarm identity keyPair
 * @returns {Promise<Hyperswarm>}
 */
export const initNetwork = async (storeInstance, keyPair) => {
  const opts = {};
  if (keyPair) opts.keyPair = keyPair;

  const swarm = new Hyperswarm(opts);

  // Wire up automatic Corestore replication for every peer connection
  if (storeInstance) {
    swarm.on("connection", (connection) => {
      storeInstance.replicate(connection);
    });
  }

  console.log("🐝 Swarm initialized! Our node is ready to connect.");

  return swarm;
};
