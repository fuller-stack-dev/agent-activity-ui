/**
 * Shared TypeScript interfaces for UI state.
 * These are the client-side view models derived from gateway events.
 */

// ─── Session Summary ──────────────────────────────────────────────────────────

export type SessionStatus = 'idle' | 'running' | 'error' | 'waiting';

export interface SessionSummary {
  sessionKey: string;
  label?: string;
  model: string;
  channel: string;
  status: SessionStatus;
  /** ISO timestamp of session creation */
  createdAt: string;
  /** Seconds since session creation */
  uptimeSeconds: number;
  taskSummary?: string;
  parentSessionKey?: string;
  childSessionKeys: string[];
  tokenAccumulator: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCostUsd?: number;
  };
}

// ─── Tool Call Record ─────────────────────────────────────────────────────────

export interface ToolCallRecord {
  id: string;
  sessionKey: string;
  toolName: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  /** Truncated args string */
  args: string;
  /** Truncated result string */
  result?: string;
  status: 'running' | 'success' | 'error';
}

// ─── Activity Event Card ─────────────────────────────────────────────────────

export type ActivityCardColor =
  | 'green'
  | 'blue'
  | 'amber'
  | 'red'
  | 'purple'
  | 'grey';

export interface ActivityEventCard {
  /** Unique id for virtual scroll keying */
  id: string;
  sessionKey: string;
  eventKind: string;
  timestamp: string;
  /** Short human-readable label */
  label: string;
  /** Longer detail text */
  detail: string;
  color: ActivityCardColor;
}

// ─── Resource Metrics ────────────────────────────────────────────────────────

export interface ResourceMetrics {
  activeSessions: number;
  tokensThisHour: number;
  activeToolCalls: number;
  errorCount: number;
  lastUpdated: string;
}

// ─── UI Filter ────────────────────────────────────────────────────────────────

export interface UiFilter {
  /** Only show events from these sessions. Empty = show all. */
  sessionKeys: string[];
  /** Only show these event kinds. Empty = show all. */
  eventKinds: string[];
  /** Only show sessions using these models. Empty = show all. */
  models: string[];
  showErrors: boolean;
  /** When true, the activity feed scroll is frozen */
  pauseFeed: boolean;
}

// ─── Default filter ──────────────────────────────────────────────────────────

export function defaultUiFilter(): UiFilter {
  return {
    sessionKeys: [],
    eventKinds: [],
    models: [],
    showErrors: true,
    pauseFeed: false,
  };
}
