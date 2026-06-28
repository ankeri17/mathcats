// ────────────────────────────────────────────────────────────────────────────
// Mastery (pure). Folds a single attempt into a fact's running stats. No UI,
// no storage — callers pass in the old stat (or undefined) and the result of
// the attempt, and get the new stat back. Persistence happens elsewhere.
// ────────────────────────────────────────────────────────────────────────────

import { MASTERY_STREAK } from "../config";
import type { Fact, FactStat } from "./types";

/** A fresh, never-attempted stat for a fact. */
export function emptyStat(fact: Fact, now: string): FactStat {
  return {
    a: fact.a,
    b: fact.b,
    op: fact.op,
    attempts: 0,
    correct: 0,
    streak: 0,
    avgMs: 0,
    lastSeen: now,
    mastered: false,
  };
}

export interface AttemptResult {
  correct: boolean;
  /** Time taken to answer, in milliseconds. */
  ms: number;
  /** ISO timestamp of the attempt. */
  now: string;
}

/**
 * Apply an attempt to a fact's stats and return the new stats.
 *
 * - A correct answer increments the streak; reaching MASTERY_STREAK sets
 *   `mastered` (and it stays mastered thereafter).
 * - An incorrect answer resets the streak to 0. It never un-masters a fact and
 *   never produces a penalty — this game has no losing states.
 * - `avgMs` is a running mean over all attempts.
 */
export function applyAttempt(
  prev: FactStat,
  result: AttemptResult,
): FactStat {
  const attempts = prev.attempts + 1;
  const correct = prev.correct + (result.correct ? 1 : 0);
  const streak = result.correct ? prev.streak + 1 : 0;
  const avgMs = Math.round((prev.avgMs * prev.attempts + result.ms) / attempts);
  const mastered = prev.mastered || streak >= MASTERY_STREAK;

  return {
    ...prev,
    attempts,
    correct,
    streak,
    avgMs,
    lastSeen: result.now,
    mastered,
  };
}

/** Mastery percentage for a set of facts, 0–100, rounded. */
export function masteryPct(facts: Fact[], stats: Record<string, FactStat>): number {
  if (facts.length === 0) return 0;
  const masteredCount = facts.filter((f) => stats[f.key]?.mastered).length;
  return Math.round((masteredCount / facts.length) * 100);
}
