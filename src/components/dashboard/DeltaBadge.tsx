import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatSignedPercent } from "@/lib/format";
import type { MetricDelta } from "@/types/ads";

interface Props {
  delta: MetricDelta;
  /** True for cost metrics, where a rise is bad news. */
  invert?: boolean;
  /** True when a move is neither good nor bad, such as raw spend. */
  neutral?: boolean;
  suffix?: string;
}

export function DeltaBadge({
  delta,
  invert = false,
  neutral = false,
  suffix = "vs prev 7d",
}: Props) {
  if (delta.direction === "flat") {
    return (
      <Badge tone="neutral">
        <Minus />
        No change
      </Badge>
    );
  }

  const isUp = delta.direction === "up";
  const isGood = invert ? !isUp : isUp;
  const Icon = isUp ? ArrowUpRight : ArrowDownRight;

  return (
    <span className="inline-flex items-center gap-1.5">
      <Badge tone={neutral ? "neutral" : isGood ? "positive" : "negative"}>
        <Icon />
        {formatSignedPercent(delta.changePct)}
      </Badge>
      <span className="text-muted-foreground text-[11px] whitespace-nowrap">
        {suffix}
      </span>
    </span>
  );
}
