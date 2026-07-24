import * as Y from "yjs";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";

export function initDatabaseSync(node, roomTopic) {
  const ydoc = new Y.Doc();
  const sharedChat = ydoc.getArray("messages");

  // Subscribe to the Gossipsub room topic
  node.services.pubsub.subscribe(roomTopic);

  // 1. Listen for local data changes and broadcast them
  ydoc.on("update", (update, origin) => {
    // Only broadcast local changes (origin !== 'remote') to avoid infinite message loops
    if (origin === "remote") return;

    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, 0); // Data payload tag
    encoding.writeUint8Array(encoder, update);
    node.services.pubsub.publish(roomTopic, encoding.toUint8Array(encoder))
      .catch((err) => {
        if (err.message && err.message.includes("NoPeersSubscribedToTopic")) {
          // Ignore - no other peers are online/subscribed yet
        } else {
          console.error("Publish error:", err);
        }
      });
  });

  // 2. Listen for incoming updates from other peers
  node.services.pubsub.addEventListener("message", (evt) => {
    if (evt.detail.topic === roomTopic) {
      try {
        const decoder = decoding.createDecoder(evt.detail.data);
        const tag = decoding.readVarUint(decoder);
        if (tag === 0) { // Data payload tag
          const update = decoding.readUint8Array(decoder);
          // Apply update with origin 'remote' so it doesn't trigger the local update listener
          Y.applyUpdate(ydoc, update, "remote");
        }
      } catch (err) {
        console.error("Error decoding/applying remote update:", err);
      }
    }
  });

  return { ydoc, sharedChat };
}

