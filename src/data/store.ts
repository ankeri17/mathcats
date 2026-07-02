// ────────────────────────────────────────────────────────────────────────────
// Typed data layer. The UI reads and writes game data ONLY through this module;
// it never touches storage directly. Sits on the storage adapter and owns
// load/migrate/normalize/save plus the domain operations. Phase 2 adds:
//   - progression reconcile (introduce tables as the child advances)
//   - cat progress + milestone cats derived from facts
//   - discovery / level-up events returned from recordAttempt
// All cat state is DERIVED from facts + introduced tables, so it can never drift.
// ────────────────────────────────────────────────────────────────────────────

import {
  PROGRESSION_MODE,
  PROGRESSION_ORDER,
  STARTER_TABLE,
  INPUT_MODE,
  ACTIVE_TABLES,
  CHALLENGE_MODE_DEFAULT,
} from "../config";
import { emptyStat, applyAttempt } from "../engine/mastery";
import { reconcileIntroduced, tableMasteryPct } from "../engine/progression";
import { allStarsMilestone, divisionMilestone } from "../engine/milestones";
import type { Fact, FactStat } from "../engine/types";
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

export const DIV_CAT_ID = "div";
export const ALL_CAT_ID = "all";

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

// ── Cat derivation ────────────────────────────────────────────────────────────

/**
 * Build the full cat-progress map from the introduced tables + fact stats. This
 * is the single source of truth for cat state: table-cats for each introduced
 * table, plus the two milestone cats when their triggers fire. `prev` is only
 * read to preserve original `unlockedAt` timestamps.
 */
function deriveCats(
  introduced: number[],
  facts: Record<string, FactStat>,
  prev: Record<string, CatProgress>,
  now: string,
): Record<string, CatProgress> {
  const cats: Record<string, CatProgress> = {};

  for (const tableId of introduced) {
    const catId = catIdForTable(tableId);
    const pct = tableMasteryPct(tableId, facts);
    cats[catId] = {
      catId,
      tableId,
      unlocked: true,
      masteryPct: pct,
      mastered: pct === 100,
      unlockedAt: prev[catId]?.unlockedAt ?? now,
    };
  }

  // Milestone: division cat. (Milestone cats carry tableId null, matching the
  // roster; cats are re-derived on every load, so any legacy 0-sentinels are
  // rewritten automatically — no migration needed.)
  const div = divisionMilestone(facts);
  if (div.unlocked) {
    cats[DIV_CAT_ID] = {
      catId: DIV_CAT_ID,
      tableId: null,
      unlocked: true,
      masteryPct: div.masteryPct,
      mastered: div.mastered,
      unlockedAt: prev[DIV_CAT_ID]?.unlockedAt ?? now,
    };
  }

  // Milestone: all-stars cat (depends on every table-cat + the division cat).
  const isTableMastered = (t: number) => cats[catIdForTable(t)]?.mastered ?? false;
  const all = allStarsMilestone(isTableMastered, div.mastered);
  if (all.unlocked) {
    cats[ALL_CAT_ID] = {
      catId: ALL_CAT_ID,
      tableId: null,
      unlocked: true,
      masteryPct: all.masteryPct,
      mastered: all.mastered,
      unlockedAt: prev[ALL_CAT_ID]?.unlockedAt ?? now,
    };
  }

  return cats;
}

// ── Load / save ─────────────────────────────────────────────────────────────

/** Re-derive cats so loaded state is always consistent with introduced + facts. */
function normalizeCats(data: SaveData, now: string): SaveData {
  return {
    ...data,
    cats: deriveCats(data.progress.introduced, data.facts, data.cats, now),
  };
}

export function loadSave(): SaveData | null {
  const raw = storage.get(SAVE_KEY);
  if (!raw) return null;
  try {
    const migrated = migrate(JSON.parse(raw));
    if (!migrated) return null;
    const normalized = normalizeCats(migrated, new Date().toISOString());
    // Write back so storage is upgraded to the current schema on first load,
    // rather than re-migrating every boot.
    persist(normalized);
    return normalized;
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

/** Wipe all app data — the save and the "seen cats" reveal flags. Used by the
 *  Settings "start over", which returns the player to name selection. */
export function resetAll(): void {
  storage.remove(SAVE_KEY);
  storage.remove(SEEN_KEY);
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
      challengeMode: CHALLENGE_MODE_DEFAULT,
    },
  };

  const introduced =
    PROGRESSION_MODE === "open" ? [...PROGRESSION_ORDER] : [STARTER_TABLE];

  const data: SaveData = {
    schemaVersion: SCHEMA_VERSION,
    profile,
    facts: {},
    cats: deriveCats(introduced, {}, {}, now),
    sessions: [],
    progress: { introduced },
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

export function setChallengeMode(data: SaveData, challengeMode: boolean): SaveData {
  const next: SaveData = {
    ...data,
    profile: { ...data.profile, settings: { ...data.profile.settings, challengeMode } },
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

/** What changed as a result of an attempt — drives the discovery/level-up beats. */
export interface AttemptEvents {
  /** This attempt newly mastered the individual fact. */
  factMastered: boolean;
  /** Cat ids that newly unlocked (a table introduced, or a milestone). */
  newCats: string[];
  /** Cat ids that newly reached full mastery. */
  masteredCats: string[];
}

/**
 * Fold one attempt into the save: update the fact's stats, advance progression
 * (possibly introducing new tables), re-derive all cat progress + milestones,
 * persist, and report what newly discovered or mastered.
 */
export function recordAttempt(
  data: SaveData,
  input: RecordAttemptInput,
): { data: SaveData; events: AttemptEvents } {
  const { fact, correct, ms, now } = input;

  const prevStat = data.facts[fact.key] ?? emptyStat(fact, now);
  const wasFactMastered = prevStat.mastered;
  const nextStat = applyAttempt(prevStat, { correct, ms, now });
  const facts = { ...data.facts, [fact.key]: nextStat };

  const introduced = reconcileIntroduced(data.progress.introduced, facts);
  const cats = deriveCats(introduced, facts, data.cats, now);

  const newCats = Object.keys(cats).filter((id) => !data.cats[id]?.unlocked);
  const masteredCats = Object.keys(cats).filter(
    (id) => cats[id].mastered && !data.cats[id]?.mastered,
  );

  const next: SaveData = {
    ...data,
    facts,
    cats,
    progress: { ...data.progress, introduced },
  };

  persist(next);

  return {
    data: next,
    events: {
      factMastered: !wasFactMastered && nextStat.mastered,
      newCats,
      masteredCats,
    },
  };
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export function recordSession(data: SaveData, session: Omit<Session, "id">): SaveData {
  const next: SaveData = {
    ...data,
    sessions: [...data.sessions, { id: uid(), ...session }],
  };
  persist(next);
  return next;
}

// ── "Seen in detail" set ──────────────────────────────────────────────────────
// Tracks which cats the child has opened in cat-detail, so a newly-discovered
// cat plays its reveal exactly once. Kept as a tiny separate key (not part of the
// game save) — still behind the storage adapter; the UI never touches storage.

const SEEN_KEY = "seenCats";

export function getSeenCats(): Set<string> {
  const raw = storage.get(SEEN_KEY);
  if (!raw) return new Set();
  try {
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

export function markCatSeen(catId: string): void {
  const seen = getSeenCats();
  if (seen.has(catId)) return;
  seen.add(catId);
  storage.set(SEEN_KEY, JSON.stringify([...seen]));
}
