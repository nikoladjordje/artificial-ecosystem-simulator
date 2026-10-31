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
  maximumHerbivoreCount?: number;
  maximumHerbivoreAgeTicks?: number;
  herbivoreReproductionEnergyThreshold?: number;
  herbivoreReproductionCooldownTicks?: number;
  herbivoreReproductionEnergyFraction?: number;
  herbivoreMovementEnergyCost?: number;
  herbivoreVisionEnergyCostPerCell?: number;
  herbivoreMutationProbability?: number;
  herbivoreMutationMagnitude?: number;
  herbivoreSpeedRange?: readonly [number, number];
  herbivoreVisionRange?: readonly [number, number];
  herbivoreEnergyEfficiencyRange?: readonly [number, number];
  herbivoreReproductionThresholdRange?: readonly [number, number];
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
  maximumHerbivoreCount: 2_000,
  maximumHerbivoreAgeTicks: 120,
  herbivoreReproductionEnergyThreshold: 12,
  herbivoreReproductionCooldownTicks: 12,
  herbivoreReproductionEnergyFraction: 0.5,
  herbivoreMovementEnergyCost: 0.1,
  herbivoreVisionEnergyCostPerCell: 0.025,
  herbivoreMutationProbability: 0.2,
  herbivoreMutationMagnitude: 0.2,
  herbivoreSpeedRange: [1, 3] as const,
  herbivoreVisionRange: [0, 8] as const,
  herbivoreEnergyEfficiencyRange: [0.5, 1.5] as const,
  herbivoreReproductionThresholdRange: [4, 24] as const,
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
  const maximumHerbivores = scenario.maximumHerbivoreCount ?? 2_000;
  const maximumAge = scenario.maximumHerbivoreAgeTicks ?? 120;
  const reproductionThreshold = scenario.herbivoreReproductionEnergyThreshold ?? 12;
  const reproductionCooldown = scenario.herbivoreReproductionCooldownTicks ?? 12;
  const transferFraction = scenario.herbivoreReproductionEnergyFraction ?? 0.5;
  const movementCost = scenario.herbivoreMovementEnergyCost ?? 0.1;
  const visionCost = scenario.herbivoreVisionEnergyCostPerCell ?? 0.025;
  const mutationProbability = scenario.herbivoreMutationProbability ?? 0.2;
  const mutationMagnitude = scenario.herbivoreMutationMagnitude ?? 0.2;
  assertNonNegativeInteger(herbivoreCount, 'initialHerbivoreCount');
  if (herbivoreCount > maximumInitialHerbivores) {
    throw new Error(`initialHerbivoreCount cannot exceed ${maximumInitialHerbivores}`);
  }
  assertPositiveInteger(maximumHerbivores, 'maximumHerbivoreCount');
  if (maximumHerbivores > maximumInitialHerbivores || herbivoreCount > maximumHerbivores) {
    throw new Error(`maximumHerbivoreCount and initialHerbivoreCount cannot exceed ${maximumInitialHerbivores}`);
  }
  assertPositiveInteger(maximumAge, 'maximumHerbivoreAgeTicks');
  assertPositiveFinite(reproductionThreshold, 'herbivoreReproductionEnergyThreshold');
  assertNonNegativeInteger(reproductionCooldown, 'herbivoreReproductionCooldownTicks');
  if (!Number.isFinite(transferFraction) || transferFraction <= 0 || transferFraction >= 1) {
    throw new Error('herbivoreReproductionEnergyFraction must be between zero and one');
  }
  assertNonNegativeFinite(movementCost, 'herbivoreMovementEnergyCost');
  assertNonNegativeFinite(visionCost, 'herbivoreVisionEnergyCostPerCell');
  if (!Number.isFinite(mutationProbability) || mutationProbability < 0 || mutationProbability > 1) {
    throw new Error('herbivoreMutationProbability must be between zero and one');
  }
  assertNonNegativeFinite(mutationMagnitude, 'herbivoreMutationMagnitude');
  validateTraitRange(scenario.herbivoreSpeedRange ?? [1, 3], 'herbivoreSpeedRange', true);
  validateTraitRange(scenario.herbivoreVisionRange ?? [0, 8], 'herbivoreVisionRange', true);
  validateTraitRange(scenario.herbivoreEnergyEfficiencyRange ?? [0.5, 1.5], 'herbivoreEnergyEfficiencyRange', false);
  validateTraitRange(scenario.herbivoreReproductionThresholdRange ?? [4, 24], 'herbivoreReproductionThresholdRange', false);
  const speedRange = scenario.herbivoreSpeedRange ?? [1, 3];
  const visionTraitRange = scenario.herbivoreVisionRange ?? [0, 8];
  const efficiencyRange = scenario.herbivoreEnergyEfficiencyRange ?? [0.5, 1.5];
  const thresholdRange = scenario.herbivoreReproductionThresholdRange ?? [4, 24];
  if (speedRange[0] < 1) throw new Error('herbivoreSpeedRange minimum must be at least one');
  if (efficiencyRange[0] <= 0) throw new Error('herbivoreEnergyEfficiencyRange minimum must be greater than zero');
  if (thresholdRange[0] <= 0) throw new Error('herbivoreReproductionThresholdRange minimum must be greater than zero');
  if (visionRange < visionTraitRange[0] || visionRange > visionTraitRange[1]) {
    throw new Error('herbivoreVisionRangeCells must be inside herbivoreVisionRange');
  }
  if (reproductionThreshold < thresholdRange[0] || reproductionThreshold > thresholdRange[1]) {
    throw new Error('herbivoreReproductionEnergyThreshold must be inside herbivoreReproductionThresholdRange');
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

function validateTraitRange(range: readonly [number, number], name: string, integer: boolean): void {
  const [minimum, maximum] = range;
  if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || minimum > maximum || minimum < 0 ||
      (integer && (!Number.isInteger(minimum) || !Number.isInteger(maximum)))) {
    throw new Error(`${name} must contain valid non-negative ${integer ? 'whole-number' : 'numeric'} bounds`);
  }
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
