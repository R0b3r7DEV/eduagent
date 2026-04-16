"use client";

import { useRef, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";

interface Props {
  onSaved: () => void;
  onClose: () => void;
}

export default function ApiKeyModal({ onSaved, onClose }: Props) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await apiFetch("/user/api-key", {
        method: "POST",
        body: JSON.stringify({ api_key: value.trim() }),
      });
      onSaved();
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        setError("La key no es válida. Debe empezar por sk-ant-…");
      } else {
        setError("No se pudo guardar la key. Inténtalo de nuevo.");
      }
    } finally {
      setSaving(false);
    }
  }

  // Close on backdrop click
  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleBackdrop}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Añadir API key de Anthropic</h2>
            <p className="mt-1 text-sm text-gray-500">
              Tu key se cifra antes de guardarse y nunca se muestra en pantalla.
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="modal-api-key" className="mb-1 block text-sm font-medium text-gray-700">
              API key
            </label>
            <input
              id="modal-api-key"
              ref={inputRef}
              type="password"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="sk-ant-api03-…"
              autoComplete="off"
              spellCheck={false}
              autoFocus
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm
                         focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between gap-3">
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 underline hover:text-blue-800"
            >
              Obtener key gratuita →
            </a>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600
                           hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || value.trim().length < 20}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white
                           hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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
