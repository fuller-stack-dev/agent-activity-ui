/**
 * <oc-agent-tree> — hierarchical tree view of all active sessions.
 *
 * Features:
 *  - Root sessions at top, sub-agents nested beneath (collapsible)
 *  - Color-coded status badges
 *  - Hover tooltip with session metadata
 *  - Click to open Session Detail Panel
 *  - Auto-refresh on sessions.activity events (no polling)
 *  - ARIA tree roles + full keyboard navigation (arrow keys, Enter, Escape)
 */

import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { WsEventController } from '../services/ws-reactive-controller.js';
import { SessionLineageMap } from '../services/session-lineage.js';
import type { SessionSummary, SessionStatus } from '../types/ui-state.js';
import type { ActivityEvent } from '../types/gateway-events.js';

interface TreeNode {
  summary: SessionSummary;
  children: TreeNode[];
  expanded: boolean;
}

@customElement('oc-agent-tree')
export class OcAgentTree extends LitElement {
  /** All sessions provided by the parent (or WS store) */
  @property({ type: Array }) sessions: SessionSummary[] = [];
  /** Currently selected sessionKey */
  @property({ type: String }) selectedKey = '';

  @state() private expandedKeys = new Set<string>();
  @state() private focusedKey = '';

  private readonly lineage = new SessionLineageMap();

  // Subscribes to all activity events; triggers re-render on each
  private readonly wsCtrl = new WsEventController(
    this,
    ['session.created', 'session.destroyed', 'run.started', 'run.completed',
     'run.aborted', 'subagent.spawned', 'subagent.completed'],
    (event) => this.handleActivityEvent(event as ActivityEvent)
  );

  static override styles = css`
    :host {
      display: block;
      font-family: var(--oc-font-sans, sans-serif);
      font-size: var(--oc-font-size-sm, 0.875rem);
      color: var(--oc-color-text-primary, #111827);
    }

    .tree-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--oc-space-sm, 8px) var(--oc-space-md, 16px);
      border-bottom: 1px solid var(--oc-color-border, #e5e7eb);
      font-weight: var(--oc-font-weight-semibold, 600);
      font-size: var(--oc-font-size-sm, 0.875rem);
      color: var(--oc-color-text-muted, #6b7280);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .session-count {
      background: var(--oc-color-bg-tertiary, #f3f4f6);
      border-radius: var(--oc-radius-full, 9999px);
      padding: 2px var(--oc-space-xs, 4px);
      font-size: var(--oc-font-size-xs, 0.75rem);
    }

    ul[role="tree"],
    ul[role="group"] {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    ul[role="group"] {
      padding-left: var(--oc-space-lg, 24px);
    }

    .tree-item {
      position: relative;
    }

    .tree-item-row {
      display: flex;
      align-items: center;
      gap: var(--oc-space-xs, 4px);
      padding: var(--oc-space-xs, 4px) var(--oc-space-sm, 8px);
      border-radius: var(--oc-radius-sm, 4px);
      cursor: pointer;
      outline: none;
      transition: background-color var(--oc-transition-fast, 150ms ease);
    }

    .tree-item-row:hover {
      background: var(--oc-color-bg-secondary, #f9fafb);
    }

    .tree-item-row:focus-visible {
      box-shadow: 0 0 0 2px var(--oc-color-accent, #6366f1);
    }

    .tree-item-row.selected {
      background: var(--oc-color-accent-light, #eef2ff);
      color: var(--oc-color-accent, #6366f1);
    }

    .expand-toggle {
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 10px;
      color: var(--oc-color-text-muted, #6b7280);
      transition: transform var(--oc-transition-fast, 150ms ease);
    }

    .expand-toggle.expanded {
      transform: rotate(90deg);
    }

    .expand-placeholder {
      width: 16px;
      flex-shrink: 0;
    }

    /* Status badge */
    .status-badge {
      width: 8px;
      height: 8px;
      border-radius: var(--oc-radius-full, 9999px);
      flex-shrink: 0;
    }

    .status-idle    { background: var(--oc-color-idle,    #9ca3af); }
    .status-running {
      background: var(--oc-color-running, #22c55e);
      animation: oc-pulse 1.5s ease-in-out infinite;
    }
    .status-error   { background: var(--oc-color-error,   #ef4444); }
    .status-waiting { background: var(--oc-color-waiting, #f59e0b); }

    .session-label {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .session-model {
      font-size: var(--oc-font-size-xs, 0.75rem);
      color: var(--oc-color-text-muted, #6b7280);
      flex-shrink: 0;
    }

    /* Tooltip */
    .tooltip-wrapper {
      position: relative;
    }

    .tooltip-wrapper:hover .tooltip {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0);
    }

    .tooltip {
      position: absolute;
      left: 100%;
      top: 0;
      margin-left: var(--oc-space-xs, 4px);
      background: var(--oc-color-bg-primary, #fff);
      border: 1px solid var(--oc-color-border, #e5e7eb);
      border-radius: var(--oc-radius-md, 8px);
      padding: var(--oc-space-sm, 8px);
      min-width: 200px;
      z-index: var(--oc-z-tooltip, 300);
      opacity: 0;
      pointer-events: none;
      transform: translateY(-4px);
      transition: opacity var(--oc-transition-fast, 150ms ease),
                  transform var(--oc-transition-fast, 150ms ease);
      box-shadow: var(--oc-shadow-md);
      font-size: var(--oc-font-size-xs, 0.75rem);
      color: var(--oc-color-text-secondary, #374151);
      line-height: 1.6;
      white-space: normal;
    }

    .tooltip dt {
      font-weight: var(--oc-font-weight-semibold, 600);
      color: var(--oc-color-text-muted, #6b7280);
      margin-top: var(--oc-space-xs, 4px);
    }

    .tooltip dd {
      margin: 0;
    }

    .empty-state {
      padding: var(--oc-space-xl, 40px) var(--oc-space-md, 16px);
      text-align: center;
      color: var(--oc-color-text-muted, #6b7280);
      font-size: var(--oc-font-size-sm, 0.875rem);
    }

    @keyframes oc-pulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.4; }
    }
  `;

