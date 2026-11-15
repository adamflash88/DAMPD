# Architecture

## Layers

```
src/app (Expo Router screens)
   │  reads via hooks, writes via repositories
   ▼
src/data ── hooks.ts (reactive reads) · repositories.ts (async commands) · migrations.ts
   │
   ▼
src/data/zustand ── Zustand store persisted to AsyncStorage (key "dampd/state")

src/domain ── pure TypeScript, no React/storage: types, settings registry, setup math,
              units, catalog, labels, session summaries, tuning context, service records
src/components/ui ── design-system kit;  src/components/{suspension,session} ── domain widgets
src/theme/tokens.ts ── every color, spacing step, radius, touch size and type style
```

Screens import only from `src/data` (never the store), so swapping storage for expo-sqlite or a server means re-implementing `Repositories` and the hooks. Screens stay untouched.

## Data model (schema v2)

| Record | Notes |
| --- | --- |
| `Value<T>` | `{ value, source }`, where `source` is `manufacturer` \| `user` \| `demo` \| `unknown`. These stay distinct. Rider edits produce `user`. Confirming a demo value produces `user`, never `manufacturer`. Nothing in this build assigns `manufacturer`. |
| `Bike` | Identity (`year`, `make`, `model`, `nickname`, `catalogId`), display `units`, live `suspension`. |
| `SuspensionSetup` | `fork` / `shock`, each with `hardware`, `adjusters[]`, `measurements` and `modifications[]`. The fork also has `springType` (coil/air). |
| `Adjuster` | Only the adjusters a bike actually has. `kind` is compression, rebound, hsc, lsc, hsr, lsr or custom. `mechanism` is clicks or turns, with fractional `step` for turns. `convention` is out-from-full-stiff or in-from-full-soft. Also `current` and `range`. |
| Measurements | Canonical units: spring rate N/mm, lengths mm (sag, fork height, **oil height**), **oil volume** cc (a separate field, never converted from height), air pressure psi. Air pressure shows only on air forks, spring rate only on coil. |
| `Session` | `snapshot` (immutable deep copy of setup and units at start), `conditions` (latest), `events[]` (append-only timeline), `notes`, `legacyFeedback` (v1 ratings, preserved). |
| `SessionEvent` | `testRun` (run number, outcome vs. previous run, `SymptomReport[]`, notes), `adjustment` (`path`, `before`, `after`, `reason`), `conditions` (a change log). |
| `SymptomReport` | Symptom type (or custom label), affected end, severity 1–5, riding situations, confidence, notes. |
| `SavedSetup` | Named setup copy. Origin is `user`, `session` or `autoBeforeRestore`. |
| `RiderProfile` | Optional name, weight (kg), skill level, notes. |

### Integrity rules

1. **Snapshots never reference the live profile.** Garage edits can't change history. Tested.
2. **Adjustments are deltas.** `before` comes from snapshot plus earlier adjustments. The rider can only supply it when it's unknown. The setup at the end of a session is always calculated (`applyAdjustments`), never stored.
3. **Timelines are append-only.** The only removal is *undo last entry*, which can't invalidate later entries.
4. **Validation.** Adjuster values snap to the step and are clamped to the range. Measurements have plausibility bounds. The repository rejects unknown setting paths.
5. **Restoring a saved setup** first saves the current setup as `autoBeforeRestore`.
6. **Units are display-only.** Switching units never changes stored data.
7. **IDs** are UUID v4 (`expo-crypto`). Every record has `createdAt` and `updatedAt`.

### Migration v1 → v2

`src/data/migrations.ts` runs automatically through Zustand `persist({ version: 2, migrate })` on the same storage key, so existing installs upgrade in place.

- **Provenance:** `isVerified: true` with a value becomes `user`; `false` becomes `demo`; an empty value becomes `unknown`.
- **Units:** values move into canonical units, using the unit the v1 bike or snapshot was using (kg/mm → N/mm, in → mm, °F → °C).
- **Oil level:** v1's single field goes to `oilHeight` if the bike used mm, or `oilVolume` if it used cc.
- **Clickers:** become `clicks` adjusters with the bike's v1 convention.
- **Session data:** v1 adjustments become `adjustment` events (paths mapped, values converted). v1 ratings and notes are kept in `legacyFeedback` and shown in the session as "Ratings (earlier app version)".
- **Nothing is dropped.** Tested with a realistic v1 fixture, including reading a v1 blob from AsyncStorage.

## Future-facing contracts (no implementation by design)

- **Diagnostics:** `src/domain/context.ts` defines `buildTuningContext()`, which returns one serializable object with rider, bike, current setup and every session's starting and ending setup, adjustments and test runs. The `DiagnosticsProvider` interface has **no implementation**, and nothing in the app produces recommendations.
- **Professional tuners:** `src/domain/service.ts` defines `ServiceRecord`, with `public` (rider-visible) and `private` (technician-only) parts. `toRiderView()` is the only way rider code should read a record, and it strips private data (tested). These records aren't persisted or shown yet.

## Libraries

All included in Expo Go for SDK 58. Versions come from SDK 58's bundled version map.

`expo-router`, `zustand`, `@react-native-async-storage/async-storage`, `expo-crypto`, `@react-native-community/datetimepicker`, `@expo/vector-icons` (+ `expo-font`, `expo-asset`), `expo-updates` (for EAS Update).

Dev: `jest-expo`, `@testing-library/react-native` (via `expo-router/testing-library`), `eslint-config-expo`.
