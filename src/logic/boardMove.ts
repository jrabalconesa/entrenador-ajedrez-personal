import { Chess, type Square } from 'chess.js';

export type BoardMoveResult = {
  san: string;
  fen: string;
  from: string;
  to: string;
};

export function boardMoveToSan(fen: string, from: string, to: string, promotion = 'q'): BoardMoveResult | null {
  const game = new Chess(fen);
  const piece = game.get(from as Square);
  if (!piece) return null;

  const moveRequest = piece.type === 'p' && (to.endsWith('8') || to.endsWith('1')) ? { from, to, promotion } : { from, to };

  try {
    const move = game.move(moveRequest);
    return {
      san: move.san,
      fen: game.fen(),
      from: move.from,
      to: move.to
    };
  } catch {
    return null;
  }
}

export function legalDestinations(fen: string, square: string): string[] {
  const game = new Chess(fen);
  return game.moves({ square: square as Square, verbose: true }).map((move) => move.to);
}

export function kingInCheckSquare(fen: string): string | null {
  const game = new Chess(fen);
  if (!game.isCheck()) return null;
  const turn = game.turn();

  for (const row of game.board()) {
    for (const piece of row) {
      if (piece?.type === 'k' && piece.color === turn) return piece.square;
    }
  }

  return null;
}
