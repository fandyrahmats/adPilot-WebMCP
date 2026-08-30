import { getAdsProvider, ProviderError } from "@/lib/providers";
import { getStore, nextId } from "./store";
import type {
  ChangeDiff,
  ChangeOperation,
  HierarchyLevel,
  PendingChange,
} from "@/types/ads";

export class ChangeError extends Error {}

export interface ChangeRequest {
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
  sourceRecommendationId?: string;
}

/** Records a high impact write and leaves the account untouched. */
export function requestChange(request: ChangeRequest): PendingChange {
  const change: PendingChange = {
    id: nextId("chg"),
    ...request,
    requestedAt: new Date().toISOString(),
    status: "pending",
    decidedAt: null,
  };
  getStore().pendingChanges = [change, ...getStore().pendingChanges];
  return change;
}

async function applyOperation(operation: ChangeOperation): Promise<void> {
  const provider = getAdsProvider();

  if (operation.type === "ad_set_budget") {
    await provider.setAdSetBudget(operation.adSetId, operation.amount);
    return;
  }

  if (operation.adId) {
    await provider.setStatus({
      level: "ad",
      id: operation.adId,
      status: operation.status,
    });
    return;
  }

  if (operation.adSetId) {
    await provider.setStatus({
      level: "ad_set",
      id: operation.adSetId,
      status: operation.status,
    });
    return;
  }

  await provider.setStatus({
    level: "campaign",
    id: operation.campaignId,
    status: operation.status,
  });
}

/**
 * The only path that mutates spend or delivery. Reached from a human approval,
 * never from a tool handler.
 */
export async function approveChange(changeId: string): Promise<PendingChange> {
  const change = getStore().pendingChanges.find((entry) => entry.id === changeId);
  if (!change) throw new ChangeError(`Change ${changeId} not found`);
  if (change.status !== "pending") {
    throw new ChangeError(`Change ${changeId} was already ${change.status}`);
  }

  try {
    for (const operation of change.operations) {
      await applyOperation(operation);
    }
  } catch (error) {
    // The change stays pending so a failed apply is never shown as done.
    throw new ChangeError(
      error instanceof ProviderError
        ? `Provider rejected the change: ${error.message}`
        : `Could not apply change ${changeId}`,
    );
  }

  change.status = "approved";
  change.decidedAt = new Date().toISOString();
  return change;
}

export function rejectChange(changeId: string): PendingChange {
  const change = getStore().pendingChanges.find((entry) => entry.id === changeId);
  if (!change) throw new ChangeError(`Change ${changeId} not found`);
  if (change.status !== "pending") {
    throw new ChangeError(`Change ${changeId} was already ${change.status}`);
  }

  change.status = "rejected";
  change.decidedAt = new Date().toISOString();
  return change;
}
