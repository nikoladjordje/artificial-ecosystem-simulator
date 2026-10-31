# 03: Add heredity, reproduction, and selection for herbivores

**What to build:** A learner can see herbivore lineages age, reproduce asexually after a cooldown and energy threshold, pass bounded traits to nearby offspring, and evolve through seeded mutation. Speed, vision, energy efficiency, and reproduction threshold have visible survival trade-offs.

**Blocked by:** 02: Add herbivore survival and foraging.

**Status:** completed

- [x] Reproduction transfers configured parent energy, respects cooldowns and capacity limits, and uses valid neighboring placement without requiring empty cells.
- [x] Inherited numeric traits mutate independently within configured bounds, while movement and vision impose explicit energy costs.
- [x] Tests cover age death, reproduction eligibility, inheritance, mutation limits, trait trade-offs, and repeatable seeded outcomes.