  private handleActivityEvent(event: ActivityEvent): void {
    // Update lineage map based on session lifecycle events
    if (event.eventKind === 'session.created') {
      this.lineage.registerSession(event.sessionKey, event.parentSessionKey);
    } else if (event.eventKind === 'session.destroyed') {
      this.lineage.removeSession(event.sessionKey);
    } else if (event.eventKind === 'subagent.spawned') {
      this.lineage.registerSession(event.childSessionKey, event.parentSessionKey);
    }
  }

  /** Build tree nodes from flat session list using lineage map */
  private buildTree(): TreeNode[] {
    const sessionMap = new Map(this.sessions.map((s) => [s.sessionKey, s]));

    // Sync lineage map with current sessions
    for (const session of this.sessions) {
      this.lineage.registerSession(session.sessionKey, session.parentSessionKey);
    }

    const roots = this.sessions.filter((s) => !s.parentSessionKey);

    const buildNode = (summary: SessionSummary): TreeNode => {
      const children = (summary.childSessionKeys ?? [])
        .map((k) => sessionMap.get(k))
        .filter((s): s is SessionSummary => s !== undefined)
        .map(buildNode);

      return {
        summary,
        children,
        expanded: this.expandedKeys.has(summary.sessionKey),
      };
    };

    return roots.map(buildNode);
  }

  private toggleExpand(sessionKey: string, e: Event): void {
    e.stopPropagation();
    const next = new Set(this.expandedKeys);
    if (next.has(sessionKey)) {
      next.delete(sessionKey);
    } else {
      next.add(sessionKey);
    }
    this.expandedKeys = next;
  }

