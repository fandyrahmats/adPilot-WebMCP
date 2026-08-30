import type { ToolContract } from "./types";

export const WRITE_TOOLS: ToolContract[] = [
  {
    name: "create_campaign",
    title: "Create campaign",
    description:
      "Create a campaign. It is created paused so it cannot spend before a human activates it, which is why this call does not need approval.",
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
      "Create an ad set inside an existing campaign, defining audience and daily budget. Created paused. An ad set cannot exist without a parent campaign.",
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
      "Create an ad with its creative inside an existing ad set. Created paused. An ad cannot exist without a parent ad set.",
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
        callToAction: {
          type: "string",
          description: "Call to action label, such as Enroll now.",
        },
      },
      required: ["adSetId", "name", "format", "headline", "body"],
      additionalProperties: false,
    },
  },
  {
    name: "update_ad_set_budget",
    title: "Request budget change",
    description:
      "Request a new daily budget for an ad set. This is a high impact write: it is recorded as an approval request and only changes spend after a human approves it. Include the reasoning, because the reviewer sees it.",
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
          description: "Proposed daily budget in the account currency.",
          minimum: 0,
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
    title: "Request status change",
    description:
      "Request pausing or activating a campaign, ad set, or ad. This is a high impact write: it is held as an approval request because it starts or stops delivery.",
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
    title: "Request recommendation",
    description:
      "Turn one of the recommendations from get_optimization_recommendations into an approval request, carrying its evidence and before and after values into the review queue. Nothing changes until a human approves it.",
    kind: "write",
    requiresApproval: true,
    inputSchema: {
      type: "object",
      properties: {
        recommendationId: {
          type: "string",
          description:
            "Identifier from get_optimization_recommendations, such as rec_reallocate_budget.",
        },
      },
      required: ["recommendationId"],
      additionalProperties: false,
    },
  },
];
