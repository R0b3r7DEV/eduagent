"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch, ApiError } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { School, RefreshCw, Trash2, CheckCircle2, Clock } from "lucide-react";

interface LMSConnection {
  id: string;
  provider: string;
  config: { base_url?: string } | null;
  last_synced_at: string | null;
  is_active: boolean;
}

function formatDate(iso: string | null) {
  if (!iso) return "Nunca";
  return new Date(iso).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" });
}

export default function LMSPage() {
  const qc = useQueryClient();
  const [moodleUrl, setMoodleUrl] = useState("");
  const [moodleToken, setMoodleToken] = useState("");
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const { data: connections = [], isLoading } = useQuery<LMSConnection[]>({
    queryKey: ["lms-status"],
    queryFn: () => apiFetch("/lms/status"),
  });

  const connectMutation = useMutation({
    mutationFn: (body: { base_url: string; token: string }) =>
      apiFetch("/lms/connect/moodle", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (data: any) => {
      toast.success(`Conectado a ${data.site_name ?? "Moodle"}`);
      setMoodleUrl("");
      setMoodleToken("");
      qc.invalidateQueries({ queryKey: ["lms-status"] });
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? (err.body as any)?.detail : "Error al conectar";
      toast.error(msg);
    },
  });

  async function handleSync(id: string) {
    setSyncingId(id);
    try {
      const result: any = await apiFetch(`/lms/sync/${id}`, { method: "POST" });
      toast.success(`Sincronizado — ${result.new_tasks} nuevas tareas`);
      qc.invalidateQueries({ queryKey: ["lms-status"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    } catch (err) {
      const msg = err instanceof ApiError ? (err.body as any)?.detail : "Error al sincronizar";
      toast.error(msg);
    } finally {
      setSyncingId(null);
    }
  }

  async function handleDisconnect(id: string) {
    try {
      await apiFetch(`/lms/${id}`, { method: "DELETE" });
      toast.success("Conexión eliminada");
      qc.invalidateQueries({ queryKey: ["lms-status"] });
    } catch {
      toast.error("Error al desconectar");
    }
  }

  const moodleConnected = connections.find((c) => c.provider === "moodle");
  const googleConnected = connections.find((c) => c.provider === "google_classroom");
  const [googleConnecting, setGoogleConnecting] = useState(false);

  async function handleGoogleConnect() {
    setGoogleConnecting(true);
    try {
      const redirectUri = `${window.location.origin}/lms/google-callback`;
      const data: any = await apiFetch(`/lms/connect/google/url?redirect_uri=${encodeURIComponent(redirectUri)}`);
      window.location.href = data.url;
    } catch (err) {
      const msg = err instanceof ApiError ? (err.body as any)?.detail : "Error al conectar con Google";
      toast.error(msg);
      setGoogleConnecting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Aula Virtual</h1>
        <p className="mt-1 text-sm text-text-muted">
          Conecta tu plataforma educativa para sincronizar deberes automáticamente.
        </p>
      </div>

      {/* ── Active connections ── */}
      {!isLoading && connections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conexiones activas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {connections.map((conn) => (
              <div key={conn.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600/10">
                    <School size={16} className="text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary capitalize">{conn.provider}</p>
                    <p className="text-xs text-text-muted truncate max-w-[200px]">
                      {conn.config?.base_url ?? "—"}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock size={10} className="text-text-muted" />
                      <span className="text-[11px] text-text-muted">
                        Última sync: {formatDate(conn.last_synced_at)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSync(conn.id)}
                    disabled={syncingId === conn.id}
                  >
                    <RefreshCw size={13} className={syncingId === conn.id ? "animate-spin" : ""} />
                    <span className="ml-1.5">Sincronizar</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDisconnect(conn.id)}
                    className="text-error hover:text-error"
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Moodle connect form ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <School size={16} className="text-violet-400" />
              <CardTitle className="text-base">Moodle</CardTitle>
            </div>
            {moodleConnected && (
              <Badge variant="success" className="flex items-center gap-1">
                <CheckCircle2 size={11} /> Conectado
              </Badge>
            )}
          </div>
          <CardDescription>
            Conecta tu Moodle para importar deberes y fechas de entrega automáticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>URL de Moodle</Label>
            <Input
              value={moodleUrl}
              onChange={(e) => setMoodleUrl(e.target.value)}
              placeholder="https://moodle.miescuela.es"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Token de servicio web</Label>
            <Input
              type="password"
              value={moodleToken}
              onChange={(e) => setMoodleToken(e.target.value)}
              placeholder="Tu token de Moodle"
            />
            <p className="text-xs text-text-muted">
              Moodle → Administración → Plugins → Servicios web → Gestionar tokens
            </p>
          </div>
          <Button
            onClick={() => connectMutation.mutate({ base_url: moodleUrl, token: moodleToken })}
            disabled={!moodleUrl || !moodleToken || connectMutation.isPending}
            size="sm"
          >
            {connectMutation.isPending ? "Conectando…" : moodleConnected ? "Reconectar" : "Conectar"}
          </Button>
        </CardContent>
      </Card>

      {/* ── Google Classroom ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <School size={16} className="text-blue-400" />
              <CardTitle className="text-base">Google Classroom</CardTitle>
            </div>
            {googleConnected && (
              <Badge variant="success" className="flex items-center gap-1">
                <CheckCircle2 size={11} /> Conectado
              </Badge>
            )}
          </div>
          <CardDescription>
            Conecta Google Classroom para sincronizar coursework y fechas de entrega.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleGoogleConnect}
            disabled={googleConnecting}
            size="sm"
            variant={googleConnected ? "outline" : "default"}
          >
            {googleConnecting ? "Redirigiendo…" : googleConnected ? "Reconectar cuenta" : "Conectar con Google"}
          </Button>
          {!googleConnected && (
            <p className="mt-2 text-xs text-text-muted">
              Necesitas activar la API de Google Classroom en tu proyecto de Google Cloud.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
