/**
 * Historial de pronósticos y su contraste con la realidad observada.
 *
 * Hay una dificultad de origen que conviene tener presente: hasta ahora el
 * sistema nunca guardó un pronóstico. Sin registros previos no existe nada que
 * comparar, y la sección arrancaría vacía durante meses.
 *
 * Por eso el historial tiene dos orígenes, siempre distinguidos:
 *
 *   GUARDADO       Pronóstico que alguien generó y quedó registrado con su
 *                  fecha. Es evidencia real de lo que el sistema dijo.
 *
 *   RETROSPECTIVO  Reconstrucción: se corre el modelo con corte en un mes
 *                  pasado, usando únicamente los movimientos disponibles hasta
 *                  esa fecha, y se compara contra lo que efectivamente ocurrió.
 *                  No es lo que se predijo, es lo que el modelo habría
 *                  predicho. Sirve para medir al modelo, no para acreditar
 *                  aciertos pasados.
 *
 * Mezclar ambos sin distinguirlos convertiría la sección en una forma elegante
 * de darse la razón solo.
 */

import { db } from '../db/database';

export type SnapshotOrigin = 'GUARDADO' | 'RETROSPECTIVO';

export interface ForecastSnapshot {
  id: string;
  /** Mes al que corresponde la predicción: 2026-07 */
  targetMonth: string;
  /** Fecha en que se generó (o el corte simulado, en los retrospectivos). */
  generatedAt: string;
  origin: SnapshotOrigin;
  sensitivity?: { seasonality: number; trendWeight: number; safetyMargin: number };
  items: {
    productId: string;
    productCode: string;
    productName: string;
    unit: string;
    predicted: number;
  }[];
}

export interface EvaluatedItem {
  productCode: string;
  productName: string;
  unit: string;
  predicted: number;
  actual: number;
  /** Diferencia absoluta: pronóstico menos real. */
  deviation: number;
  /** Error porcentual absoluto. null cuando el mes real fue cero. */
  errorPct: number | null;
  /** Positivo si el modelo se pasó, negativo si se quedó corto. */
  biasPct: number | null;
}

export interface EvaluatedForecast {
  id: string;
  targetMonth: string;
  targetLabel: string;
  generatedAt: string;
  origin: SnapshotOrigin;
  items: EvaluatedItem[];
  totalPredicted: number;
  totalActual: number;
  /** Error absoluto medio en porcentaje sobre los materiales evaluables. */
  mape: number | null;
  /** Sesgo medio: positivo indica sobreestimación sistemática. */
  bias: number | null;
  /** Proporción de materiales dentro de un margen del 20 por ciento. */
  hitRate: number | null;
  evaluableCount: number;
}

