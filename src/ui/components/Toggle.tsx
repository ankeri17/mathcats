// A simple on/off switch. Used for the settings toggles.
interface Props {
  on: boolean;
  onChange: (on: boolean) => void;
  label: string;
}

export function Toggle({ on, onChange, label }: Props) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`toggle ${on ? "toggle--on" : ""}`}
      onClick={() => onChange(!on)}
    >
      <span className="toggle__knob" />
    </button>
  );
}
