"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Pause, Pencil, Play } from "lucide-react";
import { changeStatusAction, updateAdSetBudgetAction } from "@/app/actions";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { Input, Label } from "@/components/ui/Input";
import { formatCurrency } from "@/lib/format";
import { initialToolFormState } from "@/lib/tool-form-state";
import type { EntityStatus, HierarchyLevel, PendingChange } from "@/types/ads";
import { ToolFormError, SubmitButton } from "./ToolFormStatus";

interface Props {
  level: HierarchyLevel;
  id: string;
  status: EntityStatus;
  /** Set only at the ad set level, since no edit tool exists for the others. */
  adSetBudget?: number;
  /** Already-pending requests targeting this exact entity, so a click cannot
   * queue a duplicate approval request for the same change. */
  pendingStatusChange?: PendingChange;
  pendingBudgetChange?: PendingChange;
}

function StatusToggle({
  level,
  id,
  status,
  pendingChange,
}: {
  level: HierarchyLevel;
  id: string;
  status: EntityStatus;
  pendingChange?: PendingChange;
}) {
  const [state, formAction] = useActionState(
    changeStatusAction,
    initialToolFormState,
  );
  const nextStatus = status === "active" ? "paused" : "active";

  // Only an agent's request waits for a decision. A click here applies at
  // once, so success is reflected by the status pill re-rendering rather than
  // by sending the person to approve their own action.
  if (pendingChange) {
    return (
      <Link
        href="/review"
        className="text-primary inline-flex h-8 items-center gap-1 rounded-md border px-3 text-xs font-medium hover:underline"
        title={`The agent asked to ${pendingChange.summary.toLowerCase()}. Decide on it in the review queue.`}
      >
        Agent request pending
        <ArrowUpRight className="size-3" />
      </Link>
    );
  }

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="level" value={level} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={nextStatus} />
      <SubmitButton
        variant={nextStatus === "paused" ? "danger" : "positive"}
        size="sm"
      >
        {nextStatus === "paused" ? (
          <>
            <Pause /> Pause
          </>
        ) : (
          <>
            <Play /> Activate
          </>
        )}
      </SubmitButton>
      {state.error && (
        <span className="text-negative text-xs" role="alert">
          {state.error}
        </span>
      )}
    </form>
  );
}

function EditBudgetDialog({
  adSetId,
  currentAmount,
  pendingChange,
}: {
  adSetId: string;
  currentAmount: number;
  pendingChange?: PendingChange;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(
    updateAdSetBudgetAction,
    initialToolFormState,
  );

  if (pendingChange) {
    return (
      <Link
        href="/review"
        className="text-primary inline-flex h-8 items-center gap-1 rounded-md border px-3 text-xs font-medium hover:underline"
        title="The agent asked for a budget change on this ad set. Decide on it in the review queue."
      >
        Agent budget request pending
        <ArrowUpRight className="size-3" />
      </Link>
    );
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Pencil />
        Edit budget
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Change daily budget"
        description="Applies as soon as you save. You are the approver here, so this does not go to the review queue: only changes an agent asks for are held for a decision."
      >
        {state.success ? (
          <div className="space-y-4">
            <p className="text-sm">{state.summary}</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="adSetId" value={adSetId} />

            <div className="space-y-1.5">
              <Label htmlFor="dailyBudget">
                New daily budget ({formatCurrency(currentAmount)} now)
              </Label>
              <Input
                id="dailyBudget"
                name="dailyBudget"
                type="number"
                min={0}
                step={1}
                required
                defaultValue={currentAmount}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reason">Reason for the change log</Label>
              <Input
                id="reason"
                name="reason"
                required
                placeholder="CPA above account median for two weeks"
              />
            </div>

            <ToolFormError state={state} />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <SubmitButton>Save new budget</SubmitButton>
            </DialogFooter>
          </form>
        )}
      </Dialog>
    </>
  );
}

/** Action cluster for a level header: status toggle everywhere, budget edit
 * only where a tool actually backs it (ad sets). */
export function LevelHeaderActions({
  level,
  id,
  status,
  adSetBudget,
  pendingStatusChange,
  pendingBudgetChange,
}: Props) {
  return (
    <div className="flex items-center gap-2">
      <StatusToggle
        level={level}
        id={id}
        status={status}
        pendingChange={pendingStatusChange}
      />
      {level === "ad_set" && adSetBudget !== undefined && (
        <EditBudgetDialog
          adSetId={id}
          currentAmount={adSetBudget}
          pendingChange={pendingBudgetChange}
        />
      )}
    </div>
  );
}
