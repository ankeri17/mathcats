// The Den — the home hub. Play stays unmissable. The clowder teaser now reflects
// real progression (the cats the engine has introduced). The full collection
// screen is still Phase 3; this is just a peek.
import { useNavigate } from "react-router-dom";
import { CatStage } from "../../cats/CatStage";
import { findById } from "../../cats/roster";
import { catIdForTable } from "../../data/store";
import { useApp } from "../../state/AppState";

const TOTAL_CATS = 13; // 11 table-cats + 2 milestone cats

function greeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function Den() {
  const { save, roster } = useApp();
  const navigate = useNavigate();
  const name = save?.profile.name ?? "friend";
  const sessions = save?.sessions.length ?? 0;

  // Discovered cats, in introduction order, then milestone cats.
  const order = [
    ...(save?.progress.introduced.map(catIdForTable) ?? []),
    "div",
    "all",
  ];
  const discovered = order
    .filter((id) => save?.cats[id])
    .map((id) => ({ progress: save!.cats[id], cat: findById(roster, id) }));
  const remaining = TOTAL_CATS - discovered.length;

  const todayLine =
    sessions === 0
      ? "Ready when you are — tap Play to start a round."
      : `${sessions} set${sessions === 1 ? "" : "s"} done · nice work`;

  return (
    <div className="screen">
      <div className="den-row">
        <div className="den-greeting">
          <p className="muted" style={{ fontSize: 14 }}>
            {greeting(new Date().getHours())}
          </p>
          <h1>Hi, {name}!</h1>
        </div>
        <button className="icon-btn" aria-label="Settings" onClick={() => navigate("/settings")}>
          ⚙
        </button>
      </div>

      <div className="today-card">
        <div className="label">Today</div>
        <div className="line">{todayLine}</div>
      </div>

      <button className="play-hero" onClick={() => navigate("/play")} aria-label="Play a round">
        <h2>Play</h2>
        <div className="sub">Practice multiplication and division.</div>
        <div className="peek" aria-hidden="true">
          <CatStage cat={discovered[0]?.cat ?? null} mood="happy" size={130} />
        </div>
      </button>

      <div className="section-head">
        <h3>Your cats</h3>
        <span className="count">
          {discovered.length} of {TOTAL_CATS}
        </span>
      </div>
      <div className="clowder-peek">
        {discovered.map(({ progress, cat }) => {
          const accent = cat?.accent ?? "var(--primary)";
          return (
            <div
              key={progress.catId}
              className="peek-card starter"
              style={{ ["--cat-accent" as string]: accent } as React.CSSProperties}
            >
              <CatStage cat={cat ?? null} mood="idle" size={72} />
              <div className="nm">{cat?.shortName ?? "Cat"}</div>
              <span className="tag tg">
                {progress.mastered ? "★ Mastered" : `${progress.masteryPct}%`}
              </span>
            </div>
          );
        })}
        {remaining > 0 && (
          <div className="peek-card locked">
            <CatStage cat={null} mood="idle" size={72} />
            <div className="nm">???</div>
            <span className="muted tg" style={{ fontSize: 11 }}>
              +{remaining} to find
            </span>
          </div>
        )}
      </div>

      <div className="den-spacer" />

      <nav className="bottom-nav">
        <div className="nav-item on">
          <span className="ic">🏠</span>
          Den
        </div>
        <button className="nav-item" onClick={() => navigate("/cats")}>
          <span className="ic">🐾</span>
          My Cats
        </button>
        <button className="nav-item" onClick={() => navigate("/soon")}>
          <span className="ic">📊</span>
          Progress
        </button>
      </nav>
    </div>
  );
}
