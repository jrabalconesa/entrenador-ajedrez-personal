import { Chess, type Color, type Move, type PieceSymbol, type Square } from 'chess.js';
import type { GameError } from '../types';

export type CoachLevel = 'basico' | 'intermedio' | 'firme';
type GameErrorDraft = Omit<GameError, 'id'>;

interface PlayerMoveReview {
  comment: string;
  errors: GameErrorDraft[];
  hasError: boolean;
  signal: 'green' | 'orange' | 'red';
}

const pieceValues: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0
};

const centerSquares = new Set(['d4', 'e4', 'd5', 'e5']);
const extendedCenterSquares = new Set(['c3', 'd3', 'e3', 'f3', 'c4', 'f4', 'c5', 'f5', 'c6', 'd6', 'e6', 'f6']);

export function chooseCoachMove(fen: string, level: CoachLevel = 'firme'): Move | null {
  const game = new Chess(fen);
  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return null;

  const sortedMoves = [...moves].sort((a, b) => scoreCoachMove(game, b) - scoreCoachMove(game, a));
  if (level === 'firme') return sortedMoves[0];
  if (level === 'intermedio') return sortedMoves[Math.min(2, sortedMoves.length - 1)];
  return sortedMoves[Math.min(Math.floor(sortedMoves.length * 0.55), sortedMoves.length - 1)];
}

export function describePlayerMove(move: Move): string {
  return reviewPlayerMove(move).comment;
}

export function reviewPlayerMove(move: Move): PlayerMoveReview {
  const before = new Chess(move.before);
  const after = new Chess(move.after);
  const opponent = after.turn();
  const comments: string[] = [];
  const errors: GameErrorDraft[] = [];
  const moveNumber = formatMoveNumber(move.before);

  if (after.isCheckmate()) {
    return {
      comment: `${move.san} decide la partida: es jaque mate. Has convertido la amenaza principal sin dar tiempo al rival.`,
      errors: [],
      hasError: false,
      signal: 'green'
    };
  }

  if (move.isCapture()) {
    comments.push(`Buena señal: ${move.san} gana o cambia material. Comprueba siempre que la pieza que captura no queda indefensa.`);
  }

  if (after.isCheck()) {
    comments.push(`${move.san} da jaque. Los jaques obligan al rival a responder y suelen facilitar el cálculo.`);
  }

  if (isCastleMove(move)) {
    comments.push('Buen principio práctico: enrocar mejora la seguridad del rey y conecta las torres.');
  }

  if (isDevelopmentMove(move)) {
    comments.push('Buen desarrollo: activas una pieza menor hacia el centro y aumentas tus opciones.');
  }

  if (centerSquares.has(move.to)) {
    comments.push('La jugada ocupa el centro, una zona clave para coordinar las piezas.');
  } else if (extendedCenterSquares.has(move.to)) {
    comments.push('La pieza apunta hacia el centro, lo que suele facilitar planes sanos.');
  }

  const looseMovedPiece = findLooseMovedPiece(after, move);
  if (looseMovedPiece) {
    comments.push(looseMovedPiece.comment);
    errors.push({
      moveNumber,
      category: 'piezas colgadas',
      note: looseMovedPiece.note,
      playedMove: move.san,
      suggestedMove: findPracticalAlternative(before, move.san)
    });
  } else if (after.isAttacked(move.to, opponent) && pieceValues[move.piece] >= 3) {
    const attackers = after.attackers(move.to, opponent);
    comments.push(
      attackers.length > 0
        ? `Atención: la pieza que acabas de mover puede ser atacada en ${move.to}. Antes de confirmar, revisa si queda defendida o si gana algo concreto.`
        : `Atención: revisa si la pieza en ${move.to} queda vulnerable.`
    );
  }

  const missedCapture = findMissedMaterialCapture(before, move);
  if (missedCapture) {
    comments.push(`Antes de ${move.san}, revisa ${missedCapture.san}: era una captura material muy concreta que merecía calcularse primero.`);
    errors.push({
      moveNumber,
      category: 'jaques, capturas y amenazas',
      note: `Se jugó ${move.san}, pero había una captura clara: ${missedCapture.san}. Antes de mover, revisa capturas forzadas y material indefenso.`,
      playedMove: move.san,
      suggestedMove: missedCapture.san
    });
  }

  const immediateCheck = findImmediateOpponentCheck(after);
  if (immediateCheck && !after.isCheck()) {
    comments.push(`Ojo con la respuesta ${immediateCheck.san}: el rival puede darte jaque inmediatamente. Antes de soltar la pieza, mira los jaques del contrario.`);
    errors.push({
      moveNumber,
      category: 'amenazas del rival',
      note: `Tras ${move.san}, el rival dispone de ${immediateCheck.san} con jaque. Faltó revisar los jaques candidatos del rival.`,
      playedMove: move.san,
      suggestedMove: findPracticalAlternative(before, move.san)
    });
  }

  if (isEarlyQueenMove(move)) {
    comments.push('La dama salió pronto. No siempre es malo, pero en fase inicial conviene desarrollar piezas menores, enrocar y asegurar el centro.');
    errors.push({
      moveNumber,
      category: 'desarrollo y enroque',
      note: `${move.san} saca la dama muy pronto. Si no gana algo concreto, suele ser mejor desarrollar piezas menores y preparar el enroque.`,
      playedMove: move.san,
      suggestedMove: findPracticalAlternative(before, move.san)
    });
  }

  const mainAlternative = errors.map((error) => error.suggestedMove).find((suggestedMove): suggestedMove is string => Boolean(suggestedMove));

  if (comments.length === 0) {
    return {
      comment: `${move.san} es una jugada legal. Busca ahora la amenaza del rival y prepara una mejora concreta: actividad, seguridad del rey o centro.`,
      errors,
      hasError: false,
      signal: 'green'
    };
  }

  if (errors.length > 0) {
    const alternativeText = mainAlternative ? ` Mejor alternativa a calcular: ${mainAlternative}.` : ' Vuelve atrás y busca una jugada que elimine la amenaza principal.';
    return {
      comment: `Tu jugada ${move.san} queda marcada como error.${alternativeText} ${comments.join(' ')}`,
      errors: errors.slice(0, 2),
      hasError: true,
      signal: 'red'
    };
  }

  return { comment: comments.join(' '), errors: [], hasError: false, signal: isCautionComment(comments) ? 'orange' : 'green' };
}

