import { notFound } from "next/navigation";
import { TrendChart } from "@/components/charts/TrendChart";
import { CreateHierarchyWizard } from "@/components/dashboard/CreateHierarchyWizard";
import { DetailPanel } from "@/components/dashboard/DetailPanel";
import { LevelHeader } from "@/components/dashboard/LevelHeader";
import { LevelHeaderActions } from "@/components/dashboard/LevelHeaderActions";
import { MetricGrid } from "@/components/dashboard/MetricGrid";
import { PerformanceTable } from "@/components/dashboard/PerformanceTable";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  findAdSet,
  getAdRows,
  getPendingChanges,
  toTrendView,
} from "@/lib/ads-service";
import { formatAudienceSize, formatCurrency } from "@/lib/format";
import {
  adSetDaily,
  adSetTotals,
  deriveMetrics,
  effectiveStatus,
} from "@/lib/metrics";
import type { Gender } from "@/types/ads";

const GENDER_LABEL: Record<Gender, string> = {
  all: "All genders",
  male: "Male",
  female: "Female",
};

export const dynamic = "force-dynamic";

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
  const pendingChanges = getPendingChanges().filter(
    (change) => change.status === "pending" && change.targetId === adSet.id,
  );
  const pendingStatusChange = pendingChanges.find((change) =>
    change.operations.some((operation) => operation.type === "entity_status"),
  );
  const pendingBudgetChange = pendingChanges.find((change) =>
    change.operations.some((operation) => operation.type === "ad_set_budget"),
  );

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
        actions={
          <LevelHeaderActions
            level="ad_set"
            id={adSet.id}
            status={adSet.status}
            adSetBudget={adSet.budget.amount}
            pendingStatusChange={pendingStatusChange}
            pendingBudgetChange={pendingBudgetChange}
          />
        }
      />

      <MetricGrid metrics={metrics} />

      <div className="grid gap-4 md:grid-cols-2">
        <DetailPanel
          title="Audience"
          fields={[
            { label: "Ad set ID", value: adSet.id },
            { label: "Audience name", value: adSet.audience.name },
            {
              label: "Estimated reach",
              value: formatAudienceSize(adSet.audience.sizeEstimate),
            },
            { label: "Age range", value: adSet.audience.ageRange },
            { label: "Gender", value: GENDER_LABEL[adSet.audience.gender] },
            { label: "Locations", value: adSet.audience.locations.join(", ") || "—" },
            {
              label: "Interests",
              value: adSet.audience.interests.join(", ") || "—",
            },
          ]}
        />
        <div className="space-y-4">
          <DetailPanel
            title="Budget & bidding"
            fields={[
              {
                label: "Daily budget",
                value: `${formatCurrency(adSet.budget.amount)} ${
                  adSet.budget.period === "daily" ? "per day" : "lifetime"
                }`,
              },
              { label: "Bid strategy", value: adSet.bidStrategy },
              { label: "Optimization goal", value: adSet.optimizationGoal },
            ]}
          />
          <DetailPanel
            title="Placements"
            fields={[
              { label: "Placements", value: adSet.placements.join(", ") || "—" },
              { label: "Ads in this set", value: `${adSet.ads.length}` },
            ]}
          />
        </div>
      </div>

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

      <section>
        <SectionHeader
          title="Ads"
          description="Ads inherit the ad set budget. Open one to see its creative."
          action={
            <CreateHierarchyWizard
              startStep="ad"
              adSetId={adSet.id}
              adSetName={adSet.name}
              campaignName={campaign.name}
            />
          }
        />
        <Card className="overflow-hidden">
          <PerformanceTable
            rows={adRows}
            nameHeader="Ad"
            emptyTitle="No ads in this ad set"
            emptyDescription="An ad carries the creative that people see. Add one above, or ask the agent to."
          />
        </Card>
      </section>
    </div>
  );
}
