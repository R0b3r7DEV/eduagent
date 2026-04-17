"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { GraduationCap, Brain, BookOpen, Target, Eye, EyeOff } from "lucide-react";

const schema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});
type FormData = z.infer<typeof schema>;

const FEATURES = [
  { icon: Brain,    text: "IA adaptada a tu nivel educativo"    },
  { icon: BookOpen, text: "Conecta con Moodle y Google Classroom" },
  { icon: Target,   text: "Anti-trampa: aprende de verdad"      },
];

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode]         = useState<"login" | "signup">("login");
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit({ email, password }: FormData) {
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { toast.error(error.message); return; }
      router.replace("/chat");
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) { toast.error(error.message); return; }
      toast.success("Revisa tu email para confirmar el registro.");
    }
  }

  async function handleGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) toast.error(error.message);
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Left panel ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-violet-900 via-violet-800 to-indigo-900 p-12 text-white"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
            <GraduationCap size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">EduAgent AI</span>
        </div>

        <div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-4 text-4xl font-bold leading-tight"
          >
            Estudia más inteligente,<br />no más duro.
          </motion.h1>
          <p className="mb-10 text-violet-200 text-lg leading-relaxed">
            Un agente de IA que conoce tus apuntes, tus deberes y tu nivel. Para que puedas centrarte en aprender.
          </p>
          <div className="space-y-4">
            {FEATURES.map(({ icon: Icon, text }, i) => (
              <motion.div
                key={text}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon size={16} className="text-violet-200" />
                </div>
                <span className="text-sm text-violet-100">{text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="text-xs text-violet-400">© 2026 EduAgent AI</p>
      </motion.div>

      {/* ── Right panel ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex w-full lg:w-1/2 items-center justify-center bg-bg px-8 py-12"
      >
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
              <GraduationCap size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold text-text-primary">EduAgent AI</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="mb-1 text-2xl font-bold text-text-primary">
              {mode === "login" ? "Bienvenido de nuevo" : "Crear cuenta"}
            </h2>
            <p className="mb-8 text-sm text-text-muted">
              {mode === "login" ? "Accede a tu asistente educativo." : "Empieza a estudiar de forma inteligente."}
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  autoComplete="email"
                  {...register("email")}
                />
                {errors.email && <p className="text-xs text-error">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    className="pr-10"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-error">{errors.password.message}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting} size="lg">
                {isSubmitting ? "Cargando…" : mode === "login" ? "Entrar" : "Crear cuenta"}
              </Button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-text-muted">o continúa con</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <Button variant="outline" className="w-full" size="lg" onClick={handleGoogle}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continuar con Google
            </Button>

            <p className="mt-6 text-center text-sm text-text-muted">
              {mode === "login" ? "¿Sin cuenta? " : "¿Ya tienes cuenta? "}
              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="font-semibold text-violet-400 hover:text-violet-300 transition-colors"
              >
                {mode === "login" ? "Regístrate gratis" : "Inicia sesión"}
              </button>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
