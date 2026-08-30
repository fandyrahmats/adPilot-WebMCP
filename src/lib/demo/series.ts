import type { DailyPoint } from "@/types/ads";

/**
 * The demo dataset is generated from fixed seeds and a fixed reference date so
 * every render, server or client, produces identical numbers.
 */
export const REFERENCE_DATE = "2026-08-29";
export const REFERENCE_TIMESTAMP = "2026-08-29T09:40:00Z";
export const DEFAULT_WINDOW_DAYS = 28;

export interface PerformanceProfile {
  /** Average daily spend in the account currency. */
  dailySpend: number;
  cpm: number;
  /** Click-through rate as a fraction of impressions. */
  ctr: number;
  /** Conversion rate as a fraction of clicks. */
  cvr: number;
  /** Average revenue per conversion. */
  aov: number;
  /** Reach as a fraction of impressions. */
  reachRatio: number;
  /**
   * Daily drift on click-through rate, negative for a fatiguing creative.
   * Applied once so cost metrics stay inside a believable range.
   */
  drift: number;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function dateOffset(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function dateRange(
  days = DEFAULT_WINDOW_DAYS,
  endDate = REFERENCE_DATE,
): string[] {
  return Array.from({ length: days }, (_, index) =>
    dateOffset(endDate, index - days + 1),
  );
}

/**
 * Builds an internally consistent daily series: spend drives impressions via
 * CPM, impressions drive clicks via CTR, clicks drive conversions via CVR.
 * Metrics therefore never contradict each other.
 */
export function buildDaily(
  seed: string,
  profile: PerformanceProfile,
  days = DEFAULT_WINDOW_DAYS,
): DailyPoint[] {
  const random = mulberry32(hashSeed(seed));
  let conversionCarry = 0;

  return dateRange(days).map((date, index) => {
    const jitter = (base: number, spread: number) =>
      base * (1 + (random() * 2 - 1) * spread);
    // Drift is applied to click-through rate only. Applying it to several
    // factors at once would compound and produce impossible cost figures.
    const fatigue = Math.max(0.35, 1 + profile.drift * index);
    // Weekends convert a little worse for a course audience.
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
    const weekendFactor = weekday === 0 || weekday === 6 ? 0.88 : 1.03;

    const spend = Math.round(jitter(profile.dailySpend, 0.12) * weekendFactor);
    const cpm = jitter(profile.cpm, 0.1);
    const impressions = Math.round((spend / cpm) * 1000);
    const clicks = Math.round(impressions * jitter(profile.ctr, 0.14) * fatigue);
    const rawConversions =
      clicks * jitter(profile.cvr, 0.18) * weekendFactor + conversionCarry;
    const conversions = Math.max(0, Math.floor(rawConversions));
    conversionCarry = rawConversions - conversions;

    return {
      date,
      spend,
      impressions,
      reach: Math.round(impressions * profile.reachRatio),
      clicks,
      conversions,
      revenue: Math.round(conversions * jitter(profile.aov, 0.05)),
    };
  });
}
