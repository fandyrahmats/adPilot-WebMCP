import { Target } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { pacing } from "@/lib/metrics";
import type { Goal } from "@/types/ads";

export function GoalCard({ goal }: { goal: Goal }) {
  const goalProgress = pacing(goal.current, goal.target);
  const budgetProgress = pacing(goal.spent, goal.budget);
  const remaining = Math.max(0, goal.target - goal.current);

  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <span className="bg-accent text-accent-foreground flex size-9 shrink-0 items-center justify-center rounded-md">
          <Target className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs font-medium">Active goal</p>
          <p className="mt-0.5 text-sm font-semibold">{goal.objective}</p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {formatDate(goal.startDate)} to {formatDate(goal.endDate)}
          </p>
        </div>
      </div>

      <dl className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-muted-foreground text-xs">{goal.metricLabel}</dt>
            <dd className="text-sm font-semibold tabular-nums">
              {formatNumber(goal.current)}
              <span className="text-muted-foreground font-normal">
                {" / "}
                {formatNumber(goal.target)}
              </span>
            </dd>
          </div>
          <Progress
            className="mt-2"
            value={goalProgress}
            tone="positive"
            label={`${goal.metricLabel} progress`}
          />
          <p className="text-muted-foreground mt-1.5 text-[11px]">
            {remaining === 0
              ? "Target reached"
              : `${formatNumber(remaining)} to go`}
          </p>
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-muted-foreground text-xs">Budget used</dt>
            <dd className="text-sm font-semibold tabular-nums">
              {formatCurrency(goal.spent)}
              <span className="text-muted-foreground font-normal">
                {" / "}
                {formatCurrency(goal.budget)}
              </span>
            </dd>
          </div>
          <Progress
            className="mt-2"
            value={budgetProgress}
            tone={budgetProgress > goalProgress + 15 ? "warning" : "primary"}
            label="Budget used"
          />
          <p className="text-muted-foreground mt-1.5 text-[11px]">
            {budgetProgress > goalProgress + 15
              ? "Spending ahead of result pace"
              : "Spend is tracking with results"}
          </p>
        </div>
      </dl>
    </Card>
  );
}
