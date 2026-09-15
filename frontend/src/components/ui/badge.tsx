import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      tone: {
        neutral: "border-line bg-sunken text-ink-muted",
        primary: "border-primary/25 bg-primary-tint text-primary",
        valid: "border-valid/30 bg-valid-tint text-valid-ink",
        pending: "border-pending/40 bg-pending-tint text-pending-ink",
        danger: "border-danger/30 bg-danger-tint text-danger-ink",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export { Badge, badgeVariants };
