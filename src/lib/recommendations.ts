import { adSetTotals, deriveMetrics, windowDelta } from "@/lib/metrics";
import {
  formatCurrency,
  formatPercent,
  formatRoas,
} from "@/lib/format";
import { REFERENCE_TIMESTAMP } from "@/lib/demo/series";
import { adHref, adSetHref } from "@/lib/hrefs";
import type { AdSet, Campaign, Recommendation } from "@/types/ads";

const REALLOCATION_STEP = 80_000;

/**
 * The complete set of recommendation identifiers this application can produce.
 * Exported so the tool schema can constrain callers to real values instead of
 * letting them guess, while the handler still checks whether one is currently
 * available.
 */
export const RECOMMENDATION_IDS = [
  "rec_reallocate_budget",
  "rec_refresh_creative",
  "rec_scale_winner",
] as const;

interface RankedAdSet {
  campaign: Campaign;
  adSet: AdSet;
  metrics: ReturnType<typeof deriveMetrics>;
}

function rankConversionAdSets(campaigns: Campaign[]): RankedAdSet[] {
  return campaigns
    .filter(
      (campaign) =>
        campaign.status === "active" && campaign.objective === "conversions",
    )
    .flatMap((campaign) =>
      campaign.adSets
        .filter((adSet) => adSet.status === "active")
        .map((adSet) => ({
          campaign,
          adSet,
          metrics: deriveMetrics(adSetTotals(adSet)),
        })),
    )
    .filter((entry) => entry.metrics.conversions > 0)
    .sort((a, b) => a.metrics.cpa - b.metrics.cpa);
}

function offsetTimestamp(minutes: number): string {
  const reference = new Date(REFERENCE_TIMESTAMP);
  reference.setUTCMinutes(reference.getUTCMinutes() - minutes);
  return reference.toISOString();
}

/** Moves budget from the worst CPA ad set to the best one. */
function buildReallocation(ranked: RankedAdSet[]): Recommendation | null {
  if (ranked.length < 2) return null;
  const best = ranked[0];
  const worst = ranked[ranked.length - 1];
  if (worst.metrics.cpa <= best.metrics.cpa * 1.4) return null;

  const worstBudget = worst.adSet.budget.amount;
  const bestBudget = best.adSet.budget.amount;
  const shift = Math.min(REALLOCATION_STEP, Math.round(worstBudget * 0.4));
  const cpaGap = Math.round(worst.metrics.cpa - best.metrics.cpa);
  const weeklyGain = Math.floor((shift * 7) / best.metrics.cpa);

  return {
    id: RECOMMENDATION_IDS[0],
    title: `Shift ${formatCurrency(shift)}/day from ${worst.adSet.name} to ${best.adSet.name}`,
    rationale:
      "Budget is sitting in the highest-cost ad set while a cheaper one is capped.",
    level: "ad_set",
    targetId: worst.adSet.id,
    targetName: worst.adSet.name,
    targetHref: adSetHref(worst.campaign.id, worst.adSet.id),
    status: "pending",
    impact: "high",
    requiresApproval: true,
    evidence: [
      `${worst.adSet.name} costs ${formatCurrency(Math.round(worst.metrics.cpa))} per conversion, ${formatCurrency(cpaGap)} above ${best.adSet.name}.`,
      `${best.adSet.name} returns ${formatRoas(best.metrics.roas)} on ${formatCurrency(best.metrics.spend)} spent.`,
      `Both ad sets target the same objective, so spend can move without changing the campaign structure.`,
    ],
    expectedImpact:
      weeklyGain > 0
        ? `About ${weeklyGain} more conversions per week at the current cost per conversion.`
        : `Moves spend to the cheaper ad set without changing total budget.`,
    changes: [
      {
        label: `${worst.adSet.name} daily budget`,
        before: formatCurrency(worstBudget),
        after: formatCurrency(worstBudget - shift),
      },
      {
        label: `${best.adSet.name} daily budget`,
        before: formatCurrency(bestBudget),
        after: formatCurrency(bestBudget + shift),
      },
    ],
    operations: [
      {
        type: "ad_set_budget",
        campaignId: worst.campaign.id,
        adSetId: worst.adSet.id,
        amount: worstBudget - shift,
      },
      {
        type: "ad_set_budget",
        campaignId: best.campaign.id,
        adSetId: best.adSet.id,
        amount: bestBudget + shift,
      },
    ],
    toolName: "update_ad_set_budget",
    createdAt: offsetTimestamp(18),
  };
}

/** Flags the ad whose click-through rate dropped hardest week over week. */
function buildCreativeRefresh(campaigns: Campaign[]): Recommendation | null {
  const candidates = campaigns
    .filter((campaign) => campaign.status === "active")
    .flatMap((campaign) =>
      campaign.adSets
        .filter((adSet) => adSet.status === "active")
        .flatMap((adSet) =>
          adSet.ads
            .filter((entry) => entry.status === "active")
            .map((entry) => ({
              campaign,
              adSet,
              ad: entry,
              ctrDelta: windowDelta(entry.daily, "ctr"),
              cpaDelta: windowDelta(entry.daily, "cpa"),
            })),
        ),
    )
    .filter((entry) => entry.ctrDelta.changePct < -8)
    .sort((a, b) => a.ctrDelta.changePct - b.ctrDelta.changePct);

  const worst = candidates[0];
  if (!worst) return null;

  // Only claim a cost movement when both windows actually produced results.
  const costEvidence =
    worst.cpaDelta.direction === "flat"
      ? "Cost per conversion cannot be compared across the two windows because the ad did not convert in both."
      : `Cost per conversion moved ${worst.cpaDelta.direction === "up" ? "up" : "down"} ${formatPercent(Math.abs(worst.cpaDelta.changePct))} over the same window.`;

  return {
    id: RECOMMENDATION_IDS[1],
    title: `Pause ${worst.ad.name} and rotate in a fresh creative`,
    rationale: "Click-through rate is decaying while cost per result climbs.",
    level: "ad",
    targetId: worst.ad.id,
    targetName: worst.ad.name,
    targetHref: adHref(worst.campaign.id, worst.adSet.id, worst.ad.id),
    status: "pending",
    impact: "medium",
    requiresApproval: true,
    evidence: [
      `Click-through rate fell ${formatPercent(Math.abs(worst.ctrDelta.changePct))} against the previous 7 days.`,
      costEvidence,
      `The creative has been live long enough for frequency to build against a fixed audience.`,
    ],
    expectedImpact:
      "Stops spend on a fatigued creative and frees budget for the variant that still converts.",
    changes: [
      {
        label: `${worst.ad.name} status`,
        before: "Active",
        after: "Paused",
      },
    ],
    operations: [
      {
        type: "entity_status",
        campaignId: worst.campaign.id,
        adSetId: worst.adSet.id,
        adId: worst.ad.id,
        status: "paused",
      },
    ],
    toolName: "update_entity_status",
    createdAt: offsetTimestamp(42),
  };
}

/** Suggests scaling the ad set with the strongest return. */
function buildScaleWinner(ranked: RankedAdSet[]): Recommendation | null {
  const best = [...ranked].sort((a, b) => b.metrics.roas - a.metrics.roas)[0];
  if (!best || best.metrics.roas < 2) return null;

  const budget = best.adSet.budget.amount;
  const increase = Math.round(budget * 0.2);

  return {
    id: RECOMMENDATION_IDS[2],
    title: `Raise ${best.adSet.name} daily budget by 20%`,
    rationale: "The strongest ad set is budget constrained late in the day.",
    level: "ad_set",
    targetId: best.adSet.id,
    targetName: best.adSet.name,
    targetHref: adSetHref(best.campaign.id, best.adSet.id),
    status: "pending",
    impact: "medium",
    requiresApproval: true,
    evidence: [
      `Return on ad spend is ${formatRoas(best.metrics.roas)} across ${formatCurrency(best.metrics.spend)} of spend.`,
      `Cost per conversion is ${formatCurrency(Math.round(best.metrics.cpa))}, the lowest in the account.`,
      `A 20% step keeps the change inside a range the delivery system can absorb without relearning.`,
    ],
    expectedImpact: `Adds roughly ${formatCurrency(increase)} of daily spend at the current return.`,
    changes: [
      {
        label: `${best.adSet.name} daily budget`,
        before: formatCurrency(budget),
        after: formatCurrency(budget + increase),
      },
    ],
    operations: [
      {
        type: "ad_set_budget",
        campaignId: best.campaign.id,
        adSetId: best.adSet.id,
        amount: budget + increase,
      },
    ],
    toolName: "update_ad_set_budget",
    createdAt: offsetTimestamp(75),
  };
}

/**
 * Recommendations are derived from the same aggregates the tables render, so
 * the evidence shown to the reviewer always matches the reported numbers.
 */
export function buildRecommendations(campaigns: Campaign[]): Recommendation[] {
  const ranked = rankConversionAdSets(campaigns);
  return [
    buildReallocation(ranked),
    buildCreativeRefresh(campaigns),
    buildScaleWinner(ranked),
  ].filter((entry): entry is Recommendation => entry !== null);
}
