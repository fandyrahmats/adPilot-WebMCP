import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone =
  | "neutral"
  | "outline"
  | "accent"
  | "positive"
  | "negative"
  | "warning";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  outline: "border text-muted-foreground",
  accent: "bg-accent text-accent-foreground",
  positive: "bg-positive-soft text-positive",
  negative: "bg-negative-soft text-negative",
  warning: "bg-warning-soft text-warning",
};

interface Props extends ComponentProps<"span"> {
  tone?: BadgeTone;
}

export function Badge({ className, tone = "neutral", ...props }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap [&_svg]:size-3",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
