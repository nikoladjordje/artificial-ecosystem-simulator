import { describe, expect, it } from 'vitest';

import { defaultPlantWorldScenario, validatePlantWorldScenario } from '../../src/config/scenarios';

describe('validatePlantWorldScenario', () => {
  it('rejects a negative plant regeneration rate with useful feedback', () => {
    expect(() => validatePlantWorldScenario({
      ...defaultPlantWorldScenario,
      plantRegenerationPerTick: -1,
    })).toThrow('plantRegenerationPerTick must be zero or greater');
  });

  it('rejects an initial biomass above its cap', () => {
    expect(() => validatePlantWorldScenario({
      ...defaultPlantWorldScenario,
      initialPlantBiomass: 11,
      maximumPlantBiomass: 10,
    })).toThrow('initialPlantBiomass cannot exceed maximumPlantBiomass');
  });

  it('rejects invalid herbivore counts and initial positions', () => {
    expect(() => validatePlantWorldScenario({ ...defaultPlantWorldScenario, initialHerbivoreCount: -1 }))
      .toThrow('initialHerbivoreCount must be a non-negative whole number');
    expect(() => validatePlantWorldScenario({
      ...defaultPlantWorldScenario,
      initialHerbivoreCount: 1,
      initialHerbivorePositions: [{ x: 24, y: 0 }],
    })).toThrow('initialHerbivorePositions must be inside the grid');
  });
});
