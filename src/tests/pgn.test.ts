import { describe, expect, it } from 'vitest';
import { validatePgn } from '../logic/pgn';

describe('validación de PGN', () => {
  it('acepta una partida PGN legal', () => {
    expect(validatePgn('1. e4 e5 2. Nf3 Nc6 *').valid).toBe(true);
  });

  it('rechaza PGN vacío o ilegal sin romper la app', () => {
    expect(validatePgn('').valid).toBe(false);
    expect(validatePgn('1. e4 e5 2. ReyNoExiste *').valid).toBe(false);
  });
});
