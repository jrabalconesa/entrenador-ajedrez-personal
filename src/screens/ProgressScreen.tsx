import { Flame, Target, TrendingUp } from 'lucide-react';
import ProgressBar from '../components/ProgressBar';
import SectionHeader from '../components/SectionHeader';
import { categories } from '../data/exercises';
import { getCategoryStats } from '../logic/adaptive';
import { formatCategoryLabel } from '../logic/labels';
import type { ExerciseAttempt, SavedGame } from '../types';

interface ProgressScreenProps {
  attempts: ExerciseAttempt[];
  games: SavedGame[];
}

export default function ProgressScreen({ attempts, games }: ProgressScreenProps) {
  const stats = getCategoryStats(attempts);
  const total = attempts.length;
  const correct = attempts.filter((attempt) => attempt.correct).length;
  const accuracy = total === 0 ? 0 : Math.round((correct / total) * 100);
  const weakCategories = stats.filter((stat) => stat.total > 0 && stat.accuracy < 70).map((stat) => formatCategoryLabel(stat.category));
  const repeatedErrors = games.flatMap((game) => game.errors).reduce<Record<string, number>>((acc, error) => {
    acc[error.category] = (acc[error.category] ?? 0) + 1;
    return acc;
  }, {});
  const topError = Object.entries(repeatedErrors).sort((a, b) => b[1] - a[1])[0];
  const streak = getTrainingStreak(attempts);
  const weekCount = attempts.filter((attempt) => daysAgo(attempt.date) < 7).length;

  return (
    <section>
      <SectionHeader
        eyebrow="Progreso"
        title="Lo importante es detectar patrones"
        description="El objetivo no es correr: primero consolidar amenazas, piezas indefensas y finales básicos."
      />
      <div className="stats-grid">
        <article className="stat-card">
          <Target size={24} />
          <span>Ejercicios realizados</span>
          <strong>{total}</strong>
        </article>
        <article className="stat-card">
          <TrendingUp size={24} />
          <span>Acierto global</span>
          <strong>{accuracy}%</strong>
        </article>
        <article className="stat-card">
          <Flame size={24} />
          <span>Racha de días</span>
          <strong>{streak}</strong>
        </article>
      </div>
      <div className="progress-layout">
        <div className="progress-panel">
          <h2>Acierto por categoría</h2>
          {categories.map((category) => {
            const stat = stats.find((item) => item.category === category);
            return <ProgressBar key={category} label={formatCategoryLabel(category)} value={stat?.accuracy ?? 0} />;
          })}
        </div>
        <aside className="coaching-panel">
          <h2>Resumen de la semana</h2>
          <p>Has hecho {weekCount} ejercicio{weekCount === 1 ? '' : 's'} en los últimos 7 días.</p>
          <h3>Tu principal mejora esta semana</h3>
          <p>{accuracy >= 70 ? 'Detectas mejor las amenazas directas y las capturas sencillas.' : 'Estás construyendo el hábito de revisar antes de mover.'}</p>
          <h3>Errores más repetidos</h3>
          <p>{topError ? `${formatCategoryLabel(topError[0])} aparece ${topError[1]} vez${topError[1] === 1 ? '' : 'es'} en tus partidas.` : 'Aún no has marcado errores manuales en tus partidas.'}</p>
          <h3>Temas que toca repasar</h3>
          <p>{weakCategories.length > 0 ? weakCategories.join(', ') : 'Mantén repasos espaciados de Piezas colgadas y Amenazas del rival.'}</p>
          <h3>Tema prioritario</h3>
          <p>{weakCategories[0] ?? 'Revisar piezas indefensas antes de mover.'}</p>
        </aside>
      </div>
    </section>
  );
}

function getTrainingStreak(attempts: ExerciseAttempt[]): number {
  const days = new Set(attempts.map((attempt) => new Date(attempt.date).toDateString()));
  let streak = 0;
  const cursor = new Date();

  while (days.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function daysAgo(date: string): number {
  return (Date.now() - new Date(date).getTime()) / 86_400_000;
}
