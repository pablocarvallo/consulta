// Pruebas de cartelera.js. Correr con: TZ=America/Santiago node --test pruebas/*.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as K from '../cartelera.js';

const HOY = '2026-11-24';
const dune = { id: 693134, type: 'movie', title: 'Dune: Parte Dos', year: '2024', poster: '/d.jpg' };
const bear = { id: 136315, type: 'tv', title: 'The Bear', year: '2022', poster: '/b.jpg' };

test('Quiero ver, ya la vi, nota y quitar', () => {
  let d = K.plantilla();
  d = K.aplicar(d, { id: 'c1', tipo: 'agregar', k: 'movie:693134', base: dune, estado: 'want', at: 100, dia: HOY });
  assert.equal(d.items['movie:693134'].status, 'want');
  d = K.aplicar(d, { id: 'c2', tipo: 'agregar', k: 'movie:693134', estado: 'seen', at: 200, dia: HOY });
  assert.deepEqual([d.items['movie:693134'].status, d.items['movie:693134'].seenAt, d.items['movie:693134'].addedAt], ['seen', HOY, 100]);
  d = K.aplicar(d, { id: 'c3', tipo: 'nota', k: 'movie:693134', n: 4 });
  assert.equal(d.items['movie:693134'].rating, 4);
  d = K.aplicar(d, { id: 'c4', tipo: 'fechaVista', k: 'movie:693134', dia: '2026-11-01' });
  assert.equal(d.items['movie:693134'].seenAt, '2026-11-01');
  // Volver a ver: vuelve a Quiero ver sin fecha de vista
  d = K.aplicar(d, { id: 'c5', tipo: 'agregar', k: 'movie:693134', estado: 'want', at: 300, dia: HOY });
  assert.equal(d.items['movie:693134'].seenAt, undefined);
  assert.equal(d.items['movie:693134'].rating, 4);
  d = K.aplicar(d, { id: 'c6', tipo: 'quitar', k: 'movie:693134' });
  assert.deepEqual(d.items, {});
});

test('Un cambio repetido se aplica una sola vez', () => {
  const run = 5;
  const c = { id: 'h1', tipo: 'historial', run, dia: HOY, pares: [{ e: { kind: 'tv', first: '2025-01-02', last: '2025-03-04', plays: 10, eps: 10, src: 'Netflix' }, r: bear }] };
  let d = K.aplicar(K.plantilla(), c);
  d = K.aplicar(d, c);
  assert.equal(d.items['tv:136315'].nf.eps, 10);
  assert.ok(d.ultimos_cambios.includes('h1'));
});

test('Un cambio desconocido o sin título no se registra', () => {
  assert.throws(() => K.aplicar(K.plantilla(), { tipo: 'otro' }), /desconocido/);
  assert.throws(() => K.aplicar(K.plantilla(), { tipo: 'agregar', k: 'tv:1', estado: 'want' }), /Falta el título/);
});

test('Historial: el mismo título con dos nombres en una importación suma episodios', () => {
  const items = {};
  assert.equal(K.aplicarHistorial(items, { kind: 'tv', first: '2025-01-01', last: '2025-02-01', plays: 3, eps: 3, src: 'Netflix' }, bear, 9, HOY), 'nuevo');
  assert.equal(K.aplicarHistorial(items, { kind: 'tv', first: '2024-12-01', last: '2025-03-01', plays: 2, eps: 2, src: 'Prime Video' }, bear, 9, HOY), 'existia');
  const it = items['tv:136315'];
  assert.deepEqual([it.nf.eps, it.nf.plays, it.nf.first, it.nf.src, it.seenAt], [5, 5, '2024-12-01', 'Netflix y Prime Video', '2025-03-01']);
  // En otra importación no se duplica: se queda con el mayor
  K.aplicarHistorial(items, { kind: 'tv', first: '2025-01-01', last: '2025-02-01', plays: 3, eps: 3, src: 'Netflix' }, bear, 10, HOY);
  assert.equal(items['tv:136315'].nf.eps, 5);
  // Una fecha futura (Netflix anota en UTC) queda en hoy
  K.aplicarHistorial(items, { kind: 'movie', last: '2026-11-25', plays: 1, eps: 0 }, dune, 9, HOY);
  assert.equal(items['movie:693134'].seenAt, HOY);
});

