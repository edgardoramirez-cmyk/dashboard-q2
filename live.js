/* ============================================================
   live.js — Lectura en vivo del Google Sheet (CSV vía gviz)
   Convierte cada hoja al mismo formato que usa data.js.
   Diseñado para ser tolerante: si una hoja no se puede leer o
   parsear, se conserva la copia local de esa hoja.
   ============================================================ */
(function (glob) {

  /* ---------- utilidades de texto/número ---------- */
  const norm = s => (s == null ? '' : s.toString())
    .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
    .replace(/\s+/g, ' ');   // colapsa espacios dobles/múltiples (evita falsos "no cumple" al buscar "cumple")

  function num(v) {
    if (v == null) return null;
    let s = v.toString().trim().replace('%', '').replace(/\s/g, '');
    if (s === '') return null;
    s = s.replace(/,/g, '');           // sin separador de miles
    const n = parseFloat(s);
    return isNaN(n) ? null : n;
  }
  function weekNorm(v) {
    const m = norm(v).match(/sem\D*(\d+)/);   // capta "Semana 28" y erratas "Semaan 30"
    return m ? ('Semana ' + m[1]) : null;
  }
  const TEXT = new Set(['semana', 'bloque', 'codigo', 'nombre', 'escenario', 'codigosReparar']);

  /* ---------- parser CSV (comillas, comas y saltos internos) ---------- */
  function parseCSV(text) {
    const rows = []; let row = [], field = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
        else field += c;
      } else {
        if (c === '"') q = true;
        else if (c === ',') { row.push(field); field = ''; }
        else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
        else if (c === '\r') { /* ignora */ }
        else field += c;
      }
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    return rows;
  }

  /* ---------- localización de encabezado y columnas ---------- */
  function findHeader(rows, needles) {
    for (let i = 0; i < rows.length; i++) {
      const joined = rows[i].map(norm).join('|');
      if (needles.every(n => joined.includes(norm(n)))) return i;
    }
    return -1;
  }
  function col(header, needles) {
    const H = header.map(norm);
    for (const nd of needles) { const t = norm(nd); const i = H.indexOf(t); if (i >= 0) return i; }        // exacto primero
    for (const nd of needles) { const t = norm(nd); const i = H.findIndex(h => h.includes(t)); if (i >= 0) return i; } // luego "contiene"
    return -1;
  }
  function metricFields(spec) {
    return Object.keys(spec).filter(f => !TEXT.has(f));
  }
  function buildRow(spec, cmap, raw) {
    const o = {};
    for (const f in spec) {
      const ci = cmap[f]; const v = ci >= 0 ? raw[ci] : null;
      if (TEXT.has(f)) o[f] = (v == null || v.toString().trim() === '') ? null : v.toString().trim();
      else o[f] = num(v);
    }
    return o;
  }

  /* ---------- hojas semanales (una fila por semana) ---------- */
  function weeklySheet(rows, spec, headerNeedles) {
    const hi = findHeader(rows, headerNeedles);
    if (hi < 0) return null;
    const header = rows[hi];
    const cmap = {}; for (const f in spec) cmap[f] = col(header, spec[f]);
    /* Alguna hoja (p.ej. "Cortes de Fibra Optica") trae la celda de encabezado
       de la columna A mal escrita (un número suelto en vez de "Semana"). Si no
       se encuentra por nombre pero SÍ se encontraron el resto de columnas de
       la hoja, se asume que la semana sigue viviendo en la primera columna
       (así es en todas las hojas de este Sheet) en vez de descartar la hoja
       entera y quedarse con la copia local. */
    if (cmap.semana < 0) cmap.semana = 0;
    const out = [];
    for (let r = hi + 1; r < rows.length; r++) {
      const raw = rows[r]; if (!raw) continue;
      const wk = weekNorm(raw[cmap.semana]);
      if (!wk) continue;                       // solo filas de datos con "Semana N"
      const o = buildRow(spec, cmap, raw);
      o.semana = wk;
      out.push(o);
    }
    return out.length ? out : null;
  }

  /* ---------- hojas por bloque (celdas combinadas) ---------- */
  function blockSheet(rows, spec, headerNeedles) {
    const hi = findHeader(rows, headerNeedles);
    if (hi < 0) return null;
    const header = rows[hi];
    const cmap = {}; for (const f in spec) cmap[f] = col(header, spec[f]);
    if ('cumpleVT' in cmap && 'noCumpleVT' in cmap) fixBandaCumpleVT(header, cmap);
    const mets = metricFields(spec);
    const out = [];
    let fillSemana = null, fillBloque = null;
    for (let r = hi + 1; r < rows.length; r++) {
      const raw = rows[r]; if (!raw) continue;
      // relleno hacia abajo de semana/bloque combinados
      if (cmap.semana >= 0 && weekNorm(raw[cmap.semana])) fillSemana = weekNorm(raw[cmap.semana]);
      if (cmap.bloque >= 0 && raw[cmap.bloque] && raw[cmap.bloque].trim()) fillBloque = raw[cmap.bloque].trim();
      const o = buildRow(spec, cmap, raw);
      if ('semana' in spec) o.semana = fillSemana;
      if ('bloque' in spec) o.bloque = o.bloque || fillBloque;
      const anyMetric = mets.some(f => o[f] != null);
      if (!anyMetric) continue;                // descarta filas vacías de la combinación
      out.push(o);
    }
    return out.length ? out : null;
  }

  /* ---------- Dimensionamiento RT ---------- */
  /* La hoja agregó una columna "Modelo de router" entre el centro escolar y
     el escenario, y el escenario ahora usa Cumple / Revisar / No Cumple
     (antes era SI / AJUSTADO / REVISAR). Se respeta el texto tal cual viene
     (solo se normaliza "SIN DATOS" a "Sin datos" para que calce con la
     copia local de data.js) en vez de forzar mayúsculas. */
  function dimSheet(rows) {
    const hi = findHeader(rows, ['codigo', 'centro escolar']);
    if (hi < 0) return null;
    const header = rows[hi];
    const ci = {
      codigo: col(header, ['codigo']),
      nombre: col(header, ['centro escolar', 'nombre']),
      modelo: col(header, ['modelo de router', 'modelo']),
      escenario: col(header, ['escenario']),
      pct: col(header, ['%'])
    };
    if (ci.pct < 0 && ci.escenario >= 0) ci.pct = ci.escenario + 1;
    const out = [];
    for (let r = hi + 1; r < rows.length; r++) {
      const raw = rows[r]; if (!raw) continue;
      const code = (raw[ci.codigo] || '').toString().trim();
      if (!/^\d+$/.test(code)) continue;       // solo filas con código numérico
      const pct = num(raw[ci.pct]);
      let escenario = (raw[ci.escenario] || '').toString().trim();
      if (norm(escenario) === 'sin datos') escenario = 'Sin datos';
      /* La hoja simplificada guarda el % como fracción (5.9257 = 592.57%) en
         vez del número ya multiplicado por 100 que usaba la hoja anterior.
         Si el texto original no trae el símbolo "%", se asume fracción y se
         multiplica por 100; si ya viene con "%", se respeta tal cual. */
      const pctRaw = (raw[ci.pct] || '').toString();
      const pctFinal = pct == null ? null : (pctRaw.indexOf('%') >= 0 ? pct : pct * 100);
      out.push({
        codigo: code,
        nombre: (raw[ci.nombre] || '').toString().trim(),
        modelo: ci.modelo >= 0 ? (raw[ci.modelo] || '').toString().trim() : '',
        escenario,
        pct: pctFinal   // null (no 0) para no mezclar "sin dato" con un uso real de 0%
      });
    }
    return out.length ? out : null;
  }

  /* ---------- especificaciones de columnas por hoja ---------- */
  const SPEC = {
    cambiosFase: { semana: ['semana'], parque: ['parque'], migradosQ3: ['migrados q3', 'q3'], migradosQ1: ['migrados q1', 'q1'], ingresanQ2: ['ingresan q2', 'ingresan'], sinFaseF3: ['sin fase a f3', 'sin fase'] },
    /* Esquema nuevo (simplificado): ya no trae Total CE / Cumple F4 / No cumple F3 /
       Hallazgos / % Revisión / Pendientes — solo CE Visitados, Inspecciones
       Técnicas, Visitas Técnicas, Revisiones y Cantidad de CE. */
    inspeccion: { semana: ['semana'], ceVisitados: ['ce visitados'], inspeccionesTecnicas: ['inspecciones tecnicas', 'inspecciones'], visitasTecnicas: ['visitas tecnicas', 'visitas'], revisiones: ['revisiones'], cantidadCE: ['cantidad de ce', 'cantidad ce'] },
    /* Esquema simplificado (2da vuelta): ya no trae "Cola" ni "Casos nuevos"
       (ni AP instalados/reubicados ni cable UTP, que la hoja trajo
       brevemente y ya no están). Solo Reparados, En proceso y Pendientes. */
    reparacion: { semana: ['semana'], reparados: ['reparados'], enProceso: ['en proceso', 'proceso'], pendientes: ['pendientes'] },
    /* Hoja renombrada de DATA_MANTENIMIENTO a DATA_EQUIPOS (ver config.js).
       Ya no trae "Preventivos" ni "Correctivos"; se agregó "Router" junto a
       Firewall dentro del grupo de Garantías. El encabezado real de la
       columna "utp" es "UTP (Mts)" (metros de cable, no unidades) — el
       needle 'utp' igual la encuentra porque col() hace match por
       "contiene" cuando no hay coincidencia exacta. */
    mantenimiento: { semana: ['semana'], ups: ['ups'], switch: ['switch'], accessPoint: ['access point', 'access'], utp: ['utp'], garantias: ['garant'], firewall: ['firewall'], router: ['router'], enProceso: ['en proceso', 'proceso'], resueltas: ['resueltas'] },
    anchosBanda: { semana: ['semana'], parque: ['parque'], noCumpleVT: ['no cumple por visita tecnica', 'no cumple vt'], cumpleVT: ['cumple por visita tecnica', 'cumple vt'], sinVerificarVT: ['sin verificar por visita tecnica', 'sin verificar'], noCumpleTeorico: ['no cumple teorico'], cumpleTeorico: ['cumple teorico'], noContrato: ['no contrato', 'contrato'], noData: ['no data'] },
    fibra: { semana: ['semana'], parque: ['parque'], bloque: ['bloque'], enlacesOffline: ['enlaces offline', 'offline'], cfoSDP: ['cfo'], sinEnergia: ['energia', 's/ energia'] },
    starlink: { semana: ['semana'], instaladas: ['instaladas'], reparadas: ['reparadas'], retiradas: ['retiradas'] },
    /* Esquema nuevo: se agregó "Falta instalar 1 AP" además de la ya
       existente "Falta 2+ AP" — los needles usan un fragmento único de cada
       encabezado ("un 1 ap" / "2 o mas ap") para no confundir una con otra. */
    cobertura: { semana: ['semana'], parqueCE: ['parque'], cantidadF3: ['cantidad f3', 'cantidad'], innovacion: ['innovacion'], empresasCapres: ['capres'], faltaAP1: ['un 1 ap', 'falta instalar un 1'], faltaAP: ['2 o mas ap', 'falta instalar 2'], faltaEnlace: ['falta enlace', 'enlace entre'], variasDeficiencias: ['varias'] },
    /* OJO con estos 2 needles — encabezados reales de la hoja que rompían la
       lectura en vivo (la copia local data.js nunca se vio afectada, solo
       la lectura del Sheet):
       - "Ticket Creados CFO Q2": el needle 'ticket cfo' NO es substring de
         eso (la palabra "Creados" queda en medio). Se cambió a 'cfo' solo
         (única columna de las 9 que trae "cfo" en el encabezado), con
         'creados cfo' como opción más específica primero.
       - "Ticket SDP para visita tecnica": el needle 'ticket para visita' SÍ
         es substring de OTRA columna, "Ticket para visitas en proceso" (por
         el plural "visitas"), así que agarraba la columna equivocada —
         "Solicitadas" terminaba mostrando el mismo número que "En proceso".
         Se cambió a needles que solo aparecen en la columna correcta ('sdp',
         'visita tecnica'); a propósito NO se dejó 'ticket para visita' como
         respaldo, porque eso es lo que causaba el choque — mejor que quede
         sin dato (visible como "—") a que muestre el número de otra
         columna sin que se note. */
    ticketSDP: { semana: ['semana'], cfoInspecciones: ['creados cfo', 'cfo de inspecciones', 'cfo'], cfoCerrados: ['ticket cerrados'], chatbotCE: ['ticket de chatbot ce', 'chatbot ce'], chatbotCerrados: ['ticket cerrados de chatbot', 'cerrados de chatbot'], chatbotProceso: ['ticket chatbot en proceso', 'chatbot en proceso'], visitas: ['sdp para visita', 'sdp', 'visita tecnica'], visitasProceso: ['ticket para visitas en proceso', 'visitas en proceso'], visitasCerrados: ['cerrados ticket de visitas', 'cerrados ticket'] }
  };

  /* corrige el orden columnar cuando "cumple vt" también aparece dentro de "no cumple vt" */
  function fixBandaCumpleVT(header, cmap) {
    // asegura que cumpleVT no apunte a la misma columna que noCumpleVT
    if (cmap.cumpleVT === cmap.noCumpleVT) {
      const idx = header.findIndex((h, i) => i !== cmap.noCumpleVT && norm(h) === 'cumple vt');
      if (idx >= 0) cmap.cumpleVT = idx;
    }
  }

  /* ---------- plan de hojas ---------- */
  const PLAN = [
    { key: 'cambiosFase', fn: r => weeklySheet(r, SPEC.cambiosFase, ['parque', 'migrados']) },
    { key: 'inspeccion', fn: r => weeklySheet(r, SPEC.inspeccion, ['inspecciones tecnicas', 'visitas tecnicas']) },
    { key: 'reparacion', fn: r => weeklySheet(r, SPEC.reparacion, ['reparados']) },
    { key: 'mantenimiento', fn: r => weeklySheet(r, SPEC.mantenimiento, ['access point', 'garant']) },
    { key: 'anchosBanda', fn: r => weeklySheet(r, SPEC.anchosBanda, ['parque', 'teorico']) },
    { key: 'fibra', fn: r => weeklySheet(r, SPEC.fibra, ['offline']) },
    { key: 'starlink', fn: r => weeklySheet(r, SPEC.starlink, ['instaladas']) },
    { key: 'cobertura', fn: r => weeklySheet(r, SPEC.cobertura, ['parque', 'cantidad']) },
    { key: 'ticketSDP', fn: r => weeklySheet(r, SPEC.ticketSDP, ['chatbot', 'ticket para visita']) },
    { key: 'dimensionamiento', fn: r => dimSheet(r) }
  ];

  /* ---------- API pública para pruebas y navegador ---------- */
  const LIVE = { parseCSV, weeklySheet, blockSheet, dimSheet, SPEC, PLAN, norm, num, weekNorm };

  /* Se identifica la pestaña por NOMBRE (como aparece en la pestañita de
     abajo en Sheets) en vez de por "gid" numérico. El gid es un ID interno
     que cambia si la pestaña se borra y se vuelve a crear (justo lo que
     rompió Starlink) — el nombre es estable y es lo que la persona que
     edita el Sheet realmente ve y controla. */
  function gvizURL(id, sheetOrGid, byGid) {
    const param = byGid ? `gid=${encodeURIComponent(sheetOrGid)}` : `sheet=${encodeURIComponent(sheetOrGid)}`;
    return `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&${param}`;
  }

  async function fetchSheet(id, sheetOrGid, byGid) {
    const res = await fetch(gvizURL(id, sheetOrGid, byGid), { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return parseCSV(await res.text());
  }

  /* Intenta refrescar DATA desde el Sheet. Devuelve {ok, failed}. */
  LIVE.refresh = async function (opts) {
    const cfg = (glob.LIVE_CONFIG) || {};
    if (!cfg.enabled) return { ok: 0, failed: [], disabled: true };
    const id = cfg.spreadsheetId;
    const sheets = cfg.sheets || {};      // config nueva: nombre de pestaña
    const gids = cfg.gids || {};          // config vieja: gid (se respeta si todavía la usás)
    const failed = []; let ok = 0;
    await Promise.all(PLAN.map(async ({ key, fn }) => {
      const sheetName = sheets[key];
      const gid = gids[key];
      if (!sheetName && !gid) { failed.push(key); return; }   // sin nombre ni gid → se queda con copia local
      try {
        const rows = sheetName
          ? await fetchSheet(id, sheetName, false)
          : await fetchSheet(id, gid, true);
        const parsed = fn(rows);
        if (!parsed) { failed.push(key); return; }
        if (key === 'dimensionamiento') {
          if (opts && opts.onDim) opts.onDim(parsed);
        } else {
          glob.DATA[key] = parsed;
        }
        ok++;
      } catch (e) { failed.push(key); }
    }));
    return { ok, failed };
  };

  glob.LIVE = LIVE;
  if (typeof module !== 'undefined' && module.exports) module.exports = LIVE;

})(typeof window !== 'undefined' ? window : globalThis);
