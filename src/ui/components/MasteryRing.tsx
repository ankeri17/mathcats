// Mastery ring — empty → partial → full. A full ring shows a star instead of a
// number; partial shows the percentage; empty is a faint track. The arc is
// themed with the cat's accent (--cat-accent on an ancestor).
interface Props {
  pct: number; // 0–100
  size?: number;
  stroke?: number;
  mastered?: boolean;
  /** Show the % / star label in the center (off for tiny corner rings). */
  showLabel?: boolean;
}

export function MasteryRing({
  pct,
  size = 56,
  stroke = 5,
  mastered = false,
  showLabel = true,
}: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  const offset = c * (1 - (mastered ? 1 : clamped) / 100);

  return (
    <div
      className={`ring ${mastered ? "ring--full" : ""}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="ring__track"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          className="ring__arc"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {showLabel && (
        <span className="ring__label">{mastered ? "★" : `${clamped}`}</span>
      )}
    </div>
  );
}
