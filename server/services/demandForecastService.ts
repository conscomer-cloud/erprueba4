/**
 * Pronóstico de demanda para el módulo de Inteligencia Predictiva.
 *
 * Analiza la rotación de los últimos 30 días y proyecta la demanda de los
 * próximos 60 para los 5 materiales de mayor rotación.
 *
 * El cálculo numérico se hace aquí, no en el modelo. Gemini aporta la lectura
 * del contexto —estacionalidad, riesgo de desabasto, qué hacer con el
 * resultado— pero las cifras salen del kardex. Pedirle a un modelo de lenguaje
 * que multiplique y divida es la forma más rápida de terminar comprando
 * material con base en un número inventado.
 *
 * Si GEMINI_API_KEY no está configurada, el pronóstico estadístico se entrega
 * igual y se marca la fuente como 'estadistico'.
 */

import { GoogleGenAI } from '@google/genai';
import { db } from '../db/database';

export interface ProductForecast {
  productId: string;
  productCode: string;
  productName: string;
  unit: string;
  /** Salidas registradas en la ventana de 30 días. */
  exits30d: number;
  /** Promedio diario observado. */
  dailyAverage: number;
  /** Rotación: salidas del periodo entre existencia disponible. */
  turnover: number;
  currentStock: number;
  /** Proyección base a 60 días, sin ajuste. */
  baselineForecast60d: number;
  /** Proyección con ajuste por tendencia (segunda quincena contra primera). */
  adjustedForecast60d: number;
  /** Variación entre quincenas, en porcentaje. */
  trendPct: number;
  /** Días de cobertura con la existencia actual al ritmo proyectado. */
  coverageDays: number;
  /** Faltante proyectado a 60 días. Cero si la existencia alcanza. */
  projectedShortfall: number;
  /** Qué tan confiable es la proyección según los datos disponibles. */
  confidence: 'ALTA' | 'MEDIA' | 'BAJA';
  confidenceReason: string;
}

export interface DemandForecastResult {
  generatedAt: string;
  windowDays: number;
  horizonDays: number;
  forecasts: ProductForecast[];
  /** Lectura ejecutiva del pronóstico. */
  analysis: string;
  source: 'gemini' | 'estadistico';
  /** Se llena cuando el modelo no estaba disponible. */
  notice?: string;
}

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const SALIDAS = ['SALIDA', 'MERMA', 'AJUSTE_NEGATIVO', 'TRASPASO_SALIDA'];

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;
  return new GoogleGenAI({ apiKey });
}

/**
 * Construye el pronóstico estadístico a partir del kardex.
 *
 * El ajuste por tendencia compara la segunda quincena contra la primera y se
 * limita a ±40%. Sin ese tope, un material con dos salidas grandes al final
 * del mes proyecta un crecimiento absurdo a 60 días.
 */
export function buildStatisticalForecast(windowDays = 30, horizonDays = 60, topN = 5): ProductForecast[] {
  const productos = db.getProducts();
  const movimientos = db.getMovements();

  const ahora = Date.now();
  const desde = ahora - windowDays * 86400000;
  const medio = ahora - (windowDays / 2) * 86400000;

  const acum = new Map<string, { total: number; primera: number; segunda: number; dias: Set<string> }>();

  (movimientos || []).forEach((m: any) => {
    const tipo = String(m.type || m.movement_type || '').toUpperCase();
    if (!SALIDAS.includes(tipo)) return;

    const ts = Date.parse(m.timestamp || m.created_at || m.createdAt || '');
    if (!Number.isFinite(ts) || ts < desde) return;

    const key = String(m.product_code || m.productCode || m.product_id || m.productId || '');
    if (!key) return;

    const reg = acum.get(key) || { total: 0, primera: 0, segunda: 0, dias: new Set<string>() };
    const qty = Math.abs(num(m.quantity));
    reg.total += qty;
    if (ts >= medio) reg.segunda += qty;
    else reg.primera += qty;
    reg.dias.add(new Date(ts).toISOString().slice(0, 10));
    acum.set(key, reg);
  });

  const filas: ProductForecast[] = (productos || [])
    .map((p: any) => {
      const key = String(p.code || p.sku || p.id);
      const reg = acum.get(key) || acum.get(String(p.id)) || { total: 0, primera: 0, segunda: 0, dias: new Set<string>() };
      const stock = num(p.available_stock ?? p.availableStock ?? p.stock);
      const dailyAverage = reg.total / windowDays;
      const turnover = stock > 0 ? reg.total / stock : 0;

      // Tendencia: segunda quincena contra primera, acotada a ±40%.
      let trendPct = 0;
      if (reg.primera > 0) {
        trendPct = ((reg.segunda - reg.primera) / reg.primera) * 100;
      } else if (reg.segunda > 0) {
        trendPct = 40;
      }
      trendPct = Math.max(-40, Math.min(40, Math.round(trendPct)));

      const baselineForecast60d = Math.round(dailyAverage * horizonDays);
      const adjustedForecast60d = Math.max(0, Math.round(baselineForecast60d * (1 + trendPct / 100)));

      const coverageDays = dailyAverage > 0 ? Math.round(stock / dailyAverage) : 0;
      const projectedShortfall = Math.max(0, adjustedForecast60d - stock);

      // La confianza depende de en cuántos días distintos hubo salidas: un
      // material con todo el volumen concentrado en un solo día no permite
      // proyectar un ritmo.
      const diasConMovimiento = reg.dias.size;
      let confidence: ProductForecast['confidence'] = 'BAJA';
      let confidenceReason = '';
      if (diasConMovimiento >= 8) {
        confidence = 'ALTA';
        confidenceReason = `Salidas distribuidas en ${diasConMovimiento} días del periodo.`;
      } else if (diasConMovimiento >= 4) {
        confidence = 'MEDIA';
        confidenceReason = `Solo ${diasConMovimiento} días con movimiento; la proyección es indicativa.`;
      } else {
        confidenceReason = `Únicamente ${diasConMovimiento} día(s) con salidas: insuficiente para proyectar un ritmo estable.`;
      }

      return {
        productId: String(p.id),
        productCode: key,
        productName: p.name || key,
        unit: p.unit || 'PZA',
        exits30d: reg.total,
        dailyAverage: Math.round(dailyAverage * 100) / 100,
        turnover: Math.round(turnover * 100) / 100,
        currentStock: stock,
        baselineForecast60d,
        adjustedForecast60d,
        trendPct,
        coverageDays,
        projectedShortfall,
        confidence,
        confidenceReason,
      };
    })
    .filter((f) => f.exits30d > 0)
    .sort((a, b) => b.turnover - a.turnover)
    .slice(0, topN);

  return filas;
}

