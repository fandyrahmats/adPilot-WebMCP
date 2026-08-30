import type {
  Ad,
  AdSet,
  Campaign,
  DailyPoint,
  DerivedMetrics,
  EntityStatus,
  MetricDelta,
  MetricTotals,
} from "@/types/ads";

export const EMPTY_TOTALS: MetricTotals = {
  spend: 0,
  impressions: 0,
  reach: 0,
  clicks: 0,
  conversions: 0,
  revenue: 0,
};

/**
 * Ratios are undefined without a denominator. Returning NaN keeps that honest
 * so the UI can render "no data" instead of a fabricated zero.
 */
function ratio(numerator: number, denominator: number): number {
  return denominator === 0 ? Number.NaN : numerator / denominator;
}

export function sumTotals(items: MetricTotals[]): MetricTotals {
  return items.reduce<MetricTotals>(
    (acc, item) => ({
      spend: acc.spend + item.spend,
      impressions: acc.impressions + item.impressions,
      reach: acc.reach + item.reach,
      clicks: acc.clicks + item.clicks,
      conversions: acc.conversions + item.conversions,
      revenue: acc.revenue + item.revenue,
    }),
    { ...EMPTY_TOTALS },
  );
}

export function deriveMetrics(totals: MetricTotals): DerivedMetrics {
  return {
    ...totals,
    cpm: ratio(totals.spend, totals.impressions) * 1000,
    ctr: ratio(totals.clicks, totals.impressions) * 100,
    cpc: ratio(totals.spend, totals.clicks),
    cpa: ratio(totals.spend, totals.conversions),
    roas: ratio(totals.revenue, totals.spend),
    frequency: ratio(totals.impressions, totals.reach),
  };
}

export function totalsFromDaily(daily: DailyPoint[]): MetricTotals {
  return sumTotals(daily);
}

export function adTotals(ad: Ad): MetricTotals {
  return totalsFromDaily(ad.daily);
}

/** Ad set totals are always the sum of their ads. */
export function adSetTotals(adSet: AdSet): MetricTotals {
  return sumTotals(adSet.ads.map(adTotals));
}

/** Campaign totals are always the sum of their ad sets. */
export function campaignTotals(campaign: Campaign): MetricTotals {
  return sumTotals(campaign.adSets.map(adSetTotals));
}

export function accountTotals(campaigns: Campaign[]): MetricTotals {
  return sumTotals(campaigns.map(campaignTotals));
}

/** Merges several daily series into one, keyed by date. */
export function mergeDaily(series: DailyPoint[][]): DailyPoint[] {
  const byDate = new Map<string, DailyPoint>();
  for (const points of series) {
    for (const point of points) {
      const existing = byDate.get(point.date);
      if (!existing) {
        byDate.set(point.date, { ...point });
        continue;
      }
      byDate.set(point.date, {
        date: point.date,
        ...sumTotals([existing, point]),
      });
    }
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function campaignDaily(campaign: Campaign): DailyPoint[] {
  return mergeDaily(campaign.adSets.flatMap((adSet) => adSet.ads.map((ad) => ad.daily)));
}

export function adSetDaily(adSet: AdSet): DailyPoint[] {
  return mergeDaily(adSet.ads.map((ad) => ad.daily));
}

export type MetricKey = keyof DerivedMetrics;

/** Lower is better for cost metrics, so direction is inverted for them. */
const costMetrics = new Set<MetricKey>(["cpm", "cpc", "cpa", "spend"]);

export function isCostMetric(metric: MetricKey): boolean {
  return costMetrics.has(metric);
}

/**
 * Compares the latest window against the one before it. Returns a flat delta
 * when there is not enough history to make an honest comparison.
 */
export function windowDelta(
  daily: DailyPoint[],
  metric: MetricKey,
  windowSize = 7,
): MetricDelta {
  if (daily.length < windowSize * 2) {
    const current = deriveMetrics(totalsFromDaily(daily))[metric];
    return { value: current, changePct: 0, direction: "flat" };
  }
  const current = deriveMetrics(
    totalsFromDaily(daily.slice(-windowSize)),
  )[metric];
  const previous = deriveMetrics(
    totalsFromDaily(daily.slice(-windowSize * 2, -windowSize)),
  )[metric];

  // Without two comparable windows there is no trend to report.
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) {
    return { value: current, changePct: 0, direction: "flat" };
  }

  const rounded = Math.round(((current - previous) / previous) * 1000) / 10;
  return {
    value: current,
    changePct: rounded,
    direction: rounded === 0 ? "flat" : rounded > 0 ? "up" : "down",
  };
}

export function trendSeries(
  daily: DailyPoint[],
  metric: keyof MetricTotals,
  points = 14,
): number[] {
  return daily.slice(-points).map((point) => point[metric]);
}

/**
 * A child cannot run while its parent is paused, so the UI must show the
 * inherited state instead of the child's own flag.
 */
export function effectiveStatus(
  own: EntityStatus,
  parent?: EntityStatus,
): EntityStatus {
  if (!parent || parent === "active") return own;
  if (parent === "completed") return "completed";
  return own === "active" ? "paused" : own;
}

export function isEffectivelyPaused(
  own: EntityStatus,
  parent?: EntityStatus,
): boolean {
  return own === "active" && effectiveStatus(own, parent) !== "active";
}

export function pacing(spent: number, budget: number): number {
  if (budget === 0) return 0;
  return Math.min(100, Math.round((spent / budget) * 100));
}

/** Sort helper so undefined ratios sink instead of breaking the comparator. */
export function sortableValue(value: number): number {
  return Number.isFinite(value) ? value : Number.NEGATIVE_INFINITY;
}
