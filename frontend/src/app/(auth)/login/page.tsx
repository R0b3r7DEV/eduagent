"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.replace("/chat");
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    setError("Revisa tu email para confirmar el registro.");
    setLoading(false);
  }

  return (
    <div className="rounded-2xl bg-white p-8 shadow-lg">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">EduAgent AI</h1>
      <p className="mb-6 text-sm text-gray-500">Tu asistente educativo inteligente</p>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}

      <form className="space-y-4">
        <input
          type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-2">
          <button onClick={handleLogin} disabled={loading}
            className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            Entrar
          </button>
          <button onClick={handleSignUp} disabled={loading}
            className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            Registrarse
          </button>
        </div>
      </form>

      <div className="my-4 flex items-center gap-3">
        <div className="flex-1 border-t border-gray-200" />
        <span className="text-xs text-gray-400">o</span>
        <div className="flex-1 border-t border-gray-200" />
      </div>

      <button onClick={handleGoogle}
        className="w-full rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
        Continuar con Google
      </button>
    </div>
  );
}
