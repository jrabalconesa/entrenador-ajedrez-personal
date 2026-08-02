import { useMemo, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { openingLearning } from '../data/openingLearning';
import { openingCourses } from '../data/openings';
import { getOpeningWeakMotifs, getRecommendedOpening, getWeeklyOpeningStep } from '../logic/openingLearning';
import { boardNotationOptions } from '../logic/boardStyle';
import { loadOpeningAttempts, saveOpeningAttempt } from '../storage/localStore';
import type { OpeningCourse } from '../types';

type LearningTab = 'lesson' | 'quiz' | 'model' | 'week';

export default function OpeningLearningPanel({ course, onCourseChange }: { course: OpeningCourse; onCourseChange: (courseId: string) => void }) {
  const content = openingLearning[course.id];
  const [tab, setTab] = useState<LearningTab>('lesson');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [attemptVersion, setAttemptVersion] = useState(0);
  const attempts = useMemo(() => loadOpeningAttempts(), [attemptVersion]);
  const recommendation = getRecommendedOpening(openingCourses, attempts);
  const weakMotifs = getOpeningWeakMotifs(attempts).slice(0, 3);
  if (!content) return null;
  const question = content.quizzes[questionIndex % content.quizzes.length];

  const record = (activity: 'quiz' | 'transition' | 'model', correct: boolean, motifs: string[], mistakes = correct ? 0 : 1) => {
    saveOpeningAttempt({ id: crypto.randomUUID(), courseId: course.id, activity, correct, mistakes, motifs, date: new Date().toISOString() });
    setAttemptVersion((value) => value + 1);
  };

  const chooseAnswer = (index: number) => {
    if (answer !== null) return;
    setAnswer(index);
    record(question.id === content.transitionQuestion.id ? 'transition' : 'quiz', index === question.answer, [question.motif]);
  };

  return (
    <section className="opening-learning-hub" aria-label="Aprendizaje de la apertura">
      <div className="opening-learning-summary"><div><span className="eyebrow">Comprender antes de memorizar</span><h2>{content.pocketSummary}</h2></div>
        {recommendation ? <button className="secondary-button compact-action" onClick={() => onCourseChange(recommendation.id)} type="button">Recomendado: {recommendation.name}</button> : null}
      </div>
      <div className="mode-toggle" aria-label="Contenido didáctico">
        <button className={tab === 'lesson' ? 'active' : ''} onClick={() => setTab('lesson')} type="button">Planes</button>
        <button className={tab === 'quiz' ? 'active' : ''} onClick={() => setTab('quiz')} type="button">Mini ejercicios</button>
        <button className={tab === 'model' ? 'active' : ''} onClick={() => setTab('model')} type="button">Partida modelo</button>
        <button className={tab === 'week' ? 'active' : ''} onClick={() => setTab('week')} type="button">Plan semanal</button>
      </div>
      {tab === 'lesson' ? <div className="opening-learning-grid">
        <article><h3>Estructura típica</h3><p>{content.structure}</p><strong>Rupturas</strong><p>{content.breaks.join(' · ')}</p></article>
        <article><h3>Plan de Blancas</h3>{content.whitePlans.map((plan) => <span key={plan}>{plan}</span>)}</article>
        <article><h3>Plan de Negras</h3>{content.blackPlans.map((plan) => <span key={plan}>{plan}</span>)}</article>
        <article><h3>Errores frecuentes</h3>{content.typicalErrors.map((error) => <span key={error}>{error}</span>)}</article>
      </div> : null}
      {tab === 'quiz' ? <div className="opening-quiz-layout">
        <div className="opening-reference-board"><Chessboard options={{ position: content.referenceFen, allowDragging: false, boardStyle: { width: 'min(100%, 330px)', borderRadius: '8px' }, darkSquareStyle: { backgroundColor: '#77906f' }, lightSquareStyle: { backgroundColor: '#eef0d8' }, ...boardNotationOptions }} /></div>
        <article className="opening-quiz-card"><span>Pregunta {questionIndex + 1}/{content.quizzes.length}</span><h3>{question.question}</h3>
          {question.options.map((option, index) => <button className={answer === index ? (index === question.answer ? 'quiz-answer correct' : 'quiz-answer wrong') : 'quiz-answer'} key={option} onClick={() => chooseAnswer(index)} type="button">{option}</button>)}
          {answer !== null ? <p className={answer === question.answer ? 'feedback correct' : 'feedback wrong'}>{question.explanation}</p> : null}
          <button className="secondary-button compact-action" onClick={() => { setQuestionIndex((value) => (value + 1) % content.quizzes.length); setAnswer(null); }} type="button">Siguiente pregunta</button>
        </article>
      </div> : null}
      {tab === 'model' ? <article className="opening-model-card"><h3>{content.modelGame.title}</h3><p className="opening-model-moves">{content.modelGame.moves}</p><p>{content.modelGame.lesson}</p><button className="primary-button compact-action" onClick={() => record('model', true, ['partida modelo'])} type="button">Marcar como estudiada</button></article> : null}
      {tab === 'week' ? <div className="opening-week-card"><h3>Trabajo recomendado hoy</h3><p>{getWeeklyOpeningStep()}</p><strong>Patrones que más cuestan</strong><p>{weakMotifs.length ? weakMotifs.map((item) => `${item.motif}: ${item.mistakes}`).join(' · ') : 'Aún no hay errores suficientes para personalizar el repaso.'}</p></div> : null}
    </section>
  );
}