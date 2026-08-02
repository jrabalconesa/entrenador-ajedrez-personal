import type { Exercise } from '../types';

export const advancedExercises: Exercise[] = [
  {
    id: 'lx-oiG01', category: 'mate en 2', difficulty: 4,
    fen: '2kr4/2p3p1/2P1b1Np/1rn5/8/5P2/1B4PP/R5K1 w - - 0 28', sideToMove: 'w',
    question: 'Las negras acaban de capturar en d8. ¿Cómo aprovechas la clavada para forzar mate?', expectedMove: 'Ra8+',
    explanation: 'Ra8+ obliga a ...Rb8; entonces Ne7# remata. La torre de b5 no puede abandonar la octava fila sin dejar al rey expuesto.',
    practicalRule: 'Si una defensa está clavada al rey, busca un jaque que la obligue a bloquear.', hint: 'Obliga a la torre negra a interponerse.',
    tags: ['Lichess', 'oiG01', 'clavada', 'mate forzado'], teachingPoint: 'Combinar clavada y desviación para construir una red de mate.'
  },
  {
    id: 'lx-bht5O', category: 'doble ataque', difficulty: 4,
    fen: '5r1k/6pp/p5q1/2p5/3pN3/3n2P1/P3QPK1/1R1N4 b - - 0 35', sideToMove: 'b',
    question: '¿Qué salto con jaque gana una pieza mayor?', expectedMove: 'Nf4+',
    explanation: 'Nf4+ fuerza al rey a responder y ataca la dama de e2. Tras Kf1, Nxe2 gana la dama.',
    practicalRule: 'Un tenedor con jaque obliga a responder al rey antes de salvar la otra pieza.', hint: 'Busca un salto del caballo de d3.',
    tags: ['Lichess', 'bht5O', 'tenedor', 'jaque'], teachingPoint: 'Encontrar un tenedor de caballo intermedio en una posición cargada.'
  },
  {
    id: 'lx-gNkCD', category: 'medio juego', difficulty: 4,
    fen: '8/8/7p/5ppk/2r2P1P/5PK1/8/7R w - - 0 70', sideToMove: 'w',
    question: '¿Qué captura con jaque activa un ataque descubierto contra la torre?', expectedMove: 'hxg5+',
    explanation: 'hxg5+ aparta al rey. Después Rxh6+ descubre que la torre de h1 ataca a la torre de c4 por la cuarta fila.',
    practicalRule: 'Una captura con jaque puede abrir una línea para otra pieza: mira qué rayos quedan libres.', hint: 'Abre la cuarta fila con ganancia de tiempo.',
    tags: ['Lichess', 'gNkCD', 'ataque descubierto', 'final de torres'], teachingPoint: 'Visualizar una línea horizontal que aparece al mover un peón.'
  },
  {
    id: 'lx-u9UWG', category: 'jaques, capturas y amenazas', difficulty: 5,
    fen: 'r4rk1/p1pn1pp1/1p2p2q/6Q1/4P3/PP6/1B1KBP2/R7 w - - 1 22', sideToMove: 'w',
    question: 'La dama negra se ofrece en h6. ¿Por qué debes aceptar el sacrificio?', expectedMove: 'Qxh6',
    explanation: 'Qxh6 elimina la dama. Tras ...gxh6, Rg1+ inicia una secuencia forzada que acaba ganando la torre de d7 por ataque descubierto.',
    practicalRule: 'Calcula hasta que cesen los jaques antes de rechazar una captura de dama.', hint: 'Calcula Qxh6 gxh6 Rg1+.',
    tags: ['Lichess', 'u9UWG', 'sacrificio de dama', 'ataque descubierto'], teachingPoint: 'Aceptar un sacrificio y calcular una secuencia larga de jaques.'
  },
  {
    id: 'lx-MOU5h', category: 'jaques, capturas y amenazas', difficulty: 5,
    fen: '5rk1/ppb2rpp/2p5/8/P3Nq2/1PQP1N1P/1BP3P1/5R1K b - - 0 24', sideToMove: 'b',
    question: '¿Qué sacrificio inicia una red de mate forzado?', expectedMove: 'Qh2+',
    explanation: 'Qh2+ obliga Nxh2. Entonces ...Rxf1+ fuerza Nxf1 y ...Rxf1#; cada defensor es desviado por orden.',
    practicalRule: 'En una red de mate, cuenta defensores y busca desviaciones consecutivas con jaque.', hint: 'Aparta primero el caballo de f3.',
    tags: ['Lichess', 'MOU5h', 'sacrificio', 'desviación', 'mate forzado'], teachingPoint: 'Calcular un mate largo con dos desviaciones consecutivas.'
  },
  {
    id: 'lx-UjZa9', category: 'jaques, capturas y amenazas', difficulty: 5,
    fen: '6rk/p6p/1p2Qpr1/8/3PRP2/q5P1/7P/4R1K1 b - - 0 27', sideToMove: 'b',
    question: 'La dama blanca acaba de capturar en e6. ¿Qué sacrificio abre al rey?', expectedMove: 'Rxg3+',
    explanation: 'Rxg3+ obliga hxg3. Sigue ...Qxg3+ y, tras Kf1, ...Qg2#.',
    practicalRule: 'Un sacrificio junto al rey funciona si la recaptura abre una línea forzada para la dama.', hint: 'El peón de g3 es la puerta de entrada.',
    tags: ['Lichess', 'UjZa9', 'sacrificio de torre', 'mate forzado'], teachingPoint: 'Reconocer una demolición del enroque mediante sacrificio.'
  },
  {
    id: 'lx-lbrNX', category: 'jaques, capturas y amenazas', difficulty: 5,
    fen: 'r6k/ppp3pp/4Q3/1b6/3P4/qPP3P1/P3r3/1K1R3R w - - 0 24', sideToMove: 'w',
    question: '¿Qué sacrificio ignora las amenazas negras y fuerza mate?', expectedMove: 'Rxh7+',
    explanation: 'Rxh7+ obliga Kxh7. Rh1+ fuerza ...Rh2 y Rxh2#; la segunda torre entra por la columna abierta.',
    practicalRule: 'Comprueba si un sacrificio arrastra al rey a la línea de otra torre.', hint: 'Abre la columna h entregando una torre.',
    tags: ['Lichess', 'lbrNX', 'atracción', 'sacrificio de torre'], teachingPoint: 'Coordinar dos torres mediante atracción y apertura de columna.'
  },
  {
    id: 'lx-QZmWx', category: 'doble ataque', difficulty: 4,
    fen: '8/pp2kp2/4pb1R/8/2Pr4/1P3P2/P1KB4/8 b - - 2 35', sideToMove: 'b',
    question: '¿Qué captura intermedia cambia el orden y decide la posición?', expectedMove: 'Rxd2+',
    explanation: 'Rxd2+ obliga Kxd2. Entonces ...Bg5+ gana un tiempo y el alfil termina capturando la torre de h6.',
    practicalRule: 'Antes de salvar una pieza atacada, busca una captura con jaque que cambie el orden.', hint: 'La torre negra puede capturar el alfil con jaque.',
    tags: ['Lichess', 'QZmWx', 'jugada intermedia', 'tenedor'], teachingPoint: 'Usar un zwischenzug para crear un tenedor decisivo.'
  },
  {
    id: 'lx-cMIYt', category: 'mate en 2', difficulty: 4,
    fen: '4r1k1/4qppp/3B4/pp1B4/3Q1P2/1P6/2r3PP/3R2K1 b - - 2 29', sideToMove: 'b',
    question: '¿Qué jaque de dama desvía la torre defensora?', expectedMove: 'Qe1+',
    explanation: 'Qe1+ obliga Rxe1; entonces ...Rxe1# aprovecha que el rey no tiene escape.',
    practicalRule: 'Desvía al único defensor si tu siguiente recaptura termina la partida.', hint: 'Ofrece la dama en e1.',
    tags: ['Lichess', 'cMIYt', 'desviación', 'sacrificio de dama'], teachingPoint: 'Sacrificar la dama para desviar la defensa de la primera fila.'
  },
  {
    id: 'lx-xWkCz', category: 'jaques, capturas y amenazas', difficulty: 4,
    fen: '4r1k1/5p2/1p4p1/p6p/P2Q2qP/6P1/1P3P2/3R2K1 b - - 2 25', sideToMove: 'b',
    question: '¿Cómo desvías la torre blanca y ganas la dama?', expectedMove: 'Re1+',
    explanation: 'Re1+ fuerza Rxe1. La dama negra captura entonces Qxd4 y gana la dama blanca.',
    practicalRule: 'Un jaque de desviación puede apartar al único defensor de una pieza valiosa.', hint: 'La torre de d1 debe responder al jaque.',
    tags: ['Lichess', 'xWkCz', 'desviación', 'jaque intermedio'], teachingPoint: 'Desviar una torre con jaque antes de capturar la dama.'
  },
  {
    id: 'lx-07fq1', category: 'doble ataque', difficulty: 5,
    fen: '8/2R3pk/6q1/5p2/8/2P2Q1P/r5P1/7K b - - 0 38', sideToMove: 'b',
    question: 'Encuentra la secuencia forzada que desvía al rey y gana la dama.', expectedMove: 'Ra1+',
    explanation: 'Ra1+ obliga Kh2. Sigue ...Qd6+; tras Qg3, ...Rh1+ fuerza Kxh1 y ...Qxg3 gana la dama.',
    practicalRule: 'En combinaciones largas, sigue los jaques y localiza dónde acaba cada pieza.', hint: 'Empieza llevando la torre a la primera fila.',
    tags: ['Lichess', '07fq1', 'desviación', 'cálculo largo'], teachingPoint: 'Calcular tres jaques antes de recoger la ganancia.'
  },
  {
    id: 'lx-OVNEx', category: 'jaques, capturas y amenazas', difficulty: 5,
    fen: '6k1/ppQ2pp1/4bb1p/P2p4/1q6/5N1P/2B2PP1/6K1 w - - 4 27', sideToMove: 'w',
    question: '¿Qué jaque inicia una desviación profunda?', expectedMove: 'Qb8+',
    explanation: 'Qb8+ fuerza ...Qf8. Bh7+ atrae al rey a h7 y Qxf8 gana la dama que quedó bloqueando.',
    practicalRule: 'Si una pieza valiosa bloquea un jaque, aparta al rey con otro jaque antes de capturarla.', hint: 'Obliga a la dama negra a interponerse en f8.',
    tags: ['Lichess', 'OVNEx', 'desviación', 'atracción'], teachingPoint: 'Combinar bloqueo forzado y atracción para ganar la dama.'
  },
  {
    id: 'lx-7gkHr', category: 'doble ataque', difficulty: 4,
    fen: 'r5k1/pp3p1p/6p1/q3N3/5Q2/bPn1P1P1/P4P1P/1R1R2K1 b - - 2 26', sideToMove: 'b',
    question: '¿Qué salto crea un tenedor que la dama blanca no puede evitar?', expectedMove: 'Ne2+',
    explanation: 'Ne2+ obliga al rey a responder. Después ...Nxf4+ captura la dama y mantiene la iniciativa con jaque.',
    practicalRule: 'Los mejores tenedores encadenan jaques: la pieza atacada no recibe tiempo para escapar.', hint: 'El caballo de c3 puede saltar a e2.',
    tags: ['Lichess', '7gkHr', 'tenedor', 'caballo'], teachingPoint: 'Reconocer una secuencia forzante de saltos de caballo.'
  },
  {
    id: 'lx-5XNja', category: 'doble ataque', difficulty: 5,
    fen: 'r4r1k/1pq1n1p1/p1p4p/3b4/3QR2N/1P3N2/P5PP/R5K1 w - - 1 24', sideToMove: 'w',
    question: '¿Qué sacrificio elimina al defensor y prepara un tenedor?', expectedMove: 'Rxe7',
    explanation: 'Rxe7 atrae la dama a e7. Tras ...Qxe7, Ng6+ da jaque y ataca la dama; Nxe7 recupera con ganancia.',
    practicalRule: 'Un sacrificio funciona si coloca una pieza rival en la casilla exacta del tenedor.', hint: 'Captura en e7 y calcula Ng6+.',
    tags: ['Lichess', '5XNja', 'sacrificio', 'tenedor'], teachingPoint: 'Preparar un tenedor mediante sacrificio y atracción.'
  },
  {
    id: 'lx-opening-english', category: 'aperturas populares', difficulty: 4,
    fen: 'rnbqkbnr/pppp1ppp/8/4p3/2P5/8/PP1PPPPP/RNBQKBNR w KQkq - 0 2', sideToMove: 'w',
    question: 'En la Inglesa con ...e5, ¿qué desarrollo refuerza el control de d5?', expectedMove: 'Nc3',
    explanation: 'Nc3 desarrolla una pieza y aumenta el control de d5, la casilla estratégica central de la Inglesa.',
    practicalRule: 'En la Inglesa, coordina c4, Cc3 y el alfil de g2 antes de decidir la ruptura central.', hint: 'Desarrolla el caballo de dama.',
    tags: ['Inglesa', 'control central'], teachingPoint: 'Reconocer el esquema flexible de la Apertura Inglesa.'
  },
  {
    id: 'lx-opening-scandinavian', category: 'aperturas populares', difficulty: 4,
    fen: 'rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2', sideToMove: 'w',
    question: 'La Escandinava desafía e4 de inmediato. ¿Cómo responde el blanco en la línea principal?', expectedMove: 'exd5',
    explanation: 'exd5 acepta el desafío central. Tras ...Dxd5, Cc3 desarrolla con ganancia de tiempo sobre la dama.',
    practicalRule: 'Usa los tiempos contra la dama para desarrollar, no para lanzar peones sin coordinación.', hint: 'Resuelve primero la tensión central.',
    tags: ['Escandinava', 'desarrollo'], teachingPoint: 'Entender la respuesta central y la ganancia de tiempo típica contra la Escandinava.'
  }
];