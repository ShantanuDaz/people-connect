import { create } from 'zustand';
import * as bip39 from 'bip39';

export const useAuthStore = create((set) => ({
  mode: 'signup', // 'signup' or 'signin'
  signupStep: 1, // 1: Name input, 2: Phrase display
  name: '',
  mnemonic: '',
  error: '',

  setMode: (mode) => {
    if (mode === 'signup') {
      set({ mode, signupStep: 1, mnemonic: bip39.generateMnemonic(256), error: '' });
    } else {
      set({ mode, signupStep: 1, mnemonic: '', error: '' });
    }
  },
  
  setSignupStep: (step) => set({ signupStep: step, error: '' }),
  setName: (name) => set({ name }),
  setMnemonic: (mnemonic) => set({ mnemonic }),
  setError: (error) => set({ error }),
  
  initializeSignup: () => {
    set((state) => {
      // Only generate if we don't have one, to avoid regenerating on every mount
      if (state.mode === 'signup' && !state.mnemonic) {
        return { mnemonic: bip39.generateMnemonic(256), error: '' };
      }
      return {};
    });
  }
}));
