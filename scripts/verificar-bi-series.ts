/**
 * Verifica las series de Business Intelligence.
 *
 *   npx tsx scripts/verificar-bi-series.ts
 */

import { buildBISeries, normalizeSensitivity, DEFAULT_SENSITIVITY } from '../server/services/biSeriesService';
import { db } from '../server/db/database';

let fallos = 0;
const check = (nombre: string, ok: boolean, detalle = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FALLA'} ${nombre}${detalle ? ` — ${detalle}` : ''}`);
  if (!ok) fallos++;
};

const haceMeses = (m: number, dia = 15) => {
  const d = new Date();
  d.setMonth(d.getMonth() - m, dia);
  return d.toISOString();
};

const productos: any[] = db.getProducts();
const movimientos: any[] = db.getMovements();

if (productos.length < 3) {
  console.error('Catálogo insuficiente para la prueba.');
  process.exit(1);
}

const p1 = productos[0];
const p2 = productos[1];

// p1: crece mes a mes durante 6 meses
[10, 12, 15, 20, 26, 34].forEach((q, i) => {
  movimientos.push({ product_code: p1.code, type: 'SALIDA', quantity: q, timestamp: haceMeses(5 - i) });
});
// p2: volumen plano
[8, 8, 8, 8, 8, 8].forEach((q, i) => {
  movimientos.push({ product_code: p2.code, type: 'SALIDA', quantity: q, timestamp: haceMeses(5 - i) });
});
// Fuera de la ventana de 6 meses
movimientos.push({ product_code: p1.code, type: 'SALIDA', quantity: 9999, timestamp: haceMeses(14) });

console.log('\n=== Normalización de parámetros ===');
check('valores fuera de rango se acotan',
  normalizeSensitivity({ seasonality: 999, trendWeight: -50, safetyMargin: 500 }).seasonality === 50 &&
  normalizeSensitivity({ seasonality: 999, trendWeight: -50, safetyMargin: 500 }).trendWeight === 0 &&
  normalizeSensitivity({ seasonality: 999, trendWeight: -50, safetyMargin: 500 }).safetyMargin === 50);
check('NaN cae al valor por defecto',
  normalizeSensitivity({ seasonality: NaN as any }).seasonality === DEFAULT_SENSITIVITY.seasonality);
check('undefined cae al valor por defecto',
  normalizeSensitivity(undefined).trendWeight === DEFAULT_SENSITIVITY.trendWeight);

console.log('\n=== Estructura de las series ===');
const base = buildBISeries({ historicalMonths: 6, forecastMonths: 2, topN: 10 });

check('el eje trae 6 meses históricos y 2 de pronóstico',
  base.months.filter((m) => !m.isForecast).length === 6 && base.months.filter((m) => m.isForecast).length === 2);
check('chartData tiene una fila por mes', base.chartData.length === base.months.length);
check('devuelve como máximo 10 materiales', base.products.length <= 10, `${base.products.length}`);
check('solo incluye materiales con salidas', base.products.every((p) => p.totalHistorical > 0));
check('ordenado por volumen histórico descendente',
  base.products.every((p, i) => i === 0 || base.products[i - 1].totalHistorical >= p.totalHistorical));

const s1 = base.products.find((p) => p.productCode === p1.code);
if (s1) {
  check('excluye salidas de hace 14 meses', s1.totalHistorical === 117, `total: ${s1.totalHistorical}`);
  check('el histórico tiene un valor por mes', s1.historical.length === 6);
  check('detecta la tendencia al alza', s1.trendPct > 0, `${s1.trendPct}%`);
} else {
  check('el producto de prueba aparece', false);
}

const s2 = base.products.find((p) => p.productCode === p2.code);
if (s2) check('volumen plano da tendencia cero', s2.trendPct === 0, `${s2.trendPct}%`);

console.log('\n=== Unión de las líneas en el mes de corte ===');
const filaCorte = base.chartData[5];
const filaPrimerFcst = base.chartData[6];
check('el último mes histórico también lleva valor de pronóstico',
  filaCorte['f_TOTAL'] !== null && filaCorte['f_TOTAL'] === filaCorte['h_TOTAL'],
  `h=${filaCorte['h_TOTAL']} f=${filaCorte['f_TOTAL']}`);
