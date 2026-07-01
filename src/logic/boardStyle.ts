import type { ChessboardOptions } from 'react-chessboard';

export const boardNotationOptions: Pick<
  ChessboardOptions,
  'darkSquareNotationStyle' | 'lightSquareNotationStyle' | 'alphaNotationStyle' | 'numericNotationStyle'
> = {
  darkSquareNotationStyle: { color: '#111827' },
  lightSquareNotationStyle: { color: '#111827' },
  alphaNotationStyle: { fontSize: '16px', fontWeight: 800, bottom: 2, right: 5 },
  numericNotationStyle: { fontSize: '16px', fontWeight: 800, top: 3, left: 4 }
};
