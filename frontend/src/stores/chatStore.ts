import { create } from "zustand";

interface ChatStore {
  sessionId: string | null;
  messages: { role: string; content: string }[];
  setSessionId: (id: string) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  sessionId: null,
  messages: [],
  setSessionId: (id) => set({ sessionId: id }),
}));
