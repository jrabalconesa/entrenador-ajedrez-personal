import { Chess } from 'chess.js';
import { describe, expect, it } from 'vitest';
import { buildMoveHints } from '../logic/moveHints';

describe('move hints', () => {
  it('classifies legal destinations with the coach traffic-light signal', () => {
    const game = new Chess();

    const hints = buildMoveHints(game.fen(), 'g1', 'w');
    const developKnight = hints.find((hint) => hint.san === 'Nf3');

    expect(hints.length).toBeGreaterThan(0);
    expect(developKnight?.signal).toBe('green');
    expect(developKnight?.reason).toContain('desarrolla');
    expect(developKnight?.details[0]).toContain('sana');
  });

  it('does not show hints for the opponent pieces', () => {
    const game = new Chess();
    const hints = buildMoveHints(game.fen(), 'e7', 'w');

    expect(hints).toEqual([]);
  });

  it('orders better candidate groups before problematic moves', () => {
    const game = new Chess();
    game.move('e4');
    game.move('e5');
    game.move('Bc4');
    game.move('Na6');

    const hints = buildMoveHints(game.fen(), 'c4', 'w');
    const firstRedIndex = hints.findIndex((hint) => hint.signal === 'red');
    const lastGreenIndex = hints.reduce((lastIndex, hint, index) => (hint.signal === 'green' ? index : lastIndex), -1);

    expect(lastGreenIndex).toBeGreaterThanOrEqual(0);
    expect(firstRedIndex).toBeGreaterThan(lastGreenIndex);
  });

  it('marks one candidate as recommended when the selected piece has the coach choice', () => {
    const game = new Chess();

    const hints = buildMoveHints(game.fen(), 'b1', 'w');

    expect(hints[0].recommended).toBe(true);
    expect(hints[0].details[0]).toContain('miraría primero');
  });
});
