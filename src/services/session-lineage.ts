/**
 * Session lineage tracker — maintains parent↔child relationships
 * between OpenClaw sessions for tree rendering and navigation.
 */

export interface SessionNode {
  sessionKey: string;
  children: SessionNode[];
}

/**
 * In-memory map of session parent→child relationships.
 * Updated by lifecycle hooks when sessions are created/destroyed.
 */
export class SessionLineageMap {
  /** Map from parent sessionKey → array of direct child sessionKeys */
  private readonly childrenMap = new Map<string, string[]>();
  /** Map from child sessionKey → parent sessionKey */
  private readonly parentMap = new Map<string, string>();
  /** Set of all known session keys (including roots with no parent) */
  private readonly allSessions = new Set<string>();

  /**
   * Register a session, optionally linking it to a parent.
   *
   * @param sessionKey       The session being registered
   * @param parentSessionKey The spawning parent, if any
   */
  registerSession(sessionKey: string, parentSessionKey?: string): void {
    this.allSessions.add(sessionKey);

    if (parentSessionKey) {
      this.parentMap.set(sessionKey, parentSessionKey);

      // Ensure parent is also tracked
      this.allSessions.add(parentSessionKey);

      const siblings = this.childrenMap.get(parentSessionKey) ?? [];
      if (!siblings.includes(sessionKey)) {
        siblings.push(sessionKey);
        this.childrenMap.set(parentSessionKey, siblings);
      }
    }
  }

  /**
   * Remove a session and clean up its lineage entries.
   * Children of the removed session become orphans (their parent ref is cleared).
   */
  removeSession(sessionKey: string): void {
    this.allSessions.delete(sessionKey);

    // Detach from parent
    const parentKey = this.parentMap.get(sessionKey);
    if (parentKey) {
      const siblings = this.childrenMap.get(parentKey) ?? [];
      this.childrenMap.set(
        parentKey,
        siblings.filter((k) => k !== sessionKey)
      );
      this.parentMap.delete(sessionKey);
    }

    // Orphan children (don't delete them — they may still be active)
    const children = this.childrenMap.get(sessionKey) ?? [];
    for (const child of children) {
      this.parentMap.delete(child);
    }
    this.childrenMap.delete(sessionKey);
  }

  /**
   * Get all direct children of a session.
   */
  getChildren(sessionKey: string): string[] {
    return this.childrenMap.get(sessionKey) ?? [];
  }

  /**
   * Get the parent of a session, or undefined if it's a root session.
   */
  getParent(sessionKey: string): string | undefined {
    return this.parentMap.get(sessionKey);
  }

  /**
   * Get all root session keys (sessions with no registered parent).
   */
  getRoots(): string[] {
    return [...this.allSessions].filter((k) => !this.parentMap.has(k));
  }

  /**
   * Build a full recursive tree starting from a given root session key.
   */
  getLineageTree(rootKey: string): SessionNode {
    const children = this.getChildren(rootKey);
    return {
      sessionKey: rootKey,
      children: children.map((childKey) => this.getLineageTree(childKey)),
    };
  }

  /**
   * Get all session keys currently tracked.
   */
  getAllSessionKeys(): string[] {
    return [...this.allSessions];
  }

  /**
   * Check if a session key is registered.
   */
  has(sessionKey: string): boolean {
    return this.allSessions.has(sessionKey);
  }
}

// Singleton instance shared across the app
export const lineageMap = new SessionLineageMap();
