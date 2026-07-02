# Math Cats

A mobile-first, local-first multiplication & division practice game — kind by
design, built for a capable 9-year-old. This covers **Phases 0–3**: the scaffold,
the core play loop, the adaptive practice + cat-progression layer underneath it,
and the My Cats collection screen + cat detail, plus an opt-in Challenge mode. The
remaining phase (the grown-ups dashboard) is out of scope here, but the data it
reads from is already maintained.

© 2026 — all rights reserved. (Public for visibility, not for reuse; no
open-source license is granted.)

## What it does

Set a name → land in **The Den** → hit **Play** → answer a session of
multiplication and division problems with a real cat reacting → get a kind retry
on wrong answers → see a session summary. Per-fact stats persist in
`localStorage` across reloads.

- **Number pad only** — no free-text inputs anywhere.
- **No accounts, no network calls for game data, no ads, no trackers.**
- **No punitive design** — no "wrong", no red-X, no punishing timer, no losing
  states.

## Stack

React + Vite + TypeScript, deployed as a static build (Netlify).

```bash
npm install
npm run dev        # local dev server
npm run build      # type-check (tsc -b) + production build to dist/
npm run preview    # serve the production build
npm test           # vitest — engine/data unit tests + pacing simulation
npm run lint       # eslint (typescript + react-hooks rules)
```

CI (GitHub Actions) runs lint → test → build on every push and PR — `main` is
the Netlify deploy source, so nothing broken should land there. Fonts are
self-hosted via `@fontsource` (latin subset): the app makes **zero third-party
requests** and works fully offline. Sounds are synthesized with the Web Audio
API (no assets, reward-only — there is deliberately no failure sound).

Deploy: `netlify.toml` is configured (`npm run build` → `dist/`, with an SPA
redirect). No environment variables, no backend.

## Architecture — the decoupling that matters

The codebase keeps three layers strictly separated so later phases (cloud sync,
licensing, adaptive selection) drop in without a rewrite:

```
src/
  engine/        Pure game logic — NO ui or storage imports.
    types.ts          Op, Fact, Problem, FactStat
    facts.ts          fact enumeration, stable keys ("7x8" / "56d7"), answer check
    adaptiveSelector  Phase 2: Leitner-lite boxes + weighted selection, ~20%
                      due-review of mastered facts, no immediate repeats, mixed ×/÷
    progression.ts    Phase 2: the moving table "front", introduce/advance rules
    milestones.ts     Phase 2: cat_div / cat_all trigger functions
    mastery.ts        applyAttempt(), masteryPct() — the mastery rule

  data/          Typed data layer. The UI reads/writes ONLY through here.
    storage.ts     StorageAdapter (get/set/list/remove) — localStorage impl.
                   This is the single seam a backend adapter will replace.
    schema.ts      SaveData/Profile/CatProgress/Session/ProgressState +
                   schemaVersion (2) + migrate()  (v1→v2 upgrades cleanly)
    store.ts       domain ops: createProfile, recordAttempt (reconciles
                   progression, derives cat + milestone state, returns discovery
                   events), recordSession… Cat state is DERIVED from facts, so it
                   can never drift.
    entitlement.ts checkEntitlement() — app boot gates on it (stub: true)

  cats/          Roster + cat rendering.
    roster.ts      loads /cats/roster.json, derives tableId/name/art/accent
    useInlineSvg   fetch-and-INLINE the SVG (so paws/tail/ears can animate)
    CatStage.tsx   idle ↔ happy, correct/incorrect beats, placeholder fallback

  ui/            Screens + components.
                 screens: FirstRun, Den, Play, Summary, Clowder ("My Cats"),
                   CatDetail, Settings
                 components: NumberPad, ProblemDisplay, SessionDots,
                   PrimaryButton, DiscoveryOverlay, MasteryRing, CatCard, Toggle
  state/         AppState context — holds the loaded save + roster, exposes
                 actions that go through data/store. Components never touch
                 localStorage directly.
  config.ts      The dials: ACTIVE_TABLES, SESSION_LENGTH, MASTERY_STREAK, INPUT_MODE.
```

