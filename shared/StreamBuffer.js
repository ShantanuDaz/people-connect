import b4a from "b4a";
import { JSONReplacer, JSONReviver } from "./Serializer.js";

export class StreamBuffer {
  /**
   * @param {function(Object): void} onMessage - Callback triggered when a complete JSON message is parsed
   */
  constructor(onMessage) {
    this.buffer = b4a.alloc(0);
    this.onMessage = onMessage;
  }

  /**
   * Processes an incoming raw data chunk, buffering incomplete messages
   * @param {Buffer|Uint8Array} data - The raw data chunk
   */
  processData(data) {
    // Ensure the chunk is a b4a buffer
    const chunk = b4a.isBuffer(data) ? data : b4a.from(data);
    this.buffer = b4a.concat([this.buffer, chunk]);
    
    while (this.buffer.length >= 4) {
      // Read the expected size of the next incoming message payload (32-bit LE int)
      // b4a doesn't have readInt32LE, so we can use standard Buffer or DataView
      // In b4a/Buffer we can use Buffer.prototype.readInt32LE but for generic we can do:
      let messageLength = 0;
      if (typeof this.buffer.readUInt32LE === 'function') {
        messageLength = this.buffer.readUInt32LE(0);
      } else {
        const view = new DataView(this.buffer.buffer, this.buffer.byteOffset, this.buffer.byteLength);
        messageLength = view.getUint32(0, true);
      }
      
      // Check if the full payload has arrived yet
      if (this.buffer.length >= 4 + messageLength) {
        const payload = this.buffer.subarray(4, 4 + messageLength);
        
        try {
          const messageString = b4a.toString(payload, "utf-8");
          const message = JSON.parse(messageString, JSONReviver);
          this.onMessage(message);
        } catch (err) {
          console.error("Failed to parse buffered message:", err.message);
        }
        
        // Slice the processed message out of the main buffer accumulator
        this.buffer = this.buffer.subarray(4 + messageLength);
      } else {
        break; // Wait for more data chunks to arrive
      }
    }
  }

  /**
   * Serializes a message object into a length-prefixed buffer.
   * @param {Object} message 
   * @returns {Buffer}
   */
  static serialize(message) {
    const jsonString = JSON.stringify(message, JSONReplacer);
    const payload = b4a.from(jsonString, "utf-8");
    
    const prefix = b4a.alloc(4);
    if (typeof prefix.writeUInt32LE === 'function') {
      prefix.writeUInt32LE(payload.length, 0);
    } else {
      const view = new DataView(prefix.buffer, prefix.byteOffset, prefix.byteLength);
      view.setUint32(0, payload.length, true);
    }
    
    return b4a.concat([prefix, payload]);
  }
}
