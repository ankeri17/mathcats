import { describe, expect, it } from "vitest";
import { ACTIVE_FRONT, PROGRESSION_ORDER, STARTER_TABLE } from "../config";
import {
  computeFront,
  frontLead,
  reconcileIntroduced,
  seedIntroduced,
  tableMastered,
  tableMasteryPct,
} from "./progression";
import { masterTable } from "../testing/helpers";
import type { FactStat } from "./types";

describe("paced progression", () => {
  it("does not advance while the only table is unmastered and below threshold", () => {
    expect(reconcileIntroduced([7], {})).toEqual([7]);
  });

  it("introduces the next table in order once the lead is mastered", () => {
    const facts = masterTable(7, {});
    const next = reconcileIntroduced([7], facts);
    expect(next[0]).toBe(7);
    expect(next).toContain(PROGRESSION_ORDER[0]); // 2 is first in order
    expect(tableMastered(7, facts)).toBe(true);
  });

  it("caps the number of unmastered tables at the front size", () => {
    const facts = masterTable(7, {});
    const introduced = reconcileIntroduced([7], facts);
    const unmastered = introduced.filter((t) => !tableMastered(t, facts));
    expect(unmastered.length).toBeLessThanOrEqual(ACTIVE_FRONT);
  });

  it("blows through tables the child already knows", () => {
    const facts: Record<string, FactStat> = {};
    masterTable(7, facts);
    masterTable(2, facts);
    masterTable(5, facts);
    const introduced = reconcileIntroduced([7], facts);
    // 2 and 5 are already known, so 10 (next in order) should be reachable.
    expect(introduced).toEqual(expect.arrayContaining([7, 2, 5, 10]));
  });
});

describe("front", () => {
  it("focuses the most recent unmastered tables", () => {
    const facts = masterTable(7, {});
    const introduced = reconcileIntroduced([7], facts);
    expect(computeFront(introduced, facts)).toEqual([PROGRESSION_ORDER[0]]);
  });

  it("frontLead falls back to the starter table", () => {
    expect(frontLead([], {})).toBe(STARTER_TABLE);
  });
});

describe("seedIntroduced (migration seed)", () => {
  it("seeds a fresh save with just the starter", () => {
    expect(seedIntroduced({})).toEqual([STARTER_TABLE]);
  });

  it("counts already-known tables so returning players are not re-walled", () => {
    const facts = masterTable(2, masterTable(7, {}));
    const seed = seedIntroduced(facts);
    expect(seed).toContain(STARTER_TABLE);
    expect(seed).toContain(2);
    expect(tableMasteryPct(2, facts)).toBe(100);
  });
});
