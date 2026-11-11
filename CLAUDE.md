# Notas para Claude en este repo
- Proyecto de Tomás Rollan; Agus Natrone Turismo es la agencia piloto. Español rioplatense (voseo) en la interfaz y en las respuestas.
- Mantener la identidad visual del HTML original para la parte de agencia y de Disney. El tema de Universal (`html[data-theme="uor"]`) usa solo colores; no copiar logos, tipografías ni imágenes de Universal ni presentarlo como sitio oficial.
- Contenido de terceros en una capa intercambiable (`content_mode` completo / solo_enlaces). Alergias: nunca prometer seguridad; siempre avisar al reservar y al mozo.
- Antes de cambiar algo: `npm test` (todo en verde). Cambios en `src/`: `npm run build`.
- Nada de secretos en el repo ni en el chat: claves y tokens van en variables de entorno del hosting.
- Plan por etapas y decisiones: documentos del proyecto «Agus Natrone Turismo» en claude.ai.
