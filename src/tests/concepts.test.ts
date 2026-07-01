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
      const fenValidation = validateFen(concept.fen);
      expect(fenValidation.ok, `${concept.id}: ${fenValidation.error}`).toBe(true);

      const game = new Chess(concept.fen);
      expect(game.turn(), `${concept.id}: turno`).toBe(concept.sideToMove);
      const played = game.move(concept.expectedMove, { strict: false });
      expect(played.san, concept.id).toBe(concept.expectedMove);
      expect(concept.definition.length, `${concept.id}: definición`).toBeGreaterThan(40);
      expect(concept.pattern.length, `${concept.id}: patrón`).toBeGreaterThan(30);
      expect(concept.explanation.length, `${concept.id}: explicación`).toBeGreaterThan(40);
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
});
