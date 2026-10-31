import { useEffect, useRef, type ReactElement } from 'react';
import type { PlantWorldSnapshot } from '../simulation/simulation';

interface PlantGridCanvasProps {
  snapshot: PlantWorldSnapshot;
  maximumPlantBiomass: number;
}

export function PlantGridCanvas({ snapshot, maximumPlantBiomass }: PlantGridCanvasProps): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const cellWidth = canvas.width / snapshot.widthCells;
    const cellHeight = canvas.height / snapshot.heightCells;
    snapshot.plantBiomass.forEach((row, y) => row.forEach((biomass, x) => {
      const brightness = Math.round(18 + (biomass / maximumPlantBiomass) * 48);
      context.fillStyle = `hsl(120 48% ${brightness}%)`;
      context.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
    }));
  }, [maximumPlantBiomass, snapshot]);

  return <canvas aria-label="Plant biomass grid" height="480" ref={canvasRef} role="img" width="720" />;
}
