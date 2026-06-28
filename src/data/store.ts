// ────────────────────────────────────────────────────────────────────────────
// Typed data layer. The UI reads and writes game data ONLY through this module;
// it never touches storage directly. This sits on the storage adapter and owns
// load/migrate/save plus the domain operations (create profile, record an
// attempt, record a session). All functions are pure transforms over SaveData
// followed by a persist — easy to test, easy to swap the backend under.
// ────────────────────────────────────────────────────────────────────────────

import { ACTIVE_TABLES, INPUT_MODE } from "../config";
import { factsForTable } from "../engine/facts";
import { applyAttempt, emptyStat, masteryPct } from "../engine/mastery";
import type { Fact } from "../engine/types";
import { storage } from "./storage";
import {
  SCHEMA_VERSION,
  migrate,
  type CatProgress,
  type Profile,
  type SaveData,
  type Session,
} from "./schema";

const SAVE_KEY = "save";

/** UUID with a non-crypto fallback for older runtimes. */
function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}

/** The catId for a table is its zero-padded number: 7 → "07". */
export function catIdForTable(tableId: number): string {
  return String(tableId).padStart(2, "0");
}

// ── Load / save ─────────────────────────────────────────────────────────────

export function loadSave(): SaveData | null {
  const raw = storage.get(SAVE_KEY);
  if (!raw) return null;
  try {
    return migrate(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function persist(data: SaveData): void {
  storage.set(SAVE_KEY, JSON.stringify(data));
}

export function clearSave(): void {
  storage.remove(SAVE_KEY);
}

// ── Profile ──────────────────────────────────────────────────────────────────

/** Create a brand-new save for a freshly named profile and persist it. */
export function createProfile(name: string, now: string): SaveData {
  const profile: Profile = {
    id: uid(),
    name,
    createdAt: now,
    settings: {
      inputMode: INPUT_MODE,
      activeTables: [...ACTIVE_TABLES],
      muted: false,
    },
  };

  const data: SaveData = {
    schemaVersion: SCHEMA_VERSION,
    profile,
    facts: {},
    cats: {},
    sessions: [],
  };

  persist(data);
  return data;
}

export function setMuted(data: SaveData, muted: boolean): SaveData {
  const next: SaveData = {
    ...data,
    profile: { ...data.profile, settings: { ...data.profile.settings, muted } },
  };
  persist(next);
  return next;
}

// ── Attempts ──────────────────────────────────────────────────────────────────

export interface RecordAttemptInput {
  fact: Fact;
  correct: boolean;
  ms: number;
  now: string;
}

/**
 * Fold one attempt into the save: update the fact's stats (streak, avg, mastery)
 * and recompute the owning cat's table progress. Returns the new save and
 * whether the attempt newly mastered the whole table (a future "discovery" beat).
 */
export function recordAttempt(
  data: SaveData,
  input: RecordAttemptInput,
): { data: SaveData; factMastered: boolean; tableMastered: boolean } {
  const { fact, correct, ms, now } = input;

  const prevStat = data.facts[fact.key] ?? emptyStat(fact, now);
  const wasMastered = prevStat.mastered;
  const nextStat = applyAttempt(prevStat, { correct, ms, now });

  const facts = { ...data.facts, [fact.key]: nextStat };

  // Recompute the owning cat's table mastery from the updated facts.
  const tableFacts = factsForTable(fact.tableId);
  const pct = masteryPct(tableFacts, facts);
  const tableMastered = pct === 100;

  const catId = catIdForTable(fact.tableId);
  const prevCat = data.cats[catId];
  const nextCat: CatProgress = {
    catId,
    tableId: fact.tableId,
    unlocked: prevCat?.unlocked ?? true, // accrues now; unlock logic is Phase 2
    masteryPct: pct,
    mastered: tableMastered,
    unlockedAt: prevCat?.unlockedAt ?? now,
  };

  const next: SaveData = {
    ...data,
    facts,
    cats: { ...data.cats, [catId]: nextCat },
  };

  persist(next);

  return {
    data: next,
    factMastered: !wasMastered && nextStat.mastered,
    tableMastered: !prevCat?.mastered && tableMastered,
  };
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export function recordSession(
  data: SaveData,
  session: Omit<Session, "id">,
): SaveData {
  const next: SaveData = {
    ...data,
    sessions: [...data.sessions, { id: uid(), ...session }],
  };
  persist(next);
  return next;
}
