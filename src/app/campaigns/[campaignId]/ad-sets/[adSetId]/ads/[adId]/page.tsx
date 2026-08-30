import { notFound } from "next/navigation";
import { TrendChart } from "@/components/charts/TrendChart";
import { CreativePreview } from "@/components/dashboard/CreativePreview";
import { DeltaBadge } from "@/components/dashboard/DeltaBadge";
import { LevelHeader } from "@/components/dashboard/LevelHeader";
import { MetricGrid } from "@/components/dashboard/MetricGrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { findAd, toTrendView } from "@/lib/ads-service";
import { formatCurrency, formatMetric } from "@/lib/format";
import {
  adTotals,
  deriveMetrics,
  effectiveStatus,
  windowDelta,
} from "@/lib/metrics";

export default async function AdPage({
  params,
}: {
  params: Promise<{ campaignId: string; adSetId: string; adId: string }>;
}) {
  const { campaignId, adSetId, adId } = await params;
  const found = await findAd(adId);
  // Guard against an ad id reached through the wrong ancestry.
  if (!found || found.campaign.id !== campaignId || found.adSet.id !== adSetId) {
    notFound();
  }

  const { campaign, adSet, ad } = found;
  const metrics = deriveMetrics(adTotals(ad));
  const parentStatus = effectiveStatus(adSet.status, campaign.status);

  const creativeSignals = [
    { label: "Click-through rate", metric: "ctr" as const, format: "percent" as const, invert: false },
    { label: "Cost per conversion", metric: "cpa" as const, format: "currency" as const, invert: true },
    { label: "Frequency", metric: "frequency" as const, format: "ratio" as const, invert: true },
  ];

  return (
    <div className="space-y-6">
      <LevelHeader
        crumbs={[
          { label: "Campaigns", href: "/campaigns" },
          { label: campaign.name, href: `/campaigns/${campaign.id}` },
          {
            label: adSet.name,
            href: `/campaigns/${campaign.id}/ad-sets/${adSet.id}`,
          },
          { label: ad.name },
        ]}
        eyebrow="Ad"
        name={ad.name}
        status={ad.status}
        effectiveStatus={effectiveStatus(ad.status, parentStatus)}
        budgetLabel={`${formatCurrency(adSet.budget.amount)} / day`}
        budgetInherited
        facts={[
          { label: "Creative", value: ad.creative.name },
          { label: "Format", value: ad.creative.format },
          { label: "Call to action", value: ad.creative.callToAction },
          { label: "Placements", value: adSet.placements.join(", ") },
        ]}
      />

      <MetricGrid metrics={metrics} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversions and spend</CardTitle>
              <p className="text-muted-foreground text-xs">
                Daily delivery for this ad.
              </p>
            </CardHeader>
            <CardContent>
              <TrendChart
                data={toTrendView(ad.daily)}
                primaryLabel="Conversions"
                primaryFormat="number"
                secondaryLabel="Spend"
                secondaryFormat="currency"
                height={220}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Creative signals</CardTitle>
              <p className="text-muted-foreground text-xs">
                Last 7 days against the 7 days before it.
              </p>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              {creativeSignals.map((signal) => {
                const delta = windowDelta(ad.daily, signal.metric);
                return (
                  <div key={signal.metric}>
                    <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                      {signal.label}
                    </p>
                    <p className="mt-1 text-lg font-semibold tabular-nums">
                      {formatMetric(signal.format, metrics[signal.metric])}
                    </p>
                    <div className="mt-1.5">
                      <DeltaBadge delta={delta} invert={signal.invert} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium">
            Creative preview
          </p>
          <CreativePreview creative={ad.creative} />
        </div>
      </div>
    </div>
  );
}
