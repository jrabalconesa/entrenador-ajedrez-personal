import { Chess, type Color, type Move, type PieceSymbol } from 'chess.js';
import { reviewPlayerMove } from './gameCoach';
import { normalizeUciMove, StockfishClient, type StockfishAnalyzeOptions, type StockfishLine } from './stockfish';
import type { GameError, SavedGame } from '../types';

export interface GameAnalysisResult {
  errors: GameError[];
  analyzedMoves: number;
  message: string;
  source?: 'interno' | 'stockfish';
}

export function analyzeSavedGame(game: SavedGame): GameAnalysisResult {
  const chess = new Chess();

  try {
    chess.loadPgn(game.pgn);
  } catch {
    return {
      errors: [],
      analyzedMoves: 0,
      message: 'No se pudo analizar: el PGN guardado no parece válido.'
    };
  }

  const playerColor = getPlayerColor(game.color);
  const moves = chess.history({ verbose: true });
  const targetMoves = playerColor ? moves.filter((move) => move.color === playerColor) : moves;
  const errors = sortGameErrors(targetMoves.flatMap((move, index) => {
    const review = reviewPlayerMove(move);
    const ruleErrors = review.errors.map((error, errorIndex) => ({
      ...error,
      id: `auto-rule-${game.id}-${index}-${errorIndex}-${move.san}`,
      source: 'automatic' as const,
      fenBefore: move.before,
      fenAfter: move.after
    }));
    const evaluationError = findEvaluationError(game.id, index, move);
    return mergeMoveErrors(ruleErrors, evaluationError);
  }));
  const summary = summarizeErrors(errors);

  return {
    errors,
    analyzedMoves: targetMoves.length,
    message:
      errors.length > 0
        ? `Análisis completado: ${errors.length} aviso${errors.length === 1 ? '' : 's'} detectado${errors.length === 1 ? '' : 's'}. ${summary}`
        : `Análisis completado: no se detectaron errores claros en ${targetMoves.length} jugada${targetMoves.length === 1 ? '' : 's'}.`,
    source: 'interno'
  };
}

export async function analyzeSavedGameWithStockfish(
  game: SavedGame,
  options: StockfishAnalyzeOptions & { maxMoves?: number } = {}
): Promise<GameAnalysisResult> {
  const fallback = analyzeSavedGame(game);
  const chess = new Chess();

  try {
    chess.loadPgn(game.pgn);
  } catch {
    return fallback;
  }

  const playerColor = getPlayerColor(game.color);
  const targetMoves = (playerColor ? chess.history({ verbose: true }).filter((move) => move.color === playerColor) : chess.history({ verbose: true })).slice(0, options.maxMoves ?? 12);
  if (targetMoves.length === 0) return fallback;

  const engine = new StockfishClient(options.workerUrl);
  const engineErrors: GameError[] = [];

  try {
    for (const [index, move] of targetMoves.entries()) {
      const line = await engine.analyzeFen(move.before, options);
      const engineError = buildStockfishError(game.id, index, move, line);
      if (engineError) engineErrors.push(engineError);
    }
  } catch {
    return {
      ...fallback,
      message: `${fallback.message} Stockfish no está disponible; se usó el análisis interno.`
    };
  } finally {
    engine.dispose();
  }

  const errors = sortGameErrors(mergeEngineAndInternalErrors(engineErrors, fallback.errors));
  const summary = summarizeErrors(errors);

  return {
    errors,
    analyzedMoves: targetMoves.length,
    message:
      errors.length > 0
        ? `Análisis con Stockfish completado: ${errors.length} aviso${errors.length === 1 ? '' : 's'} detectado${errors.length === 1 ? '' : 's'}. ${summary}`
        : `Análisis con Stockfish completado: no se detectaron errores claros en ${targetMoves.length} jugada${targetMoves.length === 1 ? '' : 's'}.`,
    source: 'stockfish'
  };
}

export function mergeAutomaticAnalysis(game: SavedGame, analysis: GameAnalysisResult): SavedGame {
  const manualErrors = game.errors.filter((error) => error.source !== 'automatic');
  return {
    ...game,
    errors: [...sortGameErrors(analysis.errors), ...manualErrors]
  };
}

export function recordGameErrorPractice(game: SavedGame, errorId: string, correct: boolean, practicedAt = new Date()): SavedGame {
  return {
    ...game,
    errors: game.errors.map((error) => {
      if (error.id !== errorId) return error;
      return {
        ...error,
        practiceAttempts: (error.practiceAttempts ?? 0) + 1,
        practiceSuccesses: (error.practiceSuccesses ?? 0) + (correct ? 1 : 0),
        lastPracticedAt: practicedAt.toISOString()
      };
    })
  };
}

