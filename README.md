# DAMPD

Motorcycle suspension setup and trackside logging. Built with Expo (SDK 58), Expo Router and strict TypeScript, and runs in **Expo Go** with no custom native code.

- **Testing on your iPhone:** see [docs/IPHONE_TESTING.md](docs/IPHONE_TESTING.md)
- **Architecture:** see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Illustrative data

The app seeds a 2026 Kawasaki KX250. **None of its suspension values have been verified.** Every seeded hardware name, spring rate, clicker setting, clicker range and sag figure is a placeholder chosen only so the UI has something to render. Each one carries `isVerified: false` and shows an amber **Illustrative** badge until you edit it or tap the badge to confirm it against your own manual or measurements.

## Project layout

```
src/
  app/          Expo Router routes (tabs + stack screens)
  components/   UI building blocks (Stepper, NumericField, badges, cards…)
  data/         Repository interfaces, hooks, Zustand+AsyncStorage implementation, migrations
  domain/       Pure TypeScript model: types, settings registry, snapshot/delta/diff logic, seed
  theme/        Design tokens (colors, spacing, radius, typography)
  extensions/   Notes on where future features plug in
__tests__/      Jest tests for domain + data layers
.github/        CI (typecheck/lint/test/doctor) and EAS Update preview workflow
```

## Scripts

These run automatically in GitHub Actions; you don't need a local terminal.

| Script | What it does |
| --- | --- |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | `expo lint` |
| `npm test` | Jest unit tests |
| `npm run doctor` | `expo-doctor` |