**Components never import `localStorage`.** They call `useApp()`; the store
persists through the storage adapter. Swapping in a cloud backend later means
changing `data/storage.ts` and nothing else.

## The cats

The 39 SVGs and `roster.json` live in `public/cats/`. The art is
**self-contained** — each SVG defines its own coat colors as inline CSS
variables, so no color is ever injected. The app **inlines** the SVG into the
DOM (rather than `<img>`) specifically so the `.cat-paw / .cat-tail / .cat-ear /
.cat-eyes` groups can animate. Each cat's colors theme the *matching UI bits*
(card accent, table tag) — never the art itself.

If the roster/SVGs are ever missing, the app falls back to an on-brand
**placeholder cat** and flags it visibly. For Phase 1 the play screen shows one
real cat (Cream, the 7× cat) to validate inlining + animation.

## Config knobs

Surfaced at the top of `src/config.ts`:

```ts
const ACTIVE_TABLES = [2,3,4,5,6,7,8,9,10,11,12]; // universe of tables
const SESSION_LENGTH = 9;     // problems per session
const MASTERY_STREAK = 2;     // correct-in-a-row to master a fact
const INPUT_MODE = "numpad";  // multiple-choice easy mode is later

// Phase 2 — adaptive practice & progression
const STARTER_TABLE = 7;                              // the onboarding cat (Cream)
const PROGRESSION_ORDER = [2,5,10,3,4,6,7,8,9,11,12]; // easiest-first introduction
const ACTIVE_FRONT = 2;        // tables in focus at once
const ADVANCE_AT = 0.6;        // masteryPct that pulls in the next table
const REVIEW_SHARE = 0.2;      // fraction of problems that are retention review
const PROGRESSION_MODE = "paced"; // "paced" | "strict" | "open"
```

## How practice adapts (Phase 2)

The engine leads the child through tables in `PROGRESSION_ORDER` via a moving
front of 1–2 tables, and advances fast past tables they already know (a returning
child isn't re-walled — mastered facts still count). The selector favors weak and
struggling facts, folds in a steady minority of due review so earlier facts don't
fade, and never repeats a fact immediately. Each table has a cat that **discovers**
when its table is introduced and **masters** when all its facts are mastered;
two milestone cats (`cat_div`, `cat_all`) track division and all-tables mastery.
Discoveries and masteries fire a contained celebration beat (reduced-motion safe).
A single-table **focus mode** is wired as a session parameter (Phase 3's "Practice
this cat" calls it).

## Accessibility & motion

Every motion ships a `prefers-reduced-motion` fallback (calm fades instead of
bounces). Numerals stay crisp at phone size (Lexend, tabular figures). Layout
respects safe areas / notches.

## The collection (Phase 3)

My Cats (reached from the Den) is a 2-column grid of all 13 cats, each card
rendered straight from `CatProgress`: undiscovered (locked silhouette), in
progress (idle cat + a corner mastery ring), or mastered (a prized frame +
★ badge), with a discovered/in-progress/mastered filter and the milestone cats
set apart. Tapping a card opens cat detail — the cat large and animated (tap for a
happy reaction), a fact-by-fact ×/÷ mastery breakdown, and a **Practice this cat**
button that launches a Phase 2 table-focus session. A newly-discovered cat plays a
reveal the first time it's opened; mastered cats carry a gentle flourish. This
phase only *visualizes* the progress Phase 2 maintains — it computes no new logic.

## Out of scope (later phase)

The progress / grown-ups dashboard (Phase 4), plus accounts, cloud sync, and
licensing. The `Progress` tab leads to a friendly "coming soon" placeholder so the
nav never dead-ends. The data that screen will read (per-fact stats, per-table
mastery, session history) is already maintained — it will be a read, not a
refactor.
