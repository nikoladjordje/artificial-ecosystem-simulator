export interface PlantWorldScenario {
  gridWidthCells: number;
  gridHeightCells: number;
  initialPlantBiomass: number;
  maximumPlantBiomass: number;
  plantRegenerationPerTick: number;
  initialPlantBiomassByCell?: readonly (readonly number[])[];
  initialHerbivoreCount?: number;
  initialHerbivoreEnergy?: number;
  herbivoreEnergyLossPerTick?: number;
  herbivoreFoodLimitPerTick?: number;
  herbivoreEnergyPerBiomass?: number;
  herbivoreVisionRangeCells?: number;
  initialHerbivorePositions?: readonly { x: number; y: number }[];
}

export const defaultPlantWorldScenario: Readonly<PlantWorldScenario> = Object.freeze({
  gridWidthCells: 24,
  gridHeightCells: 16,
  initialPlantBiomass: 3,
  maximumPlantBiomass: 10,
  plantRegenerationPerTick: 0.25,
  initialHerbivoreCount: 8,
  initialHerbivoreEnergy: 8,
  herbivoreEnergyLossPerTick: 0.5,
  herbivoreFoodLimitPerTick: 1,
  herbivoreEnergyPerBiomass: 1,
  herbivoreVisionRangeCells: 4,
});

const maximumGridCells = 10_000;
const maximumInitialHerbivores = 2_000;

export function validatePlantWorldScenario(scenario: PlantWorldScenario): PlantWorldScenario {
  assertPositiveInteger(scenario.gridWidthCells, 'gridWidthCells');
  assertPositiveInteger(scenario.gridHeightCells, 'gridHeightCells');
  if (scenario.gridWidthCells * scenario.gridHeightCells > maximumGridCells) {
    throw new Error(`grid size cannot exceed ${maximumGridCells} cells`);
  }
  assertNonNegativeFinite(scenario.initialPlantBiomass, 'initialPlantBiomass');
  assertPositiveFinite(scenario.maximumPlantBiomass, 'maximumPlantBiomass');
  assertNonNegativeFinite(scenario.plantRegenerationPerTick, 'plantRegenerationPerTick');
  if (scenario.initialPlantBiomass > scenario.maximumPlantBiomass) {
    throw new Error('initialPlantBiomass cannot exceed maximumPlantBiomass');
  }
  const herbivoreCount = scenario.initialHerbivoreCount ?? 0;
  const initialEnergy = scenario.initialHerbivoreEnergy ?? 8;
  const energyLoss = scenario.herbivoreEnergyLossPerTick ?? 0.5;
  const foodLimit = scenario.herbivoreFoodLimitPerTick ?? 1;
  const energyPerBiomass = scenario.herbivoreEnergyPerBiomass ?? 1;
  const visionRange = scenario.herbivoreVisionRangeCells ?? 4;
  assertNonNegativeInteger(herbivoreCount, 'initialHerbivoreCount');
  if (herbivoreCount > maximumInitialHerbivores) {
    throw new Error(`initialHerbivoreCount cannot exceed ${maximumInitialHerbivores}`);
  }
  assertPositiveFinite(initialEnergy, 'initialHerbivoreEnergy');
  assertNonNegativeFinite(energyLoss, 'herbivoreEnergyLossPerTick');
  assertPositiveFinite(foodLimit, 'herbivoreFoodLimitPerTick');
  assertPositiveFinite(energyPerBiomass, 'herbivoreEnergyPerBiomass');
  assertNonNegativeInteger(visionRange, 'herbivoreVisionRangeCells');
  if (scenario.initialHerbivorePositions && scenario.initialHerbivorePositions.length !== herbivoreCount) {
    throw new Error('initialHerbivorePositions must match initialHerbivoreCount');
  }
  for (const position of scenario.initialHerbivorePositions ?? []) {
    if (!Number.isInteger(position.x) || position.x < 0 || position.x >= scenario.gridWidthCells ||
        !Number.isInteger(position.y) || position.y < 0 || position.y >= scenario.gridHeightCells) {
      throw new Error('initialHerbivorePositions must be inside the grid');
    }
  }
  if (scenario.initialPlantBiomassByCell) {
    if (scenario.initialPlantBiomassByCell.length !== scenario.gridHeightCells ||
        scenario.initialPlantBiomassByCell.some((row) => row.length !== scenario.gridWidthCells)) {
      throw new Error('initialPlantBiomassByCell must match grid dimensions');
    }
    for (const row of scenario.initialPlantBiomassByCell) {
      for (const biomass of row) {
        assertNonNegativeFinite(biomass, 'initialPlantBiomassByCell');
        if (biomass > scenario.maximumPlantBiomass) {
          throw new Error('initialPlantBiomassByCell cannot exceed maximumPlantBiomass');
        }
      }
    }
  }
  return { ...scenario };
}

function assertPositiveInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive whole number`);
  }
}

function assertPositiveFinite(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be greater than zero`);
  }
}

function assertNonNegativeFinite(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be zero or greater`);
  }
}

function assertNonNegativeInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative whole number`);
  }
}
