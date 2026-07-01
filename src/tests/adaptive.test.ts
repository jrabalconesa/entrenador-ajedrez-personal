import { describe, expect, it, vi } from 'vitest';
import {
  buildReviewDates,
  createExerciseAttempt,
  getAllowedDifficulty,
  getExerciseProgress,
  getExerciseWeight,
  getOverallMasteryFloor,
  recordAttemptProgress,
  selectNextExercise
} from '../logic/adaptive';
import type { Exercise, ExerciseAttempt, ExerciseCategory, ExerciseProgress } from '../types';

const baseExercise: Exercise = {
  id: 'base',
  category: 'piezas colgadas',
  difficulty: 1,
  fen: '4k3/8/8/8/8/8/4K3/8 w - - 0 1',
  sideToMove: 'w',
  question: 'Pregunta suficientemente larga',
  expectedMove: 'Ke3',
  explanation: 'Explicación suficientemente larga para la prueba.',
  practicalRule: 'Regla práctica suficientemente clara para la prueba.',
  hint: 'Pista suficiente',
  teachingPoint: 'Idea pedagógica suficiente para la prueba.'
};

function exercise(overrides: Partial<Exercise>): Exercise {
  return {
    ...baseExercise,
    ...overrides
  };
}

function attempt(overrides: Partial<ExerciseAttempt>): ExerciseAttempt {
  return {
    id: crypto.randomUUID(),
    exerciseId: 'base',
    category: 'piezas colgadas',
    difficulty: 1,
    attemptKind: 'practice',
    correct: true,
    seconds: 20,
    date: '2026-06-20T10:00:00.000Z',
    pendingReviews: [],
    completedReviews: [],
    ...overrides
  };
}

function emptyProgress(exerciseId = 'base'): ExerciseProgress {
  return {
    exerciseId,
    attempts: 0,
    mistakes: 0,
    pendingReviews: [],
    completedReviews: []
  };
}