export function describeCoachMove(move: Move): string {
  const after = new Chess(move.after);
  const reason = getCoachMoveReason(move);

  if (after.isCheckmate()) return `El rival juega ${move.san}: es mate. Revisa qué casillas de escape faltaban.`;
  if (after.isCheck()) return `El rival juega ${move.san}, dando jaque. Responde primero a la amenaza directa.`;
  return `El rival juega ${move.san}. ${reason}`;
}

export function getGameStatus(game: Chess): string | null {
  if (game.isCheckmate()) return 'Partida terminada por jaque mate.';
  if (game.isStalemate()) return 'Partida terminada en ahogado.';
  if (game.isDraw()) return 'Partida terminada en tablas.';
  if (game.isCheck()) return 'Tu rey está en jaque: responde a esa amenaza antes de hacer otra cosa.';
  return null;
}

function scoreCoachMove(game: Chess, move: Move): number {
  const trial = new Chess(game.fen());
  trial.move(move.san);

  let score = 0;
  if (trial.isCheckmate()) score += 10_000;
  if (trial.isCheck()) score += 35;
  if (move.isCapture()) score += (pieceValues[move.captured ?? 'p'] - pieceValues[move.piece] * 0.15) * 20;
  if (isCastleMove(move)) score += 25;
  if (isDevelopmentMove(move)) score += 18;
  if (centerSquares.has(move.to)) score += 14;
  if (extendedCenterSquares.has(move.to)) score += 8;
  if (trial.isAttacked(move.to, trial.turn()) && pieceValues[move.piece] >= 3) score -= pieceValues[move.piece] * 12;
  return score;
}

