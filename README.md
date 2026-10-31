# Artificial Ecosystem Simulator

A browser-based, deterministic sandbox for exploring simplified ecosystem rules. Plants regenerate on a wrapping grid, herbivores seek food, and predators hunt herbivores. Both animal species spend energy, inherit bounded traits, reproduce, and die from depletion or age.

## Development

Install dependencies with `npm install`, then use:

- `npm run dev` — start the local development server.
- `npm run build` — type-check and create a production build.
- `npm test` — run the automated test suite.
- `npm run lint` — run the TypeScript static checks.

## Model boundary

`Simulation` is the headless boundary between ecology rules and the browser UI. It validates its scenario and seed, advances ticks, and exposes immutable snapshots of biomass, herbivores, and predators, including age, reproduction cooldown, and inherited traits. Each tick regenerates plants; applies energy decay and removes animals that die; moves both species; feeds herbivores and lets predators hunt; reproduces both species; then removes depleted animals. Predators seek the highest-energy visible herbivore, breaking ties with the seeded random stream, and kill at most one co-located prey apiece. A predator gains a configured fraction of its prey's post-feeding energy. Reproduction transfers energy to an offspring in a neighboring wrapped cell. Offspring inherit speed, vision, energy efficiency, and reproduction threshold; each trait can mutate independently within its configured bounds. When the last animal dies, the simulation keeps ticking and plants keep regenerating without repopulation. The canvas shows herbivores in yellow and predators in orange.
