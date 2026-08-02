import { Chess } from 'chess.js';
import type { OpeningAttempt, OpeningCourse, OpeningRecognition } from '../types';
import { openingLearning } from '../data/openingLearning';

export function getRecommendedOpening(courses: OpeningCourse[], attempts: OpeningAttempt[]): OpeningCourse | null {
  if (courses.length === 0) return null;
  const scores = courses.map((course) => {
    const relevant = attempts.filter((attempt) => attempt.courseId === course.id);
    const failures = relevant.filter((attempt) => !attempt.correct).length;
    const successes = relevant.filter((attempt) => attempt.correct).length;
    const lastDate = relevant.map((attempt) => new Date(attempt.date).getTime()).sort((a, b) => b - a)[0] ?? 0;
    return { course, score: relevant.length === 0 ? 20 : failures * 8 - successes * 2 - lastDate / 1e13 };
  });
  return scores.sort((a, b) => b.score - a.score || a.course.difficulty - b.course.difficulty)[0]?.course ?? null;
}

export function getOpeningWeakMotifs(attempts: OpeningAttempt[]): { motif: string; mistakes: number }[] {
  const grouped = new Map<string, number>();
  attempts.filter((attempt) => !attempt.correct).forEach((attempt) => {
    attempt.motifs.forEach((motif) => grouped.set(motif, (grouped.get(motif) ?? 0) + 1));
  });
  return [...grouped.entries()].map(([motif, mistakes]) => ({ motif, mistakes })).sort((a, b) => b.mistakes - a.mistakes);
}

export function getWeeklyOpeningStep(day = new Date().getDay()): string {
  const steps = [
    'Repaso visual y resumen de bolsillo.',
    'Línea principal e idea de cada jugada.',
    'Estructura de peones y planes de ambos bandos.',
    'Mini ejercicios sin consultar la solución.',
    'Partida modelo y transición al medio juego.',
    'Partida lenta intentando reconocer la estructura.',
    'Analiza dónde dejaste de comprender la posición.'
  ];
  return steps[day];
}

export function recognizeOpeningFromPgn(pgn: string, courses: OpeningCourse[]): OpeningRecognition | null {
  const game = new Chess();
  try {
    game.loadPgn(pgn);
  } catch {
    return null;
  }
  const played = game.history();
  const matches: { course: OpeningCourse; matchedPlies: number; expected?: string; played?: string }[] = [];

  courses.forEach((course) => course.lines.forEach((line) => {
    let matchedPlies = 0;
    while (matchedPlies < played.length && matchedPlies < line.moves.length && sameSan(played[matchedPlies], line.moves[matchedPlies].san)) matchedPlies += 1;
    matches.push({ course, matchedPlies, expected: line.moves[matchedPlies]?.san, played: played[matchedPlies] });
  }));

  const selected = matches.sort((a, b) => b.matchedPlies - a.matchedPlies)[0];
  if (!selected || selected.matchedPlies < 2) return null;
  const learning = openingLearning[selected.course.id];
  return {
    courseId: selected.course.id,
    courseName: selected.course.name,
    matchedPlies: selected.matchedPlies,
    firstDeparture: selected.expected && selected.played ? `${selected.played} en lugar de ${selected.expected}` : undefined,
    suggestedPlan: learning?.pocketSummary ?? selected.course.plan[0]
  };
}
function sameSan(left: string, right: string): boolean {
  return left.replace(/[+#x=\s]/g, '').toLowerCase() === right.replace(/[+#x=\s]/g, '').toLowerCase();
}