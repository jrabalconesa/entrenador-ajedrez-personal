import { useState, type CSSProperties } from 'react';
import { Chess, validateFen, type Square } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Plus, RotateCcw, Save, Undo2 } from 'lucide-react';
import SectionHeader from '../components/SectionHeader';
import { playPositionPresets } from '../data/playPositions';
import { kingInCheckSquare, legalDestinations } from '../logic/boardMove';
import { boardNotationOptions } from '../logic/boardStyle';
import { chooseCoachMove, describeCoachMove, getGameStatus, reviewPlayerMove, type CoachLevel } from '../logic/gameCoach';
import { formatCategoryLabel } from '../logic/labels';
import { saveGame, updateGame } from '../storage/localStore';
import type { ExerciseCategory, GameError, SavedGame } from '../types';
import { validatePgn } from '../logic/pgn';

interface GamesScreenProps {
  games: SavedGame[];
  onGamesChanged: () => void;
}

type PromotionPiece = 'q' | 'r' | 'b' | 'n';
type LearningSignal = 'green' | 'orange' | 'red';
type CoachLogEntry = {
  text: string;
  tone: 'neutral' | 'error';
};

const errorCategories: (ExerciseCategory | 'otro')[] = [
  'piezas colgadas',
  'amenazas del rival',
  'jaques, capturas y amenazas',
  'mate en 1',
  'mate en 2',
  'doble ataque',
  'clavada',
  'final de rey y peón',
  'desarrollo y enroque',
  'aperturas populares',
  'medio juego',
  'otro'
];

