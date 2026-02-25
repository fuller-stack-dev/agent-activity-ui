/**
 * <oc-activity-feed> — real-time scrolling feed of all agent events.
 *
 * Features:
 *  - Real-time event cards: tool calls, completions, errors, spawns
 *  - Filters: by session, event type, model
 *  - Virtual scrolling (windowed rendering for 100+ events)
 *  - Timestamp + relative time display
 *  - Color-coded events with smooth entry transitions
 *  - "Pause feed" toggle to freeze scrolling for inspection
 */

import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { WsEventController } from '../services/ws-reactive-controller.js';
import { batchDebounce } from '../utils/throttle.js';
import type { ActivityEventCard, UiFilter } from '../types/ui-state.js';
import type { ActivityEvent } from '../types/gateway-events.js';

const MAX_EVENTS = 500;
const VIRTUAL_WINDOW = 80;   // Render at most 80 items at once
const BATCH_MS = 200;        // Batch incoming events at 200ms

let cardCounter = 0;

function eventToCard(event: ActivityEvent): ActivityEventCard {
  cardCounter++;
  const color = getEventColor(event.eventKind);
  const label = getEventLabel(event);
  const detail = getEventDetail(event);

  return {
    id: `card-${cardCounter}-${Date.now()}`,
    sessionKey: event.sessionKey,
    eventKind: event.eventKind,
    timestamp: event.timestamp,
    label,
    detail,
    color,
  };
}

function getEventColor(kind: string): ActivityEventCard['color'] {
  if (kind.startsWith('tool.'))       return 'blue';
  if (kind.startsWith('run.'))        return 'green';
  if (kind.startsWith('session.'))    return 'purple';
  if (kind.startsWith('subagent.'))   return 'amber';
  if (kind.includes('error') || kind.includes('abort')) return 'red';
  return 'grey';
}

function getEventLabel(event: ActivityEvent): string {
  switch (event.eventKind) {
    case 'session.created':   return '🟢 Session created';
    case 'session.destroyed': return '⚫ Session ended';
    case 'run.started':       return '▶ Run started';
    case 'run.completed':     return '✅ Run completed';
    case 'run.aborted':       return '🛑 Run aborted';
    case 'tool.started':      return `🔧 ${(event as { toolName?: string }).toolName ?? 'Tool'} started`;
    case 'tool.completed':    return `✔ ${(event as { toolName?: string }).toolName ?? 'Tool'} done`;
    case 'subagent.spawned':  return '🤖 Sub-agent spawned';
    case 'subagent.completed':return '🏁 Sub-agent completed';
    default:                  return event.eventKind;
  }
}

function getEventDetail(event: ActivityEvent): string {
  switch (event.eventKind) {
    case 'run.started':
      return `Model: ${(event as { model?: string }).model ?? '?'}${(event as { taskSummary?: string }).taskSummary ? ` — ${(event as { taskSummary?: string }).taskSummary}` : ''}`;
    case 'run.completed': {
      const tc = (event as { tokenCounts?: { totalTokens?: number } }).tokenCounts;
      return tc ? `${tc.totalTokens?.toLocaleString() ?? 0} tokens · ${(event as { durationMs?: number }).durationMs ?? 0}ms` : '';
    }
    case 'run.aborted':
      return (event as { reason?: string }).reason ?? '';
    case 'tool.started':
      return (event as { argsSummary?: string }).argsSummary ?? '';
    case 'tool.completed':
      return `${(event as { durationMs?: number }).durationMs ?? 0}ms — ${(event as { resultSummary?: string }).resultSummary ?? ''}`;
    case 'subagent.spawned':
      return `Child: ${(event as { childSessionKey?: string }).childSessionKey ?? '?'}${(event as { label?: string }).label ? ` (${(event as { label?: string }).label})` : ''}`;
    default:
      return '';
  }
}

