import * as bip39 from 'bip39'

// Generates a new 24-word mnemonic phrase
export const generateMnemonic = () => {
  return bip39.generateMnemonic(256) // 256 bits of entropy = 24 words
}

// Validates a mnemonic phrase
export const validateMnemonic = (mnemonic) => {
  return bip39.validateMnemonic(mnemonic.trim())
}

// Derives a 32-byte hex seed from the mnemonic for hypercore-crypto
export const mnemonicToSeedHex = async (mnemonic) => {
  // bip39 generates a 64-byte seed. We can take the first 32 bytes for ed25519
  const seedBuffer = await bip39.mnemonicToSeed(mnemonic.trim())
  return seedBuffer.slice(0, 32).toString('hex')
}
