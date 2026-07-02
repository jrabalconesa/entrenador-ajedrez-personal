import { describe, expect, it } from 'vitest';
import { buildCoachLogDetails } from '../logic/coachDetails';

describe('coach detail explanations', () => {
  it('expands an error with the suggested move and opponent reply', () => {
    const details = buildCoachLogDetails(
      'Tu jugada Bc4 queda marcada como error. Mejor alternativa a calcular: Bxa6. Ojo con la respuesta Bb4+: el rival puede darte jaque inmediatamente.'
    );

    expect(details.join(' ')).toContain('Bxa6');
    expect(details.join(' ')).toContain('Bb4+');
    expect(details.join(' ')).toContain('jaques, capturas y amenazas');
  });

  it('explains why center comments are not absolute rules', () => {
    const details = buildCoachLogDetails('La jugada ocupa el centro, una zona clave para coordinar las piezas.');

    expect(details.join(' ')).toContain('movilidad');
    expect(details.join(' ')).toContain('no compensa');
  });
});
