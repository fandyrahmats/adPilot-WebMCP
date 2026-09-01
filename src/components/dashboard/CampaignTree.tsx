"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  Layers,
  Megaphone,
  MoreHorizontal,
  Rows3,
} from "lucide-react";
import { Sparkline } from "@/components/charts/Sparkline";
import { Button } from "@/components/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableWrap,
} from "@/components/ui/Table";
import { formatMetric, type MetricFormat } from "@/lib/format";
import { sortableValue } from "@/lib/metrics";
import { cn } from "@/lib/utils";
import type { DerivedMetrics, HierarchyLevel, TreeRow } from "@/types/ads";
import { EmptyState } from "./EmptyState";
import { StatusPill } from "./StatusPill";

type MetricColumnKey = keyof Pick<
  DerivedMetrics,
  "spend" | "impressions" | "cpm" | "clicks" | "ctr" | "conversions" | "cpa" | "roas"
>;

interface MetricColumn {
  key: MetricColumnKey;
  label: string;
  format: MetricFormat;
}

/** Same metric set at every depth, so the tree reads the same whether a row
 * is a campaign, an ad set, or an ad. */
const COLUMNS: MetricColumn[] = [
  { key: "spend", label: "Spend", format: "currencyCompact" },
  { key: "impressions", label: "Impressions", format: "compact" },
  { key: "cpm", label: "CPM", format: "currencyCompact" },
  { key: "clicks", label: "Clicks", format: "compact" },
  { key: "ctr", label: "CTR", format: "percent" },
  { key: "conversions", label: "Conv.", format: "number" },
  { key: "cpa", label: "CPA", format: "currencyCompact" },
  { key: "roas", label: "ROAS", format: "roas" },
];

const LEVEL_ICON: Record<HierarchyLevel, typeof Megaphone> = {
  campaign: Megaphone,
  ad_set: Layers,
  ad: Rows3,
};

const INDENT_PX = 22;

interface Props {
  rows: TreeRow[];
  nameHeader: string;
  emptyTitle: string;
  emptyDescription: string;
  /** Row ids expanded on first render. Every level is open by default so the
   * hierarchy is visible immediately, the way it needs to be to prove the
   * campaign -> ad set -> ad structure at a glance. */
  defaultExpandedIds?: string[];
}

function collectIds(rows: TreeRow[]): string[] {
  return rows.flatMap((row) => [row.id, ...collectIds(row.children ?? [])]);
}

function sortTree(rows: TreeRow[], key: MetricColumnKey | "name", ascending: boolean): TreeRow[] {
  const sorted = [...rows].sort((a, b) => {
    if (key === "name") return a.name.localeCompare(b.name);
    return sortableValue(a.metrics[key]) - sortableValue(b.metrics[key]);
  });
  const ordered = ascending ? sorted : sorted.reverse();
  return ordered.map((row) =>
    row.children ? { ...row, children: sortTree(row.children, key, ascending) } : row,
  );
}

interface FlatRow {
  row: TreeRow;
  depth: number;
  hasChildren: boolean;
}

function flatten(rows: TreeRow[], depth: number, expanded: Set<string>): FlatRow[] {
  return rows.flatMap((row) => {
    const hasChildren = Boolean(row.children && row.children.length > 0);
    const self: FlatRow = { row, depth, hasChildren };
    if (hasChildren && expanded.has(row.id)) {
      return [self, ...flatten(row.children!, depth + 1, expanded)];
    }
    return [self];
  });
}

/**
 * Renders the full Campaign -> Ad Set -> Ad hierarchy as one expandable tree,
 * matching how a professional ads platform shows structure: every level
 * visible in place, indented under its parent, instead of split across
 * separate pages.
 */
