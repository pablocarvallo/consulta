// Pruebas de calculos.js. Correr con: TZ=America/Santiago node --test pruebas/*.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../calculos.js';

const HOY = '2026-11-24';
// Datos inventados para probar
function diario(desde, hasta, f) {
  const out = [];
  for (let t = C.utcOf(desde); t <= C.utcOf(hasta); t += 86400000) { const k = new Date(t).toISOString().slice(0, 10); const v = f(k, out.length); if (v != null) out.push([k, v]); }
  return out;
}
function porAno(pts) { const m = {}; pts.forEach((p) => { const y = +p[0].slice(0, 4); (m[y] = m[y] || []).push(p); }); const o = {}; Object.keys(m).forEach((y) => { o[y] = { t: 0, d: m[y] }; }); return o; }

test('Números a la chilena', () => {
  assert.equal(C.nf(39874.1234, 2), '39.874,12');
  assert.equal(C.nf(-0.001, 1), '0,0');
  assert.equal(C.nf(-1.25, 1), '−1,3');
  assert.equal(C.pesos(947.5), '$ 947,50');
  assert.equal(C.pct(3.94), '3,9 %');
  assert.equal(C.signed(0.04, 1, C.PCT), '0,0 %');
  assert.equal(C.signed(0.06, 1, C.PCT), '+0,1 %');
  assert.equal(C.num('1.234,5'), 1234.5);
  assert.equal(C.num('4.5'), 4.5);
  assert.equal(C.fechaLarga(HOY), 'Martes 24 de noviembre');
});

test('Lectura de findic.cl y del Banco Central', () => {
  const s = C.leerMi({ serie: [{ fecha: '2026-11-03T03:00:00.000Z', valor: 2 }, { fecha: '2026-11-02', valor: 1 }, { fecha: 'x', valor: 3 }] });
  assert.deepEqual(s, [['2026-11-02', 1], ['2026-11-03', 2]]);
  assert.throws(() => C.leerMi({}), /formato/);
  const b = C.leerBcch({ serie: 'F019.PPB.PRE.41AB.M', actualizado: '2026-11-06T17:57:29Z', obs: [['2026-10-01', '63,5'], ['2026-09-01', 61]], mercado: ['2026-10-01'] });
  assert.deepEqual(b.obs, [['2026-09-01', 61], ['2026-10-01', 63.5]]);
  assert.equal(b.at, '2026-11-06T17:57:29Z');
  assert.equal(C.bcchMonthly({ brent: { all: { d: b } } }, 'brent'), true);
});

test('IPC calculado con la UF, mensual y en 12 meses', () => {
  // UF que sube 0,5 % cada día 10: el IPC de cada mes da 0,5 % y el de 12 meses, 6,2 %
  let v = 30000;
  const uf = diario('2023-01-01', '2026-12-09', (k) => { if (k.slice(8) === '10') v *= 1.005; return v; });
  const S = { uf: porAno(uf) };
  const m = C.ipcUf(S, 2025, 'm', HOY);
  assert.equal(m[0][0], '2025-01-01');
  assert.ok(m.every((p) => p[1] === 0.5));
  // El último mes con IPC calculable es octubre de 2026 (necesita la UF del 9 de diciembre)
  assert.equal(m[m.length - 1][0], '2026-10-01');
  const y = C.ipcSeries(S, 2026, '12m', HOY);
  assert.equal(y[y.length - 1][1], 6.2);
  // Lo oficial del Banco Central manda sobre lo calculado
  S.ipcm = { all: { d: { obs: [['2026-10-01', 0.3]] } } };
  const m2 = C.ipcSeries(S, 2026, 'm', HOY);
  assert.deepEqual(m2[m2.length - 1], ['2026-10-01', 0.3]);
  assert.equal(C.ipcOfficial(S, HOY), true);
});

test('IPC en 12 meses compuesto con los doce meses cuando no hay dato oficial', () => {
  const ipc = []; for (let i = 0; i < 24; i++) { const a = C.addMonths(2025, 0, i); ipc.push([a[0] + '-' + C.pad(a[1] + 1) + '-01', 0.4]); }
  const S = { ipc: porAno(ipc.filter((p) => p[0] <= '2026-10-01')) };
  const y = C.ipcSeries(S, 2026, '12m', HOY);
  assert.deepEqual(y[y.length - 1], ['2026-10-01', 4.9]);
  const v = C.view(S, 'ipc', C.prefsIniciales(), HOY);
  assert.equal(v.date, '2026-10-01');
  assert.equal(v.y12, 4.9);
  assert.equal(Math.round(v.ytd * 10) / 10, 4.1);   // diez meses de 0,4 %
});

test('Imacec mensual con la serie desestacionalizada, solo meses seguidos', () => {
  const S = { imacecde: { all: { d: { obs: [['2026-06-01', 100], ['2026-07-01', 101], ['2026-09-01', 103], ['2026-10-01', 102.5]] } } } };
  assert.deepEqual(C.imacecMonthly(S, 2026), [['2026-07-01', 1], ['2026-10-01', -0.5]]);
});