test('Elegido a mano: queda en Vistos aunque estuviera en Quiero ver', () => {
  let d = K.aplicar(K.plantilla(), { id: 'a', tipo: 'agregar', k: 'tv:136315', base: bear, estado: 'want', at: 1, dia: HOY });
  d = K.aplicar(d, { id: 'b', tipo: 'historial', run: 'manual-1', dia: HOY, visto: true, pares: [{ e: { kind: 'tv', last: '2025-05-05', plays: 4, eps: 4 }, r: bear }] });
  assert.deepEqual([d.items['tv:136315'].status, d.items['tv:136315'].seenAt], ['seen', '2025-05-05']);
});

test('Respaldo de la app Cartelera: títulos válidos, sin plataformas, que no pisan los que ya están', () => {
  const texto = JSON.stringify({ app: 'cartelera', version: 1, items: {
    'movie:693134': Object.assign({}, dune, { status: 'want', addedAt: 5, prov: { stream: [{ n: 'HBO Max', l: '' }] }, provAt: 99 }),
    'tv:136315': Object.assign({}, bear, { status: 'seen', seenAt: '2025-10-01', rating: 5, src: 'netflix', nfRun: 3, nf: { eps: 8, plays: 9, first: '2025-09-01', run: 3, src: 'Netflix' } }),
    'tv:x': { id: 0, type: 'tv', status: 'seen' },
  } });
  const r = K.leerRespaldo(texto);
  assert.deepEqual([r.n, r.vistos, r.quiero], [2, 1, 1]);
  assert.equal(r.items['movie:693134'].prov, undefined);
  assert.equal(r.items['tv:136315'].src, undefined);
  assert.deepEqual(r.prov['movie:693134'].at, 99);
  let d = K.aplicar(K.plantilla(), { id: 'x', tipo: 'agregar', k: 'tv:136315', base: bear, estado: 'want', at: 7, dia: HOY });
  d = K.aplicar(d, { id: 'y', tipo: 'importar', items: r.items });
  assert.equal(d.items['tv:136315'].status, 'want');
  assert.equal(d.items['movie:693134'].status, 'want');
  assert.match(K.leerRespaldo('no').error, /no es un respaldo/);
  // El respaldo que exporta Consulta se puede volver a leer
  const de = K.respaldo(d, { 'movie:693134': { prov: { stream: [] }, at: 1 } }, '2026-11-24T12:00:00Z');
  assert.equal(K.leerRespaldo(JSON.stringify(de)).n, 2);
});

test('Plataformas en Chile y filtros de Quiero ver', () => {
  const p = K.parseProv({ results: { CL: { flatrate: [{ provider_name: 'Max', logo_path: '/m.png', display_priority: 2 }, { provider_name: 'Netflix', display_priority: 1 }, { provider_name: 'Netflix Kids', display_priority: 3 }], rent: [{ provider_name: 'Apple TV' }] } } });
  assert.deepEqual(p.stream.map((x) => x.n), ['Netflix', 'HBO Max']);
  assert.deepEqual(K.streamOf(p).map((x) => x.n), ['Netflix', 'HBO Max']);
  assert.deepEqual(K.parseProv({ results: {} }).stream, []);
  const lista = [Object.assign({}, dune, { status: 'want' }), Object.assign({}, bear, { status: 'want' })];
  const prov = { 'movie:693134': p, 'tv:136315': { stream: [{ n: 'Disney+' }] } };
  const f = K.filtrarQuiero(lista, (it) => prov[K.keyOf(it)], 'all', 'Netflix');
  assert.deepEqual(f.list.map((x) => x.id), [693134]);
  assert.equal(f.provs.length, 3);
  assert.equal(K.filtrarQuiero(lista, (it) => prov[K.keyOf(it)], 'tv', 'Netflix').prov, '');
});

test('Vistos por mes y búsqueda en las listas', () => {
  const l = [{ title: 'A', seenAt: '2026-11-03' }, { title: 'B', seenAt: '2026-11-01' }, { title: 'C', seenAt: '2026-10-09' }];
  assert.deepEqual(K.porMes(l).map((g) => [g.ym, g.items.length]), [['2026-11', 2], ['2026-10', 1]]);
  const d = { items: { 'movie:1': { title: 'Pobres criaturas', status: 'seen' }, 'tv:2': { title: 'Shōgun', status: 'want' } } };
  assert.deepEqual(K.enListas(d, 'shogun').map((x) => x.title), ['Shōgun']);
  assert.deepEqual(K.enListas(d, ' '), []);
});

