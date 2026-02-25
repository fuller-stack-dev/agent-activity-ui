/**
 * Server-side event filtering for the sessions.activity stream.
 * Clients subscribe with an ActivityEventFilter; this module checks
 * whether a given event matches that filter before broadcasting.
 */

import type {
  ActivityEvent,
  ActivityEventFilter,
  ActivityEventKind,
} from '../types/gateway-events.js';

/**
 * Check whether an activity event passes the given filter.
 *
 * @param event  The event to test
 * @param filter The client's subscription filter
 * @returns      `true` if the event should be delivered to the client
 */
export function matchesFilter(
  event: ActivityEvent,
  filter: ActivityEventFilter
): boolean {
  // Kind allowlist
  if (filter.kinds && filter.kinds.length > 0) {
    if (!filter.kinds.includes(event.eventKind as ActivityEventKind)) {
      return false;
    }
  }

  // Session key allowlist
  if (filter.sessionKeys && filter.sessionKeys.length > 0) {
    if (!filter.sessionKeys.includes(event.sessionKey)) {
      return false;
    }
  }

  // Session key blocklist
  if (filter.excludeSessionKeys && filter.excludeSessionKeys.length > 0) {
    if (filter.excludeSessionKeys.includes(event.sessionKey)) {
      return false;
    }
  }

  return true;
}

/**
 * Merge two filters with AND semantics (both must pass).
 * Useful for combining a global server filter with a per-client filter.
 */
export function mergeFilters(
  a: ActivityEventFilter,
  b: ActivityEventFilter
): ActivityEventFilter {
  const merged: ActivityEventFilter = {};

  // kinds: intersection (must appear in both if both specify)
  if (a.kinds && b.kinds) {
    merged.kinds = a.kinds.filter((k) => b.kinds!.includes(k)) as ActivityEventKind[];
  } else {
    merged.kinds = a.kinds ?? b.kinds;
  }

  // sessionKeys: intersection
  if (a.sessionKeys && b.sessionKeys) {
    merged.sessionKeys = a.sessionKeys.filter((s) => b.sessionKeys!.includes(s));
  } else {
    merged.sessionKeys = a.sessionKeys ?? b.sessionKeys;
  }

  // excludeSessionKeys: union (exclude if either says exclude)
  const excludeA = a.excludeSessionKeys ?? [];
  const excludeB = b.excludeSessionKeys ?? [];
  const allExcluded = [...new Set([...excludeA, ...excludeB])];
  if (allExcluded.length > 0) {
    merged.excludeSessionKeys = allExcluded;
  }

  return merged;
}
