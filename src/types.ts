export type ExerciseCategory =
  | 'piezas colgadas'
  | 'amenazas del rival'
  | 'jaques, capturas y amenazas'
  | 'mate en 1'
  | 'mate en 2'
  | 'doble ataque'
  | 'clavada'
  | 'final de rey y peón'
  | 'desarrollo y enroque'
  | 'aperturas populares'
  | 'medio juego';

export interface Exercise {
  id: string;
  category: ExerciseCategory;
  difficulty: 1 | 2 | 3 | 4 | 5;
  fen: string;
  sideToMove: 'w' | 'b';
  question: string;
  expectedMove: string;
  acceptedMoves?: string[];
  explanation: string;
  practicalRule: string;
  hint?: string;
  tags?: string[];
  teachingPoint?: string;
  validation?: {
    threatenedMove?: string;
    prematureMove?: string;
    expectedOutcome?: 'prevents-mate' | 'prevents-capture' | 'wins-material' | 'improves-pawn-ending';
  };
}

export interface ScheduledReview {
  id: string;
  scheduledFor: string;
  completedAt?: string;
  result?: 'correct' | 'incorrect';
}

export interface ExerciseProgress {
  exerciseId: string;
  attempts: number;
  mistakes: number;
  lastPresentedAt?: string;
  lastResult?: 'correct' | 'incorrect';
  lastReviewCompletedAt?: string;
  pendingReviews: ScheduledReview[];
  completedReviews: ScheduledReview[];
}

export interface ExerciseAttempt {
  id: string;
  exerciseId: string;
  category: ExerciseCategory;
  difficulty: number;
  attemptKind: 'practice' | 'review' | 'diagnostic';
  reviewId?: string;
  correct: boolean;
  gaveUp?: boolean;
  seconds: number;
  date: string;
  pendingReviews: ScheduledReview[];
  completedReviews: ScheduledReview[];
}

export interface DiagnosticResult {
  id: string;
  date: string;
  total: number;
  correct: number;
  strengths: ExerciseCategory[];
  weaknesses: ExerciseCategory[];
  sevenDayPlan: string[];
}

export interface SavedGame {
  id: string;
  date: string;
  pgn: string;
  color: 'blancas' | 'negras' | 'sin indicar';
  result: string;
  opponent: string;
  link?: string;
  notes?: string;
  errors: GameError[];
}

export interface GameError {
  id: string;
  moveNumber: string;
  category: ExerciseCategory | 'otro';
  note: string;
  playedMove?: string;
  suggestedMove?: string;
  source?: 'manual' | 'automatic';
  severity?: 'imprecision' | 'error' | 'grave';
  evaluationLoss?: number;
  fenBefore?: string;
  fenAfter?: string;
  practiceAttempts?: number;
  practiceSuccesses?: number;
  lastPracticedAt?: string;
}

export interface CategoryStats {
  category: ExerciseCategory;
  total: number;
  correct: number;
  accuracy: number;
}

export type TrainingBlockId = 'repaso' | 'tacticas' | 'concepto' | 'final-apertura';

export type TargetLevel = '800-1000' | '1000-1200' | '1200-1400' | '1400+';

export type ChallengeMode = 'repaso' | 'equilibrado' | 'retos';

export interface TrainingPreferences {
  targetLevel: TargetLevel;
  challengeMode: ChallengeMode;
}

export interface TrainingBlock {
  id: TrainingBlockId;
  minutes: string;
  title: string;
  description: string;
  categories: ExerciseCategory[];
  targetExercises: number;
}

export interface TrainingSessionConfig {
  mode: 'single' | 'full';
  blockIds: TrainingBlockId[];
  preferences?: TrainingPreferences;
}

export interface TrainingDayProgress {
  date: string;
  completedBlockIds: TrainingBlockId[];
}

export interface OpeningMove {
  san: string;
  explanation: string;
}

export interface OpeningLine {
  id: string;
  name: string;
  moves: OpeningMove[];
  keyIdeas: string[];
}

export interface OpeningCourse {
  id: string;
  name: string;
  side: 'blancas' | 'negras';
  difficulty: 1 | 2 | 3 | 4 | 5;
  summary: string;
  plan: string[];
  lines: OpeningLine[];
}

export type ConceptGroup = 'Tácticas y movimientos clave' | 'Movimientos especiales y reglas' | 'Conceptos de la partida' | 'Finales';

export type ConceptValidation = 'check' | 'checkmate' | 'stalemate' | 'castle' | 'en-passant' | 'promotion';

export interface TacticalConceptExercise {
  fen: string;
  sideToMove: 'w' | 'b';
  question: string;
  expectedMove: string;
  acceptedMoves?: string[];
  explanation: string;
  validation?: ConceptValidation;
}

export interface TacticalConcept {
  id: string;
  group: ConceptGroup;
  name: string;
  definition: string;
  pattern: string;
  practicalRule: string;
  fen: string;
  sideToMove: 'w' | 'b';
  question: string;
  expectedMove: string;
  acceptedMoves?: string[];
  explanation: string;
  validation?: ConceptValidation;
  exercises?: TacticalConceptExercise[];
}
