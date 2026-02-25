/**
 * <oc-resource-bar> — top bar showing aggregate agent metrics.
 *
 * Displays:
 *  - Total active sessions count
 *  - Tokens this hour (rolling window)
 *  - Active tool calls
 *  - Error count
 *  - Connection status widget
 */

import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { WsEventController } from '../services/ws-reactive-controller.js';
import type { ResourceMetrics } from '../types/ui-state.js';
import type { ActivityEvent } from '../types/gateway-events.js';
import './oc-ws-status.js';

@customElement('oc-resource-bar')
export class OcResourceBar extends LitElement {
  @property({ type: Object }) metrics: ResourceMetrics = {
    activeSessions: 0,
    tokensThisHour: 0,
    activeToolCalls: 0,
    errorCount: 0,
    lastUpdated: new Date().toISOString(),
  };

  /** Locally accumulated deltas for tool calls (for instant feedback) */
  @state() private localActiveToolCalls = 0;
  @state() private localErrorCount = 0;
  @state() private localSessionCount = 0;
  @state() private localTokensThisHour = 0;

  // Reset token window each hour
  private tokenWindowStart = Date.now();

  private readonly wsCtrl = new WsEventController(
    this,
    ['session.created', 'session.destroyed', 'run.completed', 'run.aborted',
     'tool.started', 'tool.completed'],
    (event) => this.handleMetricEvent(event as ActivityEvent)
  );

  static override styles = css`
    :host {
      display: flex;
      align-items: center;
      gap: var(--oc-space-md, 16px);
      padding: 0 var(--oc-space-md, 16px);
      height: 48px;
      background: var(--oc-color-bg-secondary, #f9fafb);
      border-bottom: 1px solid var(--oc-color-border, #e5e7eb);
      font-family: var(--oc-font-sans, sans-serif);
      font-size: var(--oc-font-size-sm, 0.875rem);
      flex-shrink: 0;
    }

    .brand {
      font-weight: var(--oc-font-weight-bold, 700);
      color: var(--oc-color-accent, #6366f1);
      letter-spacing: -0.02em;
      margin-right: var(--oc-space-sm, 8px);
      white-space: nowrap;
    }

    .metrics {
      display: flex;
      gap: var(--oc-space-md, 16px);
      flex: 1;
      flex-wrap: wrap;
    }

    .metric {
      display: flex;
      align-items: center;
      gap: var(--oc-space-xs, 4px);
      color: var(--oc-color-text-muted, #6b7280);
      white-space: nowrap;
    }

    .metric-value {
      font-weight: var(--oc-font-weight-semibold, 600);
      color: var(--oc-color-text-primary, #111827);
    }

    .metric-value.error {
      color: var(--oc-color-error, #ef4444);
    }

    .metric-value.active {
      color: var(--oc-color-running, #22c55e);
    }

    .divider {
      width: 1px;
      height: 20px;
      background: var(--oc-color-border, #e5e7eb);
      flex-shrink: 0;
    }

    oc-ws-status {
      margin-left: auto;
      flex-shrink: 0;
    }

    /* Responsive: hide less important metrics on narrow screens */
    @media (max-width: 600px) {
      .hide-sm { display: none; }
    }
  `;

  private handleMetricEvent(event: ActivityEvent): void {
    // Reset hourly token window if needed
    if (Date.now() - this.tokenWindowStart > 3_600_000) {
      this.tokenWindowStart = Date.now();
      this.localTokensThisHour = 0;
    }

    switch (event.eventKind) {
      case 'session.created':
        this.localSessionCount++;
        break;
      case 'session.destroyed':
        this.localSessionCount = Math.max(0, this.localSessionCount - 1);
        break;
      case 'tool.started':
        this.localActiveToolCalls++;
        break;
      case 'tool.completed':
        this.localActiveToolCalls = Math.max(0, this.localActiveToolCalls - 1);
        if (!(event as { success?: boolean }).success) {
          this.localErrorCount++;
        }
        break;
      case 'run.completed': {
        const tc = (event as { tokenCounts?: { totalTokens?: number } }).tokenCounts;
        if (tc?.totalTokens) {
          this.localTokensThisHour += tc.totalTokens;
        }
        break;
      }
      case 'run.aborted':
        this.localErrorCount++;
        break;
    }
  }

  override render() {
    // Prefer local real-time values over stale prop metrics
    const sessions = this.localSessionCount || this.metrics.activeSessions;
    const tokens = this.localTokensThisHour || this.metrics.tokensThisHour;
    const toolCalls = this.localActiveToolCalls || this.metrics.activeToolCalls;
    const errors = this.localErrorCount || this.metrics.errorCount;

    return html`
      <span class="brand">⚡ OpenClaw</span>
      <div class="metrics" role="status" aria-label="Resource metrics">
        <span class="metric">
          <span>Sessions</span>
          <span class="metric-value ${sessions > 0 ? 'active' : ''}" aria-label="${sessions} active sessions">
            ${sessions}
          </span>
        </span>
        <span class="divider" aria-hidden="true"></span>
        <span class="metric hide-sm">
          <span>Tokens/hr</span>
          <span class="metric-value" aria-label="${tokens.toLocaleString()} tokens this hour">
            ${tokens >= 1000 ? `${(tokens / 1000).toFixed(1)}k` : tokens}
          </span>
        </span>
        <span class="divider hide-sm" aria-hidden="true"></span>
        <span class="metric">
          <span>Tools</span>
          <span class="metric-value ${toolCalls > 0 ? 'active' : ''}" aria-label="${toolCalls} active tool calls">
            ${toolCalls}
          </span>
        </span>
        <span class="divider" aria-hidden="true"></span>
        <span class="metric">
          <span>Errors</span>
          <span class="metric-value ${errors > 0 ? 'error' : ''}" aria-label="${errors} errors">
            ${errors}
          </span>
        </span>
      </div>
      <oc-ws-status></oc-ws-status>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'oc-resource-bar': OcResourceBar;
  }
}
