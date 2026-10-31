# Artificial Ecosystem Simulator

A browser-based, deterministic sandbox for exploring simplified ecosystem rules. Plants regenerate on a wrapping grid, while seeded herbivores seek food, spend energy, and die when depleted.

## Development

Install dependencies with `npm install`, then use:

- `npm run dev` — start the local development server.
- `npm run build` — type-check and create a production build.
- `npm test` — run the automated test suite.
- `npm run lint` — run the TypeScript static checks.

## Model boundary

`Simulation` is the headless boundary between ecology rules and the browser UI. It validates its scenario and seed, advances ticks, and exposes immutable snapshots of biomass and herbivores. Each tick regenerates plants, charges herbivore energy loss and removes animals at zero energy, moves survivors toward visible food or takes a seeded search step, then feeds them from the cell they occupy. The canvas only consumes snapshots and marks herbivores in yellow.
