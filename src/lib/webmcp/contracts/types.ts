export interface SchemaProperty {
  type: "string" | "number" | "integer" | "boolean";
  description: string;
  enum?: readonly string[];
  minimum?: number;
  maximum?: number;
}

export interface ToolInputSchema {
  type: "object";
  properties: Record<string, SchemaProperty>;
  required?: readonly string[];
  additionalProperties: false;
}

export type ToolKind = "read" | "write";

export interface ToolContract {
  name: string;
  /** Short label used by the in-app tool registry. */
  title: string;
  /** Agent-facing description: what it returns and when to reach for it. */
  description: string;
  kind: ToolKind;
  /**
   * True when the write is high impact and must be held for a human decision
   * instead of being applied by the tool call itself.
   */
  requiresApproval: boolean;
  inputSchema: ToolInputSchema;
}

export const EMPTY_SCHEMA: ToolInputSchema = {
  type: "object",
  properties: {},
  additionalProperties: false,
};
