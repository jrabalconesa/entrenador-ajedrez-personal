#!/bin/bash

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

APP_PORT="5173"

pause() {
  echo ""
  read -r -p "Pulsa Enter para cerrar..." _
}

PIDS="$(lsof -nP -tiTCP:"$APP_PORT" -sTCP:LISTEN 2>/dev/null || true)"

if [ -z "$PIDS" ]; then
  echo "No hay ningún servidor del entrenador escuchando en el puerto ${APP_PORT}."
  pause
  exit 0
fi

echo "Deteniendo el servidor local del entrenador..."

STOPPED=0
while IFS= read -r PID; do
  [ -n "$PID" ] || continue
  if kill "$PID" 2>/dev/null; then
    echo "  Proceso ${PID} detenido."
    STOPPED=$((STOPPED + 1))
  fi
done <<< "$PIDS"

sleep 1

REMAINING="$(lsof -nP -tiTCP:"$APP_PORT" -sTCP:LISTEN 2>/dev/null || true)"
if [ -n "$REMAINING" ]; then
  echo "Forzando cierre de procesos restantes..."
  while IFS= read -r PID; do
    [ -n "$PID" ] || continue
    kill -9 "$PID" 2>/dev/null || true
    echo "  Proceso ${PID} finalizado."
    STOPPED=$((STOPPED + 1))
  done <<< "$REMAINING"
fi

if [ "$STOPPED" -eq 0 ]; then
  echo "No se pudo detener el servidor."
  pause
  exit 1
fi

echo ""
echo "Servidor detenido correctamente."
pause
