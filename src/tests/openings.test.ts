import { Chess } from 'chess.js';
import { describe, expect, it } from 'vitest';
import { openingCourses } from '../data/openings';
import { openingRoadmap } from '../data/exercises';

describe('entrenador de aperturas', () => {
  it('mantiene el orden pedagógico de la ruta actual', () => {
    const roadmapNames = openingRoadmap.flatMap((group) => group.openings.map((opening) => opening.name));

    expect(openingCourses.map((course) => course.name)).toEqual(roadmapNames);
  });

  it('incluye repertorio para blancas y negras', () => {
    expect(openingCourses.filter((course) => course.side === 'blancas')).toHaveLength(4);
    expect(openingCourses.filter((course) => course.side === 'negras')).toHaveLength(4);
  });

  it('todas las líneas se reproducen con jugadas SAN legales', () => {
    openingCourses.forEach((course) => {
      expect(course.plan.length, course.name).toBeGreaterThanOrEqual(3);
      course.lines.forEach((line) => {
        const game = new Chess();
        expect(line.moves.length, line.id).toBeGreaterThanOrEqual(8);
        expect(line.keyIdeas.length, line.id).toBeGreaterThanOrEqual(3);

        line.moves.forEach((move, index) => {
          const played = game.move(move.san, { strict: false });
          expect(played.san, `${line.id} jugada ${index + 1}`).toBe(move.san);
          expect(move.explanation.length, `${line.id} explicación ${index + 1}`).toBeGreaterThan(30);
        });
      });
    });
  });

  it('cada curso entrena jugadas del bando seleccionado', () => {
    openingCourses.forEach((course) => {
      const trainingColor = course.side === 'blancas' ? 'w' : 'b';
      course.lines.forEach((line) => {
        const game = new Chess();
        const trainedMoves = line.moves.filter((move) => {
          const matchesTurn = game.turn() === trainingColor;
          game.move(move.san, { strict: false });
          return matchesTurn;
        });

        expect(trainedMoves.length, line.id).toBeGreaterThanOrEqual(4);
      });
    });
  });
});
