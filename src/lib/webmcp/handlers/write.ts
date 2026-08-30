import { getRecommendations } from "@/lib/ads-service";
import { formatCurrency } from "@/lib/format";
import { adHref, adSetHref, campaignHref } from "@/lib/hrefs";
import { getAdsProvider } from "@/lib/providers";
import { requestChange } from "@/lib/server/changes";
import {
  optionalDate,
  optionalEnum,
  optionalString,
  requireEnum,
  requireInteger,
  requireString,
  ToolError,
} from "../args";
import type { ToolHandler } from "./types";
import type { ChangeOperation } from "@/types/ads";

const createCampaign: ToolHandler = async (args) => {
  const name = requireString(args, "name");
  const objective = requireEnum(args, "objective", [
    "conversions",
    "traffic",
    "awareness",
    "leads",
  ] as const);
  const budgetAmount = requireInteger(args, "budgetAmount", { min: 1 });
  const budgetPeriod = requireEnum(args, "budgetPeriod", [
    "daily",
    "lifetime",
  ] as const);

  const campaign = await getAdsProvider().createCampaign({
    name,
    objective,
    budget: { amount: budgetAmount, period: budgetPeriod },
    startDate: optionalDate(args, "startDate") ?? "2026-08-30",
    endDate: optionalDate(args, "endDate") ?? null,
  });

  return {
    summary: `Created campaign "${name}" (${campaign.id}) as paused with a ${budgetPeriod} budget of ${formatCurrency(budgetAmount)}. Activating it needs approval.`,
    data: {
      campaign: { ...campaign, adSets: [] },
      href: campaignHref(campaign.id),
    },
  };
};

const createAdSet: ToolHandler = async (args) => {
  const locations = optionalString(args, "locations");

  const { campaign, adSet } = await getAdsProvider().createAdSet({
    campaignId: requireString(args, "campaignId"),
    name: requireString(args, "name"),
    dailyBudget: requireInteger(args, "dailyBudget", { min: 1 }),
    audience: {
      name: requireString(args, "audienceName"),
      sizeEstimate: 0,
      locations: locations
        ? locations.split(",").map((entry) => entry.trim())
        : [],
      ageRange: optionalString(args, "ageRange") ?? "All ages",
      interests: [],
    },
    optimizationGoal:
      optionalEnum(args, "optimizationGoal", [
        "Purchases",
        "Leads",
        "Link clicks",
        "Reach",
      ] as const) ?? "Purchases",
  });

  return {
    summary: `Created ad set "${adSet.name}" (${adSet.id}) under ${campaign.name} as paused with a daily budget of ${formatCurrency(adSet.budget.amount)}.`,
    data: {
      adSet: { ...adSet, ads: [] },
      href: adSetHref(campaign.id, adSet.id),
    },
  };
};

const createAd: ToolHandler = async (args) => {
  const { campaign, adSet, ad } = await getAdsProvider().createAd({
    adSetId: requireString(args, "adSetId"),
    name: requireString(args, "name"),
    format: requireEnum(args, "format", ["image", "video", "carousel"] as const),
    headline: requireString(args, "headline"),
    body: requireString(args, "body"),
    callToAction: optionalString(args, "callToAction") ?? "Learn more",
  });

  return {
    summary: `Created ad "${ad.name}" (${ad.id}) under ${adSet.name} as paused. It has no delivery data until it runs.`,
    data: { ad, href: adHref(campaign.id, adSet.id, ad.id) },
  };
};

const updateAdSetBudget: ToolHandler = async (args) => {
  const adSetId = requireString(args, "adSetId");
  const located = await getAdsProvider().getAdSet(adSetId);
  if (!located) throw new ToolError("Ad set not found in this account", 404);
  const { campaign, adSet } = located;

  const dailyBudget = requireInteger(args, "dailyBudget", { min: 0 });
  const reason = requireString(args, "reason");
  if (dailyBudget === adSet.budget.amount) {
    throw new ToolError("Proposed budget matches the current budget");
  }

  const change = requestChange({
    toolName: "update_ad_set_budget",
    level: "ad_set",
    targetId: adSet.id,
    targetName: adSet.name,
    targetHref: adSetHref(campaign.id, adSet.id),
    summary: `Set ${adSet.name} daily budget to ${formatCurrency(dailyBudget)}`,
    reason,
    impact: "high",
    changes: [
      {
        label: `${adSet.name} daily budget`,
        before: formatCurrency(adSet.budget.amount),
        after: formatCurrency(dailyBudget),
      },
    ],
    operations: [
      {
        type: "ad_set_budget",
        campaignId: campaign.id,
        adSetId: adSet.id,
        amount: dailyBudget,
      },
    ],
    requestedBy: "agent",
  });

  return {
    summary: `Budget change queued for approval as ${change.id}. ${adSet.name} still runs at ${formatCurrency(adSet.budget.amount)} per day until a person approves it.`,
    data: { change, applied: false },
    awaitingApproval: true,
  };
};

