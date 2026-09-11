import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { BarChart3, RefreshCw, AlertTriangle, RotateCcw, Filter, Eye, EyeOff } from 'lucide-react';

interface ProductSeries {
  productId: string;
  productCode: string;
  productName: string;
  category: string;
  unit: string;
  historical: number[];
  forecast: number[];
  totalHistorical: number;
  totalForecast: number;
  trendPct: number;
}

interface BISeriesResult {
  generatedAt: string;
  months: { key: string; label: string; isForecast: boolean }[];
  historicalMonths: number;
  forecastMonths: number;
  sensitivity: { seasonality: number; trendWeight: number; safetyMargin: number };
  chartData: Record<string, any>[];
  products: ProductSeries[];
  categories: { value: string; count: number }[];
  warehouses: { value: string; label: string; count: number }[];
  appliedFilters: { category: string | null; warehouseId: string | null };
  totalMatching: number;
}

/**
 * Paleta de series. Diez productos con dos líneas cada uno son veinte trazos:
 * por eso el gráfico arranca con el agregado y los tres primeros materiales, y
 * el resto se enciende desde la tabla. Mostrar los veinte de golpe produce una
 * maraña en la que no se distingue nada.
 */
const COLORES = [
  '#065994', '#e4a734', '#cf2823', '#0b6fb4', '#7c3aed',
  '#059669', '#db2777', '#0891b2', '#b45309', '#4b5563',
];

const COLOR_TOTAL = '#03253b';

const fmt = (n: number) => (Number(n) || 0).toLocaleString('es-MX');

const DEFAULTS = { seasonality: 0, trendWeight: 60, safetyMargin: 0 };

