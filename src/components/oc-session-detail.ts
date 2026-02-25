/**
 * <oc-session-detail> — slide-out detail panel for a single session.
 *
 * Features:
 *  - Live streaming output (reuses chat text display)
 *  - Tool call log with expandable args/results
 *  - Token/cost accumulator (per-session)
 *  - Action buttons: Abort, Steer, Inject
 *  - Session lineage breadcrumb (parent → current → children)
 *  - Confirmation dialog on destructive actions (Abort)
 */

import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { WsEventController } from '../services/ws-reactive-controller.js';
import { WsService } from '../services/ws-service.js';
import type { SessionSummary, ToolCallRecord } from '../types/ui-state.js';
import type { ActivityEvent } from '../types/gateway-events.js';

@customElement('oc-session-detail')
export class OcSessionDetail extends LitElement {
  @property({ type: Object }) session: SessionSummary | null = null;
  @property({ type: Array }) toolCalls: ToolCallRecord[] = [];
  @property({ type: String }) streamingOutput = '';

  @state() private expandedToolCallIds = new Set<string>();
  @state() private showAbortConfirm = false;
  @state() private steerText = '';
  @state() private injectText = '';
  @state() private showSteerInput = false;
  @state() private showInjectInput = false;

  private readonly wsCtrl = new WsEventController(
    this,
    ['run.started', 'run.completed', 'run.aborted', 'tool.started', 'tool.completed'],
    (event) => this.handleEvent(event as ActivityEvent)
  );

