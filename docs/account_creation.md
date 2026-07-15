# Primary User Account Creation Architecture

## Overview
This document outlines the secure "Primary User Account Creation" system for our serverless, multi-device P2P application using the Holepunch stack (Corestore, Hypercore, Autobase, and Hyperswarm).

### Key Architectural Constraints
1. **Separation of Concerns:** The Master Key pair (derived from the seed) is only used to sign administrative metadata blocks on the primary system ledger. It is **never** used for daily data writes (like chats or call streams).
2. **Hardware Isolation:** The local device generates its own unique, randomized device keypair locally to handle daily log actions.
3. **No Secret Leaks:** Raw master keys and seeds live strictly in volatile memory during setup and are **never** written into a Hypercore log or exposed to network replication.

---

## Process Choreography

### 1. The UI (Renderer Process)
**Role:** Presentation, Data Collection, and Secret Handoff.
* **Step 1 (Essential Info):** Collect basic identity details (Name, Age, Gender).
* **Step 2 (Expression):** Collect optional social details (Profile Picture Base64, Bio, Interests).
* **Step 3 (Master Key):** Generate the 24-word master mnemonic.
* **Handoff:** The UI bundles all profile data and the mnemonic and sends it to the Electron Main process via the `window.api.account.create()` IPC bridge. Once sent, the UI aggressively clears these words from its state to prevent memory scraping.
* **Security Rule:** The UI never imports Holepunch libraries, never executes cryptography, and never touches the disk.

### 2. The Electron Main Process
**Role:** The Secure Enclave & Orchestrator.
* **Action:** It receives the 24 words. This process is the safest place for raw secrets because it has access to native Node.js crypto and the Operating System's Secure Keychain.
* **Derivation & Storage:** It derives the raw 32-byte master seed from the words. To keep the user logged in across app restarts, this process can encrypt the seed with a local password and save it in the OS Keychain.
* **Handoff:** The Main process sends the raw 32-byte seed over an internal, hidden IPC channel down to the Worker process—but **only** during the initial login/bootstrap phase.

### 3. The Worker Process (The Holepunch Engine)
**Role:** The P2P Networking & Storage Layer (Corestore, Hypercore, Autobase).

Here is the step-by-step execution when the Worker receives the 32-byte seed:

#### Step A: The Local Device Key (Hardware Identity)
The Worker initializes `Corestore` pointing to a local folder. Upon startup, Corestore automatically generates a random, localized keypair saved in its internal local keystore. This represents the local "Device Key".

#### Step B: The Auth Ledger (Hypercore)
The Worker takes the 32-byte master seed from RAM and derives the Master Keypair. It then instantiates a specific Hypercore (the Auth Ledger) by passing this Master Keypair into the Corestore configuration. Passing the keypair grants Corestore the right to *sign* blocks for this specific core locally.

#### Step C: The Authorization (The Magic Trick)
The Worker appends two critical blocks to the Auth Ledger:
* **Block 0 (Genesis):** Initial metadata establishing the user's primary identity ledger.
* **Block 1 (Device Authorization):** An authorization payload that states: *"I, the Master Identity, authorize the local Device Public Key (from Step A) to act on my behalf and write data."*

#### Step D: The Memory Wipe (Crucial)
The moment Block 1 is appended and signed, the Worker nullifies the 32-byte seed and the Master Keypair from its RAM. The master secrets are completely purged and discarded.

#### Step E: Daily Operations (Autobase)
For daily operations (e.g., sending chats, creating posts):
1. The Worker uses its *local Device Keypair* to create standard Hypercores for daily writes.
2. We use **Autobase** to combine daily logs from all authorized devices into one coherent timeline.
3. Autobase is configured to read the **Auth Ledger**. It scans Block 1, verifies that the local Device Public Key is authorized by the Master, and seamlessly accepts the data.

### 4. Multi-Device State Sync (Optimistic Boot + Reactive Push)
**Role:** Ensuring the UI remains fast while keeping data synchronized across devices.
* **Optimistic Boot:** The Electron Main Process caches a local copy of the profile data (`profile.json`) to allow the UI to boot instantly without waiting for P2P networking.
* **Reconciliation:** On boot, Electron issues an `account:get` request to the Worker. If the Worker's ledger has newer profile data (e.g., updated from your phone), Electron updates its local cache and notifies the UI.
* **Reactive Push (`account:sync`):** The Worker continuously listens for updates on the Auth Ledger. If a profile update block is appended by a different device, the Worker emits a spontaneous `account:sync` event to the Main process. The Main process intercepts this, updates the local `profile.json` cache, and broadcasts it to the UI (via `preload.cjs` IPC events) so the React state updates in real-time.
