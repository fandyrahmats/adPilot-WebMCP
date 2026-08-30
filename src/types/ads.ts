export type EntityStatus = "active" | "paused" | "draft" | "completed";

export type HierarchyLevel = "campaign" | "ad_set" | "ad";

export type CampaignObjective =
  | "conversions"
  | "traffic"
  | "awareness"
  | "leads";

export type BudgetPeriod = "daily" | "lifetime";

export interface Budget {
  amount: number;
  period: BudgetPeriod;
}

/** Raw counters. Everything else is derived from these. */
export interface MetricTotals {
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  conversions: number;
  revenue: number;
}

export interface DerivedMetrics extends MetricTotals {
  cpm: number;
  ctr: number;
  cpc: number;
  cpa: number;
  roas: number;
  frequency: number;
}

export interface DailyPoint extends MetricTotals {
  date: string;
}

export interface MetricDelta {
  value: number;
  /** Percentage change against the previous window. */
  changePct: number;
  direction: "up" | "down" | "flat";
}

export type CreativeFormat = "image" | "video" | "carousel";

export interface Creative {
  id: string;
  name: string;
  format: CreativeFormat;
  headline: string;
  body: string;
  callToAction: string;
  /** Accent used by the placeholder preview surface. */
  accent: "blue" | "violet" | "amber" | "emerald" | "rose";
}

export interface Ad {
  id: string;
  adSetId: string;
  campaignId: string;
  name: string;
  status: EntityStatus;
  creative: Creative;
  daily: DailyPoint[];
}

export interface Audience {
  name: string;
  sizeEstimate: number;
  locations: string[];
  ageRange: string;
  interests: string[];
}

export interface AdSet {
  id: string;
  campaignId: string;
  name: string;
  status: EntityStatus;
  budget: Budget;
  audience: Audience;
  placements: string[];
  optimizationGoal: string;
  bidStrategy: string;
  ads: Ad[];
}

export interface Campaign {
  id: string;
  accountId: string;
  name: string;
  status: EntityStatus;
  objective: CampaignObjective;
  budget: Budget;
  startDate: string;
  endDate: string | null;
  adSets: AdSet[];
}

export interface AdAccount {
  id: string;
  name: string;
  currency: string;
  timeZone: string;
  providerLabel: string;
  mode: "demo" | "live";
}

export interface Goal {
  id: string;
  objective: string;
  metricLabel: string;
  target: number;
  current: number;
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
}

export interface ChangeDiff {
  label: string;
  before: string;
  after: string;
}

export type RecommendationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "applied";

export interface Recommendation {
  id: string;
  title: string;
  rationale: string;
  level: HierarchyLevel;
  targetId: string;
  targetName: string;
  targetHref: string;
  status: RecommendationStatus;
  impact: "high" | "medium" | "low";
  requiresApproval: boolean;
  evidence: string[];
  expectedImpact: string;
  changes: ChangeDiff[];
  /** What would actually be applied if a human approves it. */
  operations: ChangeOperation[];
  toolName: string;
  createdAt: string;
}

export type ToolExecutionStatus = "success" | "error" | "awaiting_approval";

export interface ToolExecution {
  id: string;
  toolName: string;
  kind: "read" | "write";
  status: ToolExecutionStatus;
  actor: "agent" | "human";
  summary: string;
  startedAt: string;
  durationMs: number;
}

/** Row shape shared by every performance table, at any level. */
export interface PerformanceRow {
  id: string;
  name: string;
  href: string | null;
  status: EntityStatus;
  effectiveStatus: EntityStatus;
  subtitle: string;
  budgetLabel: string;
  budgetInherited: boolean;
  metrics: DerivedMetrics;
  trend: number[];
}

/** Concrete mutation applied to the account once a human approves it. */
export type ChangeOperation =
  | {
      type: "ad_set_budget";
      campaignId: string;
      adSetId: string;
      amount: number;
    }
  | {
      type: "entity_status";
      campaignId: string;
      adSetId: string | null;
      adId: string | null;
      status: EntityStatus;
    };

export type PendingChangeStatus = "pending" | "approved" | "rejected";

/**
 * A write the agent asked for but cannot perform on its own. It only touches
 * the account after a human approves it.
 */
export interface PendingChange {
  id: string;
  toolName: string;
  level: HierarchyLevel;
  targetId: string;
  targetName: string;
  targetHref: string;
  summary: string;
  reason: string;
  impact: "high" | "medium" | "low";
  changes: ChangeDiff[];
  operations: ChangeOperation[];
  requestedBy: "agent" | "human";
  requestedAt: string;
  status: PendingChangeStatus;
  decidedAt: string | null;
  /** Set when the request came from a recommendation rather than raw arguments. */
  sourceRecommendationId?: string;
}
