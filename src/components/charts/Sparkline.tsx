import { cn } from "@/lib/utils";

interface Props {
  values: number[];
  tone?: "primary" | "positive" | "negative" | "muted";
  className?: string;
  label?: string;
}

const toneStroke = {
  primary: "var(--chart-1)",
  positive: "var(--positive)",
  negative: "var(--negative)",
  muted: "var(--muted-foreground)",
} as const;

const WIDTH = 72;
const HEIGHT = 24;

/**
 * Plain SVG so dense tables and KPI cards stay server rendered with no chart
 * runtime cost.
 */
export function Sparkline({ values, tone = "primary", className, label }: Props) {
  if (values.length < 2) return null;

  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const step = WIDTH / (values.length - 1);

  const points = values
    .map((value, index) => {
      const x = index * step;
      const y = HEIGHT - ((value - min) / span) * (HEIGHT - 3) - 1.5;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width={WIDTH}
      height={HEIGHT}
      className={cn("overflow-visible", className)}
      role={label ? "img" : "presentation"}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <polyline
        points={points}
        fill="none"
        stroke={toneStroke[tone]}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
