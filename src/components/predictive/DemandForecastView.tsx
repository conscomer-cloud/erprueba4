import React, { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
  Info,
  Minus,
} from 'lucide-react';

interface ProductForecast {
  productId: string;
  productCode: string;
  productName: string;
  unit: string;
  exits30d: number;
  dailyAverage: number;
  turnover: number;
  currentStock: number;
  baselineForecast60d: number;
  adjustedForecast60d: number;
  trendPct: number;
  coverageDays: number;
  projectedShortfall: number;
  confidence: 'ALTA' | 'MEDIA' | 'BAJA';
  confidenceReason: string;
}

interface ForecastResult {
  generatedAt: string;
  windowDays: number;
  horizonDays: number;
  forecasts: ProductForecast[];
  analysis: string;
  source: 'gemini' | 'estadistico';
  notice?: string;
}

const fmt = (n: number) => (Number(n) || 0).toLocaleString('es-MX');

const CONFIANZA_ESTILO: Record<ProductForecast['confidence'], string> = {
  ALTA: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  MEDIA: 'bg-amber-50 text-amber-700 border-amber-200',
  BAJA: 'bg-red-50 text-red-700 border-red-200',
};

/**
 * Pronóstico de demanda a 60 días sobre los 5 materiales de mayor rotación.
 *
 * Las cifras las calcula el servidor desde el kardex; el modelo Gemini
 * interpreta el resultado. Esa separación es deliberada: un modelo de lenguaje
 * no debe ser quien produzca las cantidades con las que se compra material.
 */
export const DemandForecastView: React.FC = () => {
  const [data, setData] = useState<ForecastResult | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generar = async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch('/api/predictive/demand-forecast?windowDays=30&horizonDays=60&topN=5', {
        headers: { Authorization: `Bearer ${localStorage.getItem('conscore_auth_token') || ''}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `El servidor respondió ${res.status}.`);
      }
      setData(await res.json());
    } catch (err: any) {
      setError(err?.message || 'No se pudo generar el pronóstico.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Pronóstico de demanda a 60 días</h3>
          </div>
          <p className="max-w-2xl text-xs leading-relaxed text-slate-600">
            Analiza la rotación de los últimos 30 días y proyecta la demanda de los
            cinco materiales más activos. Las cantidades se calculan desde el kardex;
            el modelo interpreta el resultado y señala los riesgos.
          </p>
        </div>

        <button
          onClick={generar}
          disabled={cargando}
          className="no-print flex shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${cargando ? 'animate-spin' : ''}`} />
          {cargando ? 'Analizando...' : data ? 'Actualizar' : 'Generar pronóstico'}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <div>
            <p className="text-xs font-bold text-red-900">No se pudo generar el pronóstico</p>
            <p className="mt-0.5 text-[11px] text-red-700">{error}</p>
          </div>
        </div>
      )}

      {data && (
        <>
          {data.notice && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-[11px] leading-relaxed text-amber-800">{data.notice}</p>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="mb-2.5 flex items-center gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Lectura ejecutiva</h4>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                  data.source === 'gemini'
                    ? 'border-blue-200 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}
              >
                {data.source === 'gemini' ? 'Gemini' : 'Motor local'}
              </span>
              <span className="ml-auto text-[10px] text-slate-400">
                {new Date(data.generatedAt).toLocaleString('es-MX')}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-700">{data.analysis}</p>
          </div>

          {data.forecasts.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <p className="text-xs text-slate-500">
                No hay salidas registradas en los últimos {data.windowDays} días. Sin
                movimientos no es posible proyectar demanda.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr className="text-[10px] uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-2.5 font-bold">Material</th>
                      <th className="px-3 py-2.5 text-right font-bold">Salidas 30 d</th>
                      <th className="px-3 py-2.5 text-right font-bold">Rotación</th>
                      <th className="px-3 py-2.5 text-right font-bold">Tendencia</th>
                      <th className="px-3 py-2.5 text-right font-bold">Existencia</th>
                      <th className="px-3 py-2.5 text-right font-bold">Proyección 60 d</th>
                      <th className="px-3 py-2.5 text-right font-bold">Cobertura</th>
                      <th className="px-3 py-2.5 text-right font-bold">Faltante</th>
                      <th className="px-4 py-2.5 font-bold">Confianza</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.forecasts.map((f) => (
                      <tr key={f.productId} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="max-w-xs truncate text-xs font-bold text-slate-900">{f.productName}</div>
                          <div className="font-mono text-[10px] text-slate-500">{f.productCode}</div>
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-xs text-slate-700">
                          {fmt(f.exits30d)}
                          <span className="block text-[10px] text-slate-400">{f.dailyAverage}/día</span>
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-xs font-bold text-slate-900">
                          {f.turnover.toFixed(2)}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <span
                            className={`inline-flex items-center gap-1 font-mono text-xs font-bold ${
                              f.trendPct > 5 ? 'text-red-600' : f.trendPct < -5 ? 'text-emerald-600' : 'text-slate-500'
                            }`}
                          >
                            {f.trendPct > 5 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : f.trendPct < -5 ? (
                              <TrendingDown className="h-3 w-3" />
                            ) : (
                              <Minus className="h-3 w-3" />
                            )}
                            {f.trendPct > 0 ? '+' : ''}
                            {f.trendPct}%
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-xs text-slate-700">
                          {fmt(f.currentStock)} <span className="text-[10px] text-slate-400">{f.unit}</span>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <div className="font-mono text-xs font-bold text-blue-700">{fmt(f.adjustedForecast60d)}</div>
                          {f.adjustedForecast60d !== f.baselineForecast60d && (
                            <div className="text-[10px] text-slate-400">base {fmt(f.baselineForecast60d)}</div>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-xs">
                          <span className={f.coverageDays < 60 ? 'font-bold text-red-600' : 'text-slate-700'}>
                            {f.coverageDays} d
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-xs">
                          {f.projectedShortfall > 0 ? (
                            <span className="font-bold text-red-600">{fmt(f.projectedShortfall)}</span>
                          ) : (
                            <span className="text-emerald-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${CONFIANZA_ESTILO[f.confidence]}`}
                            title={f.confidenceReason}
                          >
                            {f.confidence}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5">
                <p className="text-[10px] leading-relaxed text-slate-500">
                  La proyección ajusta el promedio diario por la tendencia entre quincenas,
                  acotada a más o menos 40 por ciento. En demanda por proyecto, un material
                  con salidas concentradas en pocos días no representa un ritmo sostenido:
                  esos casos aparecen marcados con confianza BAJA y conviene contrastarlos
                  con la cartera de obras antes de comprar.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
