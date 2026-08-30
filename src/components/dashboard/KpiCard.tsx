import { Sparkline } from "@/components/charts/Sparkline";
import { Card } from "@/components/ui/Card";
import { formatMetric, type MetricFormat } from "@/lib/format";
import type { MetricDelta } from "@/types/ads";
import { DeltaBadge } from "./DeltaBadge";

interface Props {
  label: string;
  value: number;
  format: MetricFormat;
  delta: MetricDelta;
  /** True for cost metrics, where a rise is bad news. */
  invertDelta?: boolean;
  /** True when a move is neither good nor bad, such as raw spend. */
  neutralDelta?: boolean;
  helpText?: string;
  trend?: number[];
}

export function KpiCard({
  label,
  value,
  format,
  delta,
  invertDelta = false,
  neutralDelta = false,
  helpText,
  trend,
}: Props) {
  const trendTone = invertDelta
    ? delta.direction === "up"
      ? "negative"
      : "positive"
    : delta.direction === "down"
      ? "negative"
      : "positive";

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs font-medium">{label}</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums">
            {formatMetric(format, value)}
          </p>
        </div>
        {trend && trend.length > 1 && (
          <Sparkline
            values={trend}
            tone={
              neutralDelta || delta.direction === "flat" ? "muted" : trendTone
            }
          />
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
        <DeltaBadge delta={delta} invert={invertDelta} neutral={neutralDelta} />
      </div>
      {helpText && (
        <p className="text-muted-foreground mt-2 text-[11px] leading-relaxed">
          {helpText}
        </p>
      )}
    </Card>
  );
}
