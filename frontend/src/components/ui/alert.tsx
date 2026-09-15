import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "flex gap-3 rounded-xl border p-4 text-sm leading-relaxed [&>svg]:mt-0.5 [&>svg]:h-[18px] [&>svg]:w-[18px] [&>svg]:shrink-0",
  {
    variants: {
      tone: {
        info: "border-primary/25 bg-primary-tint [&>svg]:text-primary",
        warning: "border-pending/40 bg-pending-tint [&>svg]:text-pending-ink",
        danger: "border-danger/35 bg-danger-tint [&>svg]:text-danger-ink",
        success: "border-valid/35 bg-valid-tint [&>svg]:text-valid-ink",
      },
    },
    defaultVariants: { tone: "info" },
  }
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, tone, ...props }, ref) => (
  <div ref={ref} role="note" className={cn(alertVariants({ tone }), className)} {...props} />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("mb-0.5 font-semibold text-ink", className)} {...props} />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-ink-muted [&_code]:rounded [&_code]:bg-sunken [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.8em] [&_code]:text-ink",
      className
    )}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
