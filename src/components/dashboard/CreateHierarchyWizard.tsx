"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import {
  createAdAction,
  createAdSetAction,
  createCampaignAction,
} from "@/app/actions";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { initialToolFormState } from "@/lib/tool-form-state";
import type { HierarchyLevel } from "@/types/ads";
import { AdSetStepForm } from "./AdSetStepForm";
import { AdStepForm } from "./AdStepForm";
import { CampaignStepForm } from "./CampaignStepForm";
import { HierarchyPreview, type HierarchyStep } from "./HierarchyPreview";

const TRIGGER: Record<
  HierarchyLevel,
  { label: string; variant: "primary" | "outline" }
> = {
  campaign: { label: "Add campaign", variant: "primary" },
  ad_set: { label: "Add ad set", variant: "outline" },
  ad: { label: "Add ad", variant: "outline" },
};

const STEP_TITLE: Record<HierarchyLevel, string> = {
  campaign: "Create campaign",
  ad_set: "Create ad set",
  ad: "Create ad",
};

const STEP_DESCRIPTION: Record<HierarchyLevel, string> = {
  campaign:
    "The campaign that will own the ad set and ad created after it. Calls create_campaign, the same tool an agent would use.",
  ad_set:
    "Sits under the campaign above. Calls create_ad_set, the same tool an agent would use.",
  ad: "Sits under the ad set above and carries the creative. Calls create_ad, the same tool an agent would use.",
};

type WizardProps =
  | { startStep: "campaign" }
  | { startStep: "ad_set"; campaignId: string; campaignName: string }
  | {
      startStep: "ad";
      adSetId: string;
      adSetName: string;
      /** Shown in the preview for context; the ad step itself does not need it. */
      campaignName?: string;
    };

/**
 * Builds the Campaign -> Ad Set -> Ad chain as one guided flow instead of
 * three disconnected dialogs, with a live preview of the hierarchy being
 * built. Starting mid-hierarchy (from a campaign or ad set page) shows the
 * already-existing parent as already done in the preview, so the position
 * being built into is visible the whole time, not just the current form.
 */
export function CreateHierarchyWizard(props: WizardProps) {
  const [open, setOpen] = useState(false);
  const [instance, setInstance] = useState(0);
  const trigger = TRIGGER[props.startStep];

  return (
    <>
      <Button
        size="sm"
        variant={trigger.variant}
        onClick={() => {
          // A fresh key remounts WizardBody, which resets every step's
          // useActionState back to its initial value for this run.
          setInstance((count) => count + 1);
          setOpen(true);
        }}
      >
        <Plus />
        {trigger.label}
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Build the hierarchy"
        description="A campaign holds ad sets, and an ad set holds ads. This creates them in order."
        size="lg"
      >
        {open && <WizardBody key={instance} {...props} />}
      </Dialog>
    </>
  );
}

function WizardBody(props: WizardProps) {
  const router = useRouter();
  const [campaignState, campaignFormAction] = useActionState(
    createCampaignAction,
    initialToolFormState,
  );
  const [adSetState, adSetFormAction] = useActionState(
    createAdSetAction,
    initialToolFormState,
  );
  const [adState, adFormAction] = useActionState(
    createAdAction,
    initialToolFormState,
  );

  // Resolved per branch with if/else, not a ternary over the union, so
  // TypeScript can actually narrow which fields each startStep carries.
  let campaignId: string | undefined;
  let campaignName: string | null = null;
  let adSetId: string | undefined;
  let adSetName: string | null = null;

  if (props.startStep === "campaign") {
    campaignId = campaignState.created?.id;
    campaignName = campaignState.created?.name ?? null;
  } else if (props.startStep === "ad_set") {
    campaignId = props.campaignId;
    campaignName = props.campaignName;
  } else {
    campaignId = undefined;
    campaignName = props.campaignName ?? null;
  }

  if (props.startStep === "ad") {
    adSetId = props.adSetId;
    adSetName = props.adSetName;
  } else {
    adSetId = adSetState.created?.id;
    adSetName = adSetState.created?.name ?? null;
  }

  const phase: HierarchyLevel =
    props.startStep === "campaign" && !campaignId
      ? "campaign"
      : props.startStep !== "ad" && !adSetId
        ? "ad_set"
        : "ad";

  // The ad step is the end of the line. Once it succeeds there is nothing
  // left to do in this dialog, so the only remaining job is to take the
  // human to what was just created, the same as every other tool call does.
  useEffect(() => {
    if (adState.success && adState.href) router.push(adState.href);
  }, [adState, router]);

  const steps: HierarchyStep[] = [];
  if (props.startStep !== "ad" || campaignName) {
    steps.push({ level: "campaign", name: campaignName });
  }
  steps.push({ level: "ad_set", name: adSetName });
  steps.push({ level: "ad", name: adState.created?.name ?? null });

  return (
    <div className="space-y-4">
      <HierarchyPreview steps={steps} activeLevel={phase} />

      <div>
        <h3 className="text-sm font-semibold">{STEP_TITLE[phase]}</h3>
        <p className="text-muted-foreground mt-0.5 text-xs">
          {STEP_DESCRIPTION[phase]}
        </p>
      </div>

      {phase === "campaign" && (
        <CampaignStepForm state={campaignState} formAction={campaignFormAction} />
      )}
      {phase === "ad_set" && campaignId && (
        <AdSetStepForm
          campaignId={campaignId}
          state={adSetState}
          formAction={adSetFormAction}
        />
      )}
      {phase === "ad" && adSetId && (
        <AdStepForm adSetId={adSetId} state={adState} formAction={adFormAction} />
      )}
    </div>
  );
}
