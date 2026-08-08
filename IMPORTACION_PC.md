# Importación y uso en este PC

Proyecto importado desde:

- Sitio publicado: <https://jrabalconesa.github.io/entrenador-ajedrez-personal/>
- Repositorio: <https://github.com/jrabalconesa/entrenador-ajedrez-personal>
- Rama: `main`

## Comandos usados para importar y comprobar

```powershell
git ls-remote https://github.com/jrabalconesa/entrenador-ajedrez-personal.git
git clone https://github.com/jrabalconesa/entrenador-ajedrez-personal.git entrenador-ajedrez-personal
cd entrenador-ajedrez-personal
pnpm install --frozen-lockfile
pnpm run test
pnpm run build
```

La clonación conserva el historial y configura `origin` como remoto. La instalación
usa las versiones fijadas en `pnpm-lock.yaml`.

## Arrancar en local (Windows)

Requisitos: Node.js y pnpm.

```powershell
cd C:\Users\joser\Documents\Codex\entrenador-ajedrez-personal
pnpm run dev
```

Abrir <http://127.0.0.1:5173/>. Para detener el servidor, pulsar `Ctrl+C` en la
terminal.

Para comprobar localmente la compilación de producción:

```powershell
pnpm run build
pnpm run preview
```

Abrir la dirección que muestre Vite (normalmente
<http://127.0.0.1:4173/>).

## Volver a desplegar en GitHub Pages

El flujo `.github/workflows/pages.yml` se activa al subir cambios a `main`. Antes
de publicar:

```powershell
pnpm run test
pnpm run build
git status
git add .
git commit -m "Describe el cambio"
git push origin main
```

En GitHub, comprobar que **Settings > Pages > Build and deployment** usa
**GitHub Actions**. Después, revisar la ejecución **Publicar en GitHub Pages** en
la pestaña **Actions**. El despliegue publica `dist` y mantiene la URL:
<https://jrabalconesa.github.io/entrenador-ajedrez-personal/>.

También puede iniciarse manualmente desde **Actions > Publicar en GitHub Pages >
Run workflow**, porque el flujo admite `workflow_dispatch`.

> Nota: antes de ejecutar `git push`, revisa con `git status` qué cambios se van
> a publicar y confirma que las pruebas y la compilación terminan correctamente.
