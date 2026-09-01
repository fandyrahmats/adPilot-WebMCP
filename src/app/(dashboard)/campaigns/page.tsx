import { CampaignTree } from "@/components/dashboard/CampaignTree";
import { CreateHierarchyWizard } from "@/components/dashboard/CreateHierarchyWizard";
import { MetricGrid } from "@/components/dashboard/MetricGrid";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  getAccountMetrics,
  getAdAccount,
  getCampaignTree,
} from "@/lib/ads-service";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const [account, metrics, tree] = await Promise.all([
    getAdAccount(),
    getAccountMetrics(),
    getCampaignTree(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
            Campaigns
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {account.name} · campaign, ad set, and ad structure. Open a row to
            drill into the level below it.
          </p>
        </div>
        <CreateHierarchyWizard startStep="campaign" />
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
          <CardTitle>Campaign structure</CardTitle>
          <p className="text-muted-foreground text-xs">
            {tree.length} campaigns · expand a campaign to see its ad sets, and an
            ad set to see its ads · sortable by any metric
          </p>
        </CardHeader>
        <CampaignTree
          rows={tree}
          nameHeader="Campaign"
          emptyTitle="No campaigns yet"
          emptyDescription="Create one above, or ask the agent to build a campaign plan for your goal."
        />
      </Card>
    </div>
  );
}
