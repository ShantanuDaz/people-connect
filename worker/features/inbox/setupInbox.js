import crypto from "crypto";

export const setupInbox = async (swarm, publicKeyHex) => {
  // 1. Create a unique 32-byte topic just for our inbox
  // We hash our public key + the word "inbox"
  const inboxString = publicKeyHex + "-inbox";
  const inboxTopic = crypto.createHash("sha256").update(inboxString).digest();

  // 2. Join the swarm on this specific topic
  // client: false -> We are not looking for someone else's inbox right now
  // server: true -> We are opening our own inbox for others to find us
  swarm.join(inboxTopic, { client: false, server: true });

  // Listen for anyone connecting to our swarm
  swarm.on("connection", (socket, peerInfo) => {
    // peerInfo.publicKey is a Buffer, so we convert it to hex to read it
    const peerKey = peerInfo.publicKey.toString("hex");
    console.log(`\n🔔 [INBOX] New connection request from: ${peerKey}`);

    // Send them an automatic response over the secure socket
    socket.write("Welcome to my inbox! I have received your request.");

    // Listen for any messages they send us
    socket.on("data", (data) => {
      console.log(
        `📥 Message from [${peerKey.slice(0, 6)}...]: ${data.toString()}`,
      );
    });

    // Handle them disconnecting
    socket.on("close", () => {
      console.log(
        `\n❌ [INBOX] Connection closed by ${peerKey.slice(0, 6)}...`,
      );
    });
  });

  // 3. Wait for our inbox to be fully announced to the global network
  await swarm.flushed();

  console.log(`📬 Inbox open! Waiting for connection requests...`);
};
