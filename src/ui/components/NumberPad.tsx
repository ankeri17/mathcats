// Number pad — the only way to answer (no free-text inputs, ever). Anchored in
// the thumb zone. Digits 0–9, clear (backspace), enter. Multi-digit supported;
// enter is disabled while the entry is empty.
import { useReducedMotion } from "../useReducedMotion";

interface Props {
  onDigit: (d: string) => void;
  onBackspace: () => void;
  onEnter: () => void;
  canEnter: boolean;
  /** When false the whole pad is inert (e.g. during the correct beat). */
  enabled?: boolean;
}

const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export function NumberPad({
  onDigit,
  onBackspace,
  onEnter,
  canEnter,
  enabled = true,
}: Props) {
  const reduced = useReducedMotion();
  return (
    <div className={`numpad ${reduced ? "reduced" : ""}`} role="group" aria-label="Number pad">
      {DIGITS.map((d) => (
        <button
          key={d}
          className="key"
          onClick={() => onDigit(d)}
          disabled={!enabled}
          aria-label={d}
        >
          {d}
        </button>
      ))}
      <button
        className="key key--util"
        onClick={onBackspace}
        disabled={!enabled}
        aria-label="Delete"
      >
        ⌫
      </button>
      <button
        className="key"
        onClick={() => onDigit("0")}
        disabled={!enabled}
        aria-label="0"
      >
        0
      </button>
      <button
        className="key key--enter"
        onClick={onEnter}
        disabled={!enabled || !canEnter}
        aria-label="Enter"
      >
        ⏎
      </button>
    </div>
  );
}
