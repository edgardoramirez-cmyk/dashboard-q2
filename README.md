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

## Cómo actualizar los datos

Todos los números viven en **`data.js`**. Cada hoja es un arreglo de objetos por semana; para cargar la Semana 30 (u otra) solo reemplaza los valores `null` por los datos reales y vuelve a subir el archivo. No hace falta tocar `index.html`.

## Notas técnicas

- Es una página estática autónoma: solo HTML, CSS y JavaScript.
- Usa [Chart.js](https://www.chartjs.org/) vía CDN para los gráficos.
- No requiere servidor, backend ni claves. Funciona también abriendo `index.html` directamente en el navegador.
- Las semanas sin carga en la fuente aparecen vacías (`—`).
