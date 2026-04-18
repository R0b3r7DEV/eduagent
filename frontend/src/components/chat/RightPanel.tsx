"use client";
import { useTasks } from "@/hooks/useTasks";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckSquare, Clock, X } from "lucide-react";
import { useUiStore } from "@/stores/uiStore";
import type { Task } from "@/types/index";

function urgencyColor(dueDate?: string): string {
  if (!dueDate) return "text-text-muted";
  const diff = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
  if (diff < 0)  return "text-error";
  if (diff <= 1) return "text-error";
  if (diff <= 3) return "text-warning";
  return "text-text-muted";
}

function dueLabel(dueDate?: string): string {
  if (!dueDate) return "Sin fecha";
  const diff = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
  if (diff < 0)  return "Vencida";
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";
  return new Date(dueDate).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function TaskRow({ task }: { task: Task }) {
  return (
    <div className="flex items-start gap-2.5 py-2.5 border-b border-border last:border-0">
      <CheckSquare size={14} className="mt-0.5 shrink-0 text-text-muted" />
      <div className="flex-1 min-w-0">
        <p className="truncate text-xs font-medium text-text-secondary">{task.title}</p>
        {task.subject && <p className="text-[11px] text-text-muted">{task.subject}</p>}
      </div>
      <span className={`shrink-0 flex items-center gap-1 text-[11px] font-medium ${urgencyColor(task.dueDate)}`}>
        <Clock size={10} />
        {dueLabel(task.dueDate)}
      </span>
    </div>
  );
}

export default function RightPanel() {
  const { tasks, isLoading } = useTasks();
  const { toggleRightPanel } = useUiStore();
  const pending = tasks.filter(t => t.status !== "done").slice(0, 6);

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 z-30 bg-black/50 md:hidden"
        onClick={toggleRightPanel}
      />
    <aside className="fixed inset-y-0 right-0 z-40 flex w-[85vw] max-w-[300px] md:relative md:inset-auto md:z-auto md:w-[280px] md:max-w-none h-full shrink-0 flex-col border-l border-border bg-surface overflow-hidden shadow-2xl md:shadow-none">
      <div className="flex h-14 items-center justify-between px-4 border-b border-border shrink-0">
        <h3 className="text-sm font-semibold text-text-primary">Contexto</h3>
        <button onClick={toggleRightPanel} className="text-text-muted hover:text-text-secondary transition-colors">
          <X size={15} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4">
        {/* Pending tasks widget */}
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Deberes pendientes</p>
            <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] text-text-muted">
              {pending.length}
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : pending.length === 0 ? (
            <p className="text-xs text-text-muted py-3 text-center">Sin deberes pendientes 🎉</p>
          ) : (
            <div>{pending.map(t => <TaskRow key={t.id} task={t} />)}</div>
          )}
        </div>
      </div>
    </aside>
    </>
  );
}
