import { maximumPredatorPopulation, type PlantWorldScenario, validatePlantWorldScenario } from '../config/scenarios';
import { mutateTraits, type HerbivoreTraits, type PredatorTraits } from '../genetics/traits';

export type { HerbivoreTraits, PredatorTraits } from '../genetics/traits';

export interface PlantWorldSnapshot {
  readonly tick: number;
  readonly seed: number;
  readonly widthCells: number;
  readonly heightCells: number;
  readonly plantBiomass: readonly (readonly number[])[];
  readonly herbivores: readonly HerbivoreSnapshot[];
  readonly predators: readonly PredatorSnapshot[];
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

export interface PredatorSnapshot extends Omit<HerbivoreSnapshot, 'traits'> {
  readonly traits: PredatorTraits;
}

class Snapshot implements PlantWorldSnapshot {
  constructor(
    public readonly tick: number,
    public readonly seed: number,
    public readonly widthCells: number,
    public readonly heightCells: number,
    public readonly plantBiomass: readonly (readonly number[])[],
    public readonly herbivores: readonly HerbivoreSnapshot[],
    public readonly predators: readonly PredatorSnapshot[],
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
  private predators: PredatorSnapshot[];
  private randomState: number;
  private nextHerbivoreId = 0;
  private nextPredatorId = 0;

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
    this.predators = Array.from({ length: this.scenario.initialPredatorCount ?? 0 }, (_, id) => {
      const position = this.scenario.initialPredatorPositions?.[id];
      return Object.freeze({
        id,
        x: position?.x ?? this.randomInt(this.scenario.gridWidthCells),
        y: position?.y ?? this.randomInt(this.scenario.gridHeightCells),
        energy: this.scenario.initialPredatorEnergy ?? 10,
        ageTicks: 0,
        reproductionCooldownTicks: 0,
        traits: Object.freeze({
          speed: this.scenario.predatorSpeedRange?.[0] ?? 1,
          visionRangeCells: this.scenario.predatorVisionRangeCells ?? 5,
          energyEfficiency: Math.max(this.scenario.predatorEnergyEfficiencyRange?.[0] ?? 0.5, Math.min(1, this.scenario.predatorEnergyEfficiencyRange?.[1] ?? 1.5)),
          reproductionThreshold: this.scenario.predatorReproductionEnergyThreshold ?? 16,
        }),
      });
    });
    this.nextPredatorId = this.predators.length;
  }

  tick(ticks = 1): void {
    if (!Number.isInteger(ticks) || ticks < 1) {
      throw new Error('ticks must be a positive whole number');
    }
    for (let index = 0; index < ticks; index += 1) {
      this.regeneratePlants();
      this.ageHerbivores();
      this.agePredators();
      this.moveHerbivores();
      this.advancePredators();
      this.feedHerbivores();
      this.huntHerbivores();
      this.reproduceHerbivores();
      this.reproducePredators();
      this.herbivores = this.herbivores.filter((herbivore) => herbivore.energy > 0);
      this.predators = this.predators.filter((predator) => predator.energy > 0);
      this.tickCount += 1;
    }
  }

  snapshot(): PlantWorldSnapshot {
    const biomass = this.plantBiomass.map((row) => Object.freeze([...row]));
    const frozenBiomass = Object.freeze(biomass);
    const herbivores = Object.freeze(this.herbivores.map((herbivore) => Object.freeze({ ...herbivore })));
    const predators = Object.freeze(this.predators.map((predator) => Object.freeze({ ...predator })));
    const width = this.scenario.gridWidthCells;
    const height = this.scenario.gridHeightCells;
    return Object.freeze(new Snapshot(this.tickCount, this.seed, width, height, frozenBiomass, herbivores, predators));
  }

  private agePredators(): void {
    this.predators = this.predators.map((predator) => ({
      ...predator,
      ageTicks: predator.ageTicks + 1,
      reproductionCooldownTicks: Math.max(0, predator.reproductionCooldownTicks - 1),
      energy: predator.energy - (this.scenario.predatorEnergyLossPerTick ?? 0.6) / predator.traits.energyEfficiency -
        predator.traits.visionRangeCells * (this.scenario.predatorVisionEnergyCostPerCell ?? 0.03),
    })).filter((predator) => predator.energy > 0 && predator.ageTicks < (this.scenario.maximumPredatorAgeTicks ?? 140));
  }

