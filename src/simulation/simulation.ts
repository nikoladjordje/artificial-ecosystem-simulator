import { type PlantWorldScenario, validatePlantWorldScenario } from '../config/scenarios';

export interface PlantWorldSnapshot {
  readonly tick: number;
  readonly seed: number;
  readonly widthCells: number;
  readonly heightCells: number;
  readonly plantBiomass: readonly (readonly number[])[];
  readonly herbivores: readonly HerbivoreSnapshot[];
  cellAt(x: number, y: number): number;
}

export interface HerbivoreSnapshot {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly energy: number;
  readonly ageTicks: number;
  readonly reproductionCooldownTicks: number;
  readonly traits: HerbivoreTraits;
}

export interface HerbivoreTraits {
  readonly speed: number;
  readonly visionRangeCells: number;
  readonly energyEfficiency: number;
  readonly reproductionThreshold: number;
}

class Snapshot implements PlantWorldSnapshot {
  constructor(
    public readonly tick: number,
    public readonly seed: number,
    public readonly widthCells: number,
    public readonly heightCells: number,
    public readonly plantBiomass: readonly (readonly number[])[],
    public readonly herbivores: readonly HerbivoreSnapshot[],
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
  private herbivores: HerbivoreSnapshot[];
  private randomState: number;
  private nextHerbivoreId = 0;

  constructor(scenario: PlantWorldScenario, seed: number) {
    this.scenario = validatePlantWorldScenario(scenario);
    if (!Number.isInteger(seed)) {
      throw new Error('seed must be a whole number');
    }
    this.seed = seed;
    this.randomState = seed >>> 0;
    this.plantBiomass = this.scenario.initialPlantBiomassByCell
      ? this.scenario.initialPlantBiomassByCell.map((row) => [...row])
      : Array.from({ length: this.scenario.gridHeightCells }, () =>
        Array.from({ length: this.scenario.gridWidthCells }, () => this.scenario.initialPlantBiomass),
      );
    this.herbivores = Array.from({ length: this.scenario.initialHerbivoreCount ?? 0 }, (_, id) => {
      const position = this.scenario.initialHerbivorePositions?.[id];
      return Object.freeze({
        id,
        x: position?.x ?? this.randomInt(this.scenario.gridWidthCells),
        y: position?.y ?? this.randomInt(this.scenario.gridHeightCells),
        energy: this.scenario.initialHerbivoreEnergy ?? 8,
        ageTicks: 0,
        reproductionCooldownTicks: 0,
        traits: Object.freeze({
          speed: this.scenario.herbivoreSpeedRange?.[0] ?? 1,
          visionRangeCells: this.scenario.herbivoreVisionRangeCells ?? 4,
          energyEfficiency: Math.max(
            this.scenario.herbivoreEnergyEfficiencyRange?.[0] ?? 0.5,
            Math.min(1, this.scenario.herbivoreEnergyEfficiencyRange?.[1] ?? 1.5),
          ),
          reproductionThreshold: this.scenario.herbivoreReproductionEnergyThreshold ?? 12,
        }),
      });
    });
    this.nextHerbivoreId = this.herbivores.length;
  }

  tick(ticks = 1): void {
    if (!Number.isInteger(ticks) || ticks < 1) {
      throw new Error('ticks must be a positive whole number');
    }
    for (let index = 0; index < ticks; index += 1) {
      this.regeneratePlants();
      this.advanceHerbivores();
      this.tickCount += 1;
    }
  }

  snapshot(): PlantWorldSnapshot {
    const biomass = this.plantBiomass.map((row) => Object.freeze([...row]));
    const frozenBiomass = Object.freeze(biomass);
    const herbivores = Object.freeze(this.herbivores.map((herbivore) => Object.freeze({ ...herbivore })));
    const width = this.scenario.gridWidthCells;
    const height = this.scenario.gridHeightCells;
    return Object.freeze(new Snapshot(this.tickCount, this.seed, width, height, frozenBiomass, herbivores));
  }

  private regeneratePlants(): void {
    for (const row of this.plantBiomass) {
      for (let x = 0; x < row.length; x += 1) {
        row[x] = Math.min(this.scenario.maximumPlantBiomass, row[x] + this.scenario.plantRegenerationPerTick);
      }
    }
  }

  private advanceHerbivores(): void {
    const living = this.herbivores.map((herbivore) => ({
      ...herbivore,
      ageTicks: herbivore.ageTicks + 1,
      reproductionCooldownTicks: Math.max(0, herbivore.reproductionCooldownTicks - 1),
      energy: herbivore.energy - (this.scenario.herbivoreEnergyLossPerTick ?? 0.5) / herbivore.traits.energyEfficiency -
        herbivore.traits.visionRangeCells * (this.scenario.herbivoreVisionEnergyCostPerCell ?? 0.025),
    })).filter((herbivore) => herbivore.energy > 0 && herbivore.ageTicks < (this.scenario.maximumHerbivoreAgeTicks ?? 120));
    const survivors = living.map((herbivore) => {
      let moved = herbivore;
      for (let step = 0; step < herbivore.traits.speed; step += 1) {
        const next = this.moveHerbivore(moved);
        const changedCell = next.x !== moved.x || next.y !== moved.y;
        moved = changedCell
          ? { ...next, energy: next.energy - (this.scenario.herbivoreMovementEnergyCost ?? 0.1) / herbivore.traits.energyEfficiency }
          : next;
      }
      if (moved.energy <= 0) return Object.freeze(moved);
      const availableBiomass = this.plantBiomass[moved.y][moved.x];
      const consumed = Math.min(availableBiomass, this.scenario.herbivoreFoodLimitPerTick ?? 1);
      this.plantBiomass[moved.y][moved.x] -= consumed;
      return Object.freeze({
        ...moved,
        energy: moved.energy + consumed * (this.scenario.herbivoreEnergyPerBiomass ?? 1),
      });
    }).filter((herbivore) => herbivore.energy > 0);
    const offspring: HerbivoreSnapshot[] = [];
    for (const parent of [...survivors]) {
      if (parent.reproductionCooldownTicks > 0 || parent.energy < parent.traits.reproductionThreshold ||
          survivors.length + offspring.length >= (this.scenario.maximumHerbivoreCount ?? 2_000)) continue;
      const energyTransfer = parent.energy * (this.scenario.herbivoreReproductionEnergyFraction ?? 0.5);
      const deltas = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }];
      const delta = deltas[this.randomInt(deltas.length)];
      const child = Object.freeze({
        id: this.nextHerbivoreId++,
        x: wrap(parent.x + delta.x, this.scenario.gridWidthCells),
        y: wrap(parent.y + delta.y, this.scenario.gridHeightCells),
        energy: energyTransfer,
        ageTicks: 0,
        reproductionCooldownTicks: this.scenario.herbivoreReproductionCooldownTicks ?? 12,
        traits: Object.freeze(this.mutateTraits(parent.traits)),
      });
      const parentIndex = survivors.findIndex((candidate) => candidate.id === parent.id);
      survivors[parentIndex] = Object.freeze({
        ...parent,
        energy: parent.energy - energyTransfer,
        reproductionCooldownTicks: this.scenario.herbivoreReproductionCooldownTicks ?? 12,
      });
      offspring.push(child);
    }
    this.herbivores = [...survivors, ...offspring];
  }

  private mutateTraits(traits: HerbivoreTraits): HerbivoreTraits {
    const chance = this.scenario.herbivoreMutationProbability ?? 0.2;
    const magnitude = this.scenario.herbivoreMutationMagnitude ?? 0.2;
    const mutate = (value: number, range: readonly [number, number], integer: boolean): number => {
      const next = this.randomInt(10_000) / 10_000 < chance
        ? value + (this.randomInt(20_001) / 10_000 - 1) * magnitude * (range[1] - range[0])
        : value;
      const bounded = Math.max(range[0], Math.min(range[1], next));
      return integer ? Math.round(bounded) : bounded;
    };
    return {
      speed: mutate(traits.speed, this.scenario.herbivoreSpeedRange ?? [1, 3], true),
      visionRangeCells: mutate(traits.visionRangeCells, this.scenario.herbivoreVisionRange ?? [0, 8], true),
      energyEfficiency: mutate(traits.energyEfficiency, this.scenario.herbivoreEnergyEfficiencyRange ?? [0.5, 1.5], false),
      reproductionThreshold: mutate(traits.reproductionThreshold, this.scenario.herbivoreReproductionThresholdRange ?? [4, 24], false),
    };
  }

  private moveHerbivore(herbivore: HerbivoreSnapshot): HerbivoreSnapshot {
    if (this.plantBiomass[herbivore.y][herbivore.x] > 0) return herbivore;
    const targets: Array<{ x: number; y: number; biomass: number }> = [];
    const vision = herbivore.traits.visionRangeCells;
    for (let y = 0; y < this.scenario.gridHeightCells; y += 1) {
      for (let x = 0; x < this.scenario.gridWidthCells; x += 1) {
        const biomass = this.plantBiomass[y][x];
        const distance = wrappedDistance(x, herbivore.x, this.scenario.gridWidthCells) +
          wrappedDistance(y, herbivore.y, this.scenario.gridHeightCells);
        if (biomass > 0 && distance > 0 && distance <= vision) targets.push({ x, y, biomass });
      }
    }
    if (targets.length === 0) {
      const direction = this.randomInt(4);
      const deltas = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }];
      return this.wrapPosition(herbivore, deltas[direction]);
    }
    const bestBiomass = Math.max(...targets.map((target) => target.biomass));
    const candidates = targets.filter((target) => target.biomass === bestBiomass);
    const target = candidates[this.randomInt(candidates.length)];
    const dx = shortestWrappedDelta(herbivore.x, target.x, this.scenario.gridWidthCells);
    const dy = shortestWrappedDelta(herbivore.y, target.y, this.scenario.gridHeightCells);
    const horizontal = dx === 0 ? 0 : Math.sign(dx);
    const vertical = dy === 0 ? 0 : Math.sign(dy);
    if (horizontal !== 0 && vertical !== 0) {
      return this.wrapPosition(herbivore, this.randomInt(2) === 0 ? { x: horizontal, y: 0 } : { x: 0, y: vertical });
    }
    return this.wrapPosition(herbivore, { x: horizontal, y: vertical });
  }

  private wrapPosition(herbivore: HerbivoreSnapshot, delta: { x: number; y: number }): HerbivoreSnapshot {
    return {
      ...herbivore,
      x: wrap(herbivore.x + delta.x, this.scenario.gridWidthCells),
      y: wrap(herbivore.y + delta.y, this.scenario.gridHeightCells),
    };
  }

  private randomInt(maximum: number): number {
    this.randomState = (this.randomState + 0x6d2b79f5) | 0;
    let value = this.randomState;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) % maximum;
  }
}

function wrap(value: number, length: number): number {
  return ((value % length) + length) % length;
}

function wrappedDistance(first: number, second: number, length: number): number {
  const direct = Math.abs(first - second);
  return Math.min(direct, length - direct);
}

function shortestWrappedDelta(from: number, to: number, length: number): number {
  const forward = wrap(to - from, length);
  return forward <= length / 2 ? forward : forward - length;
}