export default function GamesScreen({ games, onGamesChanged }: GamesScreenProps) {
  const [pgn, setPgn] = useState('');
  const [opponent, setOpponent] = useState('');
  const [color, setColor] = useState<SavedGame['color']>('sin indicar');
  const [result, setResult] = useState('*');
  const [link, setLink] = useState('');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');
  const [guidedSaveMessage, setGuidedSaveMessage] = useState('');
  const [playColor, setPlayColor] = useState<'w' | 'b'>('w');
  const [presetId, setPresetId] = useState(playPositionPresets[0].id);
  const [customFen, setCustomFen] = useState('');
  const [coachLevel, setCoachLevel] = useState<CoachLevel>('intermedio');
  const [learningMode, setLearningMode] = useState(true);
  const [liveGame, setLiveGame] = useState(() => new Chess());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [learningMark, setLearningMark] = useState<{ square: string; signal: LearningSignal } | null>(null);
  const [waitingForCoach, setWaitingForCoach] = useState(false);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: string; to: string } | null>(null);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [detectedErrors, setDetectedErrors] = useState<GameError[]>([]);
  const [coachLog, setCoachLog] = useState<CoachLogEntry[]>([logEntry('Elige una posición y juega tus movimientos en el tablero. El rival responderá con jugadas legales.')]);

  const activePreset = playPositionPresets.find((item) => item.id === presetId) ?? null;
  const isCustomFen = presetId === 'custom-fen';
  const activePositionName = isCustomFen ? 'FEN personalizada' : (activePreset?.name ?? playPositionPresets[0].name);
  const activePositionDescription = isCustomFen ? 'Posición introducida manualmente.' : (activePreset?.description ?? playPositionPresets[0].description);
  const playerTurn = liveGame.turn() === playColor && !liveGame.isGameOver();
  const status = getGameStatus(liveGame);

  const submitGame = () => {
    const validation = validatePgn(pgn);
    if (!validation.valid) {
      setMessage(validation.message);
      return;
    }

    saveGame({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      pgn,
      color,
      result,
      opponent,
      link: link || undefined,
      notes,
      errors: []
    });
    setPgn('');
    setOpponent('');
    setColor('sin indicar');
    setResult('*');
    setLink('');
    setNotes('');
    setMessage('Partida guardada para revisión manual.');
    onGamesChanged();
  };

  const addError = (game: SavedGame, error: GameError) => {
    updateGame({ ...game, errors: [error, ...game.errors] });
    onGamesChanged();
  };

  const startGuidedGame = () => {
    const setup = getStartingFen(presetId, customFen);
    if (!setup.valid) {
      setCoachLog([logEntry(setup.message, 'error')]);
      return;
    }

    const game = setup.fen === 'start' ? new Chess() : new Chess(setup.fen);
    const openingLog = [logEntry(`Nueva partida: ${setup.name}. ${setup.description}`)];
    const response = playCoachTurnIfNeeded(game, playColor, coachLevel);
    setLiveGame(response.game);
    setSelectedSquare(null);
    setLastMove(response.lastMove);
    setLearningMark(null);
    setWaitingForCoach(false);
    setPendingPromotion(null);
    setUndoStack([]);
    setDetectedErrors([]);
    setGuidedSaveMessage('');
    setCoachLog([...openingLog, ...response.comments]);
  };

  const submitBoardMove = (from: string, to: string, promotion?: PromotionPiece) => {
    if (!playerTurn) return false;
    if (from === to) return false;
    const beforeFen = liveGame.fen();
    const game = new Chess(beforeFen);
    let playerMove;

    if (isPromotionMove(beforeFen, from, to) && !promotion) {
      setPendingPromotion({ from, to });
      setSelectedSquare(null);
      setCoachLog((current) => [logEntry('Elige la pieza de promoción antes de completar la jugada.'), ...current].slice(0, 8));
      return false;
    }

    try {
      playerMove = game.move(promotion ? { from, to, promotion } : { from, to });
    } catch {
      setCoachLog((current) => [logEntry('Esa jugada no es legal en esta posición.', 'error'), ...current]);
      return false;
    }

    const playerReview = reviewPlayerMove(playerMove);
    const newErrors = playerReview.errors.map((error) => ({ ...error, id: crypto.randomUUID() }));
    const shouldPauseForLearning = learningMode && playerReview.signal !== 'green' && !game.isGameOver();

    setGuidedSaveMessage('');
    setSelectedSquare(null);
    setPendingPromotion(null);
    setUndoStack((current) => [beforeFen, ...current].slice(0, 12));
    setDetectedErrors((current) => [...newErrors, ...current].slice(0, 12));
    setLearningMark(learningMode ? { square: playerMove.to, signal: playerReview.signal } : null);

    if (shouldPauseForLearning) {
      setLiveGame(game);
      setLastMove({ from: playerMove.from, to: playerMove.to });
      setWaitingForCoach(true);
      setCoachLog((current) => [
        logEntry('Modo aprendizaje: piensa si quieres deshacer esta jugada o continuar con la respuesta del rival.', playerReview.hasError ? 'error' : 'neutral'),
        logEntry(playerReview.comment, playerReview.hasError ? 'error' : 'neutral'),
        ...current
      ].slice(0, 8));
      return true;
    }

    const response = playCoachTurnIfNeeded(game, playColor, coachLevel);
    const nextStatus = getGameStatus(response.game);
    setLiveGame(response.game);
    setLastMove(response.lastMove ?? { from: playerMove.from, to: playerMove.to });
    setWaitingForCoach(false);
    setCoachLog((current) => [...(nextStatus ? [logEntry(nextStatus)] : []), ...response.comments, logEntry(playerReview.comment, playerReview.hasError ? 'error' : 'neutral'), ...current].slice(0, 8));
    return true;
  };

  const continueCoachTurn = () => {
    if (!waitingForCoach) return;
    const game = new Chess(liveGame.fen());
    const response = playCoachTurnIfNeeded(game, playColor, coachLevel);
    const nextStatus = getGameStatus(response.game);
    setLiveGame(response.game);
    setWaitingForCoach(false);
    setSelectedSquare(null);
    setLastMove(response.lastMove ?? lastMove);
    setCoachLog((current) => [...(nextStatus ? [logEntry(nextStatus)] : []), ...response.comments, ...current].slice(0, 8));
  };

  const handleSquareClick = ({ square }: { square: string }) => {
    if (!playerTurn) return;
    const clickedPiece = liveGame.get(square as Square);

    if (!selectedSquare) {
      if (clickedPiece?.color === playColor) setSelectedSquare(square);
      return;
    }

    if (selectedSquare === square) {
      setSelectedSquare(null);
      return;
    }

    if (clickedPiece?.color === playColor) {
      setSelectedSquare(square);
      return;
    }

    if (submitBoardMove(selectedSquare, square)) return;
  };

  const saveGuidedGame = () => {
    const playedPgn = liveGame.pgn() || '*';
    saveGame({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      pgn: playedPgn,
      color: playColor === 'w' ? 'blancas' : 'negras',
      result: getResultFromGame(liveGame),
      opponent: 'Entrenador guiado',
      notes: buildGuidedGameNotes(activePositionName, activePositionDescription, coachLog),
      errors: detectedErrors
    });
    setGuidedSaveMessage('Partida guardada correctamente en tu historial.');
    setCoachLog((current) => [logEntry('Partida guardada correctamente. Los errores detectados quedan disponibles para futuros repasos.'), ...current].slice(0, 8));
    onGamesChanged();
  };

  const undoLastTurn = () => {
    const previousFen = undoStack[0];
    if (!previousFen) return;
    setLiveGame(new Chess(previousFen));
    setUndoStack((current) => current.slice(1));
    setSelectedSquare(null);
    setLastMove(null);
    setLearningMark(null);
    setWaitingForCoach(false);
    setPendingPromotion(null);
    setCoachLog((current) => [logEntry('Último turno deshecho. Repite la posición con otra idea. Si la jugada anterior fue marcada como error, queda registrada para tus repasos.', 'error'), ...current].slice(0, 8));
  };

  return (
    <section>
      <SectionHeader
        eyebrow="Mis partidas"
        title="Juega, guarda y revisa tus partidas"
        description="Practica desde la posición inicial o desde posiciones típicas. El entrenador comenta ideas claras después de cada jugada."
      />
      <div className="guided-game-panel">
        <div className="guided-controls">
          <label>
            Posición
            <select value={presetId} onChange={(event) => setPresetId(event.target.value)}>
              {playPositionPresets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
              <option value="custom-fen">FEN personalizada</option>
            </select>
          </label>
          <label>
            Jugar con
            <select value={playColor} onChange={(event) => setPlayColor(event.target.value as 'w' | 'b')}>
              <option value="w">Blancas</option>
              <option value="b">Negras</option>
            </select>
          </label>
          <label>
            Nivel rival
            <select value={coachLevel} onChange={(event) => setCoachLevel(event.target.value as CoachLevel)}>
              <option value="basico">Básico</option>
              <option value="intermedio">Intermedio</option>
              <option value="firme">Firme</option>
            </select>
          </label>
          <label className="learning-mode-toggle">
            <input checked={learningMode} onChange={(event) => setLearningMode(event.target.checked)} type="checkbox" />
            <span>Modo aprendizaje</span>
          </label>
          {isCustomFen ? (
            <label className="custom-fen-field">
              FEN personalizada
              <textarea value={customFen} onChange={(event) => setCustomFen(event.target.value)} placeholder="Ej. rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" />
            </label>
          ) : null}
          <div className="guided-actions">
            <button className="secondary-button" onClick={startGuidedGame} type="button">
              <RotateCcw size={18} />
              Nueva partida
            </button>
            <button className="ghost-button" onClick={undoLastTurn} type="button" disabled={undoStack.length === 0}>
              <Undo2 size={18} />
              Deshacer
            </button>
            <button className="secondary-button" onClick={continueCoachTurn} type="button" disabled={!waitingForCoach}>
              Continuar rival
            </button>
            <button className="primary-button" onClick={saveGuidedGame} type="button" disabled={liveGame.history().length === 0}>
              <Save size={18} />
              Guardar partida
            </button>
          </div>
        </div>
        <div className="guided-game-layout">
          <div className="board-panel">
            <Chessboard
              options={{
                position: liveGame.fen(),
                boardOrientation: playColor === 'b' ? 'black' : 'white',
                onPieceDrop: ({ sourceSquare, targetSquare }) => (targetSquare && sourceSquare !== targetSquare ? submitBoardMove(sourceSquare, targetSquare) : false),
                onSquareClick: handleSquareClick,
                squareStyles: buildGuidedSquareStyles(liveGame.fen(), selectedSquare, lastMove, learningMark),
                boardStyle: {
                  width: 'min(100%, 500px)',
                  borderRadius: '8px',
                  boxShadow: '0 16px 40px rgba(30, 41, 59, 0.16)'
                },
                darkSquareStyle: { backgroundColor: '#77906f' },
                lightSquareStyle: { backgroundColor: '#eef0d8' },
                ...boardNotationOptions
              }}
            />
          </div>
          <aside className="coach-commentary">
            <div className="tag-row">
              <span>{playerTurn ? 'Tu turno' : liveGame.isGameOver() ? 'Finalizada' : 'Rival'}</span>
              <span>{activePositionName}</span>
              <span>{playColor === 'w' ? 'Juegas Blancas' : 'Juegas Negras'}</span>
            </div>
            <h2>Comentarios del entrenador</h2>
            {guidedSaveMessage ? <p className="save-confirmation">{guidedSaveMessage}</p> : null}
            {status ? <p className="hint-box compact-note">{status}</p> : null}
            {pendingPromotion ? (
              <div className="promotion-choice">
                <strong>Promocionar peón</strong>
                <div>
                  <button className="secondary-button compact-action" onClick={() => submitBoardMove(pendingPromotion.from, pendingPromotion.to, 'q')} type="button">
                    Dama
                  </button>
                  <button className="secondary-button compact-action" onClick={() => submitBoardMove(pendingPromotion.from, pendingPromotion.to, 'r')} type="button">
                    Torre
                  </button>
                  <button className="secondary-button compact-action" onClick={() => submitBoardMove(pendingPromotion.from, pendingPromotion.to, 'b')} type="button">
                    Alfil
                  </button>
                  <button className="secondary-button compact-action" onClick={() => submitBoardMove(pendingPromotion.from, pendingPromotion.to, 'n')} type="button">
                    Caballo
                  </button>
                </div>
              </div>
            ) : null}
            <div className="coach-log">
              {coachLog.map((item, index) => (
                <p className={[index === 0 ? 'coach-log-latest' : '', item.tone === 'error' ? 'coach-log-error' : ''].filter(Boolean).join(' ') || undefined} key={`${item.text}-${index}`}>{item.text}</p>
              ))}
            </div>
            <div className="guided-moves">
              <strong>Últimas jugadas</strong>
              <span>{liveGame.history().slice(-12).join(' ') || 'Aún no hay jugadas.'}</span>
            </div>
            <div className="guided-moves">
              <strong>Errores detectados</strong>
              <span>
                {detectedErrors.length > 0
                  ? `${detectedErrors.length} aviso${detectedErrors.length === 1 ? '' : 's'} se guardarán con la partida.`
                  : 'Aún no hay avisos claros en esta partida.'}
              </span>
            </div>
            <div className="traffic-legend" aria-label="Leyenda del modo aprendizaje">
              <span><b className="signal-dot green" /> Verde: sana</span>
              <span><b className="signal-dot orange" /> Naranja: dudosa</span>
              <span><b className="signal-dot red" /> Rojo: error</span>
            </div>
          </aside>
        </div>
      </div>
      <div className="games-layout">
        <div className="form-panel">
          <h2>Guardar una partida externa</h2>
          <label>
            PGN
            <textarea value={pgn} onChange={(event) => setPgn(event.target.value)} placeholder="[Event &quot;Partida rápida&quot;]&#10;1. e4 e5 2. Nf3 Nc6 ..." />
          </label>
          <div className="form-grid">
            <label>
              Color jugado
              <select value={color} onChange={(event) => setColor(event.target.value as SavedGame['color'])}>
                <option>sin indicar</option>
                <option>blancas</option>
                <option>negras</option>
              </select>
            </label>
            <label>
              Resultado
              <select value={result} onChange={(event) => setResult(event.target.value)}>
                <option>*</option>
                <option>1-0</option>
                <option>0-1</option>
                <option>1/2-1/2</option>
              </select>
            </label>
            <label>
              Rival
              <input value={opponent} onChange={(event) => setOpponent(event.target.value)} placeholder="Nombre o usuario" />
            </label>
            <label>
              Enlace opcional
              <input value={link} onChange={(event) => setLink(event.target.value)} placeholder="https://..." />
            </label>
          </div>
          <label>
            Observaciones
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Qué sentiste, dónde dudaste, qué quieres revisar..." />
          </label>
          <button className="primary-button" onClick={submitGame} type="button">
            <Save size={20} />
            Guardar partida
          </button>
          {message ? <p className="form-message">{message}</p> : null}
          <div className="future-panel">
            <h2>Análisis automático</h2>
            <p>Próxima mejora: conectar Stockfish local para detectar errores con evaluación precisa y sugerir momentos críticos.</p>
          </div>
        </div>
        <div className="games-list">
          {games.length === 0 ? <p className="empty-state">Todavía no hay partidas guardadas.</p> : null}
          {games.map((game) => (
            <GameCard game={game} key={game.id} onAddError={addError} />
          ))}
        </div>
      </div>
    </section>
  );
}

