"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader, PlugZap, Unplug } from "lucide-react";
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
 * After each call the workspace follows the agent: it navigates to the page the
 * call concerned and refreshes server data, so the human and the agent are
 * always looking at the same thing.
 */
export function WebMcpRuntime() {
  const router = useRouter();
  const pathname = usePathname();
  const surface = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [registered, setRegistered] = useState(0);
  const [runningTool, setRunningTool] = useState<string | null>(null);

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
                setRunningTool(contract.name);
                try {
                  const response = await callTool(
                    contract.name,
                    args ?? {},
                    context?.signal,
                  );

                  // Move the human to whatever the agent just touched.
                  if (response.ok && response.uiHref && response.uiHref !== pathname) {
                    router.push(response.uiHref);
                  } else if (response.ok) {
                    router.refresh();
                  }

                  return formatToolReply(response);
                } finally {
                  setRunningTool(null);
                }
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
  }, [surface, router, pathname]);

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

  if (runningTool) {
    return (
      <Badge tone="accent" className="font-mono" title="A tool is executing now">
        <Loader className="animate-spin" />
        {runningTool}
      </Badge>
    );
  }

  return (
    <Badge tone="positive" title="Tools registered for this page">
      <PlugZap />
      {registered === 0 ? "Registering tools" : `${registered} WebMCP tools`}
    </Badge>
  );
}
