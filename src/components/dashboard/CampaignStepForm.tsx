"use client";

import { DialogFooter } from "@/components/ui/Dialog";
import { Input, Label, Select } from "@/components/ui/Input";
import type { ToolFormState } from "@/lib/tool-form-state";
import { SubmitButton, ToolFormError } from "./ToolFormStatus";

const TODAY = "2026-08-30";

interface Props {
  state: ToolFormState;
  formAction: (formData: FormData) => void;
}

/** First step of the hierarchy wizard: the campaign that will own everything
 * created after it. */
export function CampaignStepForm({ state, formAction }: Props) {
  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Campaign name</Label>
        <Input id="name" name="name" required placeholder="Evening Cohort" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="objective">Objective</Label>
          <Select id="objective" name="objective" required defaultValue="conversions">
            <option value="conversions">Conversions</option>
            <option value="traffic">Traffic</option>
            <option value="awareness">Awareness</option>
            <option value="leads">Leads</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="budgetPeriod">Budget period</Label>
          <Select id="budgetPeriod" name="budgetPeriod" required defaultValue="lifetime">
            <option value="lifetime">Lifetime</option>
            <option value="daily">Daily</option>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="budgetAmount">Budget (IDR)</Label>
        <Input
          id="budgetAmount"
          name="budgetAmount"
          type="number"
          min={1}
          step={1}
          required
          placeholder="8000000"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="startDate">Start date</Label>
          <Input id="startDate" name="startDate" type="date" defaultValue={TODAY} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endDate">End date (optional)</Label>
          <Input id="endDate" name="endDate" type="date" />
        </div>
      </div>

      <ToolFormError state={state} />

      <DialogFooter>
        <SubmitButton>Next: create ad set</SubmitButton>
      </DialogFooter>
    </form>
  );
}
