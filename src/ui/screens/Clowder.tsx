// The Clowder — the collection screen, the one a kid opens just to look at their
// cats. Reads entirely from CatProgress (Phase 2 maintains it); computes no new
// mastery. A 2-column grid of all 13 cats with the discovered/in-progress/
// mastered filter; milestone cats are set apart.
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Cat } from "../../cats/roster";
import { catIdForTable } from "../../data/store";
import { useApp } from "../../state/AppState";
import { CatCard } from "../components/CatCard";
import { MasteryRing } from "../components/MasteryRing";

type Filter = "all" | "progress" | "mastered";

export function Clowder() {
  const { save, roster } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("all");

  const catId = (cat: Cat) => (cat.isMilestone ? cat.id : catIdForTable(cat.tableId!));

  const tableCats = useMemo(
    () =>
      roster
        .filter((c) => !c.isMilestone)
        .sort((a, b) => (a.tableId ?? 0) - (b.tableId ?? 0)),
    [roster],
  );
  const milestoneCats = useMemo(() => roster.filter((c) => c.isMilestone), [roster]);

  const discoveredCount = save ? Object.keys(save.cats).length : 0;
  const overallPct = useMemo(() => {
    if (!save || tableCats.length === 0) return 0;
    const sum = tableCats.reduce((acc, c) => acc + (save.cats[catId(c)]?.masteryPct ?? 0), 0);
    return Math.round(sum / tableCats.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [save, tableCats]);

  const show = (cat: Cat) => {
    const p = save?.cats[catId(cat)];
    if (filter === "all") return true;
    if (filter === "progress") return Boolean(p?.unlocked) && !p?.mastered;
    return Boolean(p?.mastered);
  };

  const renderGrid = (cats: Cat[]) => (
    <div className="cat-grid">
      {cats.filter(show).map((cat) => (
        <CatCard
          key={cat.id}
          cat={cat}
          progress={save?.cats[catId(cat)]}
          onOpen={(id) => navigate(`/clowder/${id}`)}
        />
      ))}
    </div>
  );

  const visibleMilestones = milestoneCats.filter(show);

  return (
    <div className="screen">
      <div className="den-row">
        <div>
          <h1 style={{ fontSize: 26 }}>The Clowder</h1>
          <p className="muted" style={{ fontSize: 14, marginTop: 2 }}>
            {discoveredCount} of 13 found
          </p>
        </div>
        <MasteryRing pct={overallPct} size={52} stroke={5} />
      </div>

      <div className="filter-row" role="tablist" aria-label="Filter cats">
        {(["all", "progress", "mastered"] as Filter[]).map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            className={`filter-chip ${filter === f ? "on" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : f === "progress" ? "In progress" : "Mastered"}
          </button>
        ))}
      </div>

      <div className="clowder-scroll">
        {renderGrid(tableCats)}

        {visibleMilestones.length > 0 && (
          <>
            <div className="section-head" style={{ marginTop: 24 }}>
              <h3>Milestone cats</h3>
              <span className="count">special</span>
            </div>
            {renderGrid(milestoneCats)}
          </>
        )}
      </div>

      <nav className="bottom-nav">
        <button className="nav-item" onClick={() => navigate("/")}>
          <span className="ic">🏠</span>
          Den
        </button>
        <div className="nav-item on">
          <span className="ic">🐾</span>
          Clowder
        </div>
        <button className="nav-item" onClick={() => navigate("/soon")}>
          <span className="ic">📊</span>
          Progress
        </button>
      </nav>
    </div>
  );
}
