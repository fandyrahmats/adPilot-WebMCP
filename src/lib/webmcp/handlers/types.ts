import type { ToolArgs } from "../args";

export interface ToolResult {
  /** One line an agent can relay to a person without post-processing. */
  summary: string;
  data: unknown;
  /** Set when the call produced an approval request instead of a change. */
  awaitingApproval?: boolean;
}

/** Handlers are async because the provider behind them may be a remote API. */
export type ToolHandler = (args: ToolArgs) => Promise<ToolResult>;
