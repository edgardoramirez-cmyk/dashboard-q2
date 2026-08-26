# Dashboard Gerencial · Q2

Dashboard estático (HTML + JS, sin build) para el programa de conectividad e
infraestructura de Centros Escolares. Se publica en GitHub Pages / cualquier
hosting estático subiendo estos 5 archivos tal cual.

## Archivos

- **`index.html`** — estructura, estilos y toda la lógica de render (10 secciones, gráficos con Chart.js).
- **`data.js`** — copia local de los datos (lo que ve cualquiera que abra el dashboard si no hay datos en vivo). Se regenera a mano desde el Excel/Sheet cuando cambian los números.
- **`config.js`** — configuración para leer el Google Sheet en vivo (ID del libro + nombre de cada pestaña).
- **`live.js`** — lee el Google Sheet en vivo (CSV vía `gviz`) y lo convierte al mismo formato que `data.js`. Si algo falla, se queda con la copia local sin romper nada.
- **`README.md`** — este archivo.

> Nota: este README se re-escribió al regenerar el dashboard porque el
> archivo original no se pudo leer desde esta sesión (un problema técnico
> de enlace duro del archivo en tu carpeta local). Si tenía contenido
> propio importante que no está aquí, decímelo y lo agrego.

## Cómo activar los datos en vivo

1. Abrí el Google Sheet y compartilo: **Compartir → Acceso general → "Cualquiera con el enlace"**, rol **Lector**.
2. En `config.js`, `spreadsheetId` ya apunta a tu libro. En `sheets`, cada clave debe tener el **nombre exacto de la pestaña** (la etiqueta de abajo en Sheets, no la URL). Se usa el nombre en vez del `gid` porque el `gid` se rompe si borrás y volvés a crear una pestaña.
3. Subí los 5 archivos a GitHub. El dashboard intenta leer el Sheet al cargar; si no puede (sin conexión, Sheet privado, hoja sin nombre configurado), usa `data.js` automáticamente — nunca se rompe.

## Qué cambió con las hojas simplificadas (esta regeneración)

Tu Excel “Dashboard Q2” trae las mismas 10 pestañas de siempre, pero varias
quedaron con columnas distintas. Esto es lo que se adaptó automáticamente
(usando el mismo criterio en `data.js` y en `live.js`, para que la copia
local y la lectura en vivo siempre cuadren):

- **Inspección** — la hoja ya no trae el desglose "Cumple F4 / No cumple F3 /
  Hallazgos / % Revisión / Pendientes". Ahora reporta *CE Visitados*,
  *Inspecciones Técnicas*, *Visitas Técnicas*, *Revisiones* y *Cantidad de
  CE*. La sección se rediseñó: el gráfico de cumplimiento y la dona se
  reemplazaron por un comparativo semanal (CE visitados / inspecciones /
  visitas técnicas) y un gráfico propio para Revisiones (su escala — cientos
  o miles — no es comparable con el resto).
- **Mantenimiento** — la hoja ya no trae "Preventivos". Se quitó el filtro,
  la tarjeta y el grupo correspondientes; la sección queda con Correctivo y
  Garantías. "Correctivos" y "Garantías" son los dos totales de la semana
  (el KPI de "Total intervenciones" es correctivos + garantías). UPS /
  Switch / Access Point es el desglose de qué equipo se intervino, pero no
  tiene por qué sumar igual a "Correctivos" (un mismo caso puede involucrar
  más de un equipo); "Firewall" sí coincide siempre con "Garantías" en esta
  hoja, y "En proceso"/"Resueltas" es su desglose de estado.
- **Reparación** — la hoja ya no trae "Cola" ni "Casos nuevos". A cambio
  suma *AP instalados*, *AP reubicaciones* y *cable UTP instalado* (metros),
  que ahora se muestran como tarjetas nuevas y un panel de "Infraestructura
  instalada".
- **Cobertura** — se agregó la columna "Falta instalar 1 AP" (antes solo
  existía "Falta 2+ AP"); se sumó como tarjeta y serie nueva junto a la que
  ya existía.
- **Cortes de Fibra Óptica** — la celda de encabezado de la columna A viene
  con un número suelto en vez de "Semana" (probablemente un dato pegado por
  error). `live.js` lo detecta y sigue usando esa primera columna como
  semana; no afecta los datos, pero vale la pena corregir esa celda en el
  Sheet cuando puedas.
- **Dimensionamiento RT** — la columna "%" ahora guarda una fracción
  (`5.9257` = 592.57%) en vez del número ya multiplicado por 100 que usaba
  la hoja anterior. Tanto `data.js` como `live.js` multiplican por 100 al
  leerla, así que el detalle por centro escolar se ve igual que antes
  (Cumple: 72 · Revisar: 29 · No Cumple: 177 · Sin datos: 1, sobre 279
  centros).

Todas las demás hojas (Anchos de Banda, Starlink, Ticket SDP) mantienen
exactamente las mismas columnas y gráficos de siempre; solo se actualizaron
los datos, ahora con semanas 28 a 35.

**Cambios de Fase** también mantiene sus columnas de siempre, pero se
corrigió cómo se explicaba "Sin fase a F3": son centros escolares que **no
tenían fase previa y entraron directo a Fase 3** (un ingreso, no una
salida), así que la tarjeta y el gráfico se corrigieron para mostrarlo como
algo positivo en vez de "quedan fuera de F3".

## Actualizar los datos

- **En vivo**: solo hace falta mantener el Sheet actualizado; el dashboard
  lee la última versión cada vez que alguien lo abre.
- **Copia local (`data.js`)**: se regenera a mano cuando querés que la
  versión "sin conexión" también quede al día — pedime que la vuelva a
  generar a partir del Excel/Sheet más reciente.
