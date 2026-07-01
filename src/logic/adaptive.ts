import type { CategoryStats, Exercise, ExerciseAttempt, ExerciseCategory, ExerciseProgress, ScheduledReview } from '../types';

export type SelectNextExerciseOptions = {
  today?: Date;
  seenExerciseIds?: string[];
  shownFens?: string[];
  random?: () => number;
};

export type CreateExerciseAttemptOptions = {
  gaveUp?: boolean;
  date?: Date;
  previousAttempts?: ExerciseAttempt[];
  attemptKind?: ExerciseAttempt['attemptKind'];
  reviewId?: string;
};

const REVIEW_OFFSETS = [1, 3, 7] as const;

export function getCategoryStats(attempts: ExerciseAttempt[]): CategoryStats[] {
  const grouped = new Map<ExerciseCategory, { total: number; correct: number }>();

  attempts.forEach((attempt) => {
    const current = grouped.get(attempt.category) ?? { total: 0, correct: 0 };
    grouped.set(attempt.category, {
      total: current.total + 1,
      correct: current.correct + (attempt.correct ? 1 : 0)
    });
  });

  return Array.from(grouped.entries()).map(([category, values]) => ({
    category,
    total: values.total,
    correct: values.correct,
    accuracy: values.total === 0 ? 0 : Math.round((values.correct / values.total) * 100)
  }));
}

export function getAccuracyForCategory(attempts: ExerciseAttempt[], category: ExerciseCategory): number | null {
  const relevant = attempts.filter((attempt) => attempt.category === category);
  if (relevant.length === 0) return null;
  const correct = relevant.filter((attempt) => attempt.correct).length;
  return correct / relevant.length;
}

export function getAllowedDifficulty(attempts: ExerciseAttempt[], category: ExerciseCategory): number {
  const categoryAttempts = attempts
    .filter((attempt) => attempt.category === category && attempt.attemptKind !== 'diagnostic')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let consolidatedLevel = getOverallMasteryFloor(attempts);

  while (consolidatedLevel < 5) {
    const currentLevelAttempts = categoryAttempts.filter((attempt) => attempt.difficulty === consolidatedLevel);
    if (currentLevelAttempts.length < 8) break;
    const accuracy = currentLevelAttempts.filter((attempt) => attempt.correct).length / currentLevelAttempts.length;
    if (accuracy < 0.75) break;
    consolidatedLevel += 1;
  }

  const recent = categoryAttempts.slice(-3);
  const recentFailures = categoryAttempts.slice(-2);
  if (recentFailures.length === 2 && recentFailures.every((attempt) => !attempt.correct)) {
    return Math.max(1, consolidatedLevel - 1);
  }

  if (
    consolidatedLevel < 5 &&
    recent.length === 3 &&
    recent.every((attempt) => attempt.correct && attempt.difficulty >= consolidatedLevel)
  ) {
    return consolidatedLevel + 1;
  }

  return consolidatedLevel;
}

export function getOverallMasteryFloor(attempts: ExerciseAttempt[]): number {
  const practiceAttempts = attempts
    .filter((attempt) => attempt.attemptKind !== 'diagnostic')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const total = practiceAttempts.length;
  if (total < 12) return 1;

  const correct = practiceAttempts.filter((attempt) => attempt.correct).length;
  const accuracy = correct / total;
  const recent = practiceAttempts.slice(-6);
  const recentAccuracy = recent.length === 0 ? 0 : recent.filter((attempt) => attempt.correct).length / recent.length;
  const recentFailures = practiceAttempts.slice(-2);
  if (recentFailures.length === 2 && recentFailures.every((attempt) => !attempt.correct)) return 1;

  if (total >= 60 && accuracy >= 0.9 && recentAccuracy >= 0.83) return 4;
  if (total >= 30 && accuracy >= 0.88 && recentAccuracy >= 0.83) return 3;
  if (accuracy >= 0.85 && recentAccuracy >= 0.75) return 2;
  return 1;
}

