import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  loadAttempts,
  loadDiagnosticResult,
  loadGames,
  loadTrainingDayProgress,
  markTrainingBlockCompleted,
  saveAttempt,
  saveDiagnosticResult,
  saveGame
} from '../storage/localStore';
import type { DiagnosticResult, ExerciseAttempt, SavedGame } from '../types';

const memory = new Map<string, string>();

beforeEach(() => {
  memory.clear();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => memory.set(key, value),
    removeItem: (key: string) => memory.delete(key),
    clear: () => memory.clear()
  });
});

describe('almacenamiento local', () => {
  it('devuelve listas vacías cuando no hay datos previos', () => {
    expect(loadAttempts()).toEqual([]);
    expect(loadGames()).toEqual([]);
    expect(loadDiagnosticResult()).toBeNull();
  });

  it('recupera datos aunque haya guardados previos', () => {
    const attempt: ExerciseAttempt = {
      id: 'a1',
      exerciseId: 'pc-01',
      category: 'piezas colgadas',
      difficulty: 1,
      attemptKind: 'practice',
      correct: false,
      gaveUp: true,
      seconds: 12,
      date: '2026-06-29T10:00:00.000Z',
      pendingReviews: [],
      completedReviews: []
    };
    const game: SavedGame = {
      id: 'g1',
      date: '2026-06-29T10:00:00.000Z',
      pgn: '1. e4 e5 2. Nf3 Nc6 *',
      color: 'blancas',
      result: '*',
      opponent: 'Rival',
      errors: []
    };
    const diagnostic: DiagnosticResult = {
      id: 'd1',
      date: '2026-06-29T10:00:00.000Z',
      total: 15,
      correct: 10,
      strengths: ['piezas colgadas'],
      weaknesses: ['amenazas del rival'],
      sevenDayPlan: ['Repasar amenazas']
    };

    saveAttempt(attempt);
    saveGame(game);
    saveDiagnosticResult(diagnostic);

    expect(loadAttempts()).toEqual([attempt]);
    expect(loadGames()).toEqual([game]);
    expect(loadDiagnosticResult()).toEqual(diagnostic);
  });

  it('conserva el progreso al simular cerrar y reabrir el programa', () => {
    const firstAttempt: ExerciseAttempt = {
      id: 'a1',
      exerciseId: 'pc-01',
      category: 'piezas colgadas',
      difficulty: 1,
      attemptKind: 'practice',
      correct: true,
      seconds: 9,
      date: '2026-06-29T10:00:00.000Z',
      pendingReviews: [],
      completedReviews: []
    };
    const secondAttempt: ExerciseAttempt = {
      ...firstAttempt,
      id: 'a2',
      exerciseId: 'da-01',
      category: 'doble ataque',
      difficulty: 2,
      date: '2026-06-29T10:05:00.000Z'
    };

    saveAttempt(firstAttempt);
    expect(loadAttempts()).toEqual([firstAttempt]);

    const attemptsAfterReopen = loadAttempts();
    expect(attemptsAfterReopen).toHaveLength(1);
    expect(attemptsAfterReopen[0].id).toBe('a1');

    saveAttempt(secondAttempt);
    expect(loadAttempts().map((attempt) => attempt.id)).toEqual(['a2', 'a1']);
  });

  it('marca bloques diarios completados y reinicia la marca al cambiar de día', () => {
    const firstDay = new Date('2026-06-30T10:00:00');
    const nextDay = new Date('2026-07-01T10:00:00');

    expect(loadTrainingDayProgress(firstDay)).toEqual({ date: '2026-06-30', completedBlockIds: [] });
    expect(markTrainingBlockCompleted('repaso', firstDay).completedBlockIds).toEqual(['repaso']);
    expect(markTrainingBlockCompleted('repaso', firstDay).completedBlockIds).toEqual(['repaso']);
    expect(markTrainingBlockCompleted('tacticas', firstDay).completedBlockIds).toEqual(['repaso', 'tacticas']);
    expect(loadTrainingDayProgress(nextDay)).toEqual({ date: '2026-07-01', completedBlockIds: [] });
  });

  it('no se rompe con JSON corrupto en el navegador', () => {
    memory.set('epa_attempts_v2', '{mal');
    memory.set('epa_games_v1', '{mal');
    memory.set('epa_diagnostic_v1', '{mal');

    expect(loadAttempts()).toEqual([]);
    expect(loadGames()).toEqual([]);
    expect(loadDiagnosticResult()).toBeNull();
  });

  it('migra intentos antiguos desde epa_attempts_v1', () => {
    const legacy = [
      {
        id: 'old',
        exerciseId: 'pc-01',
        category: 'piezas colgadas',
        difficulty: 1,
        correct: false,
        seconds: 10,
        date: '2026-06-29T10:00:00.000Z',
        reviewDates: ['2026-06-30T10:00:00.000Z']
      }
    ];
    memory.set('epa_attempts_v1', JSON.stringify(legacy));

    const migrated = loadAttempts();

    expect(migrated[0].attemptKind).toBe('practice');
    expect(migrated[0].pendingReviews).toEqual([{ id: 'review-2026-06-30', scheduledFor: '2026-06-30T10:00:00.000Z' }]);
    expect(JSON.parse(memory.get('epa_attempts_v2') ?? '[]')).toHaveLength(1);
  });

  it('tolera JSON válido con estructura incorrecta y guarda respaldo antes de reiniciar', () => {
    memory.set('epa_attempts_v2', JSON.stringify({ bad: true }));

    expect(loadAttempts()).toEqual([]);
    expect(memory.has('epa_attempts_v2')).toBe(false);
    expect([...memory.keys()].some((key) => key.startsWith('epa_attempts_v2_backup_'))).toBe(true);
  });
});
