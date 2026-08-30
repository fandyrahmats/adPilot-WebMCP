import type { ToolArgs } from "../args";

export interface ToolResult {
  /** One line an agent can relay to a person without post-processing. */
  summary: string;
  data: unknown;
  /** Set when the call produced an approval request instead of a change. */
  awaitingApproval?: boolean;
  /**
   * Page this call is about. The browser navigates there so the human ends up
   * looking at whatever the agent just read or changed.
   */
  uiHref?: string;
}

/** Handlers are async because the provider behind them may be a remote API. */
export type ToolHandler = (args: ToolArgs) => Promise<ToolResult>;