export interface ForecastHistoryResult {
  generatedAt: string;
  entries: EvaluatedForecast[];
  savedCount: number;
  backtestCount: number;
  /** Resumen del desempeño sobre los meses evaluados. */
  summary: {
    mape: number | null;
    bias: number | null;
    hitRate: number | null;
    monthsEvaluated: number;
    /** Lectura en lenguaje llano del sesgo observado. */
    reading: string;
  };
  notice?: string;
}

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const SALIDAS = ['SALIDA', 'MERMA', 'AJUSTE_NEGATIVO', 'TRASPASO_SALIDA'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const claveMes = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const etiquetaMes = (clave: string) => {
  const [y, m] = clave.split('-').map(Number);
  return `${MESES[(m || 1) - 1]} ${String(y).slice(2)}`;
};

/** Salidas reales por producto y mes, sobre todo el kardex. */
function salidasPorMes(): Map<string, Map<string, number>> {
  const out = new Map<string, Map<string, number>>();
  (db.getMovements() || []).forEach((m: any) => {
    const tipo = String(m.type || m.movement_type || '').toUpperCase();
    if (!SALIDAS.includes(tipo)) return;
    const ts = Date.parse(m.timestamp || m.created_at || m.createdAt || '');
    if (!Number.isFinite(ts)) return;
    const key = String(m.product_code || m.productCode || m.product_id || m.productId || '');
    if (!key) return;

    const mes = claveMes(new Date(ts));
    const porProducto = out.get(key) || new Map<string, number>();
    porProducto.set(mes, (porProducto.get(mes) || 0) + Math.abs(num(m.quantity)));
    out.set(key, porProducto);
  });
  return out;
}

// ---------------------------------------------------------------------------
// Persistencia de pronósticos generados
// ---------------------------------------------------------------------------

function getStore(): ForecastSnapshot[] {
  const schema = db.getSchema() as any;
  if (!Array.isArray(schema.forecast_snapshots)) {
    schema.forecast_snapshots = [];
  }
  return schema.forecast_snapshots;
}

/**
 * Registra un pronóstico para poder contrastarlo después.
 *
 * Un pronóstico por mes objetivo: si se regenera dentro del mismo mes, se
 * reemplaza. Guardar cada clic produciría decenas de registros del mismo día
 * y volvería ilegible el historial.
 */
export function saveForecastSnapshot(input: {
  targetMonth?: string;
  sensitivity?: ForecastSnapshot['sensitivity'];
  items: ForecastSnapshot['items'];
}): ForecastSnapshot | null {
  if (!input.items || input.items.length === 0) return null;

  const ahora = new Date();
  const siguiente = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1);
  const targetMonth = input.targetMonth || claveMes(siguiente);

  const store = getStore();
  const snapshot: ForecastSnapshot = {
    id: `FCS-${targetMonth}-${Date.now().toString(36).toUpperCase()}`,
    targetMonth,
    generatedAt: ahora.toISOString(),
    origin: 'GUARDADO',
    sensitivity: input.sensitivity,
    items: input.items,
  };

  const idx = store.findIndex((s) => s.targetMonth === targetMonth && s.origin === 'GUARDADO');
  if (idx >= 0) store[idx] = snapshot;
  else store.push(snapshot);

  // Se conservan los 24 más recientes: el historial es para revisar tendencia,
  // no para archivar indefinidamente en un archivo JSON.
  store.sort((a, b) => a.targetMonth.localeCompare(b.targetMonth));
  if (store.length > 24) store.splice(0, store.length - 24);

  db.persist();
  return snapshot;
}

// ---------------------------------------------------------------------------
// Reconstrucción retrospectiva
// ---------------------------------------------------------------------------

/**
 * Reconstruye qué habría proyectado el modelo para un mes, usando solo los
 * movimientos anteriores a ese mes.
 *
 * El corte es lo que hace válida la medición: si el cálculo viera los datos del
 * mes que intenta predecir, acertaría siempre y no mediría nada.
 */
function backtestMonth(
  targetMonth: string,
  historial: Map<string, Map<string, number>>,
  ventanaMeses: number,
  topN: number
): ForecastSnapshot {
  const [ty, tm] = targetMonth.split('-').map(Number);
  const inicioObjetivo = new Date(ty, (tm || 1) - 1, 1);

  // Meses disponibles antes del objetivo
  const previos: string[] = [];
  for (let i = ventanaMeses; i >= 1; i--) {
    const d = new Date(inicioObjetivo.getFullYear(), inicioObjetivo.getMonth() - i, 1);
    previos.push(claveMes(d));
  }

  const productos: any[] = db.getProducts() || [];
  const nombre = new Map(productos.map((p: any) => [String(p.code || p.sku || p.id), p]));

  const filas = Array.from(historial.entries())
    .map(([code, porMes]) => {
      const serie = previos.map((m) => porMes.get(m) || 0);
      const total = serie.reduce((s, v) => s + v, 0);

      const corte = Math.max(1, Math.floor(ventanaMeses / 2));
      const previo = serie.slice(0, ventanaMeses - corte).reduce((s, v) => s + v, 0);
      const reciente = serie.slice(ventanaMeses - corte).reduce((s, v) => s + v, 0);

      let trendPct = 0;
      if (previo > 0) trendPct = ((reciente - previo) / previo) * 100;
      else if (reciente > 0) trendPct = 40;
      trendPct = Math.max(-40, Math.min(40, trendPct));

      const baseMensual = corte > 0 ? reciente / corte : 0;
      // Se usa el peso de tendencia por defecto (60%), que es la configuración
      // con la que se entrega el módulo.
      const predicted = Math.max(0, Math.round(baseMensual * (1 + (trendPct / 100) * 0.6)));

      const p: any = nombre.get(code);
      return {
        productId: String(p?.id || code),
        productCode: code,
        productName: p?.name || code,
        unit: p?.unit || 'PZA',
        predicted,
        _total: total,
      };
    })
    .filter((f) => f._total > 0)
    .sort((a, b) => b._total - a._total)
    .slice(0, topN)
    .map(({ _total, ...rest }) => rest);

  return {
    id: `BT-${targetMonth}`,
    targetMonth,
    generatedAt: new Date(inicioObjetivo.getFullYear(), inicioObjetivo.getMonth(), 1).toISOString(),
    origin: 'RETROSPECTIVO',
    items: filas,
  };
}

