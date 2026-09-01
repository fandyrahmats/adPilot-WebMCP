"use client";

import { DialogFooter } from "@/components/ui/Dialog";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import type { ToolFormState } from "@/lib/tool-form-state";
import { SubmitButton, ToolFormError } from "./ToolFormStatus";

interface Props {
  adSetId: string;
  state: ToolFormState;
  formAction: (formData: FormData) => void;
}

/** Last step: the ad and its creative, sitting under the ad set from step two. */
export function AdStepForm({ adSetId, state, formAction }: Props) {
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="adSetId" value={adSetId} />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="ad-name">Ad name</Label>
          <Input
            id="ad-name"
            name="name"
            required
            placeholder="Offer - Early bird bundle"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="format">Format</Label>
          <Select id="format" name="format" required defaultValue="image">
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="carousel">Carousel</option>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="headline">Headline</Label>
        <Input
          id="headline"
          name="headline"
          required
          placeholder="Enroll before September 15"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="body">Primary text</Label>
        <Textarea
          id="body"
          name="body"
          required
          rows={3}
          placeholder="Reserve your seat in the evening cohort."
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          name="description"
          placeholder="Limited seats, September intake"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="callToAction">Call to action</Label>
          <Input id="callToAction" name="callToAction" placeholder="Enroll now" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="destinationUrl">Destination URL</Label>
          <Input
            id="destinationUrl"
            name="destinationUrl"
            type="url"
            placeholder="https://example.com/enroll"
          />
        </div>
      </div>

      <ToolFormError state={state} />

      <DialogFooter>
        <SubmitButton>Create ad</SubmitButton>
      </DialogFooter>
    </form>
  );
}