  private advancePredators(): void {
    const survivors = this.predators.map((predator) => {
      let moved = predator;
      for (let step = 0; step < predator.traits.speed; step += 1) {
        const next = this.movePredator(moved);
        if (next.x !== moved.x || next.y !== moved.y) moved = { ...next, energy: next.energy - (this.scenario.predatorMovementEnergyCost ?? 0.12) / predator.traits.energyEfficiency };
        else moved = next;
      }
      return moved;
    }).filter((predator) => predator.energy > 0);
    this.predators = survivors;
  }

  private huntHerbivores(): void {
    const preyToRemove = new Set<number>();
    const survivors = this.predators;
    const fedPredators = survivors.map((predator) => {
      const coLocatedPrey = this.herbivores.filter((herbivore) => !preyToRemove.has(herbivore.id) && herbivore.x === predator.x && herbivore.y === predator.y);
      if (coLocatedPrey.length === 0) return predator;
      const greatestPreyEnergy = Math.max(...coLocatedPrey.map((herbivore) => herbivore.energy));
      const candidates = coLocatedPrey.filter((herbivore) => herbivore.energy === greatestPreyEnergy);
      const prey = candidates[this.randomInt(candidates.length)];
      preyToRemove.add(prey.id);
      return { ...predator, energy: predator.energy + prey.energy * (this.scenario.predatorEnergyPerPreyEnergy ?? 0.5) };
    });
    this.herbivores = this.herbivores.filter((herbivore) => !preyToRemove.has(herbivore.id));
    this.predators = fedPredators;
  }

