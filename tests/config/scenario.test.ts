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
});