interface StatusTargetView {
  name: string;
  current: string;
  href: string;
  operation: ChangeOperation;
}

async function resolveStatusTarget(
  level: "campaign" | "ad_set" | "ad",
  id: string,
  status: "active" | "paused",
): Promise<StatusTargetView> {
  const provider = getAdsProvider();

  if (level === "campaign") {
    const campaign = await provider.getCampaign(id);
    if (!campaign) throw new ToolError("Campaign not found", 404);
    return {
      name: campaign.name,
      current: campaign.status,
      href: campaignHref(campaign.id),
      operation: {
        type: "entity_status",
        campaignId: campaign.id,
        adSetId: null,
        adId: null,
        status,
      },
    };
  }

  if (level === "ad_set") {
    const located = await provider.getAdSet(id);
    if (!located) throw new ToolError("Ad set not found", 404);
    return {
      name: located.adSet.name,
      current: located.adSet.status,
      href: adSetHref(located.campaign.id, located.adSet.id),
      operation: {
        type: "entity_status",
        campaignId: located.campaign.id,
        adSetId: located.adSet.id,
        adId: null,
        status,
      },
    };
  }

  const located = await provider.getAd(id);
  if (!located) throw new ToolError("Ad not found", 404);
  return {
    name: located.ad.name,
    current: located.ad.status,
    href: adHref(located.campaign.id, located.adSet.id, located.ad.id),
    operation: {
      type: "entity_status",
      campaignId: located.campaign.id,
      adSetId: located.adSet.id,
      adId: located.ad.id,
      status,
    },
  };
}

const updateEntityStatus: ToolHandler = async (args) => {
  const level = requireEnum(args, "level", ["campaign", "ad_set", "ad"] as const);
  const id = requireString(args, "id");
  const status = requireEnum(args, "status", ["active", "paused"] as const);
  const reason = requireString(args, "reason");

  const target = await resolveStatusTarget(level, id, status);
  if (target.current === status) {
    throw new ToolError(`${target.name} is already ${status}`);
  }

  const change = requestChange({
    toolName: "update_entity_status",
    level,
    targetId: id,
    targetName: target.name,
    targetHref: target.href,
    summary: `${status === "active" ? "Activate" : "Pause"} ${target.name}`,
    reason,
    impact: "high",
    changes: [
      {
        label: `${target.name} status`,
        before: target.current === "active" ? "Active" : "Paused",
        after: status === "active" ? "Active" : "Paused",
      },
    ],
    operations: [target.operation],
    requestedBy: "agent",
  });

  return {
    summary: `Status change queued for approval as ${change.id}. ${target.name} remains ${target.current} until a person approves it.`,
    data: { change, applied: false },
    awaitingApproval: true,
  };
};

const applyRecommendation: ToolHandler = async (args) => {
  const recommendationId = requireString(args, "recommendationId");
  const recommendations = await getRecommendations();
  const recommendation = recommendations.find(
    (entry) => entry.id === recommendationId,
  );
  if (!recommendation) {
    throw new ToolError("Recommendation not found or no longer relevant", 404);
  }
  if (recommendation.operations.length === 0) {
    throw new ToolError("This recommendation has no executable operations");
  }

  const change = requestChange({
    toolName: "apply_recommendation",
    level: recommendation.level,
    targetId: recommendation.targetId,
    targetName: recommendation.targetName,
    targetHref: recommendation.targetHref,
    summary: recommendation.title,
    reason: `${recommendation.rationale} ${recommendation.evidence.join(" ")}`,
    impact: recommendation.impact,
    changes: recommendation.changes,
    operations: recommendation.operations,
    requestedBy: "agent",
    sourceRecommendationId: recommendation.id,
  });

  return {
    summary: `Recommendation ${recommendationId} queued for approval as ${change.id}. Nothing has changed yet.`,
    data: { change, applied: false },
    awaitingApproval: true,
  };
};

export const WRITE_HANDLERS: Record<string, ToolHandler> = {
  create_campaign: createCampaign,
  create_ad_set: createAdSet,
  create_ad: createAd,
  update_ad_set_budget: updateAdSetBudget,
  update_entity_status: updateEntityStatus,
  apply_recommendation: applyRecommendation,
};
