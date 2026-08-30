import { REFERENCE_DATE, REFERENCE_TIMESTAMP } from "@/lib/demo/series";
import { formatCurrency, type MetricFormat } from "@/lib/format";
import { adHref, adSetHref, campaignHref } from "@/lib/hrefs";
import {
  accountTotals,
  adSetDaily,
  adSetTotals,
  adTotals,
  campaignDaily,
  campaignTotals,
  deriveMetrics,
  effectiveStatus,
  mergeDaily,
  trendSeries,
  windowDelta,
} from "@/lib/metrics";
import { getAdsProvider } from "@/lib/providers";
import { buildRecommendations } from "@/lib/recommendations";
import { getStore } from "@/lib/server/store";
import type {
  AdSet,
  Campaign,
  DailyPoint,
  DerivedMetrics,
  Goal,
  MetricDelta,
  PendingChange,
  PerformanceRow,
  Recommendation,
  ToolExecution,
} from "@/types/ads";

export const REPORTING_REFERENCE = {
  date: REFERENCE_DATE,
  timestamp: REFERENCE_TIMESTAMP,
};

const GOAL_TARGET = 100;
const GOAL_CAMPAIGN_ID = "cmp_course_purchase";

/**
 * Application services read through the provider so the UI and the WebMCP
 * handlers never talk to a platform directly.
 */
export function getAdAccount() {
  return getAdsProvider().getAccount();
}

export function getCampaigns(): Promise<Campaign[]> {
  return getAdsProvider().listCampaigns();
}

export function findCampaign(campaignId: string) {
  return getAdsProvider().getCampaign(campaignId);
}

export function findAdSet(adSetId: string) {
  return getAdsProvider().getAdSet(adSetId);
}

export function findAd(adId: string) {
  return getAdsProvider().getAd(adId);
}

function budgetLabel(amount: number, period: "daily" | "lifetime"): string {
  return `${formatCurrency(amount)} ${period === "daily" ? "/ day" : "lifetime"}`;
}

const objectiveLabels: Record<Campaign["objective"], string> = {
  conversions: "Conversions",
  traffic: "Traffic",
  awareness: "Awareness",
  leads: "Leads",
};

export function objectiveLabel(campaign: Campaign): string {
  return objectiveLabels[campaign.objective];
}

export async function getAccountDaily(): Promise<DailyPoint[]> {
  const campaigns = await getCampaigns();
  return mergeDaily(campaigns.map(campaignDaily));
}

export async function getAccountMetrics(): Promise<DerivedMetrics> {
  return deriveMetrics(accountTotals(await getCampaigns()));
}

export interface AccountKpi {
  key: string;
  label: string;
  value: number;
  format: MetricFormat;
  delta: MetricDelta;
  invertDelta: boolean;
  neutralDelta: boolean;
  trend: number[];
  helpText: string;
}

export async function getAccountKpis(): Promise<AccountKpi[]> {
  const daily = await getAccountDaily();
  const metrics = await getAccountMetrics();

  return [
    {
      key: "spend",
      label: "Spend",
      value: metrics.spend,
      format: "currencyCompact",
      delta: windowDelta(daily, "spend"),
      invertDelta: false,
      neutralDelta: true,
      trend: trendSeries(daily, "spend"),
      helpText: "Delivered across all active campaigns",
    },
    {
      key: "conversions",
      label: "Conversions",
      value: metrics.conversions,
      format: "number",
      delta: windowDelta(daily, "conversions"),
      invertDelta: false,
      neutralDelta: false,
      trend: trendSeries(daily, "conversions"),
      helpText: "Course purchases attributed in window",
    },
    {
      key: "cpa",
      label: "Cost per conversion",
      value: metrics.cpa,
      format: "currency",
      delta: windowDelta(daily, "cpa"),
      invertDelta: true,
      neutralDelta: false,
      trend: trendSeries(daily, "spend"),
      helpText: "Lower is better at a fixed budget",
    },
    {
      key: "roas",
      label: "ROAS",
      value: metrics.roas,
      format: "roas",
      delta: windowDelta(daily, "roas"),
      invertDelta: false,
      neutralDelta: false,
      trend: trendSeries(daily, "revenue"),
      helpText: "Revenue returned per unit of spend",
    },
  ];
}

export interface TrendPointView {
  date: string;
  primary: number;
  secondary: number;
}

/** Conversions against spend, the pairing used on every trend surface. */
export function toTrendView(daily: DailyPoint[]): TrendPointView[] {
  return daily.map((point) => ({
    date: point.date,
    primary: point.conversions,
    secondary: point.spend,
  }));
}