export function getExerciseProgress(exerciseId: string, attempts: ExerciseAttempt[]): ExerciseProgress {
  const relevant = attempts
    .filter((attempt) => attempt.exerciseId === exerciseId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return relevant.reduce<ExerciseProgress>(
    (progress, attempt) => {
      return recordAttemptProgress(progress, attempt.correct, new Date(attempt.date), {
        attemptKind: attempt.attemptKind,
        reviewId: attempt.reviewId
      });
    },
    {
      exerciseId,
      attempts: 0,
      mistakes: 0,
      pendingReviews: [],
      completedReviews: []
    }
  );
}

export function recordAttemptProgress(
  progress: ExerciseProgress,
  correct: boolean,
  when = new Date(),
  options: Pick<CreateExerciseAttemptOptions, 'attemptKind' | 'reviewId'> = {}
): ExerciseProgress {
  const presentedAt = when.toISOString();
  const base: ExerciseProgress = {
    ...progress,
    attempts: progress.attempts + 1,
    mistakes: progress.mistakes + (correct ? 0 : 1),
    lastPresentedAt: presentedAt,
    lastResult: correct ? 'correct' : 'incorrect',
    pendingReviews: [...progress.pendingReviews],
    completedReviews: [...progress.completedReviews]
  };

  if (!correct) {
    return {
      ...base,
      pendingReviews: buildReviewSchedule(when),
      completedReviews: base.completedReviews
    };
  }

  if (options.attemptKind !== 'review' || !options.reviewId) return base;

  const reviewIndex = base.pendingReviews.findIndex(
    (review) => review.id === options.reviewId && isSameOrBefore(review.scheduledFor, when)
  );
  if (reviewIndex < 0) return base;

  const completed = base.pendingReviews[reviewIndex];
  return {
    ...base,
    lastReviewCompletedAt: presentedAt,
    pendingReviews: base.pendingReviews.filter((_, index) => index !== reviewIndex),
    completedReviews: [
      ...base.completedReviews,
      {
        ...completed,
        completedAt: presentedAt,
        result: 'correct'
      }
    ]
  };
}

export function buildReviewSchedule(from = new Date()): ScheduledReview[] {
  const seenDays = new Set<string>();
  return REVIEW_OFFSETS.map((days) => {
    const date = new Date(from);
    date.setDate(date.getDate() + days);
    const scheduledFor = date.toISOString();
    const dayKey = scheduledFor.slice(0, 10);
    if (seenDays.has(dayKey)) return null;
    seenDays.add(dayKey);
    return { id: `review-${dayKey}`, scheduledFor };
  }).filter((review): review is ScheduledReview => Boolean(review));
}

export function buildReviewDates(from = new Date()): string[] {
  return buildReviewSchedule(from).map((review) => review.scheduledFor);
}

export function createExerciseAttempt(exercise: Exercise, correct: boolean, seconds: number, options: CreateExerciseAttemptOptions = {}): ExerciseAttempt {
  const date = options.date ?? new Date();
  const attemptKind = options.attemptKind ?? 'practice';
  const previousProgress = getExerciseProgress(exercise.id, options.previousAttempts ?? []);
  const progress = recordAttemptProgress(previousProgress, correct, date, { attemptKind, reviewId: options.reviewId });

  return {
    id: crypto.randomUUID(),
    exerciseId: exercise.id,
    category: exercise.category,
    difficulty: exercise.difficulty,
    attemptKind,
    reviewId: options.reviewId,
    correct,
    gaveUp: options.gaveUp,
    seconds,
    date: date.toISOString(),
    pendingReviews: progress.pendingReviews,
    completedReviews: progress.completedReviews
  };
}

export function getExerciseWeight(exercise: Exercise, attempts: ExerciseAttempt[], today = new Date()): number {
  const accuracy = getAccuracyForCategory(attempts, exercise.category);
  const progress = getExerciseProgress(exercise.id, attempts);
  const masteryFloor = getOverallMasteryFloor(attempts);
  let weight = 10 + getCategoryPriority(exercise.category);

  if (accuracy === null) weight += 4;
  else if (accuracy < 0.6) weight += 12;
  else if (accuracy <= 0.8) weight += 5;
  else weight += 1;

  const dueReviews = progress.pendingReviews.filter((review) => isSameOrBefore(review.scheduledFor, today));
  weight += dueReviews.length * (12 + getCategoryPriority(exercise.category));

  if (progress.lastPresentedAt) {
    const daysSincePresented = daysBetween(new Date(progress.lastPresentedAt), today);
    if (daysSincePresented < 1) weight -= 10;
    else if (daysSincePresented < 3) weight -= 7;
    else if (daysSincePresented < 7) weight -= 4;
  }

  if (
    progress.pendingReviews.length === 0 &&
    progress.completedReviews.filter((review) => review.result === 'correct').length >= REVIEW_OFFSETS.length &&
    progress.lastResult === 'correct'
  ) {
    weight -= 8;
  }

  if (masteryFloor > 1) {
    weight += exercise.difficulty * 3;
    if (exercise.difficulty < masteryFloor) weight -= (masteryFloor - exercise.difficulty) * 6;
  }

  return Math.max(1, weight);
}

export function getCategoryPriority(category: ExerciseCategory): number {
  if (category === 'piezas colgadas') return 7;
  if (category === 'amenazas del rival') return 6;
  if (category === 'jaques, capturas y amenazas') return 5;
  if (category === 'mate en 1') return 4;
  if (category === 'aperturas populares') return 4;
  if (category === 'medio juego') return 4;
  if (category === 'desarrollo y enroque') return 3;
  if (category === 'final de rey y peón') return 2;
  return 1;
}

export function selectNextExercise(
  exercises: Exercise[],
  attempts: ExerciseAttempt[],
  optionsOrToday: SelectNextExerciseOptions | Date = {}
): Exercise | null {
  const options: SelectNextExerciseOptions = optionsOrToday instanceof Date ? { today: optionsOrToday } : optionsOrToday;
  const today = options.today ?? new Date();
  const seenExerciseIds = new Set(options.seenExerciseIds ?? []);
  const shownFens = new Set((options.shownFens ?? []).map(normalizeFenForSession));
  const random = options.random ?? Math.random;
  const eligible = exercises.filter(
    (exercise) =>
      !seenExerciseIds.has(exercise.id) &&
      !shownFens.has(normalizeFenForSession(exercise.fen)) &&
      exercise.difficulty <= getAllowedDifficulty(attempts, exercise.category)
  );

  if (eligible.length === 0) return null;

  const pool = eligible
    .map((exercise) => ({ exercise, weight: getExerciseWeight(exercise, attempts, today) }))
    .sort((a, b) => {
      const difference = b.weight - a.weight;
      return difference !== 0 ? difference : a.exercise.id.localeCompare(b.exercise.id);
    })
    .slice(0, 12);

  const total = pool.reduce((sum, item) => sum + item.weight, 0);
  let target = random() * total;
  for (const item of pool) {
    target -= item.weight;
    if (target <= 0) return item.exercise;
  }

  return pool[pool.length - 1]?.exercise ?? null;
}

export function getDueReviewForExercise(exerciseId: string, attempts: ExerciseAttempt[], today = new Date()): ScheduledReview | null {
  return (
    getExerciseProgress(exerciseId, attempts)
      .pendingReviews.filter((review) => isSameOrBefore(review.scheduledFor, today))
      .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())[0] ?? null
  );
}

export function normalizeFenForSession(fen: string): string {
  return fen.split(' ').slice(0, 4).join(' ');
}

function isSameOrBefore(date: string, today: Date): boolean {
  return new Date(date).getTime() <= today.getTime();
}

function daysBetween(previous: Date, current: Date): number {
  return (current.getTime() - previous.getTime()) / 86_400_000;
}
