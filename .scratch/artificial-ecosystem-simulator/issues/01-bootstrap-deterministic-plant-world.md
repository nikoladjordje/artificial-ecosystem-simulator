# 01: Bootstrap a deterministic plant-world sandbox

**What to build:** A runnable TypeScript browser sandbox where a learner can run, pause, and reset a seeded plant-biomass world on a wrapping grid, seeing biomass change on a canvas. The experience establishes a validated, headless simulation boundary with immutable snapshots and deterministic replay.

**Blocked by:** None (can start immediately).

**Status:** completed

- [x] A seed and valid scenario reproduce the same plant-world snapshots through the same tick count, including wrapping cells and capped regeneration.
- [x] A learner can view the plant grid, run, pause, and reset it without the UI mutating simulation state directly.
- [x] Invalid scenario values are rejected with useful feedback, and behavior-focused tests cover the public simulation boundary.
