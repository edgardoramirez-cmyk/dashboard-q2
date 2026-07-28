# Dashboard Gerencial Q2 · Conectividad de Centros Escolares

Tablero de control ejecutivo construido a partir del Google Sheet **"Dashboard Q2"**, que consolida las 10 hojas de seguimiento semanal (Semanas 28–30) en una sola vista gerencial.

## Áreas incluidas

| # | Área | Fuente (hoja) |
|---|------|---------------|
| 01 | Cambios de fase | `Cambios Fase` |
| 02 | Inspección | `DATA_INSPECCION` |
| 03 | Reparación | `DATA_REPARACION` |
| 04 | Mantenimiento | `DATA_MANTENIMIENTO` |
| 05 | Anchos de banda | `Anchos de Banda` |
| 06 | Cortes de fibra óptica | `Cortes de Fibra Optica` |
| 07 | Starlink | `Starlink` |
| 08 | Cobertura | `Cobertura` |
| 09 | Dimensionamiento RT | `Dimensionamiento RT` (279 centros, tabla buscable) |
| 10 | Tickets SDP | `TICKET SDP` (mesa de servicio: CFO, chatbot y visitas) |

## Cómo publicarlo en GitHub Pages

1. Crea un repositorio nuevo en GitHub (por ejemplo `dashboard-q2`).
2. Sube estos archivos a la raíz del repositorio:
   - `index.html`
   - `data.js`
   - `README.md`
3. En el repositorio ve a **Settings → Pages**.
4. En *Source* elige la rama `main` y la carpeta `/root`, y guarda.
5. En un par de minutos el dashboard estará disponible en:
   `https://TU-USUARIO.github.io/dashboard-q2/`

### Alternativa por línea de comandos

```bash
git init
git add index.html data.js README.md
git commit -m "Dashboard gerencial Q2"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/dashboard-q2.git
git push -u origin main
```

Luego activa Pages desde **Settings → Pages**.

## Archivos del proyecto

| Archivo | Para qué sirve |
|---------|----------------|
| `index.html` | El dashboard (interfaz, filtros y gráficos). |
| `data.js` | Copia local de los datos (respaldo). Se usa si el Sheet no está disponible. |
| `config.js` | Configuración de la conexión en vivo (aquí van los `gid` de cada pestaña). |
| `live.js` | Motor que lee el Google Sheet en vivo y lo convierte al formato del dashboard. |

Sube **los cuatro** a la raíz del repositorio.

## Datos en vivo (recomendado)

El dashboard puede leer el Google Sheet **cada vez que alguien lo abre**, sin que tengas que editar `data.js`. Arriba a la derecha verás un indicador: **En vivo** (leyó el Sheet) o **Copia local** (usó el respaldo).

Para activarlo, una sola vez:

1. Abre el Google Sheet y compártelo: **Compartir → Acceso general → "Cualquiera con el enlace" (Lector)**. Es necesario para que el navegador de quien abra el dashboard pueda leerlo.
2. En **`config.js`**, bajo `sheets`, escribe el **nombre exacto de cada pestaña** tal cual aparece en la pestañita de abajo del Sheet (ej. `"Starlink"`, `"Cobertura"`, `"Dimensionamiento RT"`). No hace falta copiar ningún número de la URL.
3. Sube `config.js` a GitHub. Listo: los cambios que hagas en Drive se reflejan solos, cada vez que alguien abre el dashboard.

Notas:
- Puedes llenar solo algunas hojas; las que dejes en blanco seguirán mostrando la copia local.
- Si el Sheet está privado o sin conexión, el dashboard **no se rompe**: usa `data.js` y muestra "Copia local".
- La conexión en vivo requiere que el Sheet sea de lectura pública (cualquiera con el enlace). Si prefieres mantenerlo privado, no configures `sheets` y actualiza `data.js` cuando toque.
- **Si borrás y volvés a crear una pestaña** (en vez de solo renombrarla o vaciarla), solo tenés que confirmar que el nombre en `config.js` siga coincidiendo — no hay ningún ID interno que se rompa, como pasaba antes con el `gid`.
- **Importante:** el "En vivo" solo trae datos actualizados si la ESTRUCTURA de columnas de la hoja no cambió (mismos encabezados). Si agregás o renombrás columnas — como pasó con "Modelo de router" en Dimensionamiento o el rediseño de Starlink — el dashboard va a necesitar un ajuste de código además de la actualización de datos. Para simples ediciones de valores dentro de las mismas columnas, no hace falta tocar nada más.

## Cómo actualizar los datos manualmente (sin conexión en vivo)

Todos los números viven en **`data.js`**. Cada hoja es un arreglo de objetos por semana; para cargar la Semana 30 (u otra) solo reemplaza los valores `null` por los datos reales y vuelve a subir el archivo. No hace falta tocar `index.html`.

## Notas técnicas

- Es una página estática autónoma: solo HTML, CSS y JavaScript.
- Usa [Chart.js](https://www.chartjs.org/) vía CDN para los gráficos.
- No requiere servidor, backend ni claves. Funciona también abriendo `index.html` directamente en el navegador.
- Las semanas sin carga en la fuente aparecen vacías (`—`).
