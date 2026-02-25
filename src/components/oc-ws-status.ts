/**
 * <oc-ws-status> — WebSocket connection status indicator.
 *
 * Renders a colored dot + label showing current Gateway WS connection state.
 * Updates reactively when status changes.
 *
 * Usage:
 *   <oc-ws-status></oc-ws-status>
 */

import { LitElement, html, css, type PropertyValues } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { WsService, type WsStatus } from '../services/ws-service.js';

@customElement('oc-ws-status')
export class OcWsStatus extends LitElement {
  @state() private status: WsStatus = 'disconnected';

  private removeStatusListener?: () => void;

  static override styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--oc-space-xs, 4px);
      font-family: var(--oc-font-sans, sans-serif);
      font-size: var(--oc-font-size-sm, 0.875rem);
      color: var(--oc-color-text-muted, #6b7280);
      user-select: none;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: var(--oc-radius-full, 9999px);
      flex-shrink: 0;
      transition: background-color var(--oc-transition-fast, 150ms ease);
    }

    /* Status-specific dot colours */
    .dot--connected    { background: var(--oc-color-running, #22c55e); }
    .dot--connecting   { background: var(--oc-color-waiting, #f59e0b);
                         animation: oc-pulse 1.2s ease-in-out infinite; }
    .dot--disconnected { background: var(--oc-color-idle, #9ca3af); }
    .dot--error        { background: var(--oc-color-error, #ef4444); }

    .label {
      transition: color var(--oc-transition-fast, 150ms ease);
    }

    @keyframes oc-pulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.35; }
    }
  `;

  override connectedCallback(): void {
    super.connectedCallback();
    const ws = WsService.getInstance();
    this.status = ws.getStatus();
    this.removeStatusListener = ws.onStatusChange((s) => {
      this.status = s;
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeStatusListener?.();
  }

  private get label(): string {
    switch (this.status) {
      case 'connected':    return 'Connected';
      case 'connecting':   return 'Connecting…';
      case 'disconnected': return 'Disconnected';
      case 'error':        return 'Connection error';
    }
  }

  override render() {
    return html`
      <span
        class="dot dot--${this.status}"
        aria-hidden="true"
      ></span>
      <span class="label">${this.label}</span>
    `;
  }

  // Override to set ARIA attributes on the host element
  protected override updated(_changedProps: PropertyValues): void {
    this.setAttribute('aria-label', `Gateway: ${this.label}`);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'oc-ws-status': OcWsStatus;
  }
}
