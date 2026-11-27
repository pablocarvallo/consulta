// Consulta · cálculos sin pantalla (con pruebas en pruebas/). Indicadores: lectura de las fuentes, series derivadas
// (IPC, Imacec mensual), resumen de cada indicador y datos de los gráficos. La lógica viene sin cambios de la app
// Indicadores (pablocarvallo/indicadores); aquí recibe la fecha de hoy («AAAA-MM-DD») para poder probarla.
export const VERSION = '1.4.0';

export const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export const MESL = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

// UF, dólar, TPM, Imacec, cobre y el IPC más reciente: findic.cl; si no responde, mindicador.cl (mismo formato).
export const APIS = [{ url: 'https://findic.cl/api/', name: 'findic.cl', wait: 12000 }, { url: 'https://mindicador.cl/api/', name: 'mindicador.cl', wait: 15000 }];
export const API_CODE = { cobre: 'libra_cobre' };
// IPC oficial, Imacec desestacionalizado y petróleo: del Banco Central, a través de la tarea de GitHub del repositorio
// pablocarvallo/indicadores (la API del Banco Central pide usuario y clave).
export const BCCH_FILES = { ipcm: 'datos/ipc-mensual.json', ipc12: 'datos/ipc-12m.json', imacecde: 'datos/imacec-desest.json', brent: 'datos/brent.json', wti: 'datos/wti.json' };
export const BCCH_REPO = 'https://raw.githubusercontent.com/pablocarvallo/indicadores/main/';
export const BCCH_PAGINA = 'https://pablocarvallo.github.io/indicadores/';
export const RANGOS = [1, 5, 10];
export const IND = {
  uf: { name: 'UF', src: 'mi' },
  dolar: { name: 'Dólar observado', short: 'Dólar', src: 'mi', kind: 'line' },
  ipc: { name: 'IPC', src: 'mi' },
  tpm: { name: 'Tasa de política monetaria', short: 'TPM', src: 'mi', kind: 'step' },
  imacec: { name: 'Imacec', src: 'mi', kind: 'bar' },
  cobre: { name: 'Precio del cobre', short: 'Cobre', src: 'mi', kind: 'line' },
  petroleo: { name: 'Precio del petróleo', short: 'Petróleo', src: 'bcch', kind: 'line' },
  dolarcobre: { name: 'Dólar y cobre', src: 'mi', kind: 'par' },
};
export const ORDER = ['uf', 'dolar', 'ipc', 'tpm', 'imacec', 'cobre', 'petroleo'];
// Gráfico combinado del dólar y el cobre: no es un indicador más (no tiene tarjeta ni puede ir destacado), pero sí
// puede ser el gráfico de la portada.
export const PAR = 'dolarcobre';
export const GRAFICOS = ORDER.concat([PAR]);
// Fuentes de cada indicador. IPC: el oficial del Banco Central, el de findic.cl por si llega antes y el de la UF como respaldo.
export const SOURCE = { uf: ['uf'], dolar: ['dolar'], ipc: ['uf', 'ipcm', 'ipc12', 'ipc'], tpm: ['tpm'], imacec: ['imacec', 'imacecde'], cobre: ['cobre'], petroleo: ['brent', 'wti'], dolarcobre: ['dolar', 'cobre'] };

export function prefsIniciales(p) {
  const x = Object.assign({ range: 5, ipc: '12m', imacec: '12m', crudo: 'wti', hero: 'uf', grafico: 'dolar', tema: 'auto', vidrio: 'claro' }, p || {});
  if (RANGOS.indexOf(x.range) < 0) x.range = 5;
  if (ORDER.indexOf(x.hero) < 0) x.hero = 'uf';
  if (GRAFICOS.indexOf(x.grafico) < 0) x.grafico = 'dolar';
  if (x.crudo !== 'brent') x.crudo = 'wti';
  if (x.ipc !== 'm') x.ipc = '12m';
  if (x.imacec !== 'm') x.imacec = '12m';
  return x;
}

