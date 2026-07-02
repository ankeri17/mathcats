import { describe, expect, it } from "vitest";
import { boxOf, initSelector, selectNext, type SelectorState } from "./adaptiveSelector";
import { buildFactPool, factsForTable } from "./facts";
import { masteredStat, masterTable, seededRng, strugglingStat } from "../testing/helpers";
import type { Fact, FactStat } from "./types";

function drawMany(
  n: number,
  pool: Fact[],
  front: Set<number>,
  stats: Record<string, FactStat>,
  seed = 42,
): string[] {
  const rng = seededRng(seed);
  let state: SelectorState = initSelector();
  const keys: string[] = [];
  for (let i = 0; i < n; i++) {
    const res = selectNext({ pool, front, stats, state, rng });
    state = res.state;
    keys.push(res.problem.fact.key);
  }
  return keys;
}

describe("boxOf", () => {
  it("classifies stats into Leitner boxes", () => {
    const f = factsForTable(7)[0];
    expect(boxOf(undefined)).toBe("new");
    expect(boxOf(strugglingStat(f))).toBe("struggling");
    expect(boxOf(masteredStat(f))).toBe("mastered");
    expect(boxOf({ ...strugglingStat(f), streak: 1 })).toBe("learning");
  });
});

describe("selectNext", () => {
  const pool7 = buildFactPool([7]);
  const front7 = new Set([7]);

  it("never repeats a fact back-to-back (fresh table)", () => {
    const keys = drawMany(80, pool7, front7, {});
    for (let i = 1; i < keys.length; i++) {
      expect(keys[i]).not.toBe(keys[i - 1]);
    }
  });

  it("mixes multiplication and division", () => {
    const keys = drawMany(60, pool7, front7, {});
    expect(keys.some((k) => k.includes("x"))).toBe(true);
    expect(keys.some((k) => k.includes("d"))).toBe(true);
  });

  it("over-serves a struggling fact", () => {
    const stats: Record<string, FactStat> = {
      "7x8": strugglingStat(pool7.find((f) => f.key === "7x8")!),
    };
    const keys = drawMany(2000, pool7, front7, stats, 7);
    const share = keys.filter((k) => k === "7x8").length / keys.length;
    expect(share).toBeGreaterThan(1 / pool7.length); // beats a uniform draw
  });

  it("stops re-testing mastered facts while the front still has weak ones", () => {
    const stats: Record<string, FactStat> = {};
    // Master everything in table 7 except four facts.
    const weak = new Set(["7x8", "7x9", "56d7", "63d7"]);
    for (const f of pool7) {
      if (!weak.has(f.key)) stats[f.key] = masteredStat(f);
    }
    const keys = drawMany(200, pool7, front7, stats);
    const masteredServed = keys.filter((k) => !weak.has(k));
    expect(masteredServed).toHaveLength(0);
  });

  it("widens rather than repeating when one weak fact remains (interleave rule)", () => {
    const stats: Record<string, FactStat> = {};
    for (const f of pool7) {
      if (f.key !== "7x8") stats[f.key] = masteredStat(f);
    }
    const keys = drawMany(60, pool7, front7, stats);
    for (let i = 1; i < keys.length; i++) {
      expect(keys[i]).not.toBe(keys[i - 1]);
    }
    // The weak fact still gets plenty of attention…
    expect(keys.filter((k) => k === "7x8").length).toBeGreaterThan(5);
  });

  it("folds in review of earlier mastered tables", () => {
    const stats = masterTable(7, {});
    const pool = buildFactPool([7, 2]);
    const keys = drawMany(300, pool, new Set([2]), stats);
    const reviewServed = keys.filter((k) => {
      const f = pool.find((p) => p.key === k)!;
      return f.tableId === 7;
    });
    expect(reviewServed.length).toBeGreaterThan(0); // due review resurfaces 7s
    expect(reviewServed.length).toBeLessThan(keys.length / 2); // …as a minority
  });

  it("throws on an empty pool", () => {
    expect(() =>
      selectNext({ pool: [], front: new Set(), stats: {}, state: initSelector() }),
    ).toThrow();
  });
});
