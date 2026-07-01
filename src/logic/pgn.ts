import { Chess } from 'chess.js';

export function validatePgn(pgn: string): { valid: boolean; message: string } {
  if (!pgn.trim()) return { valid: false, message: 'Pega un PGN antes de guardar.' };
  try {
    const game = new Chess();
    game.loadPgn(pgn);
    return { valid: true, message: 'PGN válido.' };
  } catch {
    return { valid: false, message: 'El PGN no parece válido. Revisa que incluya jugadas legales.' };
  }
}
