// Problem display — the most-looked-at element. Large Lexend numerals.
// Three states: neutral (just the problem), correct (green, shows = answer),
// retry (shows = answer in violet so the player can re-enter it).
import type { Problem } from "../../engine/types";

export type ProblemState = "neutral" | "correct" | "retry";

interface Props {
  problem: Problem;
  state: ProblemState;
}

export function ProblemDisplay({ problem, state }: Props) {
  const { fact, glyph } = problem;
  const showAnswer = state === "correct" || state === "retry";
  const cls = `problem ${state === "correct" ? "problem--correct" : ""} ${
    state === "retry" ? "problem--retry" : ""
  }`.trim();

  return (
    <div className={cls} role="math" aria-label={`${fact.a} ${glyph} ${fact.b}`}>
      <span>
        {fact.a} {glyph} {fact.b}
      </span>
      {showAnswer && (
        <>
          {" = "}
          <span className="ans">{fact.answer}</span>
        </>
      )}
    </div>
  );
}
