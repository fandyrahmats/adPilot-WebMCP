import { Pause, Pencil, Wallet } from "lucide-react";
import { Breadcrumbs, type Crumb } from "@/components/layout/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import type { EntityStatus } from "@/types/ads";
import { StatusPill } from "./StatusPill";

export interface LevelFact {
  label: string;
  value: string;
}

interface Props {
  crumbs: Crumb[];
  eyebrow: string;
  name: string;
  status: EntityStatus;
  effectiveStatus?: EntityStatus;
  budgetLabel: string;
  budgetInherited?: boolean;
  facts: LevelFact[];
}

/** Shared header contract used by every level of the hierarchy. */
export function LevelHeader({
  crumbs,
  eyebrow,
  name,
  status,
  effectiveStatus,
  budgetLabel,
  budgetInherited = false,
  facts,
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

        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Pause />
            Pause
          </Button>
          <Button variant="outline" size="sm">
            <Pencil />
            Edit
          </Button>
        </div>
      </div>

      <dl className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
        {facts.map((fact) => (
          <div key={fact.label} className="min-w-0">
            <dt className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
              {fact.label}
            </dt>
            <dd className="mt-0.5 truncate text-sm">{fact.value}</dd>
          </div>
        ))}
      </dl>
    </header>
  );
}