function playCoachTurnIfNeeded(game: Chess, playerColor: 'w' | 'b', coachLevel: CoachLevel): { game: Chess; comments: CoachLogEntry[]; lastMove: { from: string; to: string } | null } {
  if (game.isGameOver() || game.turn() === playerColor) return { game, comments: [], lastMove: null };

  const beforeFen = game.fen();
  const coachMove = chooseCoachMove(beforeFen, coachLevel);
  if (!coachMove) return { game, comments: [], lastMove: null };

  const playedMove = game.move(coachMove.san);
  return {
    game,
    comments: [logEntry(describeCoachMove(playedMove))],
    lastMove: { from: playedMove.from, to: playedMove.to }
  };
}

function logEntry(text: string, tone: CoachLogEntry['tone'] = 'neutral'): CoachLogEntry {
  return { text, tone };
}

function getStartingFen(presetId: string, customFen: string): { valid: true; fen: string; name: string; description: string } | { valid: false; message: string } {
  if (presetId === 'custom-fen') {
    const fen = customFen.trim();
    if (!fen) return { valid: false, message: 'Pega una FEN antes de iniciar la partida personalizada.' };
    const validation = validateFen(fen);
    if (!validation.ok) return { valid: false, message: `La FEN no es válida: ${validation.error ?? 'revisa la posición.'}` };
    return { valid: true, fen, name: 'FEN personalizada', description: 'Posición introducida manualmente.' };
  }

  const preset = playPositionPresets.find((item) => item.id === presetId) ?? playPositionPresets[0];
  return { valid: true, fen: preset.fen, name: preset.name, description: preset.description };
}

