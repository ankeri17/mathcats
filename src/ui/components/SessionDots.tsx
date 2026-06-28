// Session dots — how far through the set. Done dots fill primary; the current
// problem is an open ring; upcoming are faint. The just-completed dot pops.
interface Props {
  total: number;
  /** Number of problems completed so far. */
  done: number;
  /** Briefly emphasize the most-recently-filled dot. */
  justFilled?: boolean;
}

export function SessionDots({ total, done, justFilled }: Props) {
  return (
    <div className="session-dots" aria-label={`Problem ${Math.min(done + 1, total)} of ${total}`}>
      {Array.from({ length: total }, (_, i) => {
        const isDone = i < done;
        const isCurrent = i === done;
        const isJust = justFilled && i === done - 1;
        const cls = [
          "dot",
          isDone ? "done" : "",
          isCurrent ? "current" : "",
          isJust ? "fill" : "",
        ]
          .filter(Boolean)
          .join(" ");
        return <span key={i} className={cls} />;
      })}
    </div>
  );
}
