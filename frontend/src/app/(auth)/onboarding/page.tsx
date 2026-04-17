"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { GraduationCap, ExternalLink, CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import StepIndicator from "@/components/onboarding/StepIndicator";

const STEPS = ["Tu perfil", "API Key", "Aula virtual"];

const ageSchema = z.object({
  age: z.coerce.number().min(5, "Mínimo 5 años").max(99, "Máximo 99 años"),
});
const keySchema = z.object({
  api_key: z.string().min(20, "Clave inválida").startsWith("sk-ant-", "Debe empezar por sk-ant-"),
});

type AgeForm = z.infer<typeof ageSchema>;
type KeyForm  = z.infer<typeof keySchema>;

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

export default function OnboardingPage() {
  const router  = useRouter();
  const [step, setStep] = useState(0);
  const [dir, setDir]   = useState(1);

  const ageForm = useForm<AgeForm>({ resolver: zodResolver(ageSchema) });
  const keyForm = useForm<KeyForm>({ resolver: zodResolver(keySchema) });

  function next() { setDir(1); setStep((s) => s + 1); }
  function back() { setDir(-1); setStep((s) => s - 1); }

  async function submitAge({ age }: AgeForm) {
    try {
      await apiFetch("/user/profile", { method: "PATCH", body: JSON.stringify({ age }) });
      next();
    } catch { toast.error("Error al guardar la edad"); }
  }

  async function submitKey({ api_key }: KeyForm) {
    try {
      await apiFetch("/user/api-key", { method: "POST", body: JSON.stringify({ api_key }) });
      next();
    } catch { toast.error("Error al guardar la API key"); }
  }

  function skip() { next(); }
  function finish() { router.replace("/chat"); }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 py-12">
      {/* Logo */}
      <div className="mb-10 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600">
          <GraduationCap size={18} className="text-white" />
        </div>
        <span className="text-lg font-bold text-text-primary">EduAgent AI</span>
      </div>

      {/* Step indicator */}
      <div className="mb-10">
        <StepIndicator steps={STEPS} current={step} />
      </div>

      {/* Step content */}
      <div className="w-full max-w-md overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>
          {step === 0 && (
            <motion.div
              key="step-0"
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              <div className="rounded-[--radius-xl] border border-border bg-surface p-8">
                <h2 className="mb-1 text-2xl font-bold text-text-primary">¿Cuántos años tienes?</h2>
                <p className="mb-6 text-sm text-text-muted">
                  Adapto mi forma de explicar según tu edad.
                </p>
                <form onSubmit={ageForm.handleSubmit(submitAge)} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="age">Edad</Label>
                    <Input id="age" type="number" placeholder="Ej. 16" {...ageForm.register("age")} />
                    {ageForm.formState.errors.age && (
                      <p className="text-xs text-error">{ageForm.formState.errors.age.message}</p>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button type="submit" className="flex-1" disabled={ageForm.formState.isSubmitting}>
                      Continuar <ChevronRight size={16} />
                    </Button>
                    <Button type="button" variant="ghost" onClick={skip}>Saltar</Button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step-1"
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              <div className="rounded-[--radius-xl] border border-border bg-surface p-8">
                <h2 className="mb-1 text-2xl font-bold text-text-primary">Añade tu API Key</h2>
                <p className="mb-2 text-sm text-text-muted">
                  EduAgent usa tu propia clave de Anthropic para generar respuestas. No se comparte ni se expone en pantalla.
                </p>
                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-6 inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                >
                  Obtener clave gratis en console.anthropic.com
                  <ExternalLink size={12} />
                </a>
                <form onSubmit={keyForm.handleSubmit(submitKey)} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="api-key">API Key</Label>
                    <Input id="api-key" type="password" placeholder="sk-ant-api03-…" autoComplete="off" {...keyForm.register("api_key")} />
                    {keyForm.formState.errors.api_key && (
                      <p className="text-xs text-error">{keyForm.formState.errors.api_key.message}</p>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="ghost" size="icon" onClick={back}><ChevronLeft size={16} /></Button>
                    <Button type="submit" className="flex-1" disabled={keyForm.formState.isSubmitting}>
                      Guardar y continuar <ChevronRight size={16} />
                    </Button>
                    <Button type="button" variant="ghost" onClick={skip}>Saltar</Button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              <div className="rounded-[--radius-xl] border border-border bg-surface p-8">
                <h2 className="mb-1 text-2xl font-bold text-text-primary">Conecta tu aula virtual</h2>
                <p className="mb-6 text-sm text-text-muted">
                  Sincronizo tus deberes y materiales automáticamente. Puedes hacerlo más tarde en Ajustes.
                </p>
                <div className="space-y-3">
                  <button className="flex w-full items-center gap-4 rounded-[--radius-lg] border border-border bg-surface-2 p-4 text-left hover:border-violet-600/50 hover:bg-surface-3 transition-colors">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                      <span className="text-lg font-bold text-orange-400">M</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">Moodle</p>
                      <p className="text-xs text-text-muted">Configura en Ajustes → Aulas virtuales</p>
                    </div>
                  </button>
                  <button className="flex w-full items-center gap-4 rounded-[--radius-lg] border border-border bg-surface-2 p-4 text-left hover:border-violet-600/50 hover:bg-surface-3 transition-colors">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                      <span className="text-sm font-bold text-blue-400">GC</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">Google Classroom</p>
                      <p className="text-xs text-text-muted">Requiere OAuth en Ajustes</p>
                    </div>
                  </button>
                </div>
                <div className="mt-6 flex gap-2">
                  <Button type="button" variant="ghost" size="icon" onClick={back}><ChevronLeft size={16} /></Button>
                  <Button className="flex-1" onClick={finish}>
                    <CheckCircle2 size={16} />
                    Empezar a estudiar
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
