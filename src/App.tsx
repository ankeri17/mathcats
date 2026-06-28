// App shell — boots on the entitlement check, waits for the data layer + roster,
// then routes between the Phase 1 screens. A profile gate keeps you in first-run
// until the den exists.
import { Navigate, Route, Routes } from "react-router-dom";
import { checkEntitlement } from "./data/entitlement";
import { useApp } from "./state/AppState";
import { FirstRun } from "./ui/screens/FirstRun";
import { Den } from "./ui/screens/Den";
import { Play } from "./ui/screens/Play";
import { Summary } from "./ui/screens/Summary";
import { ComingSoon } from "./ui/screens/ComingSoon";
import { Clowder } from "./ui/screens/Clowder";
import { CatDetail } from "./ui/screens/CatDetail";

const ENTITLED = checkEntitlement();

export function App() {
  const { ready, save, usingPlaceholder } = useApp();

  if (!ENTITLED) {
    return (
      <div className="app">
        <div className="screen">
          <div className="coming-soon">
            <h2>Math Cats</h2>
            <p className="muted">This copy isn&apos;t activated yet.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="app">
        <div className="screen">
          <p className="muted" style={{ margin: "auto" }}>
            Waking the cats…
          </p>
        </div>
      </div>
    );
  }

  const hasProfile = Boolean(save);

  return (
    <div className="app">
      {usingPlaceholder && (
        <div className="placeholder-flag" style={{ position: "absolute", top: 6, left: 0, right: 0, width: "fit-content", marginInline: "auto", zIndex: 10 }}>
          Placeholder cat — real roster not loaded
        </div>
      )}
      <Routes>
        <Route path="/" element={hasProfile ? <Den /> : <FirstRun />} />
        <Route path="/play" element={hasProfile ? <Play /> : <Navigate to="/" replace />} />
        <Route path="/summary" element={hasProfile ? <Summary /> : <Navigate to="/" replace />} />
        <Route path="/clowder" element={hasProfile ? <Clowder /> : <Navigate to="/" replace />} />
        <Route path="/clowder/:catId" element={hasProfile ? <CatDetail /> : <Navigate to="/" replace />} />
        <Route path="/soon" element={hasProfile ? <ComingSoon /> : <Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
