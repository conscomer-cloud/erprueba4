/**
 * Verifica el historial de pronósticos.
 *
 *   npx tsx scripts/verificar-historial-pronosticos.ts
 */

import { buildForecastHistory, saveForecastSnapshot } from '../server/services/forecastHistoryService';
import { db } from '../server/db/database';

let fallos = 0;
const check = (nombre: string, ok: boolean, detalle = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FALLA'} ${nombre}${detalle ? ` — ${detalle}` : ''}`);
  if (!ok) fallos++;
};

const claveMes = (offset: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() - offset, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const enMes = (offset: number, dia = 12) => {
  const d = new Date();
  d.setMonth(d.getMonth() - offset, dia);
  return d.toISOString();
};

const productos: any[] = db.getProducts();
const movimientos: any[] = db.getMovements();
const p1 = productos[0];
const p2 = productos[1];

// Seis meses de salidas estables para p1 (100/mes) y crecientes para p2
for (let m = 6; m >= 1; m--) {
  movimientos.push({ product_code: p1.code, type: 'SALIDA', quantity: 100, timestamp: enMes(m) });
  movimientos.push({ product_code: p2.code, type: 'SALIDA', quantity: 20 * (7 - m), timestamp: enMes(m) });
}

console.log('\n=== Reconstrucción retrospectiva ===');
const h = buildForecastHistory({ monthsBack: 4, windowMonths: 4, topN: 5 });

check('genera entradas evaluables', h.entries.length > 0, `${h.entries.length} mes(es)`);
check('todas son retrospectivas al inicio', h.savedCount === 0 && h.backtestCount > 0,
  `guardados: ${h.savedCount}, retrospectivos: ${h.backtestCount}`);
check('avisa que aún no hay pronósticos guardados', !!h.notice);
check('ordenadas del mes más reciente al más antiguo',
  h.entries.every((e, i) => i === 0 || h.entries[i - 1].targetMonth >= e.targetMonth));

const mesActual = claveMes(0);
check('NO evalúa el mes en curso', h.entries.every((e) => e.targetMonth !== mesActual), `mes actual: ${mesActual}`);

console.log('\n=== Precisión del cálculo ===');
const reciente = h.entries[0];
const itemP1 = reciente?.items.find((i) => i.productCode === p1.code);
if (itemP1) {
  check('demanda estable se predice con error bajo', (itemP1.errorPct ?? 999) <= 20,
    `proyectado ${itemP1.predicted} vs real ${itemP1.actual} = ${itemP1.errorPct}%`);
  check('la diferencia cuadra con proyectado menos real',
    itemP1.deviation === itemP1.predicted - itemP1.actual);
}

const itemP2 = reciente?.items.find((i) => i.productCode === p2.code);
if (itemP2) {
  check('demanda creciente se subestima (sesgo negativo esperado)',
    (itemP2.biasPct ?? 0) <= 0, `sesgo ${itemP2.biasPct}%`);
}

check('el error nunca es infinito',
  h.entries.every((e) => e.items.every((i) => i.errorPct === null || Number.isFinite(i.errorPct))));
check('los materiales sin demanda real dan error nulo, no cero',
  h.entries.every((e) => e.items.every((i) => (i.actual === 0 ? i.errorPct === null : true))));
check('MAPE calculado solo sobre evaluables',
  h.entries.every((e) => (e.evaluableCount === 0 ? e.mape === null : e.mape !== null)));
check('hit rate entre 0 y 100',
  h.entries.every((e) => e.hitRate === null || (e.hitRate >= 0 && e.hitRate <= 100)));

console.log('\n=== El corte impide ver el futuro ===');
// Si el backtest viera el mes que predice, acertaría perfecto. Un error de
// exactamente 0% en un producto con demanda variable delataría fuga de datos.
const p2Errores = h.entries.map((e) => e.items.find((i) => i.productCode === p2.code)?.errorPct).filter((v) => v != null);
check('no acierta al 100% en demanda creciente (sin fuga de datos)',
  p2Errores.some((v) => (v as number) > 0), `errores: ${p2Errores.join(', ')}%`);

console.log('\n=== Pronósticos guardados ===');
const target = claveMes(1);
const snap = saveForecastSnapshot({
  targetMonth: target,
  items: [{ productId: p1.id, productCode: p1.code, productName: p1.name, unit: p1.unit || 'PZA', predicted: 100 }],
});
check('el pronóstico se guarda', !!snap && snap.origin === 'GUARDADO');

const h2 = buildForecastHistory({ monthsBack: 4, windowMonths: 4, topN: 5 });
check('el guardado aparece en el historial', h2.savedCount === 1, `${h2.savedCount}`);
check('el guardado reemplaza al retrospectivo del mismo mes',
  h2.entries.filter((e) => e.targetMonth === target).length === 1,
  'sin duplicar el mes');
check('el guardado se evalúa contra la realidad',
  (h2.entries.find((e) => e.targetMonth === target)?.totalActual ?? 0) > 0);

// Regenerar en el mismo mes no debe acumular registros
saveForecastSnapshot({
  targetMonth: target,
  items: [{ productId: p1.id, productCode: p1.code, productName: p1.name, unit: p1.unit || 'PZA', predicted: 120 }],
});
const h3 = buildForecastHistory({ monthsBack: 4, windowMonths: 4, topN: 5 });
check('regenerar reemplaza, no acumula', h3.savedCount === 1, `${h3.savedCount}`);
check('conserva el valor más reciente',
  h3.entries.find((e) => e.targetMonth === target)?.totalPredicted === 120);

check('guardar sin partidas no crea registro', saveForecastSnapshot({ items: [] }) === null);

console.log('\n=== Resumen ===');
check('el resumen trae una lectura en texto', (h3.summary.reading || '').length > 40);
check('meses evaluados coincide con las entradas con MAPE',
  h3.summary.monthsEvaluated === h3.entries.filter((e) => e.mape !== null).length);

console.log(`\n${fallos === 0 ? 'Todas las comprobaciones pasan' : `${fallos} comprobación(es) fallan`}.`);
process.exit(fallos === 0 ? 0 : 1);
