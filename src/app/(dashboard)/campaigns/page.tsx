import { MetricGrid } from "@/components/dashboard/MetricGrid";
import { PerformanceTable } from "@/components/dashboard/PerformanceTable";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  getAccountMetrics,
  getAdAccount,
  getCampaignRows,
} from "@/lib/ads-service";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const [account, metrics, rows] = await Promise.all([
    getAdAccount(),
    getAccountMetrics(),
    getCampaignRows(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
          Campaigns
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {account.name} · campaign, ad set, and ad structure. Open a row to drill
          into the level below it.
        </p>
      </div>

      <section>
        <SectionHeader
          title="Account totals"
          description="The sum of every campaign in the list below."
        />
        <MetricGrid metrics={metrics} />
      </section>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>All campaigns</CardTitle>
          <p className="text-muted-foreground text-xs">
            {rows.length} campaigns · sortable by any metric
          </p>
        </CardHeader>
        <PerformanceTable
          rows={rows}
          nameHeader="Campaign"
          emptyTitle="No campaigns yet"
          emptyDescription="Ask the agent to build a campaign plan for your goal, then approve it to create the structure."
        />
      </Card>
    </div>
  );
}
