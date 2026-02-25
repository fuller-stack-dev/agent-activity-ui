import { runDemoScenario } from './demo/demo-scenario.js';
/**
 * <oc-agents-view> — the main "Agents" panel that integrates all sub-components.
 *
 * Layout:
 *  ┌─────────────────────────────────────────────┐
 *  │  <oc-resource-bar>  (top bar)                │
 *  ├──────────────┬──────────────────────────────┤
 *  │              │                              │
 *  │  Agent Tree  │  Activity Feed               │
 *  │  (left pane) │  (center pane)               │
 *  │              │                              │
 *  ├──────────────┴──────────────────────────────┤
 *  │  Session Detail Panel (slide-in, right)      │
 *  └─────────────────────────────────────────────┘
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { WsService } from './services/ws-service.js';
import { WsEventController } from './services/ws-reactive-controller.js';
import type { SessionSummary, ToolCallRecord, UiFilter, ResourceMetrics } from './types/ui-state.js';
import type { ActivityEvent } from './types/gateway-events.js';
import { defaultUiFilter } from './types/ui-state.js';

// Import all components
import './components/oc-resource-bar.js';
import './components/oc-agent-tree.js';
import './components/oc-activity-feed.js';
import './components/oc-session-detail.js';
import './components/oc-ws-status.js';

const GATEWAY_WS_URL = (window as Window & { OPENCLAW_GATEWAY_WS?: string }).OPENCLAW_GATEWAY_WS
  ?? 'ws://localhost:4000';

@customElement('oc-agents-view')
export class OcAgentsView extends LitElement {
  @state() private sessions: SessionSummary[] = [];
  @state() private selectedSessionKey = '';
  @state() private filter: UiFilter = defaultUiFilter();
  @state() private metrics: ResourceMetrics = {
    activeSessions: 0,
    tokensThisHour: 0,
    activeToolCalls: 0,
    errorCount: 0,
    lastUpdated: new Date().toISOString(),
  };

  private readonly sessionMap = new Map<string, SessionSummary>();

  private readonly wsCtrl = new WsEventController(
    this,
    ['session.created', 'session.destroyed', 'run.started', 'run.completed',
     'run.aborted', 'tool.started', 'tool.completed', 'subagent.spawned', 'subagent.completed'],
    (event) => this.handleGatewayEvent(event as ActivityEvent)
  );

  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
      background: var(--oc-color-bg-primary, #fff);
    }

    .main-layout {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .left-pane {
      width: 260px;
      flex-shrink: 0;
      border-right: 1px solid var(--oc-color-border, #e5e7eb);
      overflow-y: auto;
    }

    .center-pane {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .right-pane {
      width: 360px;
      flex-shrink: 0;
      border-left: 1px solid var(--oc-color-border, #e5e7eb);
      overflow-y: auto;
      transition: width var(--oc-transition-normal, 300ms ease),
                  opacity var(--oc-transition-normal, 300ms ease);
    }

    .right-pane.collapsed {
      width: 0;
      opacity: 0;
      overflow: hidden;
    }

    /* Responsive: single column on narrow screens */
    @media (max-width: 768px) {
      .main-layout { flex-direction: column; }
      .left-pane { width: 100%; height: 200px; border-right: none; border-bottom: 1px solid var(--oc-color-border, #e5e7eb); }
      .right-pane { width: 100%; border-left: none; border-top: 1px solid var(--oc-color-border, #e5e7eb); }
      .right-pane.collapsed { height: 0; width: 100%; }
    }
  `;

  override connectedCallback(): void {
    super.connectedCallback();

    const isDemo = new URLSearchParams(window.location.search).has('demo')
      || window.location.hostname === 'localhost';

    if (isDemo) {
      // Demo mode: inject fake events directly, no real gateway needed
      setTimeout(() => runDemoScenario(), 800);
    } else {
      WsService.getInstance().connect(GATEWAY_WS_URL);
      WsService.getInstance().send({ type: 'sessions.list' });
    }
  }

  private handleGatewayEvent(event: ActivityEvent): void {
    switch (event.eventKind) {
      case 'session.created':
        this.upsertSession({
          sessionKey: event.sessionKey,
          model: event.model,
          channel: event.channel,
          label: event.label,
          status: 'idle',
          createdAt: event.timestamp,
          uptimeSeconds: 0,
          parentSessionKey: event.parentSessionKey,
          childSessionKeys: [],
          tokenAccumulator: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        });
        break;
      case 'session.destroyed':
        this.removeSession(event.sessionKey);
        break;
      case 'run.started':
        this.patchSession(event.sessionKey, { status: 'running', taskSummary: event.taskSummary });
        break;
      case 'run.completed':
        this.patchSession(event.sessionKey, {
          status: 'idle',
          tokenAccumulator: this.mergeTokens(event.sessionKey, event.tokenCounts),
        });
        break;
      case 'run.aborted':
        this.patchSession(event.sessionKey, { status: 'error' });
        break;
      case 'subagent.spawned': {
        const parent = this.sessionMap.get(event.parentSessionKey);
        if (parent) {
          this.patchSession(event.parentSessionKey, {
            childSessionKeys: [...new Set([...(parent.childSessionKeys ?? []), event.childSessionKey])],
          });
        }
        break;
      }
    }

    this.updateMetrics();
  }

  private upsertSession(session: SessionSummary): void {
    this.sessionMap.set(session.sessionKey, session);
    this.sessions = [...this.sessionMap.values()];
  }

  private patchSession(sessionKey: string, patch: Partial<SessionSummary>): void {
    const existing = this.sessionMap.get(sessionKey);
    if (!existing) return;
    this.sessionMap.set(sessionKey, { ...existing, ...patch });
    this.sessions = [...this.sessionMap.values()];
  }

  private removeSession(sessionKey: string): void {
    this.sessionMap.delete(sessionKey);
    this.sessions = [...this.sessionMap.values()];
    if (this.selectedSessionKey === sessionKey) {
      this.selectedSessionKey = '';
    }
  }

  private mergeTokens(
    sessionKey: string,
    incoming: { inputTokens: number; outputTokens: number; totalTokens: number; estimatedCostUsd?: number }
  ) {
    const acc = this.sessionMap.get(sessionKey)?.tokenAccumulator ?? { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
    return {
      inputTokens: acc.inputTokens + incoming.inputTokens,
      outputTokens: acc.outputTokens + incoming.outputTokens,
      totalTokens: acc.totalTokens + incoming.totalTokens,
      estimatedCostUsd: (acc.estimatedCostUsd ?? 0) + (incoming.estimatedCostUsd ?? 0),
    };
  }

  private updateMetrics(): void {
    const active = this.sessions.filter((s) => s.status === 'running').length;
    this.metrics = {
      ...this.metrics,
      activeSessions: active,
      lastUpdated: new Date().toISOString(),
    };
  }

  private get selectedSession(): SessionSummary | null {
    return this.sessionMap.get(this.selectedSessionKey) ?? null;
  }

  private handleSessionSelected(e: CustomEvent<{ sessionKey: string }>): void {
    this.selectedSessionKey = e.detail.sessionKey;
  }

  private handleFilterChange(e: CustomEvent<UiFilter>): void {
    this.filter = e.detail;
  }

  override render() {
    return html`
      <oc-resource-bar .metrics="${this.metrics}"></oc-resource-bar>
      <div class="main-layout">
        <aside class="left-pane" aria-label="Agent tree">
          <oc-agent-tree
            .sessions="${this.sessions}"
            .selectedKey="${this.selectedSessionKey}"
            @session-selected="${this.handleSessionSelected}"
          ></oc-agent-tree>
        </aside>

        <main class="center-pane" aria-label="Activity feed">
          <oc-activity-feed
            .filter="${this.filter}"
            @filter-change="${this.handleFilterChange}"
          ></oc-activity-feed>
        </main>

        <aside
          class="right-pane ${this.selectedSessionKey ? '' : 'collapsed'}"
          aria-label="Session detail"
        >
          ${this.selectedSessionKey
            ? html`
                <oc-session-detail
                  .session="${this.selectedSession}"
                  .toolCalls="${[] as ToolCallRecord[]}"
                  @session-selected="${this.handleSessionSelected}"
                  @session-aborted="${() => { this.selectedSessionKey = ''; }}"
                ></oc-session-detail>
              `
            : nothing
          }
        </aside>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'oc-agents-view': OcAgentsView;
  }
}
