// First run — name the den from presets (no text field), then meet the starter
// cat. Warm, capable-9-year-old tone; never babyish.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CatStage } from "../../cats/CatStage";
import { catAccentStyle } from "../../cats/theme";
import { useApp } from "../../state/AppState";
import { PrimaryButton } from "../components/PrimaryButton";

const PRESETS = ["Bean", "Nova", "Pip", "Wren", "Sage", "Juno"];
const MORE = ["Remy", "Fig", "Lark", "Cleo", "Otis", "Beau"];

export function FirstRun() {
  const { createProfile, starterCat } = useApp();
  const navigate = useNavigate();

  const [step, setStep] = useState<0 | 1>(0);
  const [name, setName] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);

  const accentStyle = catAccentStyle(starterCat);

  if (step === 0) {
    const names = showMore ? [...PRESETS, ...MORE] : PRESETS;
    return (
      <div className="screen">
        <p className="eyebrow">First run</p>
        <h1 style={{ fontSize: 30, marginTop: 8 }}>Who&apos;s playing?</h1>
        <p className="muted" style={{ marginTop: 10 }}>Pick a name to start.</p>

        <div className="name-grid">
          {names.map((n) => (
            <button
              key={n}
              className="chip"
              aria-pressed={name === n}
              onClick={() => setName(n)}
            >
              {n}
            </button>
          ))}
        </div>

        {!showMore && (
          <button className="btn-text" style={{ marginTop: 16 }} onClick={() => setShowMore(true)}>
            or pick another ⌄
          </button>
        )}

        <div className="den-spacer" />

        <PrimaryButton disabled={!name} onClick={() => setStep(1)}>
          Next
        </PrimaryButton>
        <div className="page-dots">
          <i className="on" />
          <i />
        </div>
      </div>
    );
  }

  // Step 1 — meet the starter cat, then launch straight into the first round.
  const catName = starterCat?.shortName ?? "your cat";
  return (
    <div className="screen" style={accentStyle}>
      <p className="eyebrow" style={{ textAlign: "center" }}>
        You found a new cat
      </p>

      <div style={{ marginTop: 24 }}>
        <CatStage cat={starterCat} mood="happy" size={200} />
      </div>

      <h1 style={{ textAlign: "center", marginTop: 8, fontSize: 30 }}>Meet {catName}!</h1>
      <div style={{ textAlign: "center", marginTop: 10 }}>
        <span className="tag">Your 7× table buddy</span>
      </div>
      <p className="muted" style={{ textAlign: "center", marginTop: 16, maxWidth: 320, marginInline: "auto" }}>
        Your very first cat. Answer math problems to find more and watch your cats
        grow.
      </p>

      <div className="den-spacer" />

      <PrimaryButton
        onClick={() => {
          if (name) createProfile(name);
          // Straight into the first round — don't make them hunt for Play.
          navigate("/play", { replace: true });
        }}
      >
        Start playing
      </PrimaryButton>
    </div>
  );
}
