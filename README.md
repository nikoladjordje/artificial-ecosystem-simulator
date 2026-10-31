# Artificial Ecosystem Simulator

A browser-based, deterministic sandbox for exploring simplified ecosystem rules. Plants regenerate on a wrapping grid, while seeded herbivores seek food, spend energy, inherit bounded traits, reproduce, and die from depletion or age.

## Development

Install dependencies with `npm install`, then use:

- `npm run dev` — start the local development server.
- `npm run build` — type-check and create a production build.
- `npm test` — run the automated test suite.
- `npm run lint` — run the TypeScript static checks.

## Model boundary

`Simulation` is the headless boundary between ecology rules and the browser UI. It validates its scenario and seed, advances ticks, and exposes immutable snapshots of biomass and herbivores, including age, reproduction cooldown, and inherited traits. Each tick regenerates plants, charges upkeep and vision, removes animals that reach zero energy or maximum age, moves survivors toward visible food or takes seeded search steps, charges for movement, feeds from the current cell, reproduces eligible herbivores, then removes depleted animals. Reproduction transfers a configured fraction of parent energy to one offspring in a neighboring wrapped cell. Offspring inherit speed, vision, energy efficiency, and reproduction threshold; each trait can mutate independently within its configured bounds. The canvas consumes snapshots, while the page reports average lineage traits so the trade-offs remain visible.
