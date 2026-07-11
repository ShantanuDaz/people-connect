import Hyperswarm from "hyperswarm";

export const initNetwork = async (keyPair) => {
  // 1. Create a new Hyperswarm instance.
  // By passing our keyPair, the DHT knows our node's cryptographic identity!
  const swarm = new Hyperswarm({ keyPair });

  console.log("🐝 Swarm initialized! Our node is ready to connect.");

  // We will add more event listeners here soon...

  return swarm;
};
