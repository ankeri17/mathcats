import { describe, expect, it } from "vitest";
import { SCHEMA_VERSION, migrate, type SaveData } from "./schema";
import { STARTER_TABLE } from "../config";
import { masterTable } from "../testing/helpers";

function v1Save(overrides: Partial<SaveData> = {}): unknown {
  return {
    schemaVersion: 1,
    profile: {
      id: "p1",
      name: "Wren",
      createdAt: "2025-01-01T00:00:00.000Z",
      settings: { inputMode: "numpad", activeTables: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
    },
    facts: {},
    cats: {},
    sessions: [],
    ...overrides,
  };
}

describe("migrate", () => {
  it("rejects garbage and saves without a profile", () => {
    expect(migrate(null)).toBeNull();
    expect(migrate("nope")).toBeNull();
    expect(migrate({ schemaVersion: 1 })).toBeNull();
  });

  it("upgrades a v1 save to the current version with seeded progression", () => {
    const out = migrate(v1Save());
    expect(out).not.toBeNull();
    expect(out!.schemaVersion).toBe(SCHEMA_VERSION);
    expect(out!.progress.introduced).toContain(STARTER_TABLE);
    expect(out!.profile.name).toBe("Wren");
  });

  it("keeps existing mastery so returning players are not re-walled", () => {
    const facts = masterTable(7, {});
    const out = migrate(v1Save({ facts }));
    expect(out!.facts["7x8"]?.mastered).toBe(true);
    // A mastered starter table means progression should already reach past it.
    expect(out!.progress.introduced.length).toBeGreaterThan(1);
  });

  it("passes a current-version save through unchanged in substance", () => {
    const current = migrate(v1Save())!;
    const again = migrate(current)!;
    expect(again.progress).toEqual(current.progress);
    expect(again.schemaVersion).toBe(SCHEMA_VERSION);
  });
});
