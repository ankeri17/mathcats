// Shared test helpers. Deterministic RNG + stat builders so engine tests never
// flake and tuning changes show up as concrete numbers.
import { MASTERY_STREAK } from "../config";
import { factsForTable } from "../engine/facts";
import type { Fact, FactStat } from "../engine/types";

/** mulberry32 — a tiny seeded RNG so selection tests are reproducible. */
export function seededRng(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function masteredStat(f: Fact): FactStat {
  return {
    a: f.a,
    b: f.b,
    op: f.op,
    attempts: 5,
    correct: 5,
    streak: MASTERY_STREAK,
    avgMs: 1000,
    lastSeen: "2026-01-01T00:00:00.000Z",
    mastered: true,
  };
}

export function strugglingStat(f: Fact): FactStat {
  return {
    a: f.a,
    b: f.b,
    op: f.op,
    attempts: 3,
    correct: 1,
    streak: 0,
    avgMs: 4000,
    lastSeen: "2026-01-01T00:00:00.000Z",
    mastered: false,
  };
}

/** Mark every fact of a table mastered in `facts` (mutates and returns it). */
export function masterTable(
  tableId: number,
  facts: Record<string, FactStat>,
): Record<string, FactStat> {
  for (const f of factsForTable(tableId)) facts[f.key] = masteredStat(f);
  return facts;
}