/** Campaign rows for the account level table. */
export async function getCampaignRows(): Promise<PerformanceRow[]> {
  const campaigns = await getCampaigns();
  return campaigns.map((campaign) => ({
    id: campaign.id,
    name: campaign.name,
    href: campaignHref(campaign.id),
    status: campaign.status,
    effectiveStatus: campaign.status,
    subtitle: `${objectiveLabel(campaign)} · ${campaign.adSets.length} ad sets`,
    budgetLabel: budgetLabel(campaign.budget.amount, campaign.budget.period),
    budgetInherited: false,
    metrics: deriveMetrics(campaignTotals(campaign)),
    trend: trendSeries(campaignDaily(campaign), "conversions"),
  }));
}

/** Ad set rows for a campaign detail page. */
export function getAdSetRows(campaign: Campaign): PerformanceRow[] {
  return campaign.adSets.map((adSet) => ({
    id: adSet.id,
    name: adSet.name,
    href: adSetHref(campaign.id, adSet.id),
    status: adSet.status,
    effectiveStatus: effectiveStatus(adSet.status, campaign.status),
    subtitle: `${adSet.audience.ageRange} · ${adSet.audience.locations.join(", ")}`,
    budgetLabel: budgetLabel(adSet.budget.amount, adSet.budget.period),
    budgetInherited: false,
    metrics: deriveMetrics(adSetTotals(adSet)),
    trend: trendSeries(adSetDaily(adSet), "conversions"),
  }));
}

/** Ad rows for an ad set detail page. Ads inherit their ad set budget. */
export function getAdRows(campaign: Campaign, adSet: AdSet): PerformanceRow[] {
  const parentStatus = effectiveStatus(adSet.status, campaign.status);
  return adSet.ads.map((ad) => ({
    id: ad.id,
    name: ad.name,
    href: adHref(campaign.id, adSet.id, ad.id),
    status: ad.status,
    effectiveStatus: effectiveStatus(ad.status, parentStatus),
    subtitle: `${ad.creative.format} · ${ad.creative.name}`,
    budgetLabel: budgetLabel(adSet.budget.amount, adSet.budget.period),
    budgetInherited: true,
    metrics: deriveMetrics(adTotals(ad)),
    trend: trendSeries(ad.daily, "conversions"),
  }));
}

/**
 * The goal is scoped to the campaign that carries it, so progress and budget
 * pacing cannot be inflated by unrelated campaigns in the account.
 */
export async function getGoal(): Promise<Goal> {
  const campaign = await findCampaign(GOAL_CAMPAIGN_ID);
  if (!campaign) {
    throw new Error(`Goal campaign ${GOAL_CAMPAIGN_ID} is missing`);
  }
  const totals = campaignTotals(campaign);

  return {
    id: "goal_100_purchases",
    objective: "Reach 100 course purchases before the September cohort closes",
    metricLabel: "Purchases",
    target: GOAL_TARGET,
    current: totals.conversions,
    budget: campaign.budget.amount,
    spent: totals.spend,
    startDate: campaign.startDate,
    endDate: campaign.endDate ?? "2026-09-15",
  };
}

export async function getRecommendations(): Promise<Recommendation[]> {
  return buildRecommendations(await getCampaigns());
}

export function getToolExecutions(): ToolExecution[] {
  return getStore().executions;
}

export function getPendingChanges(): PendingChange[] {
  return getStore().pendingChanges;
}

export function findPendingChange(changeId: string): PendingChange | undefined {
  return getStore().pendingChanges.find((change) => change.id === changeId);
}

export interface CreativeRow {
  id: string;
  name: string;
  adName: string;
  format: string;
  href: string;
  metrics: DerivedMetrics;
  ctrDelta: MetricDelta;
}

export async function getCreativeRows(): Promise<CreativeRow[]> {
  const campaigns = await getCampaigns();
  return campaigns
    .flatMap((campaign) =>
      campaign.adSets.flatMap((adSet) =>
        adSet.ads.map((ad) => ({
          id: ad.creative.id,
          name: ad.creative.name,
          adName: ad.name,
          format: ad.creative.format,
          href: adHref(campaign.id, adSet.id, ad.id),
          metrics: deriveMetrics(adTotals(ad)),
          ctrDelta: windowDelta(ad.daily, "ctr"),
        })),
      ),
    )
    .sort((a, b) => b.metrics.conversions - a.metrics.conversions);
}

export interface AdSetBreakdown {
  id: string;
  name: string;
  spend: number;
  conversions: number;
  cpa: number;
}

export async function getAdSetBreakdown(): Promise<AdSetBreakdown[]> {
  const campaigns = await getCampaigns();
  return campaigns
    .flatMap((campaign) => campaign.adSets)
    .map((adSet) => {
      const metrics = deriveMetrics(adSetTotals(adSet));
      return {
        id: adSet.id,
        name: adSet.name,
        spend: metrics.spend,
        conversions: metrics.conversions,
        cpa: metrics.cpa,
      };
    })
    .filter((entry) => entry.spend > 0)
    .sort((a, b) => b.spend - a.spend);
}
