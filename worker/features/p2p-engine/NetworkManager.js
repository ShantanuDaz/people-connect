import Hyperswarm from "hyperswarm";

/**
 * Creates and initializes a new Hyperswarm network node.
 * @param {Object} [options] - Configuration options for Hyperswarm
 * @returns {Hyperswarm} Active Hyperswarm instance
 */
export function createNetwork(options = {}) {
  return new Hyperswarm(options);
}
