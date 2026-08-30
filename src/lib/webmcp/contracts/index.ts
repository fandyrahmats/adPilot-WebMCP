import { READ_TOOLS } from "./read";
import { WRITE_TOOLS } from "./write";
import type { ToolContract } from "./types";

export type { ToolContract, ToolInputSchema, ToolKind } from "./types";

/** Every tool this application exposes to agents through WebMCP. */
export const TOOL_CONTRACTS: ToolContract[] = [...READ_TOOLS, ...WRITE_TOOLS];

export const TOOL_NAMES = TOOL_CONTRACTS.map((contract) => contract.name);

const byName = new Map(TOOL_CONTRACTS.map((contract) => [contract.name, contract]));

export function findContract(name: string): ToolContract | undefined {
  return byName.get(name);
}
