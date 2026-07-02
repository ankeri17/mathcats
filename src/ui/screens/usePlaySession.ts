// ────────────────────────────────────────────────────────────────────────────
// usePlaySession — the Play screen's state machine, extracted so the component
// stays presentational. Owns: problem selection (adaptive or single-table
// focus), the answer entry, the three kind phases (await → correct/reinforce),
// the challenge timer (reward-only), the discovery/level-up queue, and session
// completion. The view renders what this returns; it makes no decisions.
// ────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { CatReaction } from "../../cats/CatStage";
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
import { useSounds } from "../useSounds";
import type { DiscoveryKind } from "../components/DiscoveryOverlay";

export type PlayPhase = "await" | "correct" | "reinforce";

export interface PendingDiscovery {
  catId: string;
  kind: DiscoveryKind;
}

function performanceNow(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

export function usePlaySession(focusTable: number | null) {
  const { save, recordAttempt, recordSession } = useApp();
  const navigate = useNavigate();
  const sounds = useSounds();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [index, setIndex] = useState(0); // problems completed
  const [entry, setEntry] = useState("");
  const [phase, setPhase] = useState<PlayPhase>("await");
  const [reaction, setReaction] = useState<CatReaction>(null);
  const [justFilled, setJustFilled] = useState(false);
  const [discovery, setDiscovery] = useState<PendingDiscovery | null>(null);

  // Challenge mode (opt-in, reward-only): a calm per-fact timer that only ever
  // adds a bonus. Running out of time penalizes nothing — play continues untimed.
  const challenge = save?.profile.settings.challengeMode ?? false;
  const [timedOut, setTimedOut] = useState(false);
  const [speedStreak, setSpeedStreak] = useState(0);
  const [bonus, setBonus] = useState(false);

  // Latest save without stale closures (introduced tables grow mid-session).
  // Updated in an effect (not during render) per the react-hooks refs rule; all
  // readers are event handlers/timeouts, which run after effects have flushed.
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  const selRef = useRef<SelectorState>(initSelector());
  const startedAt = useRef(new Date().toISOString());
  const shownAt = useRef<number>(performanceNow());
  const correctCount = useRef(0);
  const pendingRef = useRef<PendingDiscovery[]>([]);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const challengeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The companion cat follows the table in focus, so the cat always matches the
  // practice.
  const companionTable =
    focusTable ??
    (save ? frontLead(save.progress.introduced, save.facts) : STARTER_TABLE);

  /** (Re)start the challenge countdown for a freshly shown problem. */
  const armChallenge = useCallback(() => {
    if (challengeTimer.current) clearTimeout(challengeTimer.current);
    setTimedOut(false);
    setBonus(false);
    const on = saveRef.current?.profile.settings.challengeMode ?? false;
    if (on) {
      challengeTimer.current = setTimeout(
        () => setTimedOut(true),
        CHALLENGE_SECONDS * 1000,
      );
    }
  }, []);

  /** Build the selection inputs from the freshest save (or the focus table). */
  const pickNext = useCallback((): Problem => {
    const s = saveRef.current!;
    const pool =
      focusTable != null ? factsForTable(focusTable) : buildFactPool(s.progress.introduced);
    const front = new Set(
      focusTable != null ? [focusTable] : computeFront(s.progress.introduced, s.facts),
    );
    const { problem: next, state } = selectNext({
      pool,
      front,
      stats: s.facts,
      state: selRef.current,
    });
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
    // Mount-only by design: a session seeds once; pickNext/armChallenge read
    // fresh state through refs.
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
    if (ev) {
      setDiscovery(ev);
      sounds.discovery();
    } else {
      goNext();
    }
  }, [goNext, sounds]);

  const submit = useCallback(() => {
    if (!problem || entry.length === 0) return;
    const value = parseInt(entry, 10);

    if (phase === "reinforce") {
      // Reinforcement: only the shown, correct answer advances. No new record.
      if (isCorrect(problem.fact, value)) advance();
      else setEntry(""); // gently clear; the answer is on screen to copy
      return;
    }

    // First attempt — the recorded one. Stop the challenge countdown either way.
    const beatClock = challenge && !timedOut;
    if (challengeTimer.current) clearTimeout(challengeTimer.current);

    const ms = Math.round(performanceNow() - shownAt.current);
    const right = isCorrect(problem.fact, value);
    const { events } = recordAttempt({
      fact: problem.fact,
      correct: right,
      ms,
      now: new Date().toISOString(),
    });

    // Queue any discovery / level-up beats this attempt produced.
    pendingRef.current = [
      ...events.newCats.map((catId) => ({ catId, kind: "found" as const })),
      ...events.masteredCats.map((catId) => ({ catId, kind: "mastered" as const })),
    ];

    if (right) {
      correctCount.current += 1;
      const speedy = challenge && beatClock;
      if (challenge) {
        // Reward only: in-time grows the speed streak; out-of-time just resets
        // the bonus — never a penalty.
        if (speedy) {
          setSpeedStreak((s) => s + 1);
          setBonus(true);
        } else {
          setSpeedStreak(0);
        }
      }
      if (speedy) sounds.bonus();
      else sounds.correct();
      setPhase("correct");
      setReaction("correct");
      setJustFilled(true);
      advanceTimer.current = setTimeout(advance, 1050);
    } else {
      // Kind retry — and deliberately no sound: audio never marks a miss.
      if (challenge) setSpeedStreak(0);
      setPhase("reinforce");
      setReaction("incorrect");
      setEntry("");
    }
  }, [advance, challenge, timedOut, entry, phase, problem, recordAttempt, sounds]);

  const onDigit = useCallback(
    (d: string) => setEntry((e) => (e.length < 4 ? e + d : e)),
    [],
  );
  const onBackspace = useCallback(() => setEntry((e) => e.slice(0, -1)), []);

  return {
    problem,
    index,
    entry,
    phase,
    reaction,
    justFilled,
    discovery,
    challenge,
    timedOut,
    speedStreak,
    bonus,
    companionTable,
    onDigit,
    onBackspace,
    submit,
    /** Continue past the current discovery overlay (drains the queue). */
    continueFromDiscovery: advance,
  };
}
