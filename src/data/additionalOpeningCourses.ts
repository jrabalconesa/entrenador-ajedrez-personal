import type { OpeningCourse } from '../types';

export const additionalOpeningCourses: OpeningCourse[] = [
  {
    id: 'scandinavian', name: 'Defensa Escandinava', side: 'negras', difficulty: 2,
    summary: 'Respuesta directa contra 1.e4: la dama se recoloca y las negras completan el desarrollo con una estructura clara.',
    plan: ['Golpear e4 con ...d5.', 'Recolocar la dama sin bloquear el desarrollo.', 'Coordinar rápido con ...c6, ...Ag4 y ...e6.'],
    lines: [{
      id: 'scandinavian-main', name: 'Escandinava clásica con ...Da5', stage: 'Desarrollo con tiempos',
      summary: 'Las blancas usan el tiempo sobre la dama para desarrollar; las negras buscan una estructura compacta y coordinación.',
      whitePlan: ['Desarrollar Cc3 con tiempo.', 'Construir el centro con d4.', 'Enrocar antes de perseguir la dama.'],
      blackPlan: ['Colocar la dama en a5.', 'Desarrollar el alfil antes de ...e6.', 'Completar rápido el flanco de rey.'],
      keyIdeas: ['...d5 desafía e4.', 'Cc3 gana un tiempo útil.', 'El desarrollo importa más que perseguir la dama.'],
      moves: moves('e4|Centro y líneas para las piezas.;d5|Las negras desafían e4 inmediatamente.;exd5|Las blancas aceptan la tensión.;Qxd5|La dama recupera el peón.;Nc3|Desarrollo con ganancia de tiempo.;Qa5|La dama conserva actividad sin bloquear piezas.;d4|Las blancas construyen un centro amplio.;c6|Las negras preparan desarrollo y controlan d5.;Nf3|Desarrollo natural antes del ataque.;Bg4|El alfil sale antes de ...e6.;Be2|Las blancas rompen la clavada y preparan el enroque.;e6|Las negras consolidan y liberan el alfil de f8.;O-O|El rey blanco queda seguro.;Nd7|El caballo apoya el centro y prepara ...Ngf6.')
    }]
  },
  {
    id: 'english', name: 'Apertura Inglesa', side: 'blancas', difficulty: 3,
    summary: 'Control flexible del centro desde el flanco, con presión sobre d5 y un alfil fuerte en g2.',
    plan: ['Controlar d5 con c4 y Cc3.', 'Fianchettar el alfil de rey.', 'Elegir d3 o d4 según la estructura.'],
    lines: [{
      id: 'english-reversed-sicilian', name: 'Siciliana con colores cambiados', stage: 'Centro flexible',
      summary: 'Las blancas no ocupan todo el centro de inmediato: coordinan piezas y deciden después la ruptura adecuada.',
      whitePlan: ['Activar Ag2.', 'Usar la columna c.', 'Preparar d4 sólo en buenas condiciones.'],
      blackPlan: ['Tomar espacio con ...e5.', 'Disputar d4 con ...Cf6 y ...Cc6.', 'Buscar ...f5 tras enrocar.'],
      keyIdeas: ['c4 controla d5.', 'Ag2 domina la gran diagonal.', 'La flexibilidad permite elegir el momento de d4.'],
      moves: moves('c4|Controla d5 desde el flanco.;e5|Las negras ocupan el centro.;Nc3|Desarrollo y más control de d5.;Nf6|Las negras desarrollan y controlan e4.;g3|Prepara el fianchetto.;d5|Las negras construyen un centro amplio.;cxd5|Las blancas aclaran la tensión.;Nxd5|El caballo recupera activamente.;Bg2|El alfil entra en la gran diagonal.;Nb6|El caballo se recoloca y deja libre el peón c.;Nf3|Las blancas completan desarrollo.;Nc6|Las negras aumentan su control central.;O-O|El rey blanco queda seguro.;Be7|Las negras preparan su enroque.')
    }]
  }
];

function moves(spec: string) {
  return spec.split(';').map((item) => {
    const [san, explanation] = item.split('|');
    return { san, explanation: explanation.length > 30 ? explanation : `${explanation} Esta idea ayuda a coordinar el plan de la apertura.` };
  });
}