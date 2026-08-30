import { formatCurrency, formatPercent } from "@/lib/format";
import {
  adSetTotals,
  adTotals,
  deriveMetrics,
  windowDelta,
} from "@/lib/metrics";
import type { Campaign, HierarchyLevel } from "@/types/ads";

export type AnomalySeverity = "critical" | "warning";

export interface Anomaly {
  id: string;
  severity: AnomalySeverity;
  level: HierarchyLevel;
  targetId: string;
  targetName: string;
  targetHref: string;
  headline: string;
  detail: string;
}

const CPA_MULTIPLE = 1.5;
const CTR_DROP_THRESHOLD = -10;

function median(values: number[]): number {
  if (values.length === 0) return Number.NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

/**
 * Anomalies are computed from the same aggregates the tables render, so the
 * agent and the dashboard never disagree about what is wrong.
 */
export function detectAnomalies(campaigns: Campaign[]): Anomaly[] {
  const activeAdSets = campaigns
    .filter((campaign) => campaign.status === "active")
    .flatMap((campaign) =>
      campaign.adSets
        .filter((adSet) => adSet.status === "active")
        .map((adSet) => ({
          campaign,
          adSet,
          metrics: deriveMetrics(adSetTotals(adSet)),
        })),
    );

  const cpaMedian = median(
    activeAdSets
      .map((entry) => entry.metrics.cpa)
      .filter((value) => Number.isFinite(value)),
  );

  const anomalies: Anomaly[] = [];

  for (const entry of activeAdSets) {
    const href = `/campaigns/${entry.campaign.id}/ad-sets/${entry.adSet.id}`;

    if (entry.metrics.spend > 0 && entry.metrics.conversions === 0) {
      anomalies.push({
        id: `anomaly_no_result_${entry.adSet.id}`,
        severity: "critical",
        level: "ad_set",
        targetId: entry.adSet.id,
        targetName: entry.adSet.name,
        targetHref: href,
        headline: "Spending with no conversions",
        detail: `${formatCurrency(entry.metrics.spend)} spent in the window without a single conversion.`,
      });
      continue;
    }

    if (
      Number.isFinite(cpaMedian) &&
      Number.isFinite(entry.metrics.cpa) &&
      entry.metrics.cpa > cpaMedian * CPA_MULTIPLE
    ) {
      anomalies.push({
        id: `anomaly_cpa_${entry.adSet.id}`,
        severity: "warning",
        level: "ad_set",
        targetId: entry.adSet.id,
        targetName: entry.adSet.name,
        targetHref: href,
        headline: "Cost per conversion above the account median",
        detail: `${formatCurrency(Math.round(entry.metrics.cpa))} per conversion against a median of ${formatCurrency(Math.round(cpaMedian))}.`,
      });
    }
  }

  for (const campaign of campaigns.filter((entry) => entry.status === "active")) {
    for (const adSet of campaign.adSets.filter((entry) => entry.status === "active")) {
      for (const ad of adSet.ads.filter((entry) => entry.status === "active")) {
        const ctrDelta = windowDelta(ad.daily, "ctr");
        if (ctrDelta.changePct >= CTR_DROP_THRESHOLD) continue;
        const metrics = deriveMetrics(adTotals(ad));
        anomalies.push({
          id: `anomaly_ctr_${ad.id}`,
          severity: "warning",
          level: "ad",
          targetId: ad.id,
          targetName: ad.name,
          targetHref: `/campaigns/${campaign.id}/ad-sets/${adSet.id}/ads/${ad.id}`,
          headline: "Click-through rate decaying",
          detail: `Down ${formatPercent(Math.abs(ctrDelta.changePct))} week over week at ${formatPercent(metrics.ctr)} overall.`,
        });
      }
    }
  }

  return anomalies;
}
