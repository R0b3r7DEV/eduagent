"use client";
import { useEffect, useRef } from "react";
import { useChat } from "@/hooks/useChat";
import MessageBubble from "./MessageBubble";
import InputBar from "./InputBar";

export default function ChatWindow() {
  const { messages, sendMessage } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  const isStreaming = messages.some(m => m.streaming);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-400">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-3xl font-bold text-white">E</div>
            <p className="text-lg font-medium text-gray-600">¿En qué te ayudo hoy?</p>
            <p className="text-sm">Pregúntame sobre tus apuntes, deberes o cualquier tema de clase.</p>
          </div>
        )}
        {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
        <div ref={bottomRef} />
      </div>
      <InputBar onSend={sendMessage} disabled={isStreaming} />
    </div>
  );
}
