# 02: Add herbivore survival and foraging

**What to build:** A learner can watch deterministically placed herbivores spend energy, seek visible plant biomass, search when food is not visible, consume limited food from their current cell, wrap across the world, and die when their energy reaches zero.

**Blocked by:** 01: Bootstrap a deterministic plant-world sandbox.

**Status:** complete

- [x] Herbivore movement, seeded target tie-breaking, random search, local feeding, energy decay, and zero-energy death are observable through the simulation boundary.
- [x] The canvas distinguishes herbivores from plant biomass and preserves a responsive runnable experience.
- [x] Tests verify feeding limits, movement and wrapping, deterministic random choices, and immediate death before later actions.
