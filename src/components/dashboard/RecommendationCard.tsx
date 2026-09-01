import Link from "next/link";
import { ArrowUpRight, ShieldAlert, Terminal } from "lucide-react";
import { queueRecommendationAction } from "@/app/actions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import type { PendingChange, Recommendation } from "@/types/ads";
import { BeforeAfterDiff } from "./BeforeAfterDiff";

const impactTone = {
  high: "negative",
  medium: "warning",
  low: "neutral",
} as const;

const levelLabel = {
  campaign: "Campaign",
  ad_set: "Ad set",
  ad: "Ad",
} as const;

interface Props {
  recommendation: Recommendation;
  /** Set when this recommendation has already been raised for approval. */
  existingChange?: PendingChange;
}

export function RecommendationCard({ recommendation, existingChange }: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={impactTone[recommendation.impact]}>
            {recommendation.impact} impact
          </Badge>
          <Badge tone="outline">{levelLabel[recommendation.level]}</Badge>
          <Badge tone="neutral" className="font-mono text-[11px]">
            <Terminal />
            {recommendation.toolName}
          </Badge>
        </div>
        <CardTitle className="mt-1 text-sm leading-snug">
          {recommendation.title}
        </CardTitle>
        <p className="text-muted-foreground text-xs">
          {recommendation.rationale}{" "}
          <Link
            href={recommendation.targetHref}
            className="text-primary hover:underline"
          >
            {recommendation.targetName}
          </Link>
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <section>
          <h4 className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
            Evidence
          </h4>
          <ul className="mt-1.5 space-y-1.5">
            {recommendation.evidence.map((line) => (
              <li key={line} className="flex gap-2 text-xs leading-relaxed">
                <span
                  aria-hidden
                  className="bg-muted-foreground mt-1.5 size-1 shrink-0 rounded-full"
                />
                {line}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h4 className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
            Proposed change
          </h4>
          <div className="mt-1.5">
            <BeforeAfterDiff changes={recommendation.changes} />
          </div>
        </section>

        <p className="bg-muted rounded-md px-3 py-2 text-xs leading-relaxed">
          <span className="font-medium">Expected impact. </span>
          {recommendation.expectedImpact}
        </p>
      </CardContent>

      <CardFooter className="flex-wrap justify-between gap-2">
        {existingChange ? (
          <>
            <span className="text-muted-foreground text-[11px]">
              Already raised as {existingChange.id} ({existingChange.status}).
            </span>
            <Link
              href="/review"
              className="text-primary inline-flex items-center gap-1 text-xs font-medium hover:underline"
            >
              Open review queue
              <ArrowUpRight className="size-3" />
            </Link>
          </>
        ) : (
          <>
            <span className="text-muted-foreground inline-flex items-center gap-1.5 text-[11px]">
              <ShieldAlert className="size-3.5" />
              If the agent asks for this, it waits for you instead
            </span>
            <form action={queueRecommendationAction}>
              <input
                type="hidden"
                name="recommendationId"
                value={recommendation.id}
              />
              <Button type="submit" size="sm" variant="outline">
                Apply now
              </Button>
            </form>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
