import { describe, expect, it } from "vitest";
import { FACTOR_MAX, FACTOR_MIN } from "../config";
import { buildFactPool, factKey, factsForTable, isCorrect, toProblem } from "./facts";

const FACTS_PER_TABLE = (FACTOR_MAX - FACTOR_MIN + 1) * 2; // mul + div per factor

describe("fact enumeration", () => {
  it("enumerates mul + div facts for a table", () => {
    const facts = factsForTable(7);
    expect(facts).toHaveLength(FACTS_PER_TABLE);
    expect(facts.filter((f) => f.op === "mul")).toHaveLength(FACTS_PER_TABLE / 2);
    expect(facts.filter((f) => f.op === "div")).toHaveLength(FACTS_PER_TABLE / 2);
  });

  it("uses the stable key scheme (7x8 / 56d7)", () => {
    const facts = factsForTable(7);
    const mul = facts.find((f) => f.key === "7x8");
    const div = facts.find((f) => f.key === "56d7");
    expect(mul).toMatchObject({ a: 7, b: 8, op: "mul", answer: 56, tableId: 7 });
    expect(div).toMatchObject({ a: 56, b: 7, op: "div", answer: 8, tableId: 7 });
    expect(factKey(7, 8, "mul")).toBe("7x8");
    expect(factKey(56, 7, "div")).toBe("56d7");
  });

  it("division facts never have remainders", () => {
    for (const table of [2, 7, 12]) {
      for (const f of factsForTable(table).filter((f) => f.op === "div")) {
        expect(f.a % f.b).toBe(0);
      }
    }
  });

  it("builds a pool across tables", () => {
    expect(buildFactPool([2, 7])).toHaveLength(FACTS_PER_TABLE * 2);
  });
});

describe("answer checking", () => {
  const fact = factsForTable(7).find((f) => f.key === "7x8")!;

  it("accepts the right answer and rejects wrong ones", () => {
    expect(isCorrect(fact, 56)).toBe(true);
    expect(isCorrect(fact, 55)).toBe(false);
    expect(isCorrect(fact, NaN)).toBe(false);
  });

  it("wraps facts with a display glyph", () => {
    expect(toProblem(fact).glyph).toBe("×");
    const div = factsForTable(7).find((f) => f.op === "div")!;
    expect(toProblem(div).glyph).toBe("÷");
  });
});