export function CampaignTree({
  rows,
  nameHeader,
  emptyTitle,
  emptyDescription,
  defaultExpandedIds,
}: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(defaultExpandedIds ?? collectIds(rows)),
  );
  const [sortKey, setSortKey] = useState<MetricColumnKey | "name">("spend");
  const [ascending, setAscending] = useState(false);

  const sortedTree = useMemo(
    () => sortTree(rows, sortKey, ascending),
    [rows, sortKey, ascending],
  );
  const flat = useMemo(() => flatten(sortedTree, 0, expanded), [sortedTree, expanded]);

  const toggleSort = (key: MetricColumnKey | "name") => {
    if (key === sortKey) {
      setAscending((previous) => !previous);
      return;
    }
    setSortKey(key);
    setAscending(key === "name");
  };

  const toggleExpanded = (id: string) => {
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <TableWrap>
      <Table>
        <TableHead>
          <TableRow className="hover:bg-transparent">
            <TableHeaderCell>
              <button
                type="button"
                onClick={() => toggleSort("name")}
                className="hover:text-foreground inline-flex items-center gap-1 rounded"
              >
                {nameHeader}
              </button>
            </TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Budget</TableHeaderCell>
            <TableHeaderCell>Trend</TableHeaderCell>
            {COLUMNS.map((column) => (
              <TableHeaderCell key={column.key} numeric>
                <button
                  type="button"
                  onClick={() => toggleSort(column.key)}
                  className="hover:text-foreground inline-flex items-center gap-1 rounded"
                  aria-label={`Sort by ${column.label}`}
                >
                  {column.label}
                </button>
              </TableHeaderCell>
            ))}
            <TableHeaderCell>
              <span className="sr-only">Row actions</span>
            </TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {flat.map(({ row, depth, hasChildren }) => {
            const Icon = LEVEL_ICON[row.level];
            const isExpanded = expanded.has(row.id);
            return (
              <TableRow key={row.id}>
                <TableCell className="max-w-80">
                  <div
                    className="flex min-w-0 items-center gap-1.5"
                    style={{ paddingLeft: depth * INDENT_PX }}
                  >
                    {hasChildren ? (
                      <button
                        type="button"
                        onClick={() => toggleExpanded(row.id)}
                        aria-expanded={isExpanded}
                        aria-label={`${isExpanded ? "Collapse" : "Expand"} ${row.name}`}
                        className="text-muted-foreground hover:text-foreground hover:bg-muted flex size-5 shrink-0 items-center justify-center rounded"
                      >
                        {isExpanded ? (
                          <ChevronDown className="size-3.5" />
                        ) : (
                          <ChevronRight className="size-3.5" />
                        )}
                      </button>
                    ) : (
                      <span className="size-5 shrink-0" aria-hidden />
                    )}
                    <Icon className="text-muted-foreground size-3.5 shrink-0" />
                    {row.href ? (
                      <Link
                        href={row.href}
                        className="group min-w-0 flex-1"
                      >
                        <span className="group-hover:text-primary block truncate text-sm font-medium">
                          {row.name}
                        </span>
                        <span className="text-muted-foreground block truncate text-xs">
                          {row.subtitle}
                        </span>
                      </Link>
                    ) : (
                      <span className="block min-w-0 flex-1 truncate text-sm font-medium">
                        {row.name}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <StatusPill
                    status={row.status}
                    effectiveStatus={row.effectiveStatus}
                  />
                </TableCell>
                <TableCell>
                  <span className="block text-xs tabular-nums">
                    {row.budgetLabel}
                  </span>
                  {row.budgetInherited && (
                    <span className="text-muted-foreground text-[11px]">
                      inherited
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Sparkline
                    values={row.trend}
                    tone="primary"
                    label={`Conversion trend for ${row.name}`}
                  />
                </TableCell>
                {COLUMNS.map((column) => (
                  <TableCell
                    key={column.key}
                    numeric
                    className={cn(column.key === "spend" && "font-medium")}
                  >
                    {formatMetric(column.format, row.metrics[column.key])}
                  </TableCell>
                ))}
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Actions for ${row.name}`}
                  >
                    <MoreHorizontal />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableWrap>
  );
}
