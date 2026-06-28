// ────────────────────────────────────────────────────────────────────────────
// App state — the thin React layer that holds the loaded save + roster and
// exposes actions. Every mutation goes through the typed data store (which
// persists); components never call storage themselves.
// ────────────────────────────────────────────────────────────────────────────

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { loadRoster, findByTable, type Cat } from "../cats/roster";
import * as store from "../data/store";
import type { SaveData, Session } from "../data/schema";
import type { Fact } from "../engine/types";
import { STARTER_TABLE } from "../config";

interface AppContextValue {
  ready: boolean;
  save: SaveData | null;
  roster: Cat[];
  starterCat: Cat | null;
  /** True when the real roster/SVGs are missing and we're on the placeholder. */
  usingPlaceholder: boolean;
  createProfile: (name: string) => void;
  recordAttempt: (input: store.RecordAttemptInput) => ReturnType<typeof store.recordAttempt>;
  recordSession: (session: Omit<Session, "id">) => void;
  setMuted: (muted: boolean) => void;
  setChallengeMode: (on: boolean) => void;
  reset: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function nowIso(): string {
  return new Date().toISOString();
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [save, setSave] = useState<SaveData | null>(null);
  const [roster, setRoster] = useState<Cat[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([loadRoster(), Promise.resolve(store.loadSave())]).then(
      ([cats, loaded]) => {
        if (!active) return;
        setRoster(cats);
        setSave(loaded);
        setReady(true);
      },
    );
    return () => {
      active = false;
    };
  }, []);

  const createProfile = useCallback((name: string) => {
    setSave(store.createProfile(name, nowIso()));
  }, []);

  const recordAttempt = useCallback(
    (input: store.RecordAttemptInput) => {
      if (!save) throw new Error("recordAttempt before profile exists");
      const result = store.recordAttempt(save, input);
      setSave(result.data);
      return result;
    },
    [save],
  );

  const recordSession = useCallback(
    (session: Omit<Session, "id">) => {
      if (!save) return;
      setSave(store.recordSession(save, session));
    },
    [save],
  );

  const setMuted = useCallback(
    (muted: boolean) => {
      if (!save) return;
      setSave(store.setMuted(save, muted));
    },
    [save],
  );

  const setChallengeMode = useCallback(
    (on: boolean) => {
      if (!save) return;
      setSave(store.setChallengeMode(save, on));
    },
    [save],
  );

  const reset = useCallback(() => {
    store.clearSave();
    setSave(null);
  }, []);

  const starterCat = useMemo(
    () => findByTable(roster, STARTER_TABLE) ?? null,
    [roster],
  );

  const value: AppContextValue = {
    ready,
    save,
    roster,
    starterCat,
    usingPlaceholder: roster.length === 0,
    createProfile,
    recordAttempt,
    recordSession,
    setMuted,
    setChallengeMode,
    reset,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

/** Convenience re-export so screens can build problems without reaching deeper. */
export type { Fact };
