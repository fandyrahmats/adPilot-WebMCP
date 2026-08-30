"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMetric, formatShortDate, type MetricFormat } from "@/lib/format";

export interface TrendPoint {
  date: string;
  primary: number;
  secondary?: number;
}

interface Props {
  data: TrendPoint[];
  primaryLabel: string;
  primaryFormat: MetricFormat;
  secondaryLabel?: string;
  secondaryFormat?: MetricFormat;
  height?: number;
}

const axisStyle = {
  fontSize: 11,
  fill: "var(--muted-foreground)",
} as const;

export function TrendChart({
  data,
  primaryLabel,
  primaryFormat,
  secondaryLabel,
  secondaryFormat = "currencyCompact",
  height = 260,
}: Props) {
  const hasSecondary = Boolean(secondaryLabel);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="trendPrimary" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid
          vertical={false}
          stroke="var(--border)"
          strokeDasharray="3 3"
        />
        <XAxis
          dataKey="date"
          tickFormatter={formatShortDate}
          tick={axisStyle}
          tickLine={false}
          axisLine={false}
          minTickGap={24}
        />
        <YAxis
          yAxisId="primary"
          tick={axisStyle}
          tickLine={false}
          axisLine={false}
          width={44}
          tickFormatter={(value: number) => formatMetric("compact", value)}
        />
        {hasSecondary && (
          <YAxis
            yAxisId="secondary"
            orientation="right"
            tick={axisStyle}
            tickLine={false}
            axisLine={false}
            width={52}
            tickFormatter={(value: number) =>
              formatMetric("currencyCompact", value)
            }
          />
        )}
        <Tooltip
          cursor={{ stroke: "var(--border)" }}
          contentStyle={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            fontSize: 12,
            color: "var(--card-foreground)",
          }}
          labelFormatter={(label: string) => formatShortDate(label)}
          formatter={(value: number, name: string) => [
            formatMetric(
              name === primaryLabel ? primaryFormat : secondaryFormat,
              value,
            ),
            name,
          ]}
        />
        <Area
          yAxisId="primary"
          type="monotone"
          dataKey="primary"
          name={primaryLabel}
          stroke="var(--chart-1)"
          strokeWidth={2}
          fill="url(#trendPrimary)"
          dot={false}
          activeDot={{ r: 3 }}
        />
        {hasSecondary && (
          <Line
            yAxisId="secondary"
            type="monotone"
            dataKey="secondary"
            name={secondaryLabel}
            stroke="var(--chart-3)"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
