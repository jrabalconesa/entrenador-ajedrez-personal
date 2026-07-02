import { describe, expect, it } from 'vitest';
import { analyzeSavedGame, mergeAutomaticAnalysis, recordGameErrorPractice } from '../logic/gameAnalysis';
import type { SavedGame } from '../types';

const baseGame: SavedGame = {
  id: 'g-analysis',
  date: '2026-07-01T10:00:00.000Z',
  pgn: '1. e4 e5 2. Qh5 Nc6 3. Bc4 Nf6 *',
  color: 'blancas',
  result: '*',
  opponent: 'Rival',
  errors: []
};

describe('análisis automático de partidas', () => {
  it('detecta errores de las jugadas del color indicado', () => {
    const analysis = analyzeSavedGame(baseGame);

    expect(analysis.analyzedMoves).toBe(3);
    expect(analysis.errors.some((error) => error.playedMove === 'Qh5')).toBe(true);
    expect(analysis.errors.every((error) => error.source === 'automatic')).toBe(true);
    expect(analysis.errors.every((error) => error.fenBefore && error.fenAfter)).toBe(true);
    expect(analysis.message).toContain('Análisis completado');
  });

  it('añade una pérdida de evaluación aproximada con severidad y alternativa', () => {
    const analysis = analyzeSavedGame({
      ...baseGame,
      pgn: '1. e4 e5 2. Ba6 bxa6 *',
      color: 'blancas'
    });
    const evaluationError = analysis.errors.find((error) => error.playedMove === 'Ba6' && error.severity);

    expect(evaluationError).toBeDefined();
    expect(['imprecision', 'error', 'grave']).toContain(evaluationError?.severity);
    expect(evaluationError?.evaluationLoss).toBeGreaterThanOrEqual(140);
    expect(evaluationError?.suggestedMove).toBeDefined();
    expect(evaluationError?.fenBefore).toContain(' w ');
  });

  it('ordena los avisos automáticos por prioridad de revisión', () => {
    const analysis = analyzeSavedGame({
      ...baseGame,
      pgn: '1. e4 e5 2. Qh5 Nc6 3. Ba6 bxa6 *',
      color: 'blancas'
    });

    expect(analysis.errors[0].severity ?? analysis.errors[0].category).toBeTruthy();
    expect(analysis.message).toContain('Prioridad');
  });

  it('tolera PGN inválido sin romper la pantalla', () => {
    const analysis = analyzeSavedGame({ ...baseGame, pgn: '1. e4 e5 2. ReyNoExiste *' });

    expect(analysis.analyzedMoves).toBe(0);
    expect(analysis.errors).toEqual([]);
    expect(analysis.message).toContain('No se pudo analizar');
  });

  it('reemplaza solo avisos automáticos y conserva errores manuales', () => {
    const gameWithManualError: SavedGame = {
      ...baseGame,
      errors: [
        {
          id: 'manual-1',
          moveNumber: '2.',
          category: 'otro',
          note: 'Error añadido por el usuario.',
          source: 'manual'
        },
        {
          id: 'old-auto',
          moveNumber: '1.',
          category: 'amenazas del rival',
          note: 'Aviso automático antiguo.',
          source: 'automatic'
        }
      ]
    };

    const updated = mergeAutomaticAnalysis(gameWithManualError, analyzeSavedGame(gameWithManualError));

    expect(updated.errors.some((error) => error.id === 'manual-1')).toBe(true);
    expect(updated.errors.some((error) => error.id === 'old-auto')).toBe(false);
    expect(updated.errors.some((error) => error.source === 'automatic')).toBe(true);
    expect(updated.errors.some((error) => error.source === 'automatic' && error.fenBefore)).toBe(true);
    expect(updated.errors.at(-1)?.id).toBe('manual-1');
  });

  it('cubre el flujo analizar, practicar y registrar acierto', () => {
    const analysis = analyzeSavedGame(baseGame);
    const analyzedGame = mergeAutomaticAnalysis(baseGame, analysis);
    const practiceError = analyzedGame.errors.find((error) => error.source === 'automatic' && error.suggestedMove);
    expect(practiceError).toBeDefined();
    if (!practiceError) return;

    const practicedGame = recordGameErrorPractice(analyzedGame, practiceError.id, true, new Date('2026-07-02T12:00:00.000Z'));
    const practicedError = practicedGame.errors.find((error) => error.id === practiceError.id);

    expect(practicedError?.practiceAttempts).toBe(1);
    expect(practicedError?.practiceSuccesses).toBe(1);
    expect(practicedError?.lastPracticedAt).toBe('2026-07-02T12:00:00.000Z');
    expect(practicedError?.fenBefore).toBe(practiceError.fenBefore);
  });
});
