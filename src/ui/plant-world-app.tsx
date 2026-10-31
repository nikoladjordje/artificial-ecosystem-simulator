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
  const [history, setHistory] = useState<PlantWorldSnapshot[]>(() => [simulation.snapshot()]);
  const [selectedOrganism, setSelectedOrganism] = useState('');
  const scenario = ecosystemScenario;

  useEffect(() => {
    if (!running) return undefined;
    const interval = window.setInterval(() => {
      simulation.tick();
      const nextSnapshot = simulation.snapshot();
      setSnapshot(nextSnapshot);
      setHistory((previous) => [...previous, nextSnapshot].slice(-120));
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
    setHistory([nextSimulation.snapshot()]);
    setSelectedOrganism('');
    setRunning(false);
  };

  const organisms = [
    ...snapshot.herbivores.map((organism) => ({ ...organism, species: 'herbivore' as const })),
    ...snapshot.predators.map((organism) => ({ ...organism, species: 'predator' as const })),
  ];
  const selected = organisms.find((organism) => `${organism.species}-${organism.id}` === selectedOrganism);
  const currentAction = selected?.species === 'herbivore'
    ? snapshot.cellAt(selected.x, selected.y) > 0 ? 'Foraging' : 'Searching for plants'
    : selected ? snapshot.herbivores.some((herbivore) => herbivore.x === selected.x && herbivore.y === selected.y) ? 'Hunting' : 'Searching for herbivores' : '';

  const chartPoints = (valueAt: (point: PlantWorldSnapshot) => number, maximum: number) => history.map((point, index) => {
    const x = history.length < 2 ? 0 : (index / (history.length - 1)) * 300;
    const y = 90 - (valueAt(point) / Math.max(1, maximum)) * 80;
    return `${x},${y}`;
  }).join(' ');

  const traitRange = (values: number[]) => values.length === 0
    ? 'No living organisms'
    : `Range ${Math.min(...values).toFixed(1)}–${Math.max(...values).toFixed(1)} across ${values.length} organisms`;

  return <main>
    <header><h1>Deterministic plant world</h1><p>A simplified wrapping-grid ecosystem.</p></header>
    <PlantGridCanvas maximumPlantBiomass={scenario.maximumPlantBiomass} snapshot={snapshot} />
    <p id="ecosystem-legend">Green shading shows plant biomass. Yellow squares show herbivores. Orange circles show predators.</p>
    <p aria-live="polite">Run seed: {snapshot.seed}. Tick {snapshot.tick}. Total biomass: {biomassTotal.toFixed(2)}. Herbivores: {snapshot.herbivores.length}{snapshot.herbivores.length === 0 ? ' (extinct)' : ''}. Predators: {snapshot.predators.length}{snapshot.predators.length === 0 ? ' (extinct)' : ''}.</p>
    {herbivoreTraits && <p aria-label="Average herbivore lineage traits">
      Average age: {(herbivoreTraits.ageTicks / snapshot.herbivores.length).toFixed(1)} ticks. Speed: {(herbivoreTraits.speed / snapshot.herbivores.length).toFixed(1)} steps per tick. Vision: {(herbivoreTraits.visionRangeCells / snapshot.herbivores.length).toFixed(1)} cells. Energy efficiency: {(herbivoreTraits.energyEfficiency / snapshot.herbivores.length).toFixed(2)}. Reproduction threshold: {(herbivoreTraits.reproductionThreshold / snapshot.herbivores.length).toFixed(1)}.
    </p>}
    <div className="controls" aria-label="Simulation controls">
      <button onClick={() => setRunning((value) => !value)} type="button">{running ? 'Pause' : 'Run'}</button>
      <button onClick={reset} type="button">Reset</button>
      <label>Seed <input aria-label="Seed" onInput={(event) => setSeedInput(event.currentTarget.value)} type="number" value={seedInput} /></label>
    </div>
    <section aria-label="Organism inspection">
      <h2>Inspect an organism</h2>
      <label>Organism <select aria-label="Organism" value={selectedOrganism} onChange={(event) => setSelectedOrganism(event.currentTarget.value)}>
        <option value="">Choose an organism</option>
        {organisms.map((organism) => <option key={`${organism.species}-${organism.id}`} value={`${organism.species}-${organism.id}`}>{organism.species} #{organism.id}</option>)}
      </select></label>
      {selected && <div><h3>Selected {selected.species} #{selected.id}</h3><p>Energy: {selected.energy.toFixed(2)}. Age: {selected.ageTicks} ticks. Current action: {currentAction}.</p><p>Speed: {selected.traits.speed} steps per tick. Vision range: {selected.traits.visionRangeCells} cells. Energy efficiency: {selected.traits.energyEfficiency.toFixed(2)}. Reproduction threshold: {selected.traits.reproductionThreshold}.</p></div>}
    </section>
    <section aria-label="Population and plant biomass history">
      <h2>History</h2>
      <svg role="img" aria-label="Population and plant biomass history" viewBox="0 0 300 100">
        <polyline aria-label="Plant biomass history" fill="none" stroke="#8ed69c" points={chartPoints((point) => point.plantBiomass.flat().reduce((sum, value) => sum + value, 0), scenario.maximumPlantBiomass * scenario.gridWidthCells * scenario.gridHeightCells)} />
        <polyline aria-label="Herbivore population history" fill="none" stroke="#f6d365" points={chartPoints((point) => point.herbivores.length, 100)} />
        <polyline aria-label="Predator population history" fill="none" stroke="#ff9b62" points={chartPoints((point) => point.predators.length, 100)} />
      </svg>
      <p>Each line uses snapshots from this run. Plant biomass, herbivores, and predators are shown on separate scales; this simplified model is not scientifically calibrated.</p>
    </section>
    <section aria-label="Herbivore trait distributions"><h2>Herbivore trait distributions</h2><p>Speed: {traitRange(snapshot.herbivores.map((animal) => animal.traits.speed))}</p><p>Vision: {traitRange(snapshot.herbivores.map((animal) => animal.traits.visionRangeCells))}</p><p>Energy efficiency: {traitRange(snapshot.herbivores.map((animal) => animal.traits.energyEfficiency))}</p><p>Reproduction threshold: {traitRange(snapshot.herbivores.map((animal) => animal.traits.reproductionThreshold))}</p></section>
    <section aria-label="Predator trait distributions"><h2>Predator trait distributions</h2><p>Speed: {traitRange(snapshot.predators.map((animal) => animal.traits.speed))}</p><p>Vision: {traitRange(snapshot.predators.map((animal) => animal.traits.visionRangeCells))}</p><p>Energy efficiency: {traitRange(snapshot.predators.map((animal) => animal.traits.energyEfficiency))}</p><p>Reproduction threshold: {traitRange(snapshot.predators.map((animal) => animal.traits.reproductionThreshold))}</p></section>
    {seedError && <p role="alert">{seedError}</p>}
    <p>Plants regenerate by {scenario.plantRegenerationPerTick} biomass each tick, up to {scenario.maximumPlantBiomass} per cell. Herbivores spend energy on upkeep, vision, and each movement step; they seek nearby food and eat only from their current cell. Predators seek herbivores, kill at most one co-located prey per tick, and gain {scenario.predatorEnergyPerPreyEnergy} energy per prey energy. Both animal species reproduce asexually above their inherited energy threshold, transfer half their energy to one neighboring offspring, and may pass on mutated traits. Animals die at zero energy or after their species' age limit; plants continue regenerating after animal extinction. Grid edges wrap around.</p>
  </main>;
}
