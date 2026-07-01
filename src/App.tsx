import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Brain, ChartNoAxesColumnIncreasing, ClipboardCheck, Dumbbell, Home, LibraryBig } from 'lucide-react';
import { exercises } from './data/exercises';
import { trainingBlocks } from './data/trainingPlan';
import { loadAttempts, loadGames, loadTrainingDayProgress, markTrainingBlockCompleted } from './storage/localStore';
import type { ExerciseAttempt, SavedGame, TrainingBlockId, TrainingDayProgress, TrainingSessionConfig } from './types';
import HomeScreen from './screens/HomeScreen';
import ExercisesScreen from './screens/ExercisesScreen';
import GamesScreen from './screens/GamesScreen';
import ProgressScreen from './screens/ProgressScreen';
import DiagnosticScreen from './screens/DiagnosticScreen';
import OpeningsScreen from './screens/OpeningsScreen';
import ConceptsScreen from './screens/ConceptsScreen';

type Screen = 'inicio' | 'diagnostico' | 'ejercicios' | 'aperturas' | 'conceptos' | 'partidas' | 'progreso';

const navItems: { id: Screen; label: string; icon: typeof Home }[] = [
  { id: 'inicio', label: 'Inicio', icon: Home },
  { id: 'diagnostico', label: 'Diagnóstico', icon: ClipboardCheck },
  { id: 'ejercicios', label: 'Ejercicios', icon: Dumbbell },
  { id: 'aperturas', label: 'Aperturas', icon: LibraryBig },
  { id: 'conceptos', label: 'Táctica', icon: Brain },
  { id: 'partidas', label: 'Mis partidas', icon: BookOpen },
  { id: 'progreso', label: 'Progreso', icon: ChartNoAxesColumnIncreasing }
];

export default function App() {
  const appIconUrl = `${import.meta.env.BASE_URL}app-icon.png`;
  const [screen, setScreen] = useState<Screen>('inicio');
  const [attempts, setAttempts] = useState<ExerciseAttempt[]>([]);
  const [games, setGames] = useState<SavedGame[]>([]);
  const [trainingDay, setTrainingDay] = useState<TrainingDayProgress>(() => loadTrainingDayProgress());
  const [trainingSession, setTrainingSession] = useState<TrainingSessionConfig | undefined>();

  const refreshData = () => {
    setAttempts(loadAttempts());
    setGames(loadGames());
    setTrainingDay(loadTrainingDayProgress());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const startTraining = (blockId?: TrainingBlockId) => {
    setTrainingSession({
      mode: blockId ? 'single' : 'full',
      blockIds: blockId ? [blockId] : trainingBlocks.map((block) => block.id)
    });
    setScreen('ejercicios');
  };

  const completeTrainingBlock = (blockId: TrainingBlockId) => {
    setTrainingDay(markTrainingBlockCompleted(blockId));
  };

  const finishTrainingSession = () => {
    refreshData();
    setTrainingSession(undefined);
    setScreen('inicio');
  };

  const totalDone = attempts.length;
  const correct = attempts.filter((attempt) => attempt.correct).length;
  const accuracy = totalDone === 0 ? 0 : Math.round((correct / totalDone) * 100);
  const currentScreen = useMemo(() => {
    if (screen === 'inicio') {
      return <HomeScreen attempts={attempts} completedBlockIds={trainingDay.completedBlockIds} onStart={startTraining} />;
    }
    if (screen === 'ejercicios') {
      return (
        <ExercisesScreen
          exercises={exercises}
          attempts={attempts}
          session={trainingSession}
          onAttemptSaved={refreshData}
          onBlockCompleted={completeTrainingBlock}
          onSessionFinished={finishTrainingSession}
        />
      );
    }
    if (screen === 'diagnostico') {
      return (
        <DiagnosticScreen
          onFinished={() => {
            refreshData();
            setScreen('progreso');
          }}
        />
      );
    }
    if (screen === 'aperturas') {
      return <OpeningsScreen />;
    }
    if (screen === 'conceptos') {
      return <ConceptsScreen />;
    }
    if (screen === 'partidas') {
      return <GamesScreen games={games} onGamesChanged={refreshData} />;
    }
    return <ProgressScreen attempts={attempts} games={games} />;
  }, [attempts, games, screen, trainingDay.completedBlockIds, trainingSession]);

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Navegación principal">
        <div className="brand">
          <img className="brand-mark" src={appIconUrl} alt="" />
          <div>
            <strong>Entrenador Personal</strong>
            <span>Ajedrez 800-1400</span>
          </div>
        </div>
        <nav className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={screen === item.id ? 'nav-button active' : 'nav-button'}
                key={item.id}
                onClick={() => setScreen(item.id)}
                type="button"
              >
                <Icon size={20} aria-hidden="true" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="mini-summary">
          <span>Ejercicios</span>
          <strong>{totalDone}</strong>
          <span>Acierto</span>
          <strong>{accuracy}%</strong>
        </div>
      </aside>
      <main className="main-content">{currentScreen}</main>
    </div>
  );
}