function formatRelativeTime(isoTimestamp: string): string {
  const diff = Date.now() - new Date(isoTimestamp).getTime();
  if (diff < 1000)   return 'just now';
  if (diff < 60000)  return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

@customElement('oc-activity-feed')
export class OcActivityFeed extends LitElement {
  @property({ type: Object }) filter: UiFilter = {
    sessionKeys: [],
    eventKinds: [],
    models: [],
    showErrors: true,
    pauseFeed: false,
  };

  @state() private allCards: ActivityEventCard[] = [];
  @state() private scrollOffset = 0;

  @query('.feed-list') private feedListEl?: HTMLElement;

  private readonly batchAddCards = batchDebounce((cards: ActivityEventCard[]) => {
    if (this.filter.pauseFeed) return;

    const combined = [...this.allCards, ...cards];
    // Cap at MAX_EVENTS (drop oldest)
    this.allCards = combined.length > MAX_EVENTS
      ? combined.slice(combined.length - MAX_EVENTS)
      : combined;

    this.scrollToBottom();
  }, BATCH_MS);

  // Subscribe to all activity event kinds
  private readonly wsCtrl = new WsEventController(
    this,
    ['*'],
    (event) => {
      const card = eventToCard(event as ActivityEvent);
      if (this.passesFilter(card)) {
        this.batchAddCards(card);
      }
    }
  );

  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      font-family: var(--oc-font-sans, sans-serif);
      font-size: var(--oc-font-size-sm, 0.875rem);
      background: var(--oc-color-bg-primary, #fff);
    }

    .feed-toolbar {
      display: flex;
      align-items: center;
      gap: var(--oc-space-sm, 8px);
      padding: var(--oc-space-sm, 8px) var(--oc-space-md, 16px);
      border-bottom: 1px solid var(--oc-color-border, #e5e7eb);
      flex-wrap: wrap;
    }

    .feed-toolbar-title {
      font-weight: var(--oc-font-weight-semibold, 600);
      color: var(--oc-color-text-muted, #6b7280);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-size: var(--oc-font-size-xs, 0.75rem);
      flex: 1;
    }

    .filter-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px var(--oc-space-sm, 8px);
      border-radius: var(--oc-radius-full, 9999px);
      border: 1px solid var(--oc-color-border, #e5e7eb);
      font-size: var(--oc-font-size-xs, 0.75rem);
      cursor: pointer;
      background: var(--oc-color-bg-secondary, #f9fafb);
      color: var(--oc-color-text-secondary, #374151);
      transition: background var(--oc-transition-fast, 150ms ease);
    }

    .filter-chip:hover,
    .filter-chip.active {
      background: var(--oc-color-accent-light, #eef2ff);
      border-color: var(--oc-color-accent, #6366f1);
      color: var(--oc-color-accent, #6366f1);
    }

    .pause-btn {
      padding: 2px var(--oc-space-sm, 8px);
      border-radius: var(--oc-radius-sm, 4px);
      border: 1px solid var(--oc-color-border, #e5e7eb);
      font-size: var(--oc-font-size-xs, 0.75rem);
      cursor: pointer;
      background: var(--oc-color-bg-tertiary, #f3f4f6);
      color: var(--oc-color-text-secondary, #374151);
      transition: background var(--oc-transition-fast, 150ms ease);
    }

    .pause-btn.paused {
      background: var(--oc-color-waiting, #f59e0b);
      color: #fff;
      border-color: transparent;
    }

    .clear-btn {
      padding: 2px var(--oc-space-sm, 8px);
      border-radius: var(--oc-radius-sm, 4px);
      border: 1px solid var(--oc-color-border, #e5e7eb);
      font-size: var(--oc-font-size-xs, 0.75rem);
      cursor: pointer;
      background: transparent;
      color: var(--oc-color-text-muted, #6b7280);
    }

    .feed-list {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: var(--oc-space-xs, 4px) 0;
      scroll-behavior: smooth;
    }

    .feed-empty {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--oc-color-text-muted, #6b7280);
      font-size: var(--oc-font-size-sm, 0.875rem);
    }

    .event-card {
      display: grid;
      grid-template-columns: 4px 1fr;
      gap: 0 var(--oc-space-sm, 8px);
      padding: var(--oc-space-xs, 4px) var(--oc-space-md, 16px) var(--oc-space-xs, 4px) var(--oc-space-sm, 8px);
      border-radius: var(--oc-radius-sm, 4px);
      margin: 2px var(--oc-space-sm, 8px);
      animation: oc-slide-in var(--oc-transition-normal, 300ms) ease forwards;
      transition: background var(--oc-transition-fast, 150ms ease);
    }

    .event-card:hover {
      background: var(--oc-color-bg-secondary, #f9fafb);
    }

    .event-stripe {
      border-radius: 2px;
      grid-row: 1 / 3;
      align-self: stretch;
    }

    .stripe-green  { background: var(--oc-color-running, #22c55e); }
    .stripe-blue   { background: var(--oc-color-event-tool, #3b82f6); }
    .stripe-amber  { background: var(--oc-color-waiting, #f59e0b); }
    .stripe-red    { background: var(--oc-color-error, #ef4444); }
    .stripe-purple { background: var(--oc-color-event-chat, #8b5cf6); }
    .stripe-grey   { background: var(--oc-color-idle, #9ca3af); }

    .event-header {
      display: flex;
      align-items: baseline;
      gap: var(--oc-space-xs, 4px);
    }

    .event-label {
      font-weight: var(--oc-font-weight-medium, 500);
      color: var(--oc-color-text-primary, #111827);
      flex: 1;
    }

    .event-session {
      font-size: var(--oc-font-size-xs, 0.75rem);
      color: var(--oc-color-text-muted, #6b7280);
      font-family: var(--oc-font-mono, monospace);
    }

    .event-time {
      font-size: var(--oc-font-size-xs, 0.75rem);
      color: var(--oc-color-text-muted, #6b7280);
      flex-shrink: 0;
    }

    .event-detail {
      font-size: var(--oc-font-size-xs, 0.75rem);
      color: var(--oc-color-text-muted, #6b7280);
      font-family: var(--oc-font-mono, monospace);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    @keyframes oc-slide-in {
      from { opacity: 0; transform: translateX(8px); }
      to   { opacity: 1; transform: translateX(0); }
    }
  `;

  private passesFilter(card: ActivityEventCard): boolean {
    const f = this.filter;
    if (f.sessionKeys.length > 0 && !f.sessionKeys.includes(card.sessionKey)) return false;
    if (f.eventKinds.length > 0 && !f.eventKinds.includes(card.eventKind)) return false;
    if (!f.showErrors && card.color === 'red') return false;
    return true;
  }

  private get visibleCards(): ActivityEventCard[] {
    const filtered = this.allCards.filter((c) => this.passesFilter(c));
    // Virtual window: show only last VIRTUAL_WINDOW items for performance
    return filtered.slice(Math.max(0, filtered.length - VIRTUAL_WINDOW));
  }

  private scrollToBottom(): void {
    if (this.filter.pauseFeed) return;
    this.updateComplete.then(() => {
      const el = this.feedListEl;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  private togglePause(): void {
    this.dispatchEvent(new CustomEvent('filter-change', {
      detail: { ...this.filter, pauseFeed: !this.filter.pauseFeed },
      bubbles: true,
      composed: true,
    }));
  }

  private clearFeed(): void {
    this.allCards = [];
  }

  private renderCard(card: ActivityEventCard): TemplateResult {
    return html`
      <div class="event-card" role="listitem" aria-label="${card.label}">
        <span class="event-stripe stripe-${card.color}"></span>
        <div class="event-header">
          <span class="event-label">${card.label}</span>
          <span class="event-session">${card.sessionKey.slice(0, 8)}</span>
          <span class="event-time">${formatRelativeTime(card.timestamp)}</span>
        </div>
        ${card.detail ? html`<div class="event-detail">${card.detail}</div>` : nothing}
      </div>
    `;
  }

  override render() {
    const visible = this.visibleCards;

    return html`
      <div class="feed-toolbar">
        <span class="feed-toolbar-title">Activity Feed</span>
        <button
          class="pause-btn ${this.filter.pauseFeed ? 'paused' : ''}"
          @click="${this.togglePause}"
          aria-pressed="${this.filter.pauseFeed}"
          title="${this.filter.pauseFeed ? 'Resume feed' : 'Pause feed'}"
        >
          ${this.filter.pauseFeed ? '▶ Resume' : '⏸ Pause'}
        </button>
        <button class="clear-btn" @click="${this.clearFeed}" title="Clear feed">
          Clear
        </button>
      </div>
      <div
        class="feed-list"
        role="list"
        aria-label="Agent activity feed"
        aria-live="polite"
        aria-atomic="false"
      >
        ${visible.length === 0
          ? html`<div class="feed-empty">No events yet — waiting for activity…</div>`
          : repeat(visible, (c) => c.id, (c) => this.renderCard(c))
        }
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'oc-activity-feed': OcActivityFeed;
  }
}
