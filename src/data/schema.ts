// ────────────────────────────────────────────────────────────────────────────
// Persisted data model + schema versioning. These are the shapes that live in
// storage. The mastery-relevant FactStat shape comes from the engine so the
// pure logic and the persisted record can never drift apart.
// ────────────────────────────────────────────────────────────────────────────

import type { FactStat, InputMode, Op } from "../engine/types";

export type { Op, InputMode, FactStat };

/** Bump when the persisted shape changes; add a step to `migrate`. */
export const SCHEMA_VERSION = 1;

export interface Profile {
  id: string;
  name: string;
  createdAt: string;
  settings: {
    inputMode: InputMode;
    activeTables: number[];
    /** Mute toggle — the one settings knob in scope for Phase 1. */
    muted?: boolean;
  };
}

export interface CatProgress {
  catId: string;
  tableId: number;
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
}

export interface SaveData {
  schemaVersion: number;
  profile: Profile;
  facts: Record<string, FactStat>; // key e.g. "7x8", "56d7"
  cats: Record<string, CatProgress>;
  sessions: Session[];
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

  let version = data.schemaVersion ?? 0;

  // Future migrations slot in here, one `if (version < N)` block at a time.
  // e.g. if (version < 2) { ...transform...; version = 2; }

  version = SCHEMA_VERSION;

  return {
    schemaVersion: version,
    profile: data.profile,
    facts: data.facts ?? {},
    cats: data.cats ?? {},
    sessions: data.sessions ?? [],
  };
}
