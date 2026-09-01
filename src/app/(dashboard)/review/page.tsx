import { ShieldCheck } from "lucide-react";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { PendingChangeCard } from "@/components/dashboard/PendingChangeCard";
import { RecommendationCard } from "@/components/dashboard/RecommendationCard";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { Card } from "@/components/ui/Card";
import { getPendingChanges, getRecommendations } from "@/lib/ads-service";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const changes = getPendingChanges();
  const recommendations = await getRecommendations();
  const waiting = changes.filter((change) => change.status === "pending");
  const decided = changes.filter((change) => change.status !== "pending");
  const raisedIds = new Set(
    changes
      .map((change) => change.sourceRecommendationId)
      .filter((id): id is string => Boolean(id)),
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
          Review queue
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Changes the agent asked for. Nothing here touches the account until you
          approve it.
        </p>
      </div>

      <Card className="border-warning/40 bg-warning-soft/40 flex items-start gap-3 p-4">
        <ShieldCheck className="text-warning mt-0.5 size-4 shrink-0" />
        <p className="text-xs leading-relaxed">
          <span className="font-medium">Approval policy. </span>
          Read tools run freely. Creating a campaign, ad set, or ad is allowed
          because new entities start paused and cannot spend. Budget and
          delivery changes are held here when an <span className="font-medium">agent</span>{" "}
          asks for them, because the point of this queue is that whoever
          proposes a change is not whoever decides on it. The same change made
          by you in the dashboard applies at once and appears below as already
          decided: you are the approver, so there is no second opinion to wait
          for. Approval itself is not exposed as a tool, so an agent has no
          path to clear its own request.
        </p>
      </Card>

      <section>
        <SectionHeader
          title="Awaiting your decision"
          description={
            waiting.length === 0
              ? "No held changes right now."
              : `${waiting.length} change ${waiting.length === 1 ? "request" : "requests"} blocked until you decide.`
          }
        />
        {waiting.length === 0 ? (
          <Card>
            <EmptyState
              title="Nothing is waiting"
              description="When a tool call asks to move budget or change delivery, it lands here with its reasoning and the exact before and after values."
            />
          </Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {waiting.map((change) => (
              <PendingChangeCard key={change.id} change={change} />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeader
          title="Recommendations"
          description="Derived from current performance. Send one to the queue to make it actionable."
        />
        {recommendations.length === 0 ? (
          <Card>
            <EmptyState
              title="No recommendations"
              description="Recommendations appear when an ad set or creative drifts far enough from the rest of the account to be worth acting on."
            />
          </Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {recommendations.map((recommendation) => (
              <RecommendationCard
                key={recommendation.id}
                recommendation={recommendation}
                existingChange={changes.find(
                  (change) =>
                    change.sourceRecommendationId === recommendation.id &&
                    raisedIds.has(recommendation.id),
                )}
              />
            ))}
          </div>
        )}
      </section>

      {decided.length > 0 && (
        <section>
          <SectionHeader
            title="Decided"
            description="Approved changes were applied to the account. Rejected ones were not."
          />
          <div className="grid gap-4 xl:grid-cols-2">
            {decided.map((change) => (
              <PendingChangeCard key={change.id} change={change} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
