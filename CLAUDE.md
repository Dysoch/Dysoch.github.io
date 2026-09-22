# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Monorepo hosting three independent React + TypeScript idle games, all deployed to GitHub Pages under separate subdirectories:

- **`DyAdventure/`** — **The active project.** This is what we work on. An incremental combat/loot RPG (train stats, upgrade abilities, fight through zones, craft and equip gear, Recall/Ascend prestige layers).
- **`DyWorld-Inc/`** — Business simulation (jobs, buildings, market, passive income). Reference only — not actively developed. Useful for patterns (e.g. multi-buy UI), but don't make changes here unless explicitly asked.
- **`idle-game/`** — Lifespan-based idle game (age progression, skills, rebirth). Reference only — not actively developed, and off-limits for changes.

## Commands

All commands must be run from within the project subdirectory (`DyAdventure/`, `DyWorld-Inc/`, or `idle-game/`).

```bash
npm run dev       # Vite dev server with HMR
npm run build     # tsc -b && vite build (type-check + production build)
npm run lint      # ESLint over all .ts/.tsx files
npm run preview   # Preview production build locally
```

TypeScript type-checking without building:
```bash
npx tsc --noEmit
```

**DyAdventure** additionally has:
```bash
npm test                              # vitest run — fast, deterministic regression tests (src/worker/simLogic.test.ts)
npm run test:watch                    # vitest in watch mode
npm run sim                           # progression simulator — see below
npm run sim -- --hours 14 --recall asap
```
`DyWorld-Inc` and `idle-game` have no test suites.

## Deployment

GitHub Actions (`.github/workflows/deploy.yml`) triggers on push to `main`:
1. Builds all three projects sequentially (`idle-game`, `DyWorld-Inc`, `DyAdventure`)
2. Merges each project's `dist/` into `deploy/<project-name>/`
3. Pushes `deploy/` to the `gh-pages` branch

Each project's `vite.config.ts` must set `base: '/<project-name>/'` to match its subdirectory path on GitHub Pages. Changing the base breaks routing and asset loading.

## Architecture

### Shared patterns across all three projects

All three use the same stack: **React 19 + TypeScript 5 + Bootstrap 5.3 + Zustand 5 + Vite 7**.

**Tab navigation is state-driven** (no router) in all three: `activeTab` in Zustand determines which page component renders. The UI shell differs per project — see each section below.

**Data-driven design:** All game content lives in JSON files (`src/content/` or `src/data/`), loaded as typed module imports. Adding a new resource/job/building/etc. means editing JSON only — the store and pages iterate over these arrays dynamically.

**Bootstrap JS is not loaded** in any of the three — dropdowns/modals are implemented manually in React, tooltips use the HTML `title` attribute, only `bootstrap.min.css` is imported.

**TypeScript:** Strict mode, no unused locals/parameters. ESLint v9 flat config. `verbatimModuleSyntax` is enabled — use `import type` for type-only imports.

---

### DyAdventure (the active project — start here)

**Simulation runs in a Web Worker** (`src/worker/simWorker.ts`), not on the main thread. `src/worker/simLogic.ts` holds all pure game-logic functions (combat, costs, crafting, prestige) operating on a plain `SimState` object. The worker owns the authoritative state; the main thread only dispatches messages and renders whatever `STATE_UPDATE`/`EVENT` messages send back.

**Store** (`src/store/gameStore.ts`): Zustand store persisted to localStorage under key `'DyAdventure'` (5s debounced writes via `createDebouncedLocalStorage`, flushed on `pagehide`/tab-hide). Store actions (e.g. `trainStat`, `craftItem`) don't mutate state directly — they `post()` a `MainToWorkerMessage` to the worker; the worker's `onmessage` handler calls the matching `simLogic.ts` function, then always calls `syncState()` to push the new state back. A 250ms interval (`STATE_SYNC_MS`) also syncs during the worker's own tick loop (`TICK_MS` = 100ms) so combat updates without user interaction.

**UI shell:** `HudHeader` (resources/portrait) → `TabBar` (tab buttons) → `page-content` (active page). No sidebar, unlike DyWorld-Inc/idle-game.

**Buy-quantity pattern:** Actions that spend a resource to raise a level/rank/count (`trainStat`, `upgradeAbility`, `buyPerk`, `craftItem`) all take an optional trailing `count` parameter, all the way through store → `MainToWorkerMessage` → `simLogic.ts`. Each `simLogic.ts` function re-derives the true affordable count from current worker state (`computeMax*Count` helpers) and clamps to it — never trust a `count` computed on the main thread, since worker state can lag slightly behind what's rendered. Pages compute their own display numbers directly from the pure `compute*CostN`/`computeMax*Count` functions (no worker round-trip needed for read-only cost previews) and use the shared `QtySelector` component (`src/components/QtySelector.tsx`, options ×1/×5/×10/×25/Max) for the picker UI. For literal quantities (×5/×10/×25) always show the full requested cost — even unaffordable — and disable the button; only "Max" computes the largest affordable count.

**Offline catch-up:** On `INIT`, if more than 1s has elapsed since `lastTickTimestamp` (capped at `MAX_OFFLINE_SIMULATED_MS` = 48h), `simulateOfflineElapsed` fast-forwards `advanceTick` in 1s steps.

