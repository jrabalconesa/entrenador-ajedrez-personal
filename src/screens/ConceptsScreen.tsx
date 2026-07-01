import { useMemo, useState, type CSSProperties } from 'react';
import { Chess, type Square } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Check, HelpCircle, Lightbulb, RotateCcw, X } from 'lucide-react';
import SectionHeader from '../components/SectionHeader';
import { conceptGroups, tacticalConcepts } from '../data/concepts';
import { boardMoveToSan, kingInCheckSquare, legalDestinations } from '../logic/boardMove';
import { boardNotationOptions } from '../logic/boardStyle';

type Feedback = {
  correct: boolean;
  playedMove: string;
};

type PromotionPiece = 'q' | 'r' | 'b' | 'n';

export default function ConceptsScreen() {
  const [conceptId, setConceptId] = useState(tacticalConcepts[0]?.id ?? '');
  const [manualMove, setManualMove] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [position, setPosition] = useState(tacticalConcepts[0]?.fen ?? 'start');
  const [showPattern, setShowPattern] = useState(false);
  const [promotionPiece, setPromotionPiece] = useState<PromotionPiece>('q');

  const concept = useMemo(() => tacticalConcepts.find((item) => item.id === conceptId) ?? tacticalConcepts[0], [conceptId]);

  const changeConcept = (nextId: string) => {
    const next = tacticalConcepts.find((item) => item.id === nextId) ?? tacticalConcepts[0];
    setConceptId(next.id);
    setPosition(next.fen);
    setManualMove('');
    setFeedback(null);
    setSelectedSquare(null);
    setLastMove(null);
    setShowPattern(false);
    setPromotionPiece('q');
  };

  const submitMove = (moveText: string) => {
    if (!concept || feedback) return;
    const game = new Chess(concept.fen);
    const normalized = moveText.trim();
    if (!normalized) return;

    try {
      const move = game.move(normalized, { strict: false });
      setPosition(game.fen());
      setLastMove({ from: move.from, to: move.to });
      setSelectedSquare(null);
      setFeedback({ correct: sameMove(move.san, concept.expectedMove), playedMove: move.san });
    } catch {
      setFeedback({ correct: false, playedMove: normalized });
    }
  };

  const submitBoardMove = (from: string, to: string) => {
    if (!concept || feedback) return false;
    if (from === to) return false;
    const result = boardMoveToSan(concept.fen, from, to, concept.validation === 'promotion' ? promotionPiece : 'q');
    if (!result) {
      setFeedback({ correct: false, playedMove: 'Jugada ilegal' });
      return false;
    }

    setPosition(result.fen);
    setLastMove({ from: result.from, to: result.to });
    setSelectedSquare(null);
    setFeedback({ correct: sameMove(result.san, concept.expectedMove), playedMove: result.san });
    return true;
  };

  const handleSquareClick = ({ square }: { square: string }) => {
    if (!concept || feedback) return;
    const game = new Chess(concept.fen);
    const clickedPiece = game.get(square as Square);

    if (!selectedSquare) {
      if (clickedPiece?.color === concept.sideToMove) setSelectedSquare(square);
      return;
    }

    if (selectedSquare === square) {
      setSelectedSquare(null);
      return;
    }

    if (clickedPiece?.color === concept.sideToMove) {
      setSelectedSquare(square);
      return;
    }

    if (submitBoardMove(selectedSquare, square)) return;
  };

  const resetExercise = () => {
    if (!concept) return;
    setPosition(concept.fen);
    setManualMove('');
    setFeedback(null);
    setSelectedSquare(null);
    setLastMove(null);
    setShowPattern(false);
    setPromotionPiece('q');
  };

  if (!concept) return null;

  return (
    <section>
      <SectionHeader
        eyebrow="Táctica y estrategia"
        title="Reconoce patrones antes de calcular"
        description="Estudia el concepto, mira la señal en el tablero y resuelve una posición breve para fijarlo."
      />
      <div className="concept-layout">
        <aside className="concept-list">
          {conceptGroups.map((group) => (
            <div className="concept-group" key={group}>
              <strong>{group}</strong>
              {tacticalConcepts
                .filter((item) => item.group === group)
                .map((item) => (
                  <button className={item.id === concept.id ? 'active' : ''} key={item.id} onClick={() => changeConcept(item.id)} type="button">
                    {item.name}
                  </button>
                ))}
            </div>
          ))}
        </aside>
        <div className="concept-board-panel">
          <Chessboard
            options={{
              position,
              onPieceDrop: ({ sourceSquare, targetSquare }) => (targetSquare && sourceSquare !== targetSquare ? submitBoardMove(sourceSquare, targetSquare) : false),
              onSquareClick: handleSquareClick,
              squareStyles: buildSquareStyles(concept.fen, selectedSquare, lastMove),
              boardOrientation: concept.sideToMove === 'b' ? 'black' : 'white',
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
        <aside className="concept-panel">
          <div className="tag-row">
            <span>{concept.group}</span>
            <span>Juegan {concept.sideToMove === 'w' ? 'Blancas' : 'Negras'}</span>
          </div>
          <h2>{concept.name}</h2>
          <p>{concept.definition}</p>
          <div className="concept-rule">
            <strong>Regla práctica</strong>
            <span>{concept.practicalRule}</span>
          </div>
          <h3>{concept.question}</h3>
          {concept.validation === 'promotion' ? (
            <div className="promotion-choice">
              <strong>Pieza de promoción</strong>
              <div>
                <button className={promotionPiece === 'q' ? 'secondary-button compact-action active-choice' : 'secondary-button compact-action'} onClick={() => setPromotionPiece('q')} type="button" disabled={Boolean(feedback)}>
                  Dama
                </button>
                <button className={promotionPiece === 'r' ? 'secondary-button compact-action active-choice' : 'secondary-button compact-action'} onClick={() => setPromotionPiece('r')} type="button" disabled={Boolean(feedback)}>
                  Torre
                </button>
                <button className={promotionPiece === 'b' ? 'secondary-button compact-action active-choice' : 'secondary-button compact-action'} onClick={() => setPromotionPiece('b')} type="button" disabled={Boolean(feedback)}>
                  Alfil
                </button>
                <button className={promotionPiece === 'n' ? 'secondary-button compact-action active-choice' : 'secondary-button compact-action'} onClick={() => setPromotionPiece('n')} type="button" disabled={Boolean(feedback)}>
                  Caballo
                </button>
              </div>
            </div>
          ) : null}
          <form
            className="move-form"
            onSubmit={(event) => {
              event.preventDefault();
              submitMove(manualMove);
            }}
          >
            <label htmlFor="concept-move">Escribir jugada</label>
            <div>
              <input
                id="concept-move"
                placeholder="Ej. Nc7+, O-O o a8=Q+"
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
            <button className="secondary-button" onClick={() => setShowPattern((value) => !value)} type="button" disabled={Boolean(feedback)}>
              <Lightbulb size={18} />
              Ver patrón
            </button>
            <button className="ghost-button" onClick={resetExercise} type="button">
              <RotateCcw size={18} />
              Reiniciar
            </button>
          </div>
          {showPattern && !feedback ? <p className="hint-reveal">{concept.pattern}</p> : null}
          {feedback ? (
            <div className={feedback.correct ? 'feedback correct' : 'feedback wrong'}>
              <strong>
                {feedback.correct ? <Check size={20} /> : <X size={20} />}
                {feedback.correct ? 'Correcto' : 'Revisa la idea'}
              </strong>
              <p>Tu jugada: {feedback.playedMove}. Respuesta esperada: {concept.expectedMove}.</p>
              <p>{concept.explanation}</p>
              <p>
                <HelpCircle size={18} />
                {concept.pattern}
              </p>
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

function sameMove(left: string, right: string): boolean {
  return left.replace(/[+#x=\s]/g, '').toLowerCase() === right.replace(/[+#x=\s]/g, '').toLowerCase();
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
