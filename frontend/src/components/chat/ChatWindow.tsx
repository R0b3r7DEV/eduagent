"use client";
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@/hooks/useChat";
import { useChatStore } from "@/stores/chatStore";
import { useUiStore } from "@/stores/uiStore";
import { useDocuments } from "@/hooks/useDocuments";
import { ScrollArea } from "@/components/ui/scroll-area";
import MessageBubble from "./MessageBubble";
import InputBar from "./InputBar";
import { GraduationCap, RotateCcw, PanelRight, BookOpen, Calculator, FlaskConical, Languages, Menu } from "lucide-react";

const SUGGESTIONS = [
  { icon: BookOpen,     text: "Resume mi último tema de Historia"     },
  { icon: Calculator,  text: "Explícame las derivadas paso a paso"    },
  { icon: FlaskConical,text: "¿Cuáles son mis deberes de Química?"    },
  { icon: Languages,   text: "Ayúdame a practicar inglés oral"        },
];

export default function ChatWindow() {
  const { messages, sendMessage } = useChat();
  const reset = useChatStore((s) => s.reset);
  const { rightPanelOpen, toggleRightPanel, toggleMobileMenu } = useUiStore();
  const { upload } = useDocuments();
  const bottomRef = useRef<HTMLDivElement>(null);
  const isStreaming = messages.some(m => m.streaming);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden min-w-0">
      {/* ── Header ───────────────────────────────────── */}
      <div className="flex h-14 items-center justify-between border-b border-border px-4 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {/* Hamburger — mobile only */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden flex-shrink-0 rounded-[--radius-sm] p-1.5 text-text-muted hover:bg-surface-2 hover:text-text-secondary transition-colors"
          >
            <Menu size={18} />
          </button>
          <h2 className="text-sm font-medium text-text-secondary truncate">
            {messages.length === 0 ? "Nueva conversación" : "Conversación"}
          </h2>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {messages.length > 0 && (
            <button
              onClick={reset}
              className="flex items-center gap-1.5 rounded-[--radius-sm] px-2.5 py-1.5 text-xs text-text-muted hover:bg-surface-2 hover:text-text-secondary transition-colors"
            >
              <RotateCcw size={13} />
              Nueva
            </button>
          )}
          <button
            onClick={toggleRightPanel}
            className={`rounded-[--radius-sm] p-1.5 transition-colors ${rightPanelOpen ? "text-violet-400 bg-violet-600/10" : "text-text-muted hover:bg-surface-2 hover:text-text-secondary"}`}
          >
            <PanelRight size={15} />
          </button>
        </div>
      </div>

      {/* ── Messages ─────────────────────────────────── */}
      <ScrollArea className="flex-1">
        <div className="min-h-full">
          <AnimatePresence>
            {messages.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex h-full min-h-[calc(100dvh-12rem)] flex-col items-center justify-center gap-6 px-4 py-10"
              >
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-violet-800 shadow-lg">
                    <GraduationCap size={24} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-text-primary">¿En qué te ayudo hoy?</h1>
                    <p className="mt-1 text-sm text-text-muted">
                      Pregúntame sobre tus apuntes, deberes o cualquier concepto de clase.
                    </p>
                  </div>
                </div>

                <div className="grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5">
                  {SUGGESTIONS.map(({ icon: Icon, text }) => (
                    <button
                      key={text}
                      onClick={() => sendMessage(text)}
                      className="flex items-start gap-2.5 rounded-[--radius-lg] border border-border bg-surface px-4 py-3 text-left text-sm text-text-secondary hover:border-violet-600/40 hover:bg-surface-2 hover:text-text-primary transition-colors"
                    >
                      <Icon size={15} className="mt-0.5 shrink-0 text-violet-400" />
                      <span className="leading-snug">{text}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div key="messages" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-2">
                {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
                <div ref={bottomRef} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* ── Input ────────────────────────────────────── */}
      <InputBar
        onSend={sendMessage}
        onUpload={(file) => upload.mutate(file)}
        disabled={isStreaming}
      />
    </div>
  );
}
