export class ToolError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 404 = 400,
  ) {
    super(message);
  }
}

export type ToolArgs = Record<string, unknown>;

/**
 * Handlers validate their own arguments. The specification notes that direct
 * tool calls are not guaranteed to be schema validated, so nothing here trusts
 * the caller to have followed the schema.
 */
export function requireString(args: ToolArgs, key: string): string {
  const value = args[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new ToolError(`"${key}" is required and must be a non-empty string`);
  }
  return value.trim();
}

export function optionalString(args: ToolArgs, key: string): string | undefined {
  const value = args[key];
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") {
    throw new ToolError(`"${key}" must be a string`);
  }
  return value.trim();
}

export function requireInteger(
  args: ToolArgs,
  key: string,
  { min = 0, max = Number.MAX_SAFE_INTEGER }: { min?: number; max?: number } = {},
): number {
  const value = args[key];
  const parsed = typeof value === "string" ? Number(value) : value;
  if (typeof parsed !== "number" || !Number.isFinite(parsed)) {
    throw new ToolError(`"${key}" is required and must be a number`);
  }
  const rounded = Math.round(parsed);
  if (rounded < min || rounded > max) {
    throw new ToolError(`"${key}" must be between ${min} and ${max}`);
  }
  return rounded;
}

export function optionalInteger(
  args: ToolArgs,
  key: string,
  bounds: { min?: number; max?: number } = {},
): number | undefined {
  if (args[key] === undefined || args[key] === null || args[key] === "") {
    return undefined;
  }
  return requireInteger(args, key, bounds);
}

export function requireEnum<T extends string>(
  args: ToolArgs,
  key: string,
  allowed: readonly T[],
): T {
  const value = requireString(args, key);
  if (!allowed.includes(value as T)) {
    throw new ToolError(`"${key}" must be one of: ${allowed.join(", ")}`);
  }
  return value as T;
}

export function optionalEnum<T extends string>(
  args: ToolArgs,
  key: string,
  allowed: readonly T[],
): T | undefined {
  if (args[key] === undefined || args[key] === null || args[key] === "") {
    return undefined;
  }
  return requireEnum(args, key, allowed);
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function optionalDate(args: ToolArgs, key: string): string | undefined {
  const value = optionalString(args, key);
  if (value === undefined) return undefined;
  if (!DATE_PATTERN.test(value)) {
    throw new ToolError(`"${key}" must be a date formatted as YYYY-MM-DD`);
  }
  return value;
}
