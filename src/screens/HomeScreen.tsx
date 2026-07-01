import { useState } from 'react';
import { CalendarDays, CheckCircle2, ChevronDown, ChevronUp, CirclePlay, RotateCcw } from 'lucide-react';
import SectionHeader from '../components/SectionHeader';
import { trainingBlocks } from '../data/trainingPlan';
import { getCategoryStats } from '../logic/adaptive';
import { formatCategoryLabel } from '../logic/labels';
import type { ExerciseAttempt, TrainingBlockId } from '../types';

interface HomeScreenProps {
  attempts: ExerciseAttempt[];
  completedBlockIds: TrainingBlockId[];
  onStart: (blockId?: TrainingBlockId) => void;
}

const blockIcons = {
  repaso: RotateCcw,
  tacticas: CheckCircle2,
  concepto: CalendarDays,
  'final-apertura': CirclePlay
} as const;

export default function HomeScreen({ attempts, completedBlockIds, onStart }: HomeScreenProps) {
  const [showGuidance, setShowGuidance] = useState(false);
  const stats = getCategoryStats(attempts);
  const weakTopic = stats.filter((stat) => stat.total >= 2).sort((a, b) => a.accuracy - b.accuracy)[0];
  const doneToday = attempts.filter((attempt) => new Date(attempt.date).toDateString() === new Date().toDateString()).length;
  const progressMessage =
    doneToday > 0
      ? `Hoy ya has hecho ${doneToday} ejercicio${doneToday === 1 ? '' : 's'}. Mantén la atención en entender el porqué de cada jugada.`
      : 'Hoy empieza con calma: antes de mover, pregunta qué amenaza el rival y si hay piezas sin defender.';
  const priorityTopic = weakTopic
    ? `Repasar ${formatCategoryLabel(weakTopic.category)}: ahora tienes un ${weakTopic.accuracy}% de acierto.`
    : 'Revisar Piezas indefensas antes de mover.';

  return (
    <section>
      <SectionHeader
        eyebrow="Entrenamiento de hoy"
        title="Una sesión clara para mejorar sin memorizar de más"
        description="Trabaja primero lo básico: amenazas, piezas indefensas, tácticas sencillas y finales fundamentales."
      />
      <div className="home-layout">
        <div className="today-plan">
          {trainingBlocks.map((block) => {
            const Icon = blockIcons[block.id];
            const completed = completedBlockIds.includes(block.id);
            return (
              <article className={completed ? 'plan-item completed' : 'plan-item'} key={block.id}>
                {completed ? <CheckCircle2 size={24} /> : <Icon size={24} />}
                <div>
                  <strong>{block.minutes}</strong>
                  <span>{block.description}</span>
                </div>
                <button className="secondary-button compact-action" onClick={() => onStart(block.id)} type="button">
                  {completed ? 'Repetir' : 'Hacer'}
                </button>
              </article>
            );
          })}
          <button className="primary-button" onClick={() => onStart()} type="button">
            <CirclePlay size={22} />
            Empezar entrenamiento
          </button>
        </div>
        <aside className="coaching-panel guidance-panel">
          <div className="guidance-summary">
            <div>
              <span>Orientación</span>
              <h2>Prioridad de hoy</h2>
              <p>{priorityTopic}</p>
            </div>
            <button className="secondary-button compact-action" onClick={() => setShowGuidance((value) => !value)} type="button" aria-expanded={showGuidance}>
              {showGuidance ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              {showGuidance ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
          {showGuidance ? (
            <div className="guidance-details">
              <h3>Mensaje de progreso</h3>
              <p>{progressMessage}</p>
              <h3>Concepto del día</h3>
              <p>En la apertura, desarrolla caballos y alfiles, enroca pronto y lucha por el centro sin sacar la dama demasiado pronto.</p>
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
