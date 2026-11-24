# Consulta

App de consulta del plan de 5 apps: Indicadores, Lecturas y Cartelera (Calendario queda fuera, como app independiente).
Ver README.md; el plan y el catálogo están en pablocarvallo/casa (plan/plan-5-apps.md y ecosistema.json).

- Una sola página (`index.html`) más `calculos.js` (sin pantalla, con pruebas). Sin dependencias externas.
- Diseño Domésticas 27: los bloques `D27:TOKENS` y `D27:COMP` se copian desde `casa/diseno27/` con
  `casa/herramientas/aplicar-diseno27.py`; lo propio de la app va entre `/*APP:START*/` y `/*APP:END*/`.
- Los datos del Banco Central vienen de la tarea del repositorio pablocarvallo/indicadores (`datos/*.json`); no moverlos
  sin cambiar `BCCH_REPO` en `calculos.js`.
- Todo cambio de reglas va con su prueba en `pruebas/` (`TZ=America/Santiago node --test pruebas/*.test.js`).
- Al publicar, subir `VERSION` en `calculos.js` y `CACHE` en `sw.js`.
- Textos y mensajes de commit en español latino neutro.
