# Math Cats

A mobile-first, local-first multiplication & division practice game — kind by
design, built for a capable 9-year-old. This is **Phase 0–1**: the scaffold plus
the core play loop. Later phases (the Clowder collection, progress dashboard,
adaptive practice) are intentionally out of scope, but the data layer that will
feed them is already in place.

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
```

Deploy: `netlify.toml` is configured (`npm run build` → `dist/`, with an SPA
redirect). No environment variables, no backend.

## Architecture — the decoupling that matters

The codebase keeps three layers strictly separated so later phases (cloud sync,
licensing, adaptive selection) drop in without a rewrite:

```
src/
  engine/        Pure game logic — NO ui or storage imports.
    types.ts       Op, Fact, Problem, FactStat
    facts.ts       fact enumeration, stable keys ("7x8" / "56d7"), answer check
    selector.ts    getNextProblem() — plain, no-immediate-repeat (adaptive = Phase 2)
    mastery.ts     applyAttempt(), masteryPct() — the mastery rule

  data/          Typed data layer. The UI reads/writes ONLY through here.
    storage.ts     StorageAdapter (get/set/list/remove) — localStorage impl.
                   This is the single seam a backend adapter will replace.
    schema.ts      SaveData/Profile/CatProgress/Session + schemaVersion + migrate()
    store.ts       domain ops: createProfile, recordAttempt, recordSession…
    entitlement.ts checkEntitlement() — app boot gates on it (stub: true)

  cats/          Roster + cat rendering.
    roster.ts      loads /cats/roster.json, derives tableId/name/art/accent
    useInlineSvg   fetch-and-INLINE the SVG (so paws/tail/ears can animate)
    CatStage.tsx   idle ↔ happy, correct/incorrect beats, placeholder fallback

  ui/            Screens + components (FirstRun, Den, Play, Summary; NumberPad,
                 ProblemDisplay, SessionDots, PrimaryButton).
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
const ACTIVE_TABLES = [2,3,4,5,6,7,8,9,10,11,12]; // default practice set
const SESSION_LENGTH = 9;     // problems per session
const MASTERY_STREAK = 3;     // correct-in-a-row to master a fact
const INPUT_MODE = "numpad";  // multiple-choice easy mode is Phase 2+
```

## Accessibility & motion

Every motion ships a `prefers-reduced-motion` fallback (calm fades instead of
bounces). Numerals stay crisp at phone size (Lexend, tabular figures). Layout
respects safe areas / notches.

## Out of scope (later phases)

The Clowder collection screen, cat detail, progress/parent dashboard, weighted
/ spaced-repetition selection, table-unlock progression, accounts, cloud sync,
and licensing. The `Clowder` and `Progress` tabs lead to a friendly
"coming soon" placeholder so the nav never dead-ends.
