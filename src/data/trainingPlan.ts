import type { TrainingBlock } from '../types';

export const trainingBlocks: TrainingBlock[] = [
  {
    id: 'repaso',
    minutes: '5 minutos',
    title: 'Repaso',
    description: 'Repaso de errores anteriores',
    categories: ['piezas colgadas', 'amenazas del rival', 'jaques, capturas y amenazas'],
    targetExercises: 3
  },
  {
    id: 'tacticas',
    minutes: '10 minutos',
    title: 'Tácticas',
    description: 'Tácticas adaptadas a tu rendimiento',
    categories: ['mate en 1', 'mate en 2', 'doble ataque', 'clavada', 'jaques, capturas y amenazas'],
    targetExercises: 5
  },
  {
    id: 'concepto',
    minutes: '5 minutos',
    title: 'Concepto',
    description: 'Concepto del día explicado con calma',
    categories: ['desarrollo y enroque', 'medio juego', 'amenazas del rival'],
    targetExercises: 3
  },
  {
    id: 'final-apertura',
    minutes: '5-10 minutos',
    title: 'Final o apertura',
    description: 'Final básico o idea sencilla de apertura',
    categories: ['final de rey y peón', 'aperturas populares', 'desarrollo y enroque'],
    targetExercises: 3
  }
];

export function getTrainingBlock(id: TrainingBlock['id']): TrainingBlock {
  const block = trainingBlocks.find((item) => item.id === id);
  if (!block) throw new Error(`No existe el bloque ${id}`);
  return block;
}
