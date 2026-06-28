// ────────────────────────────────────────────────────────────────────────────
// Progression (pure). Leads the child through tables in a sensible order via a
// moving "front" of 1–2 active tables, advancing fast past tables already known.
// No UI, no storage — operates on the fact stats and an ordered `introduced`
// list, and returns the new list / the current front.
// ────────────────────────────────────────────────────────────────────────────

import {
  ACTIVE_FRONT,
  ADVANCE_AT,
  PROGRESSION_MODE,
  PROGRESSION_ORDER,
  STARTER_TABLE,
} from "../config";
import { factsForTable } from "./facts";
import { masteryPct } from "./mastery";
import type { FactStat } from "./types";

type Facts = Record<string, FactStat>;

/** Mastery of a whole table, 0–100. */
export function tableMasteryPct(tableId: number, facts: Facts): number {
  return masteryPct(factsForTable(tableId), facts);
}

export function tableMastered(tableId: number, facts: Facts): boolean {
  return tableMasteryPct(tableId, facts) === 100;
}

/** The next table to introduce: first in progression order not yet introduced. */
function nextTable(introduced: number[]): number | undefined {
  return PROGRESSION_ORDER.find((t) => !introduced.includes(t));
}

/**
 * Grow `introduced` according to the active mode. Introduces as many tables as
 * the rules allow this pass (so a child who already knows several blows through
 * them), never exceeding the front cap for "paced"/"strict".
 */
export function reconcileIntroduced(introduced: number[], facts: Facts): number[] {
  const result = [...introduced];

  if (PROGRESSION_MODE === "open") {
    for (const t of PROGRESSION_ORDER) if (!result.includes(t)) result.push(t);
    return result;
  }

  const frontCap = PROGRESSION_MODE === "strict" ? 1 : ACTIVE_FRONT;
  const threshold = PROGRESSION_MODE === "strict" ? 1 : ADVANCE_AT;

  // Bounded loop — there are only ever 11 tables to introduce.
  for (let guard = 0; guard < PROGRESSION_ORDER.length + 1; guard++) {
    const next = nextTable(result);
    if (next === undefined) break;

    const unmastered = result.filter((t) => !tableMastered(t, facts));
    if (unmastered.length >= frontCap) break;

    const lead = result[result.length - 1];
    const leadReady = lead === undefined || tableMasteryPct(lead, facts) / 100 >= threshold;

    if (unmastered.length === 0 || leadReady) result.push(next);
    else break;
  }

  return result;
}

/**
 * The current front: the most-recently-introduced not-yet-mastered tables
 * (capped). If everything introduced is mastered, the newest tables stand in so
 * there's always something to practice.
 */
export function computeFront(introduced: number[], facts: Facts): number[] {
  const unmastered = introduced.filter((t) => !tableMastered(t, facts));
  const base = unmastered.length > 0 ? unmastered : introduced;
  const cap = PROGRESSION_MODE === "strict" ? 1 : ACTIVE_FRONT;
  return base.slice(-cap);
}

/** The single table currently most in focus (drives the on-screen companion). */
export function frontLead(introduced: number[], facts: Facts): number {
  const front = computeFront(introduced, facts);
  return front[front.length - 1] ?? STARTER_TABLE;
}

/**
 * Seed `introduced` for a save that doesn't have it yet (fresh profile or a
 * Phase 1 migration): always the starter, plus any table already known, then
 * reconciled so a returning child advances rather than being re-walled.
 */
export function seedIntroduced(facts: Facts): number[] {
  if (PROGRESSION_MODE === "open") return [...PROGRESSION_ORDER];

  const known = PROGRESSION_ORDER.filter(
    (t) => tableMasteryPct(t, facts) / 100 >= ADVANCE_AT,
  );
  const ordered = [STARTER_TABLE, ...PROGRESSION_ORDER.filter((t) => t !== STARTER_TABLE && known.includes(t))];
  // De-dupe while preserving order.
  const seed = ordered.filter((t, i) => ordered.indexOf(t) === i);
  return reconcileIntroduced(seed, facts);
}
