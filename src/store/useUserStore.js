import { create } from 'zustand';

const useUserStore = create((set) => ({
    profile: null,
    setProfile: (profile) => set({ profile }),
    clearProfile: () => set({ profile: null }),
}));

export default useUserStore;
