/**
 * Minimal ambient declarations for the WebMCP browser surface, matching the
 * imperative API: registerTool with a JSON Schema input and an execute
 * callback that receives the parsed arguments and an AbortSignal.
 *
 * Declared locally so the app does not depend on a pre-release types package.
 */
interface WebMcpToolAnnotations {
  readOnlyHint?: boolean;
  untrustedContentHint?: boolean;
}

interface WebMcpExecuteContext {
  signal: AbortSignal;
}

interface WebMcpToolDescriptor {
  name: string;
  description: string;
  title?: string;
  inputSchema: unknown;
  annotations?: WebMcpToolAnnotations;
  execute: (
    args: Record<string, unknown>,
    context?: WebMcpExecuteContext,
  ) => Promise<string> | string;
}

interface WebMcpRegistrationOptions {
  signal?: AbortSignal;
  exposedTo?: string[];
}

interface WebMcpModelContext {
  registerTool: (
    tool: WebMcpToolDescriptor,
    options?: WebMcpRegistrationOptions,
  ) => Promise<void> | void;
  getTools?: (options?: { fromOrigins?: string[] }) => Promise<unknown[]>;
}

interface Document {
  modelContext?: WebMcpModelContext;
}

interface Navigator {
  modelContext?: WebMcpModelContext;
}
