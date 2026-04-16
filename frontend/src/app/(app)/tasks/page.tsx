"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import TaskCard from "@/components/tasks/TaskCard";
import type { Task } from "@/types/index";
import { CheckSquare, RefreshCw, AlertCircle } from "lucide-react";

export default function TasksPage() {
  const [tasks, setTasks]     = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      const data = await apiFetch<Task[]>("/tasks");
      setTasks(data);
    } catch {
      setError("No se pudieron cargar los deberes. ¿Está el backend activo?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const pending     = tasks.filter(t => t.status === "pending");
  const in_progress = tasks.filter(t => t.status === "in_progress");
  const done        = tasks.filter(t => t.status === "done");

  return (
    <main className="flex flex-col h-full overflow-y-auto bg-gray-50">
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckSquare size={20} className="text-blue-600" />
            <h1 className="text-lg font-semibold text-gray-900">Deberes</h1>
            {!loading && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                {tasks.length}
              </span>
            )}
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-40"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Actualizar
          </button>
        </div>
      </div>

      <div className="flex-1 px-6 py-6">
        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-24 rounded-xl bg-gray-200 animate-pulse" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CheckSquare size={40} className="mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">Sin deberes pendientes</p>
            <p className="mt-1 text-sm text-gray-400">Conecta tu aula virtual para sincronizar tareas.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pending.length > 0 && (
              <section>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Pendientes · {pending.length}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {pending.map(t => <TaskCard key={t.id} task={t} />)}
                </div>
              </section>
            )}
            {in_progress.length > 0 && (
              <section>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  En curso · {in_progress.length}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {in_progress.map(t => <TaskCard key={t.id} task={t} />)}
                </div>
              </section>
            )}
            {done.length > 0 && (
              <section>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Completados · {done.length}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 opacity-60">
                  {done.map(t => <TaskCard key={t.id} task={t} />)}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
