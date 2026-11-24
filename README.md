# Consulta

App de consulta del plan de 5 apps domésticas: **Indicadores**, **Lecturas** y **Cartelera** en una sola app para el iPhone, con el diseño Domésticas 27 (acento ámbar). Calendario, Gastos médicos y Mini Planilla siguen como apps independientes.

Se publica con GitHub Pages en https://pablocarvallo.github.io/consulta/.

## Versión 1.0.0

- **Indicadores**: UF, dólar observado, IPC, TPM, Imacec, cobre y petróleo. Arriba el indicador destacado (por defecto la UF), luego el gráfico de la portada (por defecto el dólar, de 1, 5 o 10 años) y una tarjeta por cada uno de los demás, con su tendencia de 12 meses. Al tocar cualquiera se abre su detalle: gráfico histórico, mínimo, máximo, cambio del periodo y los últimos valores. El destacado y el gráfico de la portada se eligen en Ajustes o desde el detalle.
- **Lecturas** y **Cartelera**: llegan en las próximas versiones. Mientras tanto se siguen usando sus apps.
- **Ajustes**: destacado, gráfico de la portada, tema, vidrio y fuentes.

La lógica de los indicadores es la de la app Indicadores, sin cambios, en `calculos.js` (con pruebas en `pruebas/`).

## Fuentes

- **UF, dólar, TPM, Imacec y cobre**: [findic.cl](https://findic.cl), con datos del Banco Central; si no responde, [mindicador.cl](https://mindicador.cl).
- **IPC**: las cifras oficiales del INE que el Banco Central publica el 8 de cada mes; si aún no llegan, findic.cl; como último respaldo, se calcula con la UF.
- **IPC oficial, Imacec desestacionalizado y petróleo (WTI diario, Brent mensual)**: Banco Central de Chile. Los trae tres veces al día la tarea «Datos del Banco Central» del repositorio [pablocarvallo/indicadores](https://github.com/pablocarvallo/indicadores) y Consulta los lee desde `raw.githubusercontent.com/pablocarvallo/indicadores/main/datos/`. Ese repositorio y su tarea deben seguir activos aunque se retire la app Indicadores.

Lo último que se leyó queda guardado en el iPhone para verlo sin conexión. Consulta no guarda datos en GitHub en esta versión, así que no necesita llave.

## Instalar en el iPhone

1. Abre https://pablocarvallo.github.io/consulta/ en Safari.
2. Toca **Compartir → Agregar a inicio**.

Las versiones nuevas llegan solas al abrir la app; no hace falta reinstalar.

## Desarrollo

- Una sola página (`index.html`) más `calculos.js`. Sin dependencias externas.
- Diseño: los bloques `D27:TOKENS` y `D27:COMP` se copian desde `casa/diseno27/` con `casa/herramientas/aplicar-diseno27.py index.html`.
- Pruebas: `TZ=America/Santiago node --test pruebas/*.test.js`.
- Al publicar, subir `VERSION` en `calculos.js` y `CACHE` en `sw.js`.
