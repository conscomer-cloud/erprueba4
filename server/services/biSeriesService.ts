/**
 * Series comparativas de venta histórica contra demanda pronosticada.
 *
 * Alimenta la pestaña de Business Intelligence del módulo de Inteligencia
 * Predictiva: seis meses de salidas reales por producto y la proyección de los
 * meses siguientes, con filtros por categoría y almacén, y parámetros de
 * sensibilidad ajustables desde la interfaz.
 *
 * Como en el pronóstico a 60 días, los números salen del kardex. Los
 * deslizadores mueven supuestos declarados, no la aritmética.
 */

import { db } from '../db/database';

export interface SensitivityParams {
  /**
   * Ajuste por estacionalidad, de -50 a +50 por ciento. Positivo para
   * temporada alta, negativo para baja. Es un supuesto del usuario: el sistema
   * no tiene todavía suficiente historia para estimar estacionalidad solo.
   */
  seasonality: number;
  /**
   * Cuánto de la tendencia observada se traslada a la proyección, de 0 a 100
   * por ciento. En 0 la proyección es el promedio plano; en 100 aplica la
   * tendencia completa entre los dos últimos trimestres.
   */
  trendWeight: number;
  /**
   * Colchón sobre la proyección, de 0 a 50 por ciento. Sirve para planear
   * compra con margen sin alterar la cifra base.
   */
  safetyMargin: number;
}

export const DEFAULT_SENSITIVITY: SensitivityParams = {
  seasonality: 0,
  trendWeight: 60,
  safetyMargin: 0,
};

export interface MonthPoint {
  /** Clave ordenable: 2026-04 */
  key: string;
  /** Etiqueta para el eje: "abr 26" */
  label: string;
  isForecast: boolean;
}

export interface ProductSeries {
  productId: string;
  productCode: string;
  productName: string;
  category: string;
  unit: string;
  /** Salidas reales por mes, alineadas con los meses históricos. */
  historical: number[];
  /** Proyección por mes, alineada con los meses de pronóstico. */
  forecast: number[];
  totalHistorical: number;
  totalForecast: number;
  /** Variación entre el último trimestre y el anterior, en porcentaje. */
  trendPct: number;
}

