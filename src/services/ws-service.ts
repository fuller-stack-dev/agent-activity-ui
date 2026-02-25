/**
 * WsService — singleton WebSocket client with auto-reconnect,
 * event subscription management, and send-queue buffering.
 *
 * Usage:
 *   const ws = WsService.getInstance();
 *   ws.connect('ws://localhost:4000');
 *   const unsub = ws.subscribe('run.started', (e) => console.log(e));
 *   // later:
 *   unsub();
 */

export type WsStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

type EventHandler = (event: unknown) => void;
type StatusChangeListener = (status: WsStatus) => void;

interface SubscriptionEntry {
  eventKind: string;
  handler: EventHandler;
}

const WS_STATUS_CHANGE_EVENT = 'ws-status-change';
const MAX_SEND_QUEUE = 100;
const BASE_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30_000;
const JITTER_FACTOR = 0.2;
const MAX_RETRIES_BEFORE_PAUSE = 5;
const PAUSE_AFTER_MAX_RETRIES_MS = 60_000;

export class WsService extends EventTarget {
  private static instance: WsService | null = null;

  private socket: WebSocket | null = null;
  private url: string | null = null;
  private status: WsStatus = 'disconnected';
  private retryCount = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private sendQueue: object[] = [];
  private subscriptions: SubscriptionEntry[] = [];

  private constructor() {
    super();
  }

  /** Get (or create) the singleton WsService instance. */
  static getInstance(): WsService {
    if (!WsService.instance) {
      WsService.instance = new WsService();
    }
    return WsService.instance;
  }

  /**
   * Connect to the Gateway WebSocket.
   * Safe to call multiple times — if already connected to the same URL, no-op.
   *
   * @param url WebSocket URL (e.g. ws://localhost:4000)
   */
  connect(url: string): void {
    if (this.socket && this.url === url && this.status === 'connected') return;
    this.url = url;
    this.retryCount = 0;
    this.openSocket();
  }

  /** Cleanly disconnect and stop reconnection attempts. */
  disconnect(): void {
    this.stopReconnect();
    if (this.socket) {
      this.socket.onclose = null; // prevent auto-reconnect on deliberate close
      this.socket.close(1000, 'disconnect');
      this.socket = null;
    }
    this.setStatus('disconnected');
  }

  /**
   * Subscribe to a specific Gateway event kind.
   *
   * @param eventKind  The event kind string (e.g. 'run.started', 'tool.completed')
   * @param handler    Called with the parsed event payload
   * @returns          Unsubscribe function — call to remove this handler
   */
  subscribe(eventKind: string, handler: EventHandler): () => void {
    const entry: SubscriptionEntry = { eventKind, handler };
    this.subscriptions.push(entry);
    return () => {
      this.subscriptions = this.subscriptions.filter((s) => s !== entry);
    };
  }

  /**
   * Subscribe to all events (any kind).
   * Useful for debugging or catch-all processors.
   */
  subscribeAll(handler: EventHandler): () => void {
    return this.subscribe('*', handler);
  }

  /**
   * Send a message to the Gateway.
   * If disconnected, queues the message and flushes on reconnect (max 100 queued).
   *
   * @param message JSON-serializable object
   */
  send(message: object): void {
    if (this.socket && this.status === 'connected') {
      this.socket.send(JSON.stringify(message));
    } else {
      if (this.sendQueue.length >= MAX_SEND_QUEUE) {
        this.sendQueue.shift(); // drop oldest
      }
      this.sendQueue.push(message);
    }
  }

  /**
   * Current connection status.
   */
  getStatus(): WsStatus {
    return this.status;
  }

  /** Add a listener for status changes. Returns a removal function. */
  onStatusChange(listener: StatusChangeListener): () => void {
    const handler = (e: Event) => {
      listener((e as CustomEvent<WsStatus>).detail);
    };
    this.addEventListener(WS_STATUS_CHANGE_EVENT, handler);
    return () => this.removeEventListener(WS_STATUS_CHANGE_EVENT, handler);
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  private openSocket(): void {
    if (!this.url) return;
    this.setStatus('connecting');

    try {
      this.socket = new WebSocket(this.url);
    } catch (err) {
      this.setStatus('error');
      this.scheduleReconnect();
      return;
    }

    this.socket.onopen = () => {
      this.retryCount = 0;
      this.setStatus('connected');
      this.flushSendQueue();
    };

    this.socket.onmessage = (event: MessageEvent) => {
      this.handleIncomingMessage(event.data);
    };

    this.socket.onerror = () => {
      this.setStatus('error');
    };

    this.socket.onclose = () => {
      this.socket = null;
      if (this.status !== 'disconnected') {
        this.scheduleReconnect();
      }
    };
  }

  private handleIncomingMessage(raw: unknown): void {
    let parsed: unknown;
    try {
      parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
      return;
    }

    if (typeof parsed !== 'object' || parsed === null) return;
    const msg = parsed as { eventKind?: string; [key: string]: unknown };
    const kind = msg.eventKind ?? '';

    for (const sub of this.subscriptions) {
      if (sub.eventKind === '*' || sub.eventKind === kind) {
        try {
          sub.handler(parsed);
        } catch {
          // Individual handler errors must not break the dispatch loop
        }
      }
    }
  }

  private flushSendQueue(): void {
    while (this.sendQueue.length > 0 && this.status === 'connected') {
      const message = this.sendQueue.shift()!;
      this.socket?.send(JSON.stringify(message));
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer !== null) return;

    if (this.retryCount >= MAX_RETRIES_BEFORE_PAUSE) {
      this.retryCount = 0;
      this.setStatus('disconnected');
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        this.openSocket();
      }, PAUSE_AFTER_MAX_RETRIES_MS);
      return;
    }

    const base = Math.min(BASE_BACKOFF_MS * 2 ** this.retryCount, MAX_BACKOFF_MS);
    const jitter = base * JITTER_FACTOR * (Math.random() * 2 - 1);
    const delay = Math.max(0, base + jitter);
    this.retryCount++;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.openSocket();
    }, delay);
  }

  private stopReconnect(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private setStatus(status: WsStatus): void {
    if (this.status === status) return;
    this.status = status;
    this.dispatchEvent(
      new CustomEvent<WsStatus>(WS_STATUS_CHANGE_EVENT, { detail: status })
    );
  }
}
