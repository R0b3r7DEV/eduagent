"use client";
import { useState, useRef, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { ArrowUp, Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MAX_CHARS = 4000;

interface Props {
  onSend: (text: string) => void;
  onUpload?: (file: File) => void;
  disabled?: boolean;
}

export default function InputBar({ onSend, onUpload, disabled }: Props) {
  const [text, setText]           = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const ref = useRef<HTMLTextAreaElement>(null);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: { "application/pdf": [], "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [], "text/plain": [] },
    maxSize: 50 * 1024 * 1024,
    noClick: true,
    noKeyboard: true,
    onDrop: (accepted, rejected) => {
      if (rejected.length > 0) { toast.error("Solo PDF, DOCX o TXT hasta 50 MB"); return; }
      if (accepted[0]) setAttachment(accepted[0]);
    },
  });

  const submit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    if (attachment && onUpload) onUpload(attachment);
    onSend(trimmed);
    setText("");
    setAttachment(null);
    if (ref.current) ref.current.style.height = "auto";
  }, [text, disabled, attachment, onUpload, onSend]);

  const remaining = MAX_CHARS - text.length;

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-t border-border bg-surface px-4 py-3 transition-colors",
        isDragActive && "bg-violet-600/5 border-violet-600/40"
      )}
    >
      {/* Attachment badge */}
      {attachment && (
        <div className="mb-2 flex items-center gap-2 rounded-[--radius] border border-border bg-surface-2 px-3 py-1.5 w-fit">
          <Paperclip size={12} className="text-violet-400" />
          <span className="text-xs text-text-secondary">{attachment.name}</span>
          <button onClick={() => setAttachment(null)} className="text-text-muted hover:text-error transition-colors ml-1">
            <X size={12} />
          </button>
        </div>
      )}

      <div
        className={cn(
          "flex items-end gap-2 rounded-[--radius-lg] border bg-bg px-3 py-2.5 transition-colors",
          isDragActive ? "border-violet-500" : "border-border focus-within:border-violet-500/60 focus-within:ring-1 focus-within:ring-violet-500/20"
        )}
      >
        {/* Attach button */}
        <button
          type="button"
          onClick={open}
          disabled={disabled}
          className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[--radius-sm] text-text-muted hover:bg-surface-2 hover:text-text-secondary transition-colors disabled:opacity-40"
        >
          <Paperclip size={15} />
        </button>

        {/* Textarea */}
        <textarea
          ref={ref}
          value={text}
          onChange={e => {
            if (e.target.value.length > MAX_CHARS) return;
            setText(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
          }}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
          placeholder={disabled ? "EduAgent está respondiendo…" : isDragActive ? "Suelta el archivo aquí…" : "Pregunta algo sobre tus apuntes…"}
          rows={1}
          disabled={disabled}
          className="flex-1 resize-none bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none disabled:cursor-not-allowed"
          style={{ maxHeight: 160 }}
        />

        {/* Char counter + send */}
        <div className="mb-0.5 flex items-center gap-2 shrink-0">
          {text.length > MAX_CHARS * 0.8 && (
            <span className={cn("text-[11px] tabular-nums", remaining < 200 ? "text-error" : "text-text-muted")}>
              {remaining}
            </span>
          )}
          <button
            onClick={submit}
            disabled={!text.trim() || disabled}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-[--radius-sm] transition-all",
              text.trim() && !disabled
                ? "bg-violet-600 text-white hover:bg-violet-700 shadow-sm"
                : "bg-surface-2 text-text-muted cursor-not-allowed"
            )}
          >
            <ArrowUp size={15} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <input {...getInputProps()} />
      <p className="hidden md:block mt-1.5 text-center text-[11px] text-text-muted">
        Enter para enviar · Shift+Enter para nueva línea
      </p>
    </div>
  );
}
