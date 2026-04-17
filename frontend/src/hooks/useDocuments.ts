"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { getAccessToken } from "@/lib/supabase";
import { toast } from "sonner";
import type { Document } from "@/types/index";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function useDocuments() {
  const qc = useQueryClient();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: () => apiFetch<Document[]>("/documents"),
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const token = await getAccessToken();
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API}/api/v1/documents/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail ?? "Upload failed");
      }
      return res.json() as Promise<Document>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Documento subido correctamente");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return { documents, isLoading, upload };
}
