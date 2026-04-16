import type { Task } from "@/types/index";
import { Calendar, ExternalLink, Clock } from "lucide-react";

const PRIORITY_STYLES: Record<number, { label: string; dot: string }> = {
  1: { label: "Alta",  dot: "bg-red-500"    },
  2: { label: "Media", dot: "bg-yellow-400" },
  3: { label: "Baja",  dot: "bg-green-500"  },
};

const STATUS_STYLES: Record<string, string> = {
  pending:     "bg-gray-100 text-gray-600",
  in_progress: "bg-blue-50 text-blue-700",
  done:        "bg-green-50 text-green-700",
};

const STATUS_LABELS: Record<string, string> = {
  pending:     "Pendiente",
  in_progress: "En curso",
  done:        "Hecho",
};

function formatDate(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.ceil((d.getTime() - now.getTime()) / 86400000);
  const fmt = d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  if (diff < 0)  return { label: `Venció el ${fmt}`, urgent: true };
  if (diff === 0) return { label: "Vence hoy",       urgent: true };
  if (diff === 1) return { label: "Vence mañana",    urgent: true };
  return { label: `Vence el ${fmt}`,                  urgent: false };
}

export default function TaskCard({ task }: { task: Task }) {
  const priority = PRIORITY_STYLES[task.priority ?? 3];
  const date     = formatDate(task.dueDate);

  return (
    <div className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-300 hover:shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="mb-1.5 flex items-center gap-2 flex-wrap">
            {task.subject && (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                {task.subject}
              </span>
            )}
            {task.courseName && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500">
                {task.courseName}
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2">{task.title}</h3>
          {task.description && (
            <p className="mt-1 text-xs text-gray-500 line-clamp-2">{task.description}</p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_STYLES[task.status]}`}>
            {STATUS_LABELS[task.status]}
          </span>
          {priority && (
            <span className="flex items-center gap-1 text-[11px] text-gray-400">
              <span className={`h-1.5 w-1.5 rounded-full ${priority.dot}`} />
              {priority.label}
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        {date ? (
          <span className={`flex items-center gap-1 text-xs ${date.urgent ? "text-red-500 font-medium" : "text-gray-400"}`}>
            <Clock size={12} />
            {date.label}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Calendar size={12} />
            Sin fecha
          </span>
        )}
      </div>
    </div>
  );
}