function getCoachMoveReason(move: Move): string {
  if (move.isCapture()) return 'Ha elegido una captura o cambio de material; mira si puedes recapturar o ganar un tiempo.';
  if (isCastleMove(move)) return 'Ha mejorado la seguridad del rey; busca jugar con desarrollo y centro.';
  if (isDevelopmentMove(move)) return 'Desarrolla una pieza y aumenta la presión sobre el centro.';
  if (centerSquares.has(move.to)) return 'Ocupa el centro; decide si debes cambiar, defender o atacar esa pieza.';
  return 'Continúa con una jugada legal y razonable; revisa amenazas, capturas y piezas indefensas.';
}

function isCastleMove(move: Move): boolean {
  return move.isKingsideCastle() || move.isQueensideCastle();
}

function isDevelopmentMove(move: Move): boolean {
  if (move.piece !== 'n' && move.piece !== 'b') return false;
  const homeSquares: Record<Color, Square[]> = {
    w: ['b1', 'c1', 'f1', 'g1'],
    b: ['b8', 'c8', 'f8', 'g8']
  };
  return homeSquares[move.color].includes(move.from);
}

function isCautionComment(comments: string[]): boolean {
  return comments.some((comment) => comment.startsWith('Atención:') || comment.startsWith('Ojo'));
}

function findLooseMovedPiece(game: Chess, move: Move): { comment: string; note: string } | null {
  if (pieceValues[move.piece] < 3) return null;

  const opponent = game.turn();
  const attackers = game.attackers(move.to, opponent);
  if (attackers.length === 0) return null;

  const defenders = game.attackers(move.to, move.color);
  const directCapture = game
    .moves({ verbose: true })
    .find((candidate) => candidate.to === move.to && candidate.isCapture() && candidate.captured === move.piece);
  if (!directCapture || defenders.length > 0) return null;

  return {
    comment: `Atención: ${move.san} deja una pieza de valor en ${move.to} atacada y sin defensa clara. Revisa siempre si la pieza queda protegida.`,
    note: `${move.san} dejó una pieza de valor en ${move.to} atacada y sin defensa. Antes de mover, comprueba atacantes y defensores.`
  };
}

function findMissedMaterialCapture(game: Chess, playedMove: Move): Move | null {
  if (playedMove.isCapture()) return null;

  const candidates = game
    .moves({ verbose: true })
    .filter((move) => move.isCapture() && move.captured && pieceValues[move.captured] - pieceValues[move.piece] >= 2)
    .sort((a, b) => materialGain(b) - materialGain(a));

  return candidates[0] ?? null;
}

function findPracticalAlternative(game: Chess, playedSan: string): string | undefined {
  const missedCapture = findMissedMaterialCapture(game, { isCapture: () => false } as Move);
  if (missedCapture && missedCapture.san !== playedSan) return missedCapture.san;

  const candidate = chooseCoachMove(game.fen(), 'firme');
  if (!candidate || candidate.san === playedSan) return undefined;
  return candidate.san;
}

function findImmediateOpponentCheck(game: Chess): Move | null {
  const checks = game.moves({ verbose: true }).filter((move) => {
    const trial = new Chess(game.fen());
    trial.move(move.san);
    return trial.isCheck();
  });
  return checks[0] ?? null;
}

function materialGain(move: Move): number {
  return pieceValues[move.captured ?? 'p'] - pieceValues[move.piece];
}

function isEarlyQueenMove(move: Move): boolean {
  const fullMoveNumber = Number(move.before.split(' ')[5] ?? '1');
  return move.piece === 'q' && fullMoveNumber <= 6 && !move.isCapture() && !move.san.includes('+');
}

function formatMoveNumber(fen: string): string {
  const parts = fen.split(' ');
  const turn = parts[1] === 'b' ? '...' : '.';
  return `${parts[5] ?? '1'}${turn}`;
}
