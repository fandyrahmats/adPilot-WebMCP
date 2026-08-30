import { Card } from "@/components/ui/Card";
import { formatMetric, type MetricFormat } from "@/lib/format";
import type { DerivedMetrics } from "@/types/ads";

interface MetricSpec {
  key: keyof DerivedMetrics;
  label: string;
  format: MetricFormat;
}

const SPECS: MetricSpec[] = [
  { key: "spend", label: "Spend", format: "currency" },
  { key: "impressions", label: "Impressions", format: "number" },
  { key: "cpm", label: "CPM", format: "currency" },
  { key: "clicks", label: "Clicks", format: "number" },
  { key: "ctr", label: "CTR", format: "percent" },
  { key: "conversions", label: "Conversions", format: "number" },
  { key: "cpa", label: "Cost per conversion", format: "currency" },
  { key: "roas", label: "ROAS", format: "roas" },
];

export function MetricGrid({ metrics }: { metrics: DerivedMetrics }) {
  return (
    <Card className="overflow-hidden p-0">
      <dl className="bg-border grid grid-cols-2 gap-px sm:grid-cols-4">
        {SPECS.map((spec) => (
          <div key={spec.key} className="bg-card px-5 py-4">
            <dt className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
              {spec.label}
            </dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums">
              {formatMetric(spec.format, metrics[spec.key])}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
