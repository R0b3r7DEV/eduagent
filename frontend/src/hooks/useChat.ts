"use client";
import { useCallback, useRef } from "react";
import { getAccessToken } from "@/lib/supabase";
import { useChatStore } from "@/stores/chatStore";

export function useChat() {
  const { sessionId, messages, setSessionId, addMessage, appendToken, finalizeMessage } = useChatStore();
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userId = crypto.randomUUID();
    addMessage({ id: userId, role: "user", content: text });

    // Add placeholder for assistant
    const assistantId = crypto.randomUUID();
    addMessage({ id: assistantId, role: "assistant", content: "", streaming: true });

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const token = await getAccessToken();
      const res = await fetch("/api/v1/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ session_id: sessionId, message: text, language: "es" }),
        signal: abortRef.current.signal,
      });

      if (!res.body) throw new Error("No response body");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          try {
            const evt = JSON.parse(part.slice(6));
            if (evt.type === "session_id") setSessionId(evt.session_id);
            else if (evt.type === "text") appendToken(assistantId, evt.content);
            else if (evt.type === "no_api_key") appendToken(assistantId, evt.content);
            else if (evt.type === "error") appendToken(assistantId, `⚠️ ${evt.content}`);
          } catch {}
        }
      }
    } catch (e: unknown) {
      if ((e as Error)?.name !== "AbortError") {
        const { toast } = await import("sonner");
        toast.error("Error de conexión con el agente");
        finalizeMessage(assistantId);
      }
    } finally {
      finalizeMessage(assistantId);
    }
  }, [sessionId, addMessage, appendToken, finalizeMessage, setSessionId]);

  return { messages, sendMessage, sessionId };
}
