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
    expect(first.snapshot().herbivores[0].energy).toBe(9.65);
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

  it('removes a herbivore when it reaches its maximum age', () => {
    const simulation = new Simulation({
      ...defaultPlantWorldScenario,
      gridWidthCells: 1,
      gridHeightCells: 1,
      initialPlantBiomass: 0,
      plantRegenerationPerTick: 0,
      initialHerbivoreCount: 1,
      initialHerbivoreEnergy: 10,
      herbivoreEnergyLossPerTick: 0,
      maximumHerbivoreAgeTicks: 1,
      herbivoreVisionRangeCells: 0,
    }, 3);

    simulation.tick();

    expect(simulation.snapshot().herbivores).toEqual([]);
  });

  it('reproduces after the energy threshold, transfers energy, and respects cooldown and capacity', () => {
    const simulation = new Simulation({
      ...defaultPlantWorldScenario,
      gridWidthCells: 3,
      gridHeightCells: 3,
      initialPlantBiomass: 0,
      plantRegenerationPerTick: 0,
      initialHerbivoreCount: 1,
      initialHerbivoreEnergy: 20,
      herbivoreEnergyLossPerTick: 0,
      herbivoreMovementEnergyCost: 0,
      herbivoreVisionEnergyCostPerCell: 0,
      herbivoreVisionRangeCells: 0,
      herbivoreReproductionEnergyThreshold: 10,
      herbivoreReproductionCooldownTicks: 2,
      herbivoreReproductionEnergyFraction: 0.5,
      maximumHerbivoreCount: 2,
      initialHerbivorePositions: [{ x: 1, y: 1 }],
    }, 4);

    simulation.tick();
    const firstGeneration = simulation.snapshot().herbivores;
    expect(firstGeneration).toHaveLength(2);
    expect(firstGeneration.map(({ energy }) => energy)).toEqual([10, 10]);
    expect(firstGeneration[1]).toMatchObject({ ageTicks: 0, reproductionCooldownTicks: 2 });
    const wrappedXDistance = Math.min(
      Math.abs(firstGeneration[0].x - firstGeneration[1].x),
      3 - Math.abs(firstGeneration[0].x - firstGeneration[1].x),
    );
    const wrappedYDistance = Math.min(
      Math.abs(firstGeneration[0].y - firstGeneration[1].y),
      3 - Math.abs(firstGeneration[0].y - firstGeneration[1].y),
    );
    expect(wrappedXDistance + wrappedYDistance).toBe(1);

    simulation.tick();
    expect(simulation.snapshot().herbivores).toHaveLength(2);

    const capped = new Simulation({
      ...defaultPlantWorldScenario,
      gridWidthCells: 3,
      gridHeightCells: 3,
      initialPlantBiomass: 0,
      plantRegenerationPerTick: 0,
      initialHerbivoreCount: 1,
      initialHerbivoreEnergy: 20,
      herbivoreEnergyLossPerTick: 0,
      herbivoreMovementEnergyCost: 0,
      herbivoreVisionEnergyCostPerCell: 0,
      herbivoreVisionRangeCells: 0,
      herbivoreReproductionEnergyThreshold: 10,
      maximumHerbivoreCount: 1,
      initialHerbivorePositions: [{ x: 1, y: 1 }],
    }, 8);
    capped.tick();
    expect(capped.snapshot().herbivores).toHaveLength(1);
  });

  it('inherits bounded traits with seeded, independent mutations and repeats the same lineage', () => {
    const scenario = {
      ...defaultPlantWorldScenario,
      gridWidthCells: 2,
      gridHeightCells: 1,
      initialPlantBiomass: 0,
      plantRegenerationPerTick: 0,
      initialHerbivoreCount: 1,
      initialHerbivoreEnergy: 20,
      herbivoreEnergyLossPerTick: 0,
      herbivoreMovementEnergyCost: 0,
      herbivoreVisionEnergyCostPerCell: 0,
      herbivoreVisionRangeCells: 0,
      herbivoreReproductionEnergyThreshold: 10,
      herbivoreReproductionEnergyFraction: 0.5,
      herbivoreMutationProbability: 1,
      herbivoreMutationMagnitude: 10,
      herbivoreSpeedRange: [1, 2] as const,
      herbivoreVisionRange: [0, 2] as const,
      herbivoreEnergyEfficiencyRange: [0.8, 1.2] as const,
      herbivoreReproductionThresholdRange: [8, 12] as const,
      initialHerbivorePositions: [{ x: 0, y: 0 }],
    };
    const first = new Simulation(scenario, 71);
    const replay = new Simulation(scenario, 71);

    first.tick();
    replay.tick();

    const offspring = first.snapshot().herbivores[1];
    expect(first.snapshot()).toEqual(replay.snapshot());
    expect(offspring.traits.speed).toBeGreaterThanOrEqual(1);
    expect(offspring.traits.speed).toBeLessThanOrEqual(2);
    expect(offspring.traits.visionRangeCells).toBeGreaterThanOrEqual(0);
    expect(offspring.traits.visionRangeCells).toBeLessThanOrEqual(2);
    expect(offspring.traits.energyEfficiency).toBeGreaterThanOrEqual(0.8);
    expect(offspring.traits.energyEfficiency).toBeLessThanOrEqual(1.2);
    expect(offspring.traits.reproductionThreshold).toBeGreaterThanOrEqual(8);
    expect(offspring.traits.reproductionThreshold).toBeLessThanOrEqual(12);
  });

  it('charges explicit energy costs for vision and speed', () => {
    const makeSimulation = (speed: number, vision: number) => new Simulation({
      ...defaultPlantWorldScenario,
      gridWidthCells: 3,
      gridHeightCells: 3,
      initialPlantBiomass: 0,
      plantRegenerationPerTick: 0,
      initialHerbivoreCount: 1,
      initialHerbivoreEnergy: 10,
      herbivoreEnergyLossPerTick: 0,
      herbivoreMovementEnergyCost: 0.5,
      herbivoreVisionEnergyCostPerCell: 0.25,
      herbivoreVisionRangeCells: vision,
      herbivoreVisionRange: [0, 4],
      herbivoreSpeedRange: [speed, speed],
    }, speed * 10 + vision);
    const baseline = makeSimulation(1, 0);
    const costly = makeSimulation(2, 2);

    baseline.tick();
    costly.tick();

    expect(baseline.snapshot().herbivores[0].energy).toBe(9.5);
    expect(costly.snapshot().herbivores[0].energy).toBe(8.5);
  });
});
