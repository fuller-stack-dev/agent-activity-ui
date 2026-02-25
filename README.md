# Agent Activity UI

> A real-time dashboard for watching your OpenClaw AI agents work.

![Screenshot placeholder](https://placehold.co/800x400?text=Agent+Activity+UI)

See every agent running, what tools they're calling, how much they're spending, and intervene (steer, abort, inject a message) — all from one screen. No CLI needed.

---

## Quickstart

**Requirements:** [Node.js 18+](https://nodejs.org) and [OpenClaw](https://openclaw.ai) installed and running.

```bash
git clone https://github.com/fuller-stack-dev/agent-activity-ui
cd agent-activity-ui
npm install
npm run dev
```

Open **http://localhost:5173** in your browser. That's it.

The UI auto-connects to your local OpenClaw gateway. If it shows "Disconnected", make sure the OpenClaw gateway is running (`openclaw gateway start`).

---

## What You'll See

| Panel | What it shows |
|---|---|
| **Top bar** | Active sessions, token spend per hour, error count, connection status |
| **Left panel** | A live tree of all running agents and their child sessions |
| **Right panel** | Real-time event feed — every tool call, spawn, run, and error as it happens |
| **Detail panel** | Click any agent to see its full streaming output, tool call log, token stats, and action buttons |

### Actions
- **Steer** — Send a new instruction to a running agent mid-task
- **Abort** — Kill a stuck or runaway agent
- **Inject** — Push a system message into an agent's context

---

## Configuration

By default the UI connects to `ws://localhost:18789` (the standard OpenClaw gateway port).

To connect to a remote gateway (e.g. via [Tailscale Funnel](https://tailscale.com/kb/1223/funnel)):

```html
<!-- Add to index.html before the closing </body> tag -->
<script>window.OPENCLAW_GATEWAY_WS = 'wss://your-machine.tailnet.ts.net';</script>
```

---

## Building for Production

```bash
npm run build   # outputs to dist/
```

Serve the `dist/` folder with any static file server (nginx, Caddy, `npx serve dist`, etc.).

---

## Tech Stack

Built with [Vite](https://vitejs.dev), [Lit 4](https://lit.dev) web components, and TypeScript. Zero runtime dependencies beyond Lit.

---

## Contributing / Advanced Integration

The UI connects to OpenClaw via WebSocket and listens for session lifecycle events. If you're building your own agent framework and want to wire this UI in, see the integration guide in [`src/services/`](src/services/).
