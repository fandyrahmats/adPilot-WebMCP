import { CircleDot, CirclePause, FileEdit, Flag } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import type { EntityStatus } from "@/types/ads";

const config: Record<
  EntityStatus,
  { label: string; tone: BadgeTone; icon: typeof CircleDot }
> = {
  active: { label: "Active", tone: "positive", icon: CircleDot },
  paused: { label: "Paused", tone: "neutral", icon: CirclePause },
  draft: { label: "Draft", tone: "outline", icon: FileEdit },
  completed: { label: "Completed", tone: "accent", icon: Flag },
};

interface Props {
  status: EntityStatus;
  /** Pass when a parent can override the entity's own status. */
  effectiveStatus?: EntityStatus;
}

export function StatusPill({ status, effectiveStatus }: Props) {
  const inherited = Boolean(effectiveStatus && effectiveStatus !== status);
  const shown = config[effectiveStatus ?? status];

  return (
    <span className="inline-flex items-center gap-1.5">
      <Badge tone={shown.tone}>
        <shown.icon />
        {shown.label}
      </Badge>
      {inherited && (
        <span className="text-muted-foreground text-[11px]">
          set by parent
        </span>
      )}
    </span>
  );
}
