import { Chess } from 'chess.js';
import { describe, expect, it } from 'vitest';
import { openingCourses } from '../data/openings';
import { openingLearning } from '../data/openingLearning';
import { recognizeOpeningFromPgn } from '../logic/openingLearning';
import { openingRoadmap } from '../data/exercises';

describe('entrenador de aperturas', () => {
  it('mantiene el orden pedagógico de la ruta actual', () => {
    const roadmapNames = openingRoadmap.flatMap((group) => group.openings.map((opening) => opening.name));

    expect(openingCourses.map((course) => course.name)).toEqual(roadmapNames);
  });

  it('incluye repertorio para blancas y negras', () => {
    expect(openingCourses.filter((course) => course.side === 'blancas')).toHaveLength(6);
    expect(openingCourses.filter((course) => course.side === 'negras')).toHaveLength(5);
  });

  it('todas las líneas se reproducen con jugadas SAN legales', () => {
    openingCourses.forEach((course) => {
      expect(course.plan.length, course.name).toBeGreaterThanOrEqual(3);
      course.lines.forEach((line) => {
        const game = new Chess();
        expect(line.moves.length, line.id).toBeGreaterThanOrEqual(8);
        expect(line.keyIdeas.length, line.id).toBeGreaterThanOrEqual(3);

        line.moves.forEach((move, index) => {
          move.alternatives?.forEach((alternative) => {
            const branch = new Chess(game.fen());
            expect(branch.move(alternative.san, { strict: false }).san, `${line.id} alternativa ${alternative.san}`).toBe(alternative.san);
          });
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

  it('cada apertura incluye estructura, planes, errores, transición y partida modelo', () => {
    openingCourses.forEach((course) => {
      const lesson = openingLearning[course.id];
      expect(lesson, course.id).toBeDefined();
      expect(lesson.whitePlans).toHaveLength(3);
      expect(lesson.blackPlans).toHaveLength(3);
      expect(lesson.typicalErrors).toHaveLength(3);
      expect(lesson.quizzes.length).toBeGreaterThanOrEqual(2);
      expect(() => new Chess(lesson.referenceFen), course.id).not.toThrow();
      expect(lesson.modelGame.moves.length).toBeGreaterThan(40);
    });
  });

  it('reconoce una apertura importada y señala la primera desviación', () => {
    const recognition = recognizeOpeningFromPgn('1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. a3 *', openingCourses);

    expect(recognition?.courseId).toBe('italian');
    expect(recognition?.matchedPlies).toBeGreaterThanOrEqual(6);
    expect(recognition?.firstDeparture).toContain('a3');
    expect(recognition?.suggestedPlan.length).toBeGreaterThan(30);
  });
  it('estructura la Italiana como un mapa de decisiones con planes para ambos bandos', () => {
    const italian = openingCourses.find((course) => course.id === 'italian');

    expect(italian?.lines.map((line) => line.id)).toEqual([
      'italian-c3-d4',
      'italian-pianissimo',
      'italian-two-knights'
    ]);
    italian?.lines.forEach((line) => {
      expect(line.stage).toBeTruthy();
      expect(line.summary?.length).toBeGreaterThan(40);
      expect(line.whitePlan).toHaveLength(3);
      expect(line.blackPlan).toHaveLength(3);
    });
  });

  it('ofrece mapas legales de posiciones para las aperturas del Laboratorio', () => {
    ['italian', 'ruy-lopez', 'scotch'].forEach((courseId) => {
      const map = openingLearning[courseId].studyMap;

      expect(map, courseId).toHaveLength(3);
      expect(map?.some((item) => item.kind === 'posición esencial'), courseId).toBe(true);
      expect(map?.some((item) => item.kind === 'estructura típica'), courseId).toBe(true);
      map?.forEach((item) => {
        const game = new Chess(item.fen);
        expect(game.fen(), item.id).toBe(item.fen);
        expect(item.whitePlan.length, item.id).toBeGreaterThan(25);
        expect(item.blackPlan.length, item.id).toBeGreaterThan(25);
      });
    });
  });
});