  static override styles = css`
    :host {
      display: block;
      font-family: var(--oc-font-sans, sans-serif);
      font-size: var(--oc-font-size-sm, 0.875rem);
      color: var(--oc-color-text-primary, #111827);
      height: 100%;
      overflow-y: auto;
      background: var(--oc-color-bg-primary, #fff);
    }

    .panel-header {
      position: sticky;
      top: 0;
      background: var(--oc-color-bg-primary, #fff);
      border-bottom: 1px solid var(--oc-color-border, #e5e7eb);
      padding: var(--oc-space-md, 16px);
      z-index: 10;
    }

    .panel-title {
      font-weight: var(--oc-font-weight-semibold, 600);
      font-size: var(--oc-font-size-md, 1rem);
      margin-bottom: var(--oc-space-xs, 4px);
      display: flex;
      align-items: center;
      gap: var(--oc-space-sm, 8px);
    }

    .status-badge {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .status-idle    { background: var(--oc-color-idle,    #9ca3af); }
    .status-running { background: var(--oc-color-running, #22c55e);
                      animation: oc-pulse 1.5s infinite; }
    .status-error   { background: var(--oc-color-error,   #ef4444); }
    .status-waiting { background: var(--oc-color-waiting, #f59e0b); }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: var(--oc-space-xs, 4px);
      font-size: var(--oc-font-size-xs, 0.75rem);
      color: var(--oc-color-text-muted, #6b7280);
      flex-wrap: wrap;
      margin-top: var(--oc-space-xs, 4px);
    }

    .breadcrumb-sep { opacity: 0.5; }

    .breadcrumb-item {
      cursor: pointer;
      color: var(--oc-color-accent, #6366f1);
      text-decoration: underline;
    }

    .breadcrumb-item.current {
      cursor: default;
      color: var(--oc-color-text-primary, #111827);
      text-decoration: none;
      font-weight: var(--oc-font-weight-medium, 500);
    }

    /* ─── Meta grid ─────────────────────────────────────────────────── */

    .meta-grid {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: var(--oc-space-xs, 4px) var(--oc-space-md, 16px);
      padding: var(--oc-space-md, 16px);
      border-bottom: 1px solid var(--oc-color-border, #e5e7eb);
      font-size: var(--oc-font-size-xs, 0.75rem);
    }

    .meta-key {
      color: var(--oc-color-text-muted, #6b7280);
      font-weight: var(--oc-font-weight-medium, 500);
    }

    .meta-val {
      color: var(--oc-color-text-primary, #111827);
      font-family: var(--oc-font-mono, monospace);
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* ─── Token bar ─────────────────────────────────────────────────── */

    .token-bar {
      padding: var(--oc-space-sm, 8px) var(--oc-space-md, 16px);
      border-bottom: 1px solid var(--oc-color-border, #e5e7eb);
      display: flex;
      gap: var(--oc-space-md, 16px);
      font-size: var(--oc-font-size-xs, 0.75rem);
      color: var(--oc-color-text-muted, #6b7280);
    }

    .token-stat strong {
      color: var(--oc-color-text-primary, #111827);
      font-weight: var(--oc-font-weight-semibold, 600);
    }

    /* ─── Streaming output ──────────────────────────────────────────── */

    .section {
      padding: var(--oc-space-md, 16px);
      border-bottom: 1px solid var(--oc-color-border, #e5e7eb);
    }

    .section-title {
      font-weight: var(--oc-font-weight-semibold, 600);
      font-size: var(--oc-font-size-xs, 0.75rem);
      color: var(--oc-color-text-muted, #6b7280);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: var(--oc-space-sm, 8px);
    }

    .stream-output {
      background: var(--oc-color-bg-secondary, #f9fafb);
      border-radius: var(--oc-radius-md, 8px);
      padding: var(--oc-space-sm, 8px);
      font-family: var(--oc-font-mono, monospace);
      font-size: var(--oc-font-size-xs, 0.75rem);
      max-height: 200px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-break: break-all;
      color: var(--oc-color-text-secondary, #374151);
    }

    /* ─── Tool calls ────────────────────────────────────────────────── */

    .tool-call-item {
      border: 1px solid var(--oc-color-border, #e5e7eb);
      border-radius: var(--oc-radius-sm, 4px);
      margin-bottom: var(--oc-space-xs, 4px);
      overflow: hidden;
    }

    .tool-call-header {
      display: flex;
      align-items: center;
      gap: var(--oc-space-xs, 4px);
      padding: var(--oc-space-xs, 4px) var(--oc-space-sm, 8px);
      cursor: pointer;
      background: var(--oc-color-bg-secondary, #f9fafb);
      transition: background var(--oc-transition-fast, 150ms);
    }

    .tool-call-header:hover {
      background: var(--oc-color-bg-tertiary, #f3f4f6);
    }

    .tool-name {
      font-family: var(--oc-font-mono, monospace);
      font-weight: var(--oc-font-weight-medium, 500);
      flex: 1;
    }

    .tool-status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }

    .tool-running { background: var(--oc-color-waiting, #f59e0b); animation: oc-pulse 1s infinite; }
    .tool-success { background: var(--oc-color-running, #22c55e); }
    .tool-error   { background: var(--oc-color-error,   #ef4444); }

    .tool-duration {
      font-size: var(--oc-font-size-xs, 0.75rem);
      color: var(--oc-color-text-muted, #6b7280);
    }

    .tool-expand-icon {
      font-size: 10px;
      color: var(--oc-color-text-muted, #6b7280);
      transition: transform var(--oc-transition-fast, 150ms);
    }

    .tool-expand-icon.expanded {
      transform: rotate(90deg);
    }

    .tool-call-body {
      padding: var(--oc-space-sm, 8px);
      font-size: var(--oc-font-size-xs, 0.75rem);
      font-family: var(--oc-font-mono, monospace);
      background: var(--oc-color-bg-primary, #fff);
    }

    .tool-call-section-label {
      font-weight: var(--oc-font-weight-semibold, 600);
      color: var(--oc-color-text-muted, #6b7280);
      margin-bottom: 2px;
    }

    .tool-call-text {
      white-space: pre-wrap;
      word-break: break-all;
      color: var(--oc-color-text-secondary, #374151);
      margin-bottom: var(--oc-space-xs, 4px);
    }

    /* ─── Action buttons ────────────────────────────────────────────── */

    .actions {
      padding: var(--oc-space-md, 16px);
      display: flex;
      gap: var(--oc-space-sm, 8px);
      flex-wrap: wrap;
      border-bottom: 1px solid var(--oc-color-border, #e5e7eb);
    }

    .btn {
      padding: var(--oc-space-xs, 4px) var(--oc-space-md, 16px);
      border-radius: var(--oc-radius-sm, 4px);
      border: 1px solid transparent;
      cursor: pointer;
      font-size: var(--oc-font-size-sm, 0.875rem);
      font-weight: var(--oc-font-weight-medium, 500);
      transition: background var(--oc-transition-fast, 150ms), opacity var(--oc-transition-fast, 150ms);
    }

    .btn-abort {
      background: var(--oc-color-error, #ef4444);
      color: white;
    }

    .btn-abort:hover { opacity: 0.85; }

    .btn-steer {
      background: var(--oc-color-accent, #6366f1);
      color: white;
    }

    .btn-steer:hover { opacity: 0.85; }

    .btn-inject {
      background: transparent;
      border-color: var(--oc-color-accent, #6366f1);
      color: var(--oc-color-accent, #6366f1);
    }

    .btn-inject:hover {
      background: var(--oc-color-accent-light, #eef2ff);
    }

    .input-row {
      padding: 0 var(--oc-space-md, 16px) var(--oc-space-md, 16px);
      display: flex;
      gap: var(--oc-space-sm, 8px);
    }

    .text-input {
      flex: 1;
      border: 1px solid var(--oc-color-border-strong, #d1d5db);
      border-radius: var(--oc-radius-sm, 4px);
      padding: var(--oc-space-xs, 4px) var(--oc-space-sm, 8px);
      font-family: var(--oc-font-sans, sans-serif);
      font-size: var(--oc-font-size-sm, 0.875rem);
    }

    .btn-send {
      padding: var(--oc-space-xs, 4px) var(--oc-space-sm, 8px);
      border-radius: var(--oc-radius-sm, 4px);
      border: none;
      background: var(--oc-color-accent, #6366f1);
      color: white;
      cursor: pointer;
      font-size: var(--oc-font-size-sm, 0.875rem);
    }

    /* ─── Confirm dialog ────────────────────────────────────────────── */

    .confirm-overlay {
      position: fixed;
      inset: 0;
      background: var(--oc-color-bg-overlay, rgba(0,0,0,0.4));
      z-index: var(--oc-z-modal, 200);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .confirm-dialog {
      background: var(--oc-color-bg-primary, #fff);
      border-radius: var(--oc-radius-lg, 12px);
      padding: var(--oc-space-lg, 24px);
      max-width: 400px;
      width: 90%;
      box-shadow: var(--oc-shadow-lg);
    }

    .confirm-dialog h3 {
      margin: 0 0 var(--oc-space-sm, 8px);
      font-size: var(--oc-font-size-md, 1rem);
    }

    .confirm-dialog p {
      margin: 0 0 var(--oc-space-md, 16px);
      color: var(--oc-color-text-muted, #6b7280);
      font-size: var(--oc-font-size-sm, 0.875rem);
    }

    .confirm-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--oc-space-sm, 8px);
    }

    .btn-cancel {
      background: var(--oc-color-bg-secondary, #f9fafb);
      border: 1px solid var(--oc-color-border, #e5e7eb);
      color: var(--oc-color-text-secondary, #374151);
    }

    /* ─── Empty state ────────────────────────────────────────────────── */

    .empty-state {
      padding: var(--oc-space-xl, 40px);
      text-align: center;
      color: var(--oc-color-text-muted, #6b7280);
    }

    @keyframes oc-pulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.4; }
    }
  `;

