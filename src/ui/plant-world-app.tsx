import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { defaultPlantWorldScenario } from '../config/scenarios';
import { Simulation, type PlantWorldSnapshot } from '../simulation/simulation';
import { PlantGridCanvas } from './plant-grid-canvas';

const initialSeed = 20261031;

export function PlantWorldApp(): ReactElement {
  const [running, setRunning] = useState(false);
  const [seedInput, setSeedInput] = useState(String(initialSeed));
  const [seedError, setSeedError] = useState<string | null>(null);
  const [simulation, setSimulation] = useState(() => new Simulation(defaultPlantWorldScenario, initialSeed));
  const [snapshot, setSnapshot] = useState<PlantWorldSnapshot>(() => simulation.snapshot());
  const scenario = defaultPlantWorldScenario;

  useEffect(() => {
    if (!running) return undefined;
    const interval = window.setInterval(() => {
      simulation.tick();
      setSnapshot(simulation.snapshot());
    }, 150);
    return () => window.clearInterval(interval);
  }, [running, simulation]);

  const biomassTotal = useMemo(() => snapshot.plantBiomass.flat().reduce((total, value) => total + value, 0), [snapshot]);
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
    <p id="ecosystem-legend">Green shading shows plant biomass. Yellow squares show herbivores.</p>
    <p aria-live="polite">Tick {snapshot.tick}. Total biomass: {biomassTotal.toFixed(2)}. Herbivores: {snapshot.herbivores.length}.</p>
    <div className="controls" aria-label="Simulation controls">
      <button onClick={() => setRunning((value) => !value)} type="button">{running ? 'Pause' : 'Run'}</button>
      <button onClick={reset} type="button">Reset</button>
      <label>Seed <input aria-label="Seed" onInput={(event) => setSeedInput(event.currentTarget.value)} type="number" value={seedInput} /></label>
    </div>
    {seedError && <p role="alert">{seedError}</p>}
    <p>Plants regenerate by {scenario.plantRegenerationPerTick} biomass each tick, up to {scenario.maximumPlantBiomass} per cell. Herbivores lose {scenario.herbivoreEnergyLossPerTick} energy each tick, seek nearby food, eat from their current cell, and die at zero energy. Grid edges wrap around.</p>
  </main>;
}
