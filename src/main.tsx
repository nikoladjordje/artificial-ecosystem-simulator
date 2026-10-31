import { createRoot } from 'react-dom/client';
import { PlantWorldApp } from './ui/plant-world-app';
import './ui/styles.css';

createRoot(document.getElementById('root')!).render(<PlantWorldApp />);
