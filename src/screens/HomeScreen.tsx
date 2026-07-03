import { useState } from 'react';
import { CalendarDays, CheckCircle2, ChevronDown, ChevronUp, CirclePlay, RotateCcw } from 'lucide-react';
import SectionHeader from '../components/SectionHeader';
import { trainingBlocks } from '../data/trainingPlan';
import { getCategoryStats } from '../logic/adaptive';
import { formatCategoryLabel } from '../logic/labels';
import type { ChallengeMode, ExerciseAttempt, TargetLevel, TrainingBlockId, TrainingPreferences } from '../types';

interface HomeScreenProps {
  attempts: ExerciseAttempt[];
  completedBlockIds: TrainingBlockId[];
  trainingPreferences: TrainingPreferences;
  onPreferencesChange: (preferences: TrainingPreferences) => void;
  onStart: (blockId?: TrainingBlockId) => void;
}

const blockIcons = {
  repaso: RotateCcw,
  tacticas: CheckCircle2,
  concepto: CalendarDays,
  'final-apertura': CirclePlay
} as const;

const targetLevelLabels: Record<TargetLevel, string> = {
  '800-1000': '800-1000',
  '1000-1200': '1000-1200',
  '1200-1400': '1200-1400',
  '1400+': '1400+'
};

const challengeModeLabels: Record<ChallengeMode, string> = {
  repaso: 'Repaso',
  equilibrado: 'Equilibrado',
  retos: 'Retos'
};

export default function HomeScreen({ attempts, completedBlockIds, trainingPreferences, onPreferencesChange, onStart }: HomeScreenProps) {
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
  const challengeSummary =
    trainingPreferences.challengeMode === 'retos'
      ? 'La sesión prioriza posiciones más exigentes y saltos de dificultad controlados.'
      : trainingPreferences.challengeMode === 'repaso'
        ? 'La sesión consolida errores recientes antes de subir dificultad.'
        : 'La sesión mezcla consolidación con retos por encima del nivel dominado.';

  const updateTargetLevel = (targetLevel: TargetLevel) => {
    onPreferencesChange({ ...trainingPreferences, targetLevel });
  };

  const updateChallengeMode = (challengeMode: ChallengeMode) => {
    onPreferencesChange({ ...trainingPreferences, challengeMode });
  };

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
          <div className="training-preferences">
            <div>
              <span>Perfil</span>
              <h2>Nivel y reto</h2>
              <p>{challengeSummary}</p>
            </div>
            <div className="preference-grid">
              <label>
                Nivel objetivo
                <select value={trainingPreferences.targetLevel} onChange={(event) => updateTargetLevel(event.target.value as TargetLevel)}>
                  {Object.entries(targetLevelLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Retos
                <select value={trainingPreferences.challengeMode} onChange={(event) => updateChallengeMode(event.target.value as ChallengeMode)}>
                  {Object.entries(challengeModeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
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
