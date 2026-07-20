# Dashboard Gerencial Q2 · Conectividad de Centros Escolares

Tablero de control ejecutivo construido a partir del Google Sheet **"Dashboard Q2"**, que consolida las 9 hojas de seguimiento semanal (Semanas 28–30) en una sola vista gerencial.

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
2. Copia el `gid` de cada pestaña: al hacer clic en una pestaña, la URL termina en algo como `#gid=2114092089`. Ese número es el `gid` de esa hoja.
3. Pega cada `gid` en **`config.js`** (hay una línea por hoja, con el nombre de la pestaña al lado).
4. Sube `config.js` a GitHub. Listo: los cambios que hagas en Drive se reflejan solos.

Notas:
- Puedes llenar solo algunas hojas; las que dejes en blanco seguirán mostrando la copia local.
- Si el Sheet está privado o sin conexión, el dashboard **no se rompe**: usa `data.js` y muestra "Copia local".
- La conexión en vivo requiere que el Sheet sea de lectura pública (cualquiera con el enlace). Si prefieres mantenerlo privado, no configures los `gid` y actualiza `data.js` cuando toque.

## Cómo actualizar los datos manualmente (sin conexión en vivo)

Todos los números viven en **`data.js`**. Cada hoja es un arreglo de objetos por semana; para cargar la Semana 30 (u otra) solo reemplaza los valores `null` por los datos reales y vuelve a subir el archivo. No hace falta tocar `index.html`.

## Notas técnicas

- Es una página estática autónoma: solo HTML, CSS y JavaScript.
- Usa [Chart.js](https://www.chartjs.org/) vía CDN para los gráficos.
- No requiere servidor, backend ni claves. Funciona también abriendo `index.html` directamente en el navegador.
- Las semanas sin carga en la fuente aparecen vacías (`—`).
