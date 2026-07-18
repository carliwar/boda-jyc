# Prompts History — boda-jyc

Registro cronologico de prompts del usuario, decisiones tomadas y archivos afectados.

## 2026-07-05 — Inicializacion del proyecto

### Prompt 1 — Crear proyecto boda-jyc
- Se inicializo un proyecto web mobile-first con React + TypeScript + Vite.
- Se agregaron rutas base, estilos globales y estructura inicial.

### Prompt 2 — Preparar GitHub y auto deploy
- Se configuro GitHub Pages en push a `main`.
- Se ajusto `vite.config.ts` con `base: '/boda-jyc/'`.
- Se ajusto `BrowserRouter` para usar `import.meta.env.BASE_URL`.

## 2026-07-18 — Seccion de regalos (Lluvia de sobres)

### Prompt 1 — Anadir seccion de regalos monetarios
- El usuario pidio una seccion que comunique con tacto que se prefieren regalos en dinero y que habra un buzon para sobres en la recepcion.
- Se acordo copia calida y tradicional bajo el titulo "Lluvia de sobres", con descripcion y nota de buzon.
- Ubicacion: entre `section-reception` y `section-dress-code`.
- Icono: `redeem`. Decoraciones: divisor superior + rama `top/right`.
- Se agrego la clave `gifts` en `public/content/invitation.json` y se extendieron `InvitationContent`, `fallbackContent`, `mergeInvitationContent` y el render en `src/App.tsx`.
- Verificado con `npm run lint` y `npm run build` (validate-guests OK, tsc + vite build sin errores).

### Prompt 2 — Actualizar historial de prompts
- Se registro esta sesion en `docs/prompts-history.md` conservando la regla al final del archivo.

## Regla

Mantener este archivo actualizado luego de cambios relevantes para conservar contexto de prompts y decisiones.
