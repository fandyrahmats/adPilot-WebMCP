import Link from "next/link";
import { Bot, Check, Clock, Terminal, User, X } from "lucide-react";
import {
  approvePendingChangeAction,
  rejectPendingChangeAction,
} from "@/app/actions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { formatDateTime } from "@/lib/format";
import type { PendingChange } from "@/types/ads";
import { BeforeAfterDiff } from "./BeforeAfterDiff";

const statusTone = {
  pending: "warning",
  approved: "positive",
  rejected: "neutral",
} as const;

const impactTone = {
  high: "negative",
  medium: "warning",
  low: "neutral",
} as const;

export function PendingChangeCard({ change }: { change: PendingChange }) {
  const RequesterIcon = change.requestedBy === "agent" ? Bot : User;
  const isPending = change.status === "pending";

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={statusTone[change.status]}>
            {isPending ? <Clock /> : change.status === "approved" ? <Check /> : <X />}
            {isPending ? "Awaiting approval" : change.status}
          </Badge>
          <Badge tone={impactTone[change.impact]}>{change.impact} impact</Badge>
          <Badge tone="neutral" className="font-mono text-[11px]">
            <Terminal />
            {change.toolName}
          </Badge>
          <Badge tone="outline">
            <RequesterIcon />
            {change.requestedBy}
          </Badge>
        </div>
        <CardTitle className="mt-1 text-sm leading-snug">
          {change.summary}
        </CardTitle>
        <p className="text-muted-foreground text-xs">
          Requested {formatDateTime(change.requestedAt)} on{" "}
          <Link href={change.targetHref} className="text-primary hover:underline">
            {change.targetName}
          </Link>
          {change.id ? ` · ${change.id}` : null}
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        <div>
          <h4 className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
            Reason given
          </h4>
          <p className="mt-1 text-xs leading-relaxed">{change.reason}</p>
        </div>
        <div>
          <h4 className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
            {isPending ? "Would change" : "Changed"}
          </h4>
          <div className="mt-1.5">
            <BeforeAfterDiff changes={change.changes} />
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex-wrap justify-between gap-2">
        {isPending ? (
          <>
            <span className="text-muted-foreground text-[11px]">
              The account is unchanged while this waits.
            </span>
            <span className="flex gap-2">
              <form action={rejectPendingChangeAction}>
                <input type="hidden" name="changeId" value={change.id} />
                <Button type="submit" variant="danger" size="sm">
                  <X />
                  Reject
                </Button>
              </form>
              <form action={approvePendingChangeAction}>
                <input type="hidden" name="changeId" value={change.id} />
                <Button type="submit" variant="positive" size="sm">
                  <Check />
                  Approve and apply
                </Button>
              </form>
            </span>
          </>
        ) : (
          <span className="text-muted-foreground text-[11px]">
            {change.status === "approved"
              ? `Applied to the account ${change.decidedAt ? formatDateTime(change.decidedAt) : ""}.`
              : "Rejected. The account was not modified."}
          </span>
        )}
      </CardFooter>
    </Card>
  );
}
