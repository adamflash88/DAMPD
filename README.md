# DAMPD

Motorcycle suspension setup and trackside logging. Built with Expo (SDK 58), Expo Router and strict TypeScript, and runs in **Expo Go** with no custom native code.

- **Testing on your iPhone:** see [docs/IPHONE_TESTING.md](docs/IPHONE_TESTING.md)
- **Architecture:** see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Demo data

The app seeds a 2026 Kawasaki KX250. **None of its suspension values have been verified.** Every seeded hardware name, spring rate, clicker setting, clicker range and sag figure is a demonstration placeholder chosen only so the UI has something to render. Each carries `source: 'demo'` and shows a small amber dot. The suspension profile has one notice summarizing them. Editing a value replaces it with yours. The notice's "keep as mine" action asks first, then records the values as **rider-entered**. They are never marked manufacturer-verified.

The motorcycle catalog used when adding a bike is a small demonstration list of **names only**, with no specs. Anything else can be entered manually.

## Project layout

```
src/
  app/          Expo Router routes (tabs + stack screens)
  components/   ui/ design-system kit; suspension/ and session/ domain widgets
  data/         Repository interfaces, hooks, Zustand+AsyncStorage implementation, migrations
  domain/       Pure TypeScript model: types, settings registry, units, snapshot/delta/diff logic,
                catalog, seed, tuning context (future diagnostics), service records (future tuners)
  theme/        Design tokens (colors, spacing, radius, typography)
  extensions/   Notes on where future features plug in
__tests__/      Jest: domain, repositories, migration, and UI integration tests (real router)
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
