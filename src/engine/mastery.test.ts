import { describe, expect, it } from "vitest";
import { MASTERY_STREAK } from "../config";
import { factsForTable } from "./facts";
import { applyAttempt, emptyStat, masteryPct } from "./mastery";
import type { FactStat } from "./types";

const fact = factsForTable(7).find((f) => f.key === "7x8")!;
const NOW = "2026-01-01T00:00:00.000Z";

function afterAttempts(results: boolean[]): FactStat {
  let stat = emptyStat(fact, NOW);
  for (const correct of results) {
    stat = applyAttempt(stat, { correct, ms: 1000, now: NOW });
  }
  return stat;
}

describe("applyAttempt", () => {
  it("masters a fact at MASTERY_STREAK correct in a row", () => {
    const almost = afterAttempts(Array(MASTERY_STREAK - 1).fill(true));
    expect(almost.mastered).toBe(false);
    const done = afterAttempts(Array(MASTERY_STREAK).fill(true));
    expect(done.mastered).toBe(true);
    expect(done.streak).toBe(MASTERY_STREAK);
  });

  it("an incorrect answer resets the streak but never un-masters", () => {
    let stat = afterAttempts(Array(MASTERY_STREAK).fill(true));
    stat = applyAttempt(stat, { correct: false, ms: 1000, now: NOW });
    expect(stat.streak).toBe(0);
    expect(stat.mastered).toBe(true); // no losing states
  });

  it("keeps a running mean of answer time", () => {
    let stat = emptyStat(fact, NOW);
    stat = applyAttempt(stat, { correct: true, ms: 1000, now: NOW });
    stat = applyAttempt(stat, { correct: true, ms: 3000, now: NOW });
    expect(stat.avgMs).toBe(2000);
    expect(stat.attempts).toBe(2);
    expect(stat.correct).toBe(2);
  });
});

describe("masteryPct", () => {
  it("is 0 with no stats and 100 when everything is mastered", () => {
    const facts = factsForTable(7);
    expect(masteryPct(facts, {})).toBe(0);
    const stats: Record<string, FactStat> = {};
    for (const f of facts) {
      stats[f.key] = { ...emptyStat(f, NOW), mastered: true };
    }
    expect(masteryPct(facts, stats)).toBe(100);
  });
});
