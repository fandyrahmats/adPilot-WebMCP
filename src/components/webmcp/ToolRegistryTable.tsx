import { Lock, ShieldCheck, Terminal } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableWrap,
} from "@/components/ui/Table";
import { TOOL_CONTRACTS } from "@/lib/webmcp/contracts";

function parameterSummary(
  schema: (typeof TOOL_CONTRACTS)[number]["inputSchema"],
): string {
  const entries = Object.entries(schema.properties);
  if (entries.length === 0) return "no arguments";
  const required = new Set(schema.required ?? []);
  return entries
    .map(([key, property]) =>
      required.has(key) ? `${key}: ${property.type}` : `${key}?: ${property.type}`,
    )
    .join(", ");
}

export function ToolRegistryTable() {
  return (
    <TableWrap>
      <Table className="min-w-3xl">
        <TableHead>
          <TableRow className="hover:bg-transparent">
            <TableHeaderCell>Tool</TableHeaderCell>
            <TableHeaderCell>Kind</TableHeaderCell>
            <TableHeaderCell>Arguments</TableHeaderCell>
            <TableHeaderCell>What it does</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {TOOL_CONTRACTS.map((contract) => (
            <TableRow key={contract.name}>
              <TableCell className="align-top">
                <code className="font-mono text-xs font-semibold">
                  {contract.name}
                </code>
              </TableCell>
              <TableCell className="align-top">
                {contract.kind === "read" ? (
                  <Badge tone="neutral">
                    <Terminal />
                    read
                  </Badge>
                ) : contract.requiresApproval ? (
                  <Badge tone="warning">
                    <Lock />
                    write, gated
                  </Badge>
                ) : (
                  <Badge tone="accent">
                    <ShieldCheck />
                    write
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground max-w-64 align-top text-xs">
                <code className="font-mono text-[11px]">
                  {parameterSummary(contract.inputSchema)}
                </code>
              </TableCell>
              <TableCell className="text-muted-foreground max-w-lg align-top text-xs leading-relaxed">
                {contract.description}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableWrap>
  );
}
