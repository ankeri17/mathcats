// Discovery / level-up beat — the contained celebration when a cat newly appears
// or masters its table. Warm and brief; the bloom respects reduced motion.
import { CatStage } from "../../cats/CatStage";
import type { Cat } from "../../cats/roster";
import { PrimaryButton } from "./PrimaryButton";

export type DiscoveryKind = "found" | "mastered";

interface Props {
  cat: Cat | null;
  kind: DiscoveryKind;
  onContinue: () => void;
}

export function DiscoveryOverlay({ cat, kind, onContinue }: Props) {
  const accentStyle = cat
    ? ({ ["--cat-accent" as string]: cat.accent } as React.CSSProperties)
    : undefined;

  const name = cat?.shortName ?? "A new cat";
  const isMastered = kind === "mastered";

  return (
    <div className="overlay" role="dialog" aria-modal="true" style={accentStyle}>
      <div className="overlay__card discovery">
        <p className="eyebrow" style={{ textAlign: "center" }}>
          {isMastered ? "Table mastered" : "You found a new cat"}
        </p>
        <div className="discovery__bloom">
          <CatStage cat={cat} mood="happy" reaction="correct" size={168} />
        </div>
        <h1 style={{ textAlign: "center", fontSize: 28 }}>{name}</h1>
        <p className="muted" style={{ textAlign: "center", marginTop: 6 }}>
          {isMastered
            ? `${name} has every fact down. Star earned.`
            : cat?.tableId
              ? `Your ${cat.tableId}× buddy is here. Keep going.`
              : "A special cat joins your clowder."}
        </p>
        <div style={{ marginTop: 20 }}>
          <PrimaryButton onClick={onContinue}>Nice!</PrimaryButton>
        </div>
      </div>
    </div>
  );
}
