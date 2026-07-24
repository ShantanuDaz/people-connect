/**
 * Handles the readline prompt loop for sending chat messages to the swarm.
 * @param {import('readline/promises').Interface} rl - Readline interface instance
 * @param {Object} profile - User profile containing user information (e.g. name)
 * @param {import('../features/p2p-engine/RoomManager.js').RoomManager} roomManager - Active RoomManager instance
 */
export async function startChatLoop(rl, profile, roomManager) {
  while (true) {
    const input = await rl.question('> ');
    const trimmed = input.trim();

    if (trimmed.toLowerCase() === '/exit') {
      break;
    }

    if (trimmed !== '') {
      const payload = {
        sender: profile.name,
        text: trimmed,
        timestamp: Date.now()
      };

      await roomManager.broadcast(payload);
    }
  }
}
