import Autobase from "autobase";
import Hyperbee from "hyperbee";
import crypto from "hypercore-crypto";

export class AutobaseManager {
  /**
   * @param {Object} store - Namespaced Corestore instance for the room/topic
   * @param {string} topicName - Name of the room/topic
   */
  constructor(store, topicName) {
    this.store = store;
    this.topicName = topicName;
    this.autobase = null;
    this.knownWriters = new Set();
    this.handshakeExt = null;
    this.handshakeCore = null;
  }

  /**
   * Initializes Autobase and registers the handshake extension for swapping keys.
   * @returns {Promise<void>}
   */
  async init() {
    const open = (store) => {
      const core = store.get({ name: "view" });
      return new Hyperbee(core, {
        keyEncoding: "utf-8",
        valueEncoding: "json",
      });
    };

    const apply = async (nodes, view, host) => {
      for (const { value } of nodes) {
        if (!value) continue;
        try {
          const data =
            typeof value === "string"
              ? JSON.parse(value)
              : JSON.parse(value.toString());
          if (data && data.addWriter) {
            await host.addWriter(Buffer.from(data.addWriter, "hex"), {
              indexer: true,
            });
            continue;
          }
          await view.put(`msg!${data.timestamp}!${data.sender}`, data);
        } catch (err) {
          // Ignore malformed entries
        }
      }
    };

    // 1. Initialize the shared handshake core derived from the room topic name
    const handshakeKey = crypto.data(Buffer.from(this.topicName));
    this.handshakeCore = this.store.get({ key: handshakeKey, active: true });
    await this.handshakeCore.ready();

    // 2. Instantiate Autobase (pass null so each client acts as the root bootstrap writer for their local core)
    this.autobase = new Autobase(this.store, null, { open, apply });
    await this.autobase.ready();

    // Track local writer key
    if (this.autobase.local) {
      this.knownWriters.add(this.autobase.local.key.toString("hex"));
    }

    // 3. Set up the handshake extension on the shared handshake core
    this.handshakeExt = this.handshakeCore.registerExtension(
      "pear-chat-handshake",
      {
        encoding: "json",
        onmessage: async (data) => {
          if (
            data &&
            data.writerKey &&
            !this.knownWriters.has(data.writerKey)
          ) {
            this.knownWriters.add(data.writerKey);
            try {
              // Append to our local core (which is writable!)
              await this.autobase.append(
                JSON.stringify({ addWriter: data.writerKey }),
              );
              await this.autobase.update();
            } catch (err) {
              // Ignore append errors
            }
          }
        },
      },
    );

    // 4. Automatically send our local key when a peer is added to the handshake core
    this.handshakeCore.on("peer-add", (peer) => {
      if (this.handshakeExt && this.autobase.local) {
        this.handshakeExt.send(
          { writerKey: this.autobase.local.key.toString("hex") },
          peer,
        );
      }
    });
  }

  /**
   * Appends an item to the local Autobase input core.
   * @param {Object} payload 
   */
  async append(payload) {
    if (!this.autobase) {
      throw new Error("Autobase is not initialized.");
    }
    await this.autobase.append(JSON.stringify(payload));
  }

  /**
   * Updates Autobase, processing new writer entries and updating the linearized view.
   */
  async update() {
    if (!this.autobase) return;
    await this.autobase.update();
  }

  /**
   * Accessor for the linearized view Hypercore.
   */
  get view() {
    return this.autobase ? this.autobase.view : null;
  }

  /**
   * Accessor for the local writer's key as a hex string.
   */
  get localKeyHex() {
    return this.autobase && this.autobase.local
      ? this.autobase.local.key.toString("hex")
      : null;
  }

  /**
   * Closes Autobase instance and releases its resources.
   */
  async close() {
    if (this.autobase) {
      await this.autobase.close();
      this.autobase = null;
    }
    if (this.handshakeCore) {
      await this.handshakeCore.close();
      this.handshakeCore = null;
    }
  }
}
