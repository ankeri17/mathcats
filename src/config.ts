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
export const MASTERY_STREAK = 3;

/** Answer input mode. Multiple-choice "easy mode" is Phase 2+. */
export const INPUT_MODE: InputMode = "numpad";

/**
 * The factor range used to enumerate facts for each table.
 * e.g. table 7 → 7×2 … 7×12 and the matching divisions.
 */
export const FACTOR_MIN = 2;
export const FACTOR_MAX = 12;
