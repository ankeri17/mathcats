// Settings — a minimal, on-brand surface. Sound, and the opt-in Challenge mode.
// (A fuller settings screen is a later phase.)
import { useNavigate } from "react-router-dom";
import { CHALLENGE_SECONDS } from "../../config";
import { useApp } from "../../state/AppState";
import { Toggle } from "../components/Toggle";

export function Settings() {
  const { save, setMuted, setChallengeMode } = useApp();
  const navigate = useNavigate();
  const muted = save?.profile.settings.muted ?? false;
  const challenge = save?.profile.settings.challengeMode ?? false;

  return (
    <div className="screen">
      <div className="topbar">
        <button className="icon-btn" aria-label="Back to the den" onClick={() => navigate("/")}>
          ‹
        </button>
        <span />
        <span />
      </div>

      <h1 style={{ fontSize: 28, marginTop: 8 }}>Settings</h1>

      <div className="settings-list">
        <div className="settings-row">
          <div>
            <div className="settings-row__title">Sound</div>
            <div className="settings-row__sub">Gentle effects during play.</div>
          </div>
          <Toggle on={!muted} onChange={(on) => setMuted(!on)} label="Sound" />
        </div>

        <div className="settings-row">
          <div>
            <div className="settings-row__title">Challenge mode</div>
            <div className="settings-row__sub">
              Add a calm {CHALLENGE_SECONDS}-second timer for a speed bonus. Running
              out of time is fine — the problem just keeps going.
            </div>
          </div>
          <Toggle on={challenge} onChange={setChallengeMode} label="Challenge mode" />
        </div>
      </div>

      <div className="den-spacer" />
    </div>
  );
}