function getPlayerColor(color: SavedGame['color']): Color | null {
  if (color === 'blancas') return 'w';
  if (color === 'negras') return 'b';
  return null;
}

const pieceValues: Record<PieceSymbol, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 0
};

function findEvaluationError(gameId: string, moveIndex: number, move: Move): GameError | null {
  const before = new Chess(move.before);
  const playedScore = evaluateMove(before, move.san, move.color);
  const best = findBestEvaluatedMove(before, move.color);
  if (!best || best.san === move.san) return null;

  const loss = Math.round(best.score - playedScore);
  const severity = getEvaluationSeverity(loss);
  if (!severity) return null;

  return {
    id: `auto-eval-${gameId}-${moveIndex}-${move.san}`,
    moveNumber: formatMoveNumber(move.before),
    category: chooseEvaluationCategory(best.move),
    note: buildEvaluationNote(move, best.move, loss, severity),
    playedMove: move.san,
    suggestedMove: best.move.san,
    source: 'automatic',
    severity,
    evaluationLoss: loss,
    fenBefore: move.before,
    fenAfter: move.after
  };
}

function findBestEvaluatedMove(game: Chess, color: Color): { move: Move; san: string; score: number } | null {
  const candidates = game.moves({ verbose: true });
  if (candidates.length === 0) return null;

  const evaluated = candidates
    .map((move) => ({
      move,
      san: move.san,
      score: evaluateMove(game, move.san, color)
    }))
    .sort((a, b) => b.score - a.score);

  return evaluated[0] ?? null;
}

function buildStockfishError(gameId: string, moveIndex: number, move: Move, line: StockfishLine): GameError | null {
  const bestMove = normalizeUciMove(line.bestMove);
  const playedMove = `${move.from}${move.to}${move.promotion ?? ''}`;
  if (!bestMove || bestMove === normalizeUciMove(playedMove)) return null;

  const before = new Chess(move.before);
  const suggested = uciMoveToSan(before, bestMove);
  if (!suggested) return null;

  return {
    id: `auto-engine-${gameId}-${moveIndex}-${move.san}`,
    moveNumber: formatMoveNumber(move.before),
    category: chooseEvaluationCategory(suggested.move),
    note: buildStockfishNote(move, suggested.san, line),
    playedMove: move.san,
    suggestedMove: suggested.san,
    source: 'automatic',
    severity: getStockfishSeverity(line),
    evaluationLoss: line.score?.type === 'cp' ? Math.abs(line.score.value) : undefined,
    fenBefore: move.before,
    fenAfter: move.after
  };
}

function uciMoveToSan(game: Chess, uciMove: string): { san: string; move: Move } | null {
  try {
    const move = game.move({
      from: uciMove.slice(0, 2),
      to: uciMove.slice(2, 4),
      promotion: uciMove[4]
    });
    return { san: move.san, move };
  } catch {
    return null;
  }
}

function buildStockfishNote(move: Move, suggestedSan: string, line: StockfishLine): string {
  const depth = line.depth ? ` Profundidad ${line.depth}.` : '';
  const score =
    line.score?.type === 'mate'
      ? ` Evaluación: mate en ${Math.abs(line.score.value)}.`
      : line.score?.type === 'cp'
        ? ` Evaluación aproximada: ${line.score.value} centipeones desde el turno analizado.`
        : '';
  const pv = line.pv?.length ? ` Línea principal: ${line.pv.slice(0, 5).join(' ')}.` : '';
  return `${move.san} no coincide con la primera elección del motor. Mejor alternativa: ${suggestedSan}.${depth}${score}${pv}`;
}

function getStockfishSeverity(line: StockfishLine): GameError['severity'] {
  if (line.score?.type === 'mate') return 'grave';
  const score = Math.abs(line.score?.value ?? 0);
  if (score >= 500) return 'grave';
  if (score >= 250) return 'error';
  return 'imprecision';
}

function mergeEngineAndInternalErrors(engineErrors: GameError[], internalErrors: GameError[]): GameError[] {
  const engineKeys = new Set(engineErrors.map((error) => `${error.fenBefore}-${error.playedMove}`));
  const complementary = internalErrors.filter((error) => !engineKeys.has(`${error.fenBefore}-${error.playedMove}`));
  return [...engineErrors, ...complementary];
}

