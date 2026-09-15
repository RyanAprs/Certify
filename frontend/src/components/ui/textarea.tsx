import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[80px] w-full resize-y rounded-md border border-line-strong bg-surface px-3 py-2.5 text-sm text-ink shadow-xs transition-[border-color,box-shadow] duration-150",
      "placeholder:text-ink-subtle focus:border-primary focus:shadow-focus focus-visible:outline-none",
      "disabled:cursor-not-allowed disabled:bg-sunken",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
