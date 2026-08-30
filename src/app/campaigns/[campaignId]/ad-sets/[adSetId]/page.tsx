import { notFound } from "next/navigation";
import { TrendChart } from "@/components/charts/TrendChart";
import { LevelHeader } from "@/components/dashboard/LevelHeader";
import { MetricGrid } from "@/components/dashboard/MetricGrid";
import { PerformanceTable } from "@/components/dashboard/PerformanceTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { findAdSet, getAdRows, toTrendView } from "@/lib/ads-service";
import { formatAudienceSize, formatCurrency } from "@/lib/format";
import {
  adSetDaily,
  adSetTotals,
  deriveMetrics,
  effectiveStatus,
} from "@/lib/metrics";

export default async function AdSetPage({
  params,
}: {
  params: Promise<{ campaignId: string; adSetId: string }>;
}) {
  const { campaignId, adSetId } = await params;
  const found = await findAdSet(adSetId);
  // Guard against an ad set id that belongs to a different campaign.
  if (!found || found.campaign.id !== campaignId) notFound();

  const { campaign, adSet } = found;
  const metrics = deriveMetrics(adSetTotals(adSet));
  const adRows = getAdRows(campaign, adSet);

  return (
    <div className="space-y-6">
      <LevelHeader
        crumbs={[
          { label: "Campaigns", href: "/campaigns" },
          { label: campaign.name, href: `/campaigns/${campaign.id}` },
          { label: adSet.name },
        ]}
        eyebrow="Ad set"
        name={adSet.name}
        status={adSet.status}
        effectiveStatus={effectiveStatus(adSet.status, campaign.status)}
        budgetLabel={`${formatCurrency(adSet.budget.amount)} ${
          adSet.budget.period === "daily" ? "/ day" : "lifetime"
        }`}
        facts={[
          { label: "Audience", value: adSet.audience.name },
          {
            label: "Reachable",
            value: formatAudienceSize(adSet.audience.sizeEstimate),
          },
          {
            label: "Age and location",
            value: `${adSet.audience.ageRange} · ${adSet.audience.locations.join(", ")}`,
          },
          { label: "Placements", value: adSet.placements.join(", ") },
          { label: "Optimizing for", value: adSet.optimizationGoal },
          { label: "Bid strategy", value: adSet.bidStrategy },
          { label: "Interests", value: adSet.audience.interests.join(", ") },
          { label: "Ads", value: `${adSet.ads.length}` },
        ]}
      />

      <MetricGrid metrics={metrics} />

      <Card>
        <CardHeader>
          <CardTitle>Conversions and spend</CardTitle>
          <p className="text-muted-foreground text-xs">
            Daily delivery for this ad set.
          </p>
        </CardHeader>
        <CardContent>
          <TrendChart
            data={toTrendView(adSetDaily(adSet))}
            primaryLabel="Conversions"
            primaryFormat="number"
            secondaryLabel="Spend"
            secondaryFormat="currency"
          />
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Ads</CardTitle>
          <p className="text-muted-foreground text-xs">
            Ads inherit the ad set budget. Open one to see its creative.
          </p>
        </CardHeader>
        <PerformanceTable
          rows={adRows}
          nameHeader="Ad"
          emptyTitle="No ads in this ad set"
          emptyDescription="An ad carries the creative that people see. Ask the agent to add one to this ad set."
        />
      </Card>
    </div>
  );
}
