import { motion } from "framer-motion";
import { Clock, ExternalLink, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Task } from "@/types/index";

const SUBJECT_COLORS: Record<string, string> = {
  "matemáticas": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "historia":    "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "física":      "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  "química":     "bg-green-500/10 text-green-400 border-green-500/20",
  "biología":    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "inglés":      "bg-violet-500/10 text-violet-400 border-violet-500/20",
  "lengua":      "bg-pink-500/10 text-pink-400 border-pink-500/20",
};

function subjectColor(subject?: string): string {
  if (!subject) return "bg-surface-2 text-text-muted border-border";
  return SUBJECT_COLORS[subject.toLowerCase()] ?? "bg-surface-2 text-text-muted border-border";
}

function urgency(dueDate?: string): { label: string; cls: string } {
  if (!dueDate) return { label: "Sin fecha", cls: "text-text-muted" };
  const diff = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
  if (diff < 0)   return { label: "Vencida",  cls: "text-error font-semibold" };
  if (diff === 0) return { label: "Hoy",      cls: "text-error font-semibold" };
  if (diff === 1) return { label: "Mañana",   cls: "text-warning font-semibold" };
  if (diff <= 3)  return { label: `${diff} días`, cls: "text-warning" };
  return { label: new Date(dueDate).toLocaleDateString("es-ES", { day: "numeric", month: "short" }), cls: "text-text-muted" };
}

const STATUS_VARIANT: Record<string, "default" | "success" | "muted"> = {
  pending:     "muted",
  in_progress: "default",
  done:        "success",
};
const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente", in_progress: "En curso", done: "Hecho",
};

interface Props {
  task: Task;
  onStudy?: (task: Task) => void;
}

export default function TaskCard({ task, onStudy }: Props) {
  const due = urgency(task.dueDate);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="group rounded-[--radius-lg] border border-border bg-surface p-4 hover:border-border/80 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {task.subject && (
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${subjectColor(task.subject)}`}>
                {task.subject}
              </span>
            )}
            {task.courseName && (
              <span className="inline-flex items-center rounded-full border border-border bg-surface-2 px-2 py-0.5 text-[11px] text-text-muted">
                {task.courseName}
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-text-primary leading-snug line-clamp-2">{task.title}</h3>
          {task.description && (
            <p className="mt-1 text-xs text-text-muted line-clamp-2">{task.description}</p>
          )}
        </div>
        <Badge variant={STATUS_VARIANT[task.status] ?? "muted"} className="shrink-0">
          {STATUS_LABEL[task.status] ?? task.status}
        </Badge>
      </div>

      <div className="flex items-center justify-between">
        <span className={`flex items-center gap-1 text-xs ${due.cls}`}>
          <Clock size={11} />
          {due.label}
        </span>
        {onStudy && (
          <button
            onClick={() => onStudy(task)}
            className="invisible group-hover:visible flex items-center gap-1.5 rounded-[--radius-sm] px-2 py-1 text-xs text-text-muted hover:bg-violet-600/10 hover:text-violet-400 transition-colors"
          >
            <MessageSquare size={12} />
            Estudiar esto
          </button>
        )}
      </div>
    </motion.div>
  );
}
