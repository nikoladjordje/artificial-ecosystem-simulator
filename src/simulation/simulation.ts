import { type PlantWorldScenario, validatePlantWorldScenario } from '../config/scenarios';

export interface PlantWorldSnapshot {
  readonly tick: number;
  readonly seed: number;
  readonly widthCells: number;
  readonly heightCells: number;
  readonly plantBiomass: readonly (readonly number[])[];
  cellAt(x: number, y: number): number;
}

class Snapshot implements PlantWorldSnapshot {
  constructor(
    public readonly tick: number,
    public readonly seed: number,
    public readonly widthCells: number,
    public readonly heightCells: number,
    public readonly plantBiomass: readonly (readonly number[])[],
  ) {}

  cellAt(x: number, y: number): number {
    return this.plantBiomass[wrap(y, this.heightCells)][wrap(x, this.widthCells)];
  }
}

export class Simulation {
  private readonly scenario: PlantWorldScenario;
  private readonly seed: number;
  private tickCount = 0;
  private plantBiomass: number[][];

  constructor(scenario: PlantWorldScenario, seed: number) {
    this.scenario = validatePlantWorldScenario(scenario);
    if (!Number.isInteger(seed)) {
      throw new Error('seed must be a whole number');
    }
    this.seed = seed;
    this.plantBiomass = Array.from({ length: this.scenario.gridHeightCells }, () =>
      Array.from({ length: this.scenario.gridWidthCells }, () => this.scenario.initialPlantBiomass),
    );
  }

  tick(ticks = 1): void {
    if (!Number.isInteger(ticks) || ticks < 1) {
      throw new Error('ticks must be a positive whole number');
    }
    for (let index = 0; index < ticks; index += 1) {
      this.regeneratePlants();
      this.tickCount += 1;
    }
  }

  snapshot(): PlantWorldSnapshot {
    const biomass = this.plantBiomass.map((row) => Object.freeze([...row]));
    const frozenBiomass = Object.freeze(biomass);
    const width = this.scenario.gridWidthCells;
    const height = this.scenario.gridHeightCells;
    return Object.freeze(new Snapshot(this.tickCount, this.seed, width, height, frozenBiomass));
  }

  private regeneratePlants(): void {
    for (const row of this.plantBiomass) {
      for (let x = 0; x < row.length; x += 1) {
        row[x] = Math.min(this.scenario.maximumPlantBiomass, row[x] + this.scenario.plantRegenerationPerTick);
      }
    }
  }
}

function wrap(value: number, length: number): number {
  return ((value % length) + length) % length;
}
