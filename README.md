# Artificial Ecosystem Simulator

A browser-based, deterministic sandbox for exploring simplified ecosystem rules. This initial plant-world build renders renewable biomass on a wrapping grid.

## Development

Install dependencies with `npm install`, then use:

- `npm run dev` — start the local development server.
- `npm run build` — type-check and create a production build.
- `npm test` — run the automated test suite.
- `npm run lint` — run the TypeScript static checks.

## Model boundary

`Simulation` is the headless boundary between ecology rules and the browser UI. It validates its scenario and seed, advances ticks, and exposes immutable snapshots. The canvas only consumes snapshots.
