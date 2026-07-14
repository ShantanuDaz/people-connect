import { StreamBuffer } from "../../../shared/StreamBuffer.js";

export const sendEvent = (event) => {
  if (typeof Bare !== "undefined" && Bare.IPC) {
    Bare.IPC.write(StreamBuffer.serialize({ type: "pairing:event", ...event }));
  }
};
