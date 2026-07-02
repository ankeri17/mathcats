// Play — the hero screen. Purely presentational: all session logic lives in
// usePlaySession. Three kind states: neutral (await), correct (delight beat),
// gentle retry (never shaming). No score, no penalty, no punitive timer.
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CatStage } from "../../cats/CatStage";
import { findByTable, findById } from "../../cats/roster";
import { catAccentStyle } from "../../cats/theme";
import { CHALLENGE_SECONDS, SESSION_LENGTH } from "../../config";
import { useApp } from "../../state/AppState";
import { ProblemDisplay, type ProblemState } from "../components/ProblemDisplay";
import { NumberPad } from "../components/NumberPad";
import { SessionDots } from "../components/SessionDots";
import { DiscoveryOverlay } from "../components/DiscoveryOverlay";
import { usePlaySession } from "./usePlaySession";

export function Play() {
  const { save, roster, setMuted } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const focusTable =
    (location.state as { focusTable?: number } | null)?.focusTable ?? null;

  const s = usePlaySession(focusTable);

  const muted = save?.profile.settings.muted ?? false;
  const companion = useMemo(
    () => findByTable(roster, s.companionTable) ?? null,
    [roster, s.companionTable],
  );
  const catName = companion?.shortName ?? "Your cat";
  const accentStyle = catAccentStyle(companion);

  if (!s.problem) {
    return (
      <div className="screen screen--play" style={accentStyle}>
        <p className="muted" style={{ margin: "auto" }}>
          Getting your set ready…
        </p>
      </div>
    );
  }

  const problemState: ProblemState =
    s.phase === "correct" ? "correct" : s.phase === "reinforce" ? "retry" : "neutral";
  const catMood = s.phase === "correct" ? "happy" : "idle";
  const padEnabled = s.phase !== "correct" && !s.discovery;

  return (
    <div className="screen screen--play" style={accentStyle}>
      <div className="topbar">
        <button className="icon-btn" aria-label="Back to the den" onClick={() => navigate("/")}>
          ‹
        </button>
        <SessionDots total={SESSION_LENGTH} done={s.index} justFilled={s.justFilled} />
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

      {s.challenge && (
        <div className="challenge-bar-wrap" aria-hidden="true">
          {s.phase === "await" && !s.timedOut && (
            <div
              key={s.index}
              className="challenge-bar"
              style={{ animationDuration: `${CHALLENGE_SECONDS}s` }}
            />
          )}
        </div>
      )}
      {s.challenge && s.speedStreak > 0 && (
        <div className="speed-streak" role="status">
          ⚡ Speed streak {s.speedStreak}
        </div>
      )}

      <div className="play-body">
        <CatStage cat={companion} mood={catMood} reaction={s.reaction} size={116} />

        {s.phase === "await" && <p className="cat-caption">{catName} is watching</p>}
        {s.phase === "correct" && s.bonus && (
          <div className="banner banner--bonus">⚡ Speedy! {catName}&apos;s thrilled.</div>
        )}
        {s.phase === "correct" && !s.bonus && (
          <div className="banner banner--correct">Nice. {catName}&apos;s impressed.</div>
        )}
        {s.phase === "reinforce" && (
          <div className="banner banner--retry">
            Not quite — {s.problem.fact.a} {s.problem.glyph} {s.problem.fact.b} is{" "}
            <span className="ans">{s.problem.fact.answer}</span>. Try it once.
          </div>
        )}

        <ProblemDisplay problem={s.problem} state={problemState} />

        <div
          className={`answer ${s.phase === "correct" ? "answer--correct" : ""}`}
          aria-live="polite"
        >
          {s.entry === "" ? (
            s.phase === "correct" ? (
              ""
            ) : (
              <span className="caret" />
            )
          ) : (
            <span>
              {s.entry}
              {s.phase === "correct" ? " ✓" : <span className="caret" />}
            </span>
          )}
        </div>
      </div>

      <div className="play-foot">
        <NumberPad
          enabled={padEnabled}
          canEnter={s.entry.length > 0}
          onDigit={s.onDigit}
          onBackspace={s.onBackspace}
          onEnter={s.submit}
        />
      </div>

      {s.discovery && (
        <DiscoveryOverlay
          cat={findById(roster, s.discovery.catId) ?? null}
          kind={s.discovery.kind}
          onContinue={s.continueFromDiscovery}
        />
      )}
    </div>
  );
}
