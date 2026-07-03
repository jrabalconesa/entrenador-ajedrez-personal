# Stockfish 18

Esta carpeta incluye Stockfish.js 18 en variante `lite single-threaded`, una build WebAssembly compatible con Web Worker y UCI.

Archivos usados por la aplicación:

```text
public/stockfish/stockfish.js
public/stockfish/stockfish.wasm
```

La aplicación carga `stockfish.js` al pulsar `Analizar` en una partida guardada. Ese archivo carga automáticamente `stockfish.wasm` desde la misma carpeta.

La variante instalada pesa mucho menos que la build completa y no requiere cabeceras de aislamiento para múltiples hilos, por lo que es más adecuada para la versión local en navegador.

Licencia: GPLv3. Se conserva una copia en `Copying.txt`.
