import { notFound } from "next/navigation";
import { TrendChart } from "@/components/charts/TrendChart";
import { LevelHeader } from "@/components/dashboard/LevelHeader";
import { MetricGrid } from "@/components/dashboard/MetricGrid";
import { PerformanceTable } from "@/components/dashboard/PerformanceTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  findCampaign,
  getAdSetRows,
  objectiveLabel,
  toTrendView,
} from "@/lib/ads-service";
import { formatCurrency, formatDate } from "@/lib/format";
import { campaignDaily, campaignTotals, deriveMetrics } from "@/lib/metrics";

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const campaign = await findCampaign(campaignId);
  if (!campaign) notFound();

  const metrics = deriveMetrics(campaignTotals(campaign));
  const daily = campaignDaily(campaign);
  const adSetRows = getAdSetRows(campaign);

  return (
    <div className="space-y-6">
      <LevelHeader
        crumbs={[
          { label: "Campaigns", href: "/campaigns" },
          { label: campaign.name },
        ]}
        eyebrow="Campaign"
        name={campaign.name}
        status={campaign.status}
        budgetLabel={`${formatCurrency(campaign.budget.amount)} ${
          campaign.budget.period === "daily" ? "/ day" : "lifetime"
        }`}
        facts={[
          { label: "Objective", value: objectiveLabel(campaign) },
          {
            label: "Schedule",
            value: `${formatDate(campaign.startDate)} to ${
              campaign.endDate ? formatDate(campaign.endDate) : "no end date"
            }`,
          },
          { label: "Ad sets", value: `${campaign.adSets.length}` },
          {
            label: "Ads",
            value: `${campaign.adSets.reduce(
              (total, adSet) => total + adSet.ads.length,
              0,
            )}`,
          },
        ]}
      />

      <MetricGrid metrics={metrics} />

      <Card>
        <CardHeader>
          <CardTitle>Conversions and spend</CardTitle>
          <p className="text-muted-foreground text-xs">
            Daily delivery for this campaign.
          </p>
        </CardHeader>
        <CardContent>
          <TrendChart
            data={toTrendView(daily)}
            primaryLabel="Conversions"
            primaryFormat="number"
            secondaryLabel="Spend"
            secondaryFormat="currency"
          />
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Ad sets</CardTitle>
          <p className="text-muted-foreground text-xs">
            Each row sums the ads inside it.
          </p>
        </CardHeader>
        <PerformanceTable
          rows={adSetRows}
          nameHeader="Ad set"
          emptyTitle="No ad sets in this campaign"
          emptyDescription="An ad set defines audience, placement, and budget. Ask the agent to add one to this campaign."
        />
      </Card>
    </div>
  );
}
