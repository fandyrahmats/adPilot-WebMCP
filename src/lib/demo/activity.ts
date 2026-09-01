import type { ToolExecution } from "@/types/ads";
import { REFERENCE_TIMESTAMP } from "./series";

interface ActivitySeed {
  id: string;
  toolName: string;
  kind: "read" | "write";
  status: ToolExecution["status"];
  actor: ToolExecution["actor"];
  summary: string;
  minutesAgo: number;
  durationMs: number;
}

const SEEDS: ActivitySeed[] = [
  {
    id: "exec_09",
    toolName: "get_recommendations",
    kind: "read",
    status: "success",
    actor: "agent",
    summary: "Returned 3 recommendations ranked by expected impact.",
    minutesAgo: 4,
    durationMs: 412,
  },
  {
    id: "exec_08",
    toolName: "update_ad_set_budget",
    kind: "write",
    status: "awaiting_approval",
    actor: "agent",
    summary:
      "Budget shift from University Students 18-24 to Lookalike - Past Buyers 3% is queued for human approval.",
    minutesAgo: 18,
    durationMs: 260,
  },
  {
    id: "exec_07",
    toolName: "detect_anomalies",
    kind: "read",
    status: "success",
    actor: "agent",
    summary: "Flagged 1 ad set with cost per conversion above the account median.",
    minutesAgo: 26,
    durationMs: 688,
  },
  {
    id: "exec_06",
    toolName: "get_ad_performance",
    kind: "read",
    status: "success",
    actor: "agent",
    summary: "Read 28 days of daily metrics for 6 ads.",
    minutesAgo: 41,
    durationMs: 534,
  },
  {
    id: "exec_05",
    toolName: "create_ad",
    kind: "write",
    status: "success",
    actor: "agent",
    summary: "Created Reminder - Seats left under Site Visitors 30D.",
    minutesAgo: 96,
    durationMs: 1_140,
  },
  {
    id: "exec_04",
    toolName: "create_ad_set",
    kind: "write",
    status: "success",
    actor: "agent",
    summary: "Created Site Visitors 30D with a daily budget of Rp150,000.",
    minutesAgo: 104,
    durationMs: 980,
  },
  {
    id: "exec_03",
    toolName: "create_campaign",
    kind: "write",
    status: "success",
    actor: "human",
    summary:
      "Approved and created Retargeting - Pricing Page Visitors with a lifetime budget of Rp4,200,000.",
    minutesAgo: 112,
    durationMs: 1_310,
  },
  {
    id: "exec_02",
    toolName: "build_campaign_plan",
    kind: "read",
    status: "success",
    actor: "agent",
    summary: "Drafted a 3 ad set plan against the 100 purchase goal.",
    minutesAgo: 128,
    durationMs: 1_760,
  },
  {
    id: "exec_01",
    toolName: "get_account_overview",
    kind: "read",
    status: "success",
    actor: "agent",
    summary: "Read account totals, goal progress, and campaign list.",
    minutesAgo: 134,
    durationMs: 302,
  },
];

function timestampFor(minutesAgo: number): string {
  const date = new Date(REFERENCE_TIMESTAMP);
  date.setUTCMinutes(date.getUTCMinutes() - minutesAgo);
  return date.toISOString();
}

export const DEMO_TOOL_EXECUTIONS: ToolExecution[] = SEEDS.map((seed) => ({
  id: seed.id,
  toolName: seed.toolName,
  kind: seed.kind,
  status: seed.status,
  actor: seed.actor,
  summary: seed.summary,
  startedAt: timestampFor(seed.minutesAgo),
  durationMs: seed.durationMs,
}));