export interface BISeriesResult {
  generatedAt: string;
  months: MonthPoint[];
  historicalMonths: number;
  forecastMonths: number;
  sensitivity: SensitivityParams;
  /** Filas listas para Recharts: una por mes, una llave por serie. */
  chartData: Record<string, string | number | null>[];
  products: ProductSeries[];
  /** Valores disponibles para los filtros, con su conteo. */
  categories: { value: string; count: number }[];
  warehouses: { value: string; label: string; count: number }[];
  appliedFilters: { category: string | null; warehouseId: string | null };
  /** Total de materiales antes de recortar al top N. */
  totalMatching: number;
}

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const SALIDAS = ['SALIDA', 'MERMA', 'AJUSTE_NEGATIVO', 'TRASPASO_SALIDA'];

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function claveMes(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function etiquetaMes(d: Date): string {
  return `${MESES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
}

/** Sanea los parámetros que llegan de la interfaz o de la query. */
export function normalizeSensitivity(raw: Partial<SensitivityParams> | undefined): SensitivityParams {
  const clamp = (v: unknown, min: number, max: number, def: number) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return def;
    return Math.max(min, Math.min(max, Math.round(n)));
  };
  return {
    seasonality: clamp(raw?.seasonality, -50, 50, DEFAULT_SENSITIVITY.seasonality),
    trendWeight: clamp(raw?.trendWeight, 0, 100, DEFAULT_SENSITIVITY.trendWeight),
    safetyMargin: clamp(raw?.safetyMargin, 0, 50, DEFAULT_SENSITIVITY.safetyMargin),
  };
}

export interface BISeriesOptions {
  historicalMonths?: number;
  forecastMonths?: number;
  topN?: number;
  category?: string | null;
  warehouseId?: string | null;
  sensitivity?: Partial<SensitivityParams>;
}

export function buildBISeries(options: BISeriesOptions = {}): BISeriesResult {
  const historicalMonths = Math.min(Math.max(options.historicalMonths ?? 6, 2), 24);
  const forecastMonths = Math.min(Math.max(options.forecastMonths ?? 2, 1), 12);
  const topN = Math.min(Math.max(options.topN ?? 10, 1), 30);
  const sensitivity = normalizeSensitivity(options.sensitivity);

  const productos: any[] = db.getProducts() || [];
  const movimientos: any[] = db.getMovements() || [];
  const almacenes: any[] = db.getWarehouses() || [];
  const inventario: any[] = db.getInventory() || [];

  const nombreAlmacen = new Map<string, string>(
    (almacenes || []).map((w: any) => [String(w.id), w.name || String(w.id)])
  );

  // El producto no guarda su almacén: la relación vive en la tabla de
  // inventario, y un mismo material puede estar en varios. Se arma el índice
  // producto -> almacenes para que el filtro funcione.
  const almacenesDeProducto = new Map<string, Set<string>>();
  inventario.forEach((inv: any) => {
    const pid = String(inv.product_id ?? inv.productId ?? '');
    const wid = String(inv.warehouse_id ?? inv.warehouseId ?? '');
    if (!pid || !wid) return;
    const set = almacenesDeProducto.get(pid) || new Set<string>();
    set.add(wid);
    almacenesDeProducto.set(pid, set);
  });

  // El catálogo del servidor usa category_name; el del cliente, category.
  const categoriaDe = (p: any): string =>
    p.category || p.category_name || p.categoryName || 'SIN CATEGORÍA';

  // --- Eje de meses ---
  const hoy = new Date();
  const inicioMesActual = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

  const mesesHist: MonthPoint[] = [];
  for (let i = historicalMonths - 1; i >= 0; i--) {
    const d = new Date(inicioMesActual.getFullYear(), inicioMesActual.getMonth() - i, 1);
    mesesHist.push({ key: claveMes(d), label: etiquetaMes(d), isForecast: false });
  }

  const mesesFcst: MonthPoint[] = [];
  for (let i = 1; i <= forecastMonths; i++) {
    const d = new Date(inicioMesActual.getFullYear(), inicioMesActual.getMonth() + i, 1);
    mesesFcst.push({ key: claveMes(d), label: etiquetaMes(d), isForecast: true });
  }

  const months = [...mesesHist, ...mesesFcst];
  const indiceHist = new Map(mesesHist.map((m, i) => [m.key, i]));

  // --- Filtros disponibles, calculados sobre el catálogo completo ---
  const conteoCategoria = new Map<string, number>();
  const conteoAlmacen = new Map<string, number>();
  productos.forEach((p) => {
    const cat = categoriaDe(p);
    conteoCategoria.set(cat, (conteoCategoria.get(cat) || 0) + 1);
    (almacenesDeProducto.get(String(p.id)) || new Set<string>()).forEach((wh) => {
      conteoAlmacen.set(wh, (conteoAlmacen.get(wh) || 0) + 1);
    });
  });

  // --- Aplicación de filtros ---
  const category = options.category && options.category !== 'TODAS' ? options.category : null;
  const warehouseId = options.warehouseId && options.warehouseId !== 'TODOS' ? options.warehouseId : null;

  const filtrados = productos.filter((p) => {
    if (category && categoriaDe(p) !== category) return false;
    if (warehouseId) {
      const suyos = almacenesDeProducto.get(String(p.id));
      // Sin registro de inventario el material no pertenece a ningún almacén,
      // así que no puede aparecer bajo un filtro de almacén concreto.
      if (!suyos || !suyos.has(warehouseId)) return false;
    }
    return true;
  });

  // --- Salidas por producto y mes ---
  const porProducto = new Map<string, number[]>();
  movimientos.forEach((m) => {
    const tipo = String(m.type || m.movement_type || '').toUpperCase();
    if (!SALIDAS.includes(tipo)) return;

    const ts = Date.parse(m.timestamp || m.created_at || m.createdAt || '');
    if (!Number.isFinite(ts)) return;

    const idx = indiceHist.get(claveMes(new Date(ts)));
    if (idx === undefined) return;

    const key = String(m.product_code || m.productCode || m.product_id || m.productId || '');
    if (!key) return;

    const serie = porProducto.get(key) || new Array(historicalMonths).fill(0);
    serie[idx] += Math.abs(num(m.quantity));
    porProducto.set(key, serie);
  });

  // --- Construcción de series por producto ---
  const series: ProductSeries[] = filtrados.map((p) => {
    const key = String(p.code || p.sku || p.id);
    const historical = porProducto.get(key) || porProducto.get(String(p.id)) || new Array(historicalMonths).fill(0);
    const totalHistorical = historical.reduce((s, v) => s + v, 0);

    // Tendencia: último tercio del histórico contra el anterior. Con seis meses
    // eso son dos trimestres, que es el corte que un comprador reconoce.
    const corte = Math.max(1, Math.floor(historicalMonths / 2));
    const previo = historical.slice(0, historicalMonths - corte).reduce((s, v) => s + v, 0);
    const reciente = historical.slice(historicalMonths - corte).reduce((s, v) => s + v, 0);

    let trendPct = 0;
    if (previo > 0) trendPct = ((reciente - previo) / previo) * 100;
    else if (reciente > 0) trendPct = 40;
    trendPct = Math.max(-40, Math.min(40, Math.round(trendPct)));

    // Base mensual: promedio de los meses recientes, que pesa más lo actual
    // que un promedio plano de seis meses.
    const baseMensual = corte > 0 ? reciente / corte : 0;

    const factorTendencia = 1 + (trendPct / 100) * (sensitivity.trendWeight / 100);
    const factorEstacional = 1 + sensitivity.seasonality / 100;
    const factorSeguridad = 1 + sensitivity.safetyMargin / 100;

    const forecast = mesesFcst.map((_, i) => {
      // La tendencia se compone mes a mes: si viene creciendo, el segundo mes
      // proyectado crece sobre el primero, no sobre la base.
      const proyectado = baseMensual * Math.pow(factorTendencia, i + 1) * factorEstacional * factorSeguridad;
      return Math.max(0, Math.round(proyectado));
    });

    return {
      productId: String(p.id),
      productCode: key,
      productName: p.name || key,
      category: categoriaDe(p),
      unit: p.unit || 'PZA',
      historical,
      forecast,
      totalHistorical,
      totalForecast: forecast.reduce((s, v) => s + v, 0),
      trendPct,
    };
  });

  const conMovimiento = series.filter((s) => s.totalHistorical > 0);
  const totalMatching = conMovimiento.length;
  const top = conMovimiento.sort((a, b) => b.totalHistorical - a.totalHistorical).slice(0, topN);

  // --- Filas para Recharts ---
  // Una fila por mes. Cada producto aporta dos llaves: `h_<code>` para el
  // histórico y `f_<code>` para el pronóstico. En el mes de corte ambas llevan
  // el mismo valor para que las líneas queden unidas y no se vea un salto.
  const chartData: Record<string, string | number | null>[] = months.map((mes, i) => {
    const fila: Record<string, string | number | null> = { mes: mes.label, esPronostico: mes.isForecast ? 1 : 0 };
    const idxHist = i;
    const idxFcst = i - historicalMonths;

    top.forEach((s) => {
      if (!mes.isForecast) {
        fila[`h_${s.productCode}`] = s.historical[idxHist] ?? 0;
        // Último mes histórico: se replica en la serie de pronóstico para unir.
        fila[`f_${s.productCode}`] = idxHist === historicalMonths - 1 ? s.historical[idxHist] ?? 0 : null;
      } else {
        fila[`h_${s.productCode}`] = null;
        fila[`f_${s.productCode}`] = s.forecast[idxFcst] ?? 0;
      }
    });

    // Agregado de todos los productos mostrados
    const totalH = top.reduce((sum, s) => sum + (mes.isForecast ? 0 : s.historical[idxHist] ?? 0), 0);
    const totalF = top.reduce((sum, s) => sum + (mes.isForecast ? s.forecast[idxFcst] ?? 0 : 0), 0);
    fila['h_TOTAL'] = mes.isForecast ? null : totalH;
    fila['f_TOTAL'] = mes.isForecast ? totalF : idxHist === historicalMonths - 1 ? totalH : null;

    return fila;
  });

  return {
    generatedAt: new Date().toISOString(),
    months,
    historicalMonths,
    forecastMonths,
    sensitivity,
    chartData,
    products: top,
    categories: Array.from(conteoCategoria.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count),
    warehouses: Array.from(conteoAlmacen.entries())
      .map(([value, count]) => ({ value, label: nombreAlmacen.get(value) || value, count }))
      .sort((a, b) => b.count - a.count),
    appliedFilters: { category, warehouseId },
    totalMatching,
  };
}


// ---------------------------------------------------------------------------
// Alerta temprana por capacidad de almacén
// ---------------------------------------------------------------------------

export interface CapacityAlert {
  warehouseId: string;
  warehouseName: string;
  productId: string;
  productCode: string;
  productName: string;
  unit: string;
  /** Existencia disponible hoy en ese almacén. */
  currentStock: number;
  /** Capacidad máxima configurada para el material en ese almacén. */
  capacity: number;
  /** Demanda proyectada para el horizonte. */
  projectedDemand: number;
  /** Proyección como porcentaje de la capacidad. */
  utilizationPct: number;
  severity: 'CRITICA' | 'ALTA';
  message: string;
}

export interface CapacityAlertResult {
  generatedAt: string;
  thresholdPct: number;
  horizonMonths: number;
  alerts: CapacityAlert[];
  /** Materiales revisados que tenían capacidad configurada. */
  evaluated: number;
  /** Materiales sin capacidad configurada: no se pueden evaluar. */
  withoutCapacity: number;
}

/**
 * Detecta materiales cuya demanda proyectada supera un porcentaje de la
 * capacidad de almacenamiento.
 *
 * La capacidad sale de `maximum_stock` por producto y almacén. Los materiales
 * sin ese dato no se evalúan y se reportan aparte: dar por hecha una capacidad
 * que nadie configuró produciría alertas inventadas.
 */
export function buildCapacityAlerts(thresholdPct = 85, horizonMonths = 2): CapacityAlertResult {
  const series = buildBISeries({ historicalMonths: 6, forecastMonths: horizonMonths, topN: 30 });

  const productos: any[] = db.getProducts() || [];
  const almacenes: any[] = db.getWarehouses() || [];
  const inventario: any[] = db.getInventory() || [];

  const nombreAlmacen = new Map<string, string>(
    almacenes.map((w: any) => [String(w.id), w.name || String(w.id)])
  );
  const productoPorCodigo = new Map<string, any>(
    productos.map((p: any) => [String(p.code || p.sku || p.id), p])
  );

  const alerts: CapacityAlert[] = [];
  let evaluated = 0;
  let withoutCapacity = 0;

  series.products.forEach((s) => {
    const producto = productoPorCodigo.get(s.productCode);
    if (!producto) return;

    const filas = inventario.filter((inv: any) => String(inv.product_id ?? inv.productId) === String(producto.id));
    if (filas.length === 0) return;

    filas.forEach((inv: any) => {
      const capacity = num(inv.maximum_stock ?? inv.maximumStock ?? producto.maximum_stock ?? producto.maximumStock);
      if (capacity <= 0) {
        withoutCapacity++;
        return;
      }
      evaluated++;

      const currentStock = num(inv.available_stock ?? inv.availableStock ?? inv.quantity ?? inv.stock);

      // La demanda del producto se reparte entre los almacenes que lo tienen,
      // en proporción a su existencia. Cargar la demanda completa a cada
      // almacén dispararía alertas falsas en todos ellos.
      const totalEnAlmacenes = filas.reduce(
        (acc: number, f: any) => acc + num(f.available_stock ?? f.availableStock ?? f.quantity ?? f.stock),
        0
      );
      const proporcion = totalEnAlmacenes > 0 ? currentStock / totalEnAlmacenes : 1 / filas.length;
      const projectedDemand = Math.round(s.totalForecast * proporcion);

      const utilizationPct = Math.round((projectedDemand / capacity) * 100);
      if (utilizationPct < thresholdPct) return;

      const warehouseId = String(inv.warehouse_id ?? inv.warehouseId ?? '');
      alerts.push({
        warehouseId,
        warehouseName: nombreAlmacen.get(warehouseId) || warehouseId || 'Sin almacén',
        productId: String(producto.id),
        productCode: s.productCode,
        productName: s.productName,
        unit: s.unit,
        currentStock,
        capacity,
        projectedDemand,
        utilizationPct,
        severity: utilizationPct >= 100 ? 'CRITICA' : 'ALTA',
        message:
          utilizationPct >= 100
            ? `La demanda proyectada (${projectedDemand} ${s.unit}) supera la capacidad de ${capacity} ${s.unit}. No cabe la reposición completa.`
            : `La demanda proyectada ocupa el ${utilizationPct} por ciento de la capacidad de ${capacity} ${s.unit}.`,
      });
    });
  });

  alerts.sort((a, b) => b.utilizationPct - a.utilizationPct);

  return {
    generatedAt: new Date().toISOString(),
    thresholdPct,
    horizonMonths,
    alerts,
    evaluated,
    withoutCapacity,
  };
}
