# Fix Pairwise Chat Replication and Handshake

The current architecture has a severe socket conflict bug that breaks 1-on-1 messaging.

## Background
Currently, when two peers establish a pairwise connection, they pipe the raw hyperswarm socket to the hypercore replication stream (`conn.pipe(stream)`). However, they also attempt to send a plain-text JSON `handshake` over the exact same socket to exchange their database keys. This mixes JSON strings with binary replication data, corrupting the hypercore stream and causing it to crash. As a result, messages sent by one peer are never received by the other. 
This explains the issue where the sender sees their own message in the chat, but the receiver sees "nothing".

## Proposed Changes

### [MODIFY] `workers/NetworkManager.mjs`
- Remove the `handshake` JSON exchange over the pairwise connection entirely.
- Leverage the existing Inbox protocol to exchange `dbKey`s *before* the pairwise topic is joined.
- Update `sendJoinRequest` to generate the `outgoing` database and include its `dbKey` in the `incoming_request`.
- Update the `incoming_request` handler to save the `peerDbKey` in the database state.
- Update `acceptRequest` to generate its `outgoing` database and include its `dbKey` in the `accepted_request`.
- Update the `accepted_request` handler to save the `peerDbKey` in the database state.
- In `joinTopic`, since both peers now have each other's `dbKey`s in their connection state, they can immediately `setupIncoming` before joining the swarm.
- When `handleConnection` fires for the pairwise topic, it only needs to multiplex the incoming and outgoing cores onto the replication stream, without sending any JSON messages.

### [MODIFY] `workers/DatabaseManager.mjs`
- Ensure `updateConnectionState` persists the `peerDbKey` and `myDbKey` so they are available when joining the topic.

## Verification Plan
1. Send a request from Peer 1 to Peer 2.
2. Accept the request on Peer 2.
3. Send a message from Peer 1 and verify Peer 2 receives it.
4. Send a message from Peer 2 and verify Peer 1 receives it.

