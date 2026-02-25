/**
 * Gateway WebSocket event schema for sessions.activity stream.
 * All events include eventKind, sessionKey, and timestamp (ISO 8601).
 */

// ─── Base ────────────────────────────────────────────────────────────────────

export interface BaseActivityEvent {
  /** Discriminant for the event type */
  eventKind: ActivityEventKind;
  /** The session this event belongs to */
  sessionKey: string;
  /** ISO 8601 timestamp */
  timestamp: string;
}

// ─── Session Lifecycle ───────────────────────────────────────────────────────

export interface SessionCreatedEvent extends BaseActivityEvent {
  eventKind: 'session.created';
  model: string;
  channel: string;
  label?: string;
  parentSessionKey?: string;
}

export interface SessionDestroyedEvent extends BaseActivityEvent {
  eventKind: 'session.destroyed';
  reason?: 'completed' | 'aborted' | 'error' | 'timeout';
}

// ─── Run Lifecycle ───────────────────────────────────────────────────────────

export interface TokenCounts {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  totalTokens: number;
  estimatedCostUsd?: number;
}

export interface RunStartedEvent extends BaseActivityEvent {
  eventKind: 'run.started';
  runId: string;
  model: string;
  taskSummary?: string;
}

export interface RunCompletedEvent extends BaseActivityEvent {
  eventKind: 'run.completed';
  runId: string;
  tokenCounts: TokenCounts;
  durationMs: number;
}

export interface RunAbortedEvent extends BaseActivityEvent {
  eventKind: 'run.aborted';
  runId: string;
  reason: string;
  tokenCounts?: TokenCounts;
}

// ─── Tool Call Lifecycle ─────────────────────────────────────────────────────

export interface ToolCallStartedEvent extends BaseActivityEvent {
  eventKind: 'tool.started';
  runId: string;
  toolCallId: string;
  toolName: string;
  /** Args truncated to 500 chars */
  argsSummary: string;
}

export interface ToolCallCompletedEvent extends BaseActivityEvent {
  eventKind: 'tool.completed';
  runId: string;
  toolCallId: string;
  toolName: string;
  durationMs: number;
  /** Result truncated to 500 chars */
  resultSummary: string;
  success: boolean;
}

// ─── Sub-Agent Lifecycle ─────────────────────────────────────────────────────

export interface SubAgentSpawnedEvent extends BaseActivityEvent {
  eventKind: 'subagent.spawned';
  /** sessionKey of the parent that spawned this sub-agent */
  parentSessionKey: string;
  /** sessionKey of the newly spawned child */
  childSessionKey: string;
  label?: string;
  agentId?: string;
  mode?: 'run' | 'session';
}

export interface SubAgentCompletedEvent extends BaseActivityEvent {
  eventKind: 'subagent.completed';
  parentSessionKey: string;
  childSessionKey: string;
  status: 'success' | 'error' | 'aborted';
  durationMs?: number;
}

// ─── Union & Discriminated Union ─────────────────────────────────────────────

export type ActivityEventKind =
  | 'session.created'
  | 'session.destroyed'
  | 'run.started'
  | 'run.completed'
  | 'run.aborted'
  | 'tool.started'
  | 'tool.completed'
  | 'subagent.spawned'
  | 'subagent.completed';

export type ActivityEvent =
  | SessionCreatedEvent
  | SessionDestroyedEvent
  | RunStartedEvent
  | RunCompletedEvent
  | RunAbortedEvent
  | ToolCallStartedEvent
  | ToolCallCompletedEvent
  | SubAgentSpawnedEvent
  | SubAgentCompletedEvent;

// ─── Filter ──────────────────────────────────────────────────────────────────

export interface ActivityEventFilter {
  /** Only emit these event kinds. Omit to receive all. */
  kinds?: ActivityEventKind[];
  /** Only emit events for these session keys. Omit to receive all sessions. */
  sessionKeys?: string[];
  /** Exclude events for these session keys. */
  excludeSessionKeys?: string[];
}

// ─── RPC: sessions.detail ────────────────────────────────────────────────────

export interface ToolCallRecord {
  toolCallId: string;
  toolName: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  argsSummary: string;
  resultSummary?: string;
  success?: boolean;
}

export interface SessionDetail {
  sessionKey: string;
  label?: string;
  model: string;
  channel: string;
  status: 'idle' | 'running' | 'error' | 'waiting';
  createdAt: string;
  parentSessionKey?: string;
  childSessionKeys: string[];
  currentRunId?: string;
  taskSummary?: string;
  /** Up to 50 most recent tool calls */
  recentToolCalls: ToolCallRecord[];
  tokenAccumulator: TokenCounts;
  /** Streaming output buffer — last 2000 chars */
  streamingOutput?: string;
}

export interface SessionsDetailResponse {
  sessionKey: string;
  detail: SessionDetail;
  fetchedAt: string;
}
