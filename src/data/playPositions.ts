export interface PlayPositionPreset {
  id: string;
  name: string;
  fen: string;
  description: string;
}

export const playPositionPresets: PlayPositionPreset[] = [
  {
    id: 'initial',
    name: 'Posición inicial',
    fen: 'start',
    description: 'Partida completa desde el inicio.'
  },
  {
    id: 'italian-development',
    name: 'Apertura italiana',
    fen: 'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
    description: 'Practica desarrollo, centro y seguridad del rey.'
  },
  {
    id: 'isolated-queen-pawn',
    name: 'Peón aislado',
    fen: 'r2q1rk1/pp2bppp/2n1bn2/2pp4/3P4/2NBPN2/PP3PPP/R1BQ1RK1 w - - 0 9',
    description: 'Medio juego con tensión central y piezas activas.'
  },
  {
    id: 'rook-endgame',
    name: 'Final de torres',
    fen: '8/5pk1/6pp/8/4P3/6P1/5PKP/3R3r w - - 0 32',
    description: 'Final práctico: actividad de torre y rey.'
  }
];
