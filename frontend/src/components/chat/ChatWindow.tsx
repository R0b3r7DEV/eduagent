"use client";
import { useEffect, useRef } from "react";
import { useChat } from "@/hooks/useChat";
import { useChatStore } from "@/stores/chatStore";
import MessageBubble from "./MessageBubble";
import InputBar from "./InputBar";
import { BookOpen, Calculator, FlaskConical, Languages, RotateCcw } from "lucide-react";

const SUGGESTIONS = [
  { icon: BookOpen,    text: "Resume el tema 3 de Historia" },
  { icon: Calculator,  text: "Explícame las derivadas paso a paso" },
  { icon: FlaskConical,text: "¿Cuáles son mis deberes de Química?" },
  { icon: Languages,   text: "Ayúdame a practicar inglés" },
];

export default function ChatWindow() {
  const { messages, sendMessage } = useChat();
  const reset = useChatStore((s) => s.reset);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isStreaming = messages.some(m => m.streaming);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      {messages.length > 0 && (
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-5 py-3">
          <h2 className="text-sm font-medium text-gray-700">Conversación</h2>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <RotateCcw size={13} />
            Nueva
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-8 px-6 py-10">
            {/* Logo */}
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl font-bold text-white shadow-lg">
                E
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-800">¿En qué te ayudo hoy?</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Pregúntame sobre tus apuntes, deberes o cualquier tema de clase.
                </p>
              </div>
            </div>

            {/* Suggestion chips */}
            <div className="grid w-full max-w-xl grid-cols-2 gap-2.5">
              {SUGGESTIONS.map(({ icon: Icon, text }) => (
                <button
                  key={text}
                  onClick={() => sendMessage(text)}
                  className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-sm text-gray-700 shadow-sm hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700 transition-colors"
                >
                  <Icon size={15} className="shrink-0 text-blue-500" />
                  <span className="leading-snug">{text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="pb-4">
            {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <InputBar onSend={sendMessage} disabled={isStreaming} />
    </div>
  );
}
