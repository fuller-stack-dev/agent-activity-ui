/**
 * Session lifecycle hooks — called by the OpenClaw runtime to emit
 * structured activity events into the ActivitySubscriptionManager.
 *
 * Wire these hooks into the appropriate Gateway integration points:
 *   - Session create/destroy: session manager
 *   - Run start/end: model runner
 *   - Tool call start/end: tool executor
 *   - Sub-agent spawn/complete: sessions_spawn handler
 */

import type { TokenCounts } from '../types/gateway-events.js';
import { activityManager } from './gateway-ws-server.js';
import { lineageMap } from './session-lineage.js';

/** Truncate a value to a summary string safe for the wire */
function toSummary(value: unknown, maxLen = 500): string {
  const str =
    typeof value === 'string' ? value : JSON.stringify(value, null, 0);
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '…[truncated]';
}

// ─── Session Lifecycle ───────────────────────────────────────────────────────

/**
 * Emit a `session.created` event and register lineage.
 */
export function emitSessionCreated(session: {
  sessionKey: string;
  model: string;
  channel: string;
  label?: string;
  parentSessionKey?: string;
}): void {
  lineageMap.registerSession(session.sessionKey, session.parentSessionKey);
  activityManager.updateSessionDetail(session.sessionKey, {
    model: session.model,
    channel: session.channel,
    label: session.label,
    status: 'idle',
    createdAt: new Date().toISOString(),
    parentSessionKey: session.parentSessionKey,
    childSessionKeys: [],
    recentToolCalls: [],
    tokenAccumulator: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
  });
  activityManager.broadcastActivityEvent({
    eventKind: 'session.created',
    sessionKey: session.sessionKey,
    timestamp: new Date().toISOString(),
    model: session.model,
    channel: session.channel,
    label: session.label,
    parentSessionKey: session.parentSessionKey,
  });
}

/**
 * Emit a `session.destroyed` event and clean up lineage.
 */
export function emitSessionDestroyed(
  sessionKey: string,
  reason?: 'completed' | 'aborted' | 'error' | 'timeout'
): void {
  activityManager.broadcastActivityEvent({
    eventKind: 'session.destroyed',
    sessionKey,
    timestamp: new Date().toISOString(),
    reason,
  });
  activityManager.removeSessionDetail(sessionKey);
  lineageMap.removeSession(sessionKey);
}

// ─── Run Lifecycle ───────────────────────────────────────────────────────────

/**
 * Emit a `run.started` event and update session status to 'running'.
 */
export function emitRunStarted(
  sessionKey: string,
  runId: string,
  model: string,
  taskSummary?: string
): void {
  activityManager.updateSessionDetail(sessionKey, {
    status: 'running',
    currentRunId: runId,
    taskSummary,
  });
  activityManager.broadcastActivityEvent({
    eventKind: 'run.started',
    sessionKey,
    timestamp: new Date().toISOString(),
    runId,
    model,
    taskSummary,
  });
}

/**
 * Emit a `run.completed` event, update token accumulator, and set status to 'idle'.
 */
export function emitRunCompleted(
  sessionKey: string,
  runId: string,
  tokenCounts: TokenCounts,
  durationMs: number
): void {
  const detail = activityManager.handleSessionsDetailRPC(sessionKey).detail;
  const acc = detail.tokenAccumulator;
  activityManager.updateSessionDetail(sessionKey, {
    status: 'idle',
    currentRunId: undefined,
    tokenAccumulator: {
      inputTokens: acc.inputTokens + tokenCounts.inputTokens,
      outputTokens: acc.outputTokens + tokenCounts.outputTokens,
      totalTokens: acc.totalTokens + tokenCounts.totalTokens,
      estimatedCostUsd:
        (acc.estimatedCostUsd ?? 0) + (tokenCounts.estimatedCostUsd ?? 0),
    },
  });
  activityManager.broadcastActivityEvent({
    eventKind: 'run.completed',
    sessionKey,
    timestamp: new Date().toISOString(),
    runId,
    tokenCounts,
    durationMs,
  });
}

