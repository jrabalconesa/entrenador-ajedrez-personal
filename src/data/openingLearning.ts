import type { OpeningLearningContent } from '../types';

export const openingLearning: Record<string, OpeningLearningContent> = {
  london: lesson(
    'Centro estable con peones en d4, e3 y c3; el alfil de f4 queda fuera de la cadena.',
    ['Completar desarrollo antes de atacar.', 'Preparar e4 cuando las piezas estén listas.', 'Usar Ce5 como puesto avanzado.'],
    ['Golpear d4 con ...c5.', 'Buscar ...Db6 contra b2.', 'Desarrollar el alfil de c8 antes de quedar pasivo.'],
    ['e4 para blancas', '...c5 para negras'],
    ['Jugar Af4 y e3 de memoria sin mirar ...Db6.', 'Atacar en el rey antes de completar el desarrollo.', 'Bloquear el alfil de c1 con e3 demasiado pronto.'],
    'Alfil fuera, centro sólido, rey seguro y ruptura e4 sólo cuando esté preparada.',
    'r1bqkb1r/pp3ppp/2n1pn2/2pp4/3P1B2/2P1PN2/PP3PPP/RN1QKB1R w KQkq - 1 6',
    q('london-plan', '¿Qué transformación central debe preparar el blanco?', ['e4 con las piezas listas', 'h4 de inmediato', 'Cambiar siempre en c5'], 0, 'e4 convierte el esquema sólido en juego central activo.', 'ruptura central'),
    '1.d4 d5 2.Af4 Cf6 3.e3 e6 4.Cf3 c5 5.c3 Cc6 6.Cbd2 Ad6 7.Ag3 O-O',
    'El Londres funciona por coordinación, no por repetir casillas sin atender al plan rival.'
  ),
  italian: lesson(
    'Centro e4-e5 con d3/d6; posición estable que permite maniobrar antes de d4.',
    ['Preparar d4 con c3 y Te1.', 'Maniobrar Cb1-d2-f1-g3.', 'Mantener el alfil en la diagonal a2-g8.'],
    ['Igualar con ...d5.', 'Cambiar el alfil activo con ...Ae6.', 'Presionar e4 con ...Cf6 y ...Te8.'],
    ['d4 para blancas', '...d5 para negras'],
    ['Atacar f7 sin desarrollo.', 'No preparar nunca d4.', 'Abrir el centro con el rey sin enrocar.'],
    'Desarrolla, enroca, mejora las piezas y sólo entonces rompe con d4.',
    'r2q1rk1/bpp2ppp/p1npbn2/4p3/4P3/1BPP1N1P/PP1N1PP1/R1BQR1K1 b - - 4 10',
    q('italian-plan', 'Con ambos reyes seguros, ¿qué ruptura organiza el juego blanco?', ['d4', 'g4', 'b4'], 0, 'd4 cuestiona e5 y activa las piezas centrales.', 'ruptura central'),
    '1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.c3 Cf6 5.d3 d6 6.O-O O-O 7.Te1 a6 8.h3 h6 9.Cbd2 Ae6 10.Ab3 Te8 11.Cf1 d5',
    'La ruptura central llega después de que ambos bandos hayan coordinado sus piezas.'
  ),
  'queens-gambit': lesson(
    'Centro clásico de peón de dama; puede aparecer la estructura Carlsbad o un peón aislado.',
    ['Presionar d5.', 'En Carlsbad preparar b4-b5.', 'Usar las columnas c y e tras los cambios.'],
    ['Liberarse con ...c5.', 'Desarrollar antes de resolver la tensión.', 'Buscar ...e5 si la posición lo permite.'],
    ['b4-b5 en Carlsbad', '...c5 o ...e5 para negras'],
    ['Cambiar en d5 sin un plan posterior.', 'Creer que c4 regala un peón sin compensación.', 'Ignorar la estructura resultante.'],
    'La estructura decide el plan: presión central, minoría para blancas y ruptura liberadora para negras.',
    'r2q1rk1/pbpnbpp1/1p3n1p/3p4/3P3B/2NBPN2/PP3PPP/R2Q1RK1 w - - 4 11',
    q('qg-plan', 'En una estructura Carlsbad, ¿qué plan clásico tiene el blanco?', ['Ataque de minoría con b4-b5', 'f3 y g4 siempre', 'Cambiar todas las piezas'], 0, 'b4-b5 busca crear una debilidad en el ala de dama negra.', 'estructura'),
    '1.d4 d5 2.c4 e6 3.Cc3 Cf6 4.Ag5 Ae7 5.e3 O-O 6.Cf3 h6 7.Ah4 b6 8.cxd5 exd5 9.Ad3 Ab7 10.O-O Cbd7 11.Tc1 c5',
    'Las negras completan el desarrollo antes de ejecutar la ruptura temática ...c5.'
  ),
  'ruy-lopez': lesson(
    'Centro e4-e5 con tensión prolongada; las maniobras preparan d4 y el ataque sobre e5.',
    ['Preparar d4 con c3 y Te1.', 'Maniobrar Cbd2-f1-g3.', 'Conservar el alfil de casillas blancas.'],
    ['Sostener e5.', 'Reagrupar ...Cb8-d7-f8.', 'Contratacar con ...c5 o ...exd4.'],
    ['d4 para blancas', '...c5 para negras'],
    ['Cambiar en c6 automáticamente.', 'Olvidar defender e4.', 'Atacar antes de terminar las maniobras.'],
    'Presiona e5, conserva la tensión y prepara d4 con paciencia.',
    'r1bq1rk1/2pnbppp/p2p1n2/1p2p3/3PP3/1BP2N1P/PP3PP1/RNBQR1K1 w - - 1 11',
    q('ruy-plan', '¿Por qué ...Cb8-d7 puede ser una buena maniobra?', ['Reagrupa el caballo para sostener e5 y f6', 'Gana material de inmediato', 'Evita el enroque blanco'], 0, 'La ruta mejora la coordinación aunque parezca retroceder.', 'maniobra'),
    '1.e4 e5 2.Cf3 Cc6 3.Ab5 a6 4.Aa4 Cf6 5.O-O Ae7 6.Te1 b5 7.Ab3 d6 8.c3 O-O 9.h3 Cb8 10.d4 Cbd7 11.Cbd2 Ab7 12.Ac2 Te8',
    'La posición tranquila esconde una lucha preparada por el centro.'
  ),
  'caro-kann': lesson(
    'Cadena c6-d5-e6 y estructura sana; el alfil de c8 debe salir antes de ...e6.',
    ['Usar el espacio y desarrollar con rapidez.', 'Molestar al alfil con h4-h5.', 'Elegir entre avance, cambio o presión central.'],
    ['Desarrollar ...Af5 antes de ...e6.', 'Atacar el centro con ...c5.', 'Evitar una defensa meramente pasiva.'],
    ['...c5 para negras', 'e5 o c4 para blancas según variante'],
    ['Encerrar el alfil con ...e6 prematuro.', 'Empujar h4-h5 sin desarrollo.', 'Confundir solidez con pasividad.'],
    'Activa el alfil, completa el desarrollo y golpea el centro con ...c5.',
    'r2qkbnr/pp1n1pp1/2p1p2p/7P/3P4/3Q1NN1/PPP2PP1/R1B1K2R w KQkq - 0 11',
    q('caro-plan', '¿Por qué ...Af5 aparece antes de ...e6?', ['Para sacar el alfil fuera de la cadena', 'Para sacrificarlo en h3', 'Para impedir el enroque blanco'], 0, 'La Caro-Kann conserva un alfil activo antes de cerrar su centro.', 'desarrollo'),
    '1.e4 c6 2.d4 d5 3.Cc3 dxe4 4.Cxe4 Af5 5.Cg3 Ag6 6.Cf3 Cd7 7.h4 h6 8.h5 Ah7 9.Ad3 Axd3 10.Dxd3 e6 11.Ad2 Cgf6 12.O-O-O',
    'Las negras logran solidez; las blancas intentan convertir su espacio en iniciativa.'
  ),
  french: lesson(
    'Cadena e6-d5 contra e5-d4; el blanco tiene espacio y el negro ataca la base central.',
    ['Sostener e5.', 'Atacar el flanco de rey con preparación.', 'Aprovechar el espacio sin retrasar desarrollo.'],
    ['Golpear d4 con ...c5.', 'Atacar e5 con ...f6.', 'Liberar el alfil de c8 mediante rupturas.'],
    ['...c5 y ...f6 para negras', 'f4-f5 para blancas en líneas preparadas'],
    ['Jugar ...f6 sin desarrollo.', 'Dejar el alfil de c8 sin plan.', 'Defender la cadena sólo con piezas pasivas.'],
    'Ataca la base de la cadena blanca con ...c5 y luego cuestiona e5 con ...f6.',
    'rnbqk2r/pppnbppp/4p3/3pP1B1/3P4/2N5/PPP2PPP/R2QKBNR w KQkq - 1 6',
    q('french-plan', '¿Cuál es la ruptura principal contra el centro blanco?', ['...c5', '...h5', '...b6 siempre'], 0, '...c5 presiona d4, la base de la cadena blanca.', 'ruptura central'),
    '1.e4 e6 2.d4 d5 3.Cc3 Cf6 4.Ag5 Ae7 5.e5 Cfd7 6.h4 c5 7.Axe7 Dxe7 8.Cb5 O-O 9.c3',
    'El espacio blanco obliga a las negras a buscar contrajuego central activo.'
  ),
  'kings-indian': lesson(
    'Centro bloqueado d5-e4 contra d6-e5; suele conducir a ataques en flancos opuestos.',
    ['Jugar en el ala de dama con b4 o c5.', 'Usar el espacio para maniobrar.', 'Frenar el ataque negro sin abandonar el propio plan.'],
    ['Preparar ...f5 con todas las piezas.', 'Usar el alfil de g7.', 'Golpear también con ...c6 si el centro lo exige.'],
    ['...f5 para negras', 'c5 o b4 para blancas'],
    ['Jugar ...f5 sin apoyo.', 'Ocupar espacio y olvidar el desarrollo.', 'Jugar en el flanco equivocado con centro cerrado.'],
    'Centro cerrado: blancas en el ala de dama, negras en el ala de rey.',
    'r1bq1rk1/pppnn1bp/3p2p1/3Ppp2/2P1P3/2N1B3/PP2BPPP/R2QNRK1 w - - 0 11',
    q('kid-plan', 'Con el centro bloqueado, ¿dónde juega normalmente cada bando?', ['Blancas en dama y negras en rey', 'Ambos sólo en el centro', 'Blancas en rey y negras en dama siempre'], 0, 'El centro cerrado orienta los ataques hacia flancos opuestos.', 'planes de flanco'),
    '1.d4 Cf6 2.c4 g6 3.Cc3 Ag7 4.e4 d6 5.Cf3 O-O 6.Ae2 e5 7.O-O Cc6 8.d5 Ce7 9.Ce1 Cd7 10.Ae3 f5 11.f3 f4 12.Af2',
    'La estructura cerrada explica el ataque negro en el ala de rey.'
  ),
  sicilian: lesson(
    'Peones asimétricos; negras usan la columna c y el ala de dama, blancas suelen buscar actividad en el rey.',
    ['Preparar f4-e5.', 'Coordinar las piezas contra el rey.', 'Vigilar ...d5.'],
    ['Expandirse con ...b5-b4.', 'Presionar e4 y la columna c.', 'Liberarse con ...d5.'],
    ['e5 para blancas', '...d5 para negras'],
    ['Atacar sin coordinación.', 'Olvidar la ruptura ...d5.', 'Jugar como si fuese una posición simétrica de 1...e5.'],
    'Blancas miran al rey; negras al ala de dama y a la ruptura liberadora ...d5.',
    'r4rk1/1bq1bppp/p1nppn2/1p6/3NPP2/PBN1BQ2/1PP3PP/R4RK1 w - - 1 13',
    q('sicilian-plan', '¿Qué suele conseguir el negro si juega ...d5 en buenas condiciones?', ['Libera sus piezas e iguala el centro', 'Pierde siempre un peón', 'Cierra su alfil de b7'], 0, '...d5 resuelve la tensión central y activa el juego negro.', 'ruptura central'),
    '1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 Cc6 6.Ae3 e6 7.Dd2 Ae7 8.O-O-O O-O 9.f3 a6 10.g4 Cd7 11.h4 Cde5 12.h5',
    'Los enroques y la estructura explican los ataques en flancos opuestos.'
  ),
  scandinavian: lesson(
    'Blancas obtienen centro d4; negras coordinan una estructura c6-e6 después de recolocar la dama.',
    ['Desarrollar con tiempo contra la dama.', 'Conservar el centro.', 'Enrocar antes de buscar aventuras.'],
    ['Dar una casilla útil a la dama.', 'Desarrollar rápido para recuperar tiempos.', 'Presionar el centro y simplificar cuando convenga.'],
    ['d4 para blancas', '...e5 o ...c5 para negras según preparación'],
    ['Perseguir la dama con peones.', 'Mover la dama repetidamente sin desarrollar.', 'Confundir ganancia de tiempo con ataque inmediato.'],
    'Usa los tiempos sobre la dama para desarrollar, no para lanzar peones sin coordinación.',
    'r3kb1r/pp1n1ppp/2p1pn2/q6b/3P1B2/2N2N1P/PPP1BPP1/R2QR1K1 b kq - 2 10',
    q('scandi-plan', 'Tras 3.Cc3, ¿qué debe hacer el blanco con el tiempo ganado?', ['Desarrollar y ocupar el centro', 'Perseguir la dama con todos los peones', 'Sacar la dama propia'], 0, 'La ventaja se conserva completando desarrollo con naturalidad.', 'desarrollo'),
    '1.e4 d5 2.exd5 Dxd5 3.Cc3 Da5 4.d4 c6 5.Cf3 Ag4 6.Ae2 e6 7.O-O Cd7 8.h3 Ah5 9.Te1 Cgf6 10.Ad2 Ae7 11.Cd5 Dd8',
    'Cuando la dama encuentra refugio, el valor de los tiempos depende del desarrollo logrado.'
  ),
  english: lesson(
    'Control flexible de d5 y gran diagonal del alfil de g2; a menudo es una Siciliana con colores cambiados.',
    ['Fianchettar el alfil.', 'Elegir d3 o d4 según el centro.', 'Usar la columna c y las casillas oscuras.'],
    ['Responder con ...e5 o ...c5.', 'Disputar d4 y e4.', 'Buscar ...f5 cuando las piezas estén listas.'],
    ['d4 para blancas', '...f5 o ...c5 para negras'],
    ['Fianchettar sin vigilar el centro.', 'Cambiar peones sin saber la estructura deseada.', 'Confundir flexibilidad con falta de plan.'],
    'Controla d5, activa Ag2 y decide la ruptura central según la estructura.',
    'r2q1rk1/ppp1b1pp/1nn1b3/4pp2/8/2NPBNP1/PP2PPBP/2RQ1RK1 w - - 0 11',
    q('english-plan', '¿Qué casilla controla especialmente 1.c4?', ['d5', 'h7', 'a8'], 0, 'El peón c4 controla d5 y condiciona el centro desde el flanco.', 'control central'),
    '1.c4 e5 2.Cc3 Cf6 3.g3 d5 4.cxd5 Cxd5 5.Ag2 Cb6 6.Cf3 Cc6 7.O-O Ae7 8.d3 O-O 9.Ae3 Ae6 10.Tc1 f5 11.a3',
    'La flexibilidad blanca convive con el plan activo negro de ...f5.'
  )
};

function q(id: string, question: string, options: string[], answer: number, explanation: string, motif: string) {
  return { id, question, options, answer, explanation, motif };
}

function lesson(
  structure: string,
  whitePlans: string[],
  blackPlans: string[],
  breaks: string[],
  typicalErrors: string[],
  pocketSummary: string,
  referenceFen: string,
  transitionQuestion: ReturnType<typeof q>,
  modelMoves: string,
  modelLesson: string
): OpeningLearningContent {
  return {
    structure,
    whitePlans,
    blackPlans,
    breaks,
    typicalErrors,
    pocketSummary,
    referenceFen,
    transitionQuestion,
    quizzes: [
      transitionQuestion,
      q(`${transitionQuestion.id}-error`, '¿Qué enfoque evita el error típico de esta apertura?', [typicalErrors[0], pocketSummary, typicalErrors[1]], 1, pocketSummary, 'comprensión de apertura')
    ],
    modelGame: { title: 'Partida modelo simplificada', moves: modelMoves, lesson: modelLesson }
  };
}