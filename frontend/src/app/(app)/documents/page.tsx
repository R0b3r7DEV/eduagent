"use client";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { useDocuments } from "@/hooks/useDocuments";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import type { Document } from "@/types/index";
import {
  FileText, FileUp, Search, RefreshCw, AlertCircle,
  CheckCircle2, Clock, XCircle, Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const STATUS_ICON = {
  ready:      <CheckCircle2 size={14} className="text-success" />,
  processing: <Loader2      size={14} className="text-violet-400 animate-spin" />,
  pending:    <Clock        size={14} className="text-warning" />,
  error:      <XCircle      size={14} className="text-error" />,
};
const STATUS_LABEL: Record<string, string> = {
  ready: "Listo", processing: "Procesando", pending: "En cola", error: "Error",
};

function DocumentRow({ doc }: { doc: Document }) {
  return (
    <div className="flex items-center gap-3 rounded-[--radius-lg] border border-border bg-surface p-4 hover:border-border/80 transition-colors">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[--radius-md] bg-violet-600/10">
        <FileText size={17} className="text-violet-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-text-primary">{doc.filename}</p>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-text-muted">
          <span>{doc.fileType?.toUpperCase()}</span>
          {doc.chunkCount != null && <><span>·</span><span>{doc.chunkCount} fragmentos RAG</span></>}
        </div>
        {doc.status === "processing" && (
          <Progress value={undefined} className="mt-1.5 h-1" />
        )}
      </div>
      <div className="flex items-center gap-1.5 text-xs text-text-muted shrink-0">
        {STATUS_ICON[doc.status]}
        <span>{STATUS_LABEL[doc.status] ?? doc.status}</span>
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  const { documents, isLoading, upload } = useDocuments();
  const [search, setSearch] = useState("");

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/pdf": [],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [],
      "text/plain": [],
    },
    maxSize: 50 * 1024 * 1024,
    onDrop: (accepted) => { if (accepted[0]) upload.mutate(accepted[0]); },
    onDropRejected: () => { /* toast handled in hook */ },
  });

  const filtered = documents.filter(d =>
    search === "" || d.filename.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="flex h-full flex-col overflow-hidden bg-bg">
      {/* Header */}
      <div className="border-b border-border bg-surface px-6 py-4 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <FileText size={18} className="text-violet-400" />
            <h1 className="text-lg font-semibold text-text-primary">Documentos</h1>
            {!isLoading && (
              <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-text-muted">{documents.length}</span>
            )}
          </div>
        </div>
        <div className="relative max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <Input
            placeholder="Buscar documentos…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {/* Upload zone */}
        <div
          {...getRootProps()}
          className={cn(
            "cursor-pointer rounded-[--radius-xl] border-2 border-dashed px-6 py-10 text-center transition-all",
            isDragActive || upload.isPending
              ? "border-violet-500 bg-violet-600/5"
              : "border-border hover:border-violet-600/40 hover:bg-surface"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            {upload.isPending ? (
              <>
                <Loader2 size={28} className="text-violet-400 animate-spin" />
                <p className="text-sm font-medium text-violet-400">Subiendo…</p>
              </>
            ) : (
              <>
                <FileUp size={28} className={isDragActive ? "text-violet-400" : "text-text-muted"} />
                <p className="text-sm font-medium text-text-secondary">
                  Arrastra un archivo o{" "}
                  <span className="text-violet-400 underline underline-offset-2">haz click</span>
                </p>
                <p className="text-xs text-text-muted">PDF, DOCX, TXT · Máx. 50 MB</p>
              </>
            )}
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText size={32} className="mb-3 text-border" />
            <p className="font-medium text-text-secondary">Sin documentos</p>
            <p className="mt-1 text-sm text-text-muted">
              {search ? "Prueba otra búsqueda." : "Sube tus apuntes para activar el RAG."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(d => <DocumentRow key={d.id} doc={d} />)}
          </div>
        )}
      </div>
    </main>
  );
}
