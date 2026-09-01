import {
  findPendingChange,
  getAccountDaily,
  getAccountMetrics,
  getAdAccount,
  getCampaigns,
  getCreativeRows,
  getGoal,
  getPendingChanges,
  getRecommendations,
  getToolExecutions,
  REPORTING_REFERENCE,
} from "@/lib/ads-service";
import { detectAnomalies } from "@/lib/anomalies";
import {
  adSetDaily,
  adSetTotals,
  adTotals,
  campaignDaily,
  campaignTotals,
  deriveMetrics,
  effectiveStatus,
} from "@/lib/metrics";
import { adHref, adSetHref, campaignHref } from "@/lib/hrefs";
import { getAdsProvider } from "@/lib/providers";
import {
  optionalInteger,
  optionalString,
  requireEnum,
  requireString,
  ToolError,
} from "../args";
import type { ToolHandler } from "./types";
import type { DailyPoint } from "@/types/ads";

function rounded(value: number): number | null {
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : null;
}

/** Ratios are nulled rather than zeroed when undefined, so agents cannot misread them. */
function metricsView(metrics: ReturnType<typeof deriveMetrics>) {
  return {
    spend: metrics.spend,
    impressions: metrics.impressions,
    reach: metrics.reach,
    clicks: metrics.clicks,
    conversions: metrics.conversions,
    revenue: metrics.revenue,
    cpm: rounded(metrics.cpm),
    ctrPercent: rounded(metrics.ctr),
    cpc: rounded(metrics.cpc),
    costPerConversion: rounded(metrics.cpa),
    roas: rounded(metrics.roas),
  };
}

const getAdAccountTool: ToolHandler = async () => {
  const account = await getAdAccount();
  return {
    summary: `Account ${account.name} (${account.id}), reporting in ${account.currency}, backed by ${account.providerLabel}.`,
    data: { ...account, reportingWindow: REPORTING_REFERENCE },
  };
};

const getGoalProgressTool: ToolHandler = async () => {
  const goal = await getGoal();
  const remaining = Math.max(0, goal.target - goal.current);
  return {
    summary: `${goal.current} of ${goal.target} ${goal.metricLabel.toLowerCase()} with ${goal.spent} of ${goal.budget} spent. ${remaining} remaining.`,
    data: { ...goal, remaining },
  };
};

const getAccountPerformanceTool: ToolHandler = async () => {
  const metrics = metricsView(await getAccountMetrics());
  return {
    summary: `Account spent ${metrics.spend} for ${metrics.conversions} conversions at ${metrics.costPerConversion ?? "no"} cost per conversion.`,
    data: { window: REPORTING_REFERENCE, metrics },
  };
};

const listCampaignsTool: ToolHandler = async () => {
  const campaigns = (await getCampaigns()).map((campaign) => ({
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    objective: campaign.objective,
    budget: campaign.budget,
    adSetCount: campaign.adSets.length,
    metrics: metricsView(deriveMetrics(campaignTotals(campaign))),
  }));
  return {
    summary: `${campaigns.length} campaigns: ${campaigns.map((entry) => `${entry.name} (${entry.status})`).join(", ")}.`,
    uiHref: "/campaigns",
    data: { campaigns },
  };
};

const getCampaignTool: ToolHandler = async (args) => {
  const campaign = await getAdsProvider().getCampaign(
    requireString(args, "campaignId"),
  );
  if (!campaign) throw new ToolError("Campaign not found in this account", 404);

  return {
    summary: `${campaign.name} is ${campaign.status} with ${campaign.adSets.length} ad sets.`,
    uiHref: campaignHref(campaign.id),
    data: {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      objective: campaign.objective,
      budget: campaign.budget,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      metrics: metricsView(deriveMetrics(campaignTotals(campaign))),
      adSets: campaign.adSets.map((adSet) => ({
        id: adSet.id,
        name: adSet.name,
        status: adSet.status,
        effectiveStatus: effectiveStatus(adSet.status, campaign.status),
        budget: adSet.budget,
        adCount: adSet.ads.length,
        metrics: metricsView(deriveMetrics(adSetTotals(adSet))),
      })),
    },
  };
};

const getAdSetTool: ToolHandler = async (args) => {
  const located = await getAdsProvider().getAdSet(requireString(args, "adSetId"));
  if (!located) throw new ToolError("Ad set not found in this account", 404);
  const { campaign, adSet } = located;

  return {
    summary: `${adSet.name} in ${campaign.name} is ${adSet.status} on a daily budget of ${adSet.budget.amount}.`,
    uiHref: adSetHref(campaign.id, adSet.id),
    data: {
      id: adSet.id,
      name: adSet.name,
      campaignId: campaign.id,
      campaignName: campaign.name,
      status: adSet.status,
      effectiveStatus: effectiveStatus(adSet.status, campaign.status),
      budget: adSet.budget,
      audience: adSet.audience,
      placements: adSet.placements,
      optimizationGoal: adSet.optimizationGoal,
      bidStrategy: adSet.bidStrategy,
      metrics: metricsView(deriveMetrics(adSetTotals(adSet))),
      ads: adSet.ads.map((ad) => ({
        id: ad.id,
        name: ad.name,
        status: ad.status,
        format: ad.creative.format,
        metrics: metricsView(deriveMetrics(adTotals(ad))),
      })),
    },
  };
};

