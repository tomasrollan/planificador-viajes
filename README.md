# Planificador de viajes · Agus Natrone Turismo

Planificador de comidas de Disney World y Universal Orlando para agencias de viajes: panel de la agencia, mesa de ayuda, portal del cliente con PIN, catálogo de restaurantes, sesión de reservas, historial y guías de uso.

Hoy es **un solo HTML sin framework** (JS vanilla) que se arma con `node build.js` a partir de `src/`, `lib/` y `data/`. Los datos de la demo viven en el `localStorage` del navegador; el backend (Supabase) es la etapa siguiente.

## Comandos
- `npm install` e `npm test`: corre los tests unitarios y los flujos completos (jsdom).
- `npm run build`: genera `dist/index.html` (≈5 MB, autocontenido) y `dist/_headers`.
- `node build.js`: genera `planificador.html` en la raíz (ignorado por git).

## Publicar en Cloudflare Pages
- Build command: `npm run build`
- Build output directory: `dist`
- Variable de entorno (si hace falta): `NODE_VERSION=22`

## Estructura
- `src/index.html`, `src/styles/app.css`, `src/js/01..19` y `99-boot.js`: la aplicación (se concatenan en un solo script).
- `lib/*.js`: lógica pura sin navegador (fechas, reglas, mensajes, buscador, lectura de WhatsApp…). Se prueba directo en Node.
- `data/`: catálogos y contenido embebido (restaurantes, menús, horarios, fotos, traducciones, enlaces de Universal).
- `tests/`: unitarios (`tests/*.test.js`) y flujos completos (`tests/e2e/`). Los flujos usan `?notour` en la URL para que la guía de bienvenida no interfiera.

## Contenido de terceros
Fotos, menús y datos de Disney y Universal son de sus dueños. Se usan solo para la demo interna; antes de mostrar la app a clientes reales hay que tener autorización o pasar a modo «solo enlaces». El sitio publicado lleva `noindex` a propósito. No es asesoramiento legal.
