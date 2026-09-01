import { Check, Circle, Megaphone, Layers, Rows3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HierarchyLevel } from "@/types/ads";

export interface HierarchyStep {
  level: HierarchyLevel;
  /** Name once created, or a placeholder before this step is reached. */
  name: string | null;
}

const LEVEL_ICON: Record<HierarchyLevel, typeof Megaphone> = {
  campaign: Megaphone,
  ad_set: Layers,
  ad: Rows3,
};

const LEVEL_LABEL: Record<HierarchyLevel, string> = {
  campaign: "Campaign",
  ad_set: "Ad set",
  ad: "Ad",
};

const INDENT_PX = 20;

/**
 * Shows the Campaign -> Ad Set -> Ad chain being built, so the hierarchy is
 * visible while it is being created, not only after the fact on the
 * campaigns table. Steps already created show their real name and a check;
 * the step in progress is highlighted; steps not reached yet are dimmed.
 */
export function HierarchyPreview({
  steps,
  activeLevel,
}: {
  steps: HierarchyStep[];
  activeLevel: HierarchyLevel;
}) {
  return (
    <ol className="bg-muted/40 space-y-1.5 rounded-md border p-3">
      {steps.map((step, index) => {
        const Icon = LEVEL_ICON[step.level];
        const isDone = step.name !== null;
        const isActive = step.level === activeLevel;

        return (
          <li
            key={step.level}
            className="flex items-center gap-2"
            style={{ paddingLeft: index * INDENT_PX }}
          >
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full",
                isDone
                  ? "bg-positive text-white"
                  : isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {isDone ? (
                <Check className="size-3" />
              ) : (
                <Circle className="size-2.5" fill="currentColor" />
              )}
            </span>
            <Icon
              className={cn(
                "size-3.5 shrink-0",
                isActive || isDone ? "text-foreground" : "text-muted-foreground",
              )}
            />
            <span
              className={cn(
                "truncate text-xs",
                isActive && "font-semibold",
                !isActive && !isDone && "text-muted-foreground",
              )}
            >
              {step.name ?? (
                <>
                  {LEVEL_LABEL[step.level]}
                  {isActive && " (this step)"}
                </>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
