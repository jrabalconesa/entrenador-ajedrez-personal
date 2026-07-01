import { describe, expect, it } from 'vitest';
import { Chess } from 'chess.js';
import { playPositionPresets } from '../data/playPositions';
import { chooseCoachMove, describePlayerMove, reviewPlayerMove } from '../logic/gameCoach';

describe('partida guiada', () => {
  it('todas las posiciones predefinidas son legales', () => {
    playPositionPresets.forEach((preset) => {
      expect(() => (preset.fen === 'start' ? new Chess() : new Chess(preset.fen)), preset.id).not.toThrow();
    });
  });

  it('el entrenador elige una jugada legal desde la posición inicial', () => {
    const move = chooseCoachMove(new Chess().fen());
    const game = new Chess();

    expect(move).not.toBeNull();
    expect(() => game.move(move!.san)).not.toThrow();
  });

  it('el nivel básico e intermedio también devuelven jugadas legales', () => {
    const fen = new Chess().fen();

    for (const level of ['basico', 'intermedio', 'firme'] as const) {
      const move = chooseCoachMove(fen, level);
      const game = new Chess();

      expect(move, level).not.toBeNull();
      expect(() => game.move(move!.san), level).not.toThrow();
    }
  });

  it('comenta una jugada de desarrollo con una explicación útil', () => {
    const game = new Chess();
    const move = game.move('Nf3');

    expect(describePlayerMove(move)).toContain('Buen desarrollo');
    expect(reviewPlayerMove(move).signal).toBe('green');
  });

  it('detecta cuando una pieza de valor queda atacada y sin defensa', () => {
    const game = new Chess('6k1/8/7p/8/8/5N2/8/6K1 w - - 0 1');
    const move = game.move('Ng5');
    const review = reviewPlayerMove(move);

    expect(review.comment).toContain('deja una pieza de valor');
    expect(review.hasError).toBe(true);
    expect(review.signal).toBe('red');
    expect(review.errors.some((error) => error.category === 'piezas colgadas')).toBe(true);
    expect(review.errors[0].playedMove).toBe('Ng5');
    expect(review.errors[0].suggestedMove).toBeDefined();
  });

  it('marca en naranja una jugada vulnerable que merece revisión sin registrarla como error', () => {
    const game = new Chess('6k1/8/7p/8/8/4BN2/8/6K1 w - - 0 1');
    const move = game.move('Ng5');
    const review = reviewPlayerMove(move);

    expect(review.signal).toBe('orange');
    expect(review.hasError).toBe(false);
    expect(review.errors).toEqual([]);
  });

  it('detecta una captura material clara ignorada antes de mover', () => {
    const game = new Chess('4k3/8/8/8/8/8/3q2P1/3R2K1 w - - 0 1');
    const move = game.move('Kh1');
    const review = reviewPlayerMove(move);

    expect(review.hasError).toBe(true);
    expect(review.signal).toBe('red');
    expect(review.comment).toContain('Rxd2');
    expect(review.errors.some((error) => error.category === 'jaques, capturas y amenazas')).toBe(true);
    expect(review.errors[0].playedMove).toBe('Kh1');
    expect(review.errors[0].suggestedMove).toBe('Rxd2');
  });
});
