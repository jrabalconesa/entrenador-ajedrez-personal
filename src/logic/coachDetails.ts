export function buildCoachLogDetails(text: string): string[] {
  const details: string[] = [];
  const alternative = getMatch(text, /Mejor alternativa (?:a calcular|): ([^.]+)\./);
  const opponentReply = getMatch(text, /Ojo con la respuesta ([^:]+):/);

  if (text.includes('queda marcada como error') || text.includes('se marca como')) {
    details.push('La jugada puede ser legal, pero el entrenador la marca porque había una prioridad más concreta en la posición.');
    if (alternative) {
      details.push(`Compara primero tu jugada con ${alternative}: si esa opción gana material, evita una amenaza o mejora una pieza con más fuerza, debe calcularse antes.`);
    }
    if (opponentReply) {
      details.push(`La respuesta crítica es ${opponentReply}. Antes de confirmar tu jugada, mira si el rival tiene un jaque inmediato o una captura fuerte.`);
    }
    details.push('Orden de cálculo recomendado: jaques, capturas y amenazas de ambos bandos.');
    return details;
  }

  if (opponentReply) {
    return [
      `La idea importante es anticipar ${opponentReply}: no basta con que tu jugada tenga sentido si permite una respuesta forzada.`,
      'Antes de mover, revisa primero los jaques del rival y después sus capturas.'
    ];
  }

  if (text.includes('da jaque')) {
    return [
      'Dar jaque suele ser útil porque obliga al rival a responder y reduce sus opciones.',
      'Aun así, comprueba que el jaque no deja una pieza sin defensa ni pierde material después de la respuesta.'
    ];
  }

  if (text.includes('gana o cambia material') || text.includes('captura')) {
    return [
      'Las capturas deben calcularse mirando qué pieza se gana y qué pieza puede recapturar el rival.',
      'Si después del cambio quedas con más material o eliminas una amenaza, la captura suele ser una buena candidata.'
    ];
  }

  if (text.includes('centro')) {
    return [
      'El centro importa porque desde ahí las piezas tienen más movilidad y coordinan mejor los ataques.',
      'Pero ocupar el centro no compensa permitir un jaque, perder material o dejar una pieza colgada.'
    ];
  }

  if (text.startsWith('El rival juega')) {
    return [
      'Después de la jugada del rival, busca qué ha cambiado: qué pieza ataca, qué casillas controla y qué amenaza aparece.',
      'Responde primero a amenazas directas antes de seguir con un plan propio.'
    ];
  }

  if (text.startsWith('Correcto:')) {
    return [
      'La idea principal era encontrar la jugada concreta de la posición, no solo una jugada legal.',
      'Repite mentalmente por qué funcionaba para reconocer el mismo patrón en tus partidas.'
    ];
  }

  if (text.startsWith('Todavía no:')) {
    return [
      'Vuelve a la posición inicial y busca la jugada candidata que resuelve la amenaza principal.',
      'Calcula una línea corta: tu jugada, la mejor respuesta del rival y tu siguiente recurso.'
    ];
  }

  if (text.includes('Esa jugada no es legal')) {
    return [
      'Comprueba que la pieza puede llegar a esa casilla y que no hay una pieza bloqueando el camino.',
      'También revisa si tu rey quedaría en jaque después de mover.'
    ];
  }

  return [
    'Lee la posición con este orden: seguridad del rey, material amenazado, actividad de piezas y control del centro.',
    'Si hay una amenaza directa, resuélvela antes de hacer una jugada de desarrollo normal.'
  ];
}

function getMatch(text: string, pattern: RegExp): string | null {
  const match = text.match(pattern);
  return match?.[1]?.trim() || null;
}
