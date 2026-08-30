# AdPilot

An agent-native advertising workspace. A marketer sets a measurable goal, and an
AI agent can inspect performance, plan campaigns, build structure, detect
problems, and propose optimizations by calling the application's own tools
through [WebMCP](https://developer.chrome.com/docs/ai/webmcp).

The agent is not advising about ads from the outside. It operates the
application through 20 registered tools, and every change that could move money
stops for human approval.

## Why this fits WebMCP

Ads management is a dense, multi-level domain: a campaign contains ad sets,
which contain ads. Driving that through screen scraping or synthetic clicks is
slow and unsafe. Exposing it as structured tools means an agent can read exact
aggregates, propose a specific change with evidence, and hand the decision back
to a person, all inside the same page the human is looking at.

## What humans and agents do together

| Step | Who | How |
| --- | --- | --- |
| Read performance, find anomalies | agent | read tools |
| Build campaign structure | agent | create tools, entities start paused |
| Propose a budget or delivery change | agent | gated write tools, held for review |
| Approve or reject | human | review queue in the UI |
| Apply the change | system | only after approval, through the provider |

## WebMCP implementation

Tool registration lives in
[`src/components/webmcp/WebMcpRuntime.tsx`](src/components/webmcp/WebMcpRuntime.tsx).
It registers every tool on mount and unregisters them with an `AbortSignal`:

```ts
await document.modelContext.registerTool(
  {
    name: contract.name,
    description: describeTool(contract),
    inputSchema: contract.inputSchema,
    annotations: { readOnlyHint: contract.kind === "read" },
    execute: async (args, context) => {
      const response = await callTool(contract.name, args ?? {}, context?.signal);
      return formatToolReply(response);
    },
  },
  { signal: controller.signal },
);
```

The imperative API is read from `document.modelContext`, falling back to
`navigator.modelContext`, because the surface is still moving.

Supporting files:

- [`src/lib/webmcp/contracts/`](src/lib/webmcp/contracts) - names, descriptions,
  and JSON Schemas. One source of truth for the browser and the server.
- [`src/lib/webmcp/handlers/`](src/lib/webmcp/handlers) - server side handlers.
  Thin adapters over the application services.
- [`src/app/api/webmcp/[tool]/route.ts`](src/app/api/webmcp/%5Btool%5D/route.ts) -
  the endpoint each tool call is dispatched through.

Handlers run on the server, not in the page. The browser only forwards
arguments, so account scope and the approval rules cannot be bypassed by
anything running in the tab.

## Tool surface

14 read tools, 3 create tools, 3 approval-gated write tools.

| Kind | Tools | Behaviour |
| --- | --- | --- |
| read | `get_ad_account`, `get_goal_progress`, `get_account_performance`, `list_campaigns`, `get_campaign`, `get_ad_set`, `get_ad`, `get_performance_timeseries`, `get_creative_performance`, `detect_anomalies`, `get_optimization_recommendations`, `list_pending_changes`, `get_pending_change`, `list_tool_executions` | run freely |
| create | `create_campaign`, `create_ad_set`, `create_ad` | apply immediately, always created paused so they cannot spend |
| gated | `update_ad_set_budget`, `update_entity_status`, `apply_recommendation` | recorded as an approval request; the account does not change |

Approval is deliberately **not** a tool. It is a server action reached by a
person clicking in the review queue, so an agent cannot approve its own request.

The live registry is visible in the app under **Agent Activity**.

## Local setup

Requires Node 20.9 or newer. Node 22 LTS is recommended, because parts of the
lint toolchain expect 20.19+.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

```bash
npm run build   # production build
npm run start   # serve the production build
npm run lint
```

### Environment variables

None are required. The demo provider is the default.

| Variable | Default | Meaning |
| --- | --- | --- |
| `ADS_PROVIDER` | `demo` | Which ads provider backs the workspace. Any value other than `demo` fails with an explicit error instead of silently serving demo data. |

## Demo mode is real, the ad network is not

All numbers come from `DemoAdsProvider`, a deterministic in-process
implementation of the [`AdsProvider`](src/lib/providers/types.ts) interface. It
is seeded from a fixed dataset and a fixed reference date, so every run produces
identical figures.

This is honest demo data, not a live ad network connection, and the UI labels it
as "Demo Ads Provider" in the top bar. A network backed provider can be added
behind the same interface without changing the tool contracts or the UI.

State lives in process memory. Restarting the server resets the account to its
seeded condition, which also means a free Render instance returns to a clean
demo after it spins down.

## Testing the WebMCP tools

### Option A: a WebMCP capable browser

No browser enables WebMCP by default yet. In Chrome 146 or newer, open
`chrome://flags/#enable-webmcp-testing`, enable it, relaunch, then load the app
and connect an agent that can list and call page tools. ChatGPT's in-app browser
also exposes the surface.

The top bar reports what it found: **"20 WebMCP tools"** once registration
succeeds, or **"WebMCP not available"** when the browser exposes no model
context. It never claims tools are registered when they are not.

### Option B: call the tools directly over HTTP

Every tool is reachable without a WebMCP browser, which makes the behaviour easy
to verify:

```bash
# read
curl -s -X POST http://localhost:3000/api/webmcp/get_goal_progress \
  -H 'content-type: application/json' -d '{}'

# gated write: recorded, not applied
curl -s -X POST http://localhost:3000/api/webmcp/update_ad_set_budget \
  -H 'content-type: application/json' \
  -d '{"adSetId":"adset_students","dailyBudget":60000,"reason":"CPA above median"}'

# confirm the ad set budget did not move
curl -s -X POST http://localhost:3000/api/webmcp/get_ad_set \
  -H 'content-type: application/json' -d '{"adSetId":"adset_students"}'
```

Then open `/review`, approve the held change, and read the ad set again. Only
now does the budget change. The decision is recorded in **Agent Activity** with
`actor: human`.

### Suggested demo path

1. **Overview** - goal progress, KPIs, campaign table.
2. **Campaigns** - drill down campaign to ad set to ad.
3. **Insights** - spend allocation and the creative whose click-through rate is decaying.
4. Ask the agent to `detect_anomalies`, then `get_optimization_recommendations`.
5. Ask it to `apply_recommendation` for `rec_reallocate_budget`. It is held, not applied.
6. **Review** - read the evidence and the before/after diff, then approve.
7. Watch the ad set budget change and the entry appear in **Agent Activity**.

## Deploying to Render

The repository includes [`render.yaml`](render.yaml). Deploy it as a Blueprint,
or create a Node web service manually with:

- Build command: `npm ci && npm run build`
- Start command: `npm run start`
- Environment variable: `NODE_VERSION=22.11.0`

`next start` binds the port Render provides through `PORT`. Keep the service at
a single instance: the demo state is in process memory, so multiple instances
would not share it.

## Security notes

- Tool handlers execute server side. Identifiers are resolved against the
  session's own account, so a caller can name a child entity but cannot assert
  which account or parent it belongs to.
- The tool endpoint is currently unauthenticated, which is what makes the curl
  testing path above possible. On a public deployment this means anyone who
  finds the URL can call the write tools. That is acceptable for a disposable
  demo account holding synthetic data, and it is not suitable for real ad
  accounts. Adding session auth is the next step before any real provider.
- No secrets are required or committed.

## Project structure

```text
src/
  app/                     routes, api/webmcp endpoint, server actions
  components/
    ui/                    local primitives in the shadcn composition style
    charts/                Recharts wrappers
    dashboard/             KPI cards, tables, recommendation and approval cards
    layout/                shell, sidebar, top bar
    webmcp/                tool registration runtime and registry table
  lib/
    ads-service.ts         application services used by UI and tools
    metrics.ts             aggregation and derived metrics
    recommendations.ts     evidence backed recommendations
    anomalies.ts           anomaly detection
    providers/             AdsProvider interface and the demo implementation
    server/                mutable session state, approval pipeline
    webmcp/                tool contracts, handlers, browser client
  types/                   shared domain and WebMCP types
```

## License

[MIT](LICENSE).
