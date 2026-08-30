import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableWrap,
} from "@/components/ui/Table";
import { formatCurrencyCompact, formatNumber, formatPercent } from "@/lib/format";
import type { CreativeRow } from "@/lib/ads-service";
import { DeltaBadge } from "./DeltaBadge";
import { EmptyState } from "./EmptyState";

export function CreativeTable({ rows }: { rows: CreativeRow[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No creative data yet"
        description="Creative metrics appear once ads have delivered impressions."
      />
    );
  }

  return (
    <TableWrap>
      <Table className="min-w-2xl">
        <TableHead>
          <TableRow className="hover:bg-transparent">
            <TableHeaderCell>Creative</TableHeaderCell>
            <TableHeaderCell>Format</TableHeaderCell>
            <TableHeaderCell numeric>Impressions</TableHeaderCell>
            <TableHeaderCell numeric>CTR</TableHeaderCell>
            <TableHeaderCell>CTR trend</TableHeaderCell>
            <TableHeaderCell numeric>Conv.</TableHeaderCell>
            <TableHeaderCell numeric>CPA</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="max-w-72">
                <Link href={row.href} className="group block min-w-0">
                  <span className="group-hover:text-primary block truncate text-sm font-medium">
                    {row.name}
                  </span>
                  <span className="text-muted-foreground block truncate text-xs">
                    {row.adName}
                  </span>
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground text-xs capitalize">
                {row.format}
              </TableCell>
              <TableCell numeric>{formatNumber(row.metrics.impressions)}</TableCell>
              <TableCell numeric>{formatPercent(row.metrics.ctr)}</TableCell>
              <TableCell>
                <DeltaBadge delta={row.ctrDelta} suffix="7d" />
              </TableCell>
              <TableCell numeric>{formatNumber(row.metrics.conversions)}</TableCell>
              <TableCell numeric>
                {formatCurrencyCompact(row.metrics.cpa)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableWrap>
  );
}
