"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTasks } from "@/hooks/useTasks";
import { useChatStore } from "@/stores/chatStore";
import TaskCard from "@/components/tasks/TaskCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { Task } from "@/types/index";
import { CheckSquare, RefreshCw, AlertCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const FILTERS = ["Todos", "Pendiente", "En curso", "Hecho"] as const;
type Filter = typeof FILTERS[number];

export default function TasksPage() {
  const { tasks, isLoading, error, refetch } = useTasks();
  const [filter, setFilter] = useState<Filter>("Todos");
  const [search, setSearch] = useState("");
  const reset = useChatStore(s => s.reset);
  const router = useRouter();

  function handleStudy(task: Task) {
    reset();
    useChatStore.setState({ messages: [] });
    router.push(`/chat?context=${encodeURIComponent(task.title)}`);
  }

  const filtered = tasks.filter(t => {
    const matchFilter =
      filter === "Todos"     ? true :
      filter === "Pendiente" ? t.status === "pending" :
      filter === "En curso"  ? t.status === "in_progress" :
                               t.status === "done";
    const matchSearch = search === "" ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.subject ?? "").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <main className="flex h-full flex-col overflow-hidden bg-bg">
      {/* Header */}
      <div className="border-b border-border bg-surface px-4 py-4 sm:px-6 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <CheckSquare size={18} className="text-violet-400" />
            <h1 className="text-lg font-semibold text-text-primary">Deberes</h1>
            {!isLoading && (
              <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-text-muted">{tasks.length}</span>
            )}
          </div>
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-[--radius-sm] px-3 py-1.5 text-xs text-text-muted hover:bg-surface-2 transition-colors disabled:opacity-40"
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
            Actualizar
          </button>
        </div>

        {/* Search + filters */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="relative flex-1 sm:max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input
              placeholder="Buscar deberes…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-[--radius-sm] px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === f
                    ? "bg-violet-600/15 text-violet-400"
                    : "text-text-muted hover:bg-surface-2 hover:text-text-secondary"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-[--radius-lg] border border-error/20 bg-error/8 px-4 py-3 text-sm text-error">
            <AlertCircle size={15} className="shrink-0" />
            No se pudieron cargar los deberes. ¿Está el backend activo?
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-28" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CheckSquare size={36} className="mb-3 text-border" />
            <p className="font-medium text-text-secondary">Sin deberes</p>
            <p className="mt-1 text-sm text-text-muted">
              {search ? "Prueba otra búsqueda." : "Conecta tu aula virtual para sincronizar tareas."}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map(t => <TaskCard key={t.id} task={t} onStudy={handleStudy} />)}
          </div>
        )}
      </div>
    </main>
  );
}
