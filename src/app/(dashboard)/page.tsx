import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { TrendChart } from "@/components/charts/TrendChart";
import { ActivityList } from "@/components/dashboard/ActivityList";
import { GoalCard } from "@/components/dashboard/GoalCard";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { PerformanceTable } from "@/components/dashboard/PerformanceTable";
import { RecommendationCard } from "@/components/dashboard/RecommendationCard";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/LinkButton";
import {
  getAccountDaily,
  getAccountKpis,
  getCampaignRows,
  getGoal,
  getPendingChanges,
  getRecommendations,
  getToolExecutions,
  REPORTING_REFERENCE,
  toTrendView,
} from "@/lib/ads-service";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const [goal, kpis, accountDaily, campaignRows, recommendations] =
    await Promise.all([
      getGoal(),
      getAccountKpis(),
      getAccountDaily(),
      getCampaignRows(),
      getRecommendations(),
    ]);
  const trend = toTrendView(accountDaily);
  const executions = getToolExecutions();
  const changes = getPendingChanges();
  const pendingApprovals = changes.filter(
    (change) => change.status === "pending",
  ).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
          Overview
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Goal progress, delivery, and everything the agent has proposed for this
          account.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <GoalCard goal={goal} />
        </div>
        <Card className="flex flex-col justify-between p-5">
          <div>
            <p className="text-muted-foreground text-xs font-medium">
              Waiting on you
            </p>
            <p className="mt-1.5 text-2xl font-semibold tabular-nums">
              {pendingApprovals}
            </p>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              {pendingApprovals === 0
                ? `No held changes. ${recommendations.length} recommendations are ready to review.`
                : "Change requests the agent cannot apply without your approval."}
            </p>
          </div>
          <LinkButton href="/review" variant="outline" className="mt-4 w-full">
            Open review queue
            <ArrowUpRight />
          </LinkButton>
        </Card>
      </div>

      <section>
        <SectionHeader
          title="Account performance"
          description="Last 28 days, compared against the previous 7 day window."
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <KpiCard
              key={kpi.key}
              label={kpi.label}
              value={kpi.value}
              format={kpi.format}
              delta={kpi.delta}
              invertDelta={kpi.invertDelta}
              neutralDelta={kpi.neutralDelta}
              helpText={kpi.helpText}
              trend={kpi.trend}
            />
          ))}
        </div>
      </section>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Conversions and spend</CardTitle>
            <p className="text-muted-foreground text-xs">
              Daily delivery across every campaign in the account.
            </p>
          </div>
          <Badge tone="outline">28 days</Badge>
        </CardHeader>
        <CardContent>
          <TrendChart
            data={trend}
            primaryLabel="Conversions"
            primaryFormat="number"
            secondaryLabel="Spend"
            secondaryFormat="currency"
          />
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Campaigns</CardTitle>
            <p className="text-muted-foreground text-xs">
              Totals roll up from ad sets, which roll up from ads.
            </p>
          </div>
          <Link
            href="/campaigns"
            className="text-primary text-xs font-medium hover:underline"
          >
            View all
          </Link>
        </CardHeader>
        <PerformanceTable
          rows={campaignRows}
          nameHeader="Campaign"
          emptyTitle="No campaigns yet"
          emptyDescription="Ask the agent to build a campaign plan for your goal, then approve it to create the structure."
        />
      </Card>

      <section>
        <SectionHeader
          title="Agent recommendations"
          description="Derived from the same numbers shown in the tables above."
          action={
            <Link
              href="/review"
              className="text-primary text-xs font-medium hover:underline"
            >
              Review all {recommendations.length}
            </Link>
          }
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {recommendations.slice(0, 2).map((recommendation) => (
            <RecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
              existingChange={changes.find(
                (change) => change.sourceRecommendationId === recommendation.id,
              )}
            />
          ))}
        </div>
      </section>

      <Card className="overflow-hidden">
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Recent agent activity</CardTitle>
            <p className="text-muted-foreground text-xs">
              Tool calls made against this account.
            </p>
          </div>
          <Link
            href="/activity"
            className="text-primary text-xs font-medium hover:underline"
          >
            View log
          </Link>
        </CardHeader>
        <ActivityList
          executions={executions}
          referenceTimestamp={REPORTING_REFERENCE.timestamp}
          limit={5}
        />
      </Card>
    </div>
  );
}
