import { Bot, CircleCheck, CircleX, Clock, User } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime, formatDuration, formatRelativeTime } from "@/lib/format";
import type { ToolExecution, ToolExecutionStatus } from "@/types/ads";
import { EmptyState } from "./EmptyState";

const statusConfig: Record<
  ToolExecutionStatus,
  { label: string; tone: "positive" | "negative" | "warning"; icon: typeof Clock }
> = {
  success: { label: "Success", tone: "positive", icon: CircleCheck },
  error: { label: "Failed", tone: "negative", icon: CircleX },
  awaiting_approval: {
    label: "Awaiting approval",
    tone: "warning",
    icon: Clock,
  },
};

interface Props {
  executions: ToolExecution[];
  referenceTimestamp: string;
  limit?: number;
}

export function ActivityList({ executions, referenceTimestamp, limit }: Props) {
  const shown = limit ? executions.slice(0, limit) : executions;

  if (shown.length === 0) {
    return (
      <EmptyState
        title="No tool executions yet"
        description="Connect an agent and ask it to read this account. Every call it makes shows up here with its result."
      />
    );
  }

  return (
    <ol className="divide-y">
      {shown.map((execution) => {
        const status = statusConfig[execution.status];
        const ActorIcon = execution.actor === "agent" ? Bot : User;
        return (
          <li key={execution.id} className="flex gap-3 px-5 py-3.5">
            <span className="bg-muted text-muted-foreground mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full">
              <ActorIcon className="size-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <code className="text-foreground font-mono text-xs font-semibold">
                  {execution.toolName}
                </code>
                <Badge tone={status.tone}>
                  <status.icon />
                  {status.label}
                </Badge>
                <Badge tone="outline">
                  {execution.kind === "write" ? "write" : "read"}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                {execution.summary}
              </p>
            </div>
            <div className="text-muted-foreground shrink-0 text-right text-[11px] tabular-nums">
              <time dateTime={execution.startedAt} title={formatDateTime(execution.startedAt)}>
                {formatRelativeTime(execution.startedAt, referenceTimestamp)}
              </time>
              <p>{formatDuration(execution.durationMs)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
