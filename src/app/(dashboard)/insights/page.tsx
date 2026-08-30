import { AllocationChart } from "@/components/charts/AllocationChart";
import { MetricBarChart } from "@/components/charts/MetricBarChart";
import { TrendChart } from "@/components/charts/TrendChart";
import { CreativeTable } from "@/components/dashboard/CreativeTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  getAccountDaily,
  getAdSetBreakdown,
  getCreativeRows,
  toTrendView,
} from "@/lib/ads-service";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const [accountDaily, breakdown, creatives] = await Promise.all([
    getAccountDaily(),
    getAdSetBreakdown(),
    getCreativeRows(),
  ]);
  const trend = toTrendView(accountDaily);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
          Insights
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Where the budget goes, which audiences convert, and which creatives are
          still working.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conversions and spend</CardTitle>
          <p className="text-muted-foreground text-xs">
            Account level daily delivery over the last 28 days.
          </p>
        </CardHeader>
        <CardContent>
          <TrendChart
            data={trend}
            primaryLabel="Conversions"
            primaryFormat="number"
            secondaryLabel="Spend"
            secondaryFormat="currency"
            height={240}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Spend allocation</CardTitle>
            <p className="text-muted-foreground text-xs">
              Share of spend by ad set.
            </p>
          </CardHeader>
          <CardContent>
            <AllocationChart
              data={breakdown.map((entry) => ({
                name: entry.name,
                value: entry.spend,
              }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversions by ad set</CardTitle>
            <p className="text-muted-foreground text-xs">
              Result volume, independent of how much each ad set spent.
            </p>
          </CardHeader>
          <CardContent>
            <MetricBarChart
              data={breakdown.map((entry) => ({
                name: entry.name,
                value: entry.conversions,
              }))}
              valueLabel="Conversions"
              valueFormat="number"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cost per conversion by ad set</CardTitle>
          <p className="text-muted-foreground text-xs">
            Lower bars are cheaper results. Use this to decide where budget should
            move.
          </p>
        </CardHeader>
        <CardContent>
          <MetricBarChart
            data={breakdown
              .filter((entry) => entry.conversions > 0)
              .map((entry) => ({ name: entry.name, value: Math.round(entry.cpa) }))}
            valueLabel="Cost per conversion"
            valueFormat="currency"
          />
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Creative performance</CardTitle>
          <p className="text-muted-foreground text-xs">
            Ranked by conversions, with the click-through trend that reveals
            fatigue.
          </p>
        </CardHeader>
        <CreativeTable rows={creatives} />
      </Card>
    </div>
  );
}
