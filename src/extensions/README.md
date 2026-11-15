# Extension points

These are features we deliberately haven't built yet. Each note says where the feature attaches, so it can be added without reshaping existing code. There are no stub implementations here on purpose.

## Storage backend (expo-sqlite, sync)

- Implement `Repositories` from `src/data/repositories.ts` (async commands).
- Re-implement the read hooks in `src/data/hooks.ts` (for example with live queries).
- Swap the export in `src/data/index.ts`. Screens import only from `src/data`, so they don't change.
- Migrate existing AsyncStorage data once: read the `dampd/state` key and insert the rows.

## Setup recommendations (AI or rules-based)

- Inputs already exist as plain data: `Session.snapshot`, `Session.adjustments`, `Session.conditions` and `Session.feedback`.
- Add a pure `src/domain/recommendations.ts` (input: sessions; output: suggested `NewAdjustmentInput[]` with rationale), plus a service in `src/services/` if it calls an API.
- Recommendations should be shown as suggestions the rider accepts. Accepting one goes through `sessionRepository.addAdjustment`, so the history stays honest.

## Auth and accounts

- Wrap the root layout (`src/app/_layout.tsx`) in a provider. Add `ownerId` to `Entity` with a schema migration (`src/data/migrations.ts`).

## Payments

- Gate features at the screen level with a hook (for example `useEntitlements()`). Don't put payment logic in the domain or data layers.

## External APIs (weather, track databases)

- Put fetchers in `src/services/`. Map responses into `TrackConditions` before they reach the domain layer.

## Unit conversion

- Units are stored per bike (`Bike.units`) and captured in each `SetupSnapshot`. A conversion helper in `src/domain/units.ts` can normalize values for comparison. Today, changing units relabels values but doesn't convert them.
