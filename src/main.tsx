import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { AppProvider } from "./state/AppState";
import { ErrorBoundary } from "./ui/ErrorBoundary";

// Self-hosted fonts — no third-party requests, works offline. Latin subset only
// (the app is English); keeps the bundle lean.
// Baloo 2: display / headings / cat names. Lexend: numerals / body / utility.
import "@fontsource/baloo-2/latin-500.css";
import "@fontsource/baloo-2/latin-600.css";
import "@fontsource/baloo-2/latin-700.css";
import "@fontsource/lexend/latin-400.css";
import "@fontsource/lexend/latin-500.css";
import "@fontsource/lexend/latin-600.css";
import "@fontsource/lexend/latin-700.css";

import "./index.css";
import "./components.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AppProvider>
          <App />
        </AppProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
