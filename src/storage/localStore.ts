import type { ChallengeMode, DiagnosticResult, ExerciseAttempt, SavedGame, TargetLevel, TrainingDayProgress, TrainingBlockId, TrainingPreferences } from '../types';

const ATTEMPTS_KEY = 'epa_attempts_v2';
const LEGACY_ATTEMPTS_KEY = 'epa_attempts_v1';
const GAMES_KEY = 'epa_games_v1';
const DIAGNOSTIC_KEY = 'epa_diagnostic_v1';
const TRAINING_DAY_KEY = 'epa_training_day_v1';
const GAME_PREFERENCES_KEY = 'epa_game_preferences_v1';
const TRAINING_PREFERENCES_KEY = 'epa_training_preferences_v1';

export type GamePreferences = {
  showMoveHints: boolean;
};

const defaultGamePreferences: GamePreferences = {
  showMoveHints: true
};

export const defaultTrainingPreferences: TrainingPreferences = {
  targetLevel: '1200-1400',
  challengeMode: 'equilibrado'
};

const targetLevels: TargetLevel[] = ['800-1000', '1000-1200', '1200-1400', '1400+'];
const challengeModes: ChallengeMode[] = ['repaso', 'equilibrado', 'retos'];

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function loadAttempts(): ExerciseAttempt[] {
  const current = readAttemptsFromKey(ATTEMPTS_KEY, true);
  if (current) return current;

  const migrated = readAttemptsFromKey(LEGACY_ATTEMPTS_KEY, true);
  if (!migrated) return [];

  writeJson(ATTEMPTS_KEY, migrated);
  return migrated;
}

export function saveAttempt(attempt: ExerciseAttempt) {
  const attempts = loadAttempts();
  writeJson(ATTEMPTS_KEY, [attempt, ...attempts]);
}

function normalizeAttempt(attempt: ExerciseAttempt & { reviewDates?: string[] }): ExerciseAttempt {
  const date = typeof attempt.date === 'string' ? attempt.date : new Date().toISOString();
  return {
    ...attempt,
    attemptKind: attempt.attemptKind ?? 'practice',
    date,
    pendingReviews: normalizeReviews(attempt.pendingReviews, attempt.reviewDates),
    completedReviews: normalizeReviews(attempt.completedReviews)
  };
}

function readAttemptsFromKey(key: string, backupInvalid: boolean): ExerciseAttempt[] | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every(isAttemptLike)) {
      if (backupInvalid) backupAndReset(key, raw);
      return [];
    }
    return parsed.map(normalizeAttempt);
  } catch {
    return [];
  }
}

function isAttemptLike(value: unknown): value is ExerciseAttempt & { reviewDates?: string[] } {
  if (!value || typeof value !== 'object') return false;
  const attempt = value as Partial<ExerciseAttempt>;
  return (
    typeof attempt.id === 'string' &&
    typeof attempt.exerciseId === 'string' &&
    typeof attempt.category === 'string' &&
    typeof attempt.difficulty === 'number' &&
    typeof attempt.correct === 'boolean' &&
    typeof attempt.seconds === 'number' &&
    typeof attempt.date === 'string'
  );
}

function normalizeReviews(reviews?: unknown, legacyDates?: string[]) {
  if (Array.isArray(reviews)) {
    return reviews
      .filter((review): review is { id?: string; scheduledFor: string; completedAt?: string; result?: 'correct' | 'incorrect' } => {
        return Boolean(review) && typeof review === 'object' && typeof review.scheduledFor === 'string';
      })
      .map((review) => ({
        id: review.id ?? `review-${review.scheduledFor.slice(0, 10)}`,
        scheduledFor: review.scheduledFor,
        completedAt: review.completedAt,
        result: review.result
      }));
  }

  return (legacyDates ?? []).map((scheduledFor) => ({
    id: `review-${scheduledFor.slice(0, 10)}`,
    scheduledFor
  }));
}

function backupAndReset(key: string, raw: string) {
  const backupKey = `${key}_backup_${new Date().toISOString()}`;
  localStorage.setItem(backupKey, raw);
  localStorage.removeItem(key);
}

export function loadGames(): SavedGame[] {
  return readJson<SavedGame[]>(GAMES_KEY, []);
}

export function saveGame(game: SavedGame) {
  const games = loadGames();
  writeJson(GAMES_KEY, [game, ...games]);
}

export function updateGame(updatedGame: SavedGame) {
  const games = loadGames().map((game) => (game.id === updatedGame.id ? updatedGame : game));
  writeJson(GAMES_KEY, games);
}

export function loadGamePreferences(): GamePreferences {
  const stored = readJson<Partial<GamePreferences> | null>(GAME_PREFERENCES_KEY, null);
  return {
    showMoveHints: typeof stored?.showMoveHints === 'boolean' ? stored.showMoveHints : defaultGamePreferences.showMoveHints
  };
}

export function saveGamePreferences(preferences: GamePreferences) {
  writeJson(GAME_PREFERENCES_KEY, preferences);
}

export function loadTrainingPreferences(): TrainingPreferences {
  const stored = readJson<Partial<TrainingPreferences> | null>(TRAINING_PREFERENCES_KEY, null);
  return {
    targetLevel: targetLevels.includes(stored?.targetLevel as TargetLevel) ? (stored?.targetLevel as TargetLevel) : defaultTrainingPreferences.targetLevel,
    challengeMode: challengeModes.includes(stored?.challengeMode as ChallengeMode)
      ? (stored?.challengeMode as ChallengeMode)
      : defaultTrainingPreferences.challengeMode
  };
}

export function saveTrainingPreferences(preferences: TrainingPreferences) {
  writeJson(TRAINING_PREFERENCES_KEY, preferences);
}

export function loadDiagnosticResult(): DiagnosticResult | null {
  return readJson<DiagnosticResult | null>(DIAGNOSTIC_KEY, null);
}

export function saveDiagnosticResult(result: DiagnosticResult) {
  writeJson(DIAGNOSTIC_KEY, result);
}

export function loadTrainingDayProgress(today = new Date()): TrainingDayProgress {
  const date = localDateKey(today);
  const stored = readJson<TrainingDayProgress | null>(TRAINING_DAY_KEY, null);
  if (!stored || stored.date !== date || !Array.isArray(stored.completedBlockIds)) {
    return { date, completedBlockIds: [] };
  }
  return stored;
}

export function markTrainingBlockCompleted(blockId: TrainingBlockId, today = new Date()): TrainingDayProgress {
  const current = loadTrainingDayProgress(today);
  const completedBlockIds = current.completedBlockIds.includes(blockId) ? current.completedBlockIds : [...current.completedBlockIds, blockId];
  const updated = { ...current, completedBlockIds };
  writeJson(TRAINING_DAY_KEY, updated);
  return updated;
}
