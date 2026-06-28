// Placeholder for the Progress tab, whose screen lands in a later phase.
// Kept friendly so the nav never dead-ends.
import { useNavigate } from "react-router-dom";
import { PrimaryButton } from "../components/PrimaryButton";

export function ComingSoon() {
  const navigate = useNavigate();
  return (
    <div className="screen">
      <div className="coming-soon">
        <span style={{ fontSize: 40 }}>📊</span>
        <h2>Progress is on the way</h2>
        <p className="muted" style={{ maxWidth: 280 }}>
          Your progress map arrives in a later update. For now, the den, your
          cats, and your practice sets are ready to go.
        </p>
      </div>
      <PrimaryButton onClick={() => navigate("/")}>Back to the den</PrimaryButton>
    </div>
  );
}
