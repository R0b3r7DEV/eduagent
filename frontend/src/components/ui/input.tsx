import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-10 w-full rounded-[--radius] border border-border bg-surface px-3 py-2 text-sm text-text-primary",
      "placeholder:text-text-muted",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 focus-visible:border-violet-500",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "transition-colors",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

export { Input };
