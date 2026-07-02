// ────────────────────────────────────────────────────────────────────────────
// Sound — tiny, reward-only audio synthesized with the Web Audio API. No files,
// no network. There is deliberately NO incorrect/failure sound: audio only ever
// celebrates (hard rule: no punitive design).
//
// The AudioContext is created lazily inside a user-gesture call path (sounds
// fire from button presses), so autoplay policies never block it. Everything is
// wrapped defensively — audio failing must never break play.
// ────────────────────────────────────────────────────────────────────────────

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** One soft note: a sine with a fast attack and a gentle exponential tail. */
function note(freq: number, at: number, dur: number, peak: number): void {
  const ac = getCtx();
  if (!ac) return;
  try {
    const t = ac.currentTime + at;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  } catch {
    // Audio is a garnish; never let it throw into the play loop.
  }
}

/** Correct answer — two quick, soft notes. */
export function playCorrect(): void {
  note(659.25, 0, 0.16, 0.055); // E5
  note(880.0, 0.09, 0.22, 0.05); // A5
}

/** Challenge bonus — a brighter three-note rise. */
export function playBonus(): void {
  note(659.25, 0, 0.12, 0.05); // E5
  note(880.0, 0.08, 0.12, 0.05); // A5
  note(1108.73, 0.16, 0.26, 0.045); // C#6
}

/** Discovery / mastery — a warm little arpeggio for the big moments. */
export function playDiscovery(): void {
  note(523.25, 0, 0.18, 0.05); // C5
  note(659.25, 0.11, 0.18, 0.05); // E5
  note(783.99, 0.22, 0.18, 0.05); // G5
  note(1046.5, 0.33, 0.34, 0.045); // C6
}
