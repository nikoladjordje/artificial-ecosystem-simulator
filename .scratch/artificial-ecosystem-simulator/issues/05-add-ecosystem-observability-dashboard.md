# 05: Add ecosystem observability dashboard

**What to build:** A learner can select an organism to understand its traits, energy, age, and current action; can see population and plant-biomass histories; and can see trait distributions, run seed, tick, and explicit extinction status while the complete ecosystem runs.

**Blocked by:** 04: Add predator-prey dynamics and extinction outcomes.

**Status:** ready-for-agent

- [x] Organism inspection and dashboard views are driven solely from immutable simulation snapshots.
- [x] Population, biomass, and per-species trait views make ecological cycles and selection observable without implying scientific calibration.
- [x] Tests verify displayed public run data, selection behavior, extinction indicators, and chart inputs without depending on rendering internals.
