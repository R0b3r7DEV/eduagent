import { create } from "zustand";

interface UserStore {
  token: string | null;
  setToken: (token: string | null) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  token: null,
  setToken: (token) => set({ token }),
}));