/* ---------- Formatos ---------- */
export function pad(n) { return (n < 10 ? '0' : '') + n; }
export function dayKey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
export function validDate(k) { return /^\d{4}-\d{2}-\d{2}$/.test(String(k)); }
export function utcOf(k) { const p = k.split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2]); }
export function addMonths(y, m, d) { const t = y * 12 + m + d; return [Math.floor(t / 12), ((t % 12) + 12) % 12]; }
export function fmtDay(k, year) { const p = k.split('-'); return (+p[2]) + ' ' + MES[+p[1] - 1] + (year ? ' ' + p[0] : ''); }
export function fmtMonth(k, year) { const p = k.split('-'); return MESL[+p[1] - 1] + (year ? ' ' + p[0] : ''); }
export function cap1(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
export function plural(n, s, p) { return n === 1 ? s : p; }
const NB = ' ';   // espacio que no se corta: «$ 39.874», «3,9 %»
// Número a la chilena: punto de miles y coma decimal. El signo menos es tipográfico y no aparece en un cero.
export function nf(v, d) {
  const s = Math.abs(v).toFixed(d), neg = v < 0 && +s !== 0, parts = s.split('.');
  return (neg ? '−' : '') + parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (d ? ',' + parts[1] : '');
}
export function pesos(v, d) { return '$' + NB + nf(v, d == null ? 2 : d); }
export function usd(v, d) { return 'US$' + NB + nf(v, d == null ? 2 : d); }
export function pct(v, d) { return nf(v, d == null ? 1 : d) + NB + '%'; }
export function signed(v, d, unit) { return (v > 0 && +Math.abs(v).toFixed(d) !== 0 ? '+' : '') + nf(v, d) + (unit || ''); }
export const PCT = NB + '%', PP = NB + 'pp';
export function num(v) {
  if (typeof v === 'number') return v;
  let s = String(v == null ? '' : v).trim();
  if (s.indexOf(',') >= 0) s = s.replace(/\./g, '').replace(',', '.');
  return parseFloat(s);
}
export function fechaLarga(hoy) { return cap1(DIAS[new Date(utcOf(hoy)).getUTCDay()]) + ' ' + (+hoy.slice(8)) + ' de ' + MESL[+hoy.slice(5, 7) - 1]; }
// Un año antes (o los que se pidan) de la fecha dada, como «AAAA-MM-DD»
export function anosAntes(hoy, n) { return (+hoy.slice(0, 4) - n) + hoy.slice(4); }

/* ---------- Lectura de las fuentes ---------- */
// findic.cl y mindicador.cl: la serie viene de la más nueva a la más antigua; la fecha, como «2026-11-03» o con hora UTC.
export function leerMi(j) {
  if (!j || !Array.isArray(j.serie)) throw new Error('formato');
  return j.serie.map((p) => [String(p.fecha).slice(0, 10), +p.valor])
    .filter((p) => validDate(p[0]) && isFinite(p[1]))
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
}
// Banco Central: el archivo que deja la tarea de GitHub
export function leerBcch(j) {
  const obs = (Array.isArray(j && j.obs) ? j.obs : []).map((p) => [String(p[0]), num(p[1])])
    .filter((p) => validDate(p[0]) && isFinite(p[1]))
    .sort((a, b) => (a[0] < b[0] ? -1 : 1));
  return { obs, at: String((j && j.actualizado) || ''), nombre: String((j && j.nombre) || ''), serie: String((j && j.serie) || ''),
    mercado: Array.isArray(j && j.mercado) ? j.mercado.map(String) : [] };
}

/* ---------- Series ---------- */
// S[código][año] = { t: leído, d: datos }; los del Banco Central van en S[código].all
export function series(S, code, fromYear, hoy) {
  const cur = +hoy.slice(0, 4) + 1, out = [];
  for (let y = fromYear; y <= cur; y++) {
    const e = S[code] && S[code][y];
    if (e && Array.isArray(e.d)) for (let i = 0; i < e.d.length; i++) out.push(e.d[i]);
  }
  return out;
}
// Una serie del Banco Central es mensual si su código termina en «.M» (por ejemplo, el Brent)
export function bcchMonthly(S, code) { const e = S[code] && S[code].all; return !!(e && e.d && /\.M$/.test(String(e.d.serie || ''))); }
export function bcchSeries(S, code, fromYear) {
  const e = S[code] && S[code].all;
  return e && e.d && Array.isArray(e.d.obs) ? e.d.obs.filter((p) => +p[0].slice(0, 4) >= fromYear) : [];
}
// Imacec, variación respecto del mes anterior: del índice desestacionalizado, con un decimal como lo informa el Banco Central
export function imacecMonthly(S, fromYear) {
  const s = bcchSeries(S, 'imacecde', fromYear - 1), out = [];
  for (let i = 1; i < s.length; i++) {
    const a = s[i - 1], b = s[i];
    const ya = +a[0].slice(0, 4), ma = +a[0].slice(5, 7), yb = +b[0].slice(0, 4), mb = +b[0].slice(5, 7);
    if ((yb * 12 + mb) - (ya * 12 + ma) !== 1 || !(a[1] > 0)) continue;   // solo meses seguidos
    if (yb >= fromYear) out.push([b[0], Math.round((b[1] / a[1] - 1) * 1000) / 10]);
  }
  return out;
}
export function lastOnOrBefore(s, k) { for (let i = s.length - 1; i >= 0; i--) if (s[i][0] <= k) return s[i]; return null; }
// IPC desde la UF: entre el día 10 de un mes y el 9 del siguiente, la UF se reajusta según el IPC del mes anterior.
// Por eso, el IPC de un mes es la razón entre la UF del 9 de dos meses después y la del 9 del mes siguiente.
function ufNine(S, fromYear, hoy) {
  const m = {};
  series(S, 'uf', fromYear, hoy).forEach((p) => { if (p[0].slice(8) === '09') m[p[0].slice(0, 7)] = p[1]; });
  return m;
}
export function ipcUf(S, fromYear, mode, hoy) {
  const nine = ufNine(S, fromYear - 1, hoy), out = [], ya = +hoy.slice(0, 4);
  for (let y = fromYear; y <= ya; y++) {
    for (let mo = 0; mo < 12; mo++) {
      const a = addMonths(y, mo, mode === '12m' ? -10 : 1), b = addMonths(y, mo, 2);
      const va = nine[a[0] + '-' + pad(a[1] + 1)], vb = nine[b[0] + '-' + pad(b[1] + 1)];
      if (va && vb) out.push([y + '-' + pad(mo + 1) + '-01', Math.round((vb / va - 1) * 1000) / 10]);
    }
  }
  return out;
}
// IPC de cada mes. Mensual: el oficial del Banco Central; si aún no llega, el de findic.cl (o mindicador.cl); y si
// tampoco, el calculado con la UF. En 12 meses: el oficial; si falta, el de la UF; y si no, se componen los doce meses.
function monthMap(s, m) { s.forEach((p) => { m[p[0].slice(0, 7) + '-01'] = p[1]; }); return m; }
export function ipcSeries(S, fromYear, mode, hoy) {
  const m = monthMap(bcchSeries(S, 'ipcm', fromYear - 1), monthMap(series(S, 'ipc', fromYear - 1, hoy), monthMap(ipcUf(S, fromYear - 1, 'm', hoy), {})));
  let out = m;
  if (mode === '12m') {
    out = monthMap(bcchSeries(S, 'ipc12', fromYear), monthMap(ipcUf(S, fromYear, '12m', hoy), {}));
    Object.keys(m).forEach((k) => {
      if (k in out) return;
      let f = 1, n = 0;
      for (let i = 0; i < 12; i++) {
        const a = addMonths(+k.slice(0, 4), +k.slice(5, 7) - 1, -i), kk = a[0] + '-' + pad(a[1] + 1) + '-01';
        if (!(kk in m)) break;
        f *= 1 + m[kk] / 100; n++;
      }
      if (n === 12) out[k] = Math.round((f - 1) * 1000) / 10;
    });
  }
  return Object.keys(out).sort().filter((k) => +k.slice(0, 4) >= fromYear).map((k) => [k, out[k]]);
}
// El IPC del último mes viene del Banco Central (y no de findic.cl o de la UF)
export function ipcOfficial(S, hoy) {
  const b = bcchSeries(S, 'ipcm', 2000), m = ipcSeries(S, +hoy.slice(0, 4) - 1, 'm', hoy);
  return !!(b.length && m.length && b[b.length - 1][0] === m[m.length - 1][0]);
}
// Puntos de un rango, recortados a la fecha de inicio
export function since(s, years, hoy) { const k = anosAntes(hoy, years); return s.filter((p) => p[0] >= k); }

/* ---------- Datos de cada indicador ---------- */
export function view(S, k, prefs, hoy) {
  const cur = +hoy.slice(0, 4);
  if (k === 'uf') {
    const s = series(S, 'uf', cur - 2, hoy);
    if (!s.length) return null;
    const now = lastOnOrBefore(s, hoy) || s[s.length - 1], last = s[s.length - 1];
    const old = lastOnOrBefore(s, anosAntes(hoy, 1));
    return { v: now[1], date: now[0], last: last[0] > now[0] ? last : null, y12: old ? (now[1] / old[1] - 1) * 100 : null };
  }
  if (k === 'dolar' || k === 'cobre') {
    const s = series(S, k, cur - 2, hoy);
    if (!s.length) return null;
    const a = s[s.length - 1], b = s[s.length - 2];
    return { v: a[1], date: a[0], prev: b ? b[1] : null, spark: since(s, 1, hoy) };
  }
  if (k === 'ipc') {
    const m = ipcSeries(S, cur - 2, 'm', hoy), y = ipcSeries(S, cur - 2, '12m', hoy);
    if (!m.length) return null;
    const a = m[m.length - 1], ya = y.length && y[y.length - 1][0] === a[0] ? y[y.length - 1][1] : null;
    let acc = null;
    const yr = m.filter((p) => p[0].slice(0, 4) === a[0].slice(0, 4));
    if (yr.length) acc = (yr.reduce((t, p) => t * (1 + p[1] / 100), 1) - 1) * 100;
    return { v: a[1], date: a[0], y12: ya, ytd: acc, spark: m.slice(-12) };
  }
  if (k === 'tpm') {
    const s = series(S, 'tpm', cur - 4, hoy);
    if (!s.length) return null;
    const a = s[s.length - 1];
    let since0 = null;
    for (let i = s.length - 2; i >= 0; i--) if (s[i][1] !== a[1]) { since0 = { date: s[i + 1][0], from: s[i][1] }; break; }
    return { v: a[1], date: a[0], change: since0, spark: since(s, 1, hoy) };
  }
  if (k === 'imacec') {
    const s = series(S, 'imacec', cur - 2, hoy);
    if (!s.length) return null;
    const a = s[s.length - 1], mm = imacecMonthly(S, cur - 2);
    const m = mm.filter((p) => p[0] === a[0])[0] || null;
    return { v: a[1], date: a[0], m: m ? m[1] : null, mLast: mm.length ? mm[mm.length - 1] : null, spark: s.slice(-12) };
  }
  if (k === 'petroleo') {
    // El crudo elegido (WTI o Brent) va primero; el otro, como dato secundario
    const main = prefs.crudo, other = main === 'wti' ? 'brent' : 'wti';
    let s = bcchSeries(S, main, cur - 2), w = bcchSeries(S, other, cur - 2), name = main;
    if (!s.length && w.length) { const x = s; s = w; w = x; name = other; }
    if (!s.length) return null;
    const a = s[s.length - 1], b = s[s.length - 2], ol = w.length ? w[w.length - 1] : null;
    const e = S[name] && S[name].all, mk = e && e.d && Array.isArray(e.d.mercado) ? e.d.mercado : [];
    return { v: a[1], date: a[0], prev: b ? b[1] : null, crudo: name, other: ol, otherCode: name === main ? other : main,
      monthly: bcchMonthly(S, name), spark: bcchMonthly(S, name) ? s.slice(-12) : since(s, 1, hoy), market: mk.indexOf(a[0]) >= 0 };
  }
  return null;
}

function arrow(d) { return d > 0 ? '▲ ' : d < 0 ? '▼ ' : ''; }
// Resumen de un indicador, igual para el destacado y las tarjetas. lines: datos secundarios; «t» es el texto de la
// tarjeta y «l»/«v», la etiqueta y el valor del destacado.
export function summary(S, k, prefs, hoy) {
  const v = view(S, k, prefs, hoy);
  const s = { k, label: IND[k].short || IND[k].name, hero: IND[k].name, v, lines: [] };
  if (!v) return s;
  const cur = +hoy.slice(0, 4);
  if (k === 'uf') {
    s.hero = 'UF de hoy'; s.val = pesos(v.v); s.cap = 'Hoy';
    if (v.y12 != null) s.lines.push({ l: '12 meses', v: signed(v.y12, 2, PCT), t: '12 meses: ' + signed(v.y12, 2, PCT) });
    if (v.last) s.lines.push({ l: 'Al ' + fmtDay(v.last[0]), v: pesos(v.last[1]), t: 'Al ' + fmtDay(v.last[0]) + ': ' + pesos(v.last[1]) });
    s.spark = [since(series(S, 'uf', cur - 2, hoy).filter((p) => p[0] <= hoy), 1, hoy), 'line'];
  } else if (k === 'dolar') {
    s.val = pesos(v.v); s.cap = cap1(fmtDay(v.date)); s.heroCap = fmtDay(v.date, true);
    if (v.prev != null) { const d = v.v - v.prev; s.lines.push({ l: 'vs. día anterior', v: arrow(d) + nf(Math.abs(d), 2), t: arrow(d) + nf(Math.abs(d), 2) + ' vs. día anterior' }); }
    s.spark = [v.spark, 'line'];
  } else if (k === 'ipc') {
    s.hero = 'IPC de ' + fmtMonth(v.date); s.val = pct(v.v); s.cap = cap1(fmtMonth(v.date)) + ' · mensual'; s.heroCap = 'mensual';
    if (v.y12 != null) s.lines.push({ l: '12 meses', v: pct(v.y12), t: '12 meses: ' + pct(v.y12) });
    if (v.ytd != null) s.lines.push({ l: 'En el año', v: pct(v.ytd), t: 'En el año: ' + pct(v.ytd), heroOnly: true });
    s.spark = [v.spark, 'bar'];
  } else if (k === 'tpm') {
    s.val = pct(v.v, 2); s.cap = v.change ? 'Desde el ' + fmtDay(v.change.date, true) : 'Sin cambios'; s.heroCap = v.change ? 'desde el ' + fmtDay(v.change.date, true) : '';
    if (v.change) s.lines.push({ l: 'Antes', v: arrow(v.v - v.change.from) + pct(v.change.from, 2), t: arrow(v.v - v.change.from) + 'antes ' + pct(v.change.from, 2) });
    s.spark = [v.spark, 'step'];
  } else if (k === 'imacec') {
    s.hero = 'Imacec de ' + fmtMonth(v.date); s.val = pct(v.v); s.cap = cap1(fmtMonth(v.date)) + ' · 12 meses'; s.heroCap = 'en 12 meses';
    if (v.m != null) s.lines.push({ l: 'Mensual', v: signed(v.m, 1, PCT), t: 'Mensual: ' + signed(v.m, 1, PCT) + ' (desest.)' });
    s.spark = [v.spark, 'bar'];
  } else if (k === 'cobre') {
    s.hero = 'Cobre, dólares por libra'; s.val = usd(v.v); s.cap = cap1(fmtDay(v.date)) + ' · por libra'; s.heroCap = fmtDay(v.date, true);
    if (v.prev != null) { const d = v.v - v.prev; s.lines.push({ l: 'vs. día anterior', v: arrow(d) + nf(Math.abs(d), 2), t: arrow(d) + nf(Math.abs(d), 2) + ' vs. día anterior' }); }
    s.spark = [v.spark, 'line'];
  } else if (k === 'petroleo') {
    const nm = v.crudo === 'wti' ? 'WTI' : 'Brent', on = v.crudo === 'wti' ? 'Brent' : 'WTI';
    const om = bcchMonthly(S, v.otherCode), when = (x) => 'prom. ' + MES[+x.slice(5, 7) - 1];   // mensual: «prom. sep»
    s.hero = 'Petróleo ' + nm + ', dólares por barril'; s.val = usd(v.v);
    s.cap = v.monthly ? cap1(fmtMonth(v.date)) + ' · ' + nm + ', mensual' : cap1(fmtDay(v.date)) + ' · ' + nm;
    s.heroCap = v.monthly ? fmtMonth(v.date, true) + ', promedio mensual' : fmtDay(v.date, true);
    if (v.other) s.lines.push({ l: on + (om ? ' (' + when(v.other[0]) + ')' : ''), v: usd(v.other[1]), t: on + ': ' + usd(v.other[1]) + (om ? ' (' + when(v.other[0]) + ')' : '') });
    if (v.prev != null) { const d = v.v - v.prev; s.lines.push({ l: v.monthly ? 'vs. mes anterior' : 'vs. día anterior', v: arrow(d) + nf(Math.abs(d), 2), t: arrow(d) + nf(Math.abs(d), 2) + (v.monthly ? ' vs. mes anterior' : ' vs. día anterior'), heroOnly: true }); }
    s.spark = [v.spark, 'line'];
  }
  return s;
}

// Qué se grafica y cómo se escribe, para el indicador y el rango elegidos
export function detail(S, k, prefs, hoy) {
  const range = prefs.range, from = +hoy.slice(0, 4) - range;
  const dayFmt = (d) => cap1(DIAS[new Date(utcOf(d)).getUTCDay()]) + ' ' + fmtDay(d, true);
  const monFmt = (d) => cap1(fmtMonth(d, true));
  if (k === 'uf') return { pts: since(series(S, 'uf', from, hoy).filter((p) => p[0] <= hoy), range, hoy), kind: 'line', fmt: (v) => pesos(v), xfmt: dayFmt, ax: (v) => nf(v, 0), diff: 'pct' };
  if (k === 'dolar') return { pts: since(series(S, 'dolar', from, hoy), range, hoy), kind: 'line', fmt: (v) => pesos(v), xfmt: dayFmt, ax: (v, d) => nf(v, d), diff: 'pct' };
  if (k === 'ipc') {
    const m = prefs.ipc === 'm';
    return { pts: since(ipcSeries(S, from, m ? 'm' : '12m', hoy), range, hoy), kind: m ? 'bar' : 'line', fmt: (v) => pct(v), xfmt: monFmt, ax: (v, d) => nf(v, d) + '%', diff: m ? 'none' : 'pp', monthly: true };
  }
  if (k === 'tpm') return { pts: since(series(S, 'tpm', from, hoy), range, hoy), kind: 'step', fmt: (v) => pct(v, 2), xfmt: dayFmt, ax: (v, d) => nf(v, d) + '%', diff: 'pp' };
  if (k === 'imacec') {
    const m = prefs.imacec === 'm';
    return { pts: since(m ? imacecMonthly(S, from) : series(S, 'imacec', from, hoy), range, hoy), kind: 'bar', fmt: (v) => (m ? signed(v, 1, PCT) : pct(v)), xfmt: monFmt, ax: (v, d) => nf(v, d) + '%', diff: 'none', monthly: true };
  }
  if (k === 'cobre') return { pts: since(series(S, 'cobre', from, hoy), range, hoy), kind: 'line', fmt: (v) => usd(v), xfmt: dayFmt, ax: (v, d) => nf(v, d), diff: 'pct' };
  if (k === 'petroleo') {
    const mo = bcchMonthly(S, prefs.crudo);
    return { pts: since(bcchSeries(S, prefs.crudo, from), range, hoy), kind: 'line', fmt: (v) => usd(v), xfmt: mo ? monFmt : dayFmt, ax: (v, d) => nf(v, d), diff: 'pct', monthly: mo };
  }
  if (k === PAR) return { pts: parSeries(S, range, hoy), kind: 'par', series: PAR_SERIES, fmt: (v) => nf(v, 1), xfmt: dayFmt, ax: (v, d) => nf(v, d), diff: 'pct' };
  return null;
}
// Dólar y cobre en un mismo gráfico, sin dos escalas: los dos como índice, 100 el primer día del periodo con dato de ambos.
// Solo los días con dato de los dos (el cobre no se transa en los feriados de Londres, ni el dólar en los de Chile).
// Cada punto: [fecha, índice del dólar, índice del cobre, dólar, cobre].
export const PAR_SERIES = [{ k: 'dolar', nombre: 'Dólar', fmt: (v) => pesos(v) }, { k: 'cobre', nombre: 'Cobre', fmt: (v) => usd(v) }];
export function parSeries(S, range, hoy) {
  const from = +hoy.slice(0, 4) - range, cu = {};
  since(series(S, 'cobre', from, hoy), range, hoy).forEach((p) => { cu[p[0]] = p[1]; });
  const pares = since(series(S, 'dolar', from, hoy), range, hoy).filter((p) => p[0] in cu && p[1] > 0 && cu[p[0]] > 0);
  if (pares.length < 2) return [];
  const d0 = pares[0][1], c0 = cu[pares[0][0]];
  return pares.map((p) => [p[0], (p[1] / d0) * 100, (cu[p[0]] / c0) * 100, p[1], cu[p[0]]]);
}
// Correlación de las variaciones diarias de dos series (columnas a y b de cada punto). Con menos de 10 días, no hay.
export function correlacion(pts, a, b) {
  const x = [], y = [];
  for (let i = 1; i < pts.length; i++) { x.push(pts[i][a] / pts[i - 1][a] - 1); y.push(pts[i][b] / pts[i - 1][b] - 1); }
  const n = x.length;
  if (n < 10) return null;
  const mx = x.reduce((t, v) => t + v, 0) / n, my = y.reduce((t, v) => t + v, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { const dx = x[i] - mx, dy = y[i] - my; sxy += dx * dy; sxx += dx * dx; syy += dy * dy; }
  return sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : null;
}
// Mínimo, máximo y cambio (o promedio) del periodo graficado
export function stats(d, range) {
  if (!d || !d.pts.length) return null;
  if (d.kind === 'par') {
    // Cambio de cada uno en el periodo y correlación de sus variaciones diarias
    const a = d.pts[0], b = d.pts[d.pts.length - 1], r = correlacion(d.pts, 3, 4), en = 'en ' + (range === 1 ? '1 año' : range + ' años');
    return { par: true, cambios: d.series.map((s, j) => ({ k: s.k, nombre: s.nombre, v: signed((b[3 + j] / a[3 + j] - 1) * 100, 1, PCT), en })),
      correl: r == null ? null : { v: nf(r, 2), en: 'día a día' } };
  }
  let mn = d.pts[0], mx = d.pts[0];
  d.pts.forEach((p) => { if (p[1] < mn[1]) mn = p; if (p[1] > mx[1]) mx = p; });
  const a = d.pts[0][1], b = d.pts[d.pts.length - 1][1];
  const when = (p) => (d.monthly ? fmtMonth(p[0], true) : fmtDay(p[0], true));
  const out = { min: { v: d.fmt(mn[1]), en: when(mn) }, max: { v: d.fmt(mx[1]), en: when(mx) } };
  const enRango = 'en ' + (range === 1 ? '1 año' : range + ' años');
  if (d.diff === 'pct' && a) out.cambio = { v: signed((b / a - 1) * 100, 1, PCT), en: enRango };
  else if (d.diff === 'pp') out.cambio = { v: signed(b - a, 2, PP), en: enRango };
  else out.promedio = { v: d.fmt(d.pts.reduce((t, p) => t + p[1], 0) / d.pts.length), en: 'del periodo' };
  return out;
}
// Últimos valores para la tabla: los doce más recientes (en las tasas, solo los cambios)
export function recientes(d) {
  let list = d.pts.slice();
  if (d.kind === 'step') list = list.filter((p, i) => i === 0 || p[1] !== list[i - 1][1]);
  return list.slice(-12).reverse();
}

/* ---------- Gráficos ---------- */
export function niceTicks(min, max, n) {
  if (!(max > min)) { const c = isFinite(min) ? min : 0; min = c - 1; max = c + 1; }
  const raw = (max - min) / n, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
  const step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
  const lo = Math.floor(min / step - 1e-9) * step, hi = Math.ceil(max / step + 1e-9) * step, ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v / step) * step);
  return { lo, hi, ticks, step };
}
export function stepDecimals(step) { return step >= 1 ? 0 : step >= 0.1 ? 1 : 2; }
// Muchos puntos diarios se dibujan con uno de cada tantos, siempre con el último. Para tasas, solo los cambios.
export function thin(pts, kind) {
  if (kind === 'step') return pts.filter((p, i) => i === 0 || i === pts.length - 1 || p[1] !== pts[i - 1][1] || p[1] !== (pts[i + 1] || p)[1]);
  if (pts.length <= 480) return pts;
  const k = Math.ceil(pts.length / 480);
  return pts.filter((p, i) => i % k === 0 || i === pts.length - 1);
}
// Tendencia chica de las tarjetas (12 meses)
export function sparkSVG(pts, kind) {
  const W = 120, H = 34;
  if (!pts || pts.length < 2) return '';
  const vals = pts.map((p) => p[1]);
  let mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals);
  if (kind === 'bar') { mn = Math.min(0, mn); mx = Math.max(0, mx); }
  if (mx === mn) { mx += 1; mn -= 1; }
  const y = (v) => 3 + (H - 6) * (1 - (v - mn) / (mx - mn));
  if (kind === 'bar') {
    const n = pts.length, band = W / n, w = Math.max(2, Math.min(8, band - 2)), z = y(0);
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true">' + pts.map((p, i) => {
      const x = i * band + (band - w) / 2, yy = y(p[1]), top = Math.min(yy, z), h = Math.max(1.5, Math.abs(yy - z));
      return '<rect class="' + (i === n - 1 ? 'c-spark-hoy' : 'c-spark-b') + '" x="' + x.toFixed(1) + '" y="' + top.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="1.5"/>';
    }).join('') + '</svg>';
  }
  const t0 = utcOf(pts[0][0]), t1 = utcOf(pts[pts.length - 1][0]);
  const x = (k) => 2 + (W - 6) * (t1 > t0 ? (utcOf(k) - t0) / (t1 - t0) : 1);
  let d = '';
  thin(pts, kind).forEach((p, i) => {
    const xx = x(p[0]).toFixed(1), yy = y(p[1]).toFixed(1);
    d += !i ? 'M' + xx + ' ' + yy : kind === 'step' ? 'H' + xx + 'V' + yy : 'L' + xx + ' ' + yy;
  });
  const last = pts[pts.length - 1];
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true"><path class="c-spark-l" d="' + d + '"/>' +
    '<circle class="c-spark-punto" cx="' + x(last[0]).toFixed(1) + '" cy="' + y(last[1]).toFixed(1) + '" r="4"/></svg>';
}
