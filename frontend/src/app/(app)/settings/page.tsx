"use client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Settings, KeyRound, User, Monitor, Eye, EyeOff, CheckCircle2, XCircle, Loader2, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useTheme } from "next-themes";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { useApiKeyStatus } from "@/hooks/useApiKeyStatus";
import type { ApiKeyVerifyResult, LLMProvider } from "@/types/index";

// ── Schemas ────────────────────────────────────────────────────────────────────

const antSchema = z.object({
  api_key: z.string().min(20, "Clave muy corta").startsWith("sk-ant-", "Debe empezar por sk-ant-"),
});
const gemSchema = z.object({
  api_key: z.string().min(10, "Clave muy corta").refine(
    (v) => v.startsWith("AIza") || v.startsWith("AQ."),
    "Debe empezar por AIza o AQ."
  ),
});
type AntForm = z.infer<typeof antSchema>;
type GemForm = z.infer<typeof gemSchema>;

// ── Per-provider key card ──────────────────────────────────────────────────────

interface ProviderKeyCardProps {
  provider: LLMProvider;
  title: string;
  description: string;
  keyPrefix: string;
  placeholder: string;
  docsHref: string;
  docsLabel: string;
  badgeLabel: string;
  badgeVariant: "default" | "success";
  hasKey: boolean;
  isActive: boolean;
  onActivate: () => Promise<void>;
}

