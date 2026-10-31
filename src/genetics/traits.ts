export interface HerbivoreTraits {
  readonly speed: number;
  readonly visionRangeCells: number;
  readonly energyEfficiency: number;
  readonly reproductionThreshold: number;
}

export type PredatorTraits = HerbivoreTraits;

export interface TraitMutationConfig {
  readonly probability: number;
  readonly magnitude: number;
  readonly ranges: {
    readonly speed: readonly [number, number];
    readonly vision: readonly [number, number];
    readonly energyEfficiency: readonly [number, number];
    readonly reproductionThreshold: readonly [number, number];
  };
}

export function mutateTraits(
  traits: HerbivoreTraits,
  config: TraitMutationConfig,
  randomInt: (maximum: number) => number,
): HerbivoreTraits {
  const mutate = (value: number, range: readonly [number, number], integer: boolean): number => {
    const next = randomInt(10_000) / 10_000 < config.probability
      ? value + (randomInt(20_001) / 10_000 - 1) * config.magnitude * (range[1] - range[0])
      : value;
    const bounded = Math.max(range[0], Math.min(range[1], next));
    return integer ? Math.round(bounded) : bounded;
  };
  return {
    speed: mutate(traits.speed, config.ranges.speed, true),
    visionRangeCells: mutate(traits.visionRangeCells, config.ranges.vision, true),
    energyEfficiency: mutate(traits.energyEfficiency, config.ranges.energyEfficiency, false),
    reproductionThreshold: mutate(traits.reproductionThreshold, config.ranges.reproductionThreshold, false),
  };
}
