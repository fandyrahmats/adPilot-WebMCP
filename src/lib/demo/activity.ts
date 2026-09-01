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
    // Decided, not open. An "awaiting approval" seed would claim a queue entry
    // that /review cannot show, since the queue starts empty on a fresh boot.
    toolName: "reject_pending_change",
    kind: "write",
    status: "success",
    actor: "human",
    summary:
      "Rejected an earlier budget shift on University Students 18-24, leaving its daily budget as it was.",
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
    toolName: "get_performance_timeseries",
    kind: "read",
    status: "success",
    actor: "agent",
    summary: "Read 28 days of daily metrics for the purchase campaign.",
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
    toolName: "get_goal_progress",
    kind: "read",
    status: "success",
    actor: "agent",
    summary: "Read the 100 purchase goal and the budget pacing behind it.",
    minutesAgo: 128,
    durationMs: 1_760,
  },
  {
    id: "exec_01",
    toolName: "list_campaigns",
    kind: "read",
    status: "success",
    actor: "agent",
    summary: "Listed 3 campaigns with status, objective, and performance totals.",
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
