import { Chess, validateFen } from 'chess.js';
import { describe, expect, it } from 'vitest';
import { conceptGroups, tacticalConcepts } from '../data/concepts';

describe('táctica y estrategia', () => {
  it('incluye los grupos y conceptos solicitados', () => {
    expect(conceptGroups).toEqual(['Tácticas y movimientos clave', 'Movimientos especiales y reglas', 'Conceptos de la partida', 'Finales']);
    expect(tacticalConcepts.map((concept) => concept.id)).toEqual([
      'clavada',
      'clavada-absoluta',
      'clavada-relativa',
      'tenedor',
      'ataque-descubierto',
      'enfilada',
      'enroque',
      'captura-al-paso',
      'promocion',
      'jaque',
      'jaque-mate',
      'ahogado',
      'zugzwang',
      'final-mate-dama',
      'final-mate-torre',
      'final-regla-cuadrado',
      'final-oposicion',
      'final-casillas-clave',
      'final-rey-delante-peon',
      'final-peon-torre',
      'final-ruptura-peones',
      'final-pasado-protegido',
      'final-correspondencia',
      'final-lucena',
      'final-philidor',
      'final-cortar-rey',
      'final-tarrasch',
      'final-defensa-flanco',
      'final-vancura',
      'final-dos-alfiles',
      'final-alfil-caballo',
      'final-alfil-equivocado',
      'final-alfiles-distinto-color',
      'final-alfiles-mismo-color',
      'final-caballo-contra-peones',
      'final-dominacion',
      'final-dama-peon-septima',
      'final-dama-contra-torre'
    ]);
  });

  it('ordena los finales de básico a avanzado', () => {
    const finalIds = tacticalConcepts.filter((concept) => concept.group === 'Finales').map((concept) => concept.id);

    expect(finalIds.slice(0, 4)).toEqual(['final-mate-dama', 'final-mate-torre', 'final-regla-cuadrado', 'final-oposicion']);
    expect(finalIds.at(-1)).toBe('final-dama-contra-torre');
  });

  it('cada ejercicio tiene FEN válido y jugada esperada legal en SAN', () => {
    tacticalConcepts.forEach((concept) => {
      expect(concept.definition.length, `${concept.id}: definición`).toBeGreaterThan(40);
      expect(concept.pattern.length, `${concept.id}: patrón`).toBeGreaterThan(30);
      expect(concept.explanation.length, `${concept.id}: explicación`).toBeGreaterThan(40);
      getConceptExercises(concept).forEach((exercise, index) => {
        const label = `${concept.id}:${index + 1}`;
        const fenValidation = validateFen(exercise.fen);
        expect(fenValidation.ok, `${label}: ${fenValidation.error}`).toBe(true);

        const game = new Chess(exercise.fen);
        expect(game.turn(), `${label}: turno`).toBe(exercise.sideToMove);
        const played = game.move(exercise.expectedMove, { strict: false });
        expect(played.san, label).toBe(exercise.expectedMove);
        exercise.acceptedMoves?.forEach((move) => {
          const accepted = new Chess(exercise.fen).move(move, { strict: false });
          expect(accepted.san, `${label}: variante`).toBe(move);
        });
        expect(exercise.explanation.length, `${label}: explicación`).toBeGreaterThan(40);
      });
    });
  });

  it('valida resultados especiales de los ejercicios', () => {
    tacticalConcepts
      .filter((concept) => concept.validation)
      .forEach((concept) => {
        const game = new Chess(concept.fen);
        const played = game.move(concept.expectedMove, { strict: false });

        if (concept.validation === 'check') expect(game.isCheck(), concept.id).toBe(true);
        if (concept.validation === 'checkmate') expect(game.isCheckmate(), concept.id).toBe(true);
        if (concept.validation === 'stalemate') expect(game.isStalemate(), concept.id).toBe(true);
        if (concept.validation === 'castle') expect(played.isKingsideCastle(), concept.id).toBe(true);
        if (concept.validation === 'en-passant') expect(played.isEnPassant(), concept.id).toBe(true);
        if (concept.validation === 'promotion') expect(played.promotion, concept.id).toBe('q');
      });
  });

  it('usa ejemplos distintos para las tres variantes de clavada', () => {
    const pinConcepts = tacticalConcepts.filter((concept) => concept.id.startsWith('clavada'));
    const fens = pinConcepts.map((concept) => concept.fen);

    expect(new Set(fens).size).toBe(pinConcepts.length);
    pinConcepts.forEach((concept) => {
      expect(concept.exercises?.length, concept.id).toBeGreaterThanOrEqual(2);
    });
  });

  it('zugzwang acepta la alternativa simétrica Ke3', () => {
    const concept = tacticalConcepts.find((item) => item.id === 'zugzwang');
    expect(concept?.acceptedMoves).toContain('Ke3');

    const game = new Chess(concept?.fen);
    const move = game.move('Ke3', { strict: false });
    expect(move.san).toBe('Ke3');
  });
});

function getConceptExercises(concept: (typeof tacticalConcepts)[number]) {
  return concept.exercises?.length ? concept.exercises : [concept];
}
