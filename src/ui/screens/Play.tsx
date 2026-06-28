// Play — the core loop, now driven by the Phase 2 adaptive selector. The
// companion cat follows the table currently in focus; mastering a table or
// discovering a new cat fires a contained celebration beat. Still kind: no
// score, no penalty, no shaming. Supports an optional single-table focus mode.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CatStage, type CatReaction } from "../../cats/CatStage";
import { findByTable, findById } from "../../cats/roster";
import { buildFactPool, factsForTable, isCorrect } from "../../engine/facts";
import {
  initSelector,
  selectNext,
  type SelectorState,
} from "../../engine/adaptiveSelector";
import { computeFront, frontLead } from "../../engine/progression";
import type { Problem } from "../../engine/types";
import { CHALLENGE_SECONDS, SESSION_LENGTH, STARTER_TABLE } from "../../config";
import { useApp } from "../../state/AppState";
import { ProblemDisplay, type ProblemState } from "../components/ProblemDisplay";
import { NumberPad } from "../components/NumberPad";
import { SessionDots } from "../components/SessionDots";
import {
  DiscoveryOverlay,
  type DiscoveryKind,
} from "../components/DiscoveryOverlay";

type Phase = "await" | "correct" | "reinforce";
interface PendingDiscovery {
  catId: string;
  kind: DiscoveryKind;
}

