"use client";
import { useState, useRef, useCallback } from "react";
import { ArrowUp, Paperclip } from "lucide-react";

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
  onAttach?: () => void;
}

export default function InputBar({ onSend, disabled, onAttach }: Props) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  const submit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
    if (ref.current) {
      ref.current.style.height = "auto";
    }
  }, [text, disabled, onSend]);

  const canSend = text.trim().length > 0 && !disabled;

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-3">
      <div
        className={`flex items-end gap-2 rounded-xl border bg-white px-3 py-2.5 shadow-sm transition-colors ${
          disabled
            ? "border-gray-200 opacity-70"
            : "border-gray-300 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100"
        }`}
      >
        {onAttach && (
          <button
            type="button"
            onClick={onAttach}
            disabled={disabled}
            className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-40"
            aria-label="Adjuntar archivo"
          >
            <Paperclip size={16} />
          </button>
        )}

        <textarea
          ref={ref}
          value={text}
          onChange={e => {
            setText(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
          }}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={disabled ? "EduAgent está respondiendo…" : "Pregunta algo sobre tus apuntes…"}
          rows={1}
          disabled={disabled}
          className="flex-1 resize-none bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none disabled:cursor-not-allowed"
          style={{ maxHeight: 160 }}
        />

        <button
          onClick={submit}
          disabled={!canSend}
          className={`mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all ${
            canSend
              ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
          aria-label="Enviar"
        >
          <ArrowUp size={15} strokeWidth={2.5} />
        </button>
      </div>
      <p className="mt-1.5 text-center text-[11px] text-gray-400">
        Enter para enviar · Shift+Enter para saltar línea
      </p>
    </div>
  );
}
