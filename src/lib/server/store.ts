import { DEMO_ACCOUNT, DEMO_CAMPAIGNS } from "@/lib/demo/catalog";
import { DEMO_TOOL_EXECUTIONS } from "@/lib/demo/activity";
import type {
  AdAccount,
  Campaign,
  PendingChange,
  ToolExecution,
} from "@/types/ads";

/**
 * Authoritative state for the demo session. Tool calls mutate this store on the
 * server, so the UI and the agent always read the same numbers.
 *
 * It is process memory, not a database: a restart resets the account to its
 * seeded state. That is intentional for a deterministic demo.
 */
export interface AccountStore {
  account: AdAccount;
  campaigns: Campaign[];
  pendingChanges: PendingChange[];
  executions: ToolExecution[];
  sequence: number;
}

function seed(): AccountStore {
  return {
    account: DEMO_ACCOUNT,
    // Deep clone so mutations never leak back into the seed catalog.
    campaigns: structuredClone(DEMO_CAMPAIGNS),
    pendingChanges: [],
    executions: [...DEMO_TOOL_EXECUTIONS],
    sequence: 0,
  };
}

/**
 * Cached on globalThis so hot reloads in development keep the state the user
 * just built through the UI or through a tool call.
 */
const globalStore = globalThis as typeof globalThis & {
  adpilotStore?: AccountStore;
};

export function getStore(): AccountStore {
  globalStore.adpilotStore ??= seed();
  return globalStore.adpilotStore;
}

export function resetStore(): AccountStore {
  globalStore.adpilotStore = seed();
  return globalStore.adpilotStore;
}

export function nextId(prefix: string): string {
  const store = getStore();
  store.sequence += 1;
  return `${prefix}_${store.sequence.toString().padStart(3, "0")}`;
}

export function recordExecution(execution: ToolExecution): void {
  const store = getStore();
  store.executions = [execution, ...store.executions];
}
