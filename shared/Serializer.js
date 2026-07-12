import b4a from "b4a";

export const JSONReplacer = (key, value) => {
  if (b4a.isBuffer(value) || (value && value.type === "Buffer" && Array.isArray(value.data))) {
    return { $type: "Buffer", $data: b4a.toString(b4a.from(value.data || value), "hex") };
  }
  if (value instanceof Uint8Array) {
    return { $type: "Buffer", $data: b4a.toString(b4a.from(value), "hex") };
  }
  return value;
};

export const JSONReviver = (key, value) => {
  if (value && value.$type === "Buffer") {
    return b4a.from(value.$data, "hex");
  }
  return value;
};
