import { RECOMMENDATION_IDS } from "@/lib/recommendations";
import type { ToolContract } from "./types";

export const WRITE_TOOLS: ToolContract[] = [
  {
    name: "create_campaign",
    title: "Create campaign",
    description:
      "Create a new campaign in this ad account. The dashboard also has an Add campaign form that calls this same tool, so either path produces identical results. The campaign is created paused, so it cannot spend before a human activates it, which is why this call does not need approval.",
    kind: "write",
    requiresApproval: false,
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Campaign name shown in the workspace.",
        },
        objective: {
          type: "string",
          description: "What the campaign optimizes for.",
          enum: ["conversions", "traffic", "awareness", "leads"],
        },
        budgetAmount: {
          type: "integer",
          description: "Budget in the account currency, as a whole number.",
          minimum: 1,
        },
        budgetPeriod: {
          type: "string",
          description: "Whether the budget is per day or for the whole run.",
          enum: ["daily", "lifetime"],
        },
        startDate: {
          type: "string",
          description: "First delivery date as YYYY-MM-DD.",
        },
        endDate: {
          type: "string",
          description: "Last delivery date as YYYY-MM-DD. Omit for no end date.",
        },
      },
      required: ["name", "objective", "budgetAmount", "budgetPeriod"],
      additionalProperties: false,
    },
  },
  {
    name: "create_ad_set",
    title: "Create ad set",
    description:
      "Create an ad set inside an existing campaign, defining its audience and daily budget. The dashboard also has an Add ad set form on the campaign page that calls this same tool. Created paused. An ad set cannot exist without a parent campaign, so call create_campaign first if you do not have one.",
    kind: "write",
    requiresApproval: false,
    inputSchema: {
      type: "object",
      properties: {
        campaignId: {
          type: "string",
          description: "Parent campaign identifier.",
        },
        name: { type: "string", description: "Ad set name." },
        dailyBudget: {
          type: "integer",
          description: "Daily budget in the account currency.",
          minimum: 1,
        },
        audienceName: {
          type: "string",
          description: "Short label for the audience being targeted.",
        },
        ageRange: {
          type: "string",
          description: "Age range such as 25-34.",
        },
        gender: {
          type: "string",
          description: "Gender targeting for this ad set.",
          enum: ["all", "male", "female"],
        },
        locations: {
          type: "string",
          description: "Comma separated list of locations.",
        },
        optimizationGoal: {
          type: "string",
          description: "What delivery optimizes for.",
          enum: ["Purchases", "Leads", "Link clicks", "Reach"],
        },
      },
      required: ["campaignId", "name", "dailyBudget", "audienceName"],
      additionalProperties: false,
    },
  },
  {
    name: "create_ad",
    title: "Create ad",
    description:
      "Create an ad, including its creative content, inside an existing ad set. The dashboard also has an Add ad form on the ad set page that calls this same tool. Created paused. An ad cannot exist without a parent ad set, so call create_ad_set first if you do not have one.",
    kind: "write",
    requiresApproval: false,
    inputSchema: {
      type: "object",
      properties: {
        adSetId: { type: "string", description: "Parent ad set identifier." },
        name: { type: "string", description: "Ad name." },
        format: {
          type: "string",
          description: "Creative format.",
          enum: ["image", "video", "carousel"],
        },
        headline: {
          type: "string",
          description: "Headline shown to the audience.",
        },
        body: { type: "string", description: "Body copy shown to the audience." },
        description: {
          type: "string",
          description: "Short line shown alongside the call to action link.",
        },
        callToAction: {
          type: "string",
          description: "Call to action label, such as Enroll now.",
        },
        destinationUrl: {
          type: "string",
          description: "Where the call to action link sends people.",
        },
      },
      required: ["adSetId", "name", "format", "headline", "body"],
      additionalProperties: false,
    },
  },
  {
    name: "update_ad_set_budget",
    title: "Change ad set budget (approval required)",
    description:
      "Request a new daily budget for an ad set. Called by you this is recorded as an approval request and changes nothing until a person approves it in the review queue, so include the reasoning the reviewer will read. The same control in the dashboard applies at once when a person uses it, because they are the approver.",
    kind: "write",
    requiresApproval: true,
    inputSchema: {
      type: "object",
      properties: {
        adSetId: {
          type: "string",
          description: "Ad set whose daily budget should change.",
        },
        dailyBudget: {
          type: "integer",
          description:
            "Proposed daily budget in the account currency. Use update_entity_status to stop delivery, not a budget of zero.",
          minimum: 1,
        },
        reason: {
          type: "string",
          description:
            "Why the change is justified, citing the metrics that support it.",
        },
      },
      required: ["adSetId", "dailyBudget", "reason"],
      additionalProperties: false,
    },
  },
  {
    name: "update_entity_status",
    title: "Pause or activate (approval required)",
    description:
      "Request pausing or activating a campaign, ad set, or ad. Called by you, this is held as an approval request and delivery does not start or stop until a person approves it, so never report the entity as paused or active on the strength of this call alone; read it back if you need to be sure. The equivalent dashboard control applies immediately when a person clicks it themselves, because they are the approver.",
    kind: "write",
    requiresApproval: true,
    inputSchema: {
      type: "object",
      properties: {
        level: {
          type: "string",
          description: "Which level the change applies to.",
          enum: ["campaign", "ad_set", "ad"],
        },
        id: {
          type: "string",
          description: "Identifier of the campaign, ad set, or ad.",
        },
        status: {
          type: "string",
          description: "Requested status.",
          enum: ["active", "paused"],
        },
        reason: {
          type: "string",
          description: "Why delivery should start or stop.",
        },
      },
      required: ["level", "id", "status", "reason"],
      additionalProperties: false,
    },
  },
  {
    name: "apply_recommendation",
    title: "Apply a recommendation (approval required)",
    description:
      "Turn one of the recommendations from get_recommendations into an approval request, carrying its evidence and before and after values into the review queue. Called by you, nothing changes until a person approves it. A person applying the same recommendation from the dashboard does not wait, because they are the approver.",
    kind: "write",
    requiresApproval: true,
    inputSchema: {
      type: "object",
      properties: {
        recommendationId: {
          type: "string",
          description:
            "Identifier from get_recommendations. Call that tool first, because not every recommendation is available at all times.",
          enum: RECOMMENDATION_IDS,
        },
      },
      required: ["recommendationId"],
      additionalProperties: false,
    },
  },
];
