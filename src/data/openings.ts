import type { OpeningCourse } from '../types';

export const openingCourses: OpeningCourse[] = [
  {
    id: 'london',
    name: 'Sistema Londres',
    side: 'blancas',
    difficulty: 1,
    summary: 'Sistema estable contra muchas respuestas: desarrollo natural, alfil activo y estructura sólida.',
    plan: ['Jugar d4 y Bf4 temprano.', 'Construir con e3, Nf3 y c3.', 'Enrocar sin buscar ataques prematuros.'],
    lines: [
      {
        id: 'london-main',
        name: 'Esquema base contra ...Nf6 y ...d5',
        keyIdeas: ['Alfil fuera antes de e3.', 'Centro estable con d4, e3 y c3.', 'Desarrollo simple antes de atacar.'],
        moves: [
          { san: 'd4', explanation: 'Ocupa el centro y abre el camino al alfil de c1.' },
          { san: 'Nf6', explanation: 'Las negras desarrollan una pieza y presionan e4.' },
          { san: 'Bf4', explanation: 'La jugada característica: el alfil sale antes de cerrar la diagonal con e3.' },
          { san: 'd5', explanation: 'Las negras ocupan el centro y hacen una estructura simétrica.' },
          { san: 'e3', explanation: 'Sostiene d4 y abre el camino al alfil de f1.' },
          { san: 'e6', explanation: 'Las negras refuerzan d5 y preparan el desarrollo del alfil.' },
          { san: 'Nf3', explanation: 'Desarrolla una pieza, controla e5 y prepara el enroque.' },
          { san: 'c5', explanation: 'Las negras golpean el centro blanco desde el flanco.' },
          { san: 'c3', explanation: 'Refuerza d4 y conserva el esquema sólido del Londres.' },
          { san: 'Nc6', explanation: 'Las negras desarrollan y aumentan la presión central.' }
        ]
      }
    ]
  },
  {
    id: 'italian',
    name: 'Apertura Italiana',
    side: 'blancas',
    difficulty: 2,
    summary: 'Apertura clásica de desarrollo rápido, presión sobre f7 y preparación de rupturas centrales.',
    plan: ['Ocupar el centro con e4.', 'Desarrollar Nf3 y Bc4.', 'Preparar d4 con c3 cuando el centro lo permita.'],
    lines: [
      {
        id: 'italian-c3-d4',
        name: 'Italiana con c3 y d4',
        keyIdeas: ['Presión natural sobre f7.', 'c3 prepara d4.', 'El ataque llega después del desarrollo.'],
        moves: [
          { san: 'e4', explanation: 'Ocupa el centro y abre líneas para dama y alfil.' },
          { san: 'e5', explanation: 'Las negras responden de forma clásica en el centro.' },
          { san: 'Nf3', explanation: 'Ataca e5 y desarrolla una pieza hacia el centro.' },
          { san: 'Nc6', explanation: 'Las negras defienden e5 y desarrollan el caballo.' },
          { san: 'Bc4', explanation: 'El alfil sale a una diagonal activa y mira f7.' },
          { san: 'Bc5', explanation: 'Las negras desarrollan de forma simétrica y presionan f2.' },
          { san: 'c3', explanation: 'Prepara d4 para discutir el centro con más fuerza.' },
          { san: 'Nf6', explanation: 'Las negras atacan e4 y desarrollan una pieza más.' },
          { san: 'd4', explanation: 'Ruptura central preparada: ahora las blancas luchan por espacio.' },
          { san: 'exd4', explanation: 'Las negras capturan en el centro y fuerzan a las blancas a decidir.' }
        ]
      }
    ]
  },
  {
    id: 'queens-gambit',
    name: 'Gambito de Dama',
    side: 'blancas',
    difficulty: 3,
    summary: 'Apertura de peón de dama para presionar d5 y construir ventaja central con piezas activas.',
    plan: ['Jugar d4 y c4 para discutir el centro.', 'Desarrollar Nc3 y Bg5.', 'Sostener el centro antes de buscar iniciativa.'],
    lines: [
      {
        id: 'qg-declined',
        name: 'Gambito de Dama Rehusado básico',
        keyIdeas: ['c4 presiona d5.', 'Nc3 aumenta la presión central.', 'Bg5 desarrolla con una amenaza útil.'],
        moves: [
          { san: 'd4', explanation: 'Ocupa el centro y prepara un juego de estructura sólida.' },
          { san: 'd5', explanation: 'Las negras igualan presencia central.' },
          { san: 'c4', explanation: 'Ataca d5: el gambito busca presión central, no regalar un peón sin sentido.' },
          { san: 'e6', explanation: 'Las negras sostienen d5 y aceptan encerrar temporalmente su alfil de c8.' },
          { san: 'Nc3', explanation: 'Desarrolla y aumenta la presión sobre d5.' },
          { san: 'Nf6', explanation: 'Las negras desarrollan y controlan e4.' },
          { san: 'Bg5', explanation: 'Desarrolla el alfil y crea presión sobre el caballo de f6.' },
          { san: 'Be7', explanation: 'Las negras rompen la clavada y preparan el enroque.' },
          { san: 'e3', explanation: 'Sostiene d4 y abre el alfil de f1.' },
          { san: 'O-O', explanation: 'Las negras ponen el rey a salvo.' }
        ]
      }
    ]
  },
  {
    id: 'ruy-lopez',
    name: 'Apertura Española',
    side: 'blancas',
    difficulty: 4,
    summary: 'Apertura estratégica: presión lenta sobre e5, conservación de tensión y mejora gradual de piezas.',
    plan: ['Presionar el caballo de c6 con Bb5.', 'Mantener el alfil con Ba4 tras ...a6.', 'Enrocar y preparar el centro con paciencia.'],
    lines: [
      {
        id: 'ruy-main',
        name: 'Española principal hasta el enroque',
        keyIdeas: ['Bb5 presiona indirectamente e5.', 'Ba4 mantiene tensión.', 'O-O prioriza seguridad antes del plan central.'],
        moves: [
          { san: 'e4', explanation: 'Ocupa el centro y abre líneas para desarrollar las piezas con rapidez.' },
          { san: 'e5', explanation: 'Las negras responden de forma clásica.' },
          { san: 'Nf3', explanation: 'Ataca e5 y desarrolla una pieza.' },
          { san: 'Nc6', explanation: 'Las negras defienden e5 y desarrollan una pieza hacia el centro.' },
          { san: 'Bb5', explanation: 'La idea española: presionar el defensor de e5.' },
          { san: 'a6', explanation: 'Las negras preguntan al alfil si cambia o se retira.' },
          { san: 'Ba4', explanation: 'Mantiene el alfil y conserva la presión estratégica.' },
          { san: 'Nf6', explanation: 'Las negras atacan e4 y desarrollan.' },
          { san: 'O-O', explanation: 'El rey queda seguro antes de abrir el centro.' },
          { san: 'Be7', explanation: 'Las negras preparan el enroque y completan desarrollo.' }
        ]
      }
    ]
  },
  {
    id: 'caro-kann',
    name: 'Defensa Caro-Kann',
    side: 'negras',
    difficulty: 1,
    summary: 'Defensa sólida contra 1.e4: preparar ...d5 sin debilitar el rey.',
    plan: ['Responder a e4 con ...c6.', 'Golpear el centro con ...d5.', 'Cambiar en e4 cuando el centro quede definido.'],
    lines: [
      {
        id: 'caro-main',
        name: 'Caro-Kann clásica con ...Bf5',
        keyIdeas: ['...c6 prepara ...d5.', '...dxe4 define el centro.', '...Bf5 activa el alfil antes de ...e6.'],
        moves: [
          { san: 'e4', explanation: 'Las blancas ocupan el centro y abren líneas para sus piezas.' },
          { san: 'c6', explanation: 'Preparas ...d5 con una estructura sólida.' },
          { san: 'd4', explanation: 'Las blancas construyen un centro fuerte.' },
          { san: 'd5', explanation: 'Golpeas e4 y discutes el centro blanco.' },
          { san: 'Nc3', explanation: 'Las blancas defienden e4 y desarrollan una pieza central.' },
          { san: 'dxe4', explanation: 'Defines el centro y obligas al caballo blanco a recapturar.' },
          { san: 'Nxe4', explanation: 'Las blancas recuperan el peón y centralizan el caballo.' },
          { san: 'Bf5', explanation: 'Activas el alfil antes de cerrar la estructura con ...e6.' },
          { san: 'Ng3', explanation: 'Las blancas atacan el alfil y ganan tiempo.' },
          { san: 'Bg6', explanation: 'Conservas el alfil activo y mantienes una posición sólida.' }
        ]
      }
    ]
  },
  {
    id: 'french',
    name: 'Defensa Francesa',
    side: 'negras',
    difficulty: 2,
    summary: 'Defensa estructural contra 1.e4: centro firme con ...e6 y ...d5, aceptando el reto del alfil de c8.',
    plan: ['Jugar ...e6 y ...d5.', 'Presionar e4 con piezas.', 'Atacar el centro blanco antes de liberar el alfil malo.'],
    lines: [
      {
        id: 'french-classical',
        name: 'Francesa clásica contra Nc3',
        keyIdeas: ['...e6 prepara ...d5.', '...Nf6 presiona e4.', '...Be7 y ...O-O completan desarrollo.'],
        moves: [
          { san: 'e4', explanation: 'Las blancas ocupan el centro y abren líneas para sus piezas.' },
          { san: 'e6', explanation: 'Preparas ...d5 y aceptas una estructura sólida.' },
          { san: 'd4', explanation: 'Las blancas construyen un centro amplio.' },
          { san: 'd5', explanation: 'Atacas e4 y fijas la estructura francesa.' },
          { san: 'Nc3', explanation: 'Las blancas defienden e4 y desarrollan una pieza central.' },
          { san: 'Nf6', explanation: 'Desarrollas y aumentas la presión sobre e4.' },
          { san: 'Bg5', explanation: 'Las blancas clavan el caballo y buscan iniciativa.' },
          { san: 'Be7', explanation: 'Rompes la clavada y preparas el enroque.' },
          { san: 'e5', explanation: 'Las blancas ganan espacio y cierran el centro.' },
          { san: 'Nfd7', explanation: 'Recolocas el caballo y preparas presión contra el centro blanco.' }
        ]
      }
    ]
  },
  {
    id: 'kings-indian',
    name: 'Defensa India de Rey',
    side: 'negras',
    difficulty: 3,
    summary: 'Sistema flexible contra d4: permites espacio blanco y preparas contraataque con desarrollo rápido.',
    plan: ['Desarrollar ...Nf6, ...g6 y ...Bg7.', 'Sostener el centro con ...d6.', 'Enrocar antes de buscar rupturas.'],
    lines: [
      {
        id: 'kid-main',
        name: 'Estructura base de India de Rey',
        keyIdeas: ['Fianchetto rápido.', 'El centro se sostiene con ...d6.', 'El contraataque llega tras el enroque.'],
        moves: [
          { san: 'd4', explanation: 'Las blancas ocupan el centro y reclaman espacio desde el primer movimiento.' },
          { san: 'Nf6', explanation: 'Desarrollas una pieza y controlas e4 sin comprometer todavía el centro.' },
          { san: 'c4', explanation: 'Las blancas ganan más espacio central.' },
          { san: 'g6', explanation: 'Preparas el fianchetto del alfil de rey.' },
          { san: 'Nc3', explanation: 'Las blancas refuerzan d5 y e4 mientras completan desarrollo.' },
          { san: 'Bg7', explanation: 'El alfil queda en la gran diagonal.' },
          { san: 'e4', explanation: 'Las blancas forman un centro grande.' },
          { san: 'd6', explanation: 'Sostienes el centro y preparas desarrollo seguro.' },
          { san: 'Nf3', explanation: 'Las blancas desarrollan y protegen el centro.' },
          { san: 'O-O', explanation: 'El rey negro queda seguro antes del contraataque.' }
        ]
      }
    ]
  },
  {
    id: 'sicilian',
    name: 'Defensa Siciliana',
    side: 'negras',
    difficulty: 4,
    summary: 'Defensa asimétrica contra 1.e4: no imitas con ...e5, luchas desde el flanco por el centro.',
    plan: ['Responder con ...c5.', 'Preparar desarrollo con ...d6 y ...Nf6.', 'Aceptar posiciones desequilibradas con juego activo.'],
    lines: [
      {
        id: 'sicilian-najdorf-shape',
        name: 'Siciliana abierta con ...a6',
        keyIdeas: ['...c5 crea desequilibrio.', '...cxd4 abre la columna c.', '...a6 prepara una estructura flexible y evita saltos molestos.'],
        moves: [
          { san: 'e4', explanation: 'Las blancas ocupan el centro y preparan desarrollo rápido.' },
          { san: 'c5', explanation: 'La idea siciliana: atacar el centro desde un lado.' },
          { san: 'Nf3', explanation: 'Las blancas desarrollan y preparan d4.' },
          { san: 'd6', explanation: 'Controlas e5 y preparas ...Nf6.' },
          { san: 'd4', explanation: 'Las blancas abren el centro para transformar la partida en Siciliana abierta.' },
          { san: 'cxd4', explanation: 'Cambias el peón lateral por un peón central.' },
          { san: 'Nxd4', explanation: 'Las blancas centralizan el caballo.' },
          { san: 'Nf6', explanation: 'Atacas e4 y desarrollas con tiempo.' },
          { san: 'Nc3', explanation: 'Las blancas defienden e4 y completan el desarrollo del flanco de dama.' },
          { san: 'a6', explanation: 'Controlas b5 y preparas una estructura flexible tipo Najdorf.' }
        ]
      }
    ]
  }
];
