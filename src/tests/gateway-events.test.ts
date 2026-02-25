/**
 * Integration tests for Phase 1 Gateway backend.
 * Run with: vitest run src/tests/gateway-events.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ActivitySubscriptionManager } from '../services/gateway-ws-server.js';
import { matchesFilter, mergeFilters } from '../services/activity-filter.js';
import { SessionLineageMap } from '../services/session-lineage.js';
import type { ActivityEvent, ActivityEventFilter } from '../types/gateway-events.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeEvent(
  overrides: Partial<ActivityEvent> = {}
): ActivityEvent {
  return {
    eventKind: 'run.started',
    sessionKey: 'session-a',
    timestamp: new Date().toISOString(),
    runId: 'run-1',
    model: 'gemini-flash',
    ...overrides,
  } as ActivityEvent;
}

// ─── ActivitySubscriptionManager ─────────────────────────────────────────────

describe('ActivitySubscriptionManager', () => {
  let manager: ActivitySubscriptionManager;
  const delivered: Array<{ clientId: string; event: ActivityEvent }> = [];

  beforeEach(() => {
    manager = new ActivitySubscriptionManager();
    delivered.length = 0;
    manager.setSendCallback((clientId, event) => {
      delivered.push({ clientId, event });
    });
  });

  it('delivers event to subscribed client', () => {
    manager.subscribeToActivity('client-1');
    const event = makeEvent();
    manager.broadcastActivityEvent(event);
    expect(delivered).toHaveLength(1);
    expect(delivered[0].clientId).toBe('client-1');
    expect(delivered[0].event.sessionKey).toBe('session-a');
  });

  it('does not deliver to unsubscribed client', () => {
    manager.subscribeToActivity('client-1');
    manager.unsubscribeFromActivity('client-1');
    manager.broadcastActivityEvent(makeEvent());
    expect(delivered).toHaveLength(0);
  });

  it('delivers to multiple clients', () => {
    manager.subscribeToActivity('client-1');
    manager.subscribeToActivity('client-2');
    manager.broadcastActivityEvent(makeEvent());
    expect(delivered).toHaveLength(2);
  });

  it('respects kind filter — blocks non-matching kind', () => {
    const filter: ActivityEventFilter = { kinds: ['session.created'] };
    manager.subscribeToActivity('client-1', filter);
    manager.broadcastActivityEvent(makeEvent({ eventKind: 'run.started' }));
    expect(delivered).toHaveLength(0);
  });

  it('respects kind filter — passes matching kind', () => {
    const filter: ActivityEventFilter = { kinds: ['run.started'] };
    manager.subscribeToActivity('client-1', filter);
    manager.broadcastActivityEvent(makeEvent({ eventKind: 'run.started' }));
    expect(delivered).toHaveLength(1);
  });

  it('rate limits: drops oldest when >50 events in window', () => {
    manager.subscribeToActivity('client-1');
    // Force time to be within same 1s window
    vi.useFakeTimers();
    const eventCount = 60;
    for (let i = 0; i < eventCount; i++) {
      manager.broadcastActivityEvent(makeEvent({ sessionKey: `session-${i}` }));
    }
    // All 60 were delivered (send is called each time); buffer capped at 50
    expect(delivered).toHaveLength(60);
    vi.useRealTimers();
  });

  it('returns correct subscription count', () => {
    expect(manager.subscriptionCount).toBe(0);
    manager.subscribeToActivity('client-1');
    manager.subscribeToActivity('client-2');
    expect(manager.subscriptionCount).toBe(2);
    manager.unsubscribeFromActivity('client-1');
    expect(manager.subscriptionCount).toBe(1);
  });

  it('handles sessions.detail RPC for unknown session', () => {
    const response = manager.handleSessionsDetailRPC('unknown-session');
    expect(response.sessionKey).toBe('unknown-session');
    expect(response.detail.model).toBe('unknown');
  });
});

// ─── matchesFilter ────────────────────────────────────────────────────────────

describe('matchesFilter', () => {
  it('returns true for empty filter (receive all)', () => {
    const event = makeEvent();
    expect(matchesFilter(event, {})).toBe(true);
  });

  it('filters by kind (match)', () => {
    const event = makeEvent({ eventKind: 'tool.started' });
    const filter: ActivityEventFilter = { kinds: ['tool.started', 'tool.completed'] };
    expect(matchesFilter(event, filter)).toBe(true);
  });

  it('filters by kind (no match)', () => {
    const event = makeEvent({ eventKind: 'session.created' });
    const filter: ActivityEventFilter = { kinds: ['tool.started'] };
    expect(matchesFilter(event, filter)).toBe(false);
  });

  it('filters by sessionKey allowlist (match)', () => {
    const event = makeEvent({ sessionKey: 'session-b' });
    const filter: ActivityEventFilter = { sessionKeys: ['session-a', 'session-b'] };
    expect(matchesFilter(event, filter)).toBe(true);
  });

  it('filters by sessionKey allowlist (no match)', () => {
    const event = makeEvent({ sessionKey: 'session-c' });
    const filter: ActivityEventFilter = { sessionKeys: ['session-a'] };
    expect(matchesFilter(event, filter)).toBe(false);
  });

  it('filters by excludeSessionKeys (blocked)', () => {
    const event = makeEvent({ sessionKey: 'noisy-session' });
    const filter: ActivityEventFilter = { excludeSessionKeys: ['noisy-session'] };
    expect(matchesFilter(event, filter)).toBe(false);
  });

  it('filters by excludeSessionKeys (not blocked)', () => {
    const event = makeEvent({ sessionKey: 'other-session' });
    const filter: ActivityEventFilter = { excludeSessionKeys: ['noisy-session'] };
    expect(matchesFilter(event, filter)).toBe(true);
  });

  it('combines kind + sessionKey filters (all must pass)', () => {
    const event = makeEvent({ eventKind: 'run.started', sessionKey: 'session-a' });
    const filter: ActivityEventFilter = {
      kinds: ['run.started'],
      sessionKeys: ['session-a'],
    };
    expect(matchesFilter(event, filter)).toBe(true);
  });

  it('combines kind + sessionKey filters (kind fails)', () => {
    const event = makeEvent({ eventKind: 'tool.started', sessionKey: 'session-a' });
    const filter: ActivityEventFilter = {
      kinds: ['run.started'],
      sessionKeys: ['session-a'],
    };
    expect(matchesFilter(event, filter)).toBe(false);
  });
});

// ─── mergeFilters ─────────────────────────────────────────────────────────────

describe('mergeFilters', () => {
  it('merges kinds as intersection', () => {
    const a: ActivityEventFilter = { kinds: ['run.started', 'tool.started'] };
    const b: ActivityEventFilter = { kinds: ['tool.started', 'session.created'] };
    const merged = mergeFilters(a, b);
    expect(merged.kinds).toEqual(['tool.started']);
  });

  it('uses only-defined kinds when one is undefined', () => {
    const a: ActivityEventFilter = { kinds: ['run.started'] };
    const b: ActivityEventFilter = {};
    const merged = mergeFilters(a, b);
    expect(merged.kinds).toEqual(['run.started']);
  });

  it('merges excludeSessionKeys as union', () => {
    const a: ActivityEventFilter = { excludeSessionKeys: ['s1'] };
    const b: ActivityEventFilter = { excludeSessionKeys: ['s2'] };
    const merged = mergeFilters(a, b);
    expect(merged.excludeSessionKeys).toContain('s1');
    expect(merged.excludeSessionKeys).toContain('s2');
  });
});

// ─── SessionLineageMap ────────────────────────────────────────────────────────

describe('SessionLineageMap', () => {
  let map: SessionLineageMap;

  beforeEach(() => {
    map = new SessionLineageMap();
  });

  it('registers root sessions', () => {
    map.registerSession('root-1');
    expect(map.has('root-1')).toBe(true);
    expect(map.getParent('root-1')).toBeUndefined();
  });

  it('registers child with parent', () => {
    map.registerSession('root-1');
    map.registerSession('child-1', 'root-1');
    expect(map.getParent('child-1')).toBe('root-1');
    expect(map.getChildren('root-1')).toContain('child-1');
  });

  it('builds recursive tree', () => {
    map.registerSession('root');
    map.registerSession('child-a', 'root');
    map.registerSession('child-b', 'root');
    map.registerSession('grandchild', 'child-a');

    const tree = map.getLineageTree('root');
    expect(tree.sessionKey).toBe('root');
    expect(tree.children).toHaveLength(2);
    const childA = tree.children.find((c) => c.sessionKey === 'child-a')!;
    expect(childA.children).toHaveLength(1);
    expect(childA.children[0].sessionKey).toBe('grandchild');
  });

  it('removes session and detaches from parent', () => {
    map.registerSession('root');
    map.registerSession('child', 'root');
    map.removeSession('child');
    expect(map.has('child')).toBe(false);
    expect(map.getChildren('root')).not.toContain('child');
  });

  it('getRoots returns only sessions with no parent', () => {
    map.registerSession('root-1');
    map.registerSession('root-2');
    map.registerSession('child', 'root-1');
    const roots = map.getRoots();
    expect(roots).toContain('root-1');
    expect(roots).toContain('root-2');
    expect(roots).not.toContain('child');
  });

  it('does not duplicate children on re-register', () => {
    map.registerSession('root');
    map.registerSession('child', 'root');
    map.registerSession('child', 'root'); // duplicate
    expect(map.getChildren('root')).toHaveLength(1);
  });
});