/** Lectura ejecutiva sin modelo, cuando Gemini no está disponible. */
function buildLocalAnalysis(forecasts: ProductForecast[], horizonDays: number): string {
  if (forecasts.length === 0) {
    return 'No hay salidas registradas en los últimos 30 días, así que no es posible proyectar demanda. Verifica que el kardex esté recibiendo movimientos.';
  }

  const conFaltante = forecasts.filter((f) => f.projectedShortfall > 0);
  const bajaConfianza = forecasts.filter((f) => f.confidence === 'BAJA');

  const partes: string[] = [];
  partes.push(
    `Los ${forecasts.length} materiales de mayor rotación concentran ${forecasts.reduce((s, f) => s + f.exits30d, 0).toLocaleString('es-MX')} unidades de salida en 30 días.`
  );

  if (conFaltante.length > 0) {
    const lista = conFaltante
      .map((f) => `${f.productCode} (faltarían ${f.projectedShortfall.toLocaleString('es-MX')} ${f.unit})`)
      .join(', ');
    partes.push(
      `La existencia actual no cubre el horizonte de ${horizonDays} días en ${conFaltante.length} de ellos: ${lista}. Conviene revisar el punto de reorden y los tiempos de entrega del proveedor antes de comprometer pedidos.`
    );
  } else {
    partes.push(`La existencia actual cubre la demanda proyectada a ${horizonDays} días en los cinco materiales.`);
  }

  const enAlza = forecasts.filter((f) => f.trendPct >= 15);
  if (enAlza.length > 0) {
    partes.push(
      `Con tendencia al alza en la segunda quincena: ${enAlza.map((f) => `${f.productCode} (+${f.trendPct}%)`).join(', ')}.`
    );
  }

  if (bajaConfianza.length > 0) {
    partes.push(
      `Tomar con reserva ${bajaConfianza.map((f) => f.productCode).join(', ')}: las salidas se concentran en muy pocos días y la proyección no representa un ritmo sostenido.`
    );
  }

  return partes.join(' ');
}

/**
 * Genera el pronóstico completo. El cálculo siempre corre; el modelo solo
 * interpreta el resultado.
 */
export async function generateDemandForecast(
  windowDays = 30,
  horizonDays = 60,
  topN = 5
): Promise<DemandForecastResult> {
  const forecasts = buildStatisticalForecast(windowDays, horizonDays, topN);
  const generatedAt = new Date().toISOString();
  const ai = getGeminiClient();

  if (!ai) {
    return {
      generatedAt,
      windowDays,
      horizonDays,
      forecasts,
      analysis: buildLocalAnalysis(forecasts, horizonDays),
      source: 'estadistico',
      notice:
        'GEMINI_API_KEY no está configurada. El pronóstico numérico se calculó igual desde el kardex; la lectura la generó el motor local.',
    };
  }

  const prompt = `Eres analista de planeación de demanda de CONSCORE, una empresa mexicana de aislamiento térmico industrial (lana mineral, fibra cerámica, XPS, reflectivos). Su demanda es por proyecto: irregular, con picos ligados a obras.

Se te entrega un pronóstico ya calculado desde el kardex real. NO recalcules las cifras ni propongas números distintos: tu trabajo es interpretarlas.

Ventana analizada: ${windowDays} días. Horizonte proyectado: ${horizonDays} días.

DATOS:
${JSON.stringify(forecasts, null, 2)}

Redacta un análisis ejecutivo en español de México, de 4 a 6 frases, que cubra:
1. Qué materiales requieren acción de compra y por qué.
2. Riesgo de desabasto dentro del horizonte, mencionando la cobertura en días.
3. Advertencia explícita sobre los materiales con confianza BAJA: en demanda por proyecto, pocas salidas grandes no son un ritmo.
4. Una recomendación concreta de siguiente paso.

Sin encabezados, sin listas numeradas, sin negritas. Prosa corrida y directa.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    return {
      generatedAt,
      windowDays,
      horizonDays,
      forecasts,
      analysis: response.text || buildLocalAnalysis(forecasts, horizonDays),
      source: 'gemini',
    };
  } catch (err) {
    console.warn('[demandForecastService] Gemini no respondió, se entrega el análisis local:', err);
    return {
      generatedAt,
      windowDays,
      horizonDays,
      forecasts,
      analysis: buildLocalAnalysis(forecasts, horizonDays),
      source: 'estadistico',
      notice: 'El modelo no respondió. El pronóstico numérico es válido; la lectura la generó el motor local.',
    };
  }
}