  private selectSession(sessionKey: string): void {
    this.focusedKey = sessionKey;
    this.dispatchEvent(
      new CustomEvent('session-selected', {
        detail: { sessionKey },
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleKeyDown(e: KeyboardEvent, node: TreeNode, siblings: TreeNode[], idx: number): void {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        this.selectSession(node.summary.sessionKey);
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (node.children.length > 0 && !node.expanded) {
          this.expandedKeys = new Set([...this.expandedKeys, node.summary.sessionKey]);
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (node.expanded) {
          const next = new Set(this.expandedKeys);
          next.delete(node.summary.sessionKey);
          this.expandedKeys = next;
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (idx < siblings.length - 1) {
          this.focusedKey = siblings[idx + 1].summary.sessionKey;
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (idx > 0) {
          this.focusedKey = siblings[idx - 1].summary.sessionKey;
        }
        break;
    }
  }

  private renderTooltip(s: SessionSummary): TemplateResult {
    const uptime = s.uptimeSeconds < 60
      ? `${s.uptimeSeconds}s`
      : `${Math.floor(s.uptimeSeconds / 60)}m ${s.uptimeSeconds % 60}s`;

    return html`
      <div class="tooltip" role="tooltip">
        <dl>
          <dt>Session</dt><dd>${s.sessionKey}</dd>
          <dt>Model</dt><dd>${s.model}</dd>
          <dt>Channel</dt><dd>${s.channel}</dd>
          <dt>Uptime</dt><dd>${uptime}</dd>
          ${s.taskSummary ? html`<dt>Task</dt><dd>${s.taskSummary}</dd>` : nothing}
          <dt>Tokens</dt><dd>${s.tokenAccumulator.totalTokens.toLocaleString()}</dd>
        </dl>
      </div>
    `;
  }

  private renderNodes(nodes: TreeNode[], depth = 0): TemplateResult {
    return html`
      <ul role="${depth === 0 ? 'tree' : 'group'}" aria-label="${depth === 0 ? 'Active agents' : nothing}">
        ${repeat(
          nodes,
          (n) => n.summary.sessionKey,
          (node, idx) => html`
            <li
              role="treeitem"
              aria-expanded="${node.children.length > 0 ? String(node.expanded) : nothing}"
              aria-selected="${node.summary.sessionKey === this.selectedKey}"
              class="tree-item"
            >
              <div
                class="tree-item-row tooltip-wrapper ${node.summary.sessionKey === this.selectedKey ? 'selected' : ''}"
                tabindex="${node.summary.sessionKey === this.focusedKey || (this.focusedKey === '' && idx === 0 && depth === 0) ? '0' : '-1'}"
                @click="${() => this.selectSession(node.summary.sessionKey)}"
                @keydown="${(e: KeyboardEvent) => this.handleKeyDown(e, node, nodes, idx)}"
              >
                ${node.children.length > 0
                  ? html`
                      <span
                        class="expand-toggle ${node.expanded ? 'expanded' : ''}"
                        @click="${(e: Event) => this.toggleExpand(node.summary.sessionKey, e)}"
                        aria-label="${node.expanded ? 'Collapse' : 'Expand'}"
                      >▶</span>
                    `
                  : html`<span class="expand-placeholder"></span>`
                }
                <span class="status-badge status-${node.summary.status}" aria-label="Status: ${node.summary.status}"></span>
                <span class="session-label">${node.summary.label ?? node.summary.sessionKey}</span>
                <span class="session-model">${node.summary.model.split('/').pop()}</span>
                ${this.renderTooltip(node.summary)}
              </div>
              ${node.expanded && node.children.length > 0
                ? this.renderNodes(node.children, depth + 1)
                : nothing
              }
            </li>
          `
        )}
      </ul>
    `;
  }

  override render() {
    const tree = this.buildTree();
    const activeCount = this.sessions.filter((s) => s.status === 'running').length;

    return html`
      <div class="tree-header">
        <span>Agents</span>
        <span class="session-count">${this.sessions.length} sessions · ${activeCount} active</span>
      </div>
      ${tree.length === 0
        ? html`<div class="empty-state">No active sessions</div>`
        : this.renderNodes(tree)
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'oc-agent-tree': OcAgentTree;
  }
}
