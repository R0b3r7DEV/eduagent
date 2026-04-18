"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = params.get("code");
    const err = params.get("error");

    if (err || !code) {
      setError(err === "access_denied" ? "Acceso denegado por el usuario." : "Error en la autenticación.");
      return;
    }

    const redirectUri = `${window.location.origin}/lms/google-callback`;

    apiFetch("/lms/connect/google", {
      method: "POST",
      body: JSON.stringify({ code, redirect_uri: redirectUri }),
    })
      .then(() => router.replace("/lms?connected=google"))
      .catch((e) => {
        const msg = e instanceof ApiError ? (e.body as any)?.detail : "Error al guardar la conexión.";
        setError(msg);
      });
  }, [params, router]);

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 text-center p-6">
        <p className="text-red-500 font-medium">{error}</p>
        <button
          onClick={() => router.replace("/lms")}
          className="text-sm text-violet-400 underline"
        >
          Volver a Aula Virtual
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3">
      <Loader2 className="animate-spin text-violet-400" size={28} />
      <p className="text-sm text-text-muted">Conectando con Google Classroom…</p>
    </div>
  );
}
