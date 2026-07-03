# Entrenador Personal de Ajedrez 800-1400

Aplicación web local para entrenar ajedrez de forma progresiva, clara y sin registro. Está pensada para un jugador adulto de nivel inicial que quiere mejorar desde unas 800 ELO hacia 1200-1400 disfrutando del proceso.

## Qué incluye la versión 1

- Entrenamiento diario recomendado de 20-30 minutos.
- Diagnóstico inicial con 15 posiciones progresivas.
- Ejercicios con tablero interactivo, pista, explicación y regla práctica.
- Opción "No lo sé" para registrar un fallo pedagógico sin lenguaje de castigo.
- Final de sesión con aciertos, errores principales, regla práctica y tema recomendado para mañana.
- Selección adaptativa sencilla según aciertos, fallos, revisiones y prioridad de errores básicos.
- Repetición espaciada con revisiones pendientes y completadas por ejercicio.
- Registro local de resultados en el navegador.
- Sección para guardar partidas PGN y marcar errores manualmente.
- Pantalla de progreso con aciertos por categoría, errores repetidos, temas de repaso, racha y progreso semanal.
- Análisis automático offline de partidas PGN con avisos priorizados, posición crítica y práctica desde el tablero.

Los datos se guardan en `localStorage`. No hay servidor externo, usuarios, pagos ni base de datos remota.

## Instalación

```bash
pnpm install
```

## Ejecutar en local

```bash
pnpm run dev
```

Después abre la dirección que muestre Vite, normalmente:

```text
http://127.0.0.1:5173
```

## Abrir en macOS con doble clic

En la raíz del proyecto hay dos lanzadores para macOS:

- `Abrir Entrenador de Ajedrez.command`: inicia la aplicación y abre el navegador.
- `Detener Entrenador de Ajedrez.command`: cierra el servidor local de forma segura.

### Primera vez: dar permiso de ejecución

Desde Terminal, **entra primero en la carpeta del proyecto** y luego ejecuta:

```bash
cd ~/Downloads/entrenador-ajedrez-personal
chmod +x "Abrir Entrenador de Ajedrez.command"
chmod +x "Detener Entrenador de Ajedrez.command"
```

Si el proyecto está en otra ruta, sustituye la línea `cd` por la carpeta correcta.

Si macOS bloquea el archivo la primera vez, abre **Ajustes del Sistema → Privacidad y seguridad** y permite su ejecución, o haz clic derecho sobre el archivo → **Abrir** → **Abrir**.

### Abrir la aplicación

1. Haz doble clic en `Abrir Entrenador de Ajedrez.command`.
2. Se abrirá una ventana de Terminal.
3. El lanzador comprobará que `pnpm` está disponible.
4. Si falta `node_modules`, ejecutará `pnpm install` automáticamente.
5. Iniciará `pnpm run dev`, esperará a que Vite responda y abrirá `http://127.0.0.1:5173` en el navegador.
6. Si el entrenador ya estaba en marcha, no abrirá otra instancia: solo abrirá el navegador.

Requisitos: tener instalados **Node.js** y **pnpm**.

### Cerrar la aplicación

Puedes cerrarla de cualquiera de estas formas:

- Cierra la ventana de Terminal que quedó abierta al iniciar el entrenador.
- Haz doble clic en `Detener Entrenador de Ajedrez.command`.

Tus datos de entrenamiento se guardan en el navegador (`localStorage`) y no se pierden al cerrar el servidor.

## Comprobar calidad

```bash
pnpm run test
pnpm run build
```

## Publicar en GitHub Pages

El proyecto incluye un flujo de GitHub Actions en `.github/workflows/pages.yml`.
Cuando se sube la rama `main` a GitHub, el flujo ejecuta pruebas, compila la app y publica la carpeta `dist` en GitHub Pages.

Pasos en GitHub:

1. Crea un repositorio nuevo.
2. Sube esta carpeta a la rama `main`.
3. En el repositorio, abre **Settings → Pages**.
4. En **Build and deployment**, selecciona **GitHub Actions**.
5. Espera a que termine la acción **Publicar en GitHub Pages**.

La app está configurada con rutas relativas para funcionar tanto en local como en una URL de GitHub Pages tipo `https://usuario.github.io/repositorio/`.

## Crear ZIP limpio

Desde la carpeta del proyecto:

```bash
zip -r entrenador-ajedrez-personal.zip . -x "node_modules/*" "dist/*" "__MACOSX/*" "*.DS_Store"
```

Las pruebas verifican:

- legalidad de FEN y soluciones esperadas;
- coherencia de turnos;
- rechazo de posiciones con el rival ya en jaque, reyes adyacentes, peones en primera/octava o reyes incorrectos;
- notación SAN normalizada, incluidos los símbolos `+` y `#`;
- mates en 1 reales;
- mates en 2 con búsqueda exhaustiva: cada defensa legal debe permitir mate en 1;
- distribución del diagnóstico inicial;
- persistencia y recuperación desde `localStorage`;
- tolerancia ante datos corruptos en almacenamiento local;
- migración de intentos desde `epa_attempts_v1` a `epa_attempts_v2`;
- tolerancia ante JSON válido con estructura incompatible, guardando respaldo antes de reiniciar intentos;
- validación básica de PGN;
- análisis automático de PGN con avisos automáticos, severidad, alternativa sugerida y posición FEN crítica;
- reanálisis de partidas conservando errores manuales y reemplazando avisos automáticos anteriores;
- práctica de avisos automáticos con persistencia de repasos y aciertos;
- prioridad adaptativa de errores básicos;
- selección ponderada sin repetir ejercicio ni FEN durante la sesión;
- fin de sesión cuando no quedan ejercicios elegibles;
- bloqueo de ejercicios por encima de la dificultad consolidada.

