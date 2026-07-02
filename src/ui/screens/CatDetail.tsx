// Cat detail — the cat large and animated, its name + table, and a fact-by-fact
// mastery breakdown (× and ÷). "Practice this cat" launches a Phase 2 table-focus
// session. Plays a discovery reveal the first time a newly-unlocked cat is opened
// and a gentle flourish on mastered cats. Visualizes only — no new mastery logic.
import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { CatStage, type CatReaction } from "../../cats/CatStage";
import { findById } from "../../cats/roster";
import { factsForTable, GLYPH } from "../../engine/facts";
import type { Fact, FactStat } from "../../engine/types";
import { catAccentStyle } from "../../cats/theme";
import { catIdForTable, getSeenCats, markCatSeen } from "../../data/store";
import { useApp } from "../../state/AppState";
import { useSounds } from "../useSounds";
import { PrimaryButton } from "../components/PrimaryButton";

type TileState = "new" | "progress" | "mastered";

function tileState(stat: FactStat | undefined): TileState {
  if (stat?.mastered) return "mastered";
  if (stat && stat.attempts > 0) return "progress";
  return "new";
}

function FactTiles({ facts, stats }: { facts: Fact[]; stats: Record<string, FactStat> }) {
  return (
    <div className="fact-grid">
      {facts.map((f) => (
        <div key={f.key} className={`fact-tile fact-tile--${tileState(stats[f.key])}`}>
          <span className="fact-tile__q">
            {f.a} {GLYPH[f.op]} {f.b}
          </span>
          <span className="fact-tile__a">{f.answer}</span>
        </div>
      ))}
    </div>
  );
}

export function CatDetail() {
  const { save, roster } = useApp();
  const navigate = useNavigate();
  const { catId = "" } = useParams();

  const cat = findById(roster, catId) ?? null;
  const progressId = cat?.isMilestone ? cat.id : cat ? catIdForTable(cat.tableId!) : "";
  const progress = save?.cats[progressId];
  const discovered = Boolean(progress?.unlocked);

  const sounds = useSounds();

  // Reveal once, the first time a freshly-discovered cat is opened. The reveal
  // pose is the INITIAL state (no setState-in-effect); the effect only handles
  // the side effects: marking seen, the sound, and settling back to idle.
  const reveal = useMemo(
    () => discovered && cat != null && !getSeenCats().has(cat.id),
    [discovered, cat],
  );
  const [mood, setMood] = useState<"idle" | "happy">(reveal ? "happy" : "idle");
  const [reaction, setReaction] = useState<CatReaction>(reveal ? "correct" : null);

  useEffect(() => {
    if (cat && discovered) markCatSeen(cat.id);
    if (!reveal) return;
    sounds.discovery();
    const t = setTimeout(() => {
      setMood("idle");
      setReaction(null);
    }, 1400);
    return () => clearTimeout(t);
    // `sounds` is stable per mute-state; re-running the reveal on mute toggle
    // would replay it, so it's intentionally not a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat, discovered, reveal]);

  if (!cat || !discovered) return <Navigate to="/cats" replace />;

  const accentStyle = catAccentStyle(cat);
  const pct = progress?.masteryPct ?? 0;
  const mastered = Boolean(progress?.mastered);

  const tapCat = () => {
    setMood("happy");
    setReaction("correct");
    setTimeout(() => {
      setMood("idle");
      setReaction(null);
    }, 1200);
  };

  const tableFacts = cat.tableId != null ? factsForTable(cat.tableId) : [];
  const stats = save?.facts ?? {};
  const mulFacts = tableFacts.filter((f) => f.op === "mul");
  const divFacts = tableFacts.filter((f) => f.op === "div");

  return (
    <div className={`screen ${reveal ? "reveal" : ""}`} style={accentStyle}>
      <div className="topbar">
        <button className="icon-btn" aria-label="Back to My Cats" onClick={() => navigate("/cats")}>
          ‹
        </button>
        <span />
        <span />
      </div>

      <div className="detail-hero">
        <div className={`detail-bloom ${mastered ? "flourish" : ""}`}>
          <button className="detail-cat" onClick={tapCat} aria-label={`Pet ${cat.shortName}`}>
            <CatStage cat={cat} mood={mood} reaction={reaction} size={180} />
          </button>
        </div>
        <h1 style={{ textAlign: "center", marginTop: 4 }}>{cat.shortName}</h1>
        <div className="detail-tags">
          <span className="tag">
            {cat.isMilestone ? (cat.id === "div" ? "Division" : "All-stars") : `${cat.tableId}× table`}
          </span>
          <span className="tag tag--soft">
            {mastered ? "Mastered ★" : `${pct}% mastered`}
          </span>
        </div>
      </div>

      {cat.isMilestone ? (
        <p className="muted" style={{ textAlign: "center", marginTop: 24, padding: "0 8px" }}>
          {cat.id === "div"
            ? "Violet grows as you master division facts across every table."
            : "Iridescent arrives when all your cats have mastered their tables."}
        </p>
      ) : (
        <div className="clowder-scroll">
          <div className="legend">
            <span><i className="dot mastered" /> Solid = mastered</span>
            <span><i className="dot prog" /> Light = needs practice</span>
          </div>

          <div className="fact-section-label">Times</div>
          <FactTiles facts={mulFacts} stats={stats} />

          <div className="fact-section-label">Division</div>
          <FactTiles facts={divFacts} stats={stats} />
        </div>
      )}

      <div className="play-foot">
        {!cat.isMilestone && (
          <PrimaryButton
            onClick={() => navigate("/play", { state: { focusTable: cat.tableId } })}
          >
            Practise {cat.shortName}&apos;s {cat.tableId}s
          </PrimaryButton>
        )}
      </div>
    </div>
  );
}
