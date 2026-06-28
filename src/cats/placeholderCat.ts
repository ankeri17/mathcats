// ────────────────────────────────────────────────────────────────────────────
// Placeholder cat — a self-contained, on-brand fallback used only when the real
// roster/SVGs aren't present. It mirrors the real art's class names
// (.cat / .cat-ear / .cat-tail / .cat-paw / .cat-eyes) so the same animations
// apply. When this renders, the UI flags it visibly so it's never mistaken for
// the real roster.
// ────────────────────────────────────────────────────────────────────────────

import type { CatMood } from "./roster";

export function placeholderCat(mood: CatMood): string {
  const happy = mood === "happy";
  const eyes = happy
    ? `<g class="cat-eyes"><path d="M86,104 q9,-9 18,0" fill="none" stroke="#3A3A4E" stroke-width="3.5" stroke-linecap="round"/><path d="M136,104 q9,-9 18,0" fill="none" stroke="#3A3A4E" stroke-width="3.5" stroke-linecap="round"/></g>`
    : `<g class="cat-eyes"><ellipse cx="95" cy="104" rx="7" ry="9.5" fill="#3A3A4E"/><ellipse cx="145" cy="104" rx="7" ry="9.5" fill="#3A3A4E"/><circle cx="97.5" cy="100" r="2.3" fill="#fff"/><circle cx="147.5" cy="100" r="2.3" fill="#fff"/></g>`;
  const mouth = happy
    ? `<path class="cat-mouth" d="M110,124 q10,9 20,0" fill="none" stroke="#7A6BCB" stroke-width="2.4" stroke-linecap="round"/>`
    : `<path class="cat-mouth" d="M120,122 v5 M120,127 q-6,5 -11,1 M120,127 q6,5 11,1" fill="none" stroke="#7A6BCB" stroke-width="2.2" stroke-linecap="round"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240" role="img" aria-label="Placeholder cat (${mood})"><g class="cat" style="--coat:#8E96DF;--shade:#6F79D0;--belly:#CCD2F4;--accent:#C3A9E4;--eye:#3A3A4E"><path class="cat-tail" d="M176,206 C214,210 236,186 234,150 C233,128 222,116 214,118 C222,128 224,150 220,168 C214,190 196,200 176,206 Z" fill="var(--coat)"/><path class="cat-ear cat-ear-l" d="M64,86 Q58,40 78,24 Q96,40 102,80 Q84,74 64,86 Z" fill="var(--coat)"/><path class="cat-ear cat-ear-r" d="M176,86 Q182,40 162,24 Q144,40 138,80 Q156,74 176,86 Z" fill="var(--coat)"/><ellipse class="cat-body" cx="120" cy="172" rx="62" ry="46" fill="var(--coat)"/><ellipse class="cat-head" cx="120" cy="108" rx="56" ry="50" fill="var(--coat)"/><ellipse class="cat-belly" cx="120" cy="178" rx="42" ry="36" fill="var(--belly)"/><g class="cat-paw-l"><ellipse cx="96" cy="208" rx="16" ry="13" fill="var(--coat)"/></g><g class="cat-paw-r"><ellipse cx="144" cy="208" rx="16" ry="13" fill="var(--coat)"/></g>${eyes}${mouth}</g></svg>`;
}
