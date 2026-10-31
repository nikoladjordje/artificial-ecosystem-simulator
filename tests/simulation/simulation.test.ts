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
      initialHerbivoreCount: 0,
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
      initialHerbivoreCount: 0,
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

  it('feeds a herbivore only up to its per-tick limit and exposes the result', () => {
    const simulation = new Simulation({
      ...defaultPlantWorldScenario,
      gridWidthCells: 1,
      gridHeightCells: 1,
      initialPlantBiomass: 5,
      plantRegenerationPerTick: 0,
      initialHerbivoreCount: 1,
      initialHerbivoreEnergy: 3,
      herbivoreEnergyLossPerTick: 0,
      herbivoreFoodLimitPerTick: 1,
      herbivoreVisionRangeCells: 0,
    }, 12);

    simulation.tick();

    expect(simulation.snapshot().herbivores[0].energy).toBe(4);
    expect(simulation.snapshot().plantBiomass[0][0]).toBe(4);
  });

  it('moves toward visible food, wraps at the world edge, and replays seeded choices', () => {
    const scenario = {
      ...defaultPlantWorldScenario,
      gridWidthCells: 3,
      gridHeightCells: 1,
      initialPlantBiomass: 0,
      initialPlantBiomassByCell: [[0, 0, 2]],
      plantRegenerationPerTick: 0,
      initialHerbivoreCount: 1,
      initialHerbivoreEnergy: 10,
      herbivoreEnergyLossPerTick: 0,
      herbivoreFoodLimitPerTick: 1,
      herbivoreVisionRangeCells: 3,
      initialHerbivorePositions: [{ x: 0, y: 0 }],
    };
    const first = new Simulation(scenario, 15);
    const second = new Simulation(scenario, 15);

    first.tick();
    second.tick();

    expect(first.snapshot().herbivores[0].x).toBe(2);
    expect(first.snapshot()).toEqual(second.snapshot());
  });

  it('removes a herbivore at zero energy before it can move or feed', () => {
    const simulation = new Simulation({
      ...defaultPlantWorldScenario,
      gridWidthCells: 1,
      gridHeightCells: 1,
      initialPlantBiomass: 5,
      plantRegenerationPerTick: 0,
      initialHerbivoreCount: 1,
      initialHerbivoreEnergy: 1,
      herbivoreEnergyLossPerTick: 1,
      initialHerbivorePositions: [{ x: 0, y: 0 }],
    }, 19);

    simulation.tick();

    expect(simulation.snapshot().herbivores).toEqual([]);
    expect(simulation.snapshot().plantBiomass[0][0]).toBe(5);
  });

  it('uses seeded search steps when no food is visible', () => {
    const scenario = {
      ...defaultPlantWorldScenario,
      gridWidthCells: 4,
      gridHeightCells: 4,
      initialPlantBiomass: 0,
      plantRegenerationPerTick: 0,
      initialHerbivoreCount: 1,
      initialHerbivoreEnergy: 10,
      herbivoreEnergyLossPerTick: 0.25,
      herbivoreVisionRangeCells: 0,
      initialHerbivorePositions: [{ x: 2, y: 2 }],
    };
    const first = new Simulation(scenario, 81);
    const second = new Simulation(scenario, 81);

    first.tick();
    second.tick();

    expect(first.snapshot().herbivores[0]).toEqual(second.snapshot().herbivores[0]);
    expect(first.snapshot().herbivores[0]).not.toMatchObject({ x: 2, y: 2 });
    expect(first.snapshot().herbivores[0].energy).toBe(9.75);
  });

  it('breaks equal visible-food ties using the seeded random stream', () => {
    const scenario = {
      ...defaultPlantWorldScenario,
      gridWidthCells: 3,
      gridHeightCells: 1,
      initialPlantBiomass: 0,
      initialPlantBiomassByCell: [[2, 0, 2]],
      plantRegenerationPerTick: 0,
      initialHerbivoreCount: 1,
      initialHerbivoreEnergy: 10,
      herbivoreEnergyLossPerTick: 0,
      herbivoreVisionRangeCells: 1,
      initialHerbivorePositions: [{ x: 1, y: 0 }],
    };
    const first = new Simulation(scenario, 21);
    const second = new Simulation(scenario, 21);

    first.tick();
    second.tick();

    expect(first.snapshot().herbivores[0].x).toBe(2);
    expect(first.snapshot()).toEqual(second.snapshot());
  });
});
