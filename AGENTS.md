# Instrucciones del repositorio

## Objetivo del producto

Este proyecto es una aplicación web local y progresiva de entrenamiento de
ajedrez para adultos de nivel aproximado 800–1400 ELO. Debe seguir siendo útil
sin registro, servidor, pagos ni servicios remotos. La interfaz y el contenido
están en español y deben mantener un tono claro, breve, alentador y pedagógico.

## Arquitectura detectada

- SPA/PWA con React 19, TypeScript estricto y Vite.
- `src/screens/`: pantallas y coordinación de la interacción.
- `src/components/`: componentes visuales reutilizables.
- `src/logic/`: reglas puras o reutilizables de ajedrez, adaptación, PGN,
  entrenador y Stockfish.
- `src/data/`: ejercicios, diagnóstico, conceptos, aperturas y plan diario.
- `src/storage/localStore.ts`: única frontera de persistencia en
  `localStorage`.
- `src/types.ts`: contratos de dominio compartidos.
- `src/tests/`: pruebas Vitest, principalmente de lógica y datos.
- `public/stockfish/`: motor local y licencia; Vite lo copia a `dist`.
- `public/sw.js`: service worker sencillo para uso offline.
- `.github/workflows/pages.yml`: pruebas, build y publicación de `dist` en
  GitHub Pages.

## Comandos de trabajo

Usa `pnpm`; el lockfile es `pnpm-lock.yaml`.

```bash
pnpm install --frozen-lockfile
pnpm run dev
pnpm run test
pnpm run build
pnpm run preview
```

Antes de dar por terminado un cambio de código, ejecuta como mínimo
`pnpm run test` y `pnpm run build`. Durante la iteración se puede ejecutar un
archivo concreto con `pnpm exec vitest run src/tests/<archivo>.test.ts`.

No edites ni incluyas manualmente `node_modules/` o `dist/`: son artefactos
generados e ignorados por Git.

## Convenciones de implementación

- Mantén TypeScript en modo estricto: no introduzcas `any`, variables o
  parámetros sin usar, ni silencios de tipos innecesarios.
- Sigue el estilo existente: comillas simples, punto y coma, imports relativos,
  componentes funcionales y tipos importados con `import type`.
- Conserva la separación de responsabilidades. La lógica ajedrecística y de
  selección debe vivir en `src/logic/`; los datos declarativos en `src/data/`;
  las pantallas no deben convertirse en una segunda capa de persistencia.
- Centraliza los contratos compartidos en `src/types.ts` y la lectura/escritura
  persistente en `src/storage/localStore.ts`.
- Prefiere funciones puras y deterministas para reglas de dominio. Cuando una
  función dependa de la fecha o del azar, permite inyectarlos o controlarlos en
  pruebas siguiendo el patrón de `adaptive.ts`.
- Reutiliza `boardMoveToSan`, `legalDestinations`, `kingInCheckSquare` y
  `boardNotationOptions` en lugar de duplicar reglas de tablero entre pantallas.

## Invariantes del dominio

- Valida FEN, turnos y movimientos con `chess.js`; no deduzcas legalidad sólo
  mediante coordenadas o texto SAN.
- Las soluciones deben almacenarse y compararse con SAN normalizada, respetando
  jaque (`+`), mate (`#`), enroque y promoción.
- Toda posición o línea nueva en ejercicios, diagnóstico, conceptos o aperturas
  debe tener una prueba que demuestre que es legal y que la solución esperada
  funciona. Para mate en dos, verifica todas las defensas legales.
- Evita FEN duplicadas dentro de una sesión usando la normalización existente
  que ignora los contadores.
- No rebajes las garantías de repetición espaciada: revisiones a +1, +3 y +7
  días, historial completado y reinicio de pendientes tras un nuevo fallo.
- La selección adaptativa debe respetar dificultad consolidada, prioridad de
  errores básicos y ausencia de repeticiones dentro de la sesión.
- Stockfish debe cargarse desde `public/stockfish/` mediante rutas compatibles
  con `import.meta.env.BASE_URL`. Conserva el evaluador interno como degradación
  segura cuando el Worker o WASM no esté disponible.

## Persistencia y compatibilidad

Los datos del usuario sólo viven en `localStorage`. Trátalos como datos
duraderos:

- No cambies ni reutilices una clave `epa_*_vN` con un esquema incompatible.
- Para un cambio incompatible, crea una versión nueva y una migración explícita.
- Conserva la recuperación ante JSON corrupto o estructuras incompatibles y,
  cuando aplique, crea respaldo antes de reiniciar datos.
- Añade pruebas de ida y vuelta, migración, valores ausentes y datos corruptos
  para cualquier modificación del almacenamiento.
- No añadas telemetría, cuentas, APIs o dependencias de red sin una petición
  explícita.

## Interfaz, contenido y accesibilidad

- Conserva la experiencia en español y evita jerga o variantes largas. Explica
  primero qué amenaza o idea práctica debe reconocer el alumno.
- Los fallos son oportunidades de repaso; evita lenguaje de castigo.
- Mantén controles utilizables tanto con clic como con interacción táctil y no
  dependas únicamente del color para comunicar acierto, error, selección o
  jaque.
- Reutiliza los componentes y clases CSS existentes antes de crear variantes.
- Si cambias una interacción de tablero, comprueba selección, arrastre,
  promoción, orientación y estados de jaque.

## PWA y despliegue

- `vite.config.ts` usa `base: './'`; no introduzcas rutas absolutas que fallen en
  una subruta de GitHub Pages.
- Los recursos públicos y el service worker deben resolverse con la base de
  Vite, no asumiendo que la aplicación vive en `/`.
- Si cambia el contenido cacheable o la estrategia offline, actualiza
  conscientemente `CACHE_NAME` y verifica la actualización desde una versión
  previa.
- El flujo de Pages usa Node 22 y pnpm 9, y publica únicamente `dist`.

## Pruebas según el cambio

- Lógica o selección adaptativa: prueba casos felices, límites y ausencia de
  mutaciones inesperadas.
- Datos ajedrecísticos: prueba legalidad, solución, turno, duplicados y objetivo
  pedagógico.
- Persistencia: prueba migración y recuperación además del caso normal.
- PGN/análisis: prueba PGN inválido, color analizado, severidad, FEN crítica,
  reanálisis y conservación de errores manuales.
- Stockfish: prueba el parseo UCI por separado; las pruebas no deben depender de
  red ni exigir que el Worker real se ejecute.
- UI: añade Testing Library cuando la conducta sólo pueda demostrarse a nivel de
  componente; mantén la mayor parte de las reglas en módulos puros.

## Límites operativos

- No publiques, hagas `git push` ni modifiques la configuración remota sin
  autorización explícita.
- Preserva cambios del usuario que ya estén sin confirmar. En particular,
  revisa `git status` antes y después de trabajar.
- Si una petición contradice el funcionamiento offline, la compatibilidad de
  datos o el público pedagógico, señala el impacto antes de implementarla.
