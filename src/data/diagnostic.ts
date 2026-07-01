import type { Exercise } from '../types';
import { exercises } from './exercises';

const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]));

function diagnosticCopy(id: string, diagnosticId: string): Exercise {
  const exercise = byId.get(id);
  if (!exercise) {
    throw new Error(`No existe el ejercicio base ${id}`);
  }
  return { ...exercise, id: diagnosticId };
}

export const diagnosticExercises: Exercise[] = [
  diagnosticCopy('pc-01', 'diag-pc-01'),
  diagnosticCopy('pc-02', 'diag-pc-02'),
  diagnosticCopy('pc-03', 'diag-pc-03'),
  diagnosticCopy('pc-04', 'diag-pc-04'),
  diagnosticCopy('ar-02', 'diag-ar-01'),
  diagnosticCopy('ar-03', 'diag-ar-02'),
  diagnosticCopy('ar-04', 'diag-ar-03'),
  diagnosticCopy('jca-01', 'diag-jca-01'),
  diagnosticCopy('jca-03', 'diag-jca-02'),
  diagnosticCopy('m1-01', 'diag-m1-01'),
  diagnosticCopy('m1-02', 'diag-m1-02'),
  diagnosticCopy('m2-01', 'diag-m2-01'),
  {
    id: 'diag-dev-01',
    category: 'desarrollo y enroque',
    difficulty: 1,
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
    sideToMove: 'w',
    question: 'Apertura sencilla. ¿Qué jugada desarrolla una pieza menor y prepara el enroque?',
    expectedMove: 'Bc4',
    explanation: 'Bc4 desarrolla el alfil, ayuda a preparar el enroque y apunta al centro. Es una jugada natural y fácil de entender.',
    practicalRule: 'En la apertura, desarrolla piezas menores antes de buscar ataques con la dama.',
    hint: 'Saca un alfil hacia una casilla activa sin mover la dama.',
    tags: ['desarrollo', 'alfil'],
    teachingPoint: 'Desarrollar una pieza menor antes de sacar la dama.'
  },
  {
    id: 'diag-dev-02',
    category: 'desarrollo y enroque',
    difficulty: 1,
    fen: 'rnbqkbnr/pppp1ppp/8/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 3',
    sideToMove: 'w',
    question: 'Tu rey ya puede ponerse seguro. ¿Qué jugada completa el plan básico de apertura?',
    expectedMove: 'O-O',
    explanation: 'Enrocar pone el rey a salvo y conecta mejor las torres. Para este nivel es una prioridad sana.',
    practicalRule: 'Si has desarrollado piezas y el rey puede enrocar, piensa seriamente en hacerlo.',
    hint: 'El camino entre el rey y la torre está libre.',
    tags: ['enroque', 'seguridad del rey'],
    teachingPoint: 'Enrocar pronto cuando el camino está despejado.'
  },
  diagnosticCopy('fp-01', 'diag-fp-01')
];