// ---------------------------------------------------------------------------
// Evaluación
// ---------------------------------------------------------------------------

function evaluar(snapshot: ForecastSnapshot, historial: Map<string, Map<string, number>>): EvaluatedForecast {
  const items: EvaluatedItem[] = snapshot.items.map((it) => {
    const actual = historial.get(it.productCode)?.get(snapshot.targetMonth) || 0;
    const deviation = it.predicted - actual;

    // Con demanda real en cero el error porcentual no está definido: dividir
    // entre cero daría infinito y contaminaría el promedio.
    const errorPct = actual > 0 ? Math.abs(deviation / actual) * 100 : null;
    const biasPct = actual > 0 ? (deviation / actual) * 100 : null;

    return {
      productCode: it.productCode,
      productName: it.productName,
      unit: it.unit,
      predicted: it.predicted,
      actual,
      deviation,
      errorPct: errorPct === null ? null : Math.round(errorPct),
      biasPct: biasPct === null ? null : Math.round(biasPct),
    };
  });

  const evaluables = items.filter((i) => i.errorPct !== null);
  const mape = evaluables.length
    ? Math.round(evaluables.reduce((s, i) => s + (i.errorPct as number), 0) / evaluables.length)
    : null;
  const bias = evaluables.length
    ? Math.round(evaluables.reduce((s, i) => s + (i.biasPct as number), 0) / evaluables.length)
    : null;
  const dentro = evaluables.filter((i) => (i.errorPct as number) <= 20).length;
  const hitRate = evaluables.length ? Math.round((dentro / evaluables.length) * 100) : null;

  return {
    id: snapshot.id,
    targetMonth: snapshot.targetMonth,
    targetLabel: etiquetaMes(snapshot.targetMonth),
    generatedAt: snapshot.generatedAt,
    origin: snapshot.origin,
    items,
    totalPredicted: items.reduce((s, i) => s + i.predicted, 0),
    totalActual: items.reduce((s, i) => s + i.actual, 0),
    mape,
    bias,
    hitRate,
    evaluableCount: evaluables.length,
  };
}

function lecturaDelSesgo(bias: number | null, mape: number | null, meses: number): string {
  if (meses === 0 || bias === null || mape === null) {
    return 'Todavía no hay meses cerrados con demanda real que permitan medir la precisión del modelo.';
  }

  const partes: string[] = [];

  if (Math.abs(bias) < 10) {
    partes.push('El modelo no muestra un sesgo claro: se equivoca en ambas direcciones por igual.');
  } else if (bias > 0) {
    partes.push(
      `El modelo sobreestima de forma sistemática, en promedio ${bias} por ciento por encima de la demanda real. Comprar con esas cifras sin ajustar lleva a inventario ocioso.`
    );
  } else {
    partes.push(
      `El modelo subestima de forma sistemática, en promedio ${Math.abs(bias)} por ciento por debajo de la demanda real. Es el sesgo que produce desabasto.`
    );
  }

  if (mape > 50) {
    partes.push(
      `El error absoluto medio es de ${mape} por ciento sobre ${meses} mes(es): demasiado alto para tomar decisiones de compra directamente. Conviene usar el pronóstico como referencia y contrastarlo con la cartera de obras.`
    );
  } else if (mape > 25) {
    partes.push(`Con ${mape} por ciento de error medio, el pronóstico orienta la tendencia pero no la cantidad exacta.`);
  } else {
    partes.push(`Con ${mape} por ciento de error medio sobre ${meses} mes(es), la proyección es razonablemente confiable.`);
  }

  return partes.join(' ');
}

