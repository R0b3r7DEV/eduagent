"use client";
import { useState, useRef, useCallback } from "react";

interface Props { onSend: (text: string) => void; disabled?: boolean; }

export default function InputBar({ onSend, disabled }: Props) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  const submit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
    if (ref.current) { ref.current.style.height = "auto"; }
  }, [text, disabled, onSend]);

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-3">
      <div className="flex items-end gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
        <textarea
          ref={ref}
          value={text}
          onChange={e => { setText(e.target.value); e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
          placeholder="Escribe tu pregunta… (Enter para enviar)"
          rows={1}
          disabled={disabled}
          className="flex-1 resize-none bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none disabled:opacity-50"
          style={{ maxHeight: 160 }}
        />
        <button
          onClick={submit}
          disabled={!text.trim() || disabled}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"
          aria-label="Enviar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path d="M3.478 2.405a.75.75 0 0 0-.926.94l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.405Z" />
          </svg>
        </button>
      </div>
      <p className="mt-1 text-center text-xs text-gray-400">Shift+Enter para salto de línea</p>
    </div>
  );
}
