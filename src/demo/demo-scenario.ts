/**
 * Demo scenario — simulates a full Planner → Maestro → Worker pipeline
 * by injecting fake Gateway events directly into WsService subscribers.
 *
 * Activates automatically on localhost, or append ?demo to any URL.
 */

import { WsService } from '../services/ws-service.js';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const ts = () => new Date().toISOString();

function emit(event: Record<string, unknown>) {
  // Reach into subscriptions via subscribeAll and immediately dispatch
  const ws = WsService.getInstance();
  // Dispatch via a one-time subscribeAll handler we control
  const raw = JSON.stringify(event);
  // Directly fire via the internal message path by creating a mock MessageEvent
  const mockEvent = new MessageEvent('message', { data: raw });
  // We call the internal handleIncomingMessage by re-using the existing
  // subscribeAll → this fakes an inbound WS message
  (ws as any).handleIncomingMessage?.(raw) ?? ws.dispatchEvent(
    Object.assign(new CustomEvent('_demo_event'), { data: raw })
  );
}

export async function runDemoScenario() {
  const ws = WsService.getInstance() as any;
  // Patch: expose handleIncomingMessage for demo use if not already public
  const dispatch = (event: Record<string, unknown>) => {
    try {
      ws.handleIncomingMessage(JSON.stringify(event));
    } catch {
      // fallback: fire synthetic events through all subscribers
      const subs: Array<{ eventKind: string; handler: (e: unknown) => void }> =
        ws.subscriptions ?? [];
      for (const sub of subs) {
        if (sub.eventKind === '*' || sub.eventKind === event['eventKind']) {
          sub.handler(event);
        }
      }
    }
  };

  // Patch WsService status to "connected" so UI shows green
  ws.status = 'connected';
  ws.dispatchEvent(new CustomEvent('ws-status-change', { detail: 'connected' }));

  console.log('🎬 Demo: Starting fake agent orchestrator scenario...');

  // ── Step 1: Main session comes online ──────────────────────────────────────
  dispatch({ eventKind: 'session.created', sessionKey: 'agent:main:discord:111', timestamp: ts(), model: 'github-copilot/claude-sonnet-4.6', channel: 'discord', label: 'main' });
  await delay(1200);

  // ── Step 2: Notion poller wakes up Planner ─────────────────────────────────
  dispatch({ eventKind: 'session.created', sessionKey: 'agent:planner:cron:222', parentSessionKey: 'agent:main:discord:111', timestamp: ts(), model: 'github-copilot/claude-opus-4.6', channel: 'cron', label: 'planner — "Build a Weather App"' });
  dispatch({ eventKind: 'run.started', sessionKey: 'agent:planner:cron:222', timestamp: ts(), runId: 'run-planner-1', taskSummary: 'Planning: Build a Weather App' });
  await delay(800);

  dispatch({ eventKind: 'tool.started', sessionKey: 'agent:planner:cron:222', timestamp: ts(), toolName: 'exec', argsSummary: 'mcporter call notion.notion-fetch (ticket body)' });
  await delay(600);
  dispatch({ eventKind: 'tool.completed', sessionKey: 'agent:planner:cron:222', timestamp: ts(), toolName: 'exec', resultSummary: '✓ Fetched ticket: "Build a Weather App — show current + 5-day forecast"', isError: false });
  await delay(900);

  dispatch({ eventKind: 'tool.started', sessionKey: 'agent:planner:cron:222', timestamp: ts(), toolName: 'web_search', argsSummary: '"best weather app tech stack 2026 React"' });
  await delay(1400);
  dispatch({ eventKind: 'tool.completed', sessionKey: 'agent:planner:cron:222', timestamp: ts(), toolName: 'web_search', resultSummary: '✓ Vite + React + Tailwind + Open-Meteo API (free, no key required)', isError: false });
  await delay(700);

  dispatch({ eventKind: 'tool.started', sessionKey: 'agent:planner:cron:222', timestamp: ts(), toolName: 'web_search', argsSummary: '"open-meteo api documentation forecast endpoint"' });
  await delay(1100);
  dispatch({ eventKind: 'tool.completed', sessionKey: 'agent:planner:cron:222', timestamp: ts(), toolName: 'web_search', resultSummary: '✓ GET /v1/forecast?lat=...&lon=...&daily=temperature_2m_max', isError: false });
  await delay(900);

  dispatch({ eventKind: 'tool.started', sessionKey: 'agent:planner:cron:222', timestamp: ts(), toolName: 'exec', argsSummary: 'mcporter call notion.notion-update-page (write plan + Status → Ready for Work)' });
  await delay(600);
  dispatch({ eventKind: 'tool.completed', sessionKey: 'agent:planner:cron:222', timestamp: ts(), toolName: 'exec', resultSummary: '✓ Plan written to Notion. Status set to "Ready for Work"', isError: false });

  dispatch({ eventKind: 'run.completed', sessionKey: 'agent:planner:cron:222', timestamp: ts(), runId: 'run-planner-1', tokenCounts: { inputTokens: 5200, outputTokens: 1100, totalTokens: 6300, estimatedCostUsd: 0.018 } });
  dispatch({ eventKind: 'session.destroyed', sessionKey: 'agent:planner:cron:222', timestamp: ts() });
  await delay(1800);

  // ── Step 3: Maestro picks up the ticket ────────────────────────────────────
  dispatch({ eventKind: 'session.created', sessionKey: 'agent:maestro:cron:333', parentSessionKey: 'agent:main:discord:111', timestamp: ts(), model: 'github-copilot/claude-sonnet-4.6', channel: 'cron', label: 'maestro — "Build a Weather App"' });
  dispatch({ eventKind: 'run.started', sessionKey: 'agent:maestro:cron:333', timestamp: ts(), runId: 'run-maestro-1', taskSummary: 'Orchestrating 4 subtasks' });
  await delay(800);

  dispatch({ eventKind: 'tool.started', sessionKey: 'agent:maestro:cron:333', timestamp: ts(), toolName: 'exec', argsSummary: 'mcporter call notion.notion-fetch (read plan checkboxes)' });
  await delay(700);
  dispatch({ eventKind: 'tool.completed', sessionKey: 'agent:maestro:cron:333', timestamp: ts(), toolName: 'exec', resultSummary: '✓ Plan has 4 tasks: scaffold, API integration, UI components, deploy', isError: false });
  await delay(1000);

  // ── Step 4: Worker 1 — Scaffold ────────────────────────────────────────────
  dispatch({ eventKind: 'subagent.spawned', sessionKey: 'agent:maestro:cron:333', timestamp: ts(), childSessionKey: 'agent:worker:sub:444', agentId: 'worker', label: 'worker-1-scaffold' });
  dispatch({ eventKind: 'session.created', sessionKey: 'agent:worker:sub:444', parentSessionKey: 'agent:maestro:cron:333', timestamp: ts(), model: 'github-copilot/claude-haiku-4.5', channel: 'subagent', label: 'worker-1 — scaffold app' });
  dispatch({ eventKind: 'run.started', sessionKey: 'agent:worker:sub:444', timestamp: ts(), runId: 'run-worker-1', taskSummary: 'npx create-vite weather-app' });
  await delay(800);

  dispatch({ eventKind: 'tool.started', sessionKey: 'agent:worker:sub:444', timestamp: ts(), toolName: 'exec', argsSummary: 'npx create-vite weather-app --template react-ts' });
  await delay(2200);
  dispatch({ eventKind: 'tool.completed', sessionKey: 'agent:worker:sub:444', timestamp: ts(), toolName: 'exec', resultSummary: '✓ Scaffolded in workspace/projects/weather-app/', isError: false });
  await delay(600);

  dispatch({ eventKind: 'tool.started', sessionKey: 'agent:worker:sub:444', timestamp: ts(), toolName: 'exec', argsSummary: 'npm install (Tailwind, axios)' });
  await delay(1600);
  dispatch({ eventKind: 'tool.completed', sessionKey: 'agent:worker:sub:444', timestamp: ts(), toolName: 'exec', resultSummary: '✓ Dependencies installed', isError: false });

  dispatch({ eventKind: 'run.completed', sessionKey: 'agent:worker:sub:444', timestamp: ts(), runId: 'run-worker-1', tokenCounts: { inputTokens: 900, outputTokens: 200, totalTokens: 1100, estimatedCostUsd: 0.001 } });
  dispatch({ eventKind: 'session.destroyed', sessionKey: 'agent:worker:sub:444', timestamp: ts() });
  await delay(600);

  dispatch({ eventKind: 'tool.started', sessionKey: 'agent:maestro:cron:333', timestamp: ts(), toolName: 'exec', argsSummary: 'mcporter notion-update-page — check off Task 1' });
  await delay(400);
  dispatch({ eventKind: 'tool.completed', sessionKey: 'agent:maestro:cron:333', timestamp: ts(), toolName: 'exec', resultSummary: '✓ [x] Task 1: Scaffold complete', isError: false });
  await delay(800);

  // ── Step 5: Worker 2 — API Integration ─────────────────────────────────────
  dispatch({ eventKind: 'subagent.spawned', sessionKey: 'agent:maestro:cron:333', timestamp: ts(), childSessionKey: 'agent:worker:sub:555', agentId: 'worker', label: 'worker-2-api' });
  dispatch({ eventKind: 'session.created', sessionKey: 'agent:worker:sub:555', parentSessionKey: 'agent:maestro:cron:333', timestamp: ts(), model: 'github-copilot/claude-haiku-4.5', channel: 'subagent', label: 'worker-2 — Open-Meteo API' });
  dispatch({ eventKind: 'run.started', sessionKey: 'agent:worker:sub:555', timestamp: ts(), runId: 'run-worker-2', taskSummary: 'Write api.ts + useWeather hook' });
  await delay(700);

  dispatch({ eventKind: 'tool.started', sessionKey: 'agent:worker:sub:555', timestamp: ts(), toolName: 'write', argsSummary: 'src/api/weather.ts' });
  await delay(900);
  dispatch({ eventKind: 'tool.completed', sessionKey: 'agent:worker:sub:555', timestamp: ts(), toolName: 'write', resultSummary: '✓ Written: fetchForecast(lat, lon) → WeatherData', isError: false });

  dispatch({ eventKind: 'tool.started', sessionKey: 'agent:worker:sub:555', timestamp: ts(), toolName: 'write', argsSummary: 'src/hooks/useWeather.ts' });
  await delay(700);
  dispatch({ eventKind: 'tool.completed', sessionKey: 'agent:worker:sub:555', timestamp: ts(), toolName: 'write', resultSummary: '✓ Written: useWeather(city) with loading/error states', isError: false });

  dispatch({ eventKind: 'run.completed', sessionKey: 'agent:worker:sub:555', timestamp: ts(), runId: 'run-worker-2', tokenCounts: { inputTokens: 1400, outputTokens: 380, totalTokens: 1780, estimatedCostUsd: 0.002 } });
  dispatch({ eventKind: 'session.destroyed', sessionKey: 'agent:worker:sub:555', timestamp: ts() });
  await delay(500);

  dispatch({ eventKind: 'tool.started', sessionKey: 'agent:maestro:cron:333', timestamp: ts(), toolName: 'exec', argsSummary: 'mcporter notion-update-page — check off Task 2' });
  await delay(400);
  dispatch({ eventKind: 'tool.completed', sessionKey: 'agent:maestro:cron:333', timestamp: ts(), toolName: 'exec', resultSummary: '✓ [x] Task 2: API integration complete', isError: false });
  await delay(800);

  // ── Step 6: Worker 3 — hits an error ───────────────────────────────────────
  dispatch({ eventKind: 'subagent.spawned', sessionKey: 'agent:maestro:cron:333', timestamp: ts(), childSessionKey: 'agent:worker:sub:666', agentId: 'worker', label: 'worker-3-ui' });
  dispatch({ eventKind: 'session.created', sessionKey: 'agent:worker:sub:666', parentSessionKey: 'agent:maestro:cron:333', timestamp: ts(), model: 'github-copilot/claude-haiku-4.5', channel: 'subagent', label: 'worker-3 — UI components' });
  dispatch({ eventKind: 'run.started', sessionKey: 'agent:worker:sub:666', timestamp: ts(), runId: 'run-worker-3', taskSummary: 'Build ForecastCard + SearchBar components' });
  await delay(700);

  dispatch({ eventKind: 'tool.started', sessionKey: 'agent:worker:sub:666', timestamp: ts(), toolName: 'exec', argsSummary: 'npm run typecheck' });
  await delay(900);
  dispatch({ eventKind: 'tool.completed', sessionKey: 'agent:worker:sub:666', timestamp: ts(), toolName: 'exec', resultSummary: '✗ Error: Type WeatherData missing "hourly" field (api.ts line 14)', isError: true });

  dispatch({ eventKind: 'tool.started', sessionKey: 'agent:worker:sub:666', timestamp: ts(), toolName: 'edit', argsSummary: 'src/api/weather.ts — add hourly field to type' });
  await delay(500);
  dispatch({ eventKind: 'tool.completed', sessionKey: 'agent:worker:sub:666', timestamp: ts(), toolName: 'edit', resultSummary: '✓ Fixed. Type extended with hourly: HourlyData[]', isError: false });

  dispatch({ eventKind: 'tool.started', sessionKey: 'agent:worker:sub:666', timestamp: ts(), toolName: 'write', argsSummary: 'src/components/ForecastCard.tsx' });
  await delay(800);
  dispatch({ eventKind: 'tool.completed', sessionKey: 'agent:worker:sub:666', timestamp: ts(), toolName: 'write', resultSummary: '✓ Written: ForecastCard with temp + icon + wind', isError: false });

  dispatch({ eventKind: 'run.completed', sessionKey: 'agent:worker:sub:666', timestamp: ts(), runId: 'run-worker-3', tokenCounts: { inputTokens: 2100, outputTokens: 490, totalTokens: 2590, estimatedCostUsd: 0.003 } });
  dispatch({ eventKind: 'session.destroyed', sessionKey: 'agent:worker:sub:666', timestamp: ts() });
  await delay(1200);

  // ── Step 7: All done, Maestro wraps up ─────────────────────────────────────
  dispatch({ eventKind: 'tool.started', sessionKey: 'agent:maestro:cron:333', timestamp: ts(), toolName: 'exec', argsSummary: 'mcporter notion-update-page — Status: Done, Result: weather app complete' });
  await delay(500);
  dispatch({ eventKind: 'tool.completed', sessionKey: 'agent:maestro:cron:333', timestamp: ts(), toolName: 'exec', resultSummary: '✓ Ticket marked Done', isError: false });

  dispatch({ eventKind: 'run.completed', sessionKey: 'agent:maestro:cron:333', timestamp: ts(), runId: 'run-maestro-1', tokenCounts: { inputTokens: 3100, outputTokens: 420, totalTokens: 3520, estimatedCostUsd: 0.006 } });
  dispatch({ eventKind: 'session.destroyed', sessionKey: 'agent:maestro:cron:333', timestamp: ts() });

  console.log('🎬 Demo complete! Total simulated cost: ~$0.030');
}
