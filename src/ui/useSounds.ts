// useSounds — the components' door to audio. Reads the muted setting from app
// state and returns no-op callbacks when muted, so callers never check the flag.
import { useMemo } from "react";
import { useApp } from "../state/AppState";
import { playBonus, playCorrect, playDiscovery } from "./sound";

export interface Sounds {
  correct: () => void;
  bonus: () => void;
  discovery: () => void;
}

const SILENCE: Sounds = { correct: () => {}, bonus: () => {}, discovery: () => {} };

export function useSounds(): Sounds {
  const { save } = useApp();
  const muted = save?.profile.settings.muted ?? false;
  return useMemo(
    () => (muted ? SILENCE : { correct: playCorrect, bonus: playBonus, discovery: playDiscovery }),
    [muted],
  );
}
