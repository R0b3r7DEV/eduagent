"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import type { ApiKeyStatus } from "@/types/index";

export default function ApiKeyForm() {
  const [status, setStatus] = useState<ApiKeyStatus | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<ApiKeyStatus>("/user/api-key/status")
      .then(setStatus)
      .catch(() => setError("No se pudo comprobar el estado de la API key."));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      await apiFetch("/user/api-key", {
        method: "POST",
        body: JSON.stringify({ api_key: keyInput }),
      });
      setSuccess("API key guardada correctamente.");
      setKeyInput("");
      setStatus({ has_key: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        setError("La key no es válida. Debe empezar por sk-ant-…");
      } else {
        setError("Error al guardar la API key.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setError(null);
    setSuccess(null);
    setDeleting(true);
    try {
      await apiFetch("/user/api-key", { method: "DELETE" });
      setSuccess("API key eliminada.");
      setStatus({ has_key: false });
    } catch {
      setError("Error al eliminar la API key.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-1 text-lg font-semibold text-gray-900">Mi API Key de Anthropic</h2>
      <p className="mb-4 text-sm text-gray-500">
        EduAgent usa tu propia key para las conversaciones. Nunca se muestra en pantalla tras
        guardarla.
      </p>

      {/* Status badge */}
      {status && (
        <div className="mb-4">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              status.has_key
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {status.has_key ? "Key guardada y activa" : "Sin key — el chat no funcionará"}
          </span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave} className="flex flex-col gap-3">
        <div>
          <label htmlFor="api-key" className="mb-1 block text-sm font-medium text-gray-700">
            {status?.has_key ? "Reemplazar API key" : "Introducir API key"}
          </label>
          <input
            id="api-key"
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="sk-ant-api03-…"
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm
                       focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-400">
            Obtén tu key gratuita en{" "}
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-600"
            >
              console.anthropic.com → API Keys
            </a>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving || keyInput.length < 20}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white
                       hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar key"}
          </button>

          {status?.has_key && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium
                         text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleting ? "Eliminando…" : "Eliminar key"}
            </button>
          )}
        </div>
      </form>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {success && <p className="mt-3 text-sm text-green-600">{success}</p>}
    </div>
  );
}
