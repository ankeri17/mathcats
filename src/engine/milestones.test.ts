import { describe, expect, it } from "vitest";
import { allStarsMilestone, divisionMilestone } from "./milestones";
import { factsForTable } from "./facts";
import { masteredStat, strugglingStat } from "../testing/helpers";
import type { FactStat } from "./types";
import { PROGRESSION_ORDER } from "../config";

describe("division milestone (cat_div)", () => {
  it("stays locked until division is practiced", () => {
    expect(divisionMilestone({}).unlocked).toBe(false);
  });

  it("unlocks on the first division attempt", () => {
    const div = factsForTable(7).find((f) => f.op === "div")!;
    const state = divisionMilestone({ [div.key]: strugglingStat(div) });
    expect(state.unlocked).toBe(true);
    expect(state.mastered).toBe(false);
  });

  it("masters when every division fact across all tables is mastered", () => {
    const facts: Record<string, FactStat> = {};
    for (const t of PROGRESSION_ORDER) {
      for (const f of factsForTable(t).filter((f) => f.op === "div")) {
        facts[f.key] = masteredStat(f);
      }
    }
    const state = divisionMilestone(facts);
    expect(state.mastered).toBe(true);
    expect(state.masteryPct).toBe(100);
  });
});

describe("all-stars milestone (cat_all)", () => {
  it("stays locked until every table-cat is mastered", () => {
    expect(allStarsMilestone(() => false, false).unlocked).toBe(false);
  });

  it("unlocks when all tables are mastered and masters once division is too", () => {
    expect(allStarsMilestone(() => true, false)).toMatchObject({
      unlocked: true,
      mastered: false,
    });
    expect(allStarsMilestone(() => true, true).mastered).toBe(true);
  });
});
