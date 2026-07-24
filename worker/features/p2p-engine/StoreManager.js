import Corestore from "corestore";
import path from "path";

/**
 * Initializes a Corestore instance scoped to the user's profile name.
 * @param {string} profileName - Name of the active user profile
 * @returns {Corestore} Instance of Corestore scoped to profiles/<profileName>/storage
 */
export function createStore(profileName) {
  const name = profileName || "default";
  const storagePath = path.join(process.cwd(), "profiles", name, "storage");
  return new Corestore(storagePath);
}
