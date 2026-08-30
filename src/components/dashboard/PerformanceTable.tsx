"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ChevronRight, MoreHorizontal } from "lucide-react";
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
import type { DerivedMetrics, PerformanceRow } from "@/types/ads";
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

/** One metric set for every level so tables read the same at any depth. */
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

type SortKey = MetricColumnKey | "name";

interface Props {
  rows: PerformanceRow[];
  nameHeader: string;
  emptyTitle: string;
  emptyDescription: string;
}

export function PerformanceTable({
  rows,
  nameHeader,
  emptyTitle,
  emptyDescription,
}: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("spend");
  const [ascending, setAscending] = useState(false);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name);
      return (
        sortableValue(a.metrics[sortKey]) - sortableValue(b.metrics[sortKey])
      );
    });
    return ascending ? copy : copy.reverse();
  }, [rows, sortKey, ascending]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setAscending((previous) => !previous);
      return;
    }
    setSortKey(key);
    setAscending(key === "name");
  };

  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  const sortIcon = (key: SortKey) => {
    if (key !== sortKey) return null;
    const Icon = ascending ? ArrowUp : ArrowDown;
    return <Icon className="size-3" aria-hidden />;
  };

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
                {sortIcon("name")}
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
                  {sortIcon(column.key)}
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
          {sorted.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="max-w-72">
                {row.href ? (
                  <Link
                    href={row.href}
                    className="group inline-flex min-w-0 items-center gap-1"
                  >
                    <span className="min-w-0">
                      <span className="group-hover:text-primary block truncate text-sm font-medium">
                        {row.name}
                      </span>
                      <span className="text-muted-foreground block truncate text-xs">
                        {row.subtitle}
                      </span>
                    </span>
                    <ChevronRight className="text-muted-foreground size-3.5 shrink-0" />
                  </Link>
                ) : (
                  <span className="block truncate text-sm font-medium">
                    {row.name}
                  </span>
                )}
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
          ))}
        </TableBody>
      </Table>
    </TableWrap>
  );
}
