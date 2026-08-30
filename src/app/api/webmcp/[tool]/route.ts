import { NextResponse } from "next/server";
import { runTool } from "@/lib/webmcp/handlers";
import type { ToolArgs } from "@/lib/webmcp/args";

/**
 * Tool handlers run here, on the server, not in the browser. The client only
 * forwards arguments, so the account scope and the approval rules cannot be
 * bypassed by anything running in the page.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ tool: string }> },
) {
  const { tool } = await params;

  let args: ToolArgs = {};
  const raw = await request.text();
  if (raw.trim() !== "") {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
        args = parsed as ToolArgs;
      } else {
        return NextResponse.json(
          {
            tool,
            ok: false,
            summary: "Invalid arguments",
            error: "Arguments must be a JSON object",
          },
          { status: 400 },
        );
      }
    } catch {
      return NextResponse.json(
        {
          tool,
          ok: false,
          summary: "Invalid arguments",
          error: "Request body must be valid JSON",
        },
        { status: 400 },
      );
    }
  }

  const run = await runTool(tool, args);
  return NextResponse.json(run.body, { status: run.status });
}
