"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrencyCompact } from "@/lib/format";

export interface AllocationSlice {
  name: string;
  value: number;
}

const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function AllocationChart({ data }: { data: AllocationSlice[] }) {
  const total = data.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <ResponsiveContainer width={168} height={168}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={52}
            outerRadius={80}
            paddingAngle={2}
            stroke="var(--card)"
            strokeWidth={2}
          >
            {data.map((slice, index) => (
              <Cell key={slice.name} fill={PALETTE[index % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              fontSize: 12,
              color: "var(--card-foreground)",
            }}
            formatter={(value: number) => formatCurrencyCompact(value)}
          />
        </PieChart>
      </ResponsiveContainer>

      <ul className="flex-1 space-y-2 text-sm">
        {data.map((slice, index) => (
          <li key={slice.name} className="flex items-center gap-2">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: PALETTE[index % PALETTE.length] }}
            />
            <span className="min-w-0 flex-1 truncate">{slice.name}</span>
            <span className="tabular-nums">
              {formatCurrencyCompact(slice.value)}
            </span>
            <span className="text-muted-foreground w-10 text-right text-xs tabular-nums">
              {total === 0 ? "0%" : `${Math.round((slice.value / total) * 100)}%`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
