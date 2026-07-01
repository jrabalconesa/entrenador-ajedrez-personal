#!/bin/bash

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

APP_HOST="127.0.0.1"
APP_PORT="5173"
APP_URL="http://${APP_HOST}:${APP_PORT}"
MAX_WAIT_SECONDS=90

pause() {
  echo ""
  read -r -p "Pulsa Enter para cerrar..." _
}

is_server_running() {
  lsof -nP -iTCP:"$APP_PORT" -sTCP:LISTEN >/dev/null 2>&1
}

open_browser() {
  open "$APP_URL"
}

wait_for_vite() {
  local elapsed=0
  echo "Esperando a que Vite esté disponible en ${APP_URL}..."

  while [ "$elapsed" -lt "$MAX_WAIT_SECONDS" ]; do
    if curl -fsS -o /dev/null "$APP_URL" 2>/dev/null; then
      echo "Servidor listo."
      return 0
    fi

    sleep 1
    elapsed=$((elapsed + 1))
  done

  echo "Error: Vite no respondió a tiempo en ${APP_URL}."
  return 1
}

if is_server_running; then
  echo "El entrenador ya está en marcha."
  echo "No se abrirá otra instancia. Abriendo el navegador..."
  open_browser
  pause
  exit 0
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js no está instalado o no está en el PATH."
  echo ""
  echo "Instálalo desde https://nodejs.org/ o con Homebrew:"
  echo "  brew install node"
  pause
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "Error: pnpm no está instalado o no está en el PATH."
  echo ""
  echo "Puedes instalarlo con:"
  echo "  corepack enable"
  echo "  corepack prepare pnpm@latest --activate"
  echo ""
  echo "O con npm:"
  echo "  npm install -g pnpm"
  pause
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "No se encontró node_modules. Instalando dependencias con pnpm install..."
  if ! pnpm install; then
    echo "Error: pnpm install falló."
    pause
    exit 1
  fi
fi

echo "Iniciando Entrenador Personal de Ajedrez..."
echo "Mantén esta ventana abierta mientras uses la aplicación."
echo "Para cerrar el servidor, cierra esta ventana o usa"
echo "\"Detener Entrenador de Ajedrez.command\"."
echo ""

(
  if wait_for_vite; then
    echo "Abriendo ${APP_URL} en el navegador..."
    open_browser
  else
    echo "No se pudo abrir el navegador automáticamente."
  fi
) &
WAITER_PID=$!

cleanup() {
  kill "$WAITER_PID" >/dev/null 2>&1 || true
}

trap cleanup EXIT INT TERM

pnpm run dev
EXIT_CODE=$?

trap - EXIT INT TERM
cleanup

if [ "$EXIT_CODE" -ne 0 ]; then
  echo ""
  echo "El servidor se detuvo con un error (código ${EXIT_CODE})."
  pause
fi

exit "$EXIT_CODE"
