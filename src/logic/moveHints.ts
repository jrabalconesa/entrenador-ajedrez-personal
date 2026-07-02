import { Chess, type Color, type PieceSymbol, type Square, type Move } from 'chess.js';
import { buildCoachLogDetails } from './coachDetails';
import { chooseCoachMove, reviewPlayerMove } from './gameCoach';

export type MoveHintSignal = 'green' | 'orange' | 'red';

export type MoveHint = {
  from: string;
  to: string;
  san: string;
  signal: MoveHintSignal;
  reason: string;
  details: string[];
  recommended: boolean;
};

const signalRank: Record<MoveHintSignal, number> = {
  green: 3,
  orange: 2,
  red: 1
};

const pieceValues: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0
};

export function buildMoveHints(fen: string, selectedSquare: string | null, playerColor: Color | null): MoveHint[] {
  if (!selectedSquare || !playerColor) return [];

  const game = new Chess(fen);
  const piece = game.get(selectedSquare as Square);
  if (!piece || piece.color !== playerColor || game.turn() !== playerColor) return [];

  const hintsByTarget = new Map<string, MoveHint>();
  const bestMove = chooseCoachMove(fen, 'firme');

  for (const candidate of game.moves({ square: selectedSquare as Square, verbose: true })) {
    const trial = new Chess(fen);
    const move = trial.move(candidate);
    const review = reviewPlayerMove(move);
    const recommended = bestMove?.san === move.san;
    const signal = recommended || isClearMaterialCapture(move, review.errors) ? 'green' : review.signal;
    const details = buildMoveHintDetails(review.comment, signal, recommended);
    const current = hintsByTarget.get(move.to);
    if (!current || signalRank[signal] > signalRank[current.signal]) {
      hintsByTarget.set(move.to, {
        from: move.from,
        to: move.to,
        san: move.san,
        signal,
        reason: summarizeMoveHintReason(review.comment, signal),
        details,
        recommended
      });
    }
  }

  return [...hintsByTarget.values()].sort(compareMoveHints);
}

export function moveHintColor(signal: MoveHintSignal): string {
  if (signal === 'green') return 'rgba(22, 163, 74, 0.78)';
  if (signal === 'orange') return 'rgba(245, 158, 11, 0.86)';
  return 'rgba(220, 38, 38, 0.86)';
}

function isClearMaterialCapture(move: Move, errors: ReturnType<typeof reviewPlayerMove>['errors']): boolean {
  if (!move.captured) return false;
  const leavesPieceLoose = errors.some((error) => error.category === 'piezas colgadas');
  return !leavesPieceLoose && pieceValues[move.captured] >= pieceValues[move.piece];
}

function buildMoveHintDetails(comment: string, signal: MoveHintSignal, recommended: boolean): string[] {
  const details = buildCoachLogDetails(comment);
  if (recommended) {
    return ['Es la candidata que el entrenador miraría primero en esta posición.', ...details.slice(0, 2)];
  }
  if (signal === 'green') {
    return ['Esta candidata parece sana según el entrenador.', ...details.slice(0, 2)];
  }
  if (signal === 'orange') {
    return ['Esta candidata puede jugarse, pero exige revisar la respuesta rival.', ...details.slice(0, 2)];
  }
  return ['Esta candidata es legal, pero el entrenador detecta un problema práctico.', ...details.slice(0, 2)];
}

function compareMoveHints(left: MoveHint, right: MoveHint): number {
  const signalDifference = signalRank[right.signal] - signalRank[left.signal];
  if (signalDifference !== 0) return signalDifference;

  const priorityDifference = getMoveHintPriority(right) - getMoveHintPriority(left);
  if (priorityDifference !== 0) return priorityDifference;

  return left.san.localeCompare(right.san);
}

function getMoveHintPriority(hint: MoveHint): number {
  let priority = 0;
  if (hint.recommended) priority += 1_000;
  if (hint.san.includes('#')) priority += 100;
  if (hint.san.includes('+')) priority += 35;
  if (hint.san.includes('x')) priority += 30;
  if (hint.reason.includes('desarrolla')) priority += 12;
  if (hint.reason.includes('centro')) priority += 8;
  if (hint.reason.includes('seguridad del rey')) priority += 8;
  if (hint.reason.includes('amenaza') || hint.reason.includes('vigila')) priority -= 10;
  return priority;
}

function summarizeMoveHintReason(comment: string, signal: MoveHintSignal): string {
  if (comment.includes('queda marcada como error')) {
    const alternative = getMatch(comment, /Mejor alternativa a calcular: ([^.]+)\./);
    if (alternative) return `hay una alternativa más concreta: ${alternative}`;
    return 'puede permitir una amenaza importante';
  }

  if (comment.includes('Ojo con la respuesta')) {
    const reply = getMatch(comment, /Ojo con la respuesta ([^:]+):/);
    return reply ? `vigila la respuesta ${reply}` : 'vigila los jaques del rival';
  }

  if (comment.includes('Atención:')) return 'comprueba si la pieza queda defendida';
  if (comment.includes('gana o cambia material')) return 'gana o cambia material';
  if (comment.includes('da jaque')) return 'da jaque y fuerza respuesta';
  if (comment.includes('Buen desarrollo')) return 'desarrolla una pieza hacia el centro';
  if (comment.includes('ocupa el centro')) return 'ocupa el centro';
  if (comment.includes('apunta hacia el centro')) return 'apunta hacia el centro';
  if (comment.includes('enrocar')) return 'mejora la seguridad del rey';
  if (signal === 'green') return 'jugada candidata sana';
  if (signal === 'orange') return 'jugada jugable, pero hay que calcular';
  return 'jugada problemática en esta posición';
}

function getMatch(text: string, pattern: RegExp): string | null {
  const match = text.match(pattern);
  return match?.[1]?.trim() || null;
}
