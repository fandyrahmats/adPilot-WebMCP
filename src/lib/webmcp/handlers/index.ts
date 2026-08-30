import { findContract } from "@/lib/webmcp/contracts";
import { recordExecution } from "@/lib/server/store";
import { ChangeError } from "@/lib/server/changes";
import { ProviderError } from "@/lib/providers";
import { ToolError, type ToolArgs } from "../args";
import { READ_HANDLERS } from "./read";
import { WRITE_HANDLERS } from "./write";
import type { ToolResult } from "./types";
import type { ToolExecution } from "@/types/ads";

export type { ToolResult } from "./types";

const HANDLERS = { ...READ_HANDLERS, ...WRITE_HANDLERS };

export interface ToolRun {
  status: number;
  body: {
    tool: string;
    ok: boolean;
    summary: string;
    awaitingApproval?: boolean;
    uiHref?: string;
    data?: unknown;
    error?: string;
  };
}

function logExecution(
  tool: string,
  kind: "read" | "write",
  status: ToolExecution["status"],
  summary: string,
  startedAt: number,
): void {
  recordExecution({
    id: `exec_${Date.now().toString(36)}`,
    toolName: tool,
    kind,
    status,
    actor: "agent",
    summary,
    startedAt: new Date(startedAt).toISOString(),
    durationMs: Math.max(1, Date.now() - startedAt),
  });
}

/**
 * Single entry point for every tool call. It resolves the contract, runs the
 * handler, and writes the outcome to the audit log, including failures. A call
 * that throws is never logged as a success.
 */
export async function runTool(name: string, args: ToolArgs): Promise<ToolRun> {
  const startedAt = Date.now();
  const contract = findContract(name);

  if (!contract) {
    return {
      status: 404,
      body: { tool: name, ok: false, summary: "Unknown tool", error: `No tool named "${name}"` },
    };
  }

  const handler = HANDLERS[name];
  if (!handler) {
    return {
      status: 501,
      body: {
        tool: name,
        ok: false,
        summary: "Tool is declared but not implemented",
        error: `"${name}" has a contract but no handler`,
      },
    };
  }

  try {
    const result: ToolResult = await handler(args);
    logExecution(
      name,
      contract.kind,
      result.awaitingApproval ? "awaiting_approval" : "success",
      result.summary,
      startedAt,
    );
    return {
      status: 200,
      body: {
        tool: name,
        ok: true,
        summary: result.summary,
        awaitingApproval: result.awaitingApproval ?? false,
        uiHref: result.uiHref,
        data: result.data,
      },
    };
  } catch (error) {
    const isToolError = error instanceof ToolError;
    const isProviderError = error instanceof ProviderError;
    const message =
      isToolError || isProviderError || error instanceof ChangeError
        ? error.message
        : "The tool failed while reading account state";

    logExecution(name, contract.kind, "error", message, startedAt);

    const status = isToolError
      ? error.status
      : isProviderError && error.code === "not_found"
        ? 404
        : 500;

    return {
      status,
      body: { tool: name, ok: false, summary: `Failed: ${message}`, error: message },
    };
  }
}
