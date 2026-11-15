# Extension points

These are features we deliberately haven't built yet. Each note says where the feature attaches, so it can be added without reshaping existing code. There are no stub implementations here on purpose.

## Storage backend (expo-sqlite, sync)

- Implement `Repositories` from `src/data/repositories.ts` (async commands).
- Re-implement the read hooks in `src/data/hooks.ts` (for example with live queries).
- Swap the export in `src/data/index.ts`. Screens import only from `src/data`, so they don't change.
- Migrate existing AsyncStorage data once: read the `dampd/state` key and insert the rows.

## Diagnostics / setup recommendations (AI or otherwise)

- Input contract already exists: `buildTuningContext()` in `src/domain/context.ts` returns rider, bike, hardware, modifications, current setup, conditions, structured symptoms, adjustments and outcomes.
- Implement `DiagnosticsProvider` (same file) in `src/services/`. Don't call providers from screens directly; add a hook in `src/data`.
- Show results as suggestions the rider accepts. Accepting one goes through `sessionRepository.addAdjustment`, so the history stays honest. Never label rule-based output as AI.

## Professional tuners / service records

- Types and the rider-safe projection exist in `src/domain/service.ts` (`ServiceRecord`, `toRiderView`).
- To ship: add a `serviceRecords` collection with a schema migration, a `ServiceRecordRepository`, and render records only through `toRiderView`. Technician-private fields must never reach rider screens.

## Auth and accounts

- Wrap the root layout (`src/app/_layout.tsx`) in a provider. Add `ownerId` to `Entity` with a schema migration (`src/data/migrations.ts`).

## Payments

- Gate features at the screen level with a hook (for example `useEntitlements()`). Don't put payment logic in the domain or data layers.

## External APIs (weather, track databases)

- Put fetchers in `src/services/`. Map responses into `TrackConditions` before they reach the domain layer.

## Units

- Values are stored canonically (`src/domain/units.ts`). `Bike.units` only controls display. To add a unit (e.g. bar), extend `Quantity` conversion and `DisplayUnits`.
