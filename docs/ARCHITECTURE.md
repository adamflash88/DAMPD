# Architecture

## Layers

```
src/app (screens) ──► src/data (hooks + repositories) ──► src/data/zustand (store, AsyncStorage)
        │                        │
        └────────► src/domain (pure TS: types, settings, setup math, seed) ◄────┘
```

- **Domain** (`src/domain`) has no React or storage imports. It holds the types, the settings registry, and the functions that create snapshots, apply adjustments and diff setups. It's covered by unit tests.
- **Data** (`src/data`) is split in two:
  - *Commands* go through async repository interfaces (`bikeRepository`, `sessionRepository`).
  - *Reads* go through hooks (`useActiveBike`, `useSessionsForBike`, …).

  The current implementation is Zustand with the `persist` middleware on AsyncStorage. Screens import only from `src/data`, so moving to expo-sqlite means writing new repositories and hooks, not touching screens.
- **UI**: `src/theme/tokens.ts` holds every color, spacing step, radius and type style. Components in `src/components` use those tokens and nothing else.

## Data model

| Record | Key fields |
| --- | --- |
| `Bike` | `id`, `createdAt`, `updatedAt`, `year`, `make`, `model`, `nickname`, `units`, `suspension` |
| `SuspensionSetup` | `fork` and `shock`, each with `make`, `model`, `modifications[]`, `settings`, `clickerRanges` |
| `Spec<T>` | `{ value, isVerified }`. Every setup value. `isVerified: false` shows the Illustrative badge |
| `Session` | `id`, timestamps, `bikeId`, `status`, `trackName`, `date`, `conditions`, `feedback`, `snapshot`, `adjustments[]` |
| `SetupSnapshot` | deep copy of `setup` + `units` + `bikeLabel` + `capturedAt` |
| `Adjustment` | `id`, timestamps, `setting` (e.g. `shock.lowSpeedCompression`), `before`, `after`, `reason` |

### Rules

1. **Snapshots never reference the live profile.** `createSnapshot` deep-copies the bike's setup and units when a session starts. Editing the profile later can't change history. A unit test checks this.
2. **Adjustments are deltas.** Each one stores `before → after` for a single setting. The setup at the end of a session is never stored; it's always calculated as `applyAdjustments(snapshot.setup, adjustments)`. `before` comes from the snapshot plus earlier adjustments. If you remove an adjustment, the `before` values of the later ones are recalculated.
3. **Units and clicker convention are stored per bike** (`Bike.units`) and copied into every snapshot. The default is mm for sag, N/mm for springs, and clicks out from full stiff.
4. **IDs** are UUID v4 from `expo-crypto`. Every record has ISO `createdAt` and `updatedAt` timestamps.
5. **Schema versioning:** `SCHEMA_VERSION` and `migratePersistedState` live in `src/data/migrations.ts`, and Zustand's `persist({ version, migrate })` calls them. A missing migration step throws instead of quietly corrupting data.

## Libraries

All of these are included in Expo Go for SDK 58. Versions were resolved with `expo install` against the SDK's bundled version map.

| Library | Why |
| --- | --- |
| `expo-router` | File-based routing; tabs + stack |
| `zustand` | Small store with a `persist` middleware |
| `@react-native-async-storage/async-storage` | Persistence available in Expo Go |
| `expo-crypto` | `randomUUID()` |
| `@react-native-community/datetimepicker` | Session date picker |
| `@expo/vector-icons` | Icons |
| `expo-updates` | Required for EAS Update configuration |
