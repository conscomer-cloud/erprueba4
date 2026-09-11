import React, { useEffect, useState } from 'react';
import {
  History,
  RefreshCw,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronRight,
  Archive,
  FlaskConical,
  TrendingUp,
  TrendingDown,
  Target,
} from 'lucide-react';

interface EvaluatedItem {
  productCode: string;
  productName: string;
  unit: string;
  predicted: number;
  actual: number;
  deviation: number;
  errorPct: number | null;
  biasPct: number | null;
}

interface EvaluatedForecast {
  id: string;
  targetMonth: string;
  targetLabel: string;
  generatedAt: string;
  origin: 'GUARDADO' | 'RETROSPECTIVO';
  items: EvaluatedItem[];
  totalPredicted: number;
  totalActual: number;
  mape: number | null;
  bias: number | null;
  hitRate: number | null;
  evaluableCount: number;
}

interface HistoryResult {
  generatedAt: string;
  entries: EvaluatedForecast[];
  savedCount: number;
  backtestCount: number;
  summary: {
    mape: number | null;
    bias: number | null;
    hitRate: number | null;
    monthsEvaluated: number;
    reading: string;
  };
  notice?: string;
}

const fmt = (n: number) => (Number(n) || 0).toLocaleString('es-MX');

/** Verde bajo 20%, ámbar hasta 50%, rojo arriba. */
const colorError = (pct: number | null) => {
  if (pct === null) return 'text-slate-400';
  if (pct <= 20) return 'text-emerald-600';
  if (pct <= 50) return 'text-amber-600';
  return 'text-red-600';
};

