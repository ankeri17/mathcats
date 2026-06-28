// Session summary — attempted/correct and an inviting "play again". Warm, never
// a report card. No grades, no pass/fail.
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../../state/AppState";
import { CatStage } from "../../cats/CatStage";
import { PrimaryButton } from "../components/PrimaryButton";

interface SummaryState {
  attempted: number;
  correct: number;
}

export function Summary() {
  const { save, starterCat } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as SummaryState | null;

  // Reached without finishing a set → send home.
  if (!state) return <Navigate to="/" replace />;

  const name = save?.profile.name ?? "friend";
  const { attempted, correct } = state;

  return (
    <div className="screen">
      <div className="summary-hero">
        <p className="eyebrow">Set complete</p>
        <h1>Nice session, {name}.</h1>
      </div>

      <div style={{ marginTop: 12 }}>
        <CatStage cat={starterCat} mood="happy" size={150} />
      </div>

      <div className="stat-row">
        <div className="stat">
          <div className="n">{attempted}</div>
          <div className="l">Problems</div>
        </div>
        <div className="stat">
          <div className="n">{correct}</div>
          <div className="l">First try</div>
        </div>
      </div>

      <p className="summary-note">
        Every answer helped {starterCat?.shortName ?? "your cat"} settle in. Come back soon.
      </p>

      <div className="den-spacer" />

      <PrimaryButton onClick={() => navigate("/play", { replace: true })}>
        Play again
      </PrimaryButton>
      <button className="btn-text" onClick={() => navigate("/", { replace: true })}>
        Back to the den
      </button>
    </div>
  );
}