function getResultFromGame(game: Chess): string {
  if (!game.isGameOver()) return '*';
  if (game.isDraw()) return '1/2-1/2';
  const winner = game.turn() === 'w' ? 'negras' : 'blancas';
  return winner === 'blancas' ? '1-0' : '0-1';
}

function buildGuidedGameNotes(positionName: string, positionDescription: string, coachLog: CoachLogEntry[]): string {
  const recentComments = coachLog.slice(0, 5);
  return [`${positionName}. ${positionDescription}`, 'Comentarios recientes del entrenador:', ...recentComments.map((comment) => `- ${comment.text}`)].join('\n');
}

function isPromotionMove(fen: string, from: string, to: string): boolean {
  const game = new Chess(fen);
  const piece = game.get(from as Square);
  return piece?.type === 'p' && piece.color === game.turn() && (to.endsWith('8') || to.endsWith('1'));
}

function buildGuidedSquareStyles(
  fen: string,
  selectedSquare: string | null,
  lastMove: { from: string; to: string } | null,
  learningMark: { square: string; signal: LearningSignal } | null
): Record<string, CSSProperties> {
  const styles: Record<string, CSSProperties> = {};

  if (lastMove) {
    styles[lastMove.from] = { background: 'rgba(250, 204, 21, 0.38)' };
    styles[lastMove.to] = { background: 'rgba(250, 204, 21, 0.52)' };
  }

  if (learningMark) {
    const signalStyles: Record<LearningSignal, CSSProperties> = {
      green: { boxShadow: 'inset 0 0 0 6px rgba(22, 163, 74, 0.82)', background: 'rgba(187, 247, 208, 0.75)' },
      orange: { boxShadow: 'inset 0 0 0 6px rgba(245, 158, 11, 0.88)', background: 'rgba(254, 215, 170, 0.78)' },
      red: { boxShadow: 'inset 0 0 0 6px rgba(220, 38, 38, 0.9)', background: 'rgba(254, 202, 202, 0.82)' }
    };
    styles[learningMark.square] = { ...(styles[learningMark.square] ?? {}), ...signalStyles[learningMark.signal] };
  }

  if (selectedSquare) {
    styles[selectedSquare] = { background: 'rgba(23, 107, 93, 0.42)' };
    for (const target of legalDestinations(fen, selectedSquare)) {
      styles[target] = { ...(styles[target] ?? {}), boxShadow: 'inset 0 0 0 4px rgba(23, 107, 93, 0.35)' };
    }
  }

  const checkSquare = kingInCheckSquare(fen);
  if (checkSquare) {
    styles[checkSquare] = { ...(styles[checkSquare] ?? {}), boxShadow: 'inset 0 0 0 4px rgba(220, 38, 38, 0.65)' };
  }

  return styles;
}