export const ForecastHistoryView: React.FC = () => {
  const [data, setData] = useState<HistoryResult | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [abierto, setAbierto] = useState<string | null>(null);

  const cargar = async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch('/api/predictive/forecast-history?monthsBack=6&topN=5', {
        headers: { Authorization: `Bearer ${localStorage.getItem('conscore_auth_token') || ''}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `El servidor respondió ${res.status}.`);
      }
      const json: HistoryResult = await res.json();
      setData(json);
      if (json.entries.length > 0) setAbierto(json.entries[0].id);
    } catch (err: any) {
      setError(err?.message || 'No se pudo cargar el historial.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <History className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Historial reciente</h3>
          </div>
          <p className="max-w-2xl text-xs leading-relaxed text-slate-600">
            Compara lo que se proyectó para cada mes contra las salidas que
            efectivamente ocurrieron. Solo se evalúan meses cerrados: el mes en curso
            sigue acumulando movimientos y compararlo daría un error inflado.
          </p>
        </div>

        <button
          onClick={cargar}
          disabled={cargando}
          className="no-print flex shrink-0 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${cargando ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <div>
            <p className="text-xs font-bold text-red-900">No se pudo cargar el historial</p>
            <p className="mt-0.5 text-[11px] text-red-700">{error}</p>
          </div>
        </div>
      )}

      {data?.notice && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-[11px] leading-relaxed text-amber-800">{data.notice}</p>
        </div>
      )}

      {data && data.entries.length > 0 && (
        <>
          {/* Resumen de precisión */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-900">
              Precisión sobre {data.summary.monthsEvaluated} mes(es) evaluado(s)
            </h4>

            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <Metrica
                titulo="Error medio"
                valor={data.summary.mape !== null ? `${data.summary.mape}%` : '—'}
                icono={Target}
                ayuda="Promedio de qué tanto se desvió el pronóstico de la realidad, sin importar la dirección."
                tono={colorError(data.summary.mape)}
              />
              <Metrica
                titulo="Sesgo"
                valor={
                  data.summary.bias !== null
                    ? `${data.summary.bias > 0 ? '+' : ''}${data.summary.bias}%`
                    : '—'
                }
                icono={data.summary.bias !== null && data.summary.bias < 0 ? TrendingDown : TrendingUp}
                ayuda="Positivo significa que el modelo tiende a proyectar de más; negativo, de menos."
                tono={
                  data.summary.bias === null
                    ? 'text-slate-400'
                    : Math.abs(data.summary.bias) < 10
                    ? 'text-emerald-600'
                    : 'text-amber-600'
                }
              />
              <Metrica
                titulo="Dentro del 20%"
                valor={data.summary.hitRate !== null ? `${data.summary.hitRate}%` : '—'}
                icono={Target}
                ayuda="Proporción de materiales cuyo pronóstico quedó a menos de 20 por ciento de la demanda real."
                tono={
                  data.summary.hitRate === null
                    ? 'text-slate-400'
                    : data.summary.hitRate >= 60
                    ? 'text-emerald-600'
                    : 'text-amber-600'
                }
              />
            </div>

            <p className="border-t border-slate-100 pt-3 text-xs leading-relaxed text-slate-700">
              {data.summary.reading}
            </p>
          </div>

          {/* Meses */}
          <div className="space-y-2.5">
            {data.entries.map((e) => {
              const expandido = abierto === e.id;
              const esGuardado = e.origin === 'GUARDADO';

              return (
                <div key={e.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
                  <button
                    onClick={() => setAbierto(expandido ? null : e.id)}
                    className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 cursor-pointer"
                  >
                    {expandido ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                    )}

                    <span className="text-xs font-bold capitalize text-slate-900">{e.targetLabel}</span>

                    <span
                      className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                        esGuardado
                          ? 'border-blue-200 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-slate-50 text-slate-600'
                      }`}
                      title={
                        esGuardado
                          ? 'Pronóstico que el sistema generó y quedó registrado'
                          : 'Reconstrucción: lo que el modelo habría proyectado con los datos disponibles en ese corte'
                      }
                    >
                      {esGuardado ? <Archive className="h-3 w-3" /> : <FlaskConical className="h-3 w-3" />}
                      {esGuardado ? 'Guardado' : 'Retrospectivo'}
                    </span>

                    <div className="ml-auto flex flex-wrap items-center gap-4 text-[11px]">
                      <span className="text-slate-600">
                        Proyectado <b className="font-mono text-slate-900">{fmt(e.totalPredicted)}</b>
                      </span>
                      <span className="text-slate-600">
                        Real <b className="font-mono text-slate-900">{fmt(e.totalActual)}</b>
                      </span>
                      <span className={`font-mono font-bold ${colorError(e.mape)}`}>
                        {e.mape !== null ? `${e.mape}% error` : 'sin demanda real'}
                      </span>
                    </div>
                  </button>

                  {expandido && (
                    <div className="border-t border-slate-100">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50">
                            <tr className="text-[10px] uppercase tracking-wider text-slate-500">
                              <th className="px-4 py-2 font-bold">Material</th>
                              <th className="px-3 py-2 text-right font-bold">Proyectado</th>
                              <th className="px-3 py-2 text-right font-bold">Real</th>
                              <th className="px-3 py-2 text-right font-bold">Diferencia</th>
                              <th className="px-4 py-2 text-right font-bold">Error</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {e.items.map((it) => (
                              <tr key={it.productCode} className="hover:bg-slate-50">
                                <td className="px-4 py-2.5">
                                  <div className="max-w-xs truncate text-xs font-semibold text-slate-900">
                                    {it.productName}
                                  </div>
                                  <div className="font-mono text-[10px] text-slate-500">{it.productCode}</div>
                                </td>
                                <td className="px-3 py-2.5 text-right font-mono text-xs text-slate-700">
                                  {fmt(it.predicted)}
                                </td>
                                <td className="px-3 py-2.5 text-right font-mono text-xs font-bold text-slate-900">
                                  {fmt(it.actual)}
                                </td>
                                <td className="px-3 py-2.5 text-right font-mono text-xs">
                                  <span className={it.deviation > 0 ? 'text-amber-600' : it.deviation < 0 ? 'text-blue-700' : 'text-slate-400'}>
                                    {it.deviation > 0 ? '+' : ''}
                                    {fmt(it.deviation)}
                                  </span>
                                </td>
                                <td className={`px-4 py-2.5 text-right font-mono text-xs font-bold ${colorError(it.errorPct)}`}>
                                  {it.errorPct !== null ? `${it.errorPct}%` : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="border-t border-slate-100 bg-slate-50 px-4 py-2">
                        <p className="text-[10px] leading-relaxed text-slate-500">
                          {esGuardado
                            ? `Pronóstico registrado el ${new Date(e.generatedAt).toLocaleDateString('es-MX')}. Diferencia positiva significa que se proyectó de más.`
                            : 'Reconstrucción con corte en el mes previo: el cálculo solo vio los movimientos anteriores al mes evaluado. No es lo que se predijo entonces, es lo que el modelo habría predicho.'}
                          {e.items.some((i) => i.errorPct === null) &&
                            ' Los materiales sin demanda real en el mes aparecen con error en blanco: dividir entre cero no da un porcentaje.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {data && data.entries.length === 0 && !cargando && (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-xs text-slate-500">
            No hay meses cerrados con movimientos suficientes para comparar. El historial
            se irá llenando conforme se generen pronósticos y se registren salidas.
          </p>
        </div>
      )}
    </div>
  );
};

const Metrica: React.FC<{
  titulo: string;
  valor: string;
  icono: React.ElementType;
  ayuda: string;
  tono: string;
}> = ({ titulo, valor, icono: Icono, ayuda, tono }) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5" title={ayuda}>
    <div className="mb-1 flex items-center gap-1.5">
      <Icono className={`h-3.5 w-3.5 ${tono}`} />
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{titulo}</span>
    </div>
    <div className={`font-mono text-xl font-bold ${tono}`}>{valor}</div>
    <p className="mt-1 text-[10px] leading-relaxed text-slate-500">{ayuda}</p>
  </div>
);
