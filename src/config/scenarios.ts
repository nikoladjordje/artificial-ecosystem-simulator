export interface PlantWorldScenario {
  gridWidthCells: number;
  gridHeightCells: number;
  initialPlantBiomass: number;
  maximumPlantBiomass: number;
  plantRegenerationPerTick: number;
}

export const defaultPlantWorldScenario: Readonly<PlantWorldScenario> = Object.freeze({
  gridWidthCells: 24,
  gridHeightCells: 16,
  initialPlantBiomass: 3,
  maximumPlantBiomass: 10,
  plantRegenerationPerTick: 0.25,
});

const maximumGridCells = 10_000;

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