  private reproducePredators(): void {
    const offspring: PredatorSnapshot[] = [];
    const fedPredators = this.predators;
    for (const parent of [...fedPredators]) {
      if (parent.reproductionCooldownTicks > 0 || parent.energy < parent.traits.reproductionThreshold || fedPredators.length + offspring.length >= (this.scenario.maximumPredatorCount ?? maximumPredatorPopulation)) continue;
      const energyTransfer = parent.energy * (this.scenario.predatorReproductionEnergyFraction ?? 0.5);
      const deltas = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }];
      const delta = deltas[this.randomInt(deltas.length)];
      const child = Object.freeze({
        id: this.nextPredatorId++, x: wrap(parent.x + delta.x, this.scenario.gridWidthCells), y: wrap(parent.y + delta.y, this.scenario.gridHeightCells),
        energy: energyTransfer, ageTicks: 0, reproductionCooldownTicks: this.scenario.predatorReproductionCooldownTicks ?? 16,
        traits: Object.freeze(mutateTraits(parent.traits, {
          probability: this.scenario.predatorMutationProbability ?? 0.2,
          magnitude: this.scenario.predatorMutationMagnitude ?? 0.2,
          ranges: {
            speed: this.scenario.predatorSpeedRange ?? [1, 3],
            vision: this.scenario.predatorVisionRange ?? [0, 8],
            energyEfficiency: this.scenario.predatorEnergyEfficiencyRange ?? [0.5, 1.5],
            reproductionThreshold: this.scenario.predatorReproductionThresholdRange ?? [6, 32],
          },
        }, (maximum) => this.randomInt(maximum))),
      });
      const parentIndex = fedPredators.findIndex((candidate) => candidate.id === parent.id);
      fedPredators[parentIndex] = { ...parent, energy: parent.energy - energyTransfer, reproductionCooldownTicks: this.scenario.predatorReproductionCooldownTicks ?? 16 };
      offspring.push(child);
    }
    this.predators = [...fedPredators.filter((predator) => predator.energy > 0), ...offspring];
  }

  private movePredator(predator: PredatorSnapshot): PredatorSnapshot {
    const visiblePrey = this.herbivores.filter((herbivore) => wrappedDistance(herbivore.x, predator.x, this.scenario.gridWidthCells) + wrappedDistance(herbivore.y, predator.y, this.scenario.gridHeightCells) <= predator.traits.visionRangeCells);
    if (visiblePrey.length === 0) {
      const deltas = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }];
      return this.wrapPosition(predator, deltas[this.randomInt(deltas.length)]);
    }
    const coLocatedPrey = visiblePrey.filter((herbivore) => herbivore.x === predator.x && herbivore.y === predator.y);
    if (coLocatedPrey.length > 0) return predator;
    const greatestPreyEnergy = Math.max(...visiblePrey.map((herbivore) => herbivore.energy));
    const candidates = visiblePrey.filter((herbivore) => herbivore.energy === greatestPreyEnergy);
    const prey = candidates[this.randomInt(candidates.length)];
    const dx = shortestWrappedDelta(predator.x, prey.x, this.scenario.gridWidthCells);
    const dy = shortestWrappedDelta(predator.y, prey.y, this.scenario.gridHeightCells);
    const horizontal = dx === 0 ? 0 : Math.sign(dx);
    const vertical = dy === 0 ? 0 : Math.sign(dy);
    if (horizontal !== 0 && vertical !== 0) return this.wrapPosition(predator, this.randomInt(2) === 0 ? { x: horizontal, y: 0 } : { x: 0, y: vertical });
    return this.wrapPosition(predator, { x: horizontal, y: vertical });
  }

  private regeneratePlants(): void {
    for (const row of this.plantBiomass) {
      for (let x = 0; x < row.length; x += 1) {
        row[x] = Math.min(this.scenario.maximumPlantBiomass, row[x] + this.scenario.plantRegenerationPerTick);
      }
    }
  }

  private ageHerbivores(): void {
    this.herbivores = this.herbivores.map((herbivore) => ({
      ...herbivore,
      ageTicks: herbivore.ageTicks + 1,
      reproductionCooldownTicks: Math.max(0, herbivore.reproductionCooldownTicks - 1),
      energy: herbivore.energy - (this.scenario.herbivoreEnergyLossPerTick ?? 0.5) / herbivore.traits.energyEfficiency -
        herbivore.traits.visionRangeCells * (this.scenario.herbivoreVisionEnergyCostPerCell ?? 0.025),
    })).filter((herbivore) => herbivore.energy > 0 && herbivore.ageTicks < (this.scenario.maximumHerbivoreAgeTicks ?? 120));
  }

  private moveHerbivores(): void {
    const survivors = this.herbivores.map((herbivore) => {
      let moved = herbivore;
      for (let step = 0; step < herbivore.traits.speed; step += 1) {
        const next = this.moveHerbivore(moved);
        const changedCell = next.x !== moved.x || next.y !== moved.y;
        moved = changedCell
          ? { ...next, energy: next.energy - (this.scenario.herbivoreMovementEnergyCost ?? 0.1) / herbivore.traits.energyEfficiency }
          : next;
      }
      return moved;
    }).filter((herbivore) => herbivore.energy > 0);
    this.herbivores = survivors;
  }

  private feedHerbivores(): void {
    this.herbivores = this.herbivores.map((herbivore) => {
      const availableBiomass = this.plantBiomass[herbivore.y][herbivore.x];
      const consumed = Math.min(availableBiomass, this.scenario.herbivoreFoodLimitPerTick ?? 1);
      this.plantBiomass[herbivore.y][herbivore.x] -= consumed;
      return { ...herbivore, energy: herbivore.energy + consumed * (this.scenario.herbivoreEnergyPerBiomass ?? 1) };
    });
  }

  private reproduceHerbivores(): void {
    const survivors = this.herbivores;
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
        traits: Object.freeze(mutateTraits(parent.traits, {
          probability: this.scenario.herbivoreMutationProbability ?? 0.2,
          magnitude: this.scenario.herbivoreMutationMagnitude ?? 0.2,
          ranges: {
            speed: this.scenario.herbivoreSpeedRange ?? [1, 3],
            vision: this.scenario.herbivoreVisionRange ?? [0, 8],
            energyEfficiency: this.scenario.herbivoreEnergyEfficiencyRange ?? [0.5, 1.5],
            reproductionThreshold: this.scenario.herbivoreReproductionThresholdRange ?? [4, 24],
          },
        }, (maximum) => this.randomInt(maximum))),
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