**Content files** (`src/content/`): `stats.json` (`baseTrainCost`/`trainCostMultiplier`), `abilities.json` (`baseRankCost`/`rankCostMultiplier`/`maxRank`), `gear.json` (rarities, catalog items, sets), `augments.json`, `zones.json`, `prestige.json` (perks + Recall/Ascend config), `materials.json` (`craftCostByRarity`, slot materials).

**Cost formulas:** Stats/abilities/perks all use `base × multiplier^level`, capped where a `maxRank`/`maxLevel` exists. Gear crafting cost is flat per rarity (doesn't scale with count owned).

**Testing:** Two separate tools, for two separate questions — don't conflate them:
- `npm test` (Vitest, `src/worker/simLogic.test.ts`) — fast (~1s), deterministic pass/fail regression tests against `simLogic.ts`'s pure functions directly (build a `SimState` via `createInitialState()` + targeted overrides, call the real exported function, assert). Run this after any `simLogic.ts` or `content/*.json` change. Covers: ability-firing fairness (no ability should be starved by a fixed loop order), the dot/buff ability-uses stat, DoT/buff/overkill/execute mechanics, buy-N cost-math consistency, perk-effect wiring (a perk added to `prestige.json` without a formula hook fails this), and Recall economy invariants.
- `npm run sim` (`scripts/simulate.ts`, via `tsx`) — a bot-driven progression simulator for pacing/balance questions that aren't pass/fail (e.g. "does Recall still pay off over N hours", "is a depth wall forming"). Takes `--hours` and `--recall <never|threshold|asap>`; prints a depth/focus/faints-over-time report, not assertions. Redirect to a file to diff before/after a balance change. This is how the resource-starvation, ability-uses, and Recall-exploit bugs fixed this session were actually found — reading the code alone didn't surface them.

---

### DyWorld-Inc — reference only, not actively developed

**UI layout:** Fixed three-panel shell — `TopBar` (56px, z-index 1030) → `SideBar` (220px wide, z-index 1020) → `ContentArea` (fills remaining space). Dark/light mode is set via `document.documentElement.setAttribute('data-bs-theme', theme)`.

**Store** (`src/store/gameStore.ts`): Single Zustand store persisted to localStorage under key `'DyWorld-Inc'`. All game state lives here: resources, stats, activeJob, buildings, marketPrices, numberFormat, theme.

**Game loops in `App.tsx`** (all global — run on every page):
- **100ms**: Job completion check — polls `Date.now() >= activeJob.endTime`, then calls `completeJob()`
- **1s**: `tickPassiveIncome(1000)` — awards resources from owned buildings
- **30s**: `tickMarket()` — random-walks each resource price ±15% of base, clamped to `[minPrice, maxPrice]`
- **On mount**: Offline catch-up — `tickPassiveIncome(Date.now() - lastPassiveTick)` if > 1s elapsed

**Calculation chain (when implemented):** `base × upgrades × prestige_skills`. Base values come from JSON, upgrade multipliers stack multiplicatively, prestige skill multipliers are applied last.

**Stat tracking conventions:**
- `job_${jobId}_completed` — times a job was completed
- `job_${jobId}_${resourceId}_earned` — per-job resource earnings (used in Statistics)
- `${resourceId}_earned` — total lifetime earned (all sources: jobs + passive)
- `${resourceId}_spent` — total lifetime spent
- `building_${id}_count` — total buildings purchased
- `building_${id}_produced_${resourceId}` — cumulative passive production

**Building cost formula:** `Math.floor(baseCost * costMultiplier ^ ownedCount)`. The multiplier per building is defined in `buildings.json`.

**Content files** (`src/content/`):
- `resources.json` — defines `category` (`capital` or `basic`) which determines which Statistics tab shows them
- `jobs.json` — optional `costs[]` array; costs are spent atomically when the job starts
- `buildings.json` — `baseCost[]`, `costMultiplier`, `production[]` with `amountPerSecond`
- `market_items.json` — `basePrice`, `minPrice`, `maxPrice` per tradeable resource
- `exchange_rates.json` — coin tier conversion ratios for the Bank page

**Number formatting** (`src/utils/format.ts`): `formatNumber(n)` reads `numberFormat` from the Zustand store's `getState()` (not a selector — works outside React but requires a re-render to update). Supports `engineering` (K/M/B), `scientific` (e.g. `1.23e6`), and `normal` (k/million/billion).

**`TabType`** must include every page ID. Adding a new page requires updating: `src/types/index.ts` (TabType union), `src/constants/tabs.ts` (GAME_TABS or BOTTOM_TABS), `src/components/ContentArea.tsx` (switch case), and creating `src/pages/NewPage.tsx`.

---

### idle-game — reference only, off-limits for changes

**Store** (`src/store/gameStore.ts`): Zustand store, optionally persisted. Contains lifespan, resources, skills, rebirth count, and game flags (`isDead`, `isPaused`).

**Game loop in `App.tsx`**: 1-second tick generates resources based on owned skill levels and their `effects.generates` values. Prestige/rebirth resets most state but increments `rebirths`.

**Data files** (`src/data/`): `skills.json`, `resources.json`, `upgrades.json`, `generators.json`, `changelog.json`.
