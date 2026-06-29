// ────────────────────────────────────────────────────────────────────────────
// Config knobs — the dials you'll most likely want to turn during playtesting.
// Kept in one place, deliberately, so tuning the game never means hunting
// through logic. Pure game logic reads these; nothing here touches UI or storage.
// ────────────────────────────────────────────────────────────────────────────

import type { InputMode } from "./engine/types";

/** Default practice set: which times-tables are in play. */
export const ACTIVE_TABLES: number[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/** How many problems make up one session. */
export const SESSION_LENGTH = 9;

/** Correct-in-a-row needed before a single fact is considered "mastered". */
export const MASTERY_STREAK = 2;

/** Answer input mode. Multiple-choice "easy mode" is Phase 2+. */
export const INPUT_MODE: InputMode = "numpad";

/**
 * The factor range used to enumerate facts for each table.
 * e.g. table 7 → 7×2 … 7×12 and the matching divisions.
 */
export const FACTOR_MIN = 2;
export const FACTOR_MAX = 12;

// ────────────────────────────────────────────────────────────────────────────
// Phase 2 — adaptive practice & cat progression.
// ────────────────────────────────────────────────────────────────────────────

/** The cat/table the child meets first (from onboarding — Cream, the 7× cat). */
export const STARTER_TABLE = 7;

/** Order the engine introduces tables in — easiest-first. */
export const PROGRESSION_ORDER: number[] = [2, 5, 10, 3, 4, 6, 7, 8, 9, 11, 12];

/** How many not-yet-mastered tables stay in focus at once. */
export const ACTIVE_FRONT = 2;

/** masteryPct (0–1) on the leading table that pulls in the next one. */
export const ADVANCE_AT = 0.6;

/** Fraction of problems that are retention review of earlier mastered facts. */
export const REVIEW_SHARE = 0.2;

/**
 * "paced"  — lead through tables, advance fast past known ones (default).
 * "strict" — next table locked until the current one is fully mastered.
 * "open"   — every table introduced from the start; collection is pure mastery%.
 */
export const PROGRESSION_MODE: "paced" | "strict" | "open" = "paced";

/** A mastered fact becomes "due" for review after this many selections unseen. */
export const REVIEW_DUE_GAP = 8;

/** Don't serve the same fact again within this many selections (anti-streak). */
export const RECENT_BLOCK = 3;

// ────────────────────────────────────────────────────────────────────────────
// Challenge mode — an OPT-IN, reward-only timer. It never penalizes: running out
// of time just continues the problem untimed. Off by default.
// ────────────────────────────────────────────────────────────────────────────

export const CHALLENGE_MODE_DEFAULT = false;
export const CHALLENGE_SECONDS = 9; // per fact; generous on purpose
