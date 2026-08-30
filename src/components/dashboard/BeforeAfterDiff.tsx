import { ArrowRight } from "lucide-react";
import type { ChangeDiff } from "@/types/ads";

export function BeforeAfterDiff({ changes }: { changes: ChangeDiff[] }) {
  return (
    <ul className="divide-y">
      {changes.map((change) => (
        <li
          key={change.label}
          className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 first:pt-0 last:pb-0"
        >
          <span className="text-muted-foreground min-w-0 flex-1 truncate text-xs">
            {change.label}
          </span>
          <span className="text-muted-foreground text-sm line-through tabular-nums">
            {change.before}
          </span>
          <ArrowRight className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
          <span className="text-positive text-sm font-semibold tabular-nums">
            {change.after}
          </span>
        </li>
      ))}
    </ul>
  );
}
