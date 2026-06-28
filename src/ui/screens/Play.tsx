// Play — the hero screen and the core loop. Three kind states: neutral (await),
// correct (delight beat), gentle retry (re-enter the shown answer once). No
// score, no penalty, no timer-as-punishment, no shaming.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CatStage, type CatReaction } from "../../cats/CatStage";
import { buildFactPool } from "../../engine/facts";
import { getNextProblem } from "../../engine/selector";
import type { Problem } from "../../engine/types";
import { isCorrect } from "../../engine/facts";
import { SESSION_LENGTH } from "../../config";
import { useApp } from "../../state/AppState";
import { ProblemDisplay, type ProblemState } from "../components/ProblemDisplay";
import { NumberPad } from "../components/NumberPad";
import { SessionDots } from "../components/SessionDots";

type Phase = "await" | "correct" | "reinforce";

export function Play() {
  const { save, starterCat, recordAttempt, recordSession, setMuted } = useApp();
  const navigate = useNavigate();

  const tables = save?.profile.settings.activeTables ?? [];
  const pool = useMemo(() => buildFactPool(tables), [tables]);

  const [problem, setProblem] = useState<Problem | null>(null);
  const [index, setIndex] = useState(0); // problems completed
  const [entry, setEntry] = useState("");
  const [phase, setPhase] = useState<Phase>("await");
  const [reaction, setReaction] = useState<CatReaction>(null);
  const [justFilled, setJustFilled] = useState(false);

  const startedAt = useRef(new Date().toISOString());
  const shownAt = useRef<number>(performanceNow());
  const correctCount = useRef(0);
  const lastKey = useRef<string | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const muted = save?.profile.settings.muted ?? false;
  const catName = starterCat?.shortName ?? "Your cat";
  const accentStyle = starterCat
    ? ({ ["--cat-accent" as string]: starterCat.accent } as React.CSSProperties)
    : undefined;

  // Seed the first problem.
  useEffect(() => {
    if (pool.length === 0) return;
    const first = getNextProblem(pool, null);
    lastKey.current = first.fact.key;
    setProblem(first);
    shownAt.current = performanceNow();
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool]);

  const goNext = useCallback(() => {
    const completed = index + 1;
    if (completed >= SESSION_LENGTH) {
      // End the session, write the record, hand off to the summary.
      recordSession({
        startedAt: startedAt.current,
        endedAt: new Date().toISOString(),
        attempted: SESSION_LENGTH,
        correct: correctCount.current,
      });
      navigate("/summary", {
        replace: true,
        state: { attempted: SESSION_LENGTH, correct: correctCount.current },
      });
      return;
    }
    const next = getNextProblem(pool, lastKey.current);
    lastKey.current = next.fact.key;
    setProblem(next);
    setIndex(completed);
    setEntry("");
    setPhase("await");
    setReaction(null);
    setJustFilled(false);
    shownAt.current = performanceNow();
  }, [index, navigate, pool, recordSession]);

  const submit = useCallback(() => {
    if (!problem || entry.length === 0) return;
    const value = parseInt(entry, 10);

    if (phase === "reinforce") {
      // Reinforcement: only the shown, correct answer advances. No new record.
      if (isCorrect(problem.fact, value)) {
        goNext();
      } else {
        setEntry(""); // gently clear; the answer is on screen to copy
      }
      return;
    }

    // First attempt — this is the one we record.
    const ms = Math.round(performanceNow() - shownAt.current);
    const right = isCorrect(problem.fact, value);
    recordAttempt({ fact: problem.fact, correct: right, ms, now: new Date().toISOString() });

    if (right) {
      correctCount.current += 1;
      setPhase("correct");
      setReaction("correct");
      setJustFilled(true);
      advanceTimer.current = setTimeout(goNext, 1050);
    } else {
      setPhase("reinforce");
      setReaction("incorrect");
      setEntry("");
    }
  }, [entry, goNext, phase, problem, recordAttempt]);

  if (!problem) {
    return (
      <div className="screen" style={accentStyle}>
        <p className="muted" style={{ margin: "auto" }}>Getting your set ready…</p>
      </div>
    );
  }

  const problemState: ProblemState =
    phase === "correct" ? "correct" : phase === "reinforce" ? "retry" : "neutral";
  const catMood = phase === "correct" ? "happy" : "idle";
  const padEnabled = phase !== "correct";

  return (
    <div className="screen" style={accentStyle}>
      <div className="topbar">
        <button className="icon-btn" aria-label="Back to the den" onClick={() => navigate("/")}>
          ‹
        </button>
        <SessionDots total={SESSION_LENGTH} done={index} justFilled={justFilled} />
        <button
          className="icon-btn"
          aria-label={muted ? "Unmute" : "Mute"}
          onClick={() => setMuted(!muted)}
        >
          {muted ? "🔇" : "♪"}
        </button>
      </div>

      <div className="play-body">
        <CatStage cat={starterCat} mood={catMood} reaction={reaction} size={150} />

        {phase === "await" && <p className="cat-caption">{catName} is watching</p>}
        {phase === "correct" && (
          <div className="banner banner--correct">Nice. {catName}&apos;s impressed.</div>
        )}
        {phase === "reinforce" && (
          <div className="banner banner--retry">
            Not quite — {problem.fact.a} {problem.glyph} {problem.fact.b} is{" "}
            <span className="ans">{problem.fact.answer}</span>. Try it once.
          </div>
        )}

        <ProblemDisplay problem={problem} state={problemState} />

        <div
          className={`answer ${phase === "correct" ? "answer--correct" : ""}`}
          aria-live="polite"
        >
          {entry === "" ? (
            phase === "correct" ? (
              ""
            ) : (
              <span className="caret" />
            )
          ) : (
            <span>
              {entry}
              {phase === "correct" ? " ✓" : <span className="caret" />}
            </span>
          )}
        </div>
      </div>

      <div className="play-foot">
        <NumberPad
          enabled={padEnabled}
          canEnter={entry.length > 0}
          onDigit={(d) => setEntry((e) => (e.length < 4 ? e + d : e))}
          onBackspace={() => setEntry((e) => e.slice(0, -1))}
          onEnter={submit}
        />
      </div>
    </div>
  );
}

/** performance.now() with a safe fallback. */
function performanceNow(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}
