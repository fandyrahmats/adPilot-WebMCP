import type { ToolContract } from "@/lib/webmcp/contracts";

export interface ToolCallResponse {
  tool: string;
  ok: boolean;
  summary: string;
  awaitingApproval?: boolean;
  /** Page the call concerns, so the UI can follow the agent. */
  uiHref?: string;
  data?: unknown;
  error?: string;
}

/**
 * The specification is still moving: Chrome exposes the interface on
 * `document`, while earlier material used `navigator`. Resolve whichever the
 * current browser provides instead of assuming one.
 */
export function resolveModelContext(): WebMcpModelContext | null {
  if (typeof document !== "undefined" && document.modelContext) {
    return document.modelContext;
  }
  if (typeof navigator !== "undefined" && navigator.modelContext) {
    return navigator.modelContext;
  }
  return null;
}

/**
 * Registers one tool with the browser. The document surface is the one the
 * specification defines, so it is called directly here; navigator is only a
 * fallback for older implementations.
 */
export async function registerWebMcpTool(
  tool: WebMcpToolDescriptor,
  options: WebMcpRegistrationOptions,
): Promise<void> {
  if (typeof document !== "undefined" && document.modelContext) {
    await document.modelContext.registerTool(tool, options);
    return;
  }
  if (typeof navigator !== "undefined" && navigator.modelContext) {
    await navigator.modelContext.registerTool(tool, options);
    return;
  }
  throw new Error("This browser does not expose a model context");
}

/** Tool execution is a thin call into the server handler for that tool. */
export async function callTool(
  name: string,
  args: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<ToolCallResponse> {
  const response = await fetch(`/api/webmcp/${name}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(args ?? {}),
    signal,
  });

  const payload = (await response.json()) as ToolCallResponse;
  return payload;
}

/**
 * Agents read strings, so the summary leads and the structured payload follows
 * for the cases where exact numbers matter.
 */
export function formatToolReply(response: ToolCallResponse): string {
  if (!response.ok) {
    return `${response.summary}${response.error ? ` (${response.error})` : ""}`;
  }
  if (response.data === undefined) return response.summary;
  return `${response.summary}\n\n${JSON.stringify(response.data)}`;
}

export function describeTool(contract: ToolContract): string {
  if (contract.kind === "read") return contract.description;
  return contract.requiresApproval
    ? `${contract.description} Requires human approval before it takes effect.`
    : `${contract.description} Takes effect immediately, but cannot start spending.`;
}
