"use client";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface Props {
  steps: string[];
  current: number;
}

export default function StepIndicator({ steps, current }: Props) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((label, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                animate={{
                  backgroundColor: done ? "#7C3AED" : active ? "#7C3AED" : "#2E2E2E",
                  scale: active ? 1.1 : 1,
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-transparent text-xs font-semibold text-white"
                style={{ borderColor: active ? "#7C3AED" : done ? "#7C3AED" : "#2E2E2E" }}
              >
                {done ? <Check size={14} strokeWidth={2.5} /> : i + 1}
              </motion.div>
              <span className={`text-[11px] font-medium whitespace-nowrap ${active ? "text-violet-400" : done ? "text-text-secondary" : "text-text-muted"}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="mx-2 mb-5 h-px w-12 bg-border flex-shrink-0">
                <motion.div
                  className="h-full bg-violet-600 origin-left"
                  animate={{ scaleX: done ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
