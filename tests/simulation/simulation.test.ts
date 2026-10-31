import { describe, expect, it } from 'vitest';

import { Simulation } from '../../src/simulation/simulation';
import { defaultPlantWorldScenario } from '../../src/config/scenarios';

describe('Simulation', () => {
  it('replays equal plant-world snapshots for the same seed and scenario', () => {
    const scenario = {
      ...defaultPlantWorldScenario,
      gridWidthCells: 3,
      gridHeightCells: 2,
      initialPlantBiomass: 1,
      plantRegenerationPerTick: 2,
      maximumPlantBiomass: 5,
    };
    const first = new Simulation(scenario, 42);
    const second = new Simulation(scenario, 42);

    first.tick(4);
    second.tick(4);

    expect(first.snapshot()).toEqual(second.snapshot());
  });

  it('wraps cells and never regenerates biomass above the configured cap', () => {
    const simulation = new Simulation({
      ...defaultPlantWorldScenario,
      gridWidthCells: 2,
      gridHeightCells: 1,
      initialPlantBiomass: 4,
      plantRegenerationPerTick: 3,
      maximumPlantBiomass: 5,
    }, 7);

    simulation.tick();
    const snapshot = simulation.snapshot();

    expect(snapshot.plantBiomass).toEqual([[5, 5]]);
    expect(snapshot.plantBiomass[0][2]).toBeUndefined();
    expect(snapshot.cellAt(-1, 0)).toBe(5);
    expect(snapshot.cellAt(2, 0)).toBe(5);
  });

  it('returns an immutable snapshot', () => {
    const simulation = new Simulation(defaultPlantWorldScenario, 7);
    const snapshot = simulation.snapshot();

    expect(() => (snapshot.plantBiomass[0] as number[])[0] = 0).toThrow();
    expect(simulation.snapshot().plantBiomass[0][0]).toBe(defaultPlantWorldScenario.initialPlantBiomass);
  });

  it('rejects invalid public tick and seed inputs', () => {
    const simulation = new Simulation(defaultPlantWorldScenario, 7);

    expect(() => simulation.tick(0)).toThrow('ticks must be a positive whole number');
    expect(() => new Simulation(defaultPlantWorldScenario, 1.5)).toThrow('seed must be a whole number');
  });
});
