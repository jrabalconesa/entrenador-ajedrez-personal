import { describe, expect, it } from 'vitest';
import { normalizeUciMove, parseBestMove, parseStockfishInfo } from '../logic/stockfish';

describe('adaptador Stockfish', () => {
  it('extrae profundidad, evaluación y variante principal de una línea info', () => {
    const parsed = parseStockfishInfo('info depth 14 seldepth 18 score cp 42 nodes 12000 pv e2e4 e7e5 g1f3');

    expect(parsed.depth).toBe(14);
    expect(parsed.score).toEqual({ type: 'cp', value: 42 });
    expect(parsed.pv).toEqual(['e2e4', 'e7e5', 'g1f3']);
  });

  it('extrae evaluaciones de mate', () => {
    const parsed = parseStockfishInfo('info depth 9 score mate -3 pv h5f7 e8f7');

    expect(parsed.score).toEqual({ type: 'mate', value: -3 });
  });

  it('extrae la mejor jugada UCI', () => {
    expect(parseBestMove('bestmove e2e4 ponder e7e5')).toBe('e2e4');
    expect(parseBestMove('bestmove (none)')).toBeNull();
  });

  it('normaliza jugadas UCI con promoción', () => {
    expect(normalizeUciMove(' A7A8Q ')).toBe('a7a8q');
  });
});
