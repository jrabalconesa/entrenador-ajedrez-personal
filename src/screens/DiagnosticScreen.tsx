import { useMemo, useState, type CSSProperties } from 'react';
import { Chess, type Square } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { ArrowRight, Check, HelpCircle, Lightbulb } from 'lucide-react';
import SectionHeader from '../components/SectionHeader';
import { diagnosticExercises } from '../data/diagnostic';
import { saveAttempt } from '../storage/localStore';
import { saveDiagnosticResult } from '../storage/localStore';
import { createExerciseAttempt } from '../logic/adaptive';
import { boardMoveToSan, kingInCheckSquare, legalDestinations } from '../logic/boardMove';
import { boardNotationOptions } from '../logic/boardStyle';
import type { DiagnosticResult, Exercise, ExerciseAttempt, ExerciseCategory } from '../types';

interface DiagnosticScreenProps {
  onFinished: () => void;
}

export default function DiagnosticScreen({ onFinished }: DiagnosticScreenProps) {
  const [index, setIndex] = useState(0);
  const [manualMove, setManualMove] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<{ correct: boolean; playedMove: string } | null>(null);
  const [answers, setAnswers] = useState<ExerciseAttempt[]>([]);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [diagnosticFinished, setDiagnosticFinished] = useState(false);
  const exercise = diagnosticExercises[index];
  const [position, setPosition] = useState(exercise.fen);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [illegalMessage, setIllegalMessage] = useState('');

  const result = useMemo(() => (diagnosticFinished ? buildDiagnosticResult(answers) : null), [answers, diagnosticFinished]);

  const submitMove = (moveText: string, gaveUp = false) => {
    if (feedback) return;
    const game = new Chess(exercise.fen);
    let san = gaveUp ? 'No lo sé' : moveText.trim();

    if (!gaveUp) {
      try {
        const move = game.move(san, { strict: false });
        san = move.san;
        setPosition(game.fen());
        setLastMove({ from: move.from, to: move.to });
        setSelectedSquare(null);
        setIllegalMessage('');
      } catch {
        san = moveText.trim();
      }
    }

    const correct = !gaveUp && isAcceptedMove(san, exercise);
    const attempt = createExerciseAttempt(exercise, correct, Math.max(1, Math.round((Date.now() - startedAt) / 1000)), {
      gaveUp,
      previousAttempts: answers,
      attemptKind: 'diagnostic'
    });

    saveAttempt(attempt);
    setAnswers((current) => [...current, attempt]);
    setFeedback({ correct, playedMove: san });
  };

  const submitBoardMove = (from: string, to: string) => {
    if (feedback) return false;
    if (from === to) return false;
    const result = boardMoveToSan(exercise.fen, from, to);
    if (!result) {
      setIllegalMessage('Esa pieza no puede ir ahí en esta posición.');
      return false;
    }

    const correct = isAcceptedMove(result.san, exercise);
    const attempt = createExerciseAttempt(exercise, correct, Math.max(1, Math.round((Date.now() - startedAt) / 1000)), {
      previousAttempts: answers,
      attemptKind: 'diagnostic'
    });

    setPosition(result.fen);
    setLastMove({ from: result.from, to: result.to });
    setSelectedSquare(null);
    setIllegalMessage('');
    saveAttempt(attempt);
    setAnswers((current) => [...current, attempt]);
    setFeedback({ correct, playedMove: result.san });
    return true;
  };

  const handleSquareClick = ({ square }: { square: string }) => {
    if (feedback) return;
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

  const next = () => {
    const nextIndex = index + 1;
    if (nextIndex >= diagnosticExercises.length) return;
    setIndex(nextIndex);
    setPosition(diagnosticExercises[nextIndex].fen);
    setFeedback(null);
    setManualMove('');
    setShowHint(false);
    setSelectedSquare(null);
    setLastMove(null);
    setIllegalMessage('');
    setStartedAt(Date.now());
  };

  if (result) {
    return (
      <DiagnosticResultView
        result={result}
        onSave={() => {
          saveDiagnosticResult(result);
          onFinished();
        }}
      />
    );
  }

  return (
    <section>
      <SectionHeader
        eyebrow={`Diagnóstico inicial ${index + 1}/15`}
        title="Primero medimos lo básico"
        description="No es un examen duro. Sirve para elegir mejor qué entrenar esta semana."
      />
      <div className="exercise-layout">
        <div className="board-panel">
          <Chessboard
            options={{
              position,
              onPieceDrop: ({ sourceSquare, targetSquare }) => {
                if (!targetSquare) return false;
                if (sourceSquare === targetSquare) return false;
                return submitBoardMove(sourceSquare, targetSquare);
              },
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
          <div className="tag-row">
            <span>{exercise.category}</span>
            <span>Dificultad {exercise.difficulty}/5</span>
            <span>Juegan {sideLabel(exercise.sideToMove)}</span>
          </div>
          <h2>{exercise.question}</h2>
          <div className="pre-move-checklist">
            <strong>Antes de responder</strong>
            <span>1. ¿Qué amenaza el rival?</span>
            <span>2. ¿Qué jaques tengo?</span>
            <span>3. ¿Qué capturas tengo?</span>
            <span>4. ¿Qué amenazas tengo?</span>
            <span>5. ¿Hay alguna pieza indefensa?</span>
          </div>
          <form
            className="move-form"
            onSubmit={(event) => {
              event.preventDefault();
              submitMove(manualMove);
            }}
          >
            <label htmlFor="diagnostic-move">Escribir jugada</label>
            <div>
              <input
                id="diagnostic-move"
                placeholder="Opcional: O-O, Qxf7# o e4"
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
            <div className={feedback.correct ? 'feedback correct' : 'feedback wrong'}>
              <strong>{feedback.correct ? 'Correcto' : 'Revisión necesaria'}</strong>
              <p>Respuesta esperada: {exercise.expectedMove}.</p>
              <p>{exercise.explanation}</p>
              {index + 1 < diagnosticExercises.length ? (
                <button className="primary-button" onClick={next} type="button">
                  <ArrowRight size={20} />
                  Siguiente posición
                </button>
              ) : (
                <button className="primary-button" onClick={() => setDiagnosticFinished(true)} type="button">
                  <ArrowRight size={20} />
                  Ver resultado
                </button>
              )}
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

function DiagnosticResultView({ result, onSave }: { result: DiagnosticResult; onSave: () => void }) {
  return (
    <section>
      <SectionHeader
        eyebrow="Resultado del diagnóstico"
        title="Plan de 7 días creado a partir de tus respuestas"
        description="Si hay fallos claros en piezas colgadas, amenazas o mate básico, no conviene añadir aperturas nuevas todavía."
      />
      <div className="diagnostic-result">
        <article className="stat-card">
          <Check size={24} />
          <span>Aciertos</span>
          <strong>
            {result.correct}/{result.total}
          </strong>
        </article>
        <article className="summary-card">
          <h2>Fortalezas</h2>
          <p>{result.strengths.length ? result.strengths.join(', ') : 'Aún no hay una fortaleza clara; conviene empezar por bases.'}</p>
        </article>
        <article className="summary-card">
          <h2>Debilidades</h2>
          <p>{result.weaknesses.length ? result.weaknesses.join(', ') : 'No aparece una debilidad grave en este diagnóstico.'}</p>
        </article>
      </div>
      <div className="progress-panel">
        <h2>Propuesta de entrenamiento para 7 días</h2>
        {result.sevenDayPlan.map((day, dayIndex) => (
          <p className="plan-line" key={day}>
            <strong>Día {dayIndex + 1}:</strong> {day}
          </p>
        ))}
      </div>
      <button className="primary-button" onClick={onSave} type="button">
        Guardar diagnóstico
      </button>
    </section>
  );
}

function buildDiagnosticResult(answers: ExerciseAttempt[]): DiagnosticResult {
  const grouped = answers.reduce<Record<string, { total: number; correct: number }>>((acc, answer) => {
    const current = acc[answer.category] ?? { total: 0, correct: 0 };
    acc[answer.category] = {
      total: current.total + 1,
      correct: current.correct + (answer.correct ? 1 : 0)
    };
    return acc;
  }, {});
  const strengths = Object.entries(grouped)
    .filter(([, value]) => value.correct / value.total >= 0.75)
    .map(([category]) => category as ExerciseCategory);
  const weaknesses = Object.entries(grouped)
    .filter(([, value]) => value.correct / value.total < 0.6)
    .map(([category]) => category as ExerciseCategory);
  const basicWeakness = weaknesses.find((category) => ['piezas colgadas', 'amenazas del rival', 'mate en 1'].includes(category));

  return {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    total: answers.length,
    correct: answers.filter((answer) => answer.correct).length,
    strengths,
    weaknesses,
    sevenDayPlan: buildSevenDayPlan(basicWeakness, weaknesses)
  };
}

function buildSevenDayPlan(basicWeakness: ExerciseCategory | undefined, weaknesses: ExerciseCategory[]): string[] {
  if (basicWeakness) {
    return [
      'Piezas indefensas y amenazas de una jugada.',
      'Repetir errores del diagnóstico sin reloj.',
      'Jaques, capturas y amenazas en posiciones sencillas.',
      'Mate en 1 y seguridad del rey.',
      'Final básico de rey y peón.',
      'Partida propia: marcar una pieza colgada o amenaza no vista.',
      'Sesión mixta suave y resumen de una regla práctica.'
    ];
  }

  return [
    'Repaso general de piezas indefensas.',
    'Amenazas directas del rival.',
    'Jaques, capturas y amenazas.',
    weaknesses.includes('mate en 2') ? 'Mate en 1 antes de volver a mate en 2.' : 'Mate en 2 con una sola idea.',
    'Desarrollo, enroque y lucha por el centro.',
    'Final de rey y peón.',
    'Partida propia con revisión manual de errores.'
  ];
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
