// Last-resort error boundary. A thrown render error must never leave a
// 9-year-old staring at a blank page — show a kind message and a reload button.
// Deliberately zero dependencies on app state (which may be what broke).
import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  crashed: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { crashed: false };

  static getDerivedStateFromError(): State {
    return { crashed: true };
  }

  componentDidCatch(error: unknown): void {
    // Local-first: log to the console only. No error reporting services.
    console.error("[mathcats] render error:", error);
  }

  render() {
    if (!this.state.crashed) return this.props.children;
    return (
      <div className="app">
        <div className="screen">
          <div className="coming-soon">
            <span style={{ fontSize: 40 }}>🐈</span>
            <h2>The cats knocked something over</h2>
            <p className="muted" style={{ maxWidth: 280 }}>
              Something went sideways, but your progress is safe. Tap below to
              tidy up and keep playing.
            </p>
          </div>
          <button className="btn-primary" onClick={() => window.location.assign("/")}>
            Back to playing
          </button>
        </div>
      </div>
    );
  }
}