export const BusinessIntelligenceView: React.FC = () => {
  const [data, setData] = useState<BISeriesResult | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState<string>('TODAS');
  const [warehouseId, setWarehouseId] = useState<string>('TODOS');
  const [sens, setSens] = useState(DEFAULTS);
  const [visibles, setVisibles] = useState<Set<string>>(new Set(['TOTAL']));
  const [inicializado, setInicializado] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        historicalMonths: '6',
        forecastMonths: '2',
        topN: '10',
        category,
        warehouseId,
        seasonality: String(sens.seasonality),
        trendWeight: String(sens.trendWeight),
        safetyMargin: String(sens.safetyMargin),
      });
      const res = await fetch(`/api/predictive/bi-series?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('conscore_auth_token') || ''}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `El servidor respondió ${res.status}.`);
      }
      const json: BISeriesResult = await res.json();
      setData(json);

      // En la primera carga se encienden el agregado y los tres materiales
      // de mayor volumen; después se respeta lo que el usuario haya elegido.
      if (!inicializado && json.products.length > 0) {
        setVisibles(new Set(['TOTAL', ...json.products.slice(0, 3).map((p) => p.productCode)]));
        setInicializado(true);
      }
    } catch (err: any) {
      setError(err?.message || 'No se pudieron cargar las series.');
    } finally {
      setCargando(false);
    }
  }, [category, warehouseId, sens, inicializado]);

  // Los filtros recargan de inmediato. Los deslizadores esperan a que el
  // usuario suelte el control: recalcular en cada píxel dispara una petición
  // por movimiento del dedo.
  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, warehouseId]);

  useEffect(() => {
    const t = setTimeout(() => cargar(), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sens]);

  const alternar = (code: string) => {
    setVisibles((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const limpiarFiltros = () => {
    setCategory('TODAS');
    setWarehouseId('TODOS');
  };

  const restablecerSensibilidad = () => setSens(DEFAULTS);

  const hayFiltro = category !== 'TODAS' || warehouseId !== 'TODOS';
  const sensModificada =
    sens.seasonality !== DEFAULTS.seasonality ||
    sens.trendWeight !== DEFAULTS.trendWeight ||
    sens.safetyMargin !== DEFAULTS.safetyMargin;

  const lineas = useMemo(() => {
    if (!data) return [];
    const out: { key: string; nombre: string; color: string; punteada: boolean }[] = [];

    if (visibles.has('TOTAL')) {
      out.push({ key: 'h_TOTAL', nombre: 'Total histórico', color: COLOR_TOTAL, punteada: false });
      out.push({ key: 'f_TOTAL', nombre: 'Total pronóstico', color: COLOR_TOTAL, punteada: true });
    }

    data.products.forEach((p, i) => {
      if (!visibles.has(p.productCode)) return;
      const color = COLORES[i % COLORES.length];
      out.push({ key: `h_${p.productCode}`, nombre: `${p.productCode} real`, color, punteada: false });
      out.push({ key: `f_${p.productCode}`, nombre: `${p.productCode} pronóstico`, color, punteada: true });
    });

    return out;
  }, [data, visibles]);

  const mesCorte = data?.months.find((m) => m.isForecast);

  return (
    <div className="space-y-5">
      {/* Encabezado y filtros */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Business Intelligence</h3>
            </div>
            <p className="max-w-2xl text-xs leading-relaxed text-slate-600">
              Venta histórica de los últimos 6 meses contra la demanda proyectada de los
              siguientes 2, para los 10 materiales de mayor volumen. La línea continua es
              lo que ya pasó; la punteada es proyección.
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

        <div className="no-print flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <Filter className="h-3.5 w-3.5 text-slate-400" />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 cursor-pointer"
            aria-label="Filtrar por categoría"
          >
            <option value="TODAS">Todas las categorías</option>
            {(data?.categories || []).map((c) => (
              <option key={c.value} value={c.value}>
                {c.value} ({c.count})
              </option>
            ))}
          </select>

          <select
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 cursor-pointer"
            aria-label="Filtrar por almacén"
          >
            <option value="TODOS">Todos los almacenes</option>
            {(data?.warehouses || []).map((w) => (
              <option key={w.value} value={w.value}>
                {w.label} ({w.count})
              </option>
            ))}
          </select>

          {hayFiltro && (
            <button
              onClick={limpiarFiltros}
              className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5 text-[11px] font-bold text-blue-700 hover:bg-blue-100 cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              Quitar filtros
            </button>
          )}

          {data && (
            <span className="ml-auto text-[11px] text-slate-500">
              {data.products.length} de {data.totalMatching} material(es) con movimiento
            </span>
          )}
        </div>
      </div>

      {/* Deslizadores de sensibilidad */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Sensibilidad del modelo
          </h4>
          {sensModificada && (
            <button
              onClick={restablecerSensibilidad}
              className="no-print flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-200 cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              Valores por defecto
            </button>
          )}
        </div>

        <div className="no-print grid gap-5 md:grid-cols-3">
          <Deslizador
            titulo="Estacionalidad"
            valor={sens.seasonality}
            min={-50}
            max={50}
            sufijo="%"
            etiquetaIzq="Temporada baja"
            etiquetaDer="Temporada alta"
            descripcion="Supuesto de temporada. El sistema aún no tiene historia suficiente para estimarla solo, así que lo decides tú."
            onChange={(v) => setSens((s) => ({ ...s, seasonality: v }))}
          />
          <Deslizador
            titulo="Peso de la tendencia"
            valor={sens.trendWeight}
            min={0}
            max={100}
            sufijo="%"
            etiquetaIzq="Promedio plano"
            etiquetaDer="Tendencia completa"
            descripcion="Cuánto de la variación entre trimestres se traslada a la proyección. En 0 la línea es el promedio; en 100 sigue la pendiente observada."
            onChange={(v) => setSens((s) => ({ ...s, trendWeight: v }))}
          />
          <Deslizador
            titulo="Margen de seguridad"
            valor={sens.safetyMargin}
            min={0}
            max={50}
            sufijo="%"
            etiquetaIzq="Sin colchón"
            etiquetaDer="Conservador"
            descripcion="Colchón sobre la proyección para planear compra con holgura. No cambia la cifra base, la infla a propósito."
            onChange={(v) => setSens((s) => ({ ...s, safetyMargin: v }))}
          />
        </div>

        <p className="mt-4 border-t border-slate-100 pt-3 text-[10px] leading-relaxed text-slate-500">
          Estos controles mueven supuestos declarados, no el historial. Las líneas continuas
          no cambian nunca: son salidas registradas en el kardex. Solo se recalcula la
          proyección.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <div>
            <p className="text-xs font-bold text-red-900">No se pudieron cargar las series</p>
            <p className="mt-0.5 text-[11px] text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Gráfico */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        {!data || data.products.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-xs text-slate-500">
              {cargando
                ? 'Cargando series...'
                : hayFiltro
                ? 'Ningún material con movimiento coincide con los filtros seleccionados.'
                : 'No hay salidas registradas en los últimos 6 meses. Sin movimientos en el kardex no hay serie que graficar.'}
            </p>
            {hayFiltro && !cargando && (
              <button
                onClick={limpiarFiltros}
                className="no-print mt-3 rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-blue-700 cursor-pointer"
              >
                Quitar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            <div style={{ width: '100%', height: 380 }}>
              <ResponsiveContainer>
                <LineChart data={data.chartData} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-slate-200)" />
                  <XAxis
                    dataKey="mes"
                    tick={{ fontSize: 11, fill: 'var(--color-slate-500)' }}
                    stroke="var(--color-slate-300)"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'var(--color-slate-500)' }}
                    stroke="var(--color-slate-300)"
                    width={56}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-white)',
                      border: '1px solid var(--color-slate-200)',
                      borderRadius: 10,
                      fontSize: 12,
                    }}
                    formatter={(v: any, n: any) => [fmt(v as number), n]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />

                  {mesCorte && (
                    <ReferenceLine
                      x={mesCorte.label}
                      stroke="var(--color-slate-400)"
                      strokeDasharray="4 4"
                      label={{ value: 'Pronóstico', position: 'insideTopRight', fontSize: 10, fill: 'var(--color-slate-500)' }}
                    />
                  )}

                  {lineas.map((l) => (
                    <Line
                      key={l.key}
                      type="monotone"
                      dataKey={l.key}
                      name={l.nombre}
                      stroke={l.color}
                      strokeWidth={l.key.includes('TOTAL') ? 2.5 : 1.8}
                      strokeDasharray={l.punteada ? '5 4' : undefined}
                      dot={{ r: 2.5 }}
                      activeDot={{ r: 5 }}
                      connectNulls
                      isAnimationActive={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <p className="mt-2 text-center text-[10px] text-slate-400">
              Línea continua: salidas registradas. Punteada: proyección con los parámetros actuales.
            </p>
          </>
        )}
      </div>

      {/* Tabla con control de visibilidad */}
      {data && data.products.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Materiales · toca para mostrar u ocultar en el gráfico
            </h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-slate-100">
                <tr className="text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-2 font-bold">Serie</th>
                  <th className="px-3 py-2 font-bold">Categoría</th>
                  <th className="px-3 py-2 text-right font-bold">Histórico 6 m</th>
                  <th className="px-3 py-2 text-right font-bold">Tendencia</th>
                  <th className="px-3 py-2 text-right font-bold">Pronóstico 2 m</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr
                  onClick={() => alternar('TOTAL')}
                  className="cursor-pointer bg-slate-50/60 hover:bg-slate-100"
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      {visibles.has('TOTAL') ? (
                        <Eye className="h-3.5 w-3.5 text-slate-700" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5 text-slate-300" />
                      )}
                      <span className="h-2.5 w-2.5 rounded-xs" style={{ backgroundColor: COLOR_TOTAL }} />
                      <span className="text-xs font-bold text-slate-900">Total agregado</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-[11px] text-slate-400">—</td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs font-bold text-slate-900">
                    {fmt(data.products.reduce((s, p) => s + p.totalHistorical, 0))}
                  </td>
                  <td className="px-3 py-2.5 text-right text-[11px] text-slate-400">—</td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs font-bold text-blue-700">
                    {fmt(data.products.reduce((s, p) => s + p.totalForecast, 0))}
                  </td>
                </tr>

                {data.products.map((p, i) => {
                  const visible = visibles.has(p.productCode);
                  return (
                    <tr
                      key={p.productId}
                      onClick={() => alternar(p.productCode)}
                      className={`cursor-pointer hover:bg-slate-50 ${visible ? '' : 'opacity-50'}`}
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          {visible ? (
                            <Eye className="h-3.5 w-3.5 text-slate-700" />
                          ) : (
                            <EyeOff className="h-3.5 w-3.5 text-slate-300" />
                          )}
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-xs"
                            style={{ backgroundColor: COLORES[i % COLORES.length] }}
                          />
                          <div className="min-w-0">
                            <div className="max-w-xs truncate text-xs font-semibold text-slate-900">
                              {p.productName}
                            </div>
                            <div className="font-mono text-[10px] text-slate-500">{p.productCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCategory(p.category);
                          }}
                          title={`Filtrar por ${p.category}`}
                          className="rounded-sm bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-blue-100 hover:text-blue-700 cursor-pointer"
                        >
                          {p.category}
                        </button>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs text-slate-700">
                        {fmt(p.totalHistorical)} <span className="text-[10px] text-slate-400">{p.unit}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span
                          className={`font-mono text-xs font-bold ${
                            p.trendPct > 5 ? 'text-red-600' : p.trendPct < -5 ? 'text-emerald-600' : 'text-slate-500'
                          }`}
                        >
                          {p.trendPct > 0 ? '+' : ''}
                          {p.trendPct}%
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs font-bold text-blue-700">
                        {fmt(p.totalForecast)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

interface DeslizadorProps {
  titulo: string;
  valor: number;
  min: number;
  max: number;
  sufijo: string;
  etiquetaIzq: string;
  etiquetaDer: string;
  descripcion: string;
  onChange: (v: number) => void;
}

const Deslizador: React.FC<DeslizadorProps> = ({
  titulo,
  valor,
  min,
  max,
  sufijo,
  etiquetaIzq,
  etiquetaDer,
  descripcion,
  onChange,
}) => (
  <div>
    <div className="mb-1.5 flex items-baseline justify-between">
      <label className="text-xs font-bold text-slate-800">{titulo}</label>
      <span className="font-mono text-sm font-bold text-blue-700">
        {valor > 0 && min < 0 ? '+' : ''}
        {valor}
        {sufijo}
      </span>
    </div>

    <input
      type="range"
      min={min}
      max={max}
      step={5}
      value={valor}
      onChange={(e) => onChange(Number(e.target.value))}
      aria-label={titulo}
      className="w-full cursor-pointer accent-blue-600"
    />

    <div className="mt-0.5 flex justify-between text-[10px] text-slate-400">
      <span>{etiquetaIzq}</span>
      <span>{etiquetaDer}</span>
    </div>

    <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">{descripcion}</p>
  </div>
);
