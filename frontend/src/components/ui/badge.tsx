import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors",
  {
    variants: {
      variant: {
        default:  "bg-violet-600/20 text-violet-300 border border-violet-600/30",
        success:  "bg-success/10 text-success border border-success/20",
        error:    "bg-error/10 text-error border border-error/20",
        warning:  "bg-warning/10 text-warning border border-warning/20",
        muted:    "bg-surface-2 text-text-muted border border-border",
        outline:  "border border-border text-text-secondary bg-transparent",
      },
    },
    defaultVariants: { variant: "muted" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
