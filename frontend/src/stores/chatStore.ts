import { create } from "zustand";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  intent?: string;
  sources?: string[];
}

export interface ChatSession {
  id: string;
  title: string;
  updatedAt: string;
}

interface ChatStore {
  sessionId: string | null;
  messages: Message[];
  sessions: ChatSession[];
  setSessionId: (id: string) => void;
  addMessage: (msg: Message) => void;
  appendToken: (id: string, token: string) => void;
  finalizeMessage: (id: string, meta?: { intent?: string; sources?: string[] }) => void;
  setSessions: (sessions: ChatSession[]) => void;
  reset: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  sessionId: null,
  messages: [],
  sessions: [],

  setSessionId: (id) => set({ sessionId: id }),

  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),

  appendToken: (id, token) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, content: m.content + token } : m
      ),
    })),

  finalizeMessage: (id, meta) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, streaming: false, ...meta } : m
      ),
    })),

  setSessions: (sessions) => set({ sessions }),

  reset: () => set({ sessionId: null, messages: [] }),
}));
