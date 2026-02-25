/**
 * WsEventController — Lit ReactiveController that subscribes to Gateway
 * WebSocket events and triggers host re-renders on receipt.
 *
 * Usage in a Lit component:
 *
 *   private wsCtrl = new WsEventController(this, ['run.started', 'run.completed'],
 *     (event) => { this.handleEvent(event); });
 */

import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { WsService } from './ws-service.js';

export class WsEventController implements ReactiveController {
  private readonly host: ReactiveControllerHost;
  private readonly eventKinds: string[];
  private readonly handler: (event: unknown) => void;
  private unsubscribeFns: Array<() => void> = [];

  /**
   * @param host        The Lit element that owns this controller
   * @param eventKinds  WS event kind strings to subscribe to (e.g. ['run.started'])
   *                    Pass ['*'] to receive all events.
   * @param handler     Called with the parsed event payload; the controller
   *                    automatically triggers host.requestUpdate() after each call.
   */
  constructor(
    host: ReactiveControllerHost,
    eventKinds: string[],
    handler: (event: unknown) => void
  ) {
    this.host = host;
    this.eventKinds = eventKinds;
    this.handler = handler;
    host.addController(this);
  }

  /** Called by Lit when the host element connects to the DOM. */
  hostConnected(): void {
    const ws = WsService.getInstance();
    this.unsubscribeFns = this.eventKinds.map((kind) =>
      ws.subscribe(kind, (event) => {
        this.handler(event);
        this.host.requestUpdate();
      })
    );
  }

  /** Called by Lit when the host element disconnects from the DOM. */
  hostDisconnected(): void {
    for (const unsub of this.unsubscribeFns) {
      unsub();
    }
    this.unsubscribeFns = [];
  }

  /** No-op — controller does not need post-update work. */
  hostUpdated(): void {}
}
