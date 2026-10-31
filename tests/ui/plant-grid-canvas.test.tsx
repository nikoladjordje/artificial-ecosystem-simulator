import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PlantGridCanvas } from '../../src/ui/plant-grid-canvas';
import type { PlantWorldSnapshot } from '../../src/simulation/simulation';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('PlantGridCanvas', () => {
  it('draws a herbivore marker at its snapshot cell over the biomass grid', () => {
    const fillRect = vi.fn();
    const context = { fillRect, fillStyle: '' };
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
      herbivores: [{ id: 0, x: 1, y: 0, energy: 5 }],
      cellAt: () => 0,
    };

    act(() => { root.render(<PlantGridCanvas maximumPlantBiomass={10} snapshot={snapshot} />); });

    expect(context.fillStyle).toBe('#f4e34b');
    expect(fillRect).toHaveBeenLastCalledWith(489.6, 69.6, 100.8, 100.8);

    act(() => root.unmount());
    vi.restoreAllMocks();
    container.remove();
  });
});
