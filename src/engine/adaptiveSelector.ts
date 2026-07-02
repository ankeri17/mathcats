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
  learning: 3,
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
  const isMastered = (f: Fact) => boxOf(stats[f.key]) === "mastered";

  const struggling = pool.filter((f) => boxOf(stats[f.key]) === "struggling");
  // The weak spots worth drilling: front-table facts not yet mastered. We do NOT
  // keep re-testing already-mastered facts in the table you're still learning —
  // that's what made progression feel like grinding the same things.
  const frontUnmastered = pool.filter((f) => front.has(f.tableId) && !isMastered(f));
  // Review = EARLIER mastered facts (outside the current front), surfaced when
  // due. While a table is still being learned it has no "earlier" facts, so 100%
  // of practice goes to the weak spots and the next cat arrives faster.
  const dueReview = pool.filter((f) => {
    if (front.has(f.tableId) || !isMastered(f)) return false;
    const last = state.servedAt[f.key];
    return last === undefined || state.count - last >= REVIEW_DUE_GAP;
  });

  // A steady minority of problems are retention review of earlier tables; the
  // rest target the weak spots (unmastered front facts + any struggling fact).
  const wantReview = rng() < REVIEW_SHARE && dueReview.length > 0;
  let primary = wantReview ? dueReview : dedupe([...frontUnmastered, ...struggling]);
  if (primary.length === 0) {
    // Everything in the front is mastered — keep the table warm, else fall back.
    const frontAny = pool.filter((f) => front.has(f.tableId));
    primary = frontAny.length > 0 ? frontAny : pool;
  }

  // Interleave: avoid the immediate repeat and a short recent window. If the
  // primary set runs dry (e.g. one weak fact left in the front), widen to the
  // whole pool rather than serve the same fact twice in a row — back-to-back
  // repeats read as punishment. Only a single-fact pool may ever repeat.
  const blocked = new Set(state.recent.slice(-RECENT_BLOCK));
  let pickable = primary.filter((f) => f.key !== lastKey && !blocked.has(f.key));
  if (pickable.length === 0) pickable = primary.filter((f) => f.key !== lastKey);
  if (pickable.length === 0) pickable = pool.filter((f) => f.key !== lastKey && !blocked.has(f.key));
  if (pickable.length === 0) pickable = pool.filter((f) => f.key !== lastKey);
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
