// ────────────────────────────────────────────────────────────────────────────
// Milestone cats (pure). The two special cats that aren't tied to a single
// table. Defined as small trigger functions over fact stats + table-mastery.
//   cat_div  — appears once the child has practiced division; masters when every
//              division fact across all tables is mastered.
//   cat_all  — appears when all 11 table-cats are mastered; masters when, on top
//              of that, the division milestone is mastered too.
// ────────────────────────────────────────────────────────────────────────────

import { PROGRESSION_ORDER } from "../config";
import { factsForTable } from "./facts";
import type { FactStat } from "./types";

export interface MilestoneState {
  unlocked: boolean;
  mastered: boolean;
  masteryPct: number; // 0–100, for the ring in Phase 3
}

const ALL_DIV_FACTS = PROGRESSION_ORDER.flatMap((t) =>
  factsForTable(t).filter((f) => f.op === "div"),
);

export function divisionMilestone(facts: Record<string, FactStat>): MilestoneState {
  const practiced = Object.values(facts).some((s) => s.op === "div" && s.attempts > 0);
  const masteredCount = ALL_DIV_FACTS.filter((f) => facts[f.key]?.mastered).length;
  const pct = ALL_DIV_FACTS.length
    ? Math.round((masteredCount / ALL_DIV_FACTS.length) * 100)
    : 0;
  return { unlocked: practiced, mastered: pct === 100, masteryPct: pct };
}

export function allStarsMilestone(
  isTableMastered: (tableId: number) => boolean,
  divisionMastered: boolean,
): MilestoneState {
  const masteredCount = PROGRESSION_ORDER.filter(isTableMastered).length;
  const pct = Math.round((masteredCount / PROGRESSION_ORDER.length) * 100);
  const allTablesMastered = masteredCount === PROGRESSION_ORDER.length;
  return {
    unlocked: allTablesMastered,
    mastered: allTablesMastered && divisionMastered,
    masteryPct: pct,
  };
}
