import { create } from "zustand";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

interface ChatStore {
  sessionId: string | null;
  messages: Message[];
  setSessionId: (id: string) => void;
  addMessage: (msg: Message) => void;
  appendToken: (id: string, token: string) => void;
  finalizeMessage: (id: string) => void;
  reset: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  sessionId: null,
  messages: [],
  setSessionId: (id) => set({ sessionId: id }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  appendToken: (id, token) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, content: m.content + token } : m
      ),
    })),
  finalizeMessage: (id) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, streaming: false } : m
      ),
    })),
  reset: () => set({ sessionId: null, messages: [] }),
}));
