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
cp .env.example .env.local   # then edit the three values, see below
npm run dev
```

Open http://localhost:3000. You will land on `/login`; sign in with the
credentials you set in `.env.local`.

```bash
npm run build   # production build
npm run start   # serve the production build
npm run lint
```

### Environment variables

The demo provider needs no configuration, but the login gate does. Without
these three set, the app refuses to sign anyone in rather than falling back to
a default.

| Variable | Default | Meaning |
| --- | --- | --- |
| `ADS_PROVIDER` | `demo` | Which ads provider backs the workspace. Any value other than `demo` fails with an explicit error instead of silently serving demo data. |
| `DEMO_LOGIN_EMAIL` | none | Email accepted at `/login`. Not committed anywhere; set your own. |
| `DEMO_LOGIN_PASSWORD` | none | Password accepted at `/login`. Not committed anywhere; set your own. |
| `SESSION_SECRET` | none | Random key used to sign the session cookie. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. |

Judges testing the deployed instance should use the credentials given in the
submission notes, not values from this file.

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

No browser enables WebMCP by default yet, so start by confirming registration:
the top bar reports **"20 WebMCP tools"** once every tool registers, and
**"WebMCP not available"** when the browser exposes no model context. It never
claims tools are registered when they are not.

### Option A: Chrome with a WebMCP client (verified end to end)

Chrome 149 or newer, enable `chrome://flags/#enable-webmcp-testing`, relaunch,
open the app, then drive the tools with a client that can list and call page
tools. This is the path the project was built and tested against, including
multi-step runs that read the account, built a campaign hierarchy, and pushed an
optimization into the approval queue.

### Option B: ChatGPT desktop app, built-in browser

Open the built-in browser and load the app. The address-bar arrow lists the
tools, split into read and write from each tool's `readOnlyHint` annotation.

Tool discovery is confirmed on this surface. Invocation depends on the account
and the surface in use: at the time of writing, a build routed the request into
Work mode, which reported that its WebMCP connection was unavailable
(`webmcp_list_tools` unsupported), so no tool ran. If that happens, use Option A
or Option C. Nothing about it is specific to this app, and the same server-side
handlers run either way.

### Option C: call the tools directly over HTTP

Every tool is reachable without any browser flag or agent, which makes the
behaviour easy to verify. WebMCP calls and these calls execute the same
server-side handler, but the endpoint now sits behind the same session gate as
the UI (see Security notes below). Sign in through the browser first, then copy
the `adpilot_session` cookie value from devtools (Application/Storage → Cookies)
and reuse it:

```bash
# read
curl -s http://localhost:3000/api/webmcp/get_goal_progress \
  -H 'content-type: application/json' -H 'cookie: adpilot_session=<paste value>' \
  -X POST -d '{}'

# gated write: recorded, not applied
curl -s http://localhost:3000/api/webmcp/update_ad_set_budget \
  -H 'content-type: application/json' -H 'cookie: adpilot_session=<paste value>' \
  -X POST -d '{"adSetId":"adset_students","dailyBudget":60000,"reason":"CPA above median"}'

# confirm the ad set budget did not move
curl -s http://localhost:3000/api/webmcp/get_ad_set \
  -H 'content-type: application/json' -H 'cookie: adpilot_session=<paste value>' \
  -X POST -d '{"adSetId":"adset_students"}'
```

The sign-in form itself is a React Server Action, not a plain HTML POST, so it
cannot be driven with a bare `curl -d 'email=...'` call; grabbing the cookie
after signing in through the browser is the reliable path. Without a valid
session cookie every one of these calls returns `401` instead of running the
handler, which is what closes off the approval endpoint from anonymous callers
on the public deployment.

Then open `/review`, approve the held change, and read the ad set again. Only
now does the budget change. The decision is recorded in **Agent Activity** with
`actor: human`.

### Suggested demo path

0. **Sign in** at `/login` with the demo credentials.
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

- Every route except `/login` is gated in [`src/proxy.ts`](src/proxy.ts):
  page requests without a valid session redirect to `/login`, and API/tool
  requests get a `401` instead of running the handler. This is what stops an
  anonymous caller from reaching `/review` or `/api/webmcp/*` directly, which
  was previously possible and is the reason the gate exists.
- The session is a signed, revocable token (see
  [`src/lib/server/auth.ts`](src/lib/server/auth.ts)): a random id, an HMAC
  signature over that id (Web Crypto, `SESSION_SECRET`), and a server-side
  active-session set. Signing off the active set means signing out actually
  ends the session instead of leaving a still-valid signed cookie until it
  expires.
- Credentials are read only from `DEMO_LOGIN_EMAIL` / `DEMO_LOGIN_PASSWORD` at
  request time and compared with a constant-time check. They are never
  hardcoded, logged, or rendered into any page, including `/login` itself.
- Tool handlers execute server side. Identifiers are resolved against the
  session's own account, so a caller can name a child entity but cannot assert
  which account or parent it belongs to.
- This is one shared login for the whole demo account, not a multi-user
  identity system, which matches the scope of a single-instance hackathon
  deployment. It is not a substitute for per-user auth on a real ad account.
- No secrets are committed. `.env.local` is gitignored; only `.env.example`
  (placeholder values) is tracked.

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