export interface HistoryOptions {
  /** Meses hacia atrás a reconstruir. */
  monthsBack?: number;
  /** Ventana de historia que usa cada reconstrucción. */
  windowMonths?: number;
  topN?: number;
  /** Incluye reconstrucciones además de los pronósticos guardados. */
  includeBacktest?: boolean;
}

export function buildForecastHistory(options: HistoryOptions = {}): ForecastHistoryResult {
  const monthsBack = Math.min(Math.max(options.monthsBack ?? 6, 1), 12);
  const windowMonths = Math.min(Math.max(options.windowMonths ?? 4, 2), 12);
  const topN = Math.min(Math.max(options.topN ?? 5, 1), 20);
  const includeBacktest = options.includeBacktest !== false;

  const historial = salidasPorMes();
  const hoy = new Date();
  const inicioMesActual = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

  // Solo se evalúan meses cerrados: el mes en curso todavía está acumulando
  // salidas y compararlo daría un error inflado por definición.
  const mesesObjetivo: string[] = [];
  for (let i = monthsBack; i >= 1; i--) {
    const d = new Date(inicioMesActual.getFullYear(), inicioMesActual.getMonth() - i, 1);
    mesesObjetivo.push(claveMes(d));
  }

  const guardados = getStore().filter((s) => mesesObjetivo.includes(s.targetMonth));
  const mesesConGuardado = new Set(guardados.map((s) => s.targetMonth));

  const reconstruidos = includeBacktest
    ? mesesObjetivo
        .filter((m) => !mesesConGuardado.has(m))
        .map((m) => backtestMonth(m, historial, windowMonths, topN))
        .filter((s) => s.items.length > 0)
    : [];

  const entries = [...guardados, ...reconstruidos]
    .map((s) => evaluar(s, historial))
    .filter((e) => e.items.length > 0)
    .sort((a, b) => b.targetMonth.localeCompare(a.targetMonth));

  const conDatos = entries.filter((e) => e.mape !== null);
  const mape = conDatos.length
    ? Math.round(conDatos.reduce((s, e) => s + (e.mape as number), 0) / conDatos.length)
    : null;
  const bias = conDatos.length
    ? Math.round(conDatos.reduce((s, e) => s + (e.bias as number), 0) / conDatos.length)
    : null;
  const hitRate = conDatos.length
    ? Math.round(conDatos.reduce((s, e) => s + (e.hitRate as number), 0) / conDatos.length)
    : null;

  const savedCount = entries.filter((e) => e.origin === 'GUARDADO').length;
  const backtestCount = entries.filter((e) => e.origin === 'RETROSPECTIVO').length;

  let notice: string | undefined;
  if (savedCount === 0 && backtestCount > 0) {
    notice =
      'Todavía no hay pronósticos guardados de meses anteriores: el sistema empezó a registrarlos apenas. Lo que se muestra son reconstrucciones, es decir, lo que el modelo habría proyectado con los datos disponibles en cada corte. Conforme se generen pronósticos, el historial se irá llenando con registros reales.';
  } else if (savedCount === 0 && backtestCount === 0) {
    notice =
      'No hay pronósticos guardados ni movimientos suficientes en el kardex para reconstruir meses anteriores.';
  }

  return {
    generatedAt: new Date().toISOString(),
    entries,
    savedCount,
    backtestCount,
    summary: {
      mape,
      bias,
      hitRate,
      monthsEvaluated: conDatos.length,
      reading: lecturaDelSesgo(bias, mape, conDatos.length),
    },
    notice,
  };
}