function evaluateMove(game: Chess, san: string, color: Color): number {
  const trial = new Chess(game.fen());
  const move = trial.move(san);

  if (trial.isCheckmate()) return 100_000;

  const material = evaluateMaterial(trial, color);
  const captureGain = move.captured ? pieceValues[move.captured] - pieceValues[move.piece] * 0.15 : 0;
  const checkBonus = trial.isCheck() ? 45 : 0;
  const centerBonus = getCenterBonus(move);
  const hangingPenalty = isMovedPieceLoose(trial, move) ? pieceValues[move.piece] * 0.8 : 0;

  return material + captureGain + checkBonus + centerBonus - hangingPenalty;
}

function evaluateMaterial(game: Chess, color: Color): number {
  let score = 0;
  for (const row of game.board()) {
    for (const piece of row) {
      if (!piece) continue;
      score += pieceValues[piece.type] * (piece.color === color ? 1 : -1);
    }
  }
  return score;
}

function isMovedPieceLoose(game: Chess, move: Move): boolean {
  if (pieceValues[move.piece] < 300) return false;
  const opponent = game.turn();
  const attackers = game.attackers(move.to, opponent);
  if (attackers.length === 0) return false;
  const defenders = game.attackers(move.to, move.color);
  return defenders.length === 0;
}

function getCenterBonus(move: Move): number {
  if (['d4', 'e4', 'd5', 'e5'].includes(move.to)) return 25;
  if (['c3', 'd3', 'e3', 'f3', 'c4', 'f4', 'c5', 'f5', 'c6', 'd6', 'e6', 'f6'].includes(move.to)) return 12;
  return 0;
}

function getEvaluationSeverity(loss: number): GameError['severity'] | null {
  if (loss >= 500) return 'grave';
  if (loss >= 250) return 'error';
  if (loss >= 140) return 'imprecision';
  return null;
}

function chooseEvaluationCategory(bestMove: Move): GameError['category'] {
  if (bestMove.isCapture() || bestMove.san.includes('+') || bestMove.san.includes('#')) return 'jaques, capturas y amenazas';
  if (bestMove.piece === 'n' || bestMove.piece === 'b') return 'desarrollo y enroque';
  return 'medio juego';
}

function buildEvaluationNote(move: Move, bestMove: Move, loss: number, severity: NonNullable<GameError['severity']>): string {
  const label = severity === 'grave' ? 'error grave' : severity === 'error' ? 'error' : 'imprecisión';
  const reason = bestMove.isCapture()
    ? `${bestMove.san} gana o recupera material de forma más concreta`
    : bestMove.san.includes('+')
      ? `${bestMove.san} fuerza al rival con jaque`
      : `${bestMove.san} deja una posición más estable`;

  return `${move.san} se marca como ${label}: la evaluación práctica baja unos ${loss} centipeones. Mejor alternativa: ${bestMove.san}. ${reason}.`;
}

function mergeMoveErrors(ruleErrors: GameError[], evaluationError: GameError | null): GameError[] {
  if (!evaluationError) return ruleErrors;
  const duplicatesRuleError = ruleErrors.some((error) => error.playedMove === evaluationError.playedMove && error.suggestedMove === evaluationError.suggestedMove);
  if (duplicatesRuleError) return ruleErrors;
  return [...ruleErrors, evaluationError];
}

function sortGameErrors(errors: GameError[]): GameError[] {
  return [...errors].sort((a, b) => {
    const severityDelta = getErrorPriority(b) - getErrorPriority(a);
    if (severityDelta !== 0) return severityDelta;
    return (b.evaluationLoss ?? 0) - (a.evaluationLoss ?? 0);
  });
}

function getErrorPriority(error: GameError): number {
  if (error.severity === 'grave') return 5;
  if (error.severity === 'error') return 4;
  if (error.category === 'piezas colgadas' || error.category === 'amenazas del rival') return 3;
  if (error.severity === 'imprecision') return 2;
  return 1;
}

function summarizeErrors(errors: GameError[]): string {
  const graves = errors.filter((error) => error.severity === 'grave').length;
  const mistakes = errors.filter((error) => error.severity === 'error').length;
  const inaccuracies = errors.filter((error) => error.severity === 'imprecision').length;
  const parts = [
    graves > 0 ? `${graves} grave${graves === 1 ? '' : 's'}` : '',
    mistakes > 0 ? `${mistakes} error${mistakes === 1 ? '' : 'es'}` : '',
    inaccuracies > 0 ? `${inaccuracies} imprecisión${inaccuracies === 1 ? '' : 'es'}` : ''
  ].filter(Boolean);
  return parts.length > 0 ? `Prioridad: ${parts.join(', ')}.` : 'Prioridad: revisar avisos tácticos básicos.';
}

function formatMoveNumber(fen: string): string {
  const parts = fen.split(' ');
  const fullMove = parts[5] ?? '1';
  return parts[1] === 'b' ? `${fullMove}...` : `${fullMove}.`;
}
