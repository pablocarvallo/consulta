// Consulta · Lecturas sin pantalla (con pruebas en pruebas/). Los datos vienen de Goodreads a través de
// domesticas-api (/api/lecturas); aquí se calculan el ritmo del desafío, las cifras de cada año y el orden de las
// listas. La lógica viene de la app Lecturas (pablocarvallo/lecturas); recibe la fecha de hoy para poder probarla.

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];
export const plural = (n, a, b) => `${Number(n).toLocaleString('es-CL')} ${n === 1 ? a : b}`;
export const fmtNum = (n) => Number(n).toLocaleString('es-CL');
export const fmtPromedio = (n) => (n == null ? '' : Number(n).toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
const anoDe = (hoy) => +String(hoy).slice(0, 4);
const ms = (k) => Date.UTC(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8, 10));

// Fecha corta («3 nov», con el año si no es el actual)
export function fmtFecha(iso, hoy, conAno) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const y = d.getFullYear();
  return `${d.getDate()} ${MESES[d.getMonth()]}${(conAno ?? y !== anoDe(hoy)) ? ' ' + y : ''}`;
}

// Índice de todos los libros conocidos con su estante; el estante más actual prevalece
export function indice(d) {
  const m = new Map();
  if (!d) return m;
  for (const c of d.challenges || []) for (const b of c.books || []) { b.year = b.year || c.year; m.set(b.id, { shelf: 'read', book: b }); }
  for (const b of d.toRead || []) m.set(b.id, { shelf: 'toread', book: b });
  for (const b of d.read || []) {
    const prev = m.get(b.id);
    if (!b.year && prev && prev.book.year) b.year = prev.book.year;
    m.set(b.id, { shelf: 'read', book: b });
  }
  for (const b of d.reading || []) m.set(b.id, { shelf: 'reading', book: b });
  return m;
}

export function desafio(d, ano) {
  return ((d && d.challenges) || []).find((c) => c.year === ano) || { year: ano, goal: null, read: 0, books: [] };
}
export function diasQuedan(ano, hoy) { return Math.max(0, Math.round((Date.UTC(ano + 1, 0, 1) - ms(hoy)) / 86400000)); }

// Ritmo respecto de la meta: cumplida, al día, adelantado o atrasado (según la parte del año que ya pasó)
export function ritmo(ch, hoy) {
  if (!ch.goal) return null;
  if (ch.read >= ch.goal) return { cls: 'ok', text: 'Meta cumplida' };
  if (ch.year < anoDe(hoy)) return { cls: '', text: `Faltaron ${plural(ch.goal - ch.read, 'libro', 'libros')}` };
  const frac = Math.min(1, (ms(hoy) - Date.UTC(ch.year, 0, 1)) / (Date.UTC(ch.year + 1, 0, 1) - Date.UTC(ch.year, 0, 1)));
  const diff = ch.read - ch.goal * frac, n = Math.round(Math.abs(diff));
  if (n === 0) return { cls: 'ok', text: 'Al día con la meta' };
  return diff > 0 ? { cls: 'ok', text: `${plural(n, 'libro', 'libros')} adelantado` } : { cls: 'aviso', text: `${plural(n, 'libro', 'libros')} atrasado` };
}

// Cifras de un año: libros, promedio por mes y nota promedio de los calificados
export function cifrasAno(d, ano, leidos, hoy) {
  const libros = desafio(d, ano).books || [];
  const calif = libros.filter((b) => b.userRating);
  const nota = calif.length ? calif.reduce((s, b) => s + b.userRating, 0) / calif.length : null;
  const meses = ano < anoDe(hoy) ? 12 : Math.max(1, (ms(hoy) - Date.UTC(ano, 0, 1)) / (30.44 * 86400000));
  return { libros: leidos, porMes: leidos ? leidos / meses : null, nota };
}

// Quiero leer: recientes (como viene), por título o por apellido del autor
export function ordenarQuiero(lista, orden) {
  const l = (lista || []).slice(), coll = new Intl.Collator('es', { sensitivity: 'base' });
  const apellido = (a) => (a || '').trim().split(/\s+/).pop();
  if (orden === 'title') l.sort((a, b) => coll.compare(a.title, b.title));
  else if (orden === 'author') l.sort((a, b) => coll.compare(apellido(a.author), apellido(b.author)) || coll.compare(a.title, b.title));
  return l;
}

// Relleno de cada una de las 5 estrellas (Goodreads admite notas como 4¼)
export function estrellas(n) { return [1, 2, 3, 4, 5].map((i) => Math.max(0, Math.min(1, (n || 0) - (i - 1)))); }

// Búsquedas recientes: la última primero, sin repetir y hasta 8
export function recordar(lista, q) { return [q, ...(lista || []).filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 8); }
