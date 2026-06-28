// ────────────────────────────────────────────────────────────────────────────
// Problem selector (pure). Phase 1 keeps this deliberately plain: pick a random
// fact from the active set, avoiding an immediate repeat. Weighted / spaced-
// repetition selection is Phase 2 — do not add it here.
// ────────────────────────────────────────────────────────────────────────────

import type { Fact, Problem } from "./types";
import { toProblem } from "./facts";

/**
 * Pick the next problem from `pool`, avoiding `lastKey` (the fact just shown) so
 * the player never gets the exact same fact twice in a row.
 *
 * `rng` is injectable for testing; defaults to Math.random.
 */
export function getNextProblem(
  pool: Fact[],
  lastKey: string | null = null,
  rng: () => number = Math.random,
): Problem {
  if (pool.length === 0) {
    throw new Error("getNextProblem: fact pool is empty");
  }

  const candidates =
    pool.length > 1 && lastKey !== null
      ? pool.filter((f) => f.key !== lastKey)
      : pool;

  const choice = candidates[Math.floor(rng() * candidates.length)];
  return toProblem(choice);
}
