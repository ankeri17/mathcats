// ────────────────────────────────────────────────────────────────────────────
// Progression simulation — the regression guard for game pacing. Plays the real
// engine end-to-end (selector → mastery → reconcile) with a seeded RNG and
// asserts the time-to-second-cat stays inside the band the game was tuned to.
// If a future tuning change moves these numbers, this test makes it a conscious
// decision instead of a surprise in a child's playtest.
// ────────────────────────────────────────────────────────────────────────────
import { describe, expect, it } from "vitest";
import { STARTER_TABLE } from "../config";
import { initSelector, selectNext, type SelectorState } from "./adaptiveSelector";
import { buildFactPool } from "./facts";
import { applyAttempt, emptyStat } from "./mastery";
import { computeFront, reconcileIntroduced } from "./progression";
import { seededRng } from "../testing/helpers";
import type { FactStat } from "./types";

/** Play until a second table is introduced; return how many problems it took. */
function problemsToSecondCat(accuracy: number, seed: number): number {
  const rng = seededRng(seed);
  let facts: Record<string, FactStat> = {};
  let introduced = [STARTER_TABLE];
  let state: SelectorState = initSelector();

  for (let n = 1; n <= 600; n++) {
    const pool = buildFactPool(introduced);
    const front = new Set(computeFront(introduced, facts));
    const res = selectNext({ pool, front, stats: facts, state, rng });
    state = res.state;

    const fact = res.problem.fact;
    const correct = rng() < accuracy;
    facts = {
      ...facts,
      [fact.key]: applyAttempt(facts[fact.key] ?? emptyStat(fact, "t"), {
        correct,
        ms: 1000,
        now: "t",
      }),
    };
    introduced = reconcileIntroduced(introduced, facts);
    if (introduced.length > 1) return n;
  }
  return Infinity;
}

function average(accuracy: number): number {
  const runs = 12;
  let sum = 0;
  for (let i = 0; i < runs; i++) sum += problemsToSecondCat(accuracy, i * 7 + 1);
  return sum / runs;
}

describe("pacing: problems to unlock the second cat", () => {
  it("a child answering everything right gets there in ~4 sessions", () => {
    const avg = average(1.0);
    expect(avg).toBeLessThanOrEqual(50); // ≈ 5–6 sessions of 9, upper bound
    expect(avg).toBeGreaterThanOrEqual(15); // and it's never trivial
  });

  it("a child at 80% accuracy still gets there in bounded time", () => {
    const avg = average(0.8);
    expect(avg).toBeLessThanOrEqual(75);
  });

  it("progression always converges (no unreachable second cat)", () => {
    for (let seed = 1; seed <= 5; seed++) {
      expect(problemsToSecondCat(0.7, seed)).toBeLessThan(600);
    }
  });
});