check('los meses de pronóstico no llevan histórico', filaPrimerFcst['h_TOTAL'] === null);
check('un mes histórico intermedio no lleva pronóstico', base.chartData[3]['f_TOTAL'] === null);

console.log('\n=== Sensibilidad ===');
const plano = buildBISeries({ sensitivity: { seasonality: 0, trendWeight: 0, safetyMargin: 0 } });
const conTendencia = buildBISeries({ sensitivity: { seasonality: 0, trendWeight: 100, safetyMargin: 0 } });
const altaTemporada = buildBISeries({ sensitivity: { seasonality: 50, trendWeight: 0, safetyMargin: 0 } });
const conColchon = buildBISeries({ sensitivity: { seasonality: 0, trendWeight: 0, safetyMargin: 50 } });

const tPlano = plano.products.find((p) => p.productCode === p1.code)?.totalForecast || 0;
const tTend = conTendencia.products.find((p) => p.productCode === p1.code)?.totalForecast || 0;
const tAlta = altaTemporada.products.find((p) => p.productCode === p1.code)?.totalForecast || 0;
const tColchon = conColchon.products.find((p) => p.productCode === p1.code)?.totalForecast || 0;

check('peso de tendencia al 100 proyecta más que el promedio plano', tTend > tPlano, `${tPlano} → ${tTend}`);
check('temporada alta aumenta la proyección', tAlta > tPlano, `${tPlano} → ${tAlta}`);
check('margen de seguridad aumenta la proyección', tColchon > tPlano, `${tPlano} → ${tColchon}`);
check('temporada alta al 50 sube cerca de la mitad',
  Math.abs(tAlta / Math.max(tPlano, 1) - 1.5) < 0.1, `factor ${(tAlta / Math.max(tPlano, 1)).toFixed(2)}`);

const historicoPlano = plano.products.find((p) => p.productCode === p1.code)?.historical.join(',');
const historicoTend = conTendencia.products.find((p) => p.productCode === p1.code)?.historical.join(',');
check('la sensibilidad NO altera el histórico', historicoPlano === historicoTend, 'las líneas continuas no cambian');

console.log('\n=== Filtros ===');
const categoriaReal = base.products[0]?.category;
const porCategoria = buildBISeries({ category: categoriaReal });
check('el filtro por categoría solo devuelve esa categoría',
  porCategoria.products.every((p) => p.category === categoriaReal), categoriaReal);
check('filtrar reduce o iguala el conteo', porCategoria.totalMatching <= base.totalMatching,
  `${base.totalMatching} → ${porCategoria.totalMatching}`);
check('registra los filtros aplicados', porCategoria.appliedFilters.category === categoriaReal);

const inexistente = buildBISeries({ category: 'CATEGORIA-QUE-NO-EXISTE' });
check('categoría inexistente devuelve vacío sin reventar', inexistente.products.length === 0);
check('el gráfico sigue teniendo filas aunque no haya series',
  inexistente.chartData.length === inexistente.months.length);

check('TODAS equivale a sin filtro', buildBISeries({ category: 'TODAS' }).totalMatching === base.totalMatching);

const almacenReal = base.warehouses[0]?.value;
if (almacenReal) {
  const porAlmacen = buildBISeries({ warehouseId: almacenReal });
  check('el filtro por almacén funciona', porAlmacen.appliedFilters.warehouseId === almacenReal,
    `${porAlmacen.totalMatching} material(es)`);
}

check('los catálogos de filtro se calculan sobre todo el inventario',
  porCategoria.categories.length === base.categories.length,
  'no se recortan al filtrar');

console.log('\n=== Valores numéricos ===');
check('ningún pronóstico es negativo', base.products.every((p) => p.forecast.every((v) => v >= 0)));
check('ningún valor es NaN',
  base.products.every((p) => [...p.historical, ...p.forecast].every((v) => Number.isFinite(v))));

console.log(`\n${fallos === 0 ? 'Todas las comprobaciones pasan' : `${fallos} comprobación(es) fallan`}.`);
process.exit(fallos === 0 ? 0 : 1);
