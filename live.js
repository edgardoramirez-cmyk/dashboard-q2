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
    if (cmap.semana < 0) return null;
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
  function dimSheet(rows) {
    const hi = findHeader(rows, ['codigo', 'centro escolar']);
    if (hi < 0) return null;
    const header = rows[hi];
    const ci = {
      codigo: col(header, ['codigo']),
      nombre: col(header, ['centro escolar', 'nombre']),
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
      out.push({
        codigo: code,
        nombre: (raw[ci.nombre] || '').toString().trim(),
        escenario: (raw[ci.escenario] || '').toString().trim().toUpperCase(),
        pct: pct == null ? 0 : pct
      });
    }
    return out.length ? out : null;
  }

  /* ---------- especificaciones de columnas por hoja ---------- */
  const SPEC = {
    cambiosFase: { semana: ['semana'], parque: ['parque'], migradosQ3: ['migrados q3', 'q3'], migradosQ1: ['migrados q1', 'q1'], ingresanQ2: ['ingresan q2', 'ingresan'] },
    inspeccion: { semana: ['semana'], totalCE: ['total ce'], inspecciones: ['inspecciones'], visitas: ['visitas'], cumpleF4: ['f4'], noCumpleF3: ['f3'], hallazgos: ['hallazgos'], revisiones: ['revisiones'], pctRevision: ['%'], pendientes: ['pendientes'] },
    reparacion: { semana: ['semana'], cola: ['cola'], reparados: ['reparados'], casosNuevos: ['casos nuevos', 'nuevos'], enProceso: ['en proceso', 'proceso'], pendientes: ['pendientes'] },
    mantenimiento: { semana: ['semana'], preventivos: ['preventivos'], correctivos: ['correctivos'], ups: ['ups'], switch: ['switch'], accessPoint: ['access point', 'access'], garantias: ['garant'], firewall: ['firewall'], enProceso: ['en proceso', 'proceso'], resueltas: ['resueltas'] },
    anchosBanda: { semana: ['semana'], parque: ['parque'], noCumpleVT: ['no cumple por visita tecnica', 'no cumple vt'], cumpleVT: ['cumple por visita tecnica', 'cumple vt'], sinVerificarVT: ['sin verificar por visita tecnica', 'sin verificar'], noCumpleTeorico: ['no cumple teorico'], cumpleTeorico: ['cumple teorico'], noContrato: ['no contrato', 'contrato'], noData: ['no data'] },
    fibra: { semana: ['semana'], parque: ['parque'], bloque: ['bloque'], enlacesOffline: ['enlaces offline', 'offline'], cfoSDP: ['cfo'], sinEnergia: ['energia', 's/ energia'] },
    starlink: { semana: ['semana'], bloque: ['bloque'], conAntena: ['con antena'], funcionales: ['funcionales'], sinAntena: ['sin antena'], enProceso: ['en proceso', 'proceso'], codigosReparar: ['cod a reparar', 'reparar'] },
    cobertura: { semana: ['semana'], parqueCE: ['parque'], bloque: ['bloque'], cantidadF3: ['cantidad f3', 'cantidad'], innovacion: ['innovacion'], empresasCapres: ['capres'], faltaAP: ['falta instalar', '2 o mas ap'], faltaEnlace: ['falta enlace', 'enlace entre'], variasDeficiencias: ['varias'] },
    ticketSDP: { semana: ['semana'], cfoInspecciones: ['ticket cfo', 'cfo de inspecciones'], cfoCerrados: ['ticket cerrados'], chatbotCE: ['ticket de chatbot ce', 'chatbot ce'], chatbotCerrados: ['ticket cerrados de chatbot', 'cerrados de chatbot'], chatbotProceso: ['ticket chatbot en proceso', 'chatbot en proceso'], visitas: ['ticket para visita'], visitasProceso: ['ticket para visitas en proceso', 'visitas en proceso'], visitasCerrados: ['cerrados ticket de visitas', 'cerrados ticket'] }
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
    { key: 'inspeccion', fn: r => weeklySheet(r, SPEC.inspeccion, ['inspecciones', 'pendientes']) },
    { key: 'reparacion', fn: r => weeklySheet(r, SPEC.reparacion, ['reparados']) },
    { key: 'mantenimiento', fn: r => weeklySheet(r, SPEC.mantenimiento, ['preventivos', 'correctivos']) },
    { key: 'anchosBanda', fn: r => weeklySheet(r, SPEC.anchosBanda, ['parque', 'teorico']) },
    { key: 'fibra', fn: r => weeklySheet(r, SPEC.fibra, ['offline']) },
    { key: 'starlink', fn: r => blockSheet(r, SPEC.starlink, ['con antena']) },
    { key: 'cobertura', fn: r => blockSheet(r, SPEC.cobertura, ['cantidad']) },
    { key: 'ticketSDP', fn: r => weeklySheet(r, SPEC.ticketSDP, ['chatbot', 'ticket para visita']) },
    { key: 'dimensionamiento', fn: r => dimSheet(r) }
  ];

  /* ---------- API pública para pruebas y navegador ---------- */
  const LIVE = { parseCSV, weeklySheet, blockSheet, dimSheet, SPEC, PLAN, norm, num, weekNorm };

  function gvizURL(id, gid) {
    return `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&gid=${encodeURIComponent(gid)}`;
  }

  async function fetchSheet(id, gid) {
    const res = await fetch(gvizURL(id, gid), { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return parseCSV(await res.text());
  }

  /* Intenta refrescar DATA desde el Sheet. Devuelve {ok, failed}. */
  LIVE.refresh = async function (opts) {
    const cfg = (glob.LIVE_CONFIG) || {};
    if (!cfg.enabled) return { ok: 0, failed: [], disabled: true };
    const id = cfg.spreadsheetId, gids = cfg.gids || {};
    const failed = []; let ok = 0;
    await Promise.all(PLAN.map(async ({ key, fn }) => {
      const gid = gids[key];
      if (!gid) { failed.push(key); return; }        // sin gid → se queda con copia local
      try {
        const rows = await fetchSheet(id, gid);
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
