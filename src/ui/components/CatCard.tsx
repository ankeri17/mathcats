// Cat card — the one bold device of the collection. Three states driven entirely
// by CatProgress: undiscovered (locked silhouette), discovered (idle cat + a
// corner mastery ring), mastered (prized frame + ★ Mastered). Themed per-cat.
import { CatStage } from "../../cats/CatStage";
import type { Cat } from "../../cats/roster";
import type { CatProgress } from "../../data/schema";
import { MasteryRing } from "./MasteryRing";

interface Props {
  cat: Cat;
  progress: CatProgress | undefined;
  onOpen: (catId: string) => void;
}

export function CatCard({ cat, progress, onOpen }: Props) {
  const discovered = Boolean(progress?.unlocked);
  const mastered = Boolean(progress?.mastered);
  const pct = progress?.masteryPct ?? 0;

  const tableLabel = cat.isMilestone
    ? cat.id === "div"
      ? "Division"
      : "All-stars"
    : `${cat.tableId}× table`;

  const style = { ["--cat-accent" as string]: cat.accent } as React.CSSProperties;

  if (!discovered) {
    return (
      <div className="cat-card cat-card--locked" style={style} aria-label="Undiscovered cat">
        <div className="cat-card__art">
          <CatStage cat={cat} mood="locked" size={84} />
        </div>
        <div className="cat-card__name">???</div>
        <span className="cat-card__sub">Undiscovered</span>
      </div>
    );
  }

  return (
    <button
      className={`cat-card ${mastered ? "cat-card--mastered" : "cat-card--discovered"} ${
        cat.shimmer ? "cat-card--shimmer" : ""
      }`}
      style={style}
      onClick={() => onOpen(cat.id)}
      aria-label={`${cat.shortName}, ${mastered ? "mastered" : `${pct}% mastered`}`}
    >
      {mastered ? (
        <span className="cat-card__badge">★ Mastered</span>
      ) : (
        <span className="cat-card__ring">
          <MasteryRing pct={pct} size={40} stroke={4} />
        </span>
      )}
      <div className="cat-card__art">
        <CatStage cat={cat} mood="idle" size={84} />
      </div>
      <div className="cat-card__name">{cat.shortName}</div>
      <span className="tag cat-card__tag">{tableLabel}</span>
    </button>
  );
}
