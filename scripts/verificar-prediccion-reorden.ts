/**
 * Verifica el cálculo del pronóstico de demanda y las alertas de reorden.
 *
 *   npx tsx scripts/verificar-prediccion-reorden.ts
 */

import { buildStatisticalForecast } from '../server/services/demandForecastService';
import { db } from '../server/db/database';
import { calculateProductReorderStatus } from '../src/services/purchasesService';

let fallos = 0;
const check = (nombre: string, ok: boolean, detalle = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FALLA'} ${nombre}${detalle ? ` — ${detalle}` : ''}`);
  if (!ok) fallos++;
};

const hace = (dias: number) => {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString();
};

// --- Se inyectan movimientos controlados sobre el catálogo sembrado ---
const productos = db.getProducts();
const movimientos: any[] = db.getMovements();

if (productos.length < 2) {
  console.error('El catálogo sembrado no tiene suficientes productos para la prueba.');
  process.exit(1);
}

const p1: any = productos[0];
const p2: any = productos[1];

// p1: salidas repartidas en 12 días → confianza ALTA, con alza en la 2a quincena
for (let i = 0; i < 12; i++) {
  movimientos.push({
    product_code: p1.code,
    type: 'SALIDA',
    quantity: i < 6 ? 5 : 9,
    timestamp: hace(i < 6 ? 25 - i : 12 - (i - 6)),
  });
}

// p2: todo el volumen en un solo día → confianza BAJA
movimientos.push({ product_code: p2.code, type: 'SALIDA', quantity: 300, timestamp: hace(5) });

// Fuera de ventana: no debe contarse
movimientos.push({ product_code: p1.code, type: 'SALIDA', quantity: 9999, timestamp: hace(200) });

// Tipo que no es salida: tampoco cuenta
movimientos.push({ product_code: p1.code, type: 'ENTRADA', quantity: 500, timestamp: hace(3) });

console.log('\n=== Pronóstico de demanda ===');
const forecasts = buildStatisticalForecast(30, 60, 5);

check('devuelve como máximo 5 materiales', forecasts.length <= 5, `${forecasts.length}`);
check('solo incluye materiales con salidas', forecasts.every((f) => f.exits30d > 0));
check('ordenado por rotación descendente',
  forecasts.every((f, i) => i === 0 || forecasts[i - 1].turnover >= f.turnover));

const f1 = forecasts.find((f) => f.productCode === p1.code);
if (f1) {
  check('excluye el movimiento de hace 200 días', f1.exits30d === 84, `salidas: ${f1.exits30d}`);
  check('ignora las ENTRADAS al contar salidas', f1.exits30d < 500);
  check('detecta la tendencia al alza', f1.trendPct > 0, `${f1.trendPct}%`);
  check('la tendencia está acotada a 40 por ciento', Math.abs(f1.trendPct) <= 40, `${f1.trendPct}%`);
  check('confianza ALTA con 12 días de movimiento', f1.confidence === 'ALTA', f1.confidence);
  check('el ajuste difiere de la base cuando hay tendencia',
    f1.adjustedForecast60d !== f1.baselineForecast60d,
    `base ${f1.baselineForecast60d} vs ajustado ${f1.adjustedForecast60d}`);
} else {
  check('el producto de prueba aparece en el pronóstico', false, 'no encontrado');
}

const f2 = forecasts.find((f) => f.productCode === p2.code);
if (f2) {
  check('confianza BAJA con un solo día de movimiento', f2.confidence === 'BAJA', f2.confidence);
}

check('ningún valor es NaN o infinito',
  forecasts.every((f) =>
    [f.dailyAverage, f.turnover, f.baselineForecast60d, f.adjustedForecast60d, f.coverageDays, f.projectedShortfall]
      .every((v) => Number.isFinite(v))));
check('el faltante nunca es negativo', forecasts.every((f) => f.projectedShortfall >= 0));

console.log('\n=== Alertas de punto de reorden ===');
const analisis = productos.map((p: any) => calculateProductReorderStatus(p, [], undefined, [], []));
const enRiesgo = analisis.filter((a) => a.isRiskOfStockout);

check('el análisis corre sobre todo el catálogo', analisis.length === productos.length);
check('el punto de reorden nunca es negativo', analisis.every((a) => a.reorderPoint >= 0));
check('la cantidad sugerida nunca es negativa', analisis.every((a) => a.suggestedPurchaseQuantity >= 0));
check('ningún cálculo produce NaN',
  analisis.every((a) => Number.isFinite(a.reorderPoint) && Number.isFinite(a.daysOfInventoryLeft)));
check('todo lo marcado en riesgo trae cantidad sugerida',
  enRiesgo.every((a) => a.suggestedPurchaseQuantity > 0),
  `${enRiesgo.length} en riesgo`);

// Caso límite: producto en cero absoluto
const enCero: any = { ...productos[0], stock: 0, physicalStock: 0, availableStock: 0, reservedStock: 0 };
const aCero = calculateProductReorderStatus(enCero, [], undefined, [], []);
check('stock en cero se marca en riesgo', aCero.isRiskOfStockout);
check('stock en cero no produce división por cero',
  Number.isFinite(aCero.daysOfInventoryLeft), `${aCero.daysOfInventoryLeft}`);

console.log(`\n${fallos === 0 ? 'Todas las comprobaciones pasan' : `${fallos} comprobación(es) fallan`}.`);
process.exit(fallos === 0 ? 0 : 1);
