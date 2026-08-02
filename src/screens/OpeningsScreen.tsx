import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Chess, type Square } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { ArrowLeft, ArrowRight, Check, HelpCircle, Lightbulb, RotateCcw, SkipBack, SkipForward, X } from 'lucide-react';
import SectionHeader from '../components/SectionHeader';
import OpeningLearningPanel from '../components/OpeningLearningPanel';
import { openingCourses } from '../data/openings';
import { boardMoveToSan, kingInCheckSquare, legalDestinations } from '../logic/boardMove';
import { boardNotationOptions } from '../logic/boardStyle';
import { saveOpeningAttempt } from '../storage/localStore';
import type { OpeningLine } from '../types';

type Feedback = {
  correct: boolean;
  text: string;
};

type OpeningMode = 'review' | 'practice';
type TrainingColor = 'w' | 'b';

export default function OpeningsScreen() {
  const [courseId, setCourseId] = useState(openingCourses[0]?.id ?? '');
  const course = openingCourses.find((item) => item.id === courseId) ?? openingCourses[0];
  const [lineId, setLineId] = useState(course?.lines[0]?.id ?? '');
  const line = course?.lines.find((item) => item.id === lineId) ?? course?.lines[0];
  const [mode, setMode] = useState<OpeningMode>('review');
  const [practiceColor, setPracticeColor] = useState<TrainingColor>('w');
  const [ply, setPly] = useState(0);
  const [manualMove, setManualMove] = useState('');
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const pieceClickSquareRef = useRef<string | null>(null);
  const recordedCompletionRef = useRef('');

  const game = useMemo(() => buildPosition(line, ply), [line, ply]);
  const currentMove = line?.moves[ply] ?? null;
  const courseColor = course?.side === 'negras' ? 'b' : 'w';
  const trainingColor = mode === 'practice' ? practiceColor : courseColor;
  const boardColor = mode === 'practice' ? practiceColor : courseColor;
  const isUserTurn = Boolean(mode === 'practice' && currentMove && game.turn() === trainingColor);
  const completed = Boolean(line && ply >= line.moves.length);
  const moveNumber = Math.floor(ply / 2) + 1;
  useEffect(() => {
    if (!completed || mode !== 'practice' || !line) return;
    const key = `${course.id}-${line.id}-${practiceColor}-${mistakes}`;
    if (recordedCompletionRef.current === key) return;
    recordedCompletionRef.current = key;
    saveOpeningAttempt({
      id: crypto.randomUUID(), courseId: course.id, activity: 'line', correct: mistakes === 0,
      mistakes, motifs: mistakes === 0 ? [] : ['memoria de línea'], date: new Date().toISOString()
    });
  }, [completed, course.id, line, mistakes, mode, practiceColor]);

  const changeCourse = (nextCourseId: string) => {
    const nextCourse = openingCourses.find((item) => item.id === nextCourseId) ?? openingCourses[0];
    setCourseId(nextCourse.id);
    setLineId(nextCourse.lines[0]?.id ?? '');
    resetLine('review');
  };

  const changeLine = (nextLineId: string) => {
    setLineId(nextLineId);
    resetLine('review');
  };

  const resetLine = (nextMode = mode, nextColor = practiceColor) => {
    setMode(nextMode);
    setPracticeColor(nextColor);
    setPly(0);
    setManualMove('');
    setSelectedSquare(null);
    setLastMove(null);
    setFeedback(null);
    setShowHint(false);
    setMistakes(0);
  };

  const advanceExpectedMove = (message?: string) => {
    if (!line || !currentMove) return;
    const result = playSanFromCurrent(line, ply, currentMove.san);
    setPly((value) => value + 1);
    setLastMove(result ? { from: result.from, to: result.to } : null);
    setSelectedSquare(null);
    setManualMove('');
    setShowHint(false);
    setFeedback(message ? { correct: true, text: message } : mode === 'review' ? { correct: true, text: currentMove.explanation } : null);
  };

  const startPractice = (color: TrainingColor) => {
    resetLine('practice', color);
  };

  const goToReviewPly = (nextPly: number) => {
    if (!line || mode !== 'review') return;
    const boundedPly = Math.max(0, Math.min(nextPly, line.moves.length));
    const previousMove = boundedPly > 0 ? playSanFromCurrent(line, boundedPly - 1, line.moves[boundedPly - 1].san) : null;
    setPly(boundedPly);
    setLastMove(previousMove ? { from: previousMove.from, to: previousMove.to } : null);
    setFeedback(
      boundedPly > 0
        ? { correct: true, text: line.moves[boundedPly - 1].explanation }
        : null
    );
    setSelectedSquare(null);
    setShowHint(false);
  };

  const submitMove = (moveText: string) => {
    if (!line || !currentMove || !isUserTurn) return;
    const normalized = toInternalSan(moveText.trim());
    if (!normalized) return;

    const trial = new Chess(game.fen());
    try {
      const move = trial.move(normalized, { strict: false });
      const accepted = findAcceptedOpeningMove(currentMove, move.san);
      if (accepted) {
        setPly(sameMove(accepted.san, currentMove.san) ? ply + 1 : line.moves.length);
        setLastMove({ from: move.from, to: move.to });
        setFeedback({ correct: true, text: accepted.explanation });
        setManualMove('');
        setSelectedSquare(null);
        setShowHint(false);
        return;
      }
    } catch {
      // Feedback below handles illegal notation and wrong legal moves the same way.
    }

    setMistakes((value) => value + 1);
    setFeedback({ correct: false, text: `La jugada de la línea es ${displaySan(currentMove.san)}. ${currentMove.explanation}` });
  };

  const submitBoardMove = (from: string, to: string) => {
    if (!line || !currentMove || !isUserTurn) return false;
    if (from === to) return false;
    const result = boardMoveToSan(game.fen(), from, to);
    if (!result) {
      setFeedback({ correct: false, text: 'Esa jugada no es legal en esta posición.' });
      return false;
    }

    const accepted = findAcceptedOpeningMove(currentMove, result.san);
    if (accepted) {
      setPly(sameMove(accepted.san, currentMove.san) ? ply + 1 : line.moves.length);
      setLastMove({ from: result.from, to: result.to });
      setFeedback({ correct: true, text: accepted.explanation });
      setManualMove('');
      setSelectedSquare(null);
      setShowHint(false);
      return true;
    }

    setMistakes((value) => value + 1);
    setFeedback({ correct: false, text: `Esa jugada es legal, pero aquí queremos ${displaySan(currentMove.san)}. ${currentMove.explanation}` });
    return false;
  };

  const handleBoardClick = (square: string) => {
    if (!isUserTurn) return;
    const clickedPiece = game.get(square as Square);

    if (!selectedSquare) {
      if (clickedPiece?.color === trainingColor) {
        setSelectedSquare(square);
        setFeedback(null);
      }
      return;
    }

    if (selectedSquare === square) {
      setSelectedSquare(null);
      return;
    }

    if (clickedPiece?.color === trainingColor) {
      setSelectedSquare(square);
      setFeedback(null);
      return;
    }

    if (submitBoardMove(selectedSquare, square)) return;
  };

  const handlePieceClick = ({ square }: { square: string | null }) => {
    if (!square) return;
    pieceClickSquareRef.current = square;
    handleBoardClick(square);
  };

  const handleSquareClick = ({ square }: { square: string }) => {
    if (pieceClickSquareRef.current === square) {
      pieceClickSquareRef.current = null;
      return;
    }

    handleBoardClick(square);
  };

  const handlePieceDrop = ({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }) => {
    if (!targetSquare) return false;
    if (sourceSquare === targetSquare) return false;
    return submitBoardMove(sourceSquare, targetSquare);
  };

  if (!course || !line) return null;

  return (
    <section>
      <SectionHeader
        eyebrow="Aperturas"
        title="Entrena el repertorio por bando"
        description="Aprende la idea de la apertura, reproduce la línea y encuentra las jugadas de tu color en el tablero."
      />
      <div className="opening-mobile-priority">
        <label>
          Apertura
          <select value={course.id} onChange={(event) => changeCourse(event.target.value)}>
            {openingCourses.map((item) => (
              <option key={item.id} value={item.id}>
                {displaySide(item.side)}: {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Línea
          <select value={line.id} onChange={(event) => changeLine(event.target.value)}>
            {course.lines.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <div className="opening-move-list compact">
          {line.moves.map((move, index) => (
            <span className={index < ply ? 'done' : index === ply ? 'current' : ''} key={`${displaySan(move.san)}-${index}-mobile`}>
              {index % 2 === 0 ? `${Math.floor(index / 2) + 1}. ` : ''}
              {displaySan(move.san)}
            </span>
          ))}
        </div>
      </div>
      <OpeningLearningPanel course={course} onCourseChange={changeCourse} />
      <div className="openings-layout">
        <aside className="opening-sidebar">
          <label>
            Apertura
            <select value={course.id} onChange={(event) => changeCourse(event.target.value)}>
              {openingCourses.map((item) => (
                <option key={item.id} value={item.id}>
                  {displaySide(item.side)}: {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Línea
            <select value={line.id} onChange={(event) => changeLine(event.target.value)}>
              {course.lines.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <div className="opening-plan">
            <div className="tag-row">
              <span>{displaySide(course.side)}</span>
              <span>Dificultad {course.difficulty}/5</span>
            </div>
            <h2>{course.name}</h2>
            <p>{course.summary}</p>
            <strong>Plan</strong>
            {course.plan.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </aside>
        <div className="opening-board-panel">
          <Chessboard
            options={{
              position: game.fen(),
              onPieceDrop: handlePieceDrop,
              onPieceClick: handlePieceClick,
              onSquareClick: handleSquareClick,
              squareStyles: buildSquareStyles(game.fen(), selectedSquare, lastMove),
              boardOrientation: boardColor === 'b' ? 'black' : 'white',
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
        </div>
        <aside className="opening-practice-panel">
          <div className="mode-toggle" aria-label="Modo de apertura">
            <button className={mode === 'review' ? 'active' : ''} onClick={() => resetLine('review')} type="button">
              Ver línea
            </button>
            <button className={mode === 'practice' && practiceColor === 'w' ? 'active' : ''} onClick={() => startPractice('w')} type="button">
              Practicar Blancas
            </button>
            <button className={mode === 'practice' && practiceColor === 'b' ? 'active' : ''} onClick={() => startPractice('b')} type="button">
              Practicar Negras
            </button>
          </div>
          {mode === 'review' ? (
            <div className="opening-review-controls" aria-label="Navegación por la línea">
              <button onClick={() => goToReviewPly(0)} disabled={ply === 0} type="button" aria-label="Ir al inicio">
                <SkipBack size={18} />
              </button>
              <button onClick={() => goToReviewPly(ply - 1)} disabled={ply === 0} type="button">
                <ArrowLeft size={18} /> Anterior
              </button>
              <button onClick={() => goToReviewPly(ply + 1)} disabled={completed} type="button">
                Siguiente <ArrowRight size={18} />
              </button>
              <button onClick={() => goToReviewPly(line.moves.length)} disabled={completed} type="button" aria-label="Ir al final">
                <SkipForward size={18} />
              </button>
            </div>
          ) : null}
          <div className="opening-progress">
            <span>
              Jugada {Math.min(ply + 1, line.moves.length)}/{line.moves.length}
            </span>
            <strong>{completed ? 'Línea completada' : `${moveNumber}${game.turn() === 'b' ? '...' : '.'} ${currentMove ? displaySan(currentMove.san) : ''}`}</strong>
          </div>
          <div className="opening-ideas">
            <strong>{line.stage ? `${line.stage} · Ideas clave` : 'Ideas clave'}</strong>
            {line.summary ? <p>{line.summary}</p> : null}
            {line.keyIdeas.map((idea) => (
              <span key={idea}>{idea}</span>
            ))}
          </div>
          {line.whitePlan?.length || line.blackPlan?.length ? (
            <div className="opening-side-plans">
              <div>
                <strong>Plan de Blancas</strong>
                {line.whitePlan?.map((item) => <span key={item}>{item}</span>)}
              </div>
              <div>
                <strong>Plan de Negras</strong>
                {line.blackPlan?.map((item) => <span key={item}>{item}</span>)}
              </div>
            </div>
          ) : null}
          {completed ? (
            <div className="feedback correct">
              <strong>
                <Check size={20} />
                {mode === 'review' ? 'Secuencia vista completa' : 'Práctica completada'}
              </strong>
              <p>
                {mode === 'review'
                  ? 'Ahora practica la misma línea desde el bando que quieras entrenar.'
                  : mistakes === 0
                    ? 'Has reproducido la línea sin errores.'
                    : `Errores en esta repetición: ${mistakes}. Repite la línea para consolidarla.`}
              </p>
              <div className="action-row">
                {mode === 'review' ? (
                  <>
                    <button className="primary-button" onClick={() => startPractice('w')} type="button">
                      <ArrowRight size={18} />
                      Practicar Blancas
                    </button>
                    <button className="secondary-button" onClick={() => startPractice('b')} type="button">
                      <ArrowRight size={18} />
                      Practicar Negras
                    </button>
                  </>
                ) : (
                  <button className="primary-button" onClick={() => resetLine('practice', practiceColor)} type="button">
                    <RotateCcw size={18} />
                    Repetir práctica
                  </button>
                )}
              </div>
            </div>
          ) : isUserTurn ? (
            <>
              <p className="opening-prompt">Encuentra la jugada de {trainingColor === 'w' ? 'Blancas' : 'Negras'}: explica qué desarrolla, defiende o prepara.</p>
              <form
                className="move-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  submitMove(manualMove);
                }}
              >
                <label htmlFor="opening-move">Escribir jugada</label>
                <div>
                  <input id="opening-move" value={manualMove} onChange={(event) => setManualMove(event.target.value)} placeholder="Ej. Cf3, c5 u O-O" />
                  <button className="secondary-button" type="submit" disabled={!manualMove.trim()}>
                    <Check size={18} />
                    Comprobar
                  </button>
                </div>
              </form>
              <div className="action-row">
                <button className="secondary-button" onClick={() => setShowHint((value) => !value)} type="button">
                  <Lightbulb size={18} />
                  Ver pista
                </button>
                <button
                  className="ghost-button"
                  onClick={() => {
                    setMistakes((value) => value + 1);
                    advanceExpectedMove(`La jugada era ${currentMove ? displaySan(currentMove.san) : ''}. ${currentMove?.explanation}`);
                  }}
                  type="button"
                >
                  <HelpCircle size={18} />
                  Mostrar jugada
                </button>
              </div>
            </>
          ) : (
            <div className="opponent-move">
              <strong>{mode === 'review' ? 'Secuencia pregrabada' : 'Respuesta del rival'}</strong>
              <p>{currentMove?.explanation}</p>
              <button className="primary-button" onClick={() => advanceExpectedMove()} type="button">
                <ArrowRight size={18} />
                Ver {currentMove?.san}
              </button>
            </div>
          )}
          {showHint && currentMove ? <p className="hint-reveal">{currentMove.explanation}</p> : null}
          {feedback ? (
            <div className={feedback.correct ? 'feedback correct' : 'feedback wrong'}>
              <strong>
                {feedback.correct ? <Check size={20} /> : <X size={20} />}
                {mode === 'review' && feedback.correct ? 'Idea de la jugada' : feedback.correct ? 'Correcto' : 'Revisa la idea'}
              </strong>
              <p>{feedback.text}</p>
              {feedback.correct && !completed ? (
                <button className="primary-button" onClick={() => setFeedback(null)} type="button">
                  <ArrowRight size={18} />
                  Continuar
                </button>
              ) : null}
            </div>
          ) : null}
          <div className="opening-move-list">
            {line.moves.map((move, index) => (
              <span className={index < ply ? 'done' : index === ply ? 'current' : ''} key={`${displaySan(move.san)}-${index}`}>
                {index % 2 === 0 ? `${Math.floor(index / 2) + 1}. ` : ''}
                {displaySan(move.san)}
              </span>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

function buildPosition(line: OpeningLine | undefined, ply: number): Chess {
  const game = new Chess();
  if (!line) return game;
  line.moves.slice(0, ply).forEach((move) => game.move(move.san, { strict: false }));
  return game;
}

function playSanFromCurrent(line: OpeningLine, ply: number, san: string) {
  const game = buildPosition(line, ply);
  return game.move(san, { strict: false });
}

function findAcceptedOpeningMove(move: OpeningLine['moves'][number], playedSan: string) {
  if (sameMove(playedSan, move.san)) return { san: move.san, explanation: move.explanation };
  return move.alternatives?.find((alternative) => sameMove(playedSan, alternative.san)) ?? null;
}

function sameMove(left: string, right: string): boolean {
  return left.replace(/[+#x=\s]/g, '').toLowerCase() === right.replace(/[+#x=\s]/g, '').toLowerCase();
}

function displaySan(san: string): string {
  const pieces: Record<string, string> = { K: 'R', Q: 'D', R: 'T', B: 'A', N: 'C' };
  return san.replace(/^([KQRBN])/, (piece) => pieces[piece]);
}

function toInternalSan(san: string): string {
  const pieces: Record<string, string> = { R: 'K', D: 'Q', T: 'R', A: 'B', C: 'N' };
  return san.replace(/^([RDTAC])/, (piece) => pieces[piece]);
}
function displaySide(side: 'blancas' | 'negras'): string {
  return side === 'blancas' ? 'Blancas' : 'Negras';
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
