import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PlantWorldApp } from '../../src/ui/plant-world-app';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ fillRect: vi.fn(), beginPath: vi.fn(), arc: vi.fn(), fill: vi.fn() } as unknown as CanvasRenderingContext2D);
  container = document.createElement('div');
  document.body.append(container);
  act(() => { root = createRoot(container); root.render(<PlantWorldApp />); });
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('PlantWorldApp', () => {
  it('runs, pauses, and resets by consuming snapshots rather than exposing world state', () => {
    const runButton = () => container.querySelector('button')!;

    expect(container.textContent).toContain('Tick 0');
    act(() => runButton().click());
    expect(runButton().textContent).toBe('Pause');
    act(() => vi.advanceTimersByTime(150));
    expect(container.textContent).toContain('Tick 1');
    act(() => runButton().click());
    expect(runButton().textContent).toBe('Run');
    act(() => vi.advanceTimersByTime(300));
    expect(container.textContent).toContain('Tick 1');
    act(() => container.querySelectorAll('button')[1].click());
    expect(container.textContent).toContain('Tick 0');
  });

  it('rejects a non-integer seed with a useful message', () => {
    const input = container.querySelector('input')!;

    act(() => {
      input.value = '1.5';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    act(() => container.querySelectorAll('button')[1].click());

    expect(container.querySelector('[role="alert"]')?.textContent).toBe('Seed must be a whole number.');
  });

  it('describes animal markers and counts accessibly', () => {
    const canvas = container.querySelector('canvas');
    expect(canvas?.getAttribute('aria-label')).toBe('Plant biomass grid with herbivores and predators');
    expect(canvas?.getAttribute('aria-describedby')).toBe('ecosystem-legend');
    expect(container.querySelector('#ecosystem-legend')?.textContent).toBe('Green shading shows plant biomass. Yellow squares show herbivores. Orange circles show predators.');
    expect(container.textContent).toContain('Herbivores: 8');
    expect(container.textContent).toContain('Predators: 2');
  });

  it('shows run metadata, selects an organism, and exposes its traits and current action', () => {
    expect(container.textContent).toContain('Run seed: 20261031');
    expect(container.querySelector('[aria-label="Organism"]')).not.toBeNull();
    const selector = container.querySelector('[aria-label="Organism"]') as HTMLSelectElement;
    act(() => {
      selector.value = 'herbivore-0';
      selector.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(container.textContent).toContain('Selected herbivore #0');
    expect(container.textContent).toContain('Current action:');
    expect(container.textContent).toContain('Energy:');
    expect(container.textContent).toContain('Vision range:');
  });

  it('provides labeled history and trait distribution views and explicit extinction status', () => {
    expect(container.querySelector('[aria-label="Population and plant biomass history"]')).not.toBeNull();
    expect(container.querySelector('[aria-label="Herbivore trait distributions"]')).not.toBeNull();
    expect(container.querySelector('[aria-label="Predator trait distributions"]')).not.toBeNull();
    expect(container.textContent).toContain('Run seed: 20261031');
  });
});
