import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Chess, type Square } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { ArrowRight, Check, Flag, HelpCircle, Lightbulb, RotateCcw, X } from 'lucide-react';
import SectionHeader from '../components/SectionHeader';
import { getTrainingBlock } from '../data/trainingPlan';
import { createExerciseAttempt, getDueReviewForExercise, selectNextExercise } from '../logic/adaptive';
import { boardMoveToSan, kingInCheckSquare, legalDestinations } from '../logic/boardMove';
import { boardNotationOptions } from '../logic/boardStyle';
import { formatCategoryLabel } from '../logic/labels';
import { saveAttempt } from '../storage/localStore';
import type { Exercise, ExerciseAttempt, TrainingBlockId, TrainingSessionConfig } from '../types';

interface ExercisesScreenProps {
  exercises: Exercise[];
  attempts: ExerciseAttempt[];
  session?: TrainingSessionConfig;
  onAttemptSaved: () => void;
  onBlockCompleted?: (blockId: TrainingBlockId) => void;
  onSessionFinished?: () => void;
}

type Feedback = {
  correct: boolean;
  playedMove: string;
};

export default function ExercisesScreen({ exercises, attempts, session, onAttemptSaved, onBlockCompleted, onSessionFinished }: ExercisesScreenProps) {
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [blockProgress, setBlockProgress] = useState<Record<string, number>>({});
  const [currentExerciseId, setCurrentExerciseId] = useState<string | null>(() => selectExerciseForSession(exercises, attempts, session, 0)?.id ?? null);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [manualMove, setManualMove] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [sessionAttempts, setSessionAttempts] = useState<ExerciseAttempt[]>([]);
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  const [position, setPosition] = useState(exercises.find((exercise) => exercise.id === currentExerciseId)?.fen ?? exercises[0]?.fen ?? 'start');
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [illegalMessage, setIllegalMessage] = useState('');

  const activeBlockId = session?.blockIds[currentBlockIndex] ?? null;
  const activeBlock = activeBlockId ? getTrainingBlock(activeBlockId) : null;
  const activeBlockDone = activeBlock ? (blockProgress[activeBlock.id] ?? 0) : 0;
  const sessionTotal = session?.blockIds.reduce((sum, blockId) => sum + getTrainingBlock(blockId).targetExercises, 0) ?? 0;
  const sessionDone = session?.blockIds.reduce((sum, blockId) => sum + (blockProgress[blockId] ?? 0), 0) ?? sessionAttempts.length;
  const exercisePool = activeBlock ? exercises.filter((item) => activeBlock.categories.includes(item.category)) : exercises;

  const exercise = useMemo(
    () => exercises.find((item) => item.id === currentExerciseId) ?? null,
    [currentExerciseId, exercises]
  );
  const allAttempts = [...attempts, ...sessionAttempts];
  const dueReview = exercise ? getDueReviewForExercise(exercise.id, allAttempts) : null;
  const displayedFeedbackCorrect = Boolean(feedback && exercise && (feedback.correct || isAcceptedMove(feedback.playedMove, exercise)));

  useEffect(() => {
    setCurrentBlockIndex(0);
    setBlockProgress({});
    setSessionAttempts([]);
    setShowSessionSummary(false);
    const selected = selectExerciseForSession(exercises, attempts, session, 0);
    setCurrentExerciseId(selected?.id ?? null);
    setPosition(selected?.fen ?? exercises[0]?.fen ?? 'start');
    setFeedback(null);
    setManualMove('');
    setShowHint(false);
    setSelectedSquare(null);
    setLastMove(null);
    setIllegalMessage('');
    setStartedAt(Date.now());
  }, [session, exercises]);

  const submitMove = (moveText: string, gaveUp = false) => {
    if (feedback || !exercise) return;
    const game = new Chess(exercise.fen);
    const normalized = moveText.trim();
    let san = gaveUp ? 'No lo sé' : normalized;

    if (!gaveUp) {
      try {
        const move = game.move(normalized, { strict: false });
        san = move.san;
        setPosition(game.fen());
        setLastMove({ from: move.from, to: move.to });
        setSelectedSquare(null);
        setIllegalMessage('');
      } catch {
        san = normalized;
      }
    }

    const correct = !gaveUp && isAcceptedMove(san, exercise);
    const attempt = createExerciseAttempt(exercise, correct, Math.max(1, Math.round((Date.now() - startedAt) / 1000)), {
      gaveUp,
      previousAttempts: allAttempts,
      attemptKind: dueReview ? 'review' : 'practice',
      reviewId: dueReview?.id
    });

    saveAttempt(attempt);
    setSessionAttempts((current) => [attempt, ...current]);
    recordBlockProgress();
    setFeedback({ correct, playedMove: san });
    onAttemptSaved();
  };

  const submitBoardMove = (from: string, to: string) => {
    if (feedback || !exercise) return false;
    if (from === to) return false;
    const result = boardMoveToSan(exercise.fen, from, to);
    if (!result) {
      setIllegalMessage('Esa pieza no puede ir ahí en esta posición.');
      return false;
    }

    const correct = isAcceptedMove(result.san, exercise);
    const attempt = createExerciseAttempt(exercise, correct, Math.max(1, Math.round((Date.now() - startedAt) / 1000)), {
      previousAttempts: allAttempts,
      attemptKind: dueReview ? 'review' : 'practice',
      reviewId: dueReview?.id
    });

    setPosition(result.fen);
    setLastMove({ from: result.from, to: result.to });
    setSelectedSquare(null);
    setIllegalMessage('');
    saveAttempt(attempt);
    setSessionAttempts((current) => [attempt, ...current]);
    recordBlockProgress();
    setFeedback({ correct, playedMove: result.san });
    onAttemptSaved();
    return true;
  };

  const recordBlockProgress = () => {
    if (!activeBlock) return;
    setBlockProgress((current) => ({
      ...current,
      [activeBlock.id]: Math.min(activeBlock.targetExercises, (current[activeBlock.id] ?? 0) + 1)
    }));
  };

  const handlePieceDrop = ({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }) => {
    if (!targetSquare) return false;
    if (sourceSquare === targetSquare) return false;
    return submitBoardMove(sourceSquare, targetSquare);
  };

  const handleSquareClick = ({ square }: { square: string }) => {
    if (!exercise || feedback) return;
    const game = new Chess(exercise.fen);
    const clickedPiece = game.get(square as Square);

    if (!selectedSquare) {
      if (clickedPiece?.color === exercise.sideToMove) {
        setSelectedSquare(square);
        setIllegalMessage('');
      }
      return;
    }

    if (selectedSquare === square) {
      setSelectedSquare(null);
      setIllegalMessage('');
      return;
    }

    if (clickedPiece?.color === exercise.sideToMove) {
      setSelectedSquare(square);
      setIllegalMessage('');
      return;
    }

    if (submitBoardMove(selectedSquare, square)) return;
  };

  const nextExercise = () => {
    if (!exercise) return;
    if (activeBlock) {
      const blockComplete = activeBlockDone >= activeBlock.targetExercises;
      if (blockComplete) {
        onBlockCompleted?.(activeBlock.id);
        const nextBlockIndex = currentBlockIndex + 1;
        if (!session || nextBlockIndex >= session.blockIds.length) {
          if (session) {
            onSessionFinished?.();
            return;
          }
          setShowSessionSummary(true);
          setCurrentExerciseId(null);
          return;
        }

        const selected = selectExerciseForSession(exercises, allAttempts, session, nextBlockIndex, {
          seenExerciseIds: [exercise.id, ...sessionAttempts.map((attempt) => attempt.exerciseId)],
          shownFens: [
            exercise.fen,
            ...sessionAttempts
              .map((attempt) => exercises.find((item) => item.id === attempt.exerciseId)?.fen)
              .filter((fen): fen is string => Boolean(fen))
          ]
        });
        setCurrentBlockIndex(nextBlockIndex);
        loadExercise(selected);
        return;
      }
    }

    const seenExerciseIds = [exercise.id, ...sessionAttempts.map((attempt) => attempt.exerciseId)];
    const shownFens = [
      exercise.fen,
      ...sessionAttempts
        .map((attempt) => exercises.find((item) => item.id === attempt.exerciseId)?.fen)
        .filter((fen): fen is string => Boolean(fen))
    ];
    const selected = selectNextExercise(exercisePool, allAttempts, { today: new Date(Date.now() + 1000), seenExerciseIds, shownFens });
    if (!selected) {
      setShowSessionSummary(true);
      setCurrentExerciseId(null);
      return;
    }
    loadExercise(selected);
  };

  const loadExercise = (selected: Exercise | null) => {
    if (!selected) {
      if (session) {
        onSessionFinished?.();
        return;
      }
      setShowSessionSummary(true);
      setCurrentExerciseId(null);
      return;
    }
    setCurrentExerciseId(selected.id);
    setStartedAt(Date.now());
    setFeedback(null);
    setManualMove('');
    setShowHint(false);
    setPosition(selected.fen);
    setSelectedSquare(null);
    setLastMove(null);
    setIllegalMessage('');
  };

  const resetBoard = () => {
    setFeedback(null);
    setManualMove('');
    setShowHint(false);
    setSelectedSquare(null);
    setLastMove(null);
    setIllegalMessage('');
    if (!exercise) return;
    setPosition(exercise.fen);
    setStartedAt(Date.now());
  };

  if (showSessionSummary) {
    return (
      <SessionSummary
        attempts={sessionAttempts}
        onContinue={() => setShowSessionSummary(false)}
        onNewSession={() => {
          setSessionAttempts([]);
          setShowSessionSummary(false);
          const selected = selectNextExercise(exercises, attempts);
          setCurrentExerciseId(selected?.id ?? null);
          setPosition(selected?.fen ?? exercises[0]?.fen ?? 'start');
          setFeedback(null);
          setManualMove('');
          setShowHint(false);
          setSelectedSquare(null);
          setLastMove(null);
          setIllegalMessage('');
          setStartedAt(Date.now());
        }}
      />
    );
  }

  if (!exercise) {
    return <SessionSummary attempts={sessionAttempts} completed onContinue={() => setShowSessionSummary(true)} onNewSession={() => setSessionAttempts([])} />;
  }

  return (
    <section>
      <SectionHeader
        eyebrow={activeBlock ? `Bloque ${currentBlockIndex + 1}/${session?.blockIds.length ?? 1}` : 'Ejercicios'}
        title={activeBlock ? activeBlock.description : 'Piensa primero, mueve después'}
        description={
          activeBlock
            ? `Progreso: ${sessionDone}/${sessionTotal} ejercicios. En este bloque: ${activeBlockDone}/${activeBlock.targetExercises}.`
            : 'Antes de responder, revisa la lista visual y busca una razón sencilla para tu jugada.'
        }
      />
      {activeBlock ? (
        <div className="training-progress-panel">
          {session?.blockIds.map((blockId, index) => {
            const block = getTrainingBlock(blockId);
            const done = blockProgress[blockId] ?? 0;
            const isActive = index === currentBlockIndex;
            return (
              <div className={isActive ? 'training-step active' : done >= block.targetExercises ? 'training-step done' : 'training-step'} key={blockId}>
                <span>{index + 1}</span>
                <strong>{block.title}</strong>
                <small>
                  {done}/{block.targetExercises}
                </small>
              </div>
            );
          })}
        </div>
      ) : null}
      <div className="exercise-layout">
        <div className="board-panel">
          <Chessboard
            options={{
              position,
              onPieceDrop: handlePieceDrop,
              onSquareClick: handleSquareClick,
              squareStyles: buildSquareStyles(exercise.fen, selectedSquare, lastMove),
              boardStyle: {
                width: 'min(100%, 520px)',
                borderRadius: '8px',
                boxShadow: '0 16px 40px rgba(30, 41, 59, 0.16)'
              },
              darkSquareStyle: { backgroundColor: '#77906f' },
              lightSquareStyle: { backgroundColor: '#eef0d8' },
              ...boardNotationOptions
            }}
          />
          {illegalMessage ? <p className="board-message">{illegalMessage}</p> : null}
        </div>
        <aside className="exercise-panel">
          <div className="tag-row exercise-meta">
            <span>{formatCategoryLabel(exercise.category)}</span>
            {dueReview ? <span>Repaso programado</span> : null}
            <span>Dificultad {exercise.difficulty}/5</span>
            <span>Juegan {sideLabel(exercise.sideToMove)}</span>
          </div>
          <h2>{exercise.question}</h2>
          <div className="pre-move-checklist compact-checklist" aria-label="Recordatorio antes de responder">
            <strong>Antes de mover</strong>
            <span>Amenaza rival</span>
            <span>Jaques</span>
            <span>Capturas</span>
            <span>Amenazas</span>
            <span>Piezas indefensas</span>
          </div>
          <form
            className="move-form"
            onSubmit={(event) => {
              event.preventDefault();
              submitMove(manualMove);
            }}
          >
            <label htmlFor="move">Escribir jugada</label>
            <div>
              <input
                id="move"
                placeholder="Opcional: Qxf7# o e4"
                value={manualMove}
                onChange={(event) => setManualMove(event.target.value)}
                disabled={Boolean(feedback)}
              />
              <button className="secondary-button" type="submit" disabled={!manualMove.trim() || Boolean(feedback)}>
                <Check size={18} />
                Comprobar
              </button>
            </div>
          </form>
          <div className="action-row">
            <button className="secondary-button" onClick={() => setShowHint((value) => !value)} type="button" disabled={Boolean(feedback)}>
              <Lightbulb size={18} />
              Ver pista
            </button>
            <button className="ghost-button" onClick={() => submitMove('', true)} type="button" disabled={Boolean(feedback)}>
              <HelpCircle size={18} />
              No lo sé
            </button>
          </div>
          {showHint && !feedback ? <p className="hint-reveal">{exercise.hint}</p> : null}
          {feedback ? (
            <div className={displayedFeedbackCorrect ? 'feedback correct' : 'feedback wrong'}>
              <strong>
                {displayedFeedbackCorrect ? <Check size={20} /> : <X size={20} />}
                {displayedFeedbackCorrect ? 'Correcto' : 'Incorrecto'}
              </strong>
              <p>Tu jugada: {feedback.playedMove}. Respuesta esperada: {exercise.expectedMove}.</p>
              <p>{exercise.explanation}</p>
              <p>
                <HelpCircle size={18} />
                {exercise.practicalRule}
              </p>
              <div className="feedback-actions">
                <button className="primary-button" onClick={nextExercise} type="button">
                  <ArrowRight size={20} />
                  Siguiente ejercicio
                </button>
              </div>
            </div>
          ) : (
            <p className="hint-box compact-note">Elige una jugada solo cuando puedas explicar qué resuelve o qué gana.</p>
          )}
          <div className="action-row">
            <button className="ghost-button" onClick={resetBoard} type="button">
              <RotateCcw size={18} />
              Reiniciar posición
            </button>
            <button className="ghost-button" onClick={() => setShowSessionSummary(true)} type="button" disabled={sessionAttempts.length === 0}>
              <Flag size={18} />
              Finalizar sesión
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}

function normalizeMove(move: string): string {
  return move.replace(/[+#x=\s]/g, '').toLowerCase();
}

function isAcceptedMove(move: string, exercise: Exercise): boolean {
  return [exercise.expectedMove, ...(exercise.acceptedMoves ?? [])].some((acceptedMove) => normalizeMove(move) === normalizeMove(acceptedMove));
}

function sideLabel(side: Exercise['sideToMove']): string {
  return side === 'w' ? 'blancas' : 'negras';
}

function selectExerciseForSession(
  exercises: Exercise[],
  attempts: ExerciseAttempt[],
  session: TrainingSessionConfig | undefined,
  blockIndex: number,
  options: { seenExerciseIds?: string[]; shownFens?: string[] } = {}
): Exercise | null {
  if (!session) return selectNextExercise(exercises, attempts, options);
  const blockId = session.blockIds[blockIndex];
  if (!blockId) return null;
  const block = getTrainingBlock(blockId);
  const pool = exercises.filter((exercise) => block.categories.includes(exercise.category));
  return selectNextExercise(pool, attempts, { ...options, today: new Date(Date.now() + 1000) });
}

function buildSquareStyles(fen: string, selectedSquare: string | null, lastMove: { from: string; to: string } | null): Record<string, CSSProperties> {
  const styles: Record<string, CSSProperties> = {};

  if (lastMove) {
    styles[lastMove.from] = { background: 'rgba(250, 204, 21, 0.38)' };
    styles[lastMove.to] = { background: 'rgba(250, 204, 21, 0.52)' };
  }

  if (selectedSquare) {
    styles[selectedSquare] = { ...(styles[selectedSquare] ?? {}), boxShadow: 'inset 0 0 0 4px #2563eb' };
    legalDestinations(fen, selectedSquare).forEach((square) => {
      styles[square] = {
        ...(styles[square] ?? {}),
        background: 'radial-gradient(circle, rgba(37, 99, 235, 0.42) 22%, transparent 24%)'
      };
    });
  }

  const checkSquare = kingInCheckSquare(fen);
  if (checkSquare) {
    styles[checkSquare] = { ...(styles[checkSquare] ?? {}), boxShadow: 'inset 0 0 0 4px #dc2626' };
  }

  return styles;
}

function SessionSummary({
  attempts,
  completed = false,
  onContinue,
  onNewSession
}: {
  attempts: ExerciseAttempt[];
  completed?: boolean;
  onContinue: () => void;
  onNewSession: () => void;
}) {
  const correct = attempts.filter((attempt) => attempt.correct).length;
  const mainErrors = attempts
    .filter((attempt) => !attempt.correct)
    .reduce<Record<string, number>>((acc, attempt) => {
      acc[attempt.category] = (acc[attempt.category] ?? 0) + 1;
      return acc;
    }, {});
  const topError = Object.entries(mainErrors).sort((a, b) => b[1] - a[1])[0];
  const nextRule = getRuleForCategory(topError?.[0]);

  return (
    <section>
      <SectionHeader
        eyebrow="Final de sesión"
        title={completed ? 'Sesión completada' : 'Resumen claro para la próxima partida'}
        description="Quédate con una sola idea práctica. Eso ayuda más que memorizar muchas variantes."
      />
      <div className="session-summary">
        <article className="stat-card">
          <Check size={24} />
          <span>Aciertos</span>
          <strong>
            {correct}/{attempts.length}
          </strong>
        </article>
        <article className="summary-card">
          <h2>Errores principales</h2>
          <p>{topError ? `${formatCategoryLabel(topError[0])}: ${topError[1]} revisión${topError[1] === 1 ? '' : 'es'}.` : 'No hubo errores en esta sesión.'}</p>
        </article>
        <article className="summary-card">
          <h2>Regla para tu siguiente partida</h2>
          <p>{nextRule}</p>
        </article>
        <article className="summary-card">
          <h2>Tema recomendado para mañana</h2>
          <p>{topError ? formatCategoryLabel(topError[0]) : 'Repaso suave de Amenazas del rival y Piezas indefensas.'}</p>
        </article>
      </div>
      <div className="action-row">
        <button className="primary-button" onClick={onContinue} type="button">
          <ArrowRight size={20} />
          Seguir entrenando
        </button>
        <button className="secondary-button" onClick={onNewSession} type="button">
          <RotateCcw size={18} />
          Nueva sesión
        </button>
      </div>
    </section>
  );
}

function getRuleForCategory(category?: string): string {
  if (category === 'piezas colgadas') return 'Antes de mover, revisa si alguna pieza tuya o rival queda indefensa.';
  if (category === 'amenazas del rival') return 'Primero pregunta qué amenaza el rival en una jugada.';
  if (category === 'mate en 1' || category === 'mate en 2') return 'Cuando el rey está expuesto, revisa todos los jaques legales.';
  return 'Haz siempre la lista: amenaza rival, jaques, capturas, amenazas y piezas indefensas.';
}
