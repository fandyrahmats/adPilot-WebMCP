import { Bot, Terminal } from "lucide-react";
import { ActivityList } from "@/components/dashboard/ActivityList";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { ToolRegistryTable } from "@/components/webmcp/ToolRegistryTable";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { getToolExecutions, REPORTING_REFERENCE } from "@/lib/ads-service";
import { TOOL_CONTRACTS } from "@/lib/webmcp/contracts";

export const dynamic = "force-dynamic";

export default function ActivityPage() {
  const executions = getToolExecutions();
  const writes = executions.filter((entry) => entry.kind === "write");
  const awaiting = executions.filter(
    (entry) => entry.status === "awaiting_approval",
  );
  const gatedTools = TOOL_CONTRACTS.filter((tool) => tool.requiresApproval);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
          Agent Activity
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Every tool call made against this account, what it did, and how long it
          took.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="p-5">
          <p className="text-muted-foreground text-xs font-medium">Tools exposed</p>
          <p className="mt-1.5 text-2xl font-semibold tabular-nums">
            {TOOL_CONTRACTS.length}
          </p>
          <p className="text-muted-foreground mt-1 text-[11px]">
            {gatedTools.length} of them need approval
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-muted-foreground text-xs font-medium">Tool calls</p>
          <p className="mt-1.5 text-2xl font-semibold tabular-nums">
            {executions.length}
          </p>
          <p className="text-muted-foreground mt-1 text-[11px]">
            Reads and writes combined
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-muted-foreground text-xs font-medium">
            Write operations
          </p>
          <p className="mt-1.5 text-2xl font-semibold tabular-nums">
            {writes.length}
          </p>
          <p className="text-muted-foreground mt-1 text-[11px]">
            Changed structure, budget, or delivery
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-muted-foreground text-xs font-medium">
            Held for approval
          </p>
          <p className="mt-1.5 text-2xl font-semibold tabular-nums">
            {awaiting.length}
          </p>
          <p className="text-muted-foreground mt-1 text-[11px]">
            Blocked until a human decided
          </p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle>Execution log</CardTitle>
            <p className="text-muted-foreground text-xs">
              Newest first. Failures and blocked writes are shown as they
              happened.
            </p>
          </div>
          <span className="flex items-center gap-2">
            <Badge tone="outline">
              <Terminal />
              tool name
            </Badge>
            <Badge tone="outline">
              <Bot />
              actor
            </Badge>
          </span>
        </CardHeader>
        <ActivityList
          executions={executions}
          referenceTimestamp={REPORTING_REFERENCE.timestamp}
        />
      </Card>

      <section>
        <SectionHeader
          title="WebMCP tool registry"
          description="The contract this page registers with the browser's model context. Agents see these names, schemas, and descriptions."
        />
        <Card className="overflow-hidden">
          <ToolRegistryTable />
        </Card>
      </section>
    </div>
  );
}
