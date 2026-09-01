"use server";

import { revalidatePath } from "next/cache";
import { approveChange, ChangeError, rejectChange } from "@/lib/server/changes";
import { recordExecution } from "@/lib/server/store";
import { type CreatedEntity, type ToolFormState } from "@/lib/tool-form-state";
import { runTool } from "@/lib/webmcp/handlers";
import type { PendingChange } from "@/types/ads";

function logHumanDecision(
  toolName: string,
  status: "success" | "error",
  summary: string,
): void {
  recordExecution({
    id: `exec_${Date.now().toString(36)}`,
    toolName,
    kind: "write",
    status,
    actor: "human",
    summary,
    startedAt: new Date().toISOString(),
    durationMs: 1,
  });
}

function refreshWorkspace(): void {
  revalidatePath("/", "layout");
}

/**
 * Approval is deliberately not exposed as a tool. Only this server action,
 * reached by a person clicking in the review queue, can apply a held change.
 */
export async function approvePendingChangeAction(
  formData: FormData,
): Promise<void> {
  const changeId = String(formData.get("changeId") ?? "");
  try {
    const change: PendingChange = await approveChange(changeId);
    logHumanDecision(
      "approve_pending_change",
      "success",
      `Approved and applied: ${change.summary}`,
    );
  } catch (error) {
    logHumanDecision(
      "approve_pending_change",
      "error",
      error instanceof ChangeError
        ? error.message
        : `Could not approve ${changeId}`,
    );
  }
  refreshWorkspace();
}

export async function rejectPendingChangeAction(
  formData: FormData,
): Promise<void> {
  const changeId = String(formData.get("changeId") ?? "");
  try {
    const change = rejectChange(changeId);
    logHumanDecision(
      "reject_pending_change",
      "success",
      `Rejected: ${change.summary}`,
    );
  } catch (error) {
    logHumanDecision(
      "reject_pending_change",
      "error",
      error instanceof ChangeError ? error.message : `Could not reject ${changeId}`,
    );
  }
  refreshWorkspace();
}

/**
 * Applies a recommendation through the same handler an agent would call. The
 * person clicking here is the one who would otherwise approve it, so it takes
 * effect at once rather than joining the review queue. An agent calling
 * apply_recommendation is held instead.
 */
export async function applyRecommendationAction(
  formData: FormData,
): Promise<void> {
  const recommendationId = String(formData.get("recommendationId") ?? "");
  await runTool("apply_recommendation", { recommendationId }, "human");
  refreshWorkspace();
}

/** Pulls {id, name} off whichever entity key a create tool's data carries. */
function extractCreated(
  data: unknown,
  entityKey: "campaign" | "adSet" | "ad",
): CreatedEntity | undefined {
  if (!data || typeof data !== "object" || !(entityKey in data)) return undefined;
  const entity = (data as Record<string, unknown>)[entityKey];
  if (!entity || typeof entity !== "object") return undefined;
  const { id, name } = entity as Record<string, unknown>;
  if (typeof id !== "string" || typeof name !== "string") return undefined;
  return { id, name };
}

/**
 * Every dashboard form below is a thin wrapper over runTool: the same
 * contract, validation, and handler an agent would go through. Nothing here
 * talks to the provider or the approval queue directly, so the UI path and
 * the agent path can never drift apart.
 */
async function runHumanTool(
  toolName: string,
  fields: Record<string, FormDataEntryValue | null>,
  entityKey?: "campaign" | "adSet" | "ad",
): Promise<ToolFormState> {
  const result = await runTool(toolName, fields, "human");
  if (!result.body.ok) {
    return { error: result.body.error ?? result.body.summary, success: false };
  }
  refreshWorkspace();
  return {
    error: null,
    success: true,
    summary: result.body.summary,
    href: result.body.uiHref,
    created: entityKey ? extractCreated(result.body.data, entityKey) : undefined,
  };
}

/**
 * Creates apply immediately and always start paused, so this needs no
 * approval step: create_campaign is not a gated tool.
 */
export async function createCampaignAction(
  _prevState: ToolFormState,
  formData: FormData,
): Promise<ToolFormState> {
  return runHumanTool(
    "create_campaign",
    {
      name: formData.get("name"),
      objective: formData.get("objective"),
      budgetAmount: formData.get("budgetAmount"),
      budgetPeriod: formData.get("budgetPeriod"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
    },
    "campaign",
  );
}

export async function createAdSetAction(
  _prevState: ToolFormState,
  formData: FormData,
): Promise<ToolFormState> {
  return runHumanTool(
    "create_ad_set",
    {
      campaignId: formData.get("campaignId"),
      name: formData.get("name"),
      dailyBudget: formData.get("dailyBudget"),
      audienceName: formData.get("audienceName"),
      ageRange: formData.get("ageRange"),
      gender: formData.get("gender"),
      locations: formData.get("locations"),
      optimizationGoal: formData.get("optimizationGoal"),
    },
    "adSet",
  );
}

export async function createAdAction(
  _prevState: ToolFormState,
  formData: FormData,
): Promise<ToolFormState> {
  return runHumanTool(
    "create_ad",
    {
      adSetId: formData.get("adSetId"),
      name: formData.get("name"),
      format: formData.get("format"),
      headline: formData.get("headline"),
      body: formData.get("body"),
      description: formData.get("description"),
      callToAction: formData.get("callToAction"),
      destinationUrl: formData.get("destinationUrl"),
    },
    "ad",
  );
}

/**
 * Pausing or activating is a high impact write, but a person using the
 * dashboard is already the approver, so it applies immediately and is logged
 * as decided. The same tool called by an agent is held in /review instead.
 */
export async function changeStatusAction(
  _prevState: ToolFormState,
  formData: FormData,
): Promise<ToolFormState> {
  return runHumanTool("update_entity_status", {
    level: formData.get("level"),
    id: formData.get("id"),
    status: formData.get("status"),
    reason: formData.get("reason"),
  });
}

/** Ad set budget edits run through the same gated tool, and likewise apply at
 * once when the person in the dashboard asks for them. */
export async function updateAdSetBudgetAction(
  _prevState: ToolFormState,
  formData: FormData,
): Promise<ToolFormState> {
  return runHumanTool("update_ad_set_budget", {
    adSetId: formData.get("adSetId"),
    dailyBudget: formData.get("dailyBudget"),
    reason: formData.get("reason"),
  });
}
