// ────────────────────────────────────────────────────────────────────────────
// CatStage — renders a cat by INLINING its SVG into the DOM (not via <img>), so
// its sub-parts can animate. Swaps idle↔happy, plays a contained "correct" beat
// (bounce-squish) and a soft "incorrect" settle, and respects reduced motion.
// Falls back to a flagged placeholder cat when the real art is missing.
// ────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo } from "react";
import { useReducedMotion } from "../ui/useReducedMotion";
import { placeholderCat } from "./placeholderCat";
import type { Cat, CatMood } from "./roster";
import { preloadSvg, useInlineSvg } from "./useInlineSvg";

export type CatReaction = "correct" | "incorrect" | null;

interface CatStageProps {
  cat: Cat | null;
  mood: CatMood;
  reaction?: CatReaction;
  /** px size of the square stage. */
  size?: number;
  /** Notified when the placeholder (not real art) is being shown. */
  onPlaceholder?: (isPlaceholder: boolean) => void;
}

export function CatStage({
  cat,
  mood,
  reaction = null,
  size = 200,
  onPlaceholder,
}: CatStageProps) {
  const reduced = useReducedMotion();
  const url = cat ? cat.art(mood) : null;
  const { markup, error } = useInlineSvg(url);

  // Preload the happy art so the correct beat lands instantly.
  useEffect(() => {
    if (cat) preloadSvg(cat.art("happy"));
  }, [cat]);

  const usePlaceholder = !cat || error;

  useEffect(() => {
    onPlaceholder?.(usePlaceholder);
  }, [usePlaceholder, onPlaceholder]);

  const html = useMemo(() => {
    if (usePlaceholder) return placeholderCat(mood);
    return markup ?? "";
  }, [usePlaceholder, markup, mood]);

  const classes = [
    "cat-stage",
    `cat-stage--${mood}`,
    reduced ? "cat-stage--reduced" : "",
    reaction ? `cat-stage--${reaction}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      style={{ width: size, height: size }}
      // key on reaction so the one-shot animation restarts each correct/incorrect.
      data-reaction={reaction ?? "none"}
    >
      <div
        className="cat-stage__art"
        // Trusted, first-party assets — safe to inline.
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