const getAdTool: ToolHandler = async (args) => {
  const located = await getAdsProvider().getAd(requireString(args, "adId"));
  if (!located) throw new ToolError("Ad not found in this account", 404);
  const { campaign, adSet, ad } = located;

  return {
    summary: `${ad.name} is ${ad.status}, a ${ad.creative.format} creative headlined "${ad.creative.headline}".`,
    uiHref: adHref(campaign.id, adSet.id, ad.id),
    data: {
      id: ad.id,
      name: ad.name,
      adSetId: adSet.id,
      campaignId: campaign.id,
      status: ad.status,
      effectiveStatus: effectiveStatus(
        ad.status,
        effectiveStatus(adSet.status, campaign.status),
      ),
      inheritedDailyBudget: adSet.budget.amount,
      creative: ad.creative,
      metrics: metricsView(deriveMetrics(adTotals(ad))),
    },
  };
};

async function resolveSeries(
  level: "account" | "campaign" | "ad_set" | "ad",
  id: string | undefined,
): Promise<DailyPoint[]> {
  if (level === "account") return getAccountDaily();
  if (!id) throw new ToolError(`"id" is required when level is ${level}`);
  const provider = getAdsProvider();

  if (level === "campaign") {
    const campaign = await provider.getCampaign(id);
    if (!campaign) throw new ToolError("Campaign not found", 404);
    return campaignDaily(campaign);
  }
  if (level === "ad_set") {
    const located = await provider.getAdSet(id);
    if (!located) throw new ToolError("Ad set not found", 404);
    return adSetDaily(located.adSet);
  }
  const located = await provider.getAd(id);
  if (!located) throw new ToolError("Ad not found", 404);
  return located.ad.daily;
}

const getTimeseriesTool: ToolHandler = async (args) => {
  const level = requireEnum(args, "level", [
    "account",
    "campaign",
    "ad_set",
    "ad",
  ] as const);
  const id = optionalString(args, "id");
  const days = optionalInteger(args, "days", { min: 1, max: 28 }) ?? 28;

  const series = await resolveSeries(level, id);
  const points = series.slice(-days);
  const account = await getAdAccount();

  return {
    summary: `${points.length} daily points for ${level}${id ? ` ${id}` : ""} ending ${REPORTING_REFERENCE.date}.`,
    data: { level, id: id ?? account.id, points },
  };
};

const getCreativePerformanceTool: ToolHandler = async () => {
  const creatives = (await getCreativeRows()).map((row) => ({
    id: row.id,
    name: row.name,
    adName: row.adName,
    format: row.format,
    metrics: metricsView(row.metrics),
    ctrChangePercent: row.ctrDelta.changePct,
    ctrTrend: row.ctrDelta.direction,
  }));
  return {
    summary: `${creatives.length} creatives ranked by conversions. Top: ${creatives[0]?.name ?? "none"}.`,
    uiHref: "/insights",
    data: { creatives },
  };
};

const detectAnomaliesTool: ToolHandler = async () => {
  const anomalies = detectAnomalies(await getCampaigns());
  return {
    summary:
      anomalies.length === 0
        ? "No anomalies detected in active ad sets or ads."
        : `${anomalies.length} anomalies: ${anomalies.map((entry) => `${entry.targetName} (${entry.headline})`).join("; ")}.`,
    uiHref: "/insights",
    data: { anomalies },
  };
};

const getRecommendationsTool: ToolHandler = async () => {
  const recommendations = await getRecommendations();
  return {
    summary:
      recommendations.length === 0
        ? "No recommendations right now."
        : `${recommendations.length} recommendations, highest impact first: ${recommendations.map((entry) => entry.id).join(", ")}.`,
    uiHref: "/review",
    data: { recommendations },
  };
};

const listPendingChangesTool: ToolHandler = async () => {
  const changes = getPendingChanges();
  const waiting = changes.filter((change) => change.status === "pending");
  return {
    summary:
      changes.length === 0
        ? "No change requests have been raised yet."
        : `${waiting.length} awaiting approval out of ${changes.length} total requests.`,
    uiHref: "/review",
    data: { changes },
  };
};

const getPendingChangeTool: ToolHandler = async (args) => {
  const change = findPendingChange(requireString(args, "changeId"));
  if (!change) throw new ToolError("Change request not found", 404);
  return {
    summary: `${change.id} is ${change.status}: ${change.summary}`,
    data: change,
  };
};

const listExecutionsTool: ToolHandler = async (args) => {
  // Capped at 25 because each entry carries a prose summary: a larger page
  // returns tens of thousands of characters, well past the output budget
  // Chrome's tool guidance recommends staying inside.
  const limit = optionalInteger(args, "limit", { min: 1, max: 25 }) ?? 10;
  const executions = getToolExecutions().slice(0, limit);
  return {
    summary: `${executions.length} most recent tool executions.`,
    uiHref: "/activity",
    data: { executions },
  };
};

export const READ_HANDLERS: Record<string, ToolHandler> = {
  get_ad_account: getAdAccountTool,
  get_goal_progress: getGoalProgressTool,
  get_account_performance: getAccountPerformanceTool,
  list_campaigns: listCampaignsTool,
  get_campaign: getCampaignTool,
  get_ad_set: getAdSetTool,
  get_ad: getAdTool,
  get_performance_timeseries: getTimeseriesTool,
  get_creative_performance: getCreativePerformanceTool,
  detect_anomalies: detectAnomaliesTool,
  get_recommendations: getRecommendationsTool,
  list_pending_changes: listPendingChangesTool,
  get_pending_change: getPendingChangeTool,
  list_tool_executions: listExecutionsTool,
};