/**
 * Emit a `run.aborted` event and set session status to 'error'.
 */
export function emitRunAborted(
  sessionKey: string,
  runId: string,
  reason: string,
  tokenCounts?: TokenCounts
): void {
  activityManager.updateSessionDetail(sessionKey, {
    status: 'error',
    currentRunId: undefined,
  });
  activityManager.broadcastActivityEvent({
    eventKind: 'run.aborted',
    sessionKey,
    timestamp: new Date().toISOString(),
    runId,
    reason,
    tokenCounts,
  });
}

// ─── Tool Call Lifecycle ─────────────────────────────────────────────────────

/**
 * Emit a `tool.started` event.
 */
export function emitToolCallStarted(
  sessionKey: string,
  runId: string,
  toolName: string,
  toolCallId: string,
  args: unknown
): void {
  const argsSummary = toSummary(args);
  // Append to recent tool calls in detail store
  const detail = activityManager.handleSessionsDetailRPC(sessionKey).detail;
  const toolCalls = [...detail.recentToolCalls];
  toolCalls.push({
    toolCallId,
    toolName,
    startedAt: new Date().toISOString(),
    argsSummary,
  });
  // Keep only last 50
  activityManager.updateSessionDetail(sessionKey, {
    recentToolCalls: toolCalls.slice(-50),
  });
  activityManager.broadcastActivityEvent({
    eventKind: 'tool.started',
    sessionKey,
    timestamp: new Date().toISOString(),
    runId,
    toolCallId,
    toolName,
    argsSummary,
  });
}

/**
 * Emit a `tool.completed` event.
 */
export function emitToolCallCompleted(
  sessionKey: string,
  runId: string,
  toolName: string,
  toolCallId: string,
  durationMs: number,
  result: unknown,
  success = true
): void {
  const resultSummary = toSummary(result);
  const completedAt = new Date().toISOString();
  // Update the matching tool call record
  const detail = activityManager.handleSessionsDetailRPC(sessionKey).detail;
  const toolCalls = detail.recentToolCalls.map((tc) =>
    tc.toolCallId === toolCallId
      ? { ...tc, completedAt, durationMs, resultSummary, success }
      : tc
  );
  activityManager.updateSessionDetail(sessionKey, { recentToolCalls: toolCalls });
  activityManager.broadcastActivityEvent({
    eventKind: 'tool.completed',
    sessionKey,
    timestamp: completedAt,
    runId,
    toolCallId,
    toolName,
    durationMs,
    resultSummary,
    success,
  });
}

// ─── Sub-Agent Lifecycle ─────────────────────────────────────────────────────

/**
 * Emit a `subagent.spawned` event and register the parent→child relationship.
 */
export function emitSubAgentSpawned(
  parentSessionKey: string,
  childSessionKey: string,
  label?: string,
  agentId?: string,
  mode?: 'run' | 'session'
): void {
  lineageMap.registerSession(childSessionKey, parentSessionKey);
  // Update parent's child list
  const parentDetail = activityManager.handleSessionsDetailRPC(parentSessionKey).detail;
  const childKeys = [...new Set([...parentDetail.childSessionKeys, childSessionKey])];
  activityManager.updateSessionDetail(parentSessionKey, {
    childSessionKeys: childKeys,
  });
  activityManager.broadcastActivityEvent({
    eventKind: 'subagent.spawned',
    sessionKey: parentSessionKey,
    timestamp: new Date().toISOString(),
    parentSessionKey,
    childSessionKey,
    label,
    agentId,
    mode,
  });
}

/**
 * Emit a `subagent.completed` event.
 */
export function emitSubAgentCompleted(
  parentSessionKey: string,
  childSessionKey: string,
  status: 'success' | 'error' | 'aborted',
  durationMs?: number
): void {
  activityManager.broadcastActivityEvent({
    eventKind: 'subagent.completed',
    sessionKey: parentSessionKey,
    timestamp: new Date().toISOString(),
    parentSessionKey,
    childSessionKey,
    status,
    durationMs,
  });
}