test('Historial de Netflix: agrupa episodios en su serie y separa películas', () => {
  const csv = 'Title,Date\n"Stranger Things: Temporada 4: Capítulo uno",3/10/2025\n"Stranger Things: Temporada 4: Capítulo dos",4/10/2025\n' +
    '"Dune: Parte dos",15/9/2025\n"Ratched: Piloto",1/2/2024\n"Ratched: Rosa",2/2/2024\n';
  const p = K.nfParse(csv);
  assert.equal(p.format, 'history');
  assert.equal(p.plays[0].date, '2025-10-03');
  const g = K.nfGroup(p.plays);
  const st = g.find((x) => x.name === 'Stranger Things');
  assert.deepEqual([st.kind, st.eps, st.first, st.last], ['tv', 2, '2025-10-03', '2025-10-04']);
  assert.equal(g.find((x) => x.name === 'Dune: Parte dos').kind, 'movie');
  const ra = g.find((x) => x.name === 'Ratched');
  assert.deepEqual([ra.kind, ra.weak, ra.members.length], ['tv', true, 2]);
});

test('Historial: archivo de actividad con perfiles, avances y vistas cortas', () => {
  const csv = 'Profile Name,Start Time,Duration,Attributes,Title,Supplemental Video Type,Device Type,Bookmark,Latest Bookmark,Country\n' +
    'Pablo,2025-10-03 02:30:00,00:45:00,,La casa de papel: Parte 1: Episodio 1,,iPhone,00:45:00,00:45:00,CL (Chile)\n' +
    'Pablo,2025-10-03 03:30:00,00:00:30,,La casa de papel: Parte 1: Episodio 2,,iPhone,00:00:30,00:00:30,CL (Chile)\n' +
    'Emi,2025-10-04 15:00:00,00:02:00,,Avance,TRAILER,iPhone,,,CL (Chile)\n';
  const p = K.nfParse(csv);
  assert.equal(p.format, 'activity');
  assert.equal(p.plays.length, 1);
  assert.equal(p.skipped, 2);
  assert.equal(p.plays[0].date, '2025-10-02');   // 02:30 UTC es el día anterior en Chile
  assert.deepEqual(p.profiles.map((x) => x.name), ['Pablo']);
});

test('Historial de Prime Video copiado de la página', () => {
  const txt = '25 de octubre de 2025\nThe Boys - Temporada 4\nEpisodios vistos\nOppenheimer\nEliminar película del historial de visualización\n';
  const p = K.nfParse(txt);
  assert.equal(p.format, 'prime');
  assert.deepEqual(p.plays.map((x) => [x.title, x.kind, x.date]), [['The Boys', 'tv', '2025-10-25'], ['Oppenheimer', 'movie', '2025-10-25']]);
  const g = K.nfGroup(p.plays);
  assert.equal(g.find((x) => x.name === 'The Boys').eps, 0);   // Prime Video no dice cuántos episodios
});

test('Historial: tildes dañadas por Excel y elección del título en TMDB', () => {
  assert.equal(K.nfFixMojibake('CapÃ­tulo'), 'Capítulo');
  const bytes = new Uint8Array([0xEF, 0xBB, 0xBF].concat(Array.from(Buffer.from('Title,Date\nÁ,1/1/2025\n', 'utf8'))));
  assert.match(K.nfDecode(bytes), /^Title/);
  const r = K.nfBest([{ title: 'Perros de la calle', orig: 'Reservoir Dogs' }, { title: 'Otra' }], 'Reservoir Dogs');
  assert.equal(r.title, 'Perros de la calle');
  assert.equal(K.nfBest([{ title: 'Algo distinto', orig: '' }], 'Nada que ver'), null);
  assert.deepEqual(K.nfIntentos({ name: 'Mad Men: Humo', kind: 'movie' }).map((x) => x.path), ['/search/movie', '/search/multi', '/search/tv']);
});
