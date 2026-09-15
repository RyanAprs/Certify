import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex w-full rounded-md border border-line-strong bg-surface px-3 py-2.5 text-sm text-ink shadow-xs transition-[border-color,box-shadow] duration-150",
        "placeholder:text-ink-subtle focus:border-primary focus:shadow-focus focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:bg-sunken",
        "file:mr-3 file:rounded file:border-0 file:bg-sunken file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