  private handleEvent(event: ActivityEvent): void {
    if (!this.session || event.sessionKey !== this.session.sessionKey) return;
    // Events targeting this session would update streaming output / tool calls
    // In a real implementation, these would be handled by the parent store
    this.requestUpdate();
  }

  private toggleToolCall(id: string): void {
    const next = new Set(this.expandedToolCallIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.expandedToolCallIds = next;
  }

  private handleAbort(): void {
    this.showAbortConfirm = true;
  }

  private confirmAbort(): void {
    if (!this.session) return;
    WsService.getInstance().send({
      type: 'chat.abort',
      sessionKey: this.session.sessionKey,
    });
    this.showAbortConfirm = false;
    this.dispatchEvent(new CustomEvent('session-aborted', {
      detail: { sessionKey: this.session.sessionKey },
      bubbles: true,
      composed: true,
    }));
  }

  private handleSteer(): void {
    if (!this.session || !this.steerText.trim()) return;
    WsService.getInstance().send({
      type: 'sessions.send',
      sessionKey: this.session.sessionKey,
      message: this.steerText.trim(),
    });
    this.steerText = '';
    this.showSteerInput = false;
  }

  private handleInject(): void {
    if (!this.session || !this.injectText.trim()) return;
    WsService.getInstance().send({
      type: 'chat.inject',
      sessionKey: this.session.sessionKey,
      message: this.injectText.trim(),
    });
    this.injectText = '';
    this.showInjectInput = false;
  }

  private navigateTo(sessionKey: string): void {
    this.dispatchEvent(new CustomEvent('session-selected', {
      detail: { sessionKey },
      bubbles: true,
      composed: true,
    }));
  }

  private renderBreadcrumb(): TemplateResult {
    const s = this.session!;
    const parts: TemplateResult[] = [];

    if (s.parentSessionKey) {
      parts.push(html`
        <span
          class="breadcrumb-item"
          @click="${() => this.navigateTo(s.parentSessionKey!)}"
          tabindex="0"
          role="button"
          @keydown="${(e: KeyboardEvent) => { if (e.key === 'Enter') this.navigateTo(s.parentSessionKey!); }}"
        >${s.parentSessionKey.slice(0, 10)}…</span>
        <span class="breadcrumb-sep">›</span>
      `);
    }

    parts.push(html`<span class="breadcrumb-item current">${s.label ?? s.sessionKey.slice(0, 14)}…</span>`);

    for (const childKey of (s.childSessionKeys ?? [])) {
      parts.push(html`
        <span class="breadcrumb-sep">›</span>
        <span
          class="breadcrumb-item"
          @click="${() => this.navigateTo(childKey)}"
          tabindex="0"
          role="button"
          @keydown="${(e: KeyboardEvent) => { if (e.key === 'Enter') this.navigateTo(childKey); }}"
        >${childKey.slice(0, 10)}…</span>
      `);
    }

    return html`<div class="breadcrumb" aria-label="Session lineage">${parts}</div>`;
  }

  private renderToolCallItem(tc: ToolCallRecord): TemplateResult {
    const expanded = this.expandedToolCallIds.has(tc.id);
    return html`
      <div class="tool-call-item" role="listitem">
        <div
          class="tool-call-header"
          @click="${() => this.toggleToolCall(tc.id)}"
          tabindex="0"
          role="button"
          aria-expanded="${expanded}"
          @keydown="${(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.toggleToolCall(tc.id); } }}"
        >
          <span class="tool-status-dot tool-${tc.status}"></span>
          <span class="tool-name">${tc.toolName}</span>
          ${tc.durationMs != null
            ? html`<span class="tool-duration">${tc.durationMs}ms</span>`
            : nothing
          }
          <span class="tool-expand-icon ${expanded ? 'expanded' : ''}">▶</span>
        </div>
        ${expanded
          ? html`
              <div class="tool-call-body">
                <div class="tool-call-section-label">Args</div>
                <pre class="tool-call-text">${tc.args}</pre>
                ${tc.result
                  ? html`
                      <div class="tool-call-section-label">Result</div>
                      <pre class="tool-call-text">${tc.result}</pre>
                    `
                  : nothing
                }
              </div>
            `
          : nothing
        }
      </div>
    `;
  }

  override render() {
    if (!this.session) {
      return html`<div class="empty-state">Select a session to inspect</div>`;
    }

    const s = this.session;
    const tokens = s.tokenAccumulator;
    const costStr = tokens.estimatedCostUsd != null
      ? `$${tokens.estimatedCostUsd.toFixed(4)}`
      : null;

    return html`
      <!-- Abort confirmation dialog -->
      ${this.showAbortConfirm
        ? html`
            <div class="confirm-overlay" role="dialog" aria-modal="true" aria-label="Confirm abort">
              <div class="confirm-dialog">
                <h3>Abort session?</h3>
                <p>This will immediately stop the running agent. This action cannot be undone.</p>
                <div class="confirm-actions">
                  <button class="btn btn-cancel" @click="${() => { this.showAbortConfirm = false; }}">Cancel</button>
                  <button class="btn btn-abort" @click="${this.confirmAbort}">Abort</button>
                </div>
              </div>
            </div>
          `
        : nothing
      }

      <div class="panel-header">
        <div class="panel-title">
          <span class="status-badge status-${s.status}" aria-label="Status: ${s.status}"></span>
          ${s.label ?? s.sessionKey}
        </div>
        ${this.renderBreadcrumb()}
      </div>

      <!-- Meta -->
      <dl class="meta-grid">
        <dt class="meta-key">Session</dt>
        <dd class="meta-val">${s.sessionKey}</dd>
        <dt class="meta-key">Model</dt>
        <dd class="meta-val">${s.model}</dd>
        <dt class="meta-key">Channel</dt>
        <dd class="meta-val">${s.channel}</dd>
        ${s.taskSummary
          ? html`<dt class="meta-key">Task</dt><dd class="meta-val">${s.taskSummary}</dd>`
          : nothing
        }
      </dl>

      <!-- Token bar -->
      <div class="token-bar" aria-label="Token usage">
        <span class="token-stat">In: <strong>${tokens.inputTokens.toLocaleString()}</strong></span>
        <span class="token-stat">Out: <strong>${tokens.outputTokens.toLocaleString()}</strong></span>
        <span class="token-stat">Total: <strong>${tokens.totalTokens.toLocaleString()}</strong></span>
        ${costStr ? html`<span class="token-stat">Cost: <strong>${costStr}</strong></span>` : nothing}
      </div>

      <!-- Streaming output -->
      ${this.streamingOutput
        ? html`
            <div class="section">
              <div class="section-title">Live output</div>
              <pre class="stream-output" aria-live="polite" aria-atomic="false">${this.streamingOutput}</pre>
            </div>
          `
        : nothing
      }

      <!-- Tool calls -->
      ${this.toolCalls.length > 0
        ? html`
            <div class="section">
              <div class="section-title">Tool calls (${this.toolCalls.length})</div>
              <div role="list" aria-label="Tool call log">
                ${this.toolCalls.map((tc) => this.renderToolCallItem(tc))}
              </div>
            </div>
          `
        : nothing
      }

      <!-- Actions -->
      <div class="actions">
        <button
          class="btn btn-abort"
          @click="${this.handleAbort}"
          aria-label="Abort session"
          ?disabled="${s.status === 'idle'}"
        >🛑 Abort</button>
        <button
          class="btn btn-steer"
          @click="${() => { this.showSteerInput = !this.showSteerInput; }}"
          aria-label="Steer session"
          aria-expanded="${this.showSteerInput}"
        >↩ Steer</button>
        <button
          class="btn btn-inject"
          @click="${() => { this.showInjectInput = !this.showInjectInput; }}"
          aria-label="Inject message"
          aria-expanded="${this.showInjectInput}"
        >💉 Inject</button>
      </div>

      ${this.showSteerInput
        ? html`
            <div class="input-row">
              <input
                class="text-input"
                type="text"
                placeholder="Send steering message…"
                .value="${this.steerText}"
                @input="${(e: InputEvent) => { this.steerText = (e.target as HTMLInputElement).value; }}"
                @keydown="${(e: KeyboardEvent) => { if (e.key === 'Enter') this.handleSteer(); if (e.key === 'Escape') { this.showSteerInput = false; } }}"
                aria-label="Steering message"
              />
              <button class="btn-send" @click="${this.handleSteer}">Send</button>
            </div>
          `
        : nothing
      }

      ${this.showInjectInput
        ? html`
            <div class="input-row">
              <input
                class="text-input"
                type="text"
                placeholder="Inject system message…"
                .value="${this.injectText}"
                @input="${(e: InputEvent) => { this.injectText = (e.target as HTMLInputElement).value; }}"
                @keydown="${(e: KeyboardEvent) => { if (e.key === 'Enter') this.handleInject(); if (e.key === 'Escape') { this.showInjectInput = false; } }}"
                aria-label="Inject message"
              />
              <button class="btn-send" @click="${this.handleInject}">Send</button>
            </div>
          `
        : nothing
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'oc-session-detail': OcSessionDetail;
  }
}
