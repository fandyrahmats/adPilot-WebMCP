"use server";

import { revalidatePath } from "next/cache";
import { approveChange, ChangeError, rejectChange } from "@/lib/server/changes";
import { recordExecution } from "@/lib/server/store";
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
 * Lets the human raise a recommendation into the review queue through the same
 * handler an agent would call, so both paths produce identical state.
 */
export async function queueRecommendationAction(
  formData: FormData,
): Promise<void> {
  const recommendationId = String(formData.get("recommendationId") ?? "");
  await runTool("apply_recommendation", { recommendationId });
  refreshWorkspace();
}