function GameCard({ game, onAddError }: { game: SavedGame; onAddError: (game: SavedGame, error: GameError) => void }) {
  const [moveNumber, setMoveNumber] = useState('');
  const [category, setCategory] = useState<ExerciseCategory | 'otro'>('piezas colgadas');
  const [note, setNote] = useState('');

  return (
    <article className="game-card">
      <div className="game-card-header">
        <div>
          <strong>{game.opponent || 'Rival sin indicar'}</strong>
          <span>{new Date(game.date).toLocaleDateString('es-ES')} · {game.color} · {game.result}</span>
        </div>
        {game.link ? <a href={game.link} target="_blank" rel="noreferrer">Abrir partida</a> : null}
      </div>
      {game.notes ? <p>{game.notes}</p> : null}
      <div className="manual-review">
        <h3>Marcar error importante</h3>
        <div className="form-grid">
          <input value={moveNumber} onChange={(event) => setMoveNumber(event.target.value)} placeholder="Jugada, ej. 14..." />
          <select value={category} onChange={(event) => setCategory(event.target.value as ExerciseCategory | 'otro')}>
            {errorCategories.map((item) => (
              <option key={item} value={item}>
                {formatCategoryLabel(item)}
              </option>
            ))}
          </select>
        </div>
        <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Qué se debió revisar antes de mover" />
        <button
          className="secondary-button"
          disabled={!moveNumber.trim() || !note.trim()}
          onClick={() => {
            onAddError(game, { id: crypto.randomUUID(), moveNumber, category, note });
            setMoveNumber('');
            setNote('');
          }}
          type="button"
        >
          <Plus size={18} />
          Añadir error
        </button>
      </div>
      {game.errors.map((error) => (
        <p className="error-note" key={error.id}>
          <strong>Jugada {error.moveNumber} · {formatCategoryLabel(error.category)}:</strong> {error.note}
        </p>
      ))}
    </article>
  );
}
