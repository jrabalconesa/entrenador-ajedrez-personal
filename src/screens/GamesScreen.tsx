import { useRef, useState, type CSSProperties, type ChangeEvent, type DragEvent, type FormEvent } from 'react';
import { Chess, validateFen, type Move, type Square } from 'chess.js';
import { Chessboard, type Arrow } from 'react-chessboard';
import { FileUp, RotateCcw, Save, Undo2 } from 'lucide-react';
import SectionHeader from '../components/SectionHeader';
import { playPositionPresets } from '../data/playPositions';
import { kingInCheckSquare } from '../logic/boardMove';
import { boardNotationOptions } from '../logic/boardStyle';
import { analyzeSavedGameWithStockfish, mergeAutomaticAnalysis, recordGameErrorPractice } from '../logic/gameAnalysis';
import { buildCoachLogDetails } from '../logic/coachDetails';
import { chooseCoachMove, describeCoachMove, getGameStatus, reviewPlayerMove, type CoachLevel } from '../logic/gameCoach';
import { formatCategoryLabel } from '../logic/labels';
import { buildMoveHints, moveHintColor } from '../logic/moveHints';
import { loadGamePreferences, saveGame, saveGamePreferences, updateGame } from '../storage/localStore';
import type { GameError, SavedGame } from '../types';
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
  details: string[];
};
type HistorySort = 'recentes' | 'antiguas' | 'errores' | 'rival';
type ImportMode = 'pgn' | 'fen';

type GameReviewSnapshot = {
  fen: string;
  move: Move | null;
  moveIndex: number;
  comments: CoachLogEntry[];
  errors: GameError[];
};

