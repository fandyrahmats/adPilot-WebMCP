"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { PlugZap, Unplug } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { TOOL_CONTRACTS } from "@/lib/webmcp/contracts";
import {
  callTool,
  describeTool,
  formatToolReply,
  registerWebMcpTool,
  resolveModelContext,
} from "@/lib/webmcp/client";

type Surface = "server" | "present" | "absent";

/** The model context is injected by the browser, so it is read, not mirrored. */
function subscribe(): () => void {
  return () => {};
}

function getSnapshot(): Surface {
  return resolveModelContext() ? "present" : "absent";
}

function getServerSnapshot(): Surface {
  return "server";
}

/**
 * Registers every AdPilot tool with the browser's model context on mount and
 * unregisters them on unmount through an AbortSignal.
 *
 * Writes refresh the router afterwards, so the server rendered dashboard shows
 * the state the tool call actually produced.
 */
export function WebMcpRuntime() {
  const router = useRouter();
  const surface = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [registered, setRegistered] = useState(0);

  useEffect(() => {
    if (surface !== "present") return;

    const controller = new AbortController();
    let cancelled = false;

    const register = async () => {
      let count = 0;
      for (const contract of TOOL_CONTRACTS) {
        try {
          await registerWebMcpTool(
            {
              name: contract.name,
              title: contract.title,
              description: describeTool(contract),
              inputSchema: contract.inputSchema,
              annotations: {
                readOnlyHint: contract.kind === "read",
                untrustedContentHint: false,
              },
              execute: async (args, context) => {
                const response = await callTool(
                  contract.name,
                  args ?? {},
                  context?.signal,
                );
                if (contract.kind === "write" && response.ok) {
                  router.refresh();
                }
                return formatToolReply(response);
              },
            },
            { signal: controller.signal },
          );
          count += 1;
        } catch {
          // One rejected tool must not stop the rest from registering.
        }
      }
      if (!cancelled) setRegistered(count);
    };

    void register();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [surface, router]);

  if (surface === "server") return null;

  if (surface === "absent") {
    return (
      <Badge
        tone="outline"
        title="This browser does not expose a model context, so no tools were registered"
      >
        <Unplug />
        WebMCP not available
      </Badge>
    );
  }

  return (
    <Badge tone="positive" title="Tools registered for this page">
      <PlugZap />
      {registered === 0
        ? "Registering tools"
        : `${registered} WebMCP tools`}
    </Badge>
  );
}
