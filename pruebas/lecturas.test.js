// Pruebas de lecturas.js. Correr con: TZ=America/Santiago node --test pruebas/*.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../lecturas.js';

const HOY = '2026-11-24';
// Datos inventados para probar
const datos = () => ({
  reading: [{ id: '1', title: 'El nombre del viento' }],
  toRead: [{ id: '2', title: 'Rayuela', author: 'Julio Cortázar' }, { id: '3', title: 'Pedro Páramo', author: 'Juan Rulfo' }, { id: '4', title: 'Ficciones', author: 'Jorge Luis Borges' }],
  read: [{ id: '5', title: 'Ficciones', userRating: 5 }, { id: '6', title: 'Otro' }],
  challenges: [
    { year: 2026, goal: 30, read: 24, books: [{ id: '5', userRating: 5 }, { id: '7', userRating: 4 }, { id: '8', userRating: null }] },
    { year: 2025, goal: 20, read: 22, books: [{ id: '6' }] },
  ],
});

test('Índice de libros con su estante', () => {
  const d = datos(), m = L.indice(d);
  assert.equal(m.get('1').shelf, 'reading');
  assert.equal(m.get('2').shelf, 'toread');
  assert.equal(m.get('5').shelf, 'read');
  assert.equal(m.get('6').book.year, 2025);   // el año sale del desafío
  assert.equal(L.indice(null).size, 0);
});

test('Ritmo del desafío según la parte del año que pasó', () => {
  // Al 24 de noviembre pasó el 89,6 % del año: 30 × 0,896 = 26,9 → 24 leídos son 3 libros de atraso
  assert.deepEqual(L.ritmo({ year: 2026, goal: 30, read: 24 }, HOY), { cls: 'aviso', text: '3 libros atrasado' });
  assert.deepEqual(L.ritmo({ year: 2026, goal: 30, read: 29 }, HOY), { cls: 'ok', text: '2 libros adelantado' });
  assert.deepEqual(L.ritmo({ year: 2026, goal: 30, read: 27 }, HOY), { cls: 'ok', text: 'Al día con la meta' });
  assert.equal(L.ritmo({ year: 2026, goal: 30, read: 31 }, HOY).text, 'Meta cumplida');
  assert.equal(L.ritmo({ year: 2024, goal: 30, read: 29 }, HOY).text, 'Faltaron 1 libro');
  assert.equal(L.ritmo({ year: 2026, goal: null, read: 3 }, HOY), null);
  assert.equal(L.diasQuedan(2026, HOY), 38);
});

test('Cifras del año: libros, por mes y nota promedio', () => {
  const c = L.cifrasAno(datos(), 2026, 24, HOY);
  assert.equal(c.libros, 24);
  assert.equal(Math.round(c.porMes * 10) / 10, 2.2);   // 327 días son 10,7 meses
  assert.equal(c.nota, 4.5);
  assert.equal(L.cifrasAno(datos(), 2025, 22, HOY).porMes, 22 / 12);
  assert.equal(L.cifrasAno(datos(), 2019, 0, HOY).porMes, null);
});

test('Quiero leer por título y por apellido del autor', () => {
  const d = datos();
  assert.deepEqual(L.ordenarQuiero(d.toRead, 'title').map((b) => b.id), ['4', '3', '2']);
  assert.deepEqual(L.ordenarQuiero(d.toRead, 'author').map((b) => b.id), ['4', '2', '3']);
  assert.deepEqual(L.ordenarQuiero(d.toRead, 'recent').map((b) => b.id), ['2', '3', '4']);
});

test('Estrellas fraccionarias, fechas y búsquedas recientes', () => {
  assert.deepEqual(L.estrellas(4.25), [1, 1, 1, 1, 0.25]);
  assert.equal(L.fmtFecha('2026-11-03T12:00:00Z', HOY), '3 nov');
  assert.equal(L.fmtFecha('2025-09-03T12:00:00Z', HOY), '3 sept 2025');
  assert.deepEqual(L.recordar(['borges', 'Rulfo'], 'rulfo'), ['rulfo', 'borges']);
  assert.equal(L.plural(1, 'libro', 'libros'), '1 libro');
});
