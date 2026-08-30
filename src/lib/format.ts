const numberFormatter = new Intl.NumberFormat("en-US");

/** Shown when a metric has no denominator, so no honest value exists. */
export const NO_VALUE = "—";

function isMissing(value: number): boolean {
  return !Number.isFinite(value);
}

const compactUnits = [
  { threshold: 1_000_000_000, suffix: "B" },
  { threshold: 1_000_000, suffix: "M" },
  { threshold: 1_000, suffix: "K" },
] as const;

/** Trims a trailing ".0" so compact values stay short. */
function trimZero(value: string): string {
  return value.endsWith(".0") ? value.slice(0, -2) : value;
}

export function formatNumber(value: number): string {
  if (isMissing(value)) return NO_VALUE;
  return numberFormatter.format(Math.round(value));
}

export function formatCompactNumber(value: number): string {
  if (isMissing(value)) return NO_VALUE;
  const abs = Math.abs(value);
  const unit = compactUnits.find((candidate) => abs >= candidate.threshold);
  if (!unit) return formatNumber(value);
  return trimZero((value / unit.threshold).toFixed(1)) + unit.suffix;
}

/** Full currency, used on detail surfaces. */
export function formatCurrency(value: number): string {
  if (isMissing(value)) return NO_VALUE;
  return `Rp${formatNumber(value)}`;
}

/** Compact currency, used on cards and dense tables. */
export function formatCurrencyCompact(value: number): string {
  if (isMissing(value)) return NO_VALUE;
  if (Math.abs(value) < 1_000) return formatCurrency(value);
  return `Rp${formatCompactNumber(value)}`;
}

export function formatPercent(value: number): string {
  if (isMissing(value)) return NO_VALUE;
  const isWhole = Number.isInteger(value);
  return `${isWhole ? value : value.toFixed(1)}%`;
}

export function formatRoas(value: number): string {
  if (isMissing(value)) return NO_VALUE;
  return `${value.toFixed(1)}x`;
}

export function formatRatio(value: number): string {
  if (isMissing(value)) return NO_VALUE;
  return value.toFixed(2);
}

export function formatSignedPercent(value: number): string {
  if (value === 0) return "0%";
  const sign = value > 0 ? "+" : "-";
  return `${sign}${Math.abs(value).toFixed(1)}%`;
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatShortDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
}

/**
 * Relative time against a caller-supplied reference so server and client
 * render the same string. Only used in the activity feed.
 */
export function formatRelativeTime(iso: string, referenceIso: string): string {
  const diffMs = new Date(referenceIso).getTime() - new Date(iso).getTime();
  const minutes = Math.max(0, Math.round(diffMs / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function formatDuration(ms: number): string {
  if (ms < 1_000) return `${ms}ms`;
  return `${(ms / 1_000).toFixed(1)}s`;
}

export function formatAudienceSize(value: number): string {
  return `${formatCompactNumber(value)} people`;
}

export type MetricFormat =
  | "currency"
  | "currencyCompact"
  | "number"
  | "compact"
  | "percent"
  | "roas"
  | "ratio";

/**
 * Single entry point used by charts and tables so a metric always renders the
 * same way wherever it appears.
 */
export function formatMetric(kind: MetricFormat, value: number): string {
  switch (kind) {
    case "currency":
      return formatCurrency(value);
    case "currencyCompact":
      return formatCurrencyCompact(value);
    case "number":
      return formatNumber(value);
    case "compact":
      return formatCompactNumber(value);
    case "percent":
      return formatPercent(value);
    case "roas":
      return formatRoas(value);
    case "ratio":
      return formatRatio(value);
  }
}
