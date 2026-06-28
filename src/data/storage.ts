// ────────────────────────────────────────────────────────────────────────────
// Storage adapter — the single seam a future backend will replace.
//
// The data layer talks ONLY to this interface (get / set / list / remove).
// Components never import this; they go through the typed store. Swapping the
// localStorage implementation for a cloud-backed one (Phase 4+) means changing
// this file and nothing else.
// ────────────────────────────────────────────────────────────────────────────

export interface StorageAdapter {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
  /** Keys this app owns (without the internal namespace prefix). */
  list(): string[];
}

const PREFIX = "mathcats:";

/**
 * localStorage-backed adapter, namespaced so we never collide with anything
 * else on the origin. Degrades to an in-memory map if localStorage is
 * unavailable (private mode, etc.) so the app still runs for the session.
 */
function createLocalStorageAdapter(): StorageAdapter {
  let backing: Storage | null = null;
  try {
    const probe = "__mathcats_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    backing = window.localStorage;
  } catch {
    backing = null;
  }

  if (backing) {
    const store = backing;
    return {
      get: (key) => store.getItem(PREFIX + key),
      set: (key, value) => store.setItem(PREFIX + key, value),
      remove: (key) => store.removeItem(PREFIX + key),
      list: () =>
        Object.keys(store)
          .filter((k) => k.startsWith(PREFIX))
          .map((k) => k.slice(PREFIX.length)),
    };
  }

  // In-memory fallback — keeps the play loop working without persistence.
  const mem = new Map<string, string>();
  return {
    get: (key) => mem.get(key) ?? null,
    set: (key, value) => void mem.set(key, value),
    remove: (key) => void mem.delete(key),
    list: () => [...mem.keys()],
  };
}

export const storage: StorageAdapter = createLocalStorageAdapter();
