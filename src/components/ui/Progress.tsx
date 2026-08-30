import { cn } from "@/lib/utils";

interface Props {
  value: number;
  label: string;
  className?: string;
  tone?: "primary" | "positive" | "warning";
}

const toneClasses = {
  primary: "bg-primary",
  positive: "bg-positive",
  warning: "bg-warning",
} as const;

export function Progress({ value, label, className, tone = "primary" }: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("bg-muted h-2 w-full overflow-hidden rounded-full", className)}
    >
      <div
        className={cn("h-full rounded-full transition-all", toneClasses[tone])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
