import { EMPTY_SCHEMA, type ToolContract } from "./types";

const campaignId: Record<string, ToolContract["inputSchema"]["properties"][string]> = {
  campaignId: {
    type: "string",
    description: "Identifier of the campaign, as returned by list_campaigns.",
  },
};

export const READ_TOOLS: ToolContract[] = [
  {
    name: "get_ad_account",
    title: "Read ad account",
    description:
      "Get the ad account this workspace session is authenticated for, including currency, time zone, and whether it is backed by demo data or a live provider. Call this first to learn the reporting currency.",
    kind: "read",
    requiresApproval: false,
    inputSchema: EMPTY_SCHEMA,
  },
  {
    name: "get_goal_progress",
    title: "Read goal progress",
    description:
      "Get the active advertising goal with its target, results so far, budget, and spend to date. Use it to judge whether delivery is on pace before proposing any change.",
    kind: "read",
    requiresApproval: false,
    inputSchema: EMPTY_SCHEMA,
  },
  {
    name: "get_account_performance",
    title: "Read account performance",
    description:
      "Get account level totals and derived metrics for the reporting window: spend, impressions, clicks, conversions, revenue, CPM, CTR, cost per conversion, and return on ad spend.",
    kind: "read",
    requiresApproval: false,
    inputSchema: EMPTY_SCHEMA,
  },
  {
    name: "list_campaigns",
    title: "List campaigns",
    description:
      "List every campaign in the account with status, objective, budget, and performance totals. Use it to find the campaign identifier needed by the other tools.",
    kind: "read",
    requiresApproval: false,
    inputSchema: EMPTY_SCHEMA,
  },
  {
    name: "get_campaign",
    title: "Read campaign",
    description:
      "Get one campaign with its ad sets and each ad set's performance. Totals always equal the sum of the ad sets inside it.",
    kind: "read",
    requiresApproval: false,
    inputSchema: {
      type: "object",
      properties: campaignId,
      required: ["campaignId"],
      additionalProperties: false,
    },
  },
  {
    name: "get_ad_set",
    title: "Read ad set",
    description:
      "Get one ad set with its audience, placements, budget, optimization goal, and the ads inside it.",
    kind: "read",
    requiresApproval: false,
    inputSchema: {
      type: "object",
      properties: {
        adSetId: {
          type: "string",
          description: "Identifier of the ad set, as returned by get_campaign.",
        },
      },
      required: ["adSetId"],
      additionalProperties: false,
    },
  },
  {
    name: "get_ad",
    title: "Read ad",
    description:
      "Get one ad with its creative content and performance. Use it before proposing a creative change so the reasoning refers to the real headline and format.",
    kind: "read",
    requiresApproval: false,
    inputSchema: {
      type: "object",
      properties: {
        adId: {
          type: "string",
          description: "Identifier of the ad, as returned by get_ad_set.",
        },
      },
      required: ["adId"],
      additionalProperties: false,
    },
  },
  {
    name: "get_performance_timeseries",
    title: "Read daily time series",
    description:
      "Get the daily metric series for the account, a campaign, an ad set, or an ad. Use it to check a trend before claiming performance is rising or falling.",
    kind: "read",
    requiresApproval: false,
    inputSchema: {
      type: "object",
      properties: {
        level: {
          type: "string",
          description: "Which level of the hierarchy to report on.",
          enum: ["account", "campaign", "ad_set", "ad"],
        },
        id: {
          type: "string",
          description:
            "Identifier of the campaign, ad set, or ad. Omit when level is account.",
        },
        days: {
          type: "integer",
          description: "How many trailing days to return, from 1 to 28.",
          minimum: 1,
          maximum: 28,
        },
      },
      required: ["level"],
      additionalProperties: false,
    },
  },
  {
    name: "get_creative_performance",
    title: "Read creative performance",
    description:
      "Rank every creative by conversions and report its click-through trend against the previous week. Use it to identify creative fatigue.",
    kind: "read",
    requiresApproval: false,
    inputSchema: EMPTY_SCHEMA,
  },
  {
    name: "detect_anomalies",
    title: "Detect anomalies",
    description:
      "Scan active ad sets and ads for spend without conversions, cost per conversion above the account median, and decaying click-through rate. Returns evidence, not opinions.",
    kind: "read",
    requiresApproval: false,
    inputSchema: EMPTY_SCHEMA,
  },
  {
    name: "get_optimization_recommendations",
    title: "Read recommendations",
    description:
      "Get ranked optimization recommendations derived from current performance, each with evidence, the proposed before and after values, and the tool that would carry it out.",
    kind: "read",
    requiresApproval: false,
    inputSchema: EMPTY_SCHEMA,
  },
  {
    name: "list_pending_changes",
    title: "List pending changes",
    description:
      "List writes that are waiting for human approval, plus recently approved or rejected ones. Call this after requesting a high impact change to see whether it was cleared.",
    kind: "read",
    requiresApproval: false,
    inputSchema: EMPTY_SCHEMA,
  },
  {
    name: "get_pending_change",
    title: "Read pending change",
    description:
      "Get one approval request by identifier, including its current decision status and the exact operations it would apply.",
    kind: "read",
    requiresApproval: false,
    inputSchema: {
      type: "object",
      properties: {
        changeId: {
          type: "string",
          description:
            "Identifier returned when the change was requested, or by list_pending_changes.",
        },
      },
      required: ["changeId"],
      additionalProperties: false,
    },
  },
  {
    name: "list_tool_executions",
    title: "List tool executions",
    description:
      "Read the audit log of tool calls made against this account, including which were blocked pending approval. Useful for explaining what has already been done.",
    kind: "read",
    requiresApproval: false,
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "integer",
          description: "How many entries to return, newest first. Default 20.",
          minimum: 1,
          maximum: 100,
        },
      },
      additionalProperties: false,
    },
  },
];
