// Consulta · Cartelera sin pantalla (con pruebas en pruebas/). Las listas viven en cartelera.json del repositorio
// pablocarvallo/datos; cada cambio es un objeto que «aplicar» suma al archivo, igual en el iPhone y al guardar.
// La lectura del historial de Netflix y Prime Video viene sin cambios de la app Cartelera (pablocarvallo/cartelera).

export const ARCHIVO = 'cartelera.json';
export const REGION = 'CL';                 // plataformas disponibles en Chile
export const LANG = 'es-MX';                // títulos y sinopsis en español latino
export const TMDB_API = 'https://api.themoviedb.org/3';
export const TMDB_IMG = 'https://image.tmdb.org/t/p/';
export const PROV_TTL = 3 * 864e5;          // las plataformas de «Quiero ver» se revisan cada 3 días

export const keyOf = (it) => it.type + ':' + it.id;
export const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const pad = (n) => String(n).padStart(2, '0');
export const typeLbl = (t) => (t === 'tv' ? 'Serie' : 'Película');

/* ---------- Plataformas ---------- */
const PNAMES = {
  'Disney Plus': 'Disney+', 'Apple TV Plus': 'Apple TV+', 'Amazon Prime Video': 'Prime Video',
  'Google Play Movies': 'Google Play', 'Max': 'HBO Max', 'Paramount Plus': 'Paramount+',
  'Paramount Plus Premium': 'Paramount+', 'Netflix Kids': 'Netflix', 'Crunchyroll Premium': 'Crunchyroll',
};
const PINIT = { 'Netflix': 'N', 'Disney+': 'D+', 'Apple TV+': 'tv+', 'HBO Max': 'HBO', 'Prime Video': 'pv', 'Apple TV': 'tv', 'Google Play': 'GP', 'MUBI': 'M', 'Paramount+': 'P+' };
export const pname = (n) => { const c = String(n || '').replace(/\s+(standard|basic)?\s*with ads$/i, '').trim(); return PNAMES[c] || c; };
export const pinit = (n) => PINIT[n] || n.split(/\s+/).map((w) => w[0] || '').join('').slice(0, 3);
function cleanList(list) {
  const seen = new Set(), out = [];
  for (const p of (list || []).slice().sort((a, b) => (a.display_priority ?? 99) - (b.display_priority ?? 99))) {
    const n = pname(p.provider_name);
    if (!n || seen.has(n)) continue;
    seen.add(n); out.push({ n, l: p.logo_path || '' });
  }
  return out;
}
// Respuesta de TMDB (watch/providers) → plataformas en Chile: suscripción, gratis, arriendo y compra
export function parseProv(wp) {
  const cl = wp && wp.results && wp.results[REGION];
  if (!cl) return { stream: [], free: [], rent: [], buy: [], link: '' };
  return { stream: cleanList(cl.flatrate), free: cleanList([...(cl.free || []), ...(cl.ads || [])]), rent: cleanList(cl.rent), buy: cleanList(cl.buy), link: cl.link || '' };
}
// Dónde se puede ver sin pagar aparte (suscripción o gratis)
export function streamOf(prov) {
  if (!prov) return [];
  const seen = new Set(), out = [];
  for (const x of [...(prov.stream || []), ...(prov.free || [])]) if (!seen.has(x.n)) { seen.add(x.n); out.push(x); }
  return out;
}
// Resultado de TMDB → título de la lista
export function norm(r, type) {
  type = type || r.media_type;
  const tv = type === 'tv';
  return {
    id: r.id, type,
    title: (tv ? r.name || r.original_name : r.title || r.original_title) || 'Sin título',
    orig: (tv ? r.original_name : r.original_title) || '',
    year: String((tv ? r.first_air_date : r.release_date) || '').slice(0, 4),
    poster: r.poster_path || '',
  };
}
export const fmtRuntime = (m) => (m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ' ' + (m % 60) + ' min' : ''}` : `${m} min`);
export const TV_STATUS = { 'Returning Series': 'En emisión', 'Ended': 'Finalizada', 'Canceled': 'Cancelada', 'In Production': 'En producción', 'Planned': 'Anunciada', 'Pilot': 'Piloto' };

/* ---------- Archivo y cambios ---------- */
export function plantilla() { return { items: {} }; }
export function nuevoId() { return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
const MAX_IDS = 40;
const copiar = (x) => JSON.parse(JSON.stringify(x));
// Solo lo que es del usuario; las plataformas se guardan aparte en el iPhone porque cambian solas
const CAMPOS = ['id', 'type', 'title', 'year', 'poster', 'status', 'addedAt', 'seenAt', 'rating', 'nf'];
export function limpiarItem(it) {
  const o = {};
  CAMPOS.forEach((c) => { if (it[c] !== undefined && it[c] !== null && it[c] !== '') o[c] = it[c]; });
  if (o.nf) o.nf = { eps: +o.nf.eps || 0, plays: +o.nf.plays || 0, first: o.nf.first || '', run: o.nf.run || 0, src: o.nf.src || 'Netflix' };
  if (!o.rating) delete o.rating;
  return o;
}
export function itemValido(it) {
  return !!(it && it.id && (it.type === 'movie' || it.type === 'tv') && (it.status === 'want' || it.status === 'seen'));
}
export function aplicar(contenido, cambio) {
  const d = copiar(contenido == null ? plantilla() : contenido);
  if (!d.items || typeof d.items !== 'object' || Array.isArray(d.items)) d.items = {};
  const f = CAMBIOS[cambio.tipo];
  if (!f) throw new Error('Cambio desconocido: ' + cambio.tipo);
  d.ultimos_cambios = Array.isArray(d.ultimos_cambios) ? d.ultimos_cambios : [];
  if (cambio.id && d.ultimos_cambios.includes(cambio.id)) return d;
  f(d, cambio);
  if (cambio.id) d.ultimos_cambios = d.ultimos_cambios.concat(cambio.id).slice(-MAX_IDS);
  return d;
}
const CAMBIOS = {
  // Quiero ver (estado «want») o ya la vi (estado «seen», con el día)
  agregar(d, { k, base, estado, at, dia }) {
    let it = d.items[k];
    if (!it) {
      if (!base || !base.id) throw new Error('Falta el título');
      it = d.items[k] = { id: base.id, type: base.type, title: base.title || 'Sin título', year: base.year || '', poster: base.poster || '', addedAt: at };
    }
    if (estado === 'want') { it.status = 'want'; it.addedAt = at; delete it.seenAt; }
    else { it.status = 'seen'; it.seenAt = dia; }
  },
  quitar(d, { k }) { delete d.items[k]; },
  nota(d, { k, n }) { const it = d.items[k]; if (!it) return; if (n) it.rating = n; else delete it.rating; },
  fechaVista(d, { k, dia }) { const it = d.items[k]; if (it) it.seenAt = dia; },
  // Datos que TMDB cambió (título o póster) de un título de la lista
  ficha(d, { k, title, year, poster }) {
    const it = d.items[k]; if (!it) return;
    if (title) it.title = title;
    if (year) it.year = year;
    if (poster) it.poster = poster;
  },
  // Respaldo de la app Cartelera: agrega los títulos que faltan; los que ya están se quedan como están
  importar(d, { items }) {
    Object.keys(items || {}).forEach((k) => { const it = items[k]; if (itemValido(it) && !d.items[k]) d.items[k] = limpiarItem(it); });
  },
  // Historial de Netflix o Prime Video: pares [entrada del archivo, título de TMDB]. «visto»: elegido a mano.
  historial(d, { run, pares, dia, visto }) {
    (pares || []).forEach(({ e, r }) => {
      aplicarHistorial(d.items, e, r, run, dia);
      const it = d.items[keyOf(r)];
      if (visto && it && it.status !== 'seen') { it.status = 'seen'; it.seenAt = e.last || dia; }
    });
  },
};

/* ---------- Respaldo (mismo formato de la app Cartelera) ---------- */
export function leerRespaldo(texto) {
  let obj;
  try { obj = typeof texto === 'string' ? JSON.parse(texto) : texto; } catch (e) { return { error: 'Ese archivo no es un respaldo de Cartelera.' }; }
  const src = obj && obj.items && typeof obj.items === 'object' && !Array.isArray(obj.items) ? obj.items : null;
  if (!src) return { error: 'Ese archivo no es un respaldo de Cartelera.' };
  const items = {}, prov = {};
  Object.keys(src).forEach((k) => {
    const it = src[k];
    if (!itemValido(it)) return;
    const kk = keyOf(it);
    items[kk] = limpiarItem(it);
    if (it.prov && it.provAt) prov[kk] = { prov: it.prov, at: it.provAt };
  });
  const n = Object.keys(items).length;
  if (!n) return { error: 'El respaldo no tiene títulos.' };
  const vistos = Object.values(items).filter((it) => it.status === 'seen').length;
  return { items, prov, n, vistos, quiero: n - vistos };
}
export function respaldo(d, prov, ahoraISO) {
  const items = {};
  Object.keys((d && d.items) || {}).forEach((k) => { items[k] = Object.assign({}, d.items[k], prov && prov[k] ? { prov: prov[k].prov, provAt: prov[k].at } : {}); });
  return { app: 'cartelera', version: 1, exportedAt: ahoraISO, items };
}

/* ---------- Listas ---------- */
export function itemsDe(d, status) { return Object.values((d && d.items) || {}).filter((it) => it.status === status); }
export function ordenQuiero(a, b) { return (b.addedAt || 0) - (a.addedAt || 0); }
export function ordenVistos(a, b) { return (b.seenAt || '').localeCompare(a.seenAt || '') || (b.addedAt || 0) - (a.addedAt || 0); }
// Quiero ver con filtros de tipo y plataforma; las plataformas vienen de la copia del iPhone
export function filtrarQuiero(lista, provDe, tipo, plataforma) {
  const byType = tipo === 'all' ? lista : lista.filter((it) => it.type === tipo);
  const counts = new Map();
  for (const it of byType) for (const p of streamOf(provDe(it))) { const c = counts.get(p.n) || { p, c: 0 }; c.c++; counts.set(p.n, c); }
  const provs = [...counts.values()].sort((a, b) => b.c - a.c || a.p.n.localeCompare(b.p.n));
  const prov = plataforma && counts.has(plataforma) ? plataforma : '';
  return { provs, prov, list: prov ? byType.filter((it) => streamOf(provDe(it)).some((p) => p.n === prov)) : byType };
}
// Vistos agrupados por mes («2026-11»), del más reciente al más antiguo
export function porMes(lista) {
  const groups = [];
  for (const it of lista) {
    const ym = it.seenAt ? it.seenAt.slice(0, 7) : '';
    const g = groups[groups.length - 1];
    if (g && g.ym === ym) g.items.push(it); else groups.push({ ym, items: [it] });
  }
  return groups;
}
// Títulos de las listas que coinciden con lo buscado
export function enListas(d, q) {
  const f = fold(q.trim());
  if (!f) return [];
  return Object.values((d && d.items) || {}).filter((it) => fold(it.title).includes(f)).sort((a, b) => fold(a.title).indexOf(f) - fold(b.title).indexOf(f) || ordenVistos(a, b));
}

/* ---------- Historial de Netflix y Prime Video: lectura del archivo ----------
   Acepta los dos archivos que entrega Netflix:
   · NetflixViewingHistory.csv (Actividad de visualización → Descargar todo): Title, Date
   · ViewingActivity.csv (solicitud de datos personales): Profile Name, Start Time, Duration, …, Title, Supplemental Video Type
   y el texto copiado de la página Historial de visualización de Prime Video. Agrupa los episodios en su serie y deja
   una fila por serie o película. */
export const nfFold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const nfPad = (n) => String(n).padStart(2, '0');
const nfIso = (d) => d.getFullYear() + '-' + nfPad(d.getMonth() + 1) + '-' + nfPad(d.getDate());

export function nfCsvRows(text, delim) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; }
      else f += c;
    } else if (c === '"') q = true;
    else if (c === delim) { row.push(f); f = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(f); rows.push(row); row = []; f = '';
    } else f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim()));
}

export function nfDateParser(samples) {
  let dmy = 0, mdy = 0;
  for (const s of samples) {
    const m = /^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/.exec(String(s).trim());
    if (!m) continue;
    if (+m[1] > 12) dmy++; else if (+m[2] > 12) mdy++;
  }
  const order = mdy > dmy ? 'mdy' : 'dmy'; // en Chile Netflix usa día/mes/año
  return (s) => {
    s = String(s || '').trim();
    let y, mo, d, m;
    if ((m = /^(\d{4})[\/.\-](\d{1,2})[\/.\-](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/.exec(s))) {
      if (m[4] !== undefined) { // hora de inicio en UTC → fecha local
        const dt = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0)));
        return isNaN(dt) ? '' : nfIso(dt);
      }
      y = +m[1]; mo = +m[2]; d = +m[3];
    } else if ((m = /^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/.exec(s))) {
      [d, mo] = order === 'dmy' ? [+m[1], +m[2]] : [+m[2], +m[1]];
      y = +m[3]; if (y < 100) y += 2000;
    } else return '';
    if (mo < 1 || mo > 12 || d < 1 || d > 31 || y < 1997 || y > 2100) return '';
    return y + '-' + nfPad(mo) + '-' + nfPad(d);
  };
}

function nfSeconds(s) {
  const p = String(s || '').trim().split(':').map(Number);
  if (p.some(isNaN) || !p.length) return NaN;
  return p.reduce((a, b) => a * 60 + b, 0);
}

// Partes del título que indican un episodio: "Temporada 2", "Parte 1", "Miniserie", "Capítulo 3"…
const NF_MARK = /^(temporadas?|seasons?|parte|part|vol(?:umen|ume)?\.?|libro|book|cap[ií]tulo|chapter|episodios?|episodes?|ep\.|serie limitada|limited series|mini-?series?|colecci[oó]n|collection)(?=\s|\d|$)/i;
const NF_STRONG = /^(temporadas?|seasons?|serie limitada|limited series|mini-?series?|episodios?|episodes?|ep\.)(?=\s|\d|$)/i;

// Limpia el texto tal como lo entrega Netflix: acentos compuestos, espacios duros, espacios repetidos
const nfClean = (s) => String(s || '').normalize('NFC').replace(/[   ​﻿]/g, ' ').replace(/\s+/g, ' ').trim();

export function nfClassify(title) {
  const raw = nfClean(title).split(/\s*:\s+/);
  if (raw.length > 1 && !raw[0].trim()) return { name: '', kind: 'tv', ep: raw.slice(1).join(': '), segs: [] }; // " : Episodio 1": Netflix no trae el nombre
  const seg = raw.map((s) => s.trim()).filter(Boolean);
  for (let i = 1; i < seg.length; i++) {
    // "Kill Bill: Volumen 1" o "Dune: Parte dos" son películas: la marca débil al final no basta
    if (NF_MARK.test(seg[i]) && (NF_STRONG.test(seg[i]) || i < seg.length - 1)) {
      const name = seg.slice(0, i);
      // "Stranger Things: Stranger Things 4: Capítulo uno" → "Stranger Things"
      while (name.length > 1 && nfFold(name[name.length - 1]).startsWith(nfFold(name[0]))) name.pop();
      return { name: name.join(': '), kind: 'tv', ep: seg.slice(i).join(': '), segs: seg, marked: true };
    }
  }
  return { name: seg.join(': '), kind: 'movie', ep: '', segs: seg, marked: false };
}

// Decodifica el archivo aunque venga en otra codificación o con las tildes dañadas por Excel
const NF_CP1252 = { 0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A, 0x2039: 0x8B, 0x0152: 0x8C, 0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92, 0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97, 0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C, 0x017E: 0x9E, 0x0178: 0x9F };
const NF_CONT = '[\\u0080-\\u00BF' + Object.keys(NF_CP1252).map((c) => '\\u' + Number(c).toString(16).padStart(4, '0')).join('') + ']';
const NF_MOJI = new RegExp('[\\u00C2-\\u00F4]' + NF_CONT + '{1,3}', 'g');
export function nfFixMojibake(s) {
  if (!NF_MOJI.test(s)) return s;
  NF_MOJI.lastIndex = 0;
  const dec = new TextDecoder('utf-8', { fatal: true });
  return s.replace(NF_MOJI, (m) => {
    const bytes = [];
    for (const ch of m) { const c = ch.codePointAt(0); bytes.push(c < 256 ? c : NF_CP1252[c]); }
    try { const out = dec.decode(new Uint8Array(bytes)); return out.length === 1 ? out : m; } catch (e) { return m; }
  });
}
export function nfDecode(bytes) {
  if (bytes[0] === 0xFF && bytes[1] === 0xFE) return nfFixMojibake(new TextDecoder('utf-16le').decode(bytes.subarray(2)));
  if (bytes[0] === 0xFE && bytes[1] === 0xFF) return nfFixMojibake(new TextDecoder('utf-16be').decode(bytes.subarray(2)));
  const body = bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF ? bytes.subarray(3) : bytes;
  let text;
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(body); }
  catch (e) { text = new TextDecoder('windows-1252').decode(body); } // guardado de nuevo desde Excel o Numbers
  return nfFixMojibake(text);
}

/* Prime Video: texto copiado de la página Historial de visualización. Cada día trae una fecha ("25 de octubre de
   2025") y debajo sus títulos: una serie va seguida de "Episodios vistos" y una película de "Eliminar película del
   historial de visualización". */
const NF_MONTHS = { enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12 };
const NF_ORD = { primera: 1, segunda: 2, tercera: 3, cuarta: 4, quinta: 5, sexta: 6, septima: 7, octava: 8, novena: 9, decima: 10, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6 };
function nfLongDate(l) {
  let m = /^(\d{1,2}) de ([a-záéíóú]+) de (\d{4})$/i.exec(l), d, mo, y;
  if (m) { d = +m[1]; mo = NF_MONTHS[nfFold(m[2])]; y = +m[3]; }
  else if ((m = /^([a-z]+) (\d{1,2}),? (\d{4})$/i.exec(l))) { d = +m[2]; mo = NF_MONTHS[nfFold(m[1])]; y = +m[3]; }
  else return null;
  return mo && d >= 1 && d <= 31 ? y + '-' + nfPad(mo) + '-' + nfPad(d) : null;
}
// "This Is Us - Season 4", "La Jauría Temporada 2", "Amor Moderno - Segunda Temporada" → nombre y número de temporada
export function nfSeason(title) {
  const t = nfClean(title);
  let m = /^(.+?)[\s\-–—:,]*\b(?:season|temporada|temp\.)\s*0*(\d+)$/i.exec(t);
  if (m) return { name: m[1].trim(), season: +m[2] };
  m = /^(.+?)[\s\-–—:,]*\b(primera|segunda|tercera|cuarta|quinta|sexta|s[eé]ptima|octava|novena|d[eé]cima)\s+temporada$/i.exec(t);
  if (m) return { name: m[1].trim(), season: NF_ORD[nfFold(m[2])] || 0 };
  m = /^(.+?)[\s\-–—:,]*\btemporada\s+(uno|dos|tres|cuatro|cinco|seis)$/i.exec(t);
  if (m) return { name: m[1].trim(), season: NF_ORD[nfFold(m[2])] || 0 };
  return { name: t, season: 0 };
}
const NF_PV_SERIES = /^(episodios vistos|watched episodes|eliminar episodios del historial.*|remove episodes from watch history.*)$/i;
const NF_PV_MOVIE = /^(eliminar pel[ií]cula del historial.*|remove (movie|video) from watch history.*)$/i;
const nfIsPrimeText = (t) => /eliminar (episodios|pel[ií]cula) del historial|remove (episodes|movie) from watch history/i.test(t.slice(0, 20000));
function nfParsePrimeText(text) {
  const lines = String(text).split(/\r\n|\r|\n/).map(nfClean);
  const plays = [];
  let date = '';
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!l) continue;
    const d = nfLongDate(l);
    if (d) { date = d; continue; }
    if (NF_PV_SERIES.test(l) || NF_PV_MOVIE.test(l)) continue;
    let j = i + 1; while (j < lines.length && !lines[j]) j++;
    const next = lines[j] || '';
    const kind = NF_PV_SERIES.test(next) ? 'tv' : NF_PV_MOVIE.test(next) ? 'movie' : '';
    if (!kind) continue; // texto de la página que no es un título
    if (/^(episodio|episode) 0\b/i.test(l)) continue; // avances, resúmenes y extras
    if (kind === 'tv') { const s = nfSeason(l); plays.push({ title: s.name, season: s.season, date, kind, src: 'Prime Video' }); }
    else plays.push({ title: l, season: 0, date, kind, src: 'Prime Video' });
  }
  return plays;
}

export function nfParse(text) {
  text = String(text || '').replace(/^﻿/, '');
  if (nfIsPrimeText(text)) return { format: 'prime', plays: nfParsePrimeText(text), skipped: 0, profiles: [] };
  const nl = text.search(/\r|\n/);
  const firstLine = nl < 0 ? text : text.slice(0, nl);
  const delim = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : (firstLine.includes('\t') && !firstLine.includes(',') ? '\t' : ',');
  const rows = nfCsvRows(text, delim);
  if (rows.length < 2) throw new Error('empty');
  const head = rows[0].map(nfFold);
  const col = (...names) => head.findIndex((h) => names.includes(h));
  const iT = col('title', 'titulo', 'nombre');
  if (iT < 0) throw new Error('nocols');
  const iStart = col('start time', 'hora de inicio');
  const iDate = iStart >= 0 ? iStart : col('date', 'fecha');
  const iProf = col('profile name', 'nombre del perfil', 'perfil');
  const iSup = col('supplemental video type');
  const iDur = col('duration', 'duracion');
  const iType = col('tipo', 'type');
  const iSrc = col('plataforma', 'platform', 'servicio');
  const body = rows.slice(1);
  const parseDate = nfDateParser(iDate >= 0 ? body.slice(0, 800).map((r) => r[iDate] || '') : []);
  const plays = [], profiles = new Map();
  let skipped = 0;
  for (const r of body) {
    const title = nfClean(r[iT]);
    if (!title || title === ':') continue;
    if (iSup >= 0 && String(r[iSup] || '').trim()) { skipped++; continue; } // avances, recapitulaciones
    if (iDur >= 0 && nfSeconds(r[iDur]) < 60) { skipped++; continue; } // vistas de unos segundos
    const profile = iProf >= 0 ? nfClean(r[iProf]) : '';
    const tv = iType >= 0 ? nfFold(r[iType]) : '';
    const kind = !tv ? '' : /^(serie|series|tv|show|programa)/.test(tv) ? 'tv' : /^(pelicula|movie|film|documental)/.test(tv) ? 'movie' : '';
    plays.push({ title, date: iDate >= 0 ? parseDate(r[iDate]) : '', profile, kind, src: (iSrc >= 0 && nfClean(r[iSrc])) || 'Netflix' });
    if (profile) profiles.set(profile, (profiles.get(profile) || 0) + 1);
  }
  return {
    format: iStart >= 0 ? 'activity' : 'history', plays, skipped,
    profiles: [...profiles].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
  };
}

export function nfGroup(plays) {
  // Si el archivo ya dice qué es cada título (Prime Video o un CSV con columna Tipo), no se adivina
  const cls = plays.map((p) => ({ p, c: p.kind ? { name: p.kind === 'tv' ? nfSeason(p.title).name : nfClean(p.title), kind: p.kind, ep: '', segs: [], explicit: true } : nfClassify(p.title) }));
  // Series reconocidas por "Temporada", "Miniserie", etc.
  const known = new Map();
  for (const { c } of cls) if (c.kind === 'tv' && c.name) known.set(nfFold(c.name), c.name);
  // Títulos sin esa marca ("Ratched: Piloto", "Conexiones: Nubes"): se agrupan por el inicio que comparten
  const prefixTitles = new Map();
  for (const { c } of cls) {
    if (c.kind !== 'movie' || c.segs.length < 2) continue;
    const full = nfFold(c.name);
    for (let L = 1; L < c.segs.length; L++) {
      const k = nfFold(c.segs.slice(0, L).join(': '));
      if (!prefixTitles.has(k)) prefixTitles.set(k, new Set());
      prefixTitles.get(k).add(full);
    }
  }
  for (const x of cls) {
    const { c } = x;
    if (c.kind !== 'movie' || c.segs.length < 2) continue;
    for (let L = c.segs.length - 1; L >= 1; L--) { // "Gambito de dama: Detrás de cámaras" va con la serie
      const k = nfFold(c.segs.slice(0, L).join(': '));
      if (known.has(k)) { x.c = { name: known.get(k), kind: 'tv', ep: c.segs.slice(L).join(': ') }; break; }
    }
    if (x.c.kind === 'tv') continue;
    for (let L = c.segs.length - 1; L >= 1; L--) {
      const k = nfFold(c.segs.slice(0, L).join(': '));
      if (prefixTitles.get(k).size >= 2) {
        const alts = [];
        for (let j = L - 1; j >= 1; j--) alts.push(c.segs.slice(0, j).join(': '));
        x.c = { name: c.segs.slice(0, L).join(': '), kind: 'tv', ep: c.segs.slice(L).join(': '), weak: true, alts, full: c.name };
        break;
      }
    }
  }
  const map = new Map();
  for (const { p, c } of cls) {
    const key = c.kind + '|' + nfFold(c.name);
    let g = map.get(key);
    if (!g) map.set(key, g = { name: c.name, kind: c.kind, first: '', last: '', plays: 0, eps: new Set(), weak: true, alts: c.alts || [], members: new Map(), names: new Map(), srcs: new Set(), explicit: false });
    if (!c.weak) g.weak = false;
    if (c.explicit) g.explicit = true;
    g.names.set(c.name, (g.names.get(c.name) || 0) + 1); // "This Is US" y "This Is Us": gana la forma más usada
    g.srcs.add(p.src || 'Netflix');
    g.plays++;
    g.eps.add(nfFold(c.ep || c.name));
    if (p.date) { if (!g.first || p.date < g.first) g.first = p.date; if (p.date > g.last) g.last = p.date; }
    if (c.weak) {
      const mk = nfFold(c.full);
      let m = g.members.get(mk);
      if (!m) g.members.set(mk, m = { name: c.full, first: '', last: '', plays: 0 });
      m.plays++;
      if (p.date) { if (!m.first || p.date < m.first) m.first = p.date; if (p.date > m.last) m.last = p.date; }
    }
  }
  return [...map.values()]
    .map((g) => {
      const name = [...g.names].sort((a, b) => b[1] - a[1])[0][0];
      // Prime Video anota días, no episodios: ahí no se cuenta la cantidad de episodios
      const out = { name, kind: g.kind, first: g.first, last: g.last, plays: g.plays, eps: g.kind === 'tv' && !g.explicit ? g.eps.size : 0, src: [...g.srcs].join(' y ') };
      if (g.explicit) out.explicit = true;
      if (g.kind === 'tv' && g.weak && g.members.size) { out.weak = true; out.alts = g.alts; out.members = [...g.members.values()]; }
      return out;
    })
    .sort((a, b) => b.last.localeCompare(a.last) || a.name.localeCompare(b.name));
}

/* ---------- Historial: elegir el título de TMDB y sumarlo a la lista ---------- */
const nfWords = (s) => nfFold(s).replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
export function nfBest(list, query, min = 34) {
  const q = nfWords(query), qt = new Set(q.split(' ').filter(Boolean));
  let best = null, bestScore = 0;
  list.slice(0, 10).forEach((r, i) => {
    for (const t of [r.title, r.orig]) {
      const w = nfWords(t); if (!w) continue;
      let s;
      if (w === q) s = 100;
      else if (q.length > 3 && (w.startsWith(q + ' ') || q.startsWith(w + ' '))) s = 60;
      else {
        const tt = new Set(w.split(' ')); let inter = 0;
        for (const x of qt) if (tt.has(x)) inter++;
        s = inter / Math.max(qt.size, tt.size) * 60;
      }
      s -= i * 1.5; // a igual parecido, gana el más relevante para TMDB
      if (s > bestScore) { bestScore = s; best = r; }
    }
  });
  return bestScore >= min ? best : null;
}
export const nfPlain = (q) => q.replace(/\s*[\(\[][^\)\]]*[\)\]]\s*/g, ' ').replace(/\s+/g, ' ').trim();
// Búsquedas que se prueban en orden para identificar una entrada del historial
export function nfIntentos(e, tvFallback = true) {
  const q = e.name, plain = nfPlain(q);
  const tries = e.kind === 'tv' ? [['/search/tv', q], ['/search/multi', q]] : [['/search/movie', q], ['/search/multi', q]];
  if (plain && plain !== q) tries.push([e.kind === 'tv' ? '/search/tv' : '/search/multi', plain]);
  const inner = (/\(([^)]{3,})\)/.exec(q) || [])[1]; // "Perros de la Calle (Reservoir Dogs)": prueba también el título original
  if (inner) tries.push([e.kind === 'tv' ? '/search/tv' : '/search/movie', inner.trim()]);
  if (e.kind === 'movie' && tvFallback) { // episodio suelto de una serie: "Mad Men: Hay humo en tus ojos"
    const seg = q.split(': ');
    for (let L = seg.length - 1; L >= 1; L--) tries.push(['/search/tv', seg.slice(0, L).join(': ')]);
  }
  return tries.map(([path, query]) => ({ path, query, min: path === '/search/tv' && e.kind === 'movie' ? 60 : 34 }));
}
export const nfMin = (a, b) => (!a ? b : !b ? a : (a < b ? a : b));
export const nfSrcJoin = (...l) => [...new Set(l.filter(Boolean).join(' y ').split(' y ').filter(Boolean))].join(' y ');
const nfDay = (s, hoy) => (!s || s > hoy ? hoy : s); // Netflix anota en hora UTC: nunca una fecha futura
const nfDateMs = (s) => { const t = s ? new Date(s + 'T12:00:00').getTime() : NaN; return isNaN(t) ? Date.now() : t; };
// Suma una entrada del historial (e) identificada como el título r. Devuelve «nuevo» o «existia».
export function aplicarHistorial(items, e, r, run, hoy) {
  const k = keyOf(r);
  const eps = r.type !== 'tv' || e.explicit ? 0 : Math.max(1, e.kind === 'tv' ? e.eps : 1); // Prime Video no dice cuántos episodios
  const it = items[k];
  if (it) {
    const n = it.nf;
    if (n && n.run === run) { // otro nombre de Netflix para el mismo título, en esta misma importación
      n.eps += eps; n.plays += e.plays; n.src = nfSrcJoin(n.src, e.src);
    } else {
      it.nf = { eps: Math.max(eps, n ? n.eps : 0), plays: Math.max(e.plays, n ? n.plays : 0), first: nfMin(n && n.first, e.first), run, src: nfSrcJoin(n && (n.src || 'Netflix'), e.src || 'Netflix') };
    }
    it.nf.first = nfMin(it.nf.first, e.first);
    if (it.status === 'seen' && e.last && (!it.seenAt || e.last > it.seenAt)) it.seenAt = nfDay(e.last, hoy);
    return 'existia';
  }
  items[k] = {
    id: r.id, type: r.type, title: r.title, year: r.year || '', poster: r.poster || '', status: 'seen',
    seenAt: nfDay(e.last, hoy), addedAt: nfDateMs(e.last),
    nf: { eps, plays: e.plays, first: e.first || '', run, src: e.src || 'Netflix' },
  };
  return 'nuevo';
}
// Lo que viaja en el cambio: solo los datos de la entrada que usa aplicarHistorial
export function entradaCorta(e) {
  const o = { kind: e.kind, first: e.first || '', last: e.last || '', plays: e.plays || 0, eps: e.eps || 0, src: e.src || 'Netflix' };
  if (e.explicit) o.explicit = true;
  return o;
}
export function tituloCorto(r) { return { id: r.id, type: r.type, title: r.title, year: r.year || '', poster: r.poster || '' }; }