describe('lógica adaptativa', () => {
  it('da más peso a categorías con menos del 60% de acierto', () => {
    const weakExercise = exercise({ id: 'weak', category: 'amenazas del rival' });
    const strongExercise = exercise({ id: 'strong', category: 'mate en 1' });
    const attempts = [
      attempt({ category: 'amenazas del rival', correct: false }),
      attempt({ category: 'amenazas del rival', correct: false }),
      attempt({ category: 'mate en 1', correct: true }),
      attempt({ category: 'mate en 1', correct: true })
    ];

    expect(getExerciseWeight(weakExercise, attempts)).toBeGreaterThan(getExerciseWeight(strongExercise, attempts));
  });

  it('programa revisiones a 1, 3 y 7 días cuando se falla', () => {
    const dates = buildReviewDates(new Date('2026-06-29T10:00:00.000Z'));

    expect(dates.map((date) => date.slice(0, 10))).toEqual(['2026-06-30', '2026-07-02', '2026-07-06']);
  });

  it('consolida un nivel con al menos 8 intentos y 75% de acierto', () => {
    const sevenMixed = [
      ...Array.from({ length: 5 }, (_, index) => attempt({ id: `a${index}`, correct: true, difficulty: 1 })),
      ...Array.from({ length: 2 }, (_, index) => attempt({ id: `a-fail-${index}`, correct: false, difficulty: 1 }))
    ];
    const eightWithLowAccuracy = [
      ...Array.from({ length: 5 }, (_, index) => attempt({ id: `b${index}`, correct: true, difficulty: 1 })),
      ...Array.from({ length: 3 }, (_, index) => attempt({ id: `c${index}`, correct: false, difficulty: 1 }))
    ];
    const eightWithEnoughAccuracy = [
      ...Array.from({ length: 2 }, (_, index) => attempt({ id: `e${index}`, correct: false, difficulty: 1 })),
      ...Array.from({ length: 6 }, (_, index) => attempt({ id: `d${index}`, correct: true, difficulty: 1 }))
    ];

    expect(getAllowedDifficulty(sevenMixed, 'piezas colgadas')).toBe(1);
    expect(getAllowedDifficulty(eightWithLowAccuracy, 'piezas colgadas')).toBe(1);
    expect(getAllowedDifficulty(eightWithEnoughAccuracy, 'piezas colgadas')).toBe(2);
  });

  it('permite probar un nivel superior tras tres aciertos recientes', () => {
    const streak = Array.from({ length: 3 }, (_, index) =>
      attempt({ id: `streak-${index}`, correct: true, difficulty: 1, date: `2026-06-2${index}T10:00:00.000Z` })
    );

    expect(getAllowedDifficulty(streak, 'piezas colgadas')).toBe(2);
  });

  it('frena la subida cuando los dos intentos recientes son fallos', () => {
    const attempts = [
      ...Array.from({ length: 8 }, (_, index) => attempt({ id: `ok-${index}`, correct: true, difficulty: 1 })),
      attempt({ id: 'fail-1', correct: false, difficulty: 2, date: '2026-06-28T10:00:00.000Z' }),
      attempt({ id: 'fail-2', correct: false, difficulty: 2, date: '2026-06-29T10:00:00.000Z' })
    ];

    expect(getAllowedDifficulty(attempts, 'piezas colgadas')).toBe(1);
  });

  it('usa el rendimiento global alto para no bloquear categorías nuevas en nivel 1', () => {
    const attempts = Array.from({ length: 16 }, (_, index) =>
      attempt({
        id: `global-ok-${index}`,
        exerciseId: `global-${index}`,
        category: index % 2 === 0 ? 'mate en 1' : 'medio juego',
        correct: index !== 0,
        difficulty: 1,
        date: `2026-06-${String(10 + index).padStart(2, '0')}T10:00:00.000Z`
      })
    );

    expect(getOverallMasteryFloor(attempts)).toBe(2);
    expect(getAllowedDifficulty(attempts, 'final de rey y peón')).toBe(2);
  });

  it('prefiere ejercicios más exigentes cuando el rendimiento global ya es alto', () => {
    const basic = exercise({ id: 'basic', difficulty: 1, fen: '4k3/8/8/8/8/8/4K3/8 w - - 0 1' });
    const harder = exercise({ id: 'harder', difficulty: 2, fen: '4k3/8/8/8/8/8/5K2/8 w - - 0 1' });
    const attempts = Array.from({ length: 16 }, (_, index) =>
      attempt({
        id: `strong-${index}`,
        exerciseId: `strong-${index}`,
        correct: index !== 0,
        difficulty: 1,
        date: `2026-06-${String(10 + index).padStart(2, '0')}T10:00:00.000Z`
      })
    );

    expect(selectNextExercise([basic, harder], attempts, { random: () => 0 })?.id).toBe('harder');
  });

  it('un intento normal correcto no completa una revisión futura', () => {
    const failed = recordAttemptProgress(emptyProgress(), false, new Date('2026-06-29T10:00:00.000Z'));
    const practice = recordAttemptProgress(failed, true, new Date('2026-06-30T10:00:00.000Z'), { attemptKind: 'practice' });

    expect(practice.pendingReviews).toHaveLength(3);
    expect(practice.completedReviews).toHaveLength(0);
  });

  it('un acierto antes de la fecha de revisión no completa una revisión futura aunque tenga reviewId', () => {
    const failed = recordAttemptProgress(emptyProgress(), false, new Date('2026-06-29T10:00:00.000Z'));
    const early = recordAttemptProgress(failed, true, new Date('2026-06-29T12:00:00.000Z'), {
      attemptKind: 'review',
      reviewId: failed.pendingReviews[0].id
    });

    expect(early.pendingReviews).toHaveLength(3);
    expect(early.completedReviews).toHaveLength(0);
  });

  it('un acierto en un repaso vencido completa sólo la revisión correspondiente', () => {
    const failed = recordAttemptProgress(emptyProgress(), false, new Date('2026-06-29T10:00:00.000Z'));
    const reviewed = recordAttemptProgress(failed, true, new Date('2026-06-30T10:00:00.000Z'), {
      attemptKind: 'review',
      reviewId: failed.pendingReviews[0].id
    });

    expect(reviewed.pendingReviews.map((review) => review.scheduledFor.slice(0, 10))).toEqual(['2026-07-02', '2026-07-06']);
    expect(reviewed.completedReviews).toHaveLength(1);
    expect(reviewed.lastReviewCompletedAt).toBe('2026-06-30T10:00:00.000Z');
  });

  it('un nuevo fallo reinicia la secuencia pendiente y conserva historial completado', () => {
    const failed = recordAttemptProgress(emptyProgress(), false, new Date('2026-06-29T10:00:00.000Z'));
    const reviewed = recordAttemptProgress(failed, true, new Date('2026-06-30T10:00:00.000Z'), {
      attemptKind: 'review',
      reviewId: failed.pendingReviews[0].id
    });
    const failedAgain = recordAttemptProgress(reviewed, false, new Date('2026-07-01T10:00:00.000Z'));

    expect(failedAgain.completedReviews).toHaveLength(1);
    expect(failedAgain.pendingReviews.map((review) => review.scheduledFor.slice(0, 10))).toEqual(['2026-07-02', '2026-07-04', '2026-07-08']);
  });

  it('crea intentos con tipo y progreso explícito de revisión', () => {
    vi.stubGlobal('crypto', { randomUUID: () => 'attempt-1' });
    const created = createExerciseAttempt(baseExercise, false, 12, { date: new Date('2026-06-29T10:00:00.000Z') });

    expect(created.attemptKind).toBe('practice');
    expect(created.pendingReviews.map((review) => review.scheduledFor.slice(0, 10))).toEqual(['2026-06-30', '2026-07-02', '2026-07-06']);
    expect(created.completedReviews).toEqual([]);
  });

  it('prioriza un error básico de piezas colgadas frente a un ejercicio avanzado sin errores recientes por frecuencia', () => {
    const basicExercise = exercise({ id: 'basic', category: 'piezas colgadas', fen: '4k3/8/8/8/8/8/4K3/8 w - - 0 1' });
    const advancedExercise = exercise({ id: 'advanced', category: 'doble ataque', fen: '4k3/8/8/8/8/8/5K2/8 w - - 0 1' });
    const attempts = [
      ...Array.from({ length: 8 }, (_, index) => attempt({ id: `base-ok-${index}`, category: 'doble ataque', correct: true })),
      attempt({
        exerciseId: 'basic',
        category: 'piezas colgadas',
        correct: false,
        date: '2026-06-28T10:00:00.000Z',
        pendingReviews: [{ id: 'review-basic', scheduledFor: '2026-06-29T10:00:00.000Z' }]
      }),
      attempt({ exerciseId: 'advanced', category: 'doble ataque', correct: true })
    ];
    const counts = { basic: 0, advanced: 0 };

    for (let index = 0; index < 100; index += 1) {
      const selected = selectNextExercise([advancedExercise, basicExercise], attempts, {
        today: new Date('2026-06-29T10:00:00.000Z'),
        random: () => index / 100
      });
      if (selected) counts[selected.id as keyof typeof counts] += 1;
    }

    expect(counts.basic).toBeGreaterThan(counts.advanced);
    expect(counts.advanced).toBeGreaterThan(0);
  });

  it('puede devolver varios ejercicios elegibles en ejecuciones repetidas', () => {
    const pool = Array.from({ length: 5 }, (_, index) =>
      exercise({
        id: `e${index}`,
        category: 'piezas colgadas' as ExerciseCategory,
        fen: `4k3/8/8/8/8/8/${index + 1}K6/8 w - - 0 1`
      })
    );
    const selected = new Set<string>();

    for (let index = 0; index < 20; index += 1) {
      selected.add(selectNextExercise(pool, [], { random: () => index / 20 })?.id ?? 'none');
    }

    expect(selected.size).toBeGreaterThan(1);
  });

  it('no selecciona ejercicios ni FEN ya vistos durante la misma sesión', () => {
    const first = exercise({ id: 'first', fen: '4k3/8/8/8/8/8/4K3/8 w - - 0 1' });
    const sameFen = exercise({ id: 'same-fen', fen: '4k3/8/8/8/8/8/4K3/8 w - - 5 9' });
    const fresh = exercise({ id: 'fresh', fen: '4k3/8/8/8/8/8/5K2/8 w - - 0 1' });

    const selected = selectNextExercise([first, sameFen, fresh], [], {
      seenExerciseIds: ['first'],
      shownFens: [first.fen],
      random: () => 0
    });

    expect(selected?.id).toBe('fresh');
  });

  it('devuelve null si ya no quedan ejercicios elegibles en la sesión', () => {
    const only = exercise({ id: 'only' });

    expect(selectNextExercise([only], [], { seenExerciseIds: ['only'] })).toBeNull();
  });

  it('excluye por completo ejercicios con dificultad superior al nivel permitido', () => {
    const advanced = exercise({ id: 'advanced', difficulty: 2 });

    expect(selectNextExercise([advanced], [], { random: () => 0 })).toBeNull();
  });

  it('reconstruye progreso aprendido con tres repasos correctos y baja prioridad', () => {
    const firstFailed = attempt({ exerciseId: 'base', correct: false, date: '2026-06-01T10:00:00.000Z' });
    const learnedAttempts = [
      firstFailed,
      attempt({ exerciseId: 'base', correct: true, attemptKind: 'review', reviewId: 'review-2026-06-02', date: '2026-06-02T10:00:00.000Z' }),
      attempt({ exerciseId: 'base', correct: true, attemptKind: 'review', reviewId: 'review-2026-06-04', date: '2026-06-04T10:00:00.000Z' }),
      attempt({ exerciseId: 'base', correct: true, attemptKind: 'review', reviewId: 'review-2026-06-08', date: '2026-06-08T10:00:00.000Z' })
    ];
    const progress = getExerciseProgress('base', learnedAttempts);

    expect(progress.pendingReviews).toHaveLength(0);
    expect(progress.completedReviews).toHaveLength(3);
    expect(getExerciseWeight(baseExercise, learnedAttempts, new Date('2026-06-29T10:00:00.000Z'))).toBeLessThan(
      getExerciseWeight(baseExercise, [], new Date('2026-06-29T10:00:00.000Z'))
    );
  });
});
