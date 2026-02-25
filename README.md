# Agent Activity UI

> Real-time interactive panel for observing all OpenClaw agents in action.

## Overview

A standalone Vite + Lit 4 + TypeScript web app that provides a live, hierarchical view of every running OpenClaw agent session — what each is doing, what tools it's calling, its token spend, and its parent/child relationships. From a single screen you can see everything and intervene (steer, abort, inject) without touching the CLI.

---

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│  <oc-resource-bar>  Active sessions · Tokens/hr · Errors · WS │
├──────────────────┬─────────────────────────────────────────────┤
│                  │                                             │
│  <oc-agent-tree> │  <oc-activity-feed>                        │
│                  │                                             │
│  Hierarchical    │  Real-time event cards                      │
│  session tree    │  (tool calls, runs, spawns, errors)         │
│  with status     │  Filterable + pauseable                     │
│  badges          │  Virtual-windowed rendering                 │
│                  │                                             │
├──────────────────┴─────────────────────────────────────────────┤
│  <oc-session-detail>  (slide-in right panel)                   │
│  Streaming output · Tool call log · Token stats · Actions      │
│  [Abort] [Steer] [Inject]                                      │
└────────────────────────────────────────────────────────────────┘
```

---

## Components

| Component | File | Description |
|---|---|---|
| `<oc-agents-view>` | `src/app.ts` | Root app; wires WS + state |
| `<oc-resource-bar>` | `src/components/oc-resource-bar.ts` | Top metrics bar |
| `<oc-agent-tree>` | `src/components/oc-agent-tree.ts` | Hierarchical session tree |
| `<oc-activity-feed>` | `src/components/oc-activity-feed.ts` | Real-time event feed |
| `<oc-session-detail>` | `src/components/oc-session-detail.ts` | Per-session detail panel |
| `<oc-ws-status>` | `src/components/oc-ws-status.ts` | WS connection indicator |

## Services

| File | Description |
|---|---|
| `src/services/ws-service.ts` | Singleton WS client with auto-reconnect + send queue |
| `src/services/ws-reactive-controller.ts` | Lit ReactiveController for WS events |
| `src/services/gateway-ws-server.ts` | Server-side subscription manager |
| `src/services/session-lifecycle-hooks.ts` | Hook functions to emit Gateway events |
| `src/services/session-lineage.ts` | Parent↔child session map |
| `src/services/activity-filter.ts` | Server-side event filter logic |

---

## Setup

```bash
cd agents/agent-activity-ui
npm install
npm run dev        # dev server on http://localhost:5173
npm run build      # production build → dist/
npm test           # run Vitest unit tests
```

### Gateway WS URL

Override the Gateway WebSocket URL at startup:

```html
<script>window.OPENCLAW_GATEWAY_WS = 'ws://your-gateway:4000';</script>
```

Or at build time via environment variable (extend `vite.config.ts`).

---

## Integration with OpenClaw Gateway

### Wire lifecycle hooks

In the OpenClaw session manager, call:

```ts
import {
  emitSessionCreated,
  emitSessionDestroyed,
  emitRunStarted,
  emitRunCompleted,
  emitToolCallStarted,
  emitToolCallCompleted,
  emitSubAgentSpawned,
} from './src/services/session-lifecycle-hooks.js';
```

Call each function at the appropriate point in the session/run/tool lifecycle.

### Wire subscription manager

In the Gateway WS message router, handle:

- `{ type: 'sessions.activity.subscribe', filter?: ActivityEventFilter }` → `activityManager.subscribeToActivity(clientId, filter)`
- `{ type: 'sessions.activity.unsubscribe' }` → `activityManager.unsubscribeFromActivity(clientId)`
- `{ type: 'sessions.detail', sessionKey: string }` → `activityManager.handleSessionsDetailRPC(sessionKey)`

Inject the transport send function:

```ts
activityManager.setSendCallback((clientId, event) => {
  wsServer.sendToClient(clientId, JSON.stringify(event));
});
```

---

## Design Principles

- **Calm, not chaotic** — CSS transitions, no layout shifts, 200ms event batching
- **Virtual scrolling** — Activity feed renders at most 80 items (VIRTUAL_WINDOW constant)
- **Reconnection** — Exponential backoff (1s→30s) with ±20% jitter, pause 60s after 5 fails
- **Keyboard-first** — Full arrow-key nav in tree, Tab/Enter for actions, Esc to close
- **Accessibility** — ARIA tree roles, `aria-live` on feed, focus indicators, dark mode support
- **Zero polling** — All updates are push-based via WS events

---

## Testing

```bash
npm test
```

Tests cover:

- `ActivitySubscriptionManager` subscribe/unsubscribe/rate-limiting
- `matchesFilter` / `mergeFilters` with various filter combinations  
- `SessionLineageMap` tree construction + mutation

---

## File Tree

```
agents/agent-activity-ui/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── README.md
└── src/
    ├── main.ts
    ├── app.ts                             # Root component
    ├── components/
    │   ├── oc-agent-tree.ts               # Phase 3
    │   ├── oc-activity-feed.ts            # Phase 4
    │   ├── oc-session-detail.ts           # Phase 5
    │   ├── oc-resource-bar.ts             # Phase 6
    │   └── oc-ws-status.ts               # Phase 2
    ├── services/
    │   ├── ws-service.ts                  # Phase 2
    │   ├── ws-reactive-controller.ts      # Phase 2
    │   ├── gateway-ws-server.ts           # Phase 1
    │   ├── session-lifecycle-hooks.ts     # Phase 1
    │   ├── session-lineage.ts             # Phase 1
    │   └── activity-filter.ts             # Phase 1
    ├── types/
    │   ├── gateway-events.ts              # Phase 1
    │   └── ui-state.ts                    # Phase 2
    ├── utils/
    │   └── throttle.ts                    # Phase 2
    ├── styles/
    │   └── design-tokens.css              # Phase 2
    └── tests/
        └── gateway-events.test.ts         # Phase 1
```
