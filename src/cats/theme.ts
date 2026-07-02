// Per-cat UI theming. Sets --cat-accent so rings, tags, and card accents match
// the cat — the art itself colors itself and is never themed from here.
import type { CSSProperties } from "react";
import type { Cat } from "./roster";

export function catAccentStyle(cat: Cat | null | undefined): CSSProperties | undefined {
  if (!cat) return undefined;
  return { "--cat-accent": cat.accent } as CSSProperties;
}
