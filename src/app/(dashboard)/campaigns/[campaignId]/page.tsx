import { notFound } from "next/navigation";
import { TrendChart } from "@/components/charts/TrendChart";
import { CampaignTree } from "@/components/dashboard/CampaignTree";
import { CreateHierarchyWizard } from "@/components/dashboard/CreateHierarchyWizard";
import { DetailPanel } from "@/components/dashboard/DetailPanel";
import { LevelHeader } from "@/components/dashboard/LevelHeader";
import { LevelHeaderActions } from "@/components/dashboard/LevelHeaderActions";
import { MetricGrid } from "@/components/dashboard/MetricGrid";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  findCampaign,
  getAdSetTree,
  getPendingChanges,
  objectiveLabel,
  toTrendView,
} from "@/lib/ads-service";
import { formatCurrency, formatDate } from "@/lib/format";
import { campaignDaily, campaignTotals, deriveMetrics } from "@/lib/metrics";

export const dynamic = "force-dynamic";

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
  const adSetTree = getAdSetTree(campaign);
  const pendingStatusChange = getPendingChanges().find(
    (change) =>
      change.status === "pending" &&
      change.targetId === campaign.id &&
      change.operations.some((operation) => operation.type === "entity_status"),
  );

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
        actions={
          <LevelHeaderActions
            level="campaign"
            id={campaign.id}
            status={campaign.status}
            pendingStatusChange={pendingStatusChange}
          />
        }
      />

      <MetricGrid metrics={metrics} />

      <div className="grid gap-4 md:grid-cols-2">
        <DetailPanel
          title="Campaign details"
          fields={[
            { label: "Campaign ID", value: campaign.id },
            { label: "Objective", value: objectiveLabel(campaign) },
            {
              label: "Ad sets",
              value: `${campaign.adSets.length}`,
            },
            {
              label: "Ads",
              value: `${campaign.adSets.reduce(
                (total, adSet) => total + adSet.ads.length,
                0,
              )}`,
            },
          ]}
        />
        <DetailPanel
          title="Budget & schedule"
          fields={[
            {
              label: "Budget",
              value: `${formatCurrency(campaign.budget.amount)} ${
                campaign.budget.period === "daily" ? "per day" : "lifetime"
              }`,
            },
            { label: "Start date", value: formatDate(campaign.startDate) },
            {
              label: "End date",
              value: campaign.endDate ? formatDate(campaign.endDate) : "No end date",
            },
          ]}
        />
      </div>

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

      <section>
        <SectionHeader
          title="Ad sets"
          description="Expand an ad set to see the ads inside it."
          action={
            <CreateHierarchyWizard
              startStep="ad_set"
              campaignId={campaign.id}
              campaignName={campaign.name}
            />
          }
        />
        <Card className="overflow-hidden">
          <CampaignTree
            rows={adSetTree}
            nameHeader="Ad set"
            emptyTitle="No ad sets in this campaign"
            emptyDescription="An ad set defines audience, placement, and budget. Add one above, or ask the agent to."
          />
        </Card>
      </section>
    </div>
  );
}
