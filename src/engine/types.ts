// ────────────────────────────────────────────────────────────────────────────
// Engine types — the vocabulary of the game's pure core.
// This module (and everything under engine/) has NO UI and NO storage imports.
// ────────────────────────────────────────────────────────────────────────────

export type Op = "mul" | "div";

export type InputMode = "numpad" | "choice";

/**
 * A single math fact. For multiplication `a × b`; for division `a ÷ b`.
 *   mul:  a = table, b = factor      → answer a * b   (e.g. 7 × 8 = 56)
 *   div:  a = dividend, b = divisor  → answer a / b   (e.g. 56 ÷ 7 = 8)
 * Division facts never have remainders.
 */
export interface Fact {
  key: string; // stable id, e.g. "7x8" or "56d7"
  a: number;
  b: number;
  op: Op;
  answer: number;
  /** The table this fact belongs to (the shared factor). */
  tableId: number;
}

/** A fact presented to the player to solve. */
export interface Problem {
  fact: Fact;
  /** Pretty operator glyph for display, e.g. "×" or "÷". */
  glyph: string;
}

/**
 * Per-fact running stats. The mastery rule operates on this shape, so it lives
 * with the engine; the data layer persists it verbatim.
 */
export interface FactStat {
  a: number;
  b: number;
  op: Op; // e.g. 7 × 8, or 56 ÷ 7
  attempts: number;
  correct: number;
  streak: number; // current correct-in-a-row
  avgMs: number;
  lastSeen: string; // ISO timestamp
  mastered: boolean; // true once streak hits MASTERY_STREAK
}
