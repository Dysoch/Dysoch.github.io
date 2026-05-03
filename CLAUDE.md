# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Monorepo hosting two independent React + TypeScript idle games, both deployed to GitHub Pages under separate subdirectories:

- **`idle-game/`** — Lifespan-based idle game (age progression, skills, rebirth) NOTE: You can not access this part. It is not used in development
- **`DyWorld-Inc/`** — Business simulation (jobs, buildings, market, passive income)

## Commands

All commands must be run from within the project subdirectory (`idle-game/` or `DyWorld-Inc/`).

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

There are no test suites in either project.

## Deployment

GitHub Actions (`.github/workflows/deploy.yml`) triggers on push to `main`:
1. Builds both projects sequentially
2. Merges `idle-game/dist/` → `deploy/idle-game/` and `DyWorld-Inc/dist/` → `deploy/DyWorld-Inc/`
3. Pushes `deploy/` to the `gh-pages` branch

Each project's `vite.config.ts` must set `base: '/<project-name>/'` to match its subdirectory path on GitHub Pages. Changing the base breaks routing and asset loading.

## Architecture

### Shared patterns across both projects

Both use the same stack: **React 19 + TypeScript 5 + Bootstrap 5.3 + Zustand 5 + Vite 7**.

**UI layout:** Fixed three-panel shell — `TopBar` (56px, z-index 1030) → `SideBar` (220px wide, z-index 1020) → `ContentArea` (fills remaining space). Tab navigation is state-driven (no router): `activeTab` in Zustand determines which page component renders inside `ContentArea`.

**Data-driven design:** All game content lives in JSON files (`src/content/` or `src/data/`), loaded as typed module imports. Adding a new resource/job/building means editing JSON only — the store and pages iterate over these arrays dynamically.

**Bootstrap theming:** Dark/light mode is set via `document.documentElement.setAttribute('data-bs-theme', theme)`. Bootstrap JS is **not loaded** — dropdowns and modals are implemented manually in React. Tooltips use the HTML `title` attribute.

**TypeScript:** Strict mode, no unused locals/parameters. ESLint v9 flat config. `verbatimModuleSyntax` is enabled — use `import type` for type-only imports.

---

### DyWorld-Inc

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

### idle-game

**Store** (`src/store/gameStore.ts`): Zustand store, optionally persisted. Contains lifespan, resources, skills, rebirth count, and game flags (`isDead`, `isPaused`).

**Game loop in `App.tsx`**: 1-second tick generates resources based on owned skill levels and their `effects.generates` values. Prestige/rebirth resets most state but increments `rebirths`.

**Data files** (`src/data/`): `skills.json`, `resources.json`, `upgrades.json`, `generators.json`, `changelog.json`.
