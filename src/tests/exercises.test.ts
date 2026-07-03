import { Chess, validateFen } from 'chess.js';
import { describe, expect, it } from 'vitest';
import { exercises, openingRoadmap } from '../data/exercises';
import { diagnosticExercises } from '../data/diagnostic';
import { boardMoveToSan, legalDestinations } from '../logic/boardMove';
import type { Exercise, ExerciseCategory } from '../types';

const expectedDiagnosticCounts: Record<ExerciseCategory, number> = {
  'piezas colgadas': 4,
  'amenazas del rival': 3,
  'jaques, capturas y amenazas': 2,
  'mate en 1': 2,
  'mate en 2': 1,
  'doble ataque': 0,
  clavada: 0,
  'desarrollo y enroque': 2,
  'final de rey y peón': 1,
  'aperturas populares': 0,
  'medio juego': 0
};

describe('ejercicios de ajedrez', () => {
  it('tienen FEN v?lido, turno coherente, reyes legales y soluciones normalizadas', () => {
    [...exercises, ...diagnosticExercises].forEach(assertValidExercise);
  });

  it('no repite posiciones FEN en el entrenamiento inicial', () => {
    const fens = exercises.map((exercise) => exercise.fen);
    expect(new Set(fens).size).toBe(fens.length);
  });

  it('no repite la misma posici?n con la misma soluci?n', () => {
    const keys = exercises.map((exercise) => `${exercise.fen}|${exercise.expectedMove}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('los mates en 1 terminan realmente en mate', () => {
    [...exercises, ...diagnosticExercises]
      .filter((exercise) => exercise.category === 'mate en 1')
      .forEach((exercise) => {
        const game = new Chess(exercise.fen);
        game.move(exercise.expectedMove, { strict: false });
        expect(game.isCheckmate(), exercise.id).toBe(true);
      });
  });

  it('los mates en 2 del entrenamiento cumplen contra todas las defensas legales', () => {
    exercises
      .filter((exercise) => exercise.category === 'mate en 2')
      .forEach((exercise) => {
        expect(findMateInOneMoves(exercise.fen), `${exercise.id}: tiene mate en 1`).toEqual([]);
        [exercise.expectedMove, ...(exercise.acceptedMoves ?? [])].forEach((move) => {
          expect(isForcedMateInTwo(exercise, move), `${exercise.id}: ${move}`).toBe(true);
        });
      });
  });

  it('m2-02 fuerza Ka7 y remata con Qb7#', () => {
    const exercise = exercises.find((item) => item.id === 'm2-02');
    expect(exercise).toBeDefined();
    if (!exercise) return;

    const game = new Chess(exercise.fen);
    game.move('Qb5', { strict: false });
    expect(game.moves()).toEqual(['Ka7']);

    const branch = new Chess(game.fen());
    branch.move('Ka7');
    branch.move('Qb7#', { strict: false });
    expect(branch.isCheckmate()).toBe(true);
  });

  it('mg-04 resuelve el jaque capturando la torre, no bloqueando una línea perdida', () => {
    const exercise = exercises.find((item) => item.id === 'mg-04');
    expect(exercise).toBeDefined();
    if (!exercise) return;

    const game = new Chess(exercise.fen);
    expect(game.inCheck()).toBe(true);

    const move = game.move(exercise.expectedMove, { strict: false });
    expect(move.san).toBe('Nxe1');
    expect(move.captured).toBe('r');
    expect(game.inCheck()).toBe(false);
    expect(game.isCheckmate()).toBe(false);
  });

  it('las validaciones pedag?gicas de amenazas del rival se cumplen', () => {
    exercises
      .filter((exercise) => exercise.category === 'amenazas del rival' && exercise.validation?.threatenedMove)
      .forEach((exercise) => {
        expect(threatWorksBeforeResponse(exercise), `${exercise.id}: la amenaza original no era real`).toBe(true);
        [exercise.expectedMove, ...(exercise.acceptedMoves ?? [])].forEach((move) => {
          expect(threatIsPreventedAfterResponse(exercise, move), `${exercise.id}: ${move} no neutraliza la amenaza`).toBe(true);
        });
      });
  });

  it('ar-02 impide que el alfil capture la torre con ganancia tras cada defensa aceptada', () => {
    const exercise = exercises.find((item) => item.id === 'ar-02');
    expect(exercise).toBeDefined();
    if (!exercise) return;

    const before = new Chess(withOppositeTurn(exercise.fen));
    const threat = before.move(exercise.validation?.threatenedMove ?? '', { strict: false });
    expect(threat.captured).toBe('r');

    [exercise.expectedMove, ...(exercise.acceptedMoves ?? [])].forEach((move) => {
      expect(bishopCannotCaptureRookWithGain(exercise.fen, move), `${move} no protege la torre`).toBe(true);
    });
  });

  it('ar-04 acepta Re1+ porque salva la torre con jaque', () => {
    const exercise = exercises.find((item) => item.id === 'ar-04');
    expect(exercise).toBeDefined();
    if (!exercise) return;

    expect(exercise.acceptedMoves).toContain('Re1+');
    const game = new Chess(exercise.fen);
    const move = game.move('Re1+', { strict: false });
    expect(move.san).toBe('Re1+');
    expect(game.isCheck()).toBe(true);
    expect(bishopCannotCaptureRookWithGain(exercise.fen, 'Re1+')).toBe(true);
  });

  it('fp-01 enseña a apoyar el peón antes de avanzarlo', () => {
    const exercise = exercises.find((item) => item.id === 'fp-01');
    expect(exercise).toBeDefined();
    if (!exercise) return;

    const afterExpected = new Chess(exercise.fen);
    afterExpected.move(exercise.expectedMove, { strict: false });
    expect(afterExpected.moves().includes('Kxe3')).toBe(false);

    const afterAccepted = new Chess(exercise.fen);
    afterAccepted.move(exercise.acceptedMoves?.[0] ?? '', { strict: false });
    expect(afterAccepted.moves().includes('Kxe3')).toBe(false);

    const afterPremature = new Chess(exercise.fen);
    afterPremature.move(exercise.validation?.prematureMove ?? '', { strict: false });
    const capture = afterPremature.move('Kxe4', { strict: false });
    expect(capture.captured).toBe('p');
  });

  it('convierte una jugada legal desde el tablero a SAN y rechaza una ilegal', () => {
    const exercise = exercises.find((item) => item.id === 'ar-02');
    expect(exercise).toBeDefined();
    if (!exercise) return;

    const move = boardMoveToSan(exercise.fen, 'c1', 'c2');
    expect(move?.san).toBe('Rc2');
    expect(legalDestinations(exercise.fen, 'c1')).toContain('c2');
    expect(boardMoveToSan(exercise.fen, 'c1', 'h1')).toBeNull();
  });

  it('permite que el alfil de b5 capture el alfil negro de d7', () => {
    const fen = 'r2qkb1r/pppb1ppp/n7/1B1pN3/3Pn3/2P5/PP3PPP/RNBQK2R w KQkq - 2 5';
    const move = boardMoveToSan(fen, 'b5', 'd7');

    expect(legalDestinations(fen, 'b5')).toContain('d7');
    expect(move?.san).toBe('Bxd7+');
  });

  it('el diagn?stico tiene 15 posiciones con la distribuci?n solicitada', () => {
    expect(diagnosticExercises).toHaveLength(15);
    Object.entries(expectedDiagnosticCounts).forEach(([category, count]) => {
      expect(diagnosticExercises.filter((exercise) => exercise.category === category).length, category).toBe(count);
    });
  });

  it('incluye la ruta de aperturas solicitada y ejercicios asociados', () => {
    const requestedOpenings = [
      'Sistema Londres',
      'Apertura Italiana',
      'Gambito de Dama',
      'Apertura Española',
      'Defensa Caro-Kann',
      'Defensa Francesa',
      'Defensa India de Rey',
      'Defensa Siciliana'
    ];
    const roadmapNames = openingRoadmap.flatMap((group) => group.openings.map((opening) => opening.name));
    const exerciseTags = exercises.flatMap((exercise) => exercise.tags ?? []);

    expect(roadmapNames).toEqual(requestedOpenings);
    requestedOpenings.forEach((opening) => {
      expect(exerciseTags, opening).toContain(opening.replace('Apertura ', '').replace('Defensa ', ''));
    });
  });
});

function assertValidExercise(exercise: Exercise) {
  const fenValidation = validateFen(exercise.fen);
  expect(fenValidation.ok, `${exercise.id}: ${fenValidation.error}`).toBe(true);

  const game = new Chess(exercise.fen);
  expect(game.turn(), `${exercise.id}: turno incoherente`).toBe(exercise.sideToMove);
  expect(countKings(game, 'w'), `${exercise.id}: rey blanco`).toBe(1);
  expect(countKings(game, 'b'), `${exercise.id}: rey negro`).toBe(1);
  expect(hasPawnsOnBackRank(game), `${exercise.id}: pe?n en primera u octava`).toBe(false);
  expect(kingsAreAdjacent(game), `${exercise.id}: reyes adyacentes`).toBe(false);
  expect(sideNotToMoveIsInCheck(exercise.fen), `${exercise.id}: rival ya est? en jaque`).toBe(false);

  const legalSan = normalizeLegalMove(game, exercise.expectedMove);
  expect(legalSan, `${exercise.id}: expectedMove ilegal`).not.toBeNull();
  expect(exercise.expectedMove, `${exercise.id}: expectedMove no est? normalizada a SAN`).toBe(legalSan);
  assertCheckSuffix(exercise, exercise.expectedMove);

  exercise.acceptedMoves?.forEach((move) => {
    const acceptedSan = normalizeLegalMove(new Chess(exercise.fen), move);
    expect(acceptedSan, `${exercise.id}: acceptedMove ilegal ${move}`).not.toBeNull();
    expect(move, `${exercise.id}: acceptedMove no est? normalizada a SAN`).toBe(acceptedSan);
    assertCheckSuffix(exercise, move);
  });

  expect(exercise.question.length, exercise.id).toBeGreaterThan(20);
  expect(exercise.hint?.length ?? 0, exercise.id).toBeGreaterThan(10);
  expect(exercise.explanation.length, exercise.id).toBeGreaterThan(25);
  expect(exercise.practicalRule.length, exercise.id).toBeGreaterThan(20);
  expect(exercise.teachingPoint?.length ?? 0, exercise.id).toBeGreaterThan(20);
}

function normalizeLegalMove(game: Chess, move: string): string | null {
  try {
    return game.move(move, { strict: false }).san;
  } catch {
    return null;
  }
}

function assertCheckSuffix(exercise: Exercise, move: string) {
  const game = new Chess(exercise.fen);
  game.move(move, { strict: false });
  if (move.endsWith('#')) {
    expect(game.isCheckmate(), `${exercise.id}: # sin mate`).toBe(true);
  } else if (move.endsWith('+')) {
    expect(game.isCheck(), `${exercise.id}: + sin jaque`).toBe(true);
    expect(game.isCheckmate(), `${exercise.id}: + usado en mate`).toBe(false);
  } else {
    expect(game.isCheck(), `${exercise.id}: falta + o #`).toBe(false);
    expect(game.isCheckmate(), `${exercise.id}: falta #`).toBe(false);
  }
}

function sideNotToMoveIsInCheck(fen: string): boolean {
  const parts = fen.split(' ');
  const opposite = parts[1] === 'w' ? 'b' : 'w';
  const swappedFen = [parts[0], opposite, parts[2], parts[3], parts[4], parts[5]].join(' ');
  return new Chess(swappedFen).isCheck();
}

function countKings(game: Chess, color: 'w' | 'b'): number {
  return game
    .board()
    .flat()
    .filter((piece) => piece?.type === 'k' && piece.color === color).length;
}

function hasPawnsOnBackRank(game: Chess): boolean {
  const board = game.board();
  return [...board[0], ...board[7]].some((piece) => piece?.type === 'p');
}

function kingsAreAdjacent(game: Chess): boolean {
  const kings = game
    .board()
    .flatMap((rank, rankIndex) =>
      rank.map((piece, fileIndex) => (piece?.type === 'k' ? { color: piece.color, rankIndex, fileIndex } : null))
    )
    .filter((king): king is { color: 'w' | 'b'; rankIndex: number; fileIndex: number } => Boolean(king));
  const white = kings.find((king) => king.color === 'w');
  const black = kings.find((king) => king.color === 'b');
  if (!white || !black) return false;
  return Math.abs(white.rankIndex - black.rankIndex) <= 1 && Math.abs(white.fileIndex - black.fileIndex) <= 1;
}

function isForcedMateInTwo(exercise: Exercise, firstMove = exercise.expectedMove): boolean {
  const first = new Chess(exercise.fen);
  const candidate = first.move(firstMove, { strict: false });
  if (!candidate || first.isCheckmate()) return false;

  return first.moves().every((reply) => {
    const branch = new Chess(first.fen());
    branch.move(reply);
    return branch.moves().some((mateMove) => {
      const finalPosition = new Chess(branch.fen());
      finalPosition.move(mateMove);
      return finalPosition.isCheckmate();
    });
  });
}

function findMateInOneMoves(fen: string): string[] {
  const game = new Chess(fen);
  return game.moves().filter((move) => {
    const branch = new Chess(fen);
    branch.move(move);
    return branch.isCheckmate();
  });
}

function threatWorksBeforeResponse(exercise: Exercise): boolean {
  if (!exercise.validation?.threatenedMove) return false;
  const game = new Chess(withOppositeTurn(exercise.fen));
  const move = game.move(exercise.validation.threatenedMove, { strict: false });

  if (exercise.validation.expectedOutcome === 'prevents-mate') return game.isCheckmate();
  if (exercise.validation.expectedOutcome === 'prevents-capture') return Boolean(move.captured);
  return true;
}

function withOppositeTurn(fen: string): string {
  const parts = fen.split(' ');
  parts[1] = parts[1] === 'w' ? 'b' : 'w';
  return parts.join(' ');
}

function threatIsPreventedAfterResponse(exercise: Exercise, move = exercise.expectedMove): boolean {
  if (!exercise.validation?.threatenedMove) return false;
  const game = new Chess(exercise.fen);
  game.move(move, { strict: false });

  try {
    const played = game.move(exercise.validation.threatenedMove, { strict: false });
    if (exercise.validation.expectedOutcome === 'prevents-mate') return !game.isCheckmate();
    if (exercise.validation.expectedOutcome === 'prevents-capture') return !played.captured;
    return true;
  } catch {
    return true;
  }
}

function bishopCannotCaptureRookWithGain(fen: string, whiteMove: string): boolean {
  const game = new Chess(fen);
  game.move(whiteMove, { strict: false });
  const black = new Chess(game.fen());
  return !black.moves({ verbose: true }).some((move) => move.captured === 'r');
}