## Estructura principal

- `src/data/exercises.ts`: ejercicios iniciales en FEN.
- `src/data/diagnostic.ts`: diagnóstico inicial de 15 posiciones.
- `src/logic/adaptive.ts`: selección adaptativa y cálculo de rendimiento.
- `src/logic/pgn.ts`: validación básica de PGN.
- `src/logic/gameAnalysis.ts`: análisis automático offline de partidas PGN y registro de práctica de avisos.
- `src/storage/localStore.ts`: persistencia local.
- `src/screens/`: pantallas principales.
- `src/components/`: componentes reutilizables.
- `src/tests/`: pruebas de lógica adaptativa, ejercicios, almacenamiento y PGN.

## Auditoría realizada

Se revisaron los ejercicios con `chess.js`. Se sustituyeron las posiciones problemáticas `pc-01`, `ar-01`, `ar-02` y `jca-01`, y se eliminaron duplicados conceptuales entre piezas colgadas, amenazas del rival y JCA. Cada ejercicio incluye un metadato interno `teachingPoint` con la idea que debe enseñar.

Se añadieron cuatro amenazas del rival con peligro concreto, dos ejercicios de clavada, tres de desarrollo/enroque y un final de rey y peón centrado en no avanzar el peón prematuramente. Las posiciones de mate en 2 se validan por búsqueda limitada con `chess.js`: primer movimiento del jugador, todas las respuestas legales del rival y existencia de mate en 1.

La repetición espaciada ya no guarda sólo una fecha genérica. Cada intento conserva `attemptKind`, `reviewId`, `pendingReviews` y `completedReviews`: al fallar se programan repasos a +1, +3 y +7 días; un acierto sólo completa un repaso si el intento es de tipo `review`, tiene `reviewId` y esa revisión está vencida; si hay un nuevo fallo se reinicia la secuencia pendiente manteniendo el historial completado. Tras completar los tres repasos correctos, el ejercicio baja mucho su prioridad y sólo aparece ocasionalmente.

La selección adaptativa ya no elige siempre el mayor peso. Excluye ejercicios y FEN vistos durante la sesión, normaliza FEN ignorando contadores, descarta dificultades superiores al nivel permitido, toma los cinco candidatos mejor puntuados y elige entre ellos con probabilidad ponderada. Si no quedan candidatos, la pantalla muestra la sesión completada.

Se revisó el enfoque pedagógico para mantener explicaciones breves, sin variantes largas y centradas en amenazas de una jugada, piezas indefensas, jaques, capturas, desarrollo, enroque y finales básicos.

## Análisis automático de partidas

La sección `Mis partidas` permite guardar un PGN externo y lanzar `Analizar partida`. El análisis actual es local y no usa servidor externo: reconstruye la partida con `chess.js`, analiza sólo el color indicado cuando se guarda la partida como blancas o negras, y analiza ambos bandos si el color queda `sin indicar`.

El análisis usa Stockfish.js 18 localmente desde `public/stockfish/stockfish.js`. La build incluida es `lite single-threaded`, más ligera que la versión completa y compatible con navegador local sin cabeceras especiales. Si el navegador no puede cargar el motor, el programa no se rompe: cae automáticamente al evaluador interno basado en material, jaques, actividad, centro y piezas indefensas.

Archivos incluidos:

```text
public/stockfish/stockfish.js
public/stockfish/stockfish.wasm
public/stockfish/Copying.txt
```

Al ejecutar `pnpm run build`, Vite copia esa carpeta a `dist/stockfish/`, de modo que el navegador local pueda cargar el motor sin servidor externo.

Cada aviso automático puede guardar:

- jugada y número de jugada;
- categoría del error;
- alternativa sugerida;
- severidad aproximada: imprecisión, error o grave;
- pérdida aproximada en centipeones cuando procede;
- FEN antes y después de la jugada.

Los avisos automáticos aparecen ordenados por prioridad. La ficha de la partida muestra el resumen de errores y la primera posición recomendada para revisar. Al pulsar `Practicar`, la posición crítica se carga en el tablero superior. Si el jugador encuentra la alternativa sugerida, el aviso registra un acierto; si no, registra un intento y permite repetir con `Deshacer`.

Reanalizar una partida reemplaza los avisos automáticos anteriores, pero conserva los errores añadidos manualmente.

## Próximas mejoras previstas

- Añadir una pantalla de configuración del motor: profundidad, tiempo por jugada y estado de carga.
- Comparar varias líneas candidatas del motor y no sólo la primera.
- Ampliar ejercicios de finales y planes de apertura.
