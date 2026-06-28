// ────────────────────────────────────────────────────────────────────────────
// Fact engine (pure). Enumerates facts for the times-tables, owns the stable
// fact-key scheme, and checks answers. No UI, no storage.
// ────────────────────────────────────────────────────────────────────────────

import { FACTOR_MAX, FACTOR_MIN } from "../config";
import type { Fact, Op, Problem } from "./types";

export const GLYPH: Record<Op, string> = {
  mul: "×", // ×
  div: "÷", // ÷
};

/** Stable fact-key scheme: "7x8" for 7×8, "56d7" for 56÷7. */
export function factKey(a: number, b: number, op: Op): string {
  return op === "mul" ? `${a}x${b}` : `${a}d${b}`;
}

function makeMul(table: number, factor: number): Fact {
  const a = table;
  const b = factor;
  return { key: factKey(a, b, "mul"), a, b, op: "mul", answer: a * b, tableId: table };
}

function makeDiv(table: number, factor: number): Fact {
  // (table · factor) ÷ table = factor — no remainders, ever.
  const a = table * factor;
  const b = table;
  return { key: factKey(a, b, "div"), a, b, op: "div", answer: factor, tableId: table };
}

/**
 * All facts for a single table: multiplication `table × n` and the matching
 * division `(table·n) ÷ table`, for n = FACTOR_MIN..FACTOR_MAX.
 */
export function factsForTable(table: number): Fact[] {
  const facts: Fact[] = [];
  for (let n = FACTOR_MIN; n <= FACTOR_MAX; n++) {
    facts.push(makeMul(table, n));
    facts.push(makeDiv(table, n));
  }
  return facts;
}

/** Build the active pool of facts from a set of tables (mixed × and ÷). */
export function buildFactPool(tables: number[]): Fact[] {
  return tables.flatMap(factsForTable);
}

/** Wrap a fact for presentation. */
export function toProblem(fact: Fact): Problem {
  return { fact, glyph: GLYPH[fact.op] };
}

/** Answer checking — the one source of truth for "is this right?". */
export function isCorrect(fact: Fact, value: number): boolean {
  return Number.isFinite(value) && value === fact.answer;
}
