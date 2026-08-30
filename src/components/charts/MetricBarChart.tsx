"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMetric, type MetricFormat } from "@/lib/format";

export interface MetricBar {
  name: string;
  value: number;
}

interface Props {
  data: MetricBar[];
  valueLabel: string;
  valueFormat: MetricFormat;
  height?: number;
}

export function MetricBarChart({
  data,
  valueLabel,
  valueFormat,
  height = 240,
}: Props) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
      >
        <CartesianGrid
          horizontal={false}
          stroke="var(--border)"
          strokeDasharray="3 3"
        />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value: number) => formatMetric("compact", value)}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={148}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)", opacity: 0.4 }}
          contentStyle={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            fontSize: 12,
            color: "var(--card-foreground)",
          }}
          formatter={(value: number) => [formatMetric(valueFormat, value), valueLabel]}
        />
        <Bar
          dataKey="value"
          name={valueLabel}
          fill="var(--chart-1)"
          radius={[0, 4, 4, 0]}
          barSize={18}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
