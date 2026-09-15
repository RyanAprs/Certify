import { cn } from "@/lib/utils";

/** Shimmer placeholder. The `.skeleton` base class carries the shimmer keyframe. */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton", className)} aria-hidden="true" {...props} />;
}

export { Skeleton };
