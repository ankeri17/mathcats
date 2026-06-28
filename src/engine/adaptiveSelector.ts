// ────────────────────────────────────────────────────────────────────────────
// Adaptive selection (pure). Replaces Phase 1's plain getNextProblem. A
// Leitner-lite scheme: each fact sits in a box derived from its stats. Selection
// favors weak/struggling facts in the active front, folds in a steady minority
// of "due" review of earlier mastered facts, never repeats a fact immediately or
// within a short window, and mixes × and ÷. No UI, no storage.
// ────────────────────────────────────────────────────────────────────────────

import { REVIEW_DUE_GAP, REVIEW_SHARE, RECENT_BLOCK } from "../config";
import { toProblem } from "./facts";
import type { Fact, FactStat, Problem } from "./types";

export type Box = "new" | "struggling" | "learning" | "mastered";

/** Which Leitner box a fact sits in, from its running stats. */
export function boxOf(stat: FactStat | undefined): Box {
  if (!stat || stat.attempts === 0) return "new";
  if (stat.mastered) return "mastered";
  if (stat.streak === 0) return "struggling"; // just missed it
  return "learning";
}

const WEIGHT: Record<Box, number> = {
  struggling: 6,
  new: 4,
  learning: 2,
  mastered: 1,
};

/** Per-session selection memory (kept by the caller, threaded through). */
export interface SelectorState {
  recent: string[]; // recently served keys, oldest→newest
  servedAt: Record<string, number>; // key → selection index last served
  count: number; // selections made so far
}

export function initSelector(): SelectorState {
  return { recent: [], servedAt: {}, count: 0 };
}

export interface SelectArgs {
  /** Facts reachable this session (introduced tables, or a single focus table). */
  pool: Fact[];
  /** Emphasized tables — most problems come from here. */
  front: Set<number>;
  stats: Record<string, FactStat>;
  state: SelectorState;
  rng?: () => number;
}

function weightedPick(
  facts: Fact[],
  stats: Record<string, FactStat>,
  front: Set<number>,
  rng: () => number,
): Fact {
  const weights = facts.map((f) => {
    const base = WEIGHT[boxOf(stats[f.key])];
    return front.has(f.tableId) ? base * 1.5 : base;
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < facts.length; i++) {
    r -= weights[i];
    if (r <= 0) return facts[i];
  }
  return facts[facts.length - 1];
}

export function selectNext(args: SelectArgs): { problem: Problem; state: SelectorState } {
  const rng = args.rng ?? Math.random;
  const { pool, front, stats, state } = args;
  if (pool.length === 0) throw new Error("selectNext: empty pool");

  const lastKey = state.recent[state.recent.length - 1] ?? null;

  const struggling = pool.filter((f) => boxOf(stats[f.key]) === "struggling");
  const frontFacts = pool.filter((f) => front.has(f.tableId));
  const dueReview = pool.filter((f) => {
    if (boxOf(stats[f.key]) !== "mastered") return false;
    const last = state.servedAt[f.key];
    return last === undefined || state.count - last >= REVIEW_DUE_GAP;
  });

  // A steady minority of problems are retention review; the rest are front + any
  // struggling fact anywhere.
  const wantReview = rng() < REVIEW_SHARE && dueReview.length > 0;
  let primary = wantReview ? dueReview : dedupe([...frontFacts, ...struggling]);
  if (primary.length === 0) primary = pool;

  // Interleave: avoid the immediate repeat and a short recent window.
  const blocked = new Set(state.recent.slice(-RECENT_BLOCK));
  let pickable = primary.filter((f) => f.key !== lastKey && !blocked.has(f.key));
  if (pickable.length === 0) pickable = primary.filter((f) => f.key !== lastKey);
  if (pickable.length === 0) pickable = primary;

  const chosen = weightedPick(pickable, stats, front, rng);

  const count = state.count + 1;
  const cap = Math.max(RECENT_BLOCK * 3, 12);
  return {
    problem: toProblem(chosen),
    state: {
      recent: [...state.recent, chosen.key].slice(-cap),
      servedAt: { ...state.servedAt, [chosen.key]: count },
      count,
    },
  };
}

function dedupe(facts: Fact[]): Fact[] {
  const seen = new Set<string>();
  return facts.filter((f) => (seen.has(f.key) ? false : (seen.add(f.key), true)));
}
