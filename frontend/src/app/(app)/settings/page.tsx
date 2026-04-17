"use client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Settings, KeyRound, User, Monitor, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useTheme } from "next-themes";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { apiFetch } from "@/lib/api";
import { useApiKeyStatus } from "@/hooks/useApiKeyStatus";

const keySchema = z.object({
  api_key: z.string().min(20, "Clave muy corta").startsWith("sk-ant-", "Debe empezar por sk-ant-"),
});
type KeyForm = z.infer<typeof keySchema>;

function ApiKeySection() {
  const { hasKey, refetch } = useApiKeyStatus();
  const [showKey, setShowKey] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<KeyForm>({
    resolver: zodResolver(keySchema),
  });

  async function onSave({ api_key }: KeyForm) {
    try {
      await apiFetch("/user/api-key", { method: "POST", body: JSON.stringify({ api_key }) });
      toast.success("API key guardada");
      refetch();
      reset();
    } catch { toast.error("Error al guardar la API key"); }
  }

  async function onDelete() {
    try {
      await apiFetch("/user/api-key", { method: "DELETE" });
      toast.success("API key eliminada");
      refetch();
    } catch { toast.error("Error al eliminar la API key"); }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <KeyRound size={16} className="text-violet-400" />
          <CardTitle>API Key de Anthropic</CardTitle>
        </div>
        <CardDescription>
          EduAgent usa tu propia clave para generar respuestas. Nunca se muestra en pantalla tras guardarla.
          <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer"
            className="ml-1 text-violet-400 hover:underline">
            Obtener clave →
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className={`h-2.5 w-2.5 rounded-full ${hasKey ? "bg-success" : "bg-error"}`} />
          <span className="text-sm text-text-secondary">
            {hasKey ? "Key configurada y activa" : "Sin key — el chat no funciona"}
          </span>
        </div>

        <form onSubmit={handleSubmit(onSave)} className="space-y-3">
          <div className="space-y-1.5">
            <Label>{hasKey ? "Reemplazar API key" : "Añadir API key"}</Label>
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                placeholder="sk-ant-api03-…"
                className="pr-10 font-mono"
                autoComplete="off"
                {...register("api_key")}
              />
              <button type="button" onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors">
                {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.api_key && <p className="text-xs text-error">{errors.api_key.message}</p>}
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting} size="sm">
              {isSubmitting ? "Guardando…" : "Guardar key"}
            </Button>
            {hasKey && (
              <Button type="button" variant="danger" size="sm" onClick={onDelete}>
                Eliminar key
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

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
            onCheckedChange={(v) => setTheme(v ? "dark" : "light")}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileSection() {
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
        <p className="text-sm text-text-muted">Sección de perfil — próximamente.</p>
      </CardContent>
    </Card>
  );
}

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
              <TabsTrigger value="apikey">API Key</TabsTrigger>
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
