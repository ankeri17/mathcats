// ────────────────────────────────────────────────────────────────────────────
// Persisted data model + schema versioning. These are the shapes that live in
// storage. The mastery-relevant FactStat shape comes from the engine so the
// pure logic and the persisted record can never drift apart.
// ────────────────────────────────────────────────────────────────────────────

import type { FactStat, InputMode, Op } from "../engine/types";
import { seedIntroduced } from "../engine/progression";

export type { Op, InputMode, FactStat };

/** Bump when the persisted shape changes; add a step to `migrate`. */
export const SCHEMA_VERSION = 2;

export interface Profile {
  id: string;
  name: string;
  createdAt: string;
  settings: {
    inputMode: InputMode;
    /**
     * RESERVED — written at profile creation but not yet read anywhere.
     * Practice scope is driven by `progress.introduced` (the progression
     * engine), NOT this list. Kept for a future "parent picks tables" feature;
     * editing it today changes nothing.
     */
    activeTables: number[];
    /** Mute toggle. */
    muted?: boolean;
    /** Opt-in, reward-only challenge timer. */
    challengeMode?: boolean;
  };
}

export interface CatProgress {
  catId: string;
  /** The cat's table; null for milestone cats (div / all), matching the roster. */
  tableId: number | null;
  unlocked: boolean;
  masteryPct: number;
  mastered: boolean;
  unlockedAt?: string;
}

export interface Session {
  id: string;
  startedAt: string;
  endedAt: string;
  attempted: number;
  correct: number;
  /** When set, this was a single-table focus session (Phase 2 mode). */
  focusTable?: number;
}

/** Phase 2 progression state — which tables the engine has introduced, in order. */
export interface ProgressState {
  introduced: number[];
}

export interface SaveData {
  schemaVersion: number;
  profile: Profile;
  facts: Record<string, FactStat>; // key e.g. "7x8", "56d7"
  cats: Record<string, CatProgress>;
  sessions: Session[];
  progress: ProgressState;
}

/**
 * Migration hook. Given whatever shape was read from storage, return data at
 * the current SCHEMA_VERSION. Phase 1 has only version 1, so this just stamps
 * the version, but the seam exists for future, additive migrations.
 */
export function migrate(raw: unknown): SaveData | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Partial<SaveData> & { schemaVersion?: number };
  if (!data.profile) return null;

  const version = data.schemaVersion ?? 0;
  const facts = data.facts ?? {};

  // v1 → v2: introduce Phase 2 progression. Seed the introduced-tables list from
  // existing data so a Phase 1 child isn't re-walled. Cat entries are rebuilt to
  // match `introduced` by the store on load (see normalizeCats), so we leave them
  // as-is here and only ensure the shape exists.
  let progress = data.progress;
  if (version < 2 || !progress) {
    progress = { introduced: seedIntroduced(facts) };
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    profile: data.profile,
    facts,
    cats: data.cats ?? {},
    sessions: data.sessions ?? [],
    progress,
  };
}
