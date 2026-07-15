import { create } from 'zustand';
import * as bip39 from 'bip39';
import { useUserStore } from '@/stores/useUserStore';

export const useOnboardingStore = create((set, get) => ({
  step: 1, // 1: Basic Info, 2: Profile Pic, 3: Crypto Seed
  name: '',
  age: '',
  gender: '',
  bio: '',
  interests: '',
  profilePicBase64: '',
  mnemonic: '',
  error: '',
  submitLoading: false,

  setStep: (step) => set({ step, error: '' }),
  setName: (name) => set({ name }),
  setAge: (age) => set({ age }),
  setGender: (gender) => set({ gender }),
  setBio: (bio) => set({ bio }),
  setInterests: (interests) => set({ interests }),
  setProfilePicBase64: (profilePicBase64) => set({ profilePicBase64 }),
  setMnemonic: (mnemonic) => set({ mnemonic }),
  setError: (error) => set({ error }),
  
  generateMnemonic: async () => {
    // Add a slight delay for the UI loader effect
    await new Promise(resolve => setTimeout(resolve, 800));
    set({ mnemonic: bip39.generateMnemonic(256), error: '' });
  },

  submitOnboarding: async (navigate) => {
    const { name, age, gender, bio, interests, profilePicBase64, mnemonic, submitLoading } = get();
    if (submitLoading) return;
    
    set({ error: "", submitLoading: true });

    try {
      const response = await window.api.account.create({
        name,
        age: age ? parseInt(age, 10) : null,
        gender,
        bio: bio.trim(),
        interests: interests.split(',').map(i => i.trim()).filter(Boolean), // Parse comma separated tags
        avatarUrl: profilePicBase64,
        mnemonic: mnemonic.trim().toLowerCase()
      });

      if (response && response.success) {
        // Aggressively clear the mnemonic and sensitive info from memory
        get().resetOnboarding();
        useUserStore.getState().setUser(response.user);
        navigate("/", { replace: true });
      } else {
        set({ error: response?.error || "Failed to create account" });
      }
    } catch (err) {
      set({ error: err.message || "Failed to create account" });
      console.error(err.message);
    } finally {
      set({ submitLoading: false });
    }
  },

  resetOnboarding: () => set({ 
    step: 1, 
    name: '', 
    age: '', 
    gender: '', 
    profilePicBase64: '', 
    mnemonic: '', 
    error: '' 
  })
}));