function ProviderKeyCard({
  provider, title, description, keyPrefix, placeholder,
  docsHref, docsLabel, badgeLabel, badgeVariant,
  hasKey, isActive, onActivate,
}: ProviderKeyCardProps) {
  const schema  = provider === "anthropic" ? antSchema : gemSchema;
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<AntForm | GemForm>({ resolver: zodResolver(schema) });

  const [showKey, setShowKey] = useState(false);
  const [verifyState, setVerifyState] = useState<"idle" | "loading" | "ok" | "fail">("idle");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const { refetch } = useApiKeyStatus();

  async function onSave({ api_key }: { api_key: string }) {
    try {
      await apiFetch("/user/api-key", {
        method: "POST",
        body: JSON.stringify({ provider, api_key }),
      });
      toast.success(`Key de ${title} guardada`);
      refetch();
      reset();
      setVerifyState("idle");
    } catch { toast.error("Error al guardar la key"); }
  }

  async function onDelete() {
    try {
      await apiFetch(`/user/api-key?provider=${provider}`, { method: "DELETE" });
      toast.success(`Key de ${title} eliminada`);
      refetch();
      setVerifyState("idle");
    } catch { toast.error("Error al eliminar la key"); }
  }

  async function onVerify() {
    setVerifyState("loading");
    setVerifyError(null);
    try {
      const result = await apiFetch<ApiKeyVerifyResult>(`/user/api-key/verify?provider=${provider}`);
      if (result.valid) {
        setVerifyState("ok");
      } else {
        setVerifyState("fail");
        setVerifyError(result.error ?? "Key inválida");
      }
    } catch {
      setVerifyState("fail");
      setVerifyError("Error al verificar");
    }
  }

  return (
    <div className={cn(
      "rounded-[--radius-xl] border p-5 transition-colors",
      isActive ? "border-violet-600/40 bg-violet-600/5" : "border-border bg-surface-2",
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-text-primary">{title}</p>
            <Badge variant={badgeVariant}>{badgeLabel}</Badge>
            {isActive && (
              <span className="rounded-full bg-violet-600/20 px-2 py-0.5 text-[10px] font-medium text-violet-400">
                ACTIVO
              </span>
            )}
          </div>
          <p className="text-xs text-text-muted mt-0.5">{description}</p>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-1.5 text-xs text-text-muted shrink-0">
          <div className={cn("h-2 w-2 rounded-full", hasKey ? "bg-success" : "bg-border")} />
          {hasKey ? "Configurado" : "Sin key"}
        </div>
      </div>

      {/* Save form */}
      <form onSubmit={handleSubmit(onSave as any)} className="space-y-3">
        <div className="space-y-1.5">
          <Label>{hasKey ? `Reemplazar key de ${title}` : `Añadir key de ${title}`}</Label>
          <div className="relative">
            <Input
              type={showKey ? "text" : "password"}
              placeholder={placeholder}
              className="pr-10 font-mono text-sm"
              autoComplete="off"
              {...register("api_key")}
            />
            <button
              type="button"
              onClick={() => setShowKey(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
            >
              {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {(errors as any).api_key && (
            <p className="text-xs text-error">{(errors as any).api_key.message}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={isSubmitting} size="sm">
            {isSubmitting ? "Guardando…" : "Guardar"}
          </Button>

          {hasKey && (
            <>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={verifyState === "loading"}
                onClick={onVerify}
              >
                {verifyState === "loading" ? (
                  <><Loader2 size={13} className="animate-spin" /> Verificando…</>
                ) : verifyState === "ok" ? (
                  <><CheckCircle2 size={13} className="text-success" /> Válida</>
                ) : verifyState === "fail" ? (
                  <><XCircle size={13} className="text-error" /> Inválida</>
                ) : (
                  "Verificar"
                )}
              </Button>
              <Button type="button" variant="danger" size="sm" onClick={onDelete}>
                Eliminar
              </Button>
              {!isActive && (
                <Button type="button" variant="outline" size="sm" onClick={onActivate}>
                  Usar como activo
                </Button>
              )}
            </>
          )}
        </div>

        {verifyState === "fail" && verifyError && (
          <p className="text-xs text-error">{verifyError}</p>
        )}
      </form>

      <a
        href={docsHref}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
      >
        {docsLabel} <ExternalLink size={11} />
      </a>
    </div>
  );
}

// ── API Key section ────────────────────────────────────────────────────────────

function ApiKeySection() {
  const { hasAnthropicKey, hasGeminiKey, activeProvider, refetch } = useApiKeyStatus();
  const queryClient = useQueryClient();

  async function setActive(provider: LLMProvider) {
    try {
      await apiFetch(`/user/api-key/active-provider?provider=${provider}`, { method: "POST" });
      queryClient.invalidateQueries({ queryKey: ["api-key-status"] });
      toast.success(`Proveedor activo: ${provider === "anthropic" ? "Anthropic Claude" : "Google Gemini"}`);
    } catch { toast.error("Error al cambiar proveedor"); }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <KeyRound size={16} className="text-violet-400" />
          <CardTitle>Mi API Key</CardTitle>
        </div>
        <CardDescription>
          EduAgent usa tu propia clave para generar respuestas. Las claves se cifran antes de guardarse.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ProviderKeyCard
          provider="anthropic"
          title="Anthropic Claude"
          description="claude-sonnet-4-6 · Máxima calidad y razonamiento"
          keyPrefix="sk-ant-"
          placeholder="sk-ant-api03-…"
          docsHref="https://console.anthropic.com/settings/keys"
          docsLabel="Obtener clave en console.anthropic.com"
          badgeLabel="Recomendado"
          badgeVariant="default"
          hasKey={hasAnthropicKey}
          isActive={activeProvider === "anthropic"}
          onActivate={() => setActive("anthropic")}
        />

        <Separator />

        <ProviderKeyCard
          provider="gemini"
          title="Google Gemini"
          description="gemini-2.0-flash · Gratuito en aistudio.google.com"
          keyPrefix="AIza|AQ."
          placeholder="AIzaSy… o AQ.A…"
          docsHref="https://aistudio.google.com/app/apikey"
          docsLabel="Obtener clave gratis en aistudio.google.com"
          badgeLabel="Gratis"
          badgeVariant="success"
          hasKey={hasGeminiKey}
          isActive={activeProvider === "gemini"}
          onActivate={() => setActive("gemini")}
        />
      </CardContent>
    </Card>
  );
}

// ── Appearance section ─────────────────────────────────────────────────────────

function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Monitor size={16} className="text-violet-400" />
          <CardTitle>Apariencia</CardTitle>
        </div>
        <CardDescription>Ajusta el tema de la interfaz.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-primary">Modo oscuro</p>
            <p className="text-xs text-text-muted">Usar fondo oscuro (#0F0F0F)</p>
          </div>
          <Switch
            checked={theme === "dark"}
            onCheckedChange={v => setTheme(v ? "dark" : "light")}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Profile section ────────────────────────────────────────────────────────────

const profileSchema = z.object({
  name: z.string().min(1, "El nombre no puede estar vacío").max(80),
  age: z.coerce.number().min(5, "Mínimo 5 años").max(120, "Máximo 120 años"),
});
type ProfileForm = z.infer<typeof profileSchema>;

function ProfileSection() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });

  async function onSave(data: ProfileForm) {
    try {
      await apiFetch("/user/me", { method: "PATCH", body: JSON.stringify(data) });
      toast.success("Perfil actualizado");
    } catch {
      toast.error("Error al guardar el perfil");
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <User size={16} className="text-violet-400" />
          <CardTitle>Mi perfil</CardTitle>
        </div>
        <CardDescription>Edita tu nombre y nivel educativo.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4 max-w-sm">
          <div className="space-y-1.5">
            <Label>Nombre</Label>
            <Input {...register("name")} placeholder="Tu nombre" />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Edad</Label>
            <Input {...register("age")} type="number" placeholder="Ej: 16" />
            {errors.age && <p className="text-xs text-red-500">{errors.age.message}</p>}
            <p className="text-xs text-text-muted">El nivel educativo se calcula automáticamente según tu edad.</p>
          </div>
          <Button type="submit" disabled={isSubmitting} size="sm">
            {isSubmitting ? "Guardando…" : "Guardar cambios"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <main className="flex h-full flex-col overflow-hidden bg-bg">
      <div className="border-b border-border bg-surface px-6 py-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <Settings size={18} className="text-violet-400" />
          <h1 className="text-lg font-semibold text-text-primary">Ajustes</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-2xl mx-auto">
          <Tabs defaultValue="apikey">
            <TabsList className="mb-6">
              <TabsTrigger value="apikey">API Keys</TabsTrigger>
              <TabsTrigger value="appearance">Apariencia</TabsTrigger>
              <TabsTrigger value="profile">Perfil</TabsTrigger>
            </TabsList>
            <TabsContent value="apikey"><ApiKeySection /></TabsContent>
            <TabsContent value="appearance"><AppearanceSection /></TabsContent>
            <TabsContent value="profile"><ProfileSection /></TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
}
