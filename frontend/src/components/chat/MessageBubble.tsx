import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import type { Message } from "@/stores/chatStore";
import MarkdownContent from "./MarkdownContent";
import { cn } from "@/lib/utils";

interface Props { msg: Message }

export default function MessageBubble({ msg }: Props) {
  const isUser = msg.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("flex gap-3 px-4 py-3", isUser ? "justify-end" : "justify-start")}
    >
      {/* Assistant avatar */}
      {!isUser && (
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-violet-800 text-[11px] font-bold text-white shadow-sm">
          E
        </div>
      )}

      <div className={cn("flex max-w-[80%] flex-col gap-1.5", isUser ? "items-end" : "items-start")}>
        {/* Bubble */}
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
            isUser
              ? "bg-violet-600 text-white rounded-br-sm"
              : "bg-surface border border-border text-text-primary rounded-bl-sm"
          )}
        >
          {/* Typing dots */}
          {msg.streaming && !msg.content && (
            <span className="flex items-center gap-1 py-0.5">
              {[0, 150, 300].map((d) => (
                <span
                  key={d}
                  className="h-1.5 w-1.5 rounded-full bg-text-muted animate-bounce"
                  style={{ animationDelay: `${d}ms` }}
                />
              ))}
            </span>
          )}

          {/* Content */}
          {msg.content && (
            isUser ? (
              <p className="whitespace-pre-wrap">{msg.content}</p>
            ) : (
              <MarkdownContent content={msg.content} />
            )
          )}

          {/* Streaming cursor */}
          {msg.streaming && msg.content && (
            <span className="ml-0.5 inline-block h-[14px] w-[2px] translate-y-[2px] animate-pulse rounded-full bg-violet-400 opacity-80" />
          )}
        </div>

        {/* Source chips */}
        {!msg.streaming && msg.sources && msg.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {msg.sources.map((src) => (
              <span
                key={src}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-[11px] text-text-muted hover:border-violet-600/40 hover:text-violet-400 transition-colors cursor-default"
              >
                <FileText size={10} />
                {src}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-2 border border-border text-[11px] font-semibold text-text-secondary">
          T
        </div>
      )}
    </motion.div>
  );
}
