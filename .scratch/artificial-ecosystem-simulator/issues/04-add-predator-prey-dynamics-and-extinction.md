# 04: Add predator-prey dynamics and extinction outcomes

**What to build:** A learner can run a three-level ecosystem in which predators seek herbivores, kill and consume at most one co-located prey per tick, reproduce using the established trait rules, and produce clearly visible species-extinction outcomes without automatic repopulation.

**Blocked by:** 03: Add heredity, reproduction, and selection for herbivores.

**Status:** completed

- [x] Predators use the shared deterministic movement, energy, aging, reproduction, and inheritance model while targeting herbivores.
- [x] Predation transfers the configured fraction of prey energy and never consumes more than one herbivore per predator per tick.
- [x] A run continues after animal extinction with plants regenerating, and tests cover predation, extinction, and phase-order behavior.
