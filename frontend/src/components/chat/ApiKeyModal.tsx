"use client";

import { useRef, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { ClaudeIcon, GeminiIcon } from "@/components/icons";
import { X, ExternalLink, Lock } from "lucide-react";

interface Props {
  onSaved: () => void;
  onClose: () => void;
}

type Provider = "anthropic" | "gemini";

const PROVIDERS: {
  id: Provider;
  label: string;
  sublabel: string;
  placeholder: string;
  hint: string;
  url: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge: string;
  badgeColor: string;
}[] = [
  {
    id: "anthropic",
    label: "Claude",
    sublabel: "Anthropic · claude-sonnet-4-6",
    placeholder: "sk-ant-api03-…",
    hint: "Empieza por sk-ant-",
    url: "https://console.anthropic.com/settings/keys",
    icon: ClaudeIcon,
    badge: "Recomendado",
    badgeColor: "bg-amber-100 text-amber-700",
  },
  {
    id: "gemini",
    label: "Gemini",
    sublabel: "Google · gemini-2.0-flash",
    placeholder: "AIzaSy… o AQ.A…",
    hint: "Empieza por AIza o AQ.",
    url: "https://aistudio.google.com/app/apikey",
    icon: GeminiIcon,
    badge: "Gratis",
    badgeColor: "bg-blue-100 text-blue-700",
  },
];

export default function ApiKeyModal({ onSaved, onClose }: Props) {
  const [provider, setProvider] = useState<Provider>("anthropic");
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const current = PROVIDERS.find((p) => p.id === provider)!;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await apiFetch("/user/api-key", {
        method: "POST",
        body: JSON.stringify({ api_key: value.trim(), provider }),
      });
      onSaved();
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        setError(`La key no es válida. ${current.hint}.`);
      } else {
        setError("No se pudo guardar la key. Inténtalo de nuevo.");
      }
    } finally {
      setSaving(false);
    }
  }

  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  function handleProviderChange(p: Provider) {
    setProvider(p);
    setValue("");
    setError(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleBackdrop}
    >
      <div className="w-full max-w-md rounded-2xl bg-surface border border-border shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-text-primary">Añadir API key</h2>
            <p className="mt-0.5 text-xs text-text-muted flex items-center gap-1">
              <Lock size={10} />
              Se cifra antes de guardarse · nunca visible en pantalla
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted hover:bg-surface-2 hover:text-text-secondary transition-colors"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Provider selector */}
        <div className="px-5 pt-4 pb-2">
          <p className="mb-2.5 text-xs font-medium text-text-muted uppercase tracking-wider">Proveedor</p>
          <div className="grid grid-cols-2 gap-2">
            {PROVIDERS.map((p) => {
              const Icon = p.icon;
              const active = provider === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleProviderChange(p.id)}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${
                    active
                      ? "border-violet-500/50 bg-violet-600/8 ring-1 ring-violet-500/20"
                      : "border-border hover:border-border hover:bg-surface-2"
                  }`}
                >
                  <Icon size={28} />
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold leading-tight ${active ? "text-text-primary" : "text-text-secondary"}`}>
                      {p.label}
                    </p>
                    <span className={`mt-0.5 inline-block rounded-full px-1.5 py-px text-[10px] font-medium ${p.badgeColor}`}>
                      {p.badge}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 pb-5 pt-3 space-y-3">
          <div>
            <label htmlFor="modal-api-key" className="mb-1.5 flex items-center gap-2 text-sm font-medium text-text-secondary">
              <current.icon size={16} />
              API key de {current.label}
            </label>
            <input
              id="modal-api-key"
              ref={inputRef}
              type="password"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={current.placeholder}
              autoComplete="off"
              spellCheck={false}
              autoFocus
              className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 font-mono text-sm text-text-primary placeholder:text-text-muted
                         focus:border-violet-500/60 focus:outline-none focus:ring-1 focus:ring-violet-500/20 transition-colors"
            />
            <p className="mt-1 text-[11px] text-text-muted">{current.hint}</p>
          </div>

          {error && (
            <p className="rounded-lg bg-error/10 border border-error/20 px-3 py-2 text-sm text-error">{error}</p>
          )}

          <div className="flex items-center justify-between gap-3 pt-1">
            <a
              href={current.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              Obtener key <ExternalLink size={11} />
            </a>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-surface-2 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || value.trim().length < 10}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white
                           hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
