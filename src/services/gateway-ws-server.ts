/**
 * ActivitySubscriptionManager — server-side Gateway WS handler for
 * the `sessions.activity` subscription and `sessions.detail` RPC.
 *
 * In a real Gateway integration this would be wired into the WS
 * message router. Here it is implemented as a standalone manager
 * that can be imported and called by lifecycle hooks.
 */

import type {
  ActivityEvent,
  ActivityEventFilter,
  SessionDetail,
  SessionsDetailResponse,
} from '../types/gateway-events.js';
import { matchesFilter } from './activity-filter.js';

interface ClientSubscription {
  clientId: string;
  filter: ActivityEventFilter;
  /** Bounded event buffer for rate-limiting; max 50 events/sec window */
  eventBuffer: ActivityEvent[];
  lastFlushTime: number;
}

interface SessionDetailStore {
  [sessionKey: string]: SessionDetail;
}

/**
 * Manages which clients are subscribed to the `sessions.activity` stream
 * and handles server-side event filtering + rate limiting.
 */
export class ActivitySubscriptionManager {
  /** Map: clientId → ClientSubscription */
  private readonly subscriptions = new Map<string, ClientSubscription>();
  /** In-memory session detail store (populated by lifecycle hooks) */
  private readonly sessionDetails: SessionDetailStore = {};
  /** Transport send callback injected at boot time */
  private sendToClient?: (clientId: string, event: ActivityEvent) => void;

  private static readonly MAX_EVENTS_PER_WINDOW = 50;
  private static readonly RATE_WINDOW_MS = 1000;

  /**
   * Inject the transport-level send function so this manager can
   * deliver events without depending on a concrete WS library.
   */
  setSendCallback(fn: (clientId: string, event: ActivityEvent) => void): void {
    this.sendToClient = fn;
  }

  /**
   * Subscribe a client to the activity stream with an optional filter.
   *
   * @param clientId Unique identifier for the connected WS client
   * @param filter   Optional event filter (default: receive all events)
   */
  subscribeToActivity(
    clientId: string,
    filter: ActivityEventFilter = {}
  ): void {
    this.subscriptions.set(clientId, {
      clientId,
      filter,
      eventBuffer: [],
      lastFlushTime: Date.now(),
    });
  }

  /**
   * Remove a client's subscription.
   */
  unsubscribeFromActivity(clientId: string): void {
    this.subscriptions.delete(clientId);
  }

  /**
   * Broadcast an activity event to all subscribed clients.
   * Applies per-client event filtering and rate limiting (50 events/sec).
   *
   * @param event The activity event to broadcast
   */
  broadcastActivityEvent(event: ActivityEvent): void {
    for (const [clientId, sub] of this.subscriptions) {
      // Server-side event filter check
      if (!matchesFilter(event, sub.filter)) continue;

      const now = Date.now();
      const windowElapsed = now - sub.lastFlushTime;

      if (windowElapsed >= ActivitySubscriptionManager.RATE_WINDOW_MS) {
        // New window: flush buffer then deliver current event
        sub.eventBuffer = [];
        sub.lastFlushTime = now;
      }

      if (
        sub.eventBuffer.length >=
        ActivitySubscriptionManager.MAX_EVENTS_PER_WINDOW
      ) {
        // Drop oldest to make room (ring-buffer behaviour)
        sub.eventBuffer.shift();
      }

      sub.eventBuffer.push(event);

      // Deliver immediately
      if (this.sendToClient) {
        this.sendToClient(clientId, event);
      }
    }
  }

  /**
   * Handle the `sessions.detail` RPC — returns full session state.
   *
   * @param sessionKey The session to fetch
   */
  handleSessionsDetailRPC(sessionKey: string): SessionsDetailResponse {
    const detail =
      this.sessionDetails[sessionKey] ??
      this.createEmptySessionDetail(sessionKey);

    return {
      sessionKey,
      detail,
      fetchedAt: new Date().toISOString(),
    };
  }

  /**
   * Update (upsert) a session detail record — called by lifecycle hooks.
   */
  updateSessionDetail(sessionKey: string, patch: Partial<SessionDetail>): void {
    const existing = this.sessionDetails[sessionKey];
    if (existing) {
      Object.assign(existing, patch);
    } else {
      this.sessionDetails[sessionKey] = {
        ...this.createEmptySessionDetail(sessionKey),
        ...patch,
      };
    }
  }

  /**
   * Remove a session detail record on destroy.
   */
  removeSessionDetail(sessionKey: string): void {
    delete this.sessionDetails[sessionKey];
  }

  /**
   * Returns all currently subscribed client IDs.
   */
  getSubscribedClients(): string[] {
    return [...this.subscriptions.keys()];
  }

  /** Number of active subscriptions */
  get subscriptionCount(): number {
    return this.subscriptions.size;
  }

  private createEmptySessionDetail(sessionKey: string): SessionDetail {
    return {
      sessionKey,
      model: 'unknown',
      channel: 'unknown',
      status: 'idle',
      createdAt: new Date().toISOString(),
      childSessionKeys: [],
      recentToolCalls: [],
      tokenAccumulator: {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
      },
    };
  }
}

// Singleton instance
export const activityManager = new ActivitySubscriptionManager();