test('UF de hoy, su variación en 12 meses y el último valor publicado', () => {
  const uf = diario('2024-01-01', '2026-12-09', (k, i) => 37000 + i);
  const S = { uf: porAno(uf) };
  const v = C.view(S, 'uf', C.prefsIniciales(), HOY);
  assert.equal(v.date, HOY);
  assert.deepEqual(v.last[0], '2026-12-09');
  const hoy = uf.find((p) => p[0] === HOY)[1], antes = uf.find((p) => p[0] === '2025-11-24')[1];
  assert.equal(v.y12, (hoy / antes - 1) * 100);
  const s = C.summary(S, 'uf', C.prefsIniciales(), HOY);
  assert.equal(s.hero, 'UF de hoy');
  assert.equal(s.lines[1].l, 'Al 9 dic');
});

test('TPM: desde cuándo rige y la tasa anterior', () => {
  const tpm = diario('2023-01-01', HOY, (k) => (k < '2025-12-17' ? 5 : 4.5));
  const S = { tpm: porAno(tpm) };
  const v = C.view(S, 'tpm', C.prefsIniciales(), HOY);
  assert.equal(v.v, 4.5);
  assert.deepEqual(v.change, { date: '2025-12-17', from: 5 });
  const s = C.summary(S, 'tpm', C.prefsIniciales(), HOY);
  assert.equal(s.cap, 'Desde el 17 dic 2025');
  assert.equal(s.lines[0].t, '▼ antes 5,00 %');
  // En el gráfico, solo los cambios
  const d = C.detail(S, 'tpm', C.prefsIniciales({ range: 5 }), HOY);
  assert.deepEqual(C.recientes(d).map((p) => p[1]), [4.5, 5]);
});

test('Petróleo: el crudo elegido va primero; si falta, el otro', () => {
  const wti = { d: { serie: 'F019.PPB.PRE.41B.D', obs: [['2026-11-20', 58], ['2026-11-21', 59.5]], mercado: ['2026-11-21'] } };
  const brent = { d: { serie: 'F019.PPB.PRE.41AB.M', obs: [['2026-09-01', 66], ['2026-10-01', 64]] } };
  const S = { wti: { all: wti }, brent: { all: brent } };
  const v = C.view(S, 'petroleo', C.prefsIniciales(), HOY);
  assert.equal(v.crudo, 'wti'); assert.equal(v.v, 59.5); assert.equal(v.market, true); assert.deepEqual(v.other, ['2026-10-01', 64]);
  const s = C.summary(S, 'petroleo', C.prefsIniciales(), HOY);
  assert.equal(s.lines[0].t, 'Brent: US$ 64,00 (prom. oct)');
  const b = C.view(S, 'petroleo', C.prefsIniciales({ crudo: 'brent' }), HOY);
  assert.equal(b.crudo, 'brent'); assert.equal(b.monthly, true);
  const solo = C.view({ brent: { all: brent } }, 'petroleo', C.prefsIniciales(), HOY);
  assert.equal(solo.crudo, 'brent');
});

test('Estadísticas del periodo graficado', () => {
  const dolar = diario('2025-11-24', HOY, (k, i) => 900 + (i % 50));
  const S = { dolar: porAno(dolar) };
  const d = C.detail(S, 'dolar', C.prefsIniciales({ range: 1 }), HOY);
  const st = C.stats(d, 1);
  assert.equal(st.min.v, '$ 900,00'); assert.equal(st.max.v, '$ 949,00');
  assert.equal(st.cambio.en, 'en 1 año');
  const im = C.detail({ imacec: porAno([['2026-08-01', 2], ['2026-09-01', 4]]) }, 'imacec', C.prefsIniciales({ range: 1 }), HOY);
  assert.equal(C.stats(im, 1).promedio.v, '3,0 %');
  assert.equal(C.stats(im, 1).min.en, 'agosto 2026');
});

test('Preferencias inválidas vuelven a su valor de siempre', () => {
  const p = C.prefsIniciales({ range: 3, hero: 'x', grafico: 'y', crudo: 'z' });
  assert.deepEqual([p.range, p.hero, p.grafico, p.crudo, p.tema], [5, 'uf', 'dolar', 'wti', 'auto']);
});

test('Gráficos: marcas del eje y puntos reducidos', () => {
  const t = C.niceTicks(901, 949, 4);
  assert.deepEqual([t.lo, t.hi, t.step], [900, 960, 20]);
  assert.equal(C.stepDecimals(0.25), 1);
  const pts = Array.from({ length: 1000 }, (_, i) => ['2026-01-01', i]);
  const r = C.thin(pts, 'line');
  assert.ok(r.length <= 501); assert.equal(r[r.length - 1][1], 999);
  assert.match(C.sparkSVG([['2026-01-01', 1], ['2026-02-01', 2]], 'line'), /c-spark-punto/);
  assert.equal(C.sparkSVG([['2026-01-01', 1]], 'line'), '');
});
