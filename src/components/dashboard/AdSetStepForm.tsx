"use client";

import { DialogFooter } from "@/components/ui/Dialog";
import { Input, Label, Select } from "@/components/ui/Input";
import type { ToolFormState } from "@/lib/tool-form-state";
import { SubmitButton, ToolFormError } from "./ToolFormStatus";

interface Props {
  campaignId: string;
  state: ToolFormState;
  formAction: (formData: FormData) => void;
}

/** Second step: the ad set that will sit under the campaign from step one. */
export function AdSetStepForm({ campaignId, state, formAction }: Props) {
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="campaignId" value={campaignId} />

      <div className="space-y-1.5">
        <Label htmlFor="adset-name">Ad set name</Label>
        <Input
          id="adset-name"
          name="name"
          required
          placeholder="Lookalike - Past Buyers 3%"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="dailyBudget">Daily budget (IDR)</Label>
          <Input
            id="dailyBudget"
            name="dailyBudget"
            type="number"
            min={1}
            step={1}
            required
            placeholder="120000"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="optimizationGoal">Optimizing for</Label>
          <Select id="optimizationGoal" name="optimizationGoal" defaultValue="Purchases">
            <option value="Purchases">Purchases</option>
            <option value="Leads">Leads</option>
            <option value="Link clicks">Link clicks</option>
            <option value="Reach">Reach</option>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="audienceName">Audience name</Label>
        <Input
          id="audienceName"
          name="audienceName"
          required
          placeholder="University Students 18-24"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="ageRange">Age range</Label>
          <Input id="ageRange" name="ageRange" placeholder="18-24" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="gender">Gender</Label>
          <Select id="gender" name="gender" defaultValue="all">
            <option value="all">All</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="locations">Locations</Label>
          <Input id="locations" name="locations" placeholder="Indonesia" />
        </div>
      </div>

      <ToolFormError state={state} />

      <DialogFooter>
        <SubmitButton>Next: create ad</SubmitButton>
      </DialogFooter>
    </form>
  );
}
