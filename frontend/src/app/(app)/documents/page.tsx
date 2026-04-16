"use client";
import { useEffect, useRef, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { getAccessToken } from "@/lib/supabase";
import type { Document } from "@/types/index";
import { FileText, Upload, RefreshCw, AlertCircle, CheckCircle, Clock, XCircle, FileUp } from "lucide-react";

const STATUS_ICON: Record<string, React.ReactNode> = {
  ready:      <CheckCircle size={14} className="text-green-500" />,
  processing: <RefreshCw   size={14} className="text-blue-500 animate-spin" />,
  pending:    <Clock       size={14} className="text-yellow-500" />,
  error:      <XCircle     size={14} className="text-red-500" />,
};
const STATUS_LABEL: Record<string, string> = {
  ready: "Listo", processing: "Procesando", pending: "En cola", error: "Error",
};

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b/1024).toFixed(0)} KB`;
  return `${(b/1048576).toFixed(1)} MB`;
}

export default function DocumentsPage() {
  const [docs, setDocs]           = useState<Document[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver]   = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      const data = await apiFetch<Document[]>("/documents");
      setDocs(data);
    } catch {
      setError("No se pudieron cargar los documentos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function uploadFile(file: File) {
    if (uploading) return;
    setUploading(true); setError(null);
    try {
      const token = await getAccessToken();
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/v1/documents/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => null));
      await load();
    } catch (err) {
      setError(err instanceof ApiError && err.status === 413
        ? "Archivo demasiado grande (máx. 50 MB)."
        : "Error al subir el archivo.");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  return (
    <main className="flex flex-col h-full overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileText size={20} className="text-blue-600" />
            <h1 className="text-lg font-semibold text-gray-900">Documentos</h1>
            {!loading && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                {docs.length}
              </span>
            )}
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-40"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Actualizar
          </button>
        </div>
      </div>

      <div className="flex-1 px-6 py-6 space-y-5">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {/* Upload zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
            dragOver
              ? "border-blue-400 bg-blue-50"
              : uploading
              ? "border-gray-200 bg-gray-50 cursor-not-allowed"
              : "border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/40"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,.txt"
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ""; }}
          />
          <div className="flex flex-col items-center gap-2">
            {uploading ? (
              <>
                <RefreshCw size={28} className="text-blue-500 animate-spin" />
                <p className="text-sm font-medium text-blue-600">Subiendo…</p>
              </>
            ) : (
              <>
                <FileUp size={28} className={dragOver ? "text-blue-500" : "text-gray-400"} />
                <p className="text-sm font-medium text-gray-700">
                  Arrastra un archivo o{" "}
                  <span className="text-blue-600 underline underline-offset-2">haz click para seleccionar</span>
                </p>
                <p className="text-xs text-gray-400">PDF, DOCX, TXT · Máx. 50 MB</p>
              </>
            )}
          </div>
        </div>

        {/* Document list */}
        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-gray-200 animate-pulse" />)}
          </div>
        ) : docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText size={36} className="mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">Sin documentos aún</p>
            <p className="mt-1 text-sm text-gray-400">Sube tus apuntes y el agente los usará para responderte.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {docs.map(doc => (
              <div
                key={doc.id}
                className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                  <FileText size={18} className="text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-gray-800">{doc.filename}</p>
                  <p className="text-xs text-gray-400">
                    {doc.fileType?.toUpperCase()}
                    {doc.chunkCount != null && ` · ${doc.chunkCount} fragmentos`}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  {STATUS_ICON[doc.status]}
                  <span>{STATUS_LABEL[doc.status] ?? doc.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
