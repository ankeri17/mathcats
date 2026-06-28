// The Den — the home hub. One job above all: make Play unmissable. A mini
// clowder teaser shows the starter cat (the full collection screen is Phase 3).
import { useNavigate } from "react-router-dom";
import { CatStage } from "../../cats/CatStage";
import { useApp } from "../../state/AppState";

function greeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function Den() {
  const { save, starterCat, setMuted } = useApp();
  const navigate = useNavigate();
  const name = save?.profile.name ?? "friend";
  const muted = save?.profile.settings.muted ?? false;
  const sessions = save?.sessions.length ?? 0;

  const accentStyle = starterCat
    ? ({ ["--cat-accent" as string]: starterCat.accent } as React.CSSProperties)
    : undefined;

  const todayLine =
    sessions === 0 ? "Your first set awaits" : `${sessions} set${sessions === 1 ? "" : "s"} done · nice work`;

  return (
    <div className="screen" style={accentStyle}>
      <div className="den-row">
        <div className="den-greeting">
          <p className="muted" style={{ fontSize: 14 }}>
            {greeting(new Date().getHours())}
          </p>
          <h1>Hi, {name}</h1>
        </div>
        <button
          className="icon-btn"
          aria-label={muted ? "Unmute" : "Mute"}
          aria-pressed={muted}
          onClick={() => setMuted(!muted)}
        >
          {muted ? "🔇" : "🔊"}
        </button>
      </div>

      <div className="today-card">
        <div className="label">Today</div>
        <div className="line">{todayLine}</div>
      </div>

      <button className="play-hero" onClick={() => navigate("/play")} aria-label="Play a short set">
        <h2>Play</h2>
        <div className="sub">A short set · ~2 min</div>
        <div className="peek" aria-hidden="true">
          <CatStage cat={starterCat} mood="happy" size={130} />
        </div>
      </button>

      <div className="section-head">
        <h3>Your clowder</h3>
        <span className="count">1 of 13</span>
      </div>
      <div className="clowder-peek">
        <div className="peek-card starter">
          <CatStage cat={starterCat} mood="idle" size={72} />
          <div className="nm">{starterCat?.shortName ?? "Cat"}</div>
          <span className="tag tg">7× table</span>
        </div>
        <div className="peek-card locked">
          <CatStage cat={null} mood="idle" size={72} />
          <div className="nm">???</div>
          <span className="muted tg" style={{ fontSize: 11 }}>
            Undiscovered
          </span>
        </div>
        <div className="peek-card locked">
          <CatStage cat={null} mood="idle" size={72} />
          <div className="nm">???</div>
          <span className="muted tg" style={{ fontSize: 11 }}>
            Undiscovered
          </span>
        </div>
      </div>

      <div className="den-spacer" />

      <nav className="bottom-nav">
        <div className="nav-item on">
          <span className="ic">🏠</span>
          Den
        </div>
        <button className="nav-item" onClick={() => navigate("/soon")}>
          <span className="ic">🐾</span>
          Clowder
        </button>
        <button className="nav-item" onClick={() => navigate("/soon")}>
          <span className="ic">📊</span>
          Progress
        </button>
      </nav>
    </div>
  );
}