export default function GamesScreen({ games, onGamesChanged }: GamesScreenProps) {
  const [pgn, setPgn] = useState('');
  const [opponent, setOpponent] = useState('');
  const [color, setColor] = useState<SavedGame['color']>('sin indicar');
  const [result, setResult] = useState('*');
  const [link, setLink] = useState('');
  const [notes, setNotes] = useState('');
  const [fenImport, setFenImport] = useState('');
  const [message, setMessage] = useState('');
  const [guidedSaveMessage, setGuidedSaveMessage] = useState('');
  const [guidedMoveText, setGuidedMoveText] = useState('');
  const [playColor, setPlayColor] = useState<'w' | 'b'>('w');
  const [presetId, setPresetId] = useState(playPositionPresets[0].id);
  const [customFen, setCustomFen] = useState('');
  const [coachLevel, setCoachLevel] = useState<CoachLevel>('intermedio');
  const [learningMode, setLearningMode] = useState(true);
  const [showMoveHints, setShowMoveHints] = useState(() => loadGamePreferences().showMoveHints);
  const [liveGame, setLiveGame] = useState(() => new Chess());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [learningMark, setLearningMark] = useState<{ square: string; signal: LearningSignal } | null>(null);
  const [waitingForCoach, setWaitingForCoach] = useState(false);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: string; to: string } | null>(null);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [detectedErrors, setDetectedErrors] = useState<GameError[]>([]);
  const [activePracticeError, setActivePracticeError] = useState<GameError | null>(null);
  const [reviewedError, setReviewedError] = useState<GameError | null>(null);
  const [analysisMessages, setAnalysisMessages] = useState<Record<string, string>>({});
  const [analyzingGameIds, setAnalyzingGameIds] = useState<Set<string>>(() => new Set());
  const [importOpen, setImportOpen] = useState(false);
  const [importMode, setImportMode] = useState<ImportMode>('pgn');
  const [importDragActive, setImportDragActive] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [reviewGame, setReviewGame] = useState<SavedGame | null>(null);
  const [coachLog, setCoachLog] = useState<CoachLogEntry[]>([logEntry('Elige una posición y juega tus movimientos en el tablero. El rival responderá con jugadas legales.')]);
  const [expandedCoachLog, setExpandedCoachLog] = useState<Set<string>>(() => new Set());
  const [expandedMoveHints, setExpandedMoveHints] = useState<Set<string>>(() => new Set());
  const pieceClickSquareRef = useRef<string | null>(null);
  const importFileInputRef = useRef<HTMLInputElement | null>(null);

  const activePreset = playPositionPresets.find((item) => item.id === presetId) ?? null;
  const isCustomFen = presetId === 'custom-fen';
  const activePositionName = isCustomFen ? 'FEN personalizada' : (activePreset?.name ?? playPositionPresets[0].name);
  const activePositionDescription = isCustomFen ? 'Posición introducida manualmente.' : (activePreset?.description ?? playPositionPresets[0].description);
  const playerTurn = liveGame.turn() === playColor && !liveGame.isGameOver();
  const status = getGameStatus(liveGame);
  const moveHints = showMoveHints ? buildMoveHints(liveGame.fen(), selectedSquare, playerTurn ? playColor : null) : [];
  const moveHintArrows = buildMoveHintArrows(moveHints);
  const toggleCoachLogDetails = (key: string) => {
    setExpandedCoachLog((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };
  const toggleMoveHintDetails = (key: string) => {
    setExpandedMoveHints((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };
  const updateShowMoveHints = (enabled: boolean) => {
    setShowMoveHints(enabled);
    saveGamePreferences({ showMoveHints: enabled });
  };

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
    setImportOpen(false);
    onGamesChanged();
  };

  const submitFenImport = () => {
    const fen = fenImport.trim();
    if (!fen) {
      setMessage('Pega una FEN o carga un archivo antes de importar la posición.');
      return;
    }

    const validation = validateFen(fen);
    if (!validation.ok) {
      setMessage(`La FEN no es válida: ${validation.error ?? 'revisa la posición.'}`);
      return;
    }

    const game = new Chess(fen);
    setLiveGame(game);
    setPlayColor(game.turn());
    setPresetId('custom-fen');
    setCustomFen(fen);
    setSelectedSquare(null);
    setLastMove(null);
    setLearningMark(null);
    setWaitingForCoach(false);
    setPendingPromotion(null);
    setGuidedMoveText('');
    setUndoStack([]);
    setDetectedErrors([]);
    setActivePracticeError(null);
    setReviewedError(null);
    setGuidedSaveMessage('Posición FEN cargada en el tablero.');
    setCoachLog([logEntry('Posición FEN cargada. Puedes practicar desde aquí con el entrenador.')]);
    setMessage('Posición FEN cargada en el tablero.');
    setImportOpen(false);
  };

  const openImportModal = (mode: ImportMode = 'pgn') => {
    setImportMode(mode);
    setImportOpen(true);
    setMessage('');
  };

  const loadImportText = (text: string, fileName?: string) => {
    const content = text.trim();
    if (!content) {
      setMessage('El archivo no contiene texto útil para importar.');
      return;
    }

    const detectedMode: ImportMode = looksLikeFen(content) || fileName?.toLowerCase().endsWith('.fen') ? 'fen' : 'pgn';
    setImportMode(detectedMode);
    if (detectedMode === 'fen') {
      setFenImport(content);
      setMessage('FEN cargada. Revisa el texto y pulsa “Cargar FEN”.');
    } else {
      setPgn(content);
      setMessage('PGN cargado. Revisa los datos y pulsa “Guardar partida”.');
    }
  };

  const readImportFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => loadImportText(String(reader.result ?? ''), file.name);
    reader.onerror = () => setMessage('No se pudo leer el archivo seleccionado.');
    reader.readAsText(file);
  };

  const handleImportFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    readImportFile(event.target.files?.[0] ?? null);
    event.target.value = '';
  };

  const handleImportDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setImportDragActive(false);
    readImportFile(event.dataTransfer.files[0] ?? null);
  };

  const analyzeGame = async (game: SavedGame) => {
    setAnalyzingGameIds((current) => new Set(current).add(game.id));
    setAnalysisMessages((current) => ({ ...current, [game.id]: 'Analizando partida. Si Stockfish no está instalado, se usará el análisis interno.' }));

    const analysis = await analyzeSavedGameWithStockfish(game, { movetimeMs: 300, timeoutMs: 1800, maxMoves: 10 });

    if (analysis.analyzedMoves > 0 || analysis.errors.length > 0) {
      updateGame(mergeAutomaticAnalysis(game, analysis));
      onGamesChanged();
    }

    setAnalysisMessages((current) => ({ ...current, [game.id]: analysis.message }));
    setAnalyzingGameIds((current) => {
      const next = new Set(current);
      next.delete(game.id);
      return next;
    });
  };

  const practiceErrorPosition = (error: GameError) => {
    if (!error.fenBefore) return;

    try {
      const game = new Chess(error.fenBefore);
      setLiveGame(game);
      setPlayColor(game.turn());
      setPresetId('custom-fen');
      setCustomFen(error.fenBefore);
      setSelectedSquare(null);
      setLastMove(null);
      setLearningMark(null);
      setWaitingForCoach(false);
      setPendingPromotion(null);
      setGuidedMoveText('');
      setUndoStack([]);
      setDetectedErrors([]);
      setActivePracticeError(error);
      setReviewedError(error);
      setGuidedSaveMessage('');
      setCoachLog(buildErrorReviewLog(error));
    } catch {
      setCoachLog([logEntry('No se pudo cargar la posición crítica de ese aviso.', 'error')]);
    }
  };

  const recordPracticeResult = (error: GameError, correct: boolean) => {
    const game = games.find((savedGame) => savedGame.errors.some((savedError) => savedError.id === error.id));
    if (!game) return;

    updateGame(recordGameErrorPractice(game, error.id, correct));
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
    setGuidedMoveText('');
    setUndoStack([]);
    setDetectedErrors([]);
    setActivePracticeError(null);
    setReviewedError(null);
    setGuidedSaveMessage('');
    setCoachLog(learningMode ? [...openingLog, ...response.comments] : []);
  };

  const finishPlayerMove = (beforeFen: string, game: Chess, playerMove: Move) => {
    const playerReview = reviewPlayerMove(playerMove);
    const newErrors = playerReview.errors.map((error) => ({ ...error, id: crypto.randomUUID(), source: 'automatic' as const }));
    const shouldPauseForLearning = learningMode && playerReview.signal !== 'green' && !game.isGameOver();
    const practiceFeedback = activePracticeError ? buildCriticalPracticeFeedback(activePracticeError, playerMove.san) : null;
    const practiceCorrect = activePracticeError ? isCriticalPracticeCorrect(activePracticeError, playerMove.san) : null;

    setGuidedSaveMessage('');
    setGuidedMoveText('');
    setSelectedSquare(null);
    setPendingPromotion(null);
    setUndoStack((current) => [beforeFen, ...current].slice(0, 12));
    setDetectedErrors((current) => [...newErrors, ...current].slice(0, 12));
    setLearningMark(learningMode ? { square: playerMove.to, signal: playerReview.signal } : null);
    if (activePracticeError && practiceCorrect !== null) recordPracticeResult(activePracticeError, practiceCorrect);
    setActivePracticeError(null);
    setReviewedError(null);

    if (shouldPauseForLearning) {
      setLiveGame(game);
      setLastMove({ from: playerMove.from, to: playerMove.to });
      setWaitingForCoach(true);
      setCoachLog((current) => [
        ...(practiceFeedback ? [practiceFeedback] : []),
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
    if (learningMode || practiceFeedback) {
      setCoachLog((current) => [
        ...(nextStatus ? [logEntry(nextStatus)] : []),
        ...(learningMode ? response.comments : []),
        ...(practiceFeedback ? [practiceFeedback] : []),
        ...(learningMode ? [logEntry(playerReview.comment, playerReview.hasError ? 'error' : 'neutral')] : []),
        ...current
      ].slice(0, 8));
    } else if (nextStatus) {
      setCoachLog([logEntry(nextStatus)]);
    }
    return true;
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

    return finishPlayerMove(beforeFen, game, playerMove);
  };

  const submitGuidedMoveText = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!playerTurn) return;

    const moveText = guidedMoveText.trim();
    if (!moveText) return;

    const beforeFen = liveGame.fen();
    const game = new Chess(beforeFen);

    try {
      const playerMove = game.move(moveText, { strict: false });
      finishPlayerMove(beforeFen, game, playerMove);
    } catch {
      setCoachLog((current) => [logEntry('Esa jugada no es legal en esta posición.', 'error'), ...current].slice(0, 8));
    }
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

  const handleBoardClick = (square: string) => {
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

  const saveGuidedGame = () => {
    const playedPgn = liveGame.pgn() || '*';
    const reviewNotes = buildSavedGameReview(activePositionName, activePositionDescription, liveGame, detectedErrors);
    saveGame({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      pgn: playedPgn,
      color: playColor === 'w' ? 'blancas' : 'negras',
      result: getResultFromGame(liveGame),
      opponent: 'Entrenador guiado',
      notes: reviewNotes,
      errors: detectedErrors
    });
    setGuidedSaveMessage('Partida guardada correctamente en tu historial.');
    setCoachLog([
      logEntry('Partida guardada correctamente. Se ha añadido un resumen general para revisarla después.'),
      logEntry(reviewNotes)
    ]);
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
    setGuidedMoveText('');
    setActivePracticeError(null);
    setCoachLog((current) => (
      learningMode
        ? [logEntry('Último turno deshecho. Repite la posición con otra idea. Si la jugada anterior fue marcada como error, queda registrada para tus repasos.', 'error'), ...current].slice(0, 8)
        : current
    ));
  };

  const openSavedGameOnBoard = (game: SavedGame) => {
    try {
      const loadedGame = new Chess();
      loadedGame.loadPgn(game.pgn);
      setLiveGame(loadedGame);
      setPlayColor(game.color === 'negras' ? 'b' : 'w');
      setPresetId('custom-fen');
      setCustomFen(loadedGame.fen());
      setSelectedSquare(null);
      setLastMove(null);
      setLearningMark(null);
      setWaitingForCoach(false);
      setPendingPromotion(null);
      setGuidedMoveText('');
      setUndoStack([]);
      setDetectedErrors(game.errors);
      setActivePracticeError(null);
      setReviewedError(null);
      setGuidedSaveMessage('Partida guardada abierta en el tablero.');
      setCoachLog([
        logEntry(`Partida abierta: ${game.opponent || 'Rival sin indicar'} (${game.result}).`),
        ...(game.notes ? [logEntry(game.notes)] : [])
      ]);
    } catch {
      setGuidedSaveMessage('');
      setCoachLog([logEntry('No se pudo abrir esta partida en el tablero. Revisa que el PGN guardado sea válido.', 'error')]);
    }
  };

  const openGameReview = (game: SavedGame) => {
    setReviewGame(game);
    setHistoryOpen(false);
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
          <label className="learning-mode-toggle">
            <input checked={showMoveHints} onChange={(event) => updateShowMoveHints(event.target.checked)} type="checkbox" />
            <span>Pistas de jugadas</span>
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
          <form className="guided-move-form" onSubmit={submitGuidedMoveText}>
            <label htmlFor="guided-move">Jugada</label>
            <div>
              <input
                id="guided-move"
                value={guidedMoveText}
                onChange={(event) => setGuidedMoveText(event.target.value)}
                placeholder="Ej. Bxd7+"
                disabled={!playerTurn}
              />
              <button className="secondary-button compact-action" disabled={!playerTurn || !guidedMoveText.trim()} type="submit">
                Jugar
              </button>
            </div>
          </form>
        </div>
        <div className="guided-game-layout">
          <div className="board-panel">
            <Chessboard
              options={{
                position: liveGame.fen(),
                boardOrientation: playColor === 'b' ? 'black' : 'white',
                arrows: moveHintArrows,
                allowDrawingArrows: false,
                clearArrowsOnClick: false,
                onPieceDrop: ({ sourceSquare, targetSquare }) => (targetSquare && sourceSquare !== targetSquare ? submitBoardMove(sourceSquare, targetSquare) : false),
                onPieceClick: handlePieceClick,
                onSquareClick: handleSquareClick,
                squareStyles: buildGuidedSquareStyles(liveGame.fen(), selectedSquare, lastMove, learningMark, moveHints),
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
            {reviewedError ? <ErrorReviewPanel error={reviewedError} /> : null}
            {moveHints.length > 0 ? (
              <div className="move-hint-list">
                <strong>Candidatas de la pieza seleccionada</strong>
                {moveHints.map((hint) => {
                  const hintKey = `${hint.from}-${hint.to}-${hint.san}`;
                  const expanded = expandedMoveHints.has(hintKey);
                  return (
                    <article className="move-hint-row" key={hintKey}>
                      <span className={`move-hint-signal ${hint.signal}`}>{formatMoveHintSignal(hint.signal)}</span>
                      <span className="move-hint-san">
                        {hint.san}
                        {hint.recommended ? <small>Recomendada</small> : null}
                      </span>
                      <span>{hint.reason}</span>
                      <div className="move-hint-actions">
                        <button className="coach-detail-toggle" onClick={() => toggleMoveHintDetails(hintKey)} type="button">
                          {expanded ? 'Ocultar' : 'Explicar'}
                        </button>
                        <button className="secondary-button compact-action" onClick={() => submitBoardMove(hint.from, hint.to)} type="button">
                          Jugar
                        </button>
                      </div>
                      {expanded ? (
                        <div className="move-hint-detail">
                          {hint.details.map((detail) => (
                            <p key={detail}>{detail}</p>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            ) : null}
            <div className="coach-log">
              {coachLog.map((item, index) => {
                const entryKey = `${item.text}-${index}`;
                const expanded = expandedCoachLog.has(entryKey);
                return (
                  <article className={['coach-log-entry', index === 0 ? 'coach-log-latest' : '', item.tone === 'error' ? 'coach-log-error' : ''].filter(Boolean).join(' ')} key={entryKey}>
                    <p>{item.text}</p>
                    <button className="coach-detail-toggle" onClick={() => toggleCoachLogDetails(entryKey)} type="button">
                      {expanded ? 'Ocultar explicación' : 'Ver explicación'}
                    </button>
                    {expanded ? (
                      <div className="coach-detail">
                        {item.details.map((detail) => (
                          <p key={detail}>{detail}</p>
                        ))}
                      </div>
                    ) : null}
                  </article>
                );
              })}
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
        <div className="import-access-panel">
          <div>
            <h2>Importar partida o posición</h2>
            <p>Pega texto, busca un archivo o arrástralo. Las partidas PGN se guardan en el histórico; las FEN se cargan en el tablero.</p>
          </div>
          <div className="import-access-actions">
            <button className="primary-button" onClick={() => openImportModal('pgn')} type="button">
              <FileUp size={18} />
              Importar
            </button>
            <button className="secondary-button compact-action" onClick={() => openImportModal('fen')} type="button">
              FEN
            </button>
          </div>
          {message ? <p className="form-message">{message}</p> : null}
        </div>
        <div className="history-access-panel">
          <div>
            <h2>Histórico de partidas</h2>
            <p>
              {games.length > 0
                ? `${games.length} partida${games.length === 1 ? '' : 's'} guardada${games.length === 1 ? '' : 's'}. Abre el histórico para buscar, ordenar y revisar sin llenar esta pantalla.`
                : 'Todavía no hay partidas guardadas.'}
            </p>
          </div>
          <button className="primary-button" disabled={games.length === 0} onClick={() => setHistoryOpen(true)} type="button">
            Abrir histórico
          </button>
        </div>
      </div>
      {historyOpen ? (
        <GameHistoryModal
          analysisMessages={analysisMessages}
          analyzingGameIds={analyzingGameIds}
          games={games}
          onAnalyze={analyzeGame}
          onClose={() => setHistoryOpen(false)}
          onOpenGame={openSavedGameOnBoard}
          onPracticeError={practiceErrorPosition}
          onReviewGame={openGameReview}
        />
      ) : null}
      {importOpen ? (
        <ImportGameModal
          color={color}
          dragActive={importDragActive}
          fenImport={fenImport}
          fileInputRef={importFileInputRef}
          importMode={importMode}
          link={link}
          message={message}
          notes={notes}
          opponent={opponent}
          pgn={pgn}
          result={result}
          onClose={() => setImportOpen(false)}
          onDragActiveChange={setImportDragActive}
          onDrop={handleImportDrop}
          onFileChange={handleImportFileChange}
          onModeChange={setImportMode}
          onNotesChange={setNotes}
          onColorChange={setColor}
          onFenChange={setFenImport}
          onLinkChange={setLink}
          onOpponentChange={setOpponent}
          onPgnChange={setPgn}
          onResultChange={setResult}
          onSubmitFen={submitFenImport}
          onSubmitPgn={submitGame}
        />
      ) : null}
      {reviewGame ? (
        <GameReviewModal
          game={reviewGame}
          onClose={() => setReviewGame(null)}
          onPracticeError={practiceErrorPosition}
        />
      ) : null}
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
  return { text, tone, details: buildCoachLogDetails(text) };
}

function buildMoveHintArrows(moveHints: ReturnType<typeof buildMoveHints>): Arrow[] {
  return moveHints.map((hint) => ({
    startSquare: hint.from,
    endSquare: hint.to,
    color: moveHintColor(hint.signal)
  }));
}

function formatMoveHintSignal(signal: 'green' | 'orange' | 'red'): string {
  if (signal === 'green') return 'Verde';
  if (signal === 'orange') return 'Naranja';
  return 'Rojo';
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

function buildSavedGameReview(positionName: string, positionDescription: string, game: Chess, errors: GameError[]): string {
  const history = game.history();
  const result = getResultFromGame(game);
  const automaticErrors = errors.filter((error) => error.source === 'automatic' || !error.source);
  const mainCategories = [...new Set(errors.slice(0, 3).map((error) => formatCategoryLabel(error.category)))];
  const reviewPriority = errors[0]
    ? `Primera posición a revisar: jugada ${errors[0].moveNumber}${errors[0].playedMove ? ` (${errors[0].playedMove})` : ''}. ${errors[0].suggestedMove ? `Busca la alternativa ${errors[0].suggestedMove}.` : errors[0].note}`
    : 'No se detectaron errores claros durante la partida guiada; conviene repasar planes, cambios y seguridad del rey.';

  return [
    `Resumen general: ${positionName}. ${positionDescription}`,
    `Resultado: ${result}. Jugadas registradas: ${history.length}.`,
    `Avisos para repasar: ${errors.length}${automaticErrors.length > 0 ? ` (${automaticErrors.length} automáticos)` : ''}.`,
    mainCategories.length > 0 ? `Temas principales: ${mainCategories.join(', ')}.` : 'Temas principales: coordinación, amenazas y actividad de piezas.',
    reviewPriority
  ].join('\n');
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
  learningMark: { square: string; signal: LearningSignal } | null,
  moveHints: ReturnType<typeof buildMoveHints>
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
    for (const hint of moveHints) {
      styles[hint.to] = { ...(styles[hint.to] ?? {}), ...getMoveHintSquareStyle(hint.signal, hint.recommended) };
    }
  }

  const checkSquare = kingInCheckSquare(fen);
  if (checkSquare) {
    styles[checkSquare] = { ...(styles[checkSquare] ?? {}), boxShadow: 'inset 0 0 0 4px rgba(220, 38, 38, 0.65)' };
  }

  return styles;
}

function getMoveHintSquareStyle(signal: 'green' | 'orange' | 'red', recommended: boolean): CSSProperties {
  const colors = {
    green: 'rgba(22, 163, 74, 0.72)',
    orange: 'rgba(245, 158, 11, 0.78)',
    red: 'rgba(220, 38, 38, 0.78)'
  };
  const fills = {
    green: 'rgba(187, 247, 208, 0.28)',
    orange: 'rgba(254, 215, 170, 0.3)',
    red: 'rgba(254, 202, 202, 0.32)'
  };
  return {
    background: fills[signal],
    boxShadow: recommended
      ? `inset 0 0 0 5px ${colors[signal]}, inset 0 0 0 9px rgba(255, 255, 255, 0.55)`
      : `inset 0 0 0 4px ${colors[signal]}`
  };
}

function ImportGameModal({
  color,
  dragActive,
  fenImport,
  fileInputRef,
  importMode,
  link,
  message,
  notes,
  opponent,
  pgn,
  result,
  onClose,
  onColorChange,
  onDragActiveChange,
  onDrop,
  onFenChange,
  onFileChange,
  onLinkChange,
  onModeChange,
  onNotesChange,
  onOpponentChange,
  onPgnChange,
  onResultChange,
  onSubmitFen,
  onSubmitPgn
}: {
  color: SavedGame['color'];
  dragActive: boolean;
  fenImport: string;
  fileInputRef: { current: HTMLInputElement | null };
  importMode: ImportMode;
  link: string;
  message: string;
  notes: string;
  opponent: string;
  pgn: string;
  result: string;
  onClose: () => void;
  onColorChange: (color: SavedGame['color']) => void;
  onDragActiveChange: (active: boolean) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onFenChange: (fen: string) => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onLinkChange: (link: string) => void;
  onModeChange: (mode: ImportMode) => void;
  onNotesChange: (notes: string) => void;
  onOpponentChange: (opponent: string) => void;
  onPgnChange: (pgn: string) => void;
  onResultChange: (result: string) => void;
  onSubmitFen: () => void;
  onSubmitPgn: () => void;
}) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Importar partida o posición">
      <section className="import-modal">
        <div className="modal-header">
          <div>
            <h2>Importar partida o posición</h2>
            <p>PGN para partidas completas. FEN para cargar una posición en el tablero.</p>
          </div>
          <button className="ghost-button compact-action" onClick={onClose} type="button">
            Cerrar
          </button>
        </div>
        <div className="import-mode-tabs" role="tablist" aria-label="Tipo de importación">
          <button className={`import-mode-button ${importMode === 'pgn' ? 'active-choice' : 'secondary-button'}`} onClick={() => onModeChange('pgn')} type="button">
            PGN
          </button>
          <button className={`import-mode-button ${importMode === 'fen' ? 'active-choice' : 'secondary-button'}`} onClick={() => onModeChange('fen')} type="button">
            FEN
          </button>
        </div>
        <div
          className={`import-drop-zone${dragActive ? ' drag-active' : ''}`}
          onDragEnter={(event) => {
            event.preventDefault();
            onDragActiveChange(true);
          }}
          onDragLeave={() => onDragActiveChange(false)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={onDrop}
        >
          <input accept=".pgn,.fen,.txt" hidden onChange={onFileChange} ref={fileInputRef} type="file" />
          <strong>Arrastra aquí un archivo .pgn, .fen o .txt</strong>
          <span>También puedes buscarlo en tu ordenador o pegar el texto debajo.</span>
          <button className="secondary-button compact-action" onClick={() => fileInputRef.current?.click()} type="button">
            Buscar archivo
          </button>
        </div>
        {importMode === 'pgn' ? (
          <div className="import-form-grid">
            <label className="import-main-text">
              PGN
              <textarea value={pgn} onChange={(event) => onPgnChange(event.target.value)} placeholder="[Event &quot;Partida rápida&quot;]&#10;1. e4 e5 2. Nf3 Nc6 ..." />
            </label>
            <div className="form-grid">
              <label>
                Color jugado
                <select value={color} onChange={(event) => onColorChange(event.target.value as SavedGame['color'])}>
                  <option>sin indicar</option>
                  <option>blancas</option>
                  <option>negras</option>
                </select>
              </label>
              <label>
                Resultado
                <select value={result} onChange={(event) => onResultChange(event.target.value)}>
                  <option>*</option>
                  <option>1-0</option>
                  <option>0-1</option>
                  <option>1/2-1/2</option>
                </select>
              </label>
              <label>
                Rival
                <input value={opponent} onChange={(event) => onOpponentChange(event.target.value)} placeholder="Nombre o usuario" />
              </label>
              <label>
                Enlace opcional
                <input value={link} onChange={(event) => onLinkChange(event.target.value)} placeholder="https://..." />
              </label>
            </div>
            <label>
              Observaciones
              <textarea value={notes} onChange={(event) => onNotesChange(event.target.value)} placeholder="Qué sentiste, dónde dudaste, qué quieres revisar..." />
            </label>
            <button className="primary-button" onClick={onSubmitPgn} type="button">
              <Save size={18} />
              Guardar partida
            </button>
          </div>
        ) : (
          <div className="import-form-grid">
            <label className="import-main-text">
              FEN
              <textarea value={fenImport} onChange={(event) => onFenChange(event.target.value)} placeholder="Ej. rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" />
            </label>
            <button className="primary-button" onClick={onSubmitFen} type="button">
              Cargar FEN en tablero
            </button>
          </div>
        )}
        {message ? <p className="form-message">{message}</p> : null}
      </section>
    </div>
  );
}

function GameHistoryModal({
  analysisMessages,
  analyzingGameIds,
  games,
  onAnalyze,
  onClose,
  onOpenGame,
  onPracticeError,
  onReviewGame
}: {
  analysisMessages: Record<string, string>;
  analyzingGameIds: Set<string>;
  games: SavedGame[];
  onAnalyze: (game: SavedGame) => void;
  onClose: () => void;
  onOpenGame: (game: SavedGame) => void;
  onPracticeError: (error: GameError) => void;
  onReviewGame: (game: SavedGame) => void;
}) {
  const [query, setQuery] = useState('');
  const [colorFilter, setColorFilter] = useState<SavedGame['color'] | 'todas'>('todas');
  const [resultFilter, setResultFilter] = useState('todos');
  const [sortBy, setSortBy] = useState<HistorySort>('recentes');
  const visibleGames = filterAndSortGames(games, query, colorFilter, resultFilter, sortBy);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Histórico de partidas">
      <section className="history-modal">
        <div className="modal-header">
          <div>
            <h2>Histórico de partidas</h2>
            <p>{visibleGames.length} de {games.length} partida{games.length === 1 ? '' : 's'}</p>
          </div>
          <button className="ghost-button compact-action" onClick={onClose} type="button">
            Cerrar
          </button>
        </div>
        <div className="history-filters">
          <label>
            Buscar
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rival, nota o jugada" />
          </label>
          <label>
            Color
            <select value={colorFilter} onChange={(event) => setColorFilter(event.target.value as SavedGame['color'] | 'todas')}>
              <option value="todas">Todos</option>
              <option value="blancas">Blancas</option>
              <option value="negras">Negras</option>
              <option value="sin indicar">Sin indicar</option>
            </select>
          </label>
          <label>
            Resultado
            <select value={resultFilter} onChange={(event) => setResultFilter(event.target.value)}>
              <option value="todos">Todos</option>
              <option value="1-0">1-0</option>
              <option value="0-1">0-1</option>
              <option value="1/2-1/2">1/2-1/2</option>
              <option value="*">*</option>
            </select>
          </label>
          <label>
            Orden
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value as HistorySort)}>
              <option value="recentes">Más recientes</option>
              <option value="antiguas">Más antiguas</option>
              <option value="errores">Más avisos</option>
              <option value="rival">Rival</option>
            </select>
          </label>
        </div>
        <div className="history-list">
          {visibleGames.length === 0 ? <p className="empty-state">No hay partidas con esos filtros.</p> : null}
          {visibleGames.map((game) => {
            const info = getSavedGameInfo(game);
            const firstPracticeError = game.errors.find((error) => error.fenBefore);
            const isAnalyzing = analyzingGameIds.has(game.id);
            return (
              <article className="history-row" key={game.id}>
                <div>
                  <strong>{game.opponent || 'Rival sin indicar'}</strong>
                  <span>{info.date} · {game.color} · {game.result} · {info.moves} jugadas</span>
                </div>
                <div className="history-row-summary">
                  <span>{game.errors.length} aviso{game.errors.length === 1 ? '' : 's'}</span>
                  <span>{game.notes ? 'Con resumen' : 'Sin resumen'}</span>
                </div>
                <div className="history-row-actions">
                  <button className="primary-button compact-action" onClick={() => onReviewGame(game)} type="button">
                    Revisar partida
                  </button>
                  <button className="secondary-button compact-action" onClick={() => onAnalyze(game)} type="button" disabled={isAnalyzing}>
                    {isAnalyzing ? 'Analizando...' : 'Analizar'}
                  </button>
                  <button className="secondary-button compact-action" onClick={() => onOpenGame(game)} type="button">
                    Abrir tablero
                  </button>
                  {firstPracticeError ? (
                    <button className="secondary-button compact-action" onClick={() => onPracticeError(firstPracticeError)} type="button">
                      Primer error
                    </button>
                  ) : null}
                </div>
                {analysisMessages[game.id] ? <p className="form-message">{analysisMessages[game.id]}</p> : null}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function GameReviewModal({ game, onClose, onPracticeError }: { game: SavedGame; onClose: () => void; onPracticeError: (error: GameError) => void }) {
  const [ply, setPly] = useState(0);
  const snapshots = buildGameReviewSnapshots(game);
  const current = snapshots[Math.min(ply, snapshots.length - 1)] ?? buildEmptyReviewSnapshot();
  const canGoBack = ply > 0;
  const canGoForward = ply < snapshots.length - 1;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Revisión de partida">
      <section className="review-modal">
        <div className="modal-header">
          <div>
            <h2>{game.opponent || 'Rival sin indicar'}</h2>
            <p>{new Date(game.date).toLocaleDateString('es-ES')} · {game.color} · {game.result}</p>
          </div>
          <button className="ghost-button compact-action" onClick={onClose} type="button">
            Cerrar
          </button>
        </div>
        <div className="review-layout">
          <div className="review-board-panel">
            <Chessboard
              options={{
                position: current.fen,
                boardOrientation: game.color === 'negras' ? 'black' : 'white',
                allowDragging: false,
                boardStyle: {
                  width: 'min(100%, 460px)',
                  borderRadius: '8px',
                  boxShadow: '0 16px 40px rgba(30, 41, 59, 0.16)'
                },
                darkSquareStyle: { backgroundColor: '#77906f' },
                lightSquareStyle: { backgroundColor: '#eef0d8' },
                ...boardNotationOptions
              }}
            />
            <div className="review-controls">
              <button className="secondary-button compact-action" disabled={!canGoBack} onClick={() => setPly((currentPly) => Math.max(0, currentPly - 1))} type="button">
                Anterior
              </button>
              <span>{current.moveIndex} / {snapshots.length - 1}</span>
              <button className="secondary-button compact-action" disabled={!canGoForward} onClick={() => setPly((currentPly) => Math.min(snapshots.length - 1, currentPly + 1))} type="button">
                Siguiente
              </button>
            </div>
          </div>
          <aside className="review-comments">
            <h3>{current.move ? `Jugada ${current.moveIndex}: ${current.move.san}` : 'Posición inicial'}</h3>
            {current.comments.map((comment, index) => (
              <article className={['coach-log-entry', comment.tone === 'error' ? 'coach-log-error' : ''].filter(Boolean).join(' ')} key={`${comment.text}-${index}`}>
                <p>{comment.text}</p>
                <div className="coach-detail">
                  {comment.details.slice(0, 3).map((detail) => (
                    <p key={detail}>{detail}</p>
                  ))}
                </div>
              </article>
            ))}
            {current.errors.length > 0 ? (
              <div className="review-error-list">
                <strong>Errores en esta posición</strong>
                {current.errors.map((error) => (
                  <div className="error-note" key={error.id}>
                    <span>
                      <strong>{formatSeverity(error)}{formatCategoryLabel(error.category)}</strong>
                      {error.note}
                    </span>
                    {error.fenBefore ? (
                      <button className="secondary-button compact-action" onClick={() => onPracticeError(error)} type="button">
                        Revisar
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
            {game.notes ? <p className="hint-box compact-note">{game.notes}</p> : null}
          </aside>
        </div>
      </section>
    </div>
  );
}

function filterAndSortGames(
  games: SavedGame[],
  query: string,
  colorFilter: SavedGame['color'] | 'todas',
  resultFilter: string,
  sortBy: HistorySort
): SavedGame[] {
  const normalizedQuery = query.trim().toLowerCase();

  return [...games]
    .filter((game) => {
      if (colorFilter !== 'todas' && game.color !== colorFilter) return false;
      if (resultFilter !== 'todos' && game.result !== resultFilter) return false;
      if (!normalizedQuery) return true;

      const searchable = [
        game.opponent,
        game.notes,
        game.pgn,
        game.result,
        game.color,
        ...game.errors.flatMap((error) => [error.moveNumber, error.playedMove, error.suggestedMove, error.note, formatCategoryLabel(error.category)])
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    })
    .sort((left, right) => {
      if (sortBy === 'antiguas') return new Date(left.date).getTime() - new Date(right.date).getTime();
      if (sortBy === 'errores') return right.errors.length - left.errors.length || new Date(right.date).getTime() - new Date(left.date).getTime();
      if (sortBy === 'rival') return (left.opponent || 'Rival sin indicar').localeCompare(right.opponent || 'Rival sin indicar', 'es');
      return new Date(right.date).getTime() - new Date(left.date).getTime();
    });
}

function getSavedGameInfo(game: SavedGame): { date: string; moves: number } {
  const parsedGame = loadPgnGame(game.pgn);
  return {
    date: new Date(game.date).toLocaleDateString('es-ES'),
    moves: parsedGame ? parsedGame.history().length : 0
  };
}

function buildGameReviewSnapshots(game: SavedGame): GameReviewSnapshot[] {
  const parsedGame = loadPgnGame(game.pgn);
  if (!parsedGame) {
    return [buildEmptyReviewSnapshot('No se pudo cargar el PGN de esta partida. Revisa el texto guardado o vuelve a importarla.')];
  }

  const moves = parsedGame.history({ verbose: true });
  const initialFen = moves[0]?.before ?? new Chess().fen();
  const snapshots: GameReviewSnapshot[] = [
    {
      fen: initialFen,
      move: null,
      moveIndex: 0,
      comments: [logEntry('Posición inicial de la partida guardada. Avanza jugada a jugada para revisar decisiones y comentarios.')],
      errors: game.errors.filter((error) => !error.fenBefore && error.moveNumber === '1.')
    }
  ];

  for (const [index, historicalMove] of moves.entries()) {
    const review = reviewPlayerMove(historicalMove);
    const moveErrors = game.errors.filter((error) => matchesGameError(error, historicalMove));
    const comments = [
      logEntry(`${historicalMove.color === 'w' ? 'Blancas' : 'Negras'} juega ${historicalMove.san}.`),
      logEntry(review.comment, review.hasError ? 'error' : 'neutral'),
      ...moveErrors.flatMap(buildErrorReviewLog)
    ];

    snapshots.push({
      fen: historicalMove.after,
      move: historicalMove,
      moveIndex: index + 1,
      comments,
      errors: moveErrors
    });
  }

  return snapshots;
}

function buildEmptyReviewSnapshot(message = 'No hay jugadas para revisar.'): GameReviewSnapshot {
  return {
    fen: new Chess().fen(),
    move: null,
    moveIndex: 0,
    comments: [logEntry(message)],
    errors: []
  };
}

function loadPgnGame(pgn: string): Chess | null {
  try {
    const game = new Chess();
    game.loadPgn(pgn);
    return game;
  } catch {
    return null;
  }
}

function looksLikeFen(text: string): boolean {
  const fields = text.trim().split(/\s+/);
  return fields.length >= 4 && fields[0].includes('/') && /^[wb]$/.test(fields[1]) && /^(-|[KQkq]+)$/.test(fields[2]);
}

function matchesGameError(error: GameError, move: Move): boolean {
  if (error.fenBefore && error.fenBefore === move.before) return true;
  if (!error.playedMove || !sameSanMove(error.playedMove, move.san)) return false;
  return !error.moveNumber || error.moveNumber === getMoveNumberLabel(move.before);
}

function getMoveNumberLabel(fen: string): string {
  const parts = fen.split(' ');
  const fullMove = parts[5] ?? '1';
  return `${fullMove}${parts[1] === 'b' ? '...' : '.'}`;
}

function formatSeverity(error: GameError): string {
  if (!error.severity) return '';
  if (error.severity === 'grave') return 'Grave · ';
  if (error.severity === 'error') return 'Error · ';
  return 'Imprecisión · ';
}

function ErrorReviewPanel({ error }: { error: GameError }) {
  const points = buildErrorReviewPoints(error);

  return (
    <div className="error-review-panel">
      <strong>Revisión del error</strong>
      <span>
        Jugada {error.moveNumber}{error.playedMove ? ` · ${error.playedMove}` : ''} · {formatCategoryLabel(error.category)}
      </span>
      {points.map((point) => (
        <p key={point}>{point}</p>
      ))}
    </div>
  );
}

function buildErrorReviewLog(error: GameError): CoachLogEntry[] {
  return [
    logEntry(
      `Revisión del error: jugada ${error.moveNumber}${error.playedMove ? ` ${error.playedMove}` : ''}. ${error.suggestedMove ? `La alternativa a calcular era ${error.suggestedMove}.` : 'Busca qué amenaza concreta había que resolver.'}`,
      'error'
    ),
    ...buildErrorReviewPoints(error).map((point) => logEntry(point, error.severity === 'grave' || error.severity === 'error' ? 'error' : 'neutral'))
  ];
}

function buildErrorReviewPoints(error: GameError): string[] {
  const points = [`Por qué revisarla: ${error.note}`];

  if (error.suggestedMove) {
    points.push(`Qué se debería haber calculado: ${error.suggestedMove}. Compara esa jugada con lo que se jugó y mira qué amenaza resuelve o qué recurso gana.`);
  }

  if (error.evaluationLoss) {
    points.push(`Consecuencia práctica: la evaluación aproximada bajó unos ${error.evaluationLoss} centipeones, así que el rival obtuvo una oportunidad clara.`);
  } else if (error.category === 'amenazas del rival') {
    points.push('Consecuencia práctica: el rival podía ganar tiempo con una amenaza directa, normalmente un jaque, captura o ataque sobre una pieza indefensa.');
  } else if (error.category === 'piezas colgadas') {
    points.push('Consecuencia práctica: una pieza quedó atacada sin defensa suficiente, lo que suele perder material o forzar una posición pasiva.');
  } else {
    points.push('Consecuencia práctica: la posición se volvió más difícil de jugar porque no se resolvió la prioridad principal.');
  }

  points.push('Cómo repasarla: en el tablero, calcula tu jugada candidata, la mejor respuesta del rival y una continuación corta.');
  return points;
}

function buildCriticalPracticeFeedback(error: GameError, playedSan: string): CoachLogEntry {
  if (!error.suggestedMove) {
    return logEntry(`Has repetido la posición crítica con ${playedSan}. Revisa ahora si resolviste la amenaza principal.`);
  }

  if (isCriticalPracticeCorrect(error, playedSan)) {
    return logEntry(`Correcto: encontraste ${playedSan}, la alternativa que queríamos practicar en esta posición.`);
  }

  return logEntry(`Todavía no: jugaste ${playedSan}, pero aquí queríamos calcular ${error.suggestedMove}. Vuelve a deshacer y busca esa idea.`, 'error');
}

function isCriticalPracticeCorrect(error: GameError, playedSan: string): boolean {
  return Boolean(error.suggestedMove && sameSanMove(playedSan, error.suggestedMove));
}

function sameSanMove(left: string, right: string): boolean {
  return stripSanSuffix(left) === stripSanSuffix(right);
}

function stripSanSuffix(move: string): string {
  return move.trim().replace(/[+#?!]+$/g, '');
}
