"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ExternalLink, CheckCircle2, ChevronRight, ChevronLeft, Eye, EyeOff,
} from "lucide-react";
import { ClaudeIcon, GeminiIcon, EduAgentMark } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import StepIndicator from "@/components/onboarding/StepIndicator";
import type { LLMProvider } from "@/types/index";

const STEPS = ["Tu perfil", "API Key", "Aula virtual"];

const ageSchema = z.object({
  age: z.coerce.number().min(5, "Mínimo 5 años").max(99, "Máximo 99 años"),
});
const anthropicSchema = z.object({
  api_key: z.string().min(20, "Clave inválida").startsWith("sk-ant-", "Debe empezar con sk-ant-"),
});
const geminiSchema = z.object({
  api_key: z.string().min(10, "Clave inválida").refine(
    (v) => v.startsWith("AIza") || v.startsWith("AQ."),
    "Debe empezar con AIza o AQ."
  ),
});

type AgeForm       = z.infer<typeof ageSchema>;
type AnthropicForm = z.infer<typeof anthropicSchema>;
type GeminiForm    = z.infer<typeof geminiSchema>;

const variants = {
  enter:  (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

// ── Provider card ──────────────────────────────────────────────────────────────

interface ProviderCardProps {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  badgeLabel: string;
  badgeVariant: "default" | "success";
  href: string;
  hrefLabel: string;
  showKey: boolean;
  onToggleKey: () => void;
  placeholder: string;
  error?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inputProps: any;
}

function ProviderCard({
  selected, onClick, icon, title, subtitle, badgeLabel, badgeVariant,
  href, hrefLabel, showKey, onToggleKey, placeholder, error, inputProps,
}: ProviderCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-[--radius-xl] border p-4 transition-all",
        selected
          ? "border-violet-600/60 bg-violet-600/5 ring-1 ring-violet-600/30"
          : "border-border bg-surface-2 hover:border-violet-600/30 hover:bg-surface-3",
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <p className="font-semibold text-text-primary leading-tight">{title}</p>
            <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>
          </div>
        </div>
        <Badge variant={badgeVariant}>{badgeLabel}</Badge>
      </div>

      {selected && (
        <div className="space-y-2" onClick={e => e.stopPropagation()}>
          <div className="relative">
            <Input
              type={showKey ? "text" : "password"}
              placeholder={placeholder}
              className="pr-10 font-mono text-sm"
              autoComplete="off"
              {...inputProps}
            />
            <button
              type="button"
              onClick={onToggleKey}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
            >
              {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {error && <p className="text-xs text-error">{error}</p>}
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            {hrefLabel} <ExternalLink size={11} />
          </a>
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [dir, setDir]   = useState(1);

  // Step 2 state
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider>("anthropic");
  const [showAntKey, setShowAntKey] = useState(false);
  const [showGemKey, setShowGemKey] = useState(false);

  const ageForm = useForm<AgeForm>({ resolver: zodResolver(ageSchema) });
  const antForm = useForm<AnthropicForm>({ resolver: zodResolver(anthropicSchema) });
  const gemForm = useForm<GeminiForm>({ resolver: zodResolver(geminiSchema) });

  function next() { setDir(1); setStep(s => s + 1); }
  function back() { setDir(-1); setStep(s => s - 1); }

  async function submitAge({ age }: AgeForm) {
    try {
      await apiFetch("/user/profile", { method: "PATCH", body: JSON.stringify({ age }) });
      next();
    } catch { toast.error("Error al guardar la edad"); }
  }

  async function submitKey() {
    try {
      if (selectedProvider === "anthropic") {
        const valid = await antForm.trigger();
        if (!valid) return;
        const { api_key } = antForm.getValues();
        await apiFetch("/user/api-key", {
          method: "POST",
          body: JSON.stringify({ provider: "anthropic", api_key }),
        });
      } else {
        const valid = await gemForm.trigger();
        if (!valid) return;
        const { api_key } = gemForm.getValues();
        await apiFetch("/user/api-key", {
          method: "POST",
          body: JSON.stringify({ provider: "gemini", api_key }),
        });
      }
      next();
    } catch { toast.error("Error al guardar la API key"); }
  }

  function finish() { router.replace("/chat"); }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 py-12">
      {/* Logo */}
      <div className="mb-10 flex flex-col items-center gap-2">
        <EduAgentMark size={52} />
        <div className="text-center">
          <p className="text-xl font-bold text-text-primary tracking-tight">
            EduAgent <span className="text-violet-400">AI</span>
          </p>
          <p className="text-xs text-text-muted mt-0.5">Tu tutor inteligente</p>
        </div>
      </div>

      <div className="mb-10">
        <StepIndicator steps={STEPS} current={step} />
      </div>

      <div className="w-full max-w-md overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>

          {/* ── Step 0: Age ─────────────────────────────────────── */}
          {step === 0 && (
            <motion.div key="step-0" custom={dir} variants={variants}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}>
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
                    <Button type="button" variant="ghost" onClick={next}>Saltar</Button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* ── Step 1: API Key ──────────────────────────────────── */}
          {step === 1 && (
            <motion.div key="step-1" custom={dir} variants={variants}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}>
              <div className="rounded-[--radius-xl] border border-border bg-surface p-8">
                <h2 className="mb-1 text-2xl font-bold text-text-primary">Elige tu IA</h2>
                <p className="mb-5 text-sm text-text-muted">
                  EduAgent usa tu propia API key. Selecciona el proveedor y pega tu clave.
                </p>

                <div className="space-y-3">
                  <ProviderCard
                    selected={selectedProvider === "anthropic"}
                    onClick={() => setSelectedProvider("anthropic")}
                    icon={<ClaudeIcon size={36} />}
                    title="Claude"
                    subtitle="claude-sonnet-4-6 · Más potente y preciso"
                    badgeLabel="Recomendado"
                    badgeVariant="default"
                    href="https://console.anthropic.com/settings/keys"
                    hrefLabel="Obtener clave en console.anthropic.com"
                    showKey={showAntKey}
                    onToggleKey={() => setShowAntKey(v => !v)}
                    placeholder="sk-ant-api03-…"
                    error={antForm.formState.errors.api_key?.message}
                    inputProps={antForm.register("api_key")}
                  />

                  <ProviderCard
                    selected={selectedProvider === "gemini"}
                    onClick={() => setSelectedProvider("gemini")}
                    icon={<GeminiIcon size={36} />}
                    title="Gemini"
                    subtitle="gemini-2.0-flash · Gratis en AI Studio"
                    badgeLabel="Gratis"
                    badgeVariant="success"
                    href="https://aistudio.google.com/app/apikey"
                    hrefLabel="Obtener clave gratis en aistudio.google.com"
                    showKey={showGemKey}
                    onToggleKey={() => setShowGemKey(v => !v)}
                    placeholder="AIzaSy… o AQ.A…"
                    error={gemForm.formState.errors.api_key?.message}
                    inputProps={gemForm.register("api_key")}
                  />
                </div>

                <div className="mt-5 flex gap-2">
                  <Button type="button" variant="ghost" size="icon" onClick={back}>
                    <ChevronLeft size={16} />
                  </Button>
                  <Button className="flex-1" onClick={submitKey}>
                    Guardar y continuar <ChevronRight size={16} />
                  </Button>
                  <Button type="button" variant="ghost" onClick={next}>Saltar</Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: LMS ─────────────────────────────────────── */}
          {step === 2 && (
            <motion.div key="step-2" custom={dir} variants={variants}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}>
              <div className="rounded-[--radius-xl] border border-border bg-surface p-8">
                <h2 className="mb-1 text-2xl font-bold text-text-primary">Conecta tu aula virtual</h2>
                <p className="mb-6 text-sm text-text-muted">
                  Sincronizo tus deberes y materiales automáticamente. Puedes hacerlo más tarde en Ajustes.
                </p>
                <div className="space-y-3">
                  <div className="flex w-full items-center gap-4 rounded-[--radius-lg] border border-border bg-surface-2 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
                      {/* Moodle M icon */}
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M3 18V8l4.5 5 4.5-5v10M12 18V8l4.5 5 4.5-5v10" stroke="#F4832A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">Moodle</p>
                      <p className="text-xs text-text-muted">Configura en Ajustes → Aula Virtual</p>
                    </div>
                  </div>
                  <div className="flex w-full items-center gap-4 rounded-[--radius-lg] border border-border bg-surface-2 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
                      {/* Google Classroom icon */}
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <rect x="2" y="4" width="20" height="16" rx="2" fill="#1E8E3E" opacity="0.15"/>
                        <rect x="2" y="4" width="20" height="16" rx="2" stroke="#1E8E3E" strokeWidth="1.5"/>
                        <circle cx="12" cy="11" r="3" fill="#1E8E3E"/>
                        <path d="M6 17c0-2 2.7-3 6-3s6 1 6 3" stroke="#1E8E3E" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">Google Classroom</p>
                      <p className="text-xs text-text-muted">Configura en Ajustes → Aula Virtual</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex gap-2">
                  <Button type="button" variant="ghost" size="icon" onClick={back}>
                    <ChevronLeft size={16} />
                  </Button>
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
