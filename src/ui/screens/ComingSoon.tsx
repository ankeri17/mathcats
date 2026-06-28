// Placeholder for tabs whose screens land in later phases (Clowder = Phase 3,
// Progress = Phase 4). Kept friendly so the nav never dead-ends.
import { useNavigate } from "react-router-dom";
import { PrimaryButton } from "../components/PrimaryButton";

export function ComingSoon() {
  const navigate = useNavigate();
  return (
    <div className="screen">
      <div className="coming-soon">
        <span style={{ fontSize: 40 }}>🐾</span>
        <h2>More cats are on the way</h2>
        <p className="muted" style={{ maxWidth: 280 }}>
          The Clowder and your progress map arrive in a later update. For now, the
          den and your practice sets are ready to go.
        </p>
      </div>
      <PrimaryButton onClick={() => navigate("/")}>Back to the den</PrimaryButton>
    </div>
  );
}
