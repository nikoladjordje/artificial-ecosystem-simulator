import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PlantGridCanvas } from '../../src/ui/plant-grid-canvas';
import type { PlantWorldSnapshot } from '../../src/simulation/simulation';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('PlantGridCanvas', () => {
  it('draws a herbivore marker at its snapshot cell over the biomass grid', () => {
    const fillRect = vi.fn();
    const context = { fillRect, fillStyle: '', beginPath: vi.fn(), arc: vi.fn(), fill: vi.fn() };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue(context as unknown as CanvasRenderingContext2D);
    const container = document.createElement('div');
    const root: Root = createRoot(container);
    const snapshot: PlantWorldSnapshot = {
      tick: 1,
      seed: 7,
      widthCells: 2,
      heightCells: 2,
      plantBiomass: [[1, 2], [3, 4]],
      herbivores: [{
        id: 0, x: 1, y: 0, energy: 5, ageTicks: 0, reproductionCooldownTicks: 0,
        traits: { speed: 1, visionRangeCells: 0, energyEfficiency: 1, reproductionThreshold: 12 },
      }],
      predators: [],
      cellAt: () => 0,
    };

    act(() => { root.render(<PlantGridCanvas maximumPlantBiomass={10} snapshot={snapshot} />); });

    expect(context.fillStyle).toBe('#ef6b4a');
    expect(fillRect).toHaveBeenLastCalledWith(489.6, 69.6, 100.8, 100.8);

    act(() => root.unmount());
    vi.restoreAllMocks();
    container.remove();
  });
});