function performanceNow(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

export function Play() {
  const { save, roster, recordAttempt, recordSession, setMuted } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const focusTable = (location.state as { focusTable?: number } | null)?.focusTable ?? null;

  const [problem, setProblem] = useState<Problem | null>(null);
  const [index, setIndex] = useState(0); // problems completed
  const [entry, setEntry] = useState("");
  const [phase, setPhase] = useState<Phase>("await");
  const [reaction, setReaction] = useState<CatReaction>(null);
  const [justFilled, setJustFilled] = useState(false);
  const [discovery, setDiscovery] = useState<PendingDiscovery | null>(null);

  // Challenge mode (opt-in, reward-only): a calm per-fact timer that only ever
  // adds a bonus. Running out of time penalizes nothing — play continues untimed.
  const challenge = save?.profile.settings.challengeMode ?? false;
  const [timedOut, setTimedOut] = useState(false);
  const [speedStreak, setSpeedStreak] = useState(0);
  const [bonus, setBonus] = useState(false);
  const challengeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Latest save without stale closures (introduced tables grow mid-session).
  const saveRef = useRef(save);
  saveRef.current = save;

  const selRef = useRef<SelectorState>(initSelector());
  const startedAt = useRef(new Date().toISOString());
  const shownAt = useRef<number>(performanceNow());
  const correctCount = useRef(0);
  const pendingRef = useRef<PendingDiscovery[]>([]);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const muted = save?.profile.settings.muted ?? false;

  // The companion cat follows the table in focus — this is what makes the cat
  // match the practice (the Phase 1 mismatch is gone).
  const displayTable = focusTable ?? (save ? frontLead(save.progress.introduced, save.facts) : STARTER_TABLE);
  const companion = useMemo(
    () => findByTable(roster, displayTable) ?? null,
    [roster, displayTable],
  );
  const catName = companion?.shortName ?? "Your cat";
  const accentStyle = companion
    ? ({ ["--cat-accent" as string]: companion.accent } as React.CSSProperties)
    : undefined;

  /** (Re)start the challenge countdown for a freshly shown problem. */
  const armChallenge = useCallback(() => {
    if (challengeTimer.current) clearTimeout(challengeTimer.current);
    setTimedOut(false);
    setBonus(false);
    const on = saveRef.current?.profile.settings.challengeMode ?? false;
    if (on) {
      challengeTimer.current = setTimeout(() => setTimedOut(true), CHALLENGE_SECONDS * 1000);
    }
  }, []);

  /** Build the selection inputs from the freshest save (or the focus table). */
  const pickNext = useCallback((): Problem => {
    const s = saveRef.current!;
    const pool = focusTable != null ? factsForTable(focusTable) : buildFactPool(s.progress.introduced);
    const front = new Set(focusTable != null ? [focusTable] : computeFront(s.progress.introduced, s.facts));
    const { problem: next, state } = selectNext({ pool, front, stats: s.facts, state: selRef.current });
    selRef.current = state;
    return next;
  }, [focusTable]);

  // Seed the first problem once.
  useEffect(() => {
    if (!saveRef.current) return;
    setProblem(pickNext());
    shownAt.current = performanceNow();
    armChallenge();
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      if (challengeTimer.current) clearTimeout(challengeTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goNext = useCallback(() => {
    setDiscovery(null);
    const completed = index + 1;
    if (completed >= SESSION_LENGTH) {
      recordSession({
        startedAt: startedAt.current,
        endedAt: new Date().toISOString(),
        attempted: SESSION_LENGTH,
        correct: correctCount.current,
        ...(focusTable != null ? { focusTable } : {}),
      });
      navigate("/summary", {
        replace: true,
        state: { attempted: SESSION_LENGTH, correct: correctCount.current },
      });
      return;
    }
    setProblem(pickNext());
    setIndex(completed);
    setEntry("");
    setPhase("await");
    setReaction(null);
    setJustFilled(false);
    shownAt.current = performanceNow();
    armChallenge();
  }, [index, navigate, pickNext, recordSession, focusTable, armChallenge]);

  /** Drain any queued discovery beats before advancing to the next problem. */
  const advance = useCallback(() => {
    const ev = pendingRef.current.shift();
    if (ev) setDiscovery(ev);
    else goNext();
  }, [goNext]);

  const submit = useCallback(() => {
    if (!problem || entry.length === 0) return;
    const value = parseInt(entry, 10);

    if (phase === "reinforce") {
      // Reinforcement: only the shown, correct answer advances. No new record.
      if (isCorrect(problem.fact, value)) advance();
      else setEntry("");
      return;
    }

    // First attempt — the recorded one. Stop the challenge countdown either way.
    const beatClock = challenge && !timedOut;
    if (challengeTimer.current) clearTimeout(challengeTimer.current);

    const ms = Math.round(performanceNow() - shownAt.current);
    const right = isCorrect(problem.fact, value);
    const { events } = recordAttempt({ fact: problem.fact, correct: right, ms, now: new Date().toISOString() });

    // Queue any discovery / level-up beats this attempt produced.
    pendingRef.current = [
      ...events.newCats.map((catId) => ({ catId, kind: "found" as const })),
      ...events.masteredCats.map((catId) => ({ catId, kind: "mastered" as const })),
    ];

    if (right) {
      correctCount.current += 1;
      if (challenge) {
        // Reward only: in-time grows the speed streak; out-of-time just resets
        // the bonus — never a penalty.
        if (beatClock) {
          setSpeedStreak((s) => s + 1);
          setBonus(true);
        } else {
          setSpeedStreak(0);
        }
      }
      setPhase("correct");
      setReaction("correct");
      setJustFilled(true);
      advanceTimer.current = setTimeout(advance, 1050);
    } else {
      if (challenge) setSpeedStreak(0);
      setPhase("reinforce");
      setReaction("incorrect");
      setEntry("");
    }
  }, [advance, challenge, timedOut, entry, phase, problem, recordAttempt]);

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
  const padEnabled = phase !== "correct" && !discovery;

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

      {focusTable != null && (
        <p className="cat-caption" style={{ marginTop: 4 }}>
          Practising {catName}&apos;s {focusTable}× table
        </p>
      )}

      {challenge && (
        <div className="challenge-bar-wrap" aria-hidden="true">
          {phase === "await" && !timedOut && (
            <div
              key={index}
              className="challenge-bar"
              style={{ animationDuration: `${CHALLENGE_SECONDS}s` }}
            />
          )}
        </div>
      )}
      {challenge && speedStreak > 0 && (
        <div className="speed-streak" role="status">
          ⚡ Speed streak {speedStreak}
        </div>
      )}

      <div className="play-body">
        <CatStage cat={companion} mood={catMood} reaction={reaction} size={150} />

        {phase === "await" && <p className="cat-caption">{catName} is watching</p>}
        {phase === "correct" && bonus && (
          <div className="banner banner--bonus">⚡ Speedy! {catName}&apos;s thrilled.</div>
        )}
        {phase === "correct" && !bonus && (
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

      {discovery && (
        <DiscoveryOverlay
          cat={findById(roster, discovery.catId) ?? null}
          kind={discovery.kind}
          onContinue={advance}
        />
      )}
    </div>
  );
}
