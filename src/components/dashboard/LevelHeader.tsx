import type { ReactNode } from "react";
import { Wallet } from "lucide-react";
import { Breadcrumbs, type Crumb } from "@/components/layout/Breadcrumbs";
import type { EntityStatus } from "@/types/ads";
import { StatusPill } from "./StatusPill";

interface Props {
  crumbs: Crumb[];
  eyebrow: string;
  name: string;
  status: EntityStatus;
  effectiveStatus?: EntityStatus;
  budgetLabel: string;
  budgetInherited?: boolean;
  /** Level-specific controls (status toggle, budget edit). Omit for levels
   * with nothing actionable, such as the ad-set-only budget edit. */
  actions?: ReactNode;
}

/**
 * Shared header contract used by every level of the hierarchy: breadcrumb,
 * name, status, budget, and the level's actions. Setup details live in
 * DetailPanel sections below the header instead of a flat fact grid here,
 * so the page reads the way a real ads platform groups campaign, budget,
 * audience, and creative fields into their own labeled panels.
 */
export function LevelHeader({
  crumbs,
  eyebrow,
  name,
  status,
  effectiveStatus,
  budgetLabel,
  budgetInherited = false,
  actions,
}: Props) {
  return (
    <header className="mb-6">
      <Breadcrumbs items={crumbs} />

      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {eyebrow}
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight md:text-2xl">
            {name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
            <StatusPill status={status} effectiveStatus={effectiveStatus} />
            <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs tabular-nums">
              <Wallet className="size-3.5" />
              {budgetLabel}
              {budgetInherited && (
                <span className="text-muted-foreground">(inherited)</span>
              )}
            </span>
          </div>
        </div>

        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
    </header>
  );
}
