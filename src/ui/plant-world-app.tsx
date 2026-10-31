import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { defaultPlantWorldScenario } from '../config/scenarios';
import { Simulation, type PlantWorldSnapshot } from '../simulation/simulation';
import { PlantGridCanvas } from './plant-grid-canvas';

const initialSeed = 20261031;
const ecosystemScenario = { ...defaultPlantWorldScenario, initialPredatorCount: 2 };

export function PlantWorldApp(): ReactElement {
  const [running, setRunning] = useState(false);
  const [seedInput, setSeedInput] = useState(String(initialSeed));
  const [seedError, setSeedError] = useState<string | null>(null);
  const [simulation, setSimulation] = useState(() => new Simulation(ecosystemScenario, initialSeed));
  const [snapshot, setSnapshot] = useState<PlantWorldSnapshot>(() => simulation.snapshot());
  const scenario = ecosystemScenario;

  useEffect(() => {
    if (!running) return undefined;
    const interval = window.setInterval(() => {
      simulation.tick();
      setSnapshot(simulation.snapshot());
    }, 150);
    return () => window.clearInterval(interval);
  }, [running, simulation]);

  const biomassTotal = useMemo(() => snapshot.plantBiomass.flat().reduce((total, value) => total + value, 0), [snapshot]);
  const herbivoreTraits = useMemo(() => {
    if (snapshot.herbivores.length === 0) return null;
    return snapshot.herbivores.reduce((totals, herbivore) => ({
      ageTicks: totals.ageTicks + herbivore.ageTicks,
      speed: totals.speed + herbivore.traits.speed,
      visionRangeCells: totals.visionRangeCells + herbivore.traits.visionRangeCells,
      energyEfficiency: totals.energyEfficiency + herbivore.traits.energyEfficiency,
      reproductionThreshold: totals.reproductionThreshold + herbivore.traits.reproductionThreshold,
    }), { ageTicks: 0, speed: 0, visionRangeCells: 0, energyEfficiency: 0, reproductionThreshold: 0 });
  }, [snapshot]);
  const reset = () => {
    const nextSeed = Number(seedInput);
    if (!Number.isInteger(nextSeed)) {
      setSeedError('Seed must be a whole number.');
      return;
    }
    setSeedError(null);
    const nextSimulation = new Simulation(scenario, nextSeed);
    setSimulation(nextSimulation);
    setSnapshot(nextSimulation.snapshot());
    setRunning(false);
  };

  return <main>
    <header><h1>Deterministic plant world</h1><p>A simplified wrapping-grid ecosystem.</p></header>
    <PlantGridCanvas maximumPlantBiomass={scenario.maximumPlantBiomass} snapshot={snapshot} />
    <p id="ecosystem-legend">Green shading shows plant biomass. Yellow squares show herbivores. Orange circles show predators.</p>
    <p aria-live="polite">Tick {snapshot.tick}. Total biomass: {biomassTotal.toFixed(2)}. Herbivores: {snapshot.herbivores.length}{snapshot.herbivores.length === 0 ? ' (extinct)' : ''}. Predators: {snapshot.predators.length}{snapshot.predators.length === 0 ? ' (extinct)' : ''}.</p>
    {herbivoreTraits && <p aria-label="Average herbivore lineage traits">
      Average age: {(herbivoreTraits.ageTicks / snapshot.herbivores.length).toFixed(1)} ticks. Speed: {(herbivoreTraits.speed / snapshot.herbivores.length).toFixed(1)} steps per tick. Vision: {(herbivoreTraits.visionRangeCells / snapshot.herbivores.length).toFixed(1)} cells. Energy efficiency: {(herbivoreTraits.energyEfficiency / snapshot.herbivores.length).toFixed(2)}. Reproduction threshold: {(herbivoreTraits.reproductionThreshold / snapshot.herbivores.length).toFixed(1)}.
    </p>}
    <div className="controls" aria-label="Simulation controls">
      <button onClick={() => setRunning((value) => !value)} type="button">{running ? 'Pause' : 'Run'}</button>
      <button onClick={reset} type="button">Reset</button>
      <label>Seed <input aria-label="Seed" onInput={(event) => setSeedInput(event.currentTarget.value)} type="number" value={seedInput} /></label>
    </div>
    {seedError && <p role="alert">{seedError}</p>}
    <p>Plants regenerate by {scenario.plantRegenerationPerTick} biomass each tick, up to {scenario.maximumPlantBiomass} per cell. Herbivores spend energy on upkeep, vision, and each movement step; they seek nearby food and eat only from their current cell. Predators seek herbivores, kill at most one co-located prey per tick, and gain {scenario.predatorEnergyPerPreyEnergy} energy per prey energy. Both animal species reproduce asexually above their inherited energy threshold, transfer half their energy to one neighboring offspring, and may pass on mutated traits. Animals die at zero energy or after their species' age limit; plants continue regenerating after animal extinction. Grid edges wrap around.</p>
  </main>;
}
