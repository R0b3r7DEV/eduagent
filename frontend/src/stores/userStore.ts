import { create } from "zustand";

interface UserStore {
  email: string | null;
  name: string | null;
  onboardingDone: boolean;
  setUser: (data: { email?: string; name?: string }) => void;
  setOnboardingDone: (done: boolean) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  email: null,
  name: null,
  onboardingDone: false,
  setUser: (data) => set((s) => ({ ...s, ...data })),
  setOnboardingDone: (done) => set({ onboardingDone: done }),
}));
