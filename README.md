# Consulta

App de consulta del plan de 5 apps domésticas: **Indicadores**, **Lecturas** y **Cartelera** en una sola app para el iPhone, con el diseño Domésticas 27 (acento ámbar). Calendario, Gastos médicos y Mini Planilla siguen como apps independientes.

Se publica con GitHub Pages en https://pablocarvallo.github.io/consulta/.

## Versiones

- **1.3.0** (26 nov 2026): **Skin** en Ajustes → Apariencia: «Vidrio» (el de siempre) o «Tinta electrónica», como un lector de libros electrónicos: papel gris cálido, tinta negra, letra con serifa, líneas en vez de vidrio, sin colores ni animaciones (portadas y afiches en grises); en oscuro, letra clara sobre negro. Solo cambia el aspecto.
- **1.2.1** (25 nov 2026): las hojas que se abren encima se cierran arrastrándolas hacia abajo, como en iOS: desde el asa, o desde cualquier parte cuando su contenido está arriba del todo. Un arrastre corto la devuelve a su lugar; arrastrar sobre un gráfico sigue mostrando sus valores.
- **1.2.0** (24 nov 2026): **Lecturas** dentro de Consulta, con los datos de Goodreads. Leyendo (con el avance de cada libro y los leídos del año), Desafíos (el del año con su ritmo, cifras y los años anteriores) y Quiero leer (ordenable por fecha, título o autor). Búsqueda de libros con búsquedas recientes y ficha de cada libro. Los datos se leen a través de domesticas-api con la misma llave de Cartelera y se actualizan solos al abrir la app.
- **1.1.0** (24 nov 2026): **Cartelera** dentro de Consulta. Quiero ver (con las plataformas en Chile y filtros por tipo y plataforma), Vistos por mes (con fecha, nota y lo traído del historial), búsqueda en TMDB y ficha de cada título. Las listas se guardan en `cartelera.json` del repositorio privado pablocarvallo/datos, a través de domesticas-api con la llave de este iPhone. Se traen las listas de la app Cartelera con su respaldo, y el historial de Netflix o Prime Video igual que antes. La clave de TMDB y las plataformas de cada título quedan solo en el iPhone.
- **1.0.0** (24 nov 2026): **Indicadores**: UF, dólar observado, IPC, TPM, Imacec, cobre y petróleo. Arriba el indicador destacado (por defecto la UF), luego el gráfico de la portada (por defecto el dólar, de 1, 5 o 10 años) y una tarjeta por cada uno de los demás, con su tendencia de 12 meses. Al tocar cualquiera se abre su detalle.

La lógica de los indicadores es la de la app Indicadores, sin cambios, en `calculos.js`; la de Cartelera (cambios de las listas, respaldo y lectura del historial de Netflix y Prime Video), en `cartelera.js`. La de Lecturas (desafíos, ritmo, cifras del año y orden de las listas), en `lecturas.js`. Las tres tienen pruebas en `pruebas/`.

## Fuentes

- **UF, dólar, TPM, Imacec y cobre**: [findic.cl](https://findic.cl), con datos del Banco Central; si no responde, [mindicador.cl](https://mindicador.cl).
- **IPC**: las cifras oficiales del INE que el Banco Central publica el 8 de cada mes; si aún no llegan, findic.cl; como último respaldo, se calcula con la UF.
- **IPC oficial, Imacec desestacionalizado y petróleo (WTI diario, Brent mensual)**: Banco Central de Chile. Los trae tres veces al día la tarea «Datos del Banco Central» del repositorio [pablocarvallo/indicadores](https://github.com/pablocarvallo/indicadores) y Consulta los lee desde `raw.githubusercontent.com/pablocarvallo/indicadores/main/datos/`. Ese repositorio y su tarea deben seguir activos aunque se retire la app Indicadores.

Lo último que se leyó queda guardado en el iPhone para verlo sin conexión.

## Lecturas

- Lee los estantes, el avance y los desafíos del perfil público de Goodreads a través de `/api/lecturas` de domesticas-api, que guarda una copia por 10 minutos. Requiere el iPhone conectado en Ajustes → Conexión con GitHub (la misma llave de Cartelera, tipo dispositivo).
- Se actualiza sola al abrir la app si pasaron más de 15 minutos; Ajustes → Lecturas → Actualizar Lecturas la trae al momento.
- Los cambios (avance, terminar un libro, agregar a un estante) se hacen en Goodreads: los enlaces «Actualizar avance», «Terminé» y «Abrir en Goodreads» lo abren y, al volver, Consulta relee los datos.
- Lo último que se leyó queda en el iPhone para verlo sin conexión.

## Cartelera

- **TMDB** entrega las fichas, la búsqueda y las plataformas (según JustWatch). La clave se pega en Ajustes → Cartelera → TMDB y queda solo en el iPhone.
- **Listas en GitHub**: para guardarlas hay que conectar el iPhone en Ajustes → Conexión con GitHub, con un código de la tarea Llaves de pablocarvallo/datos (tipo dispositivo). Sin conexión, los cambios esperan en el iPhone.
- **Desde la app Cartelera**: en Cartelera, Ajustes → Respaldo → Exportar; en Consulta, Ajustes → Cartelera → Traer respaldo. Los títulos que ya están no se cambian.

## Instalar en el iPhone

1. Abre https://pablocarvallo.github.io/consulta/ en Safari.
2. Toca **Compartir → Agregar a inicio**.

Las versiones nuevas llegan solas al abrir la app; no hace falta reinstalar.

## Desarrollo

- Una sola página (`index.html`) más `calculos.js`, `cartelera.js` y `lecturas.js`. Sin dependencias externas.
- Diseño: los bloques `D27:TOKENS` y `D27:COMP` se copian desde `casa/diseno27/` con `casa/herramientas/aplicar-diseno27.py index.html`.
- Pruebas: `TZ=America/Santiago node --test pruebas/*.test.js`.
- Al publicar, subir `VERSION` en `calculos.js` y `CACHE` en `sw.js`.
