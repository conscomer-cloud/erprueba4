import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { SlidersHorizontal, RotateCcw, Megaphone, Sun, TrendingUp, Save, Trash2, AlertTriangle } from 'lucide-react';

interface ProductSeries {
  productCode: string;
  productName: string;
  unit: string;
  historical: number[];
  forecast: number[];
  totalHistorical: number;
  totalForecast: number;
  trendPct: number;
}

interface BISeriesResult {
  months: { label: string; isForecast: boolean }[];
  historicalMonths: number;
  forecastMonths: number;
  chartData: Record<string, any>[];
  products: ProductSeries[];
  categories: { value: string; count: number }[];
  warehouses: { value: string; label: string; count: number }[];
}

interface Escenario {
  nombre: string;
  seasonality: number;
  marketingLift: number;
  trendWeight: number;
}

const BASE: Escenario = { nombre: 'Base', seasonality: 0, marketingLift: 0, trendWeight: 60 };

const PRESETS: Escenario[] = [
  { nombre: 'Temporada alta', seasonality: 30, marketingLift: 0, trendWeight: 70 },
  { nombre: 'Campaña agresiva', seasonality: 10, marketingLift: 35, trendWeight: 60 },
  { nombre: 'Contracción', seasonality: -25, marketingLift: 0, trendWeight: 40 },
];

const fmt = (n: number) => (Number(n) || 0).toLocaleString('es-MX');
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('conscore_auth_token') || ''}` });

/**
 * Simulador de escenarios.
 *
 * Pide al servidor la serie base una sola vez y aplica los factores en el
 * navegador. Así el gráfico responde mientras se arrastra el control, sin una
 * petición por movimiento; el costo es que los factores deben ser los mismos
 * que usa el servidor, cosa que se cumple porque son multiplicadores directos
 * sobre la proyección.
 *
 * La promoción de marketing se modela como un empuje sobre la demanda, no
 * sobre la tendencia: una campaña levanta el volumen del periodo en que corre,
 * no cambia la pendiente estructural del material.
 */
export const ScenarioSimulatorView: React.FC = () => {
  const [base, setBase] = useState<BISeriesResult | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState('TODAS');
  const [warehouseId, setWarehouseId] = useState('TODOS');
  const [esc, setEsc] = useState<Escenario>(BASE);
  const [guardados, setGuardados] = useState<Escenario[]>([]);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      // Se pide con trendWeight neutro; el peso se aplica aquí para que el
      // deslizador responda sin ir al servidor.
      const params = new URLSearchParams({
        historicalMonths: '6', forecastMonths: '3', topN: '10',
        category, warehouseId, seasonality: '0', trendWeight: '0', safetyMargin: '0',
      });
      const res = await fetch(`/api/predictive/bi-series?${params}`, { headers: auth() });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
      setBase(await res.json());
    } catch (err: any) {
      setError(err?.message || 'No se pudo cargar la serie base.');
    } finally {
      setCargando(false);
    }
  }, [category, warehouseId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  /** Factor compuesto del escenario para el mes n de la proyección. */
  const factorMes = useCallback(
    (trendPct: number, n: number) => {
      const tendencia = Math.pow(1 + (trendPct / 100) * (esc.trendWeight / 100), n + 1);
      const estacional = 1 + esc.seasonality / 100;
      const campana = 1 + esc.marketingLift / 100;
      return tendencia * estacional * campana;
    },
    [esc]
  );

  const simulacion = useMemo(() => {
    if (!base) return null;

    const productos = base.products.map((p) => {
      const proyeccion = p.forecast.map((v, i) => Math.max(0, Math.round(v * factorMes(p.trendPct, i))));
      const baseTotal = p.forecast.reduce((s, v) => s + v, 0);
      const escTotal = proyeccion.reduce((s, v) => s + v, 0);
      return { ...p, escenario: proyeccion, baseTotal, escTotal, delta: escTotal - baseTotal };
    });

    const filas = base.chartData.map((fila, i) => {
      const esPron = fila.esPronostico === 1;
      const idxF = i - base.historicalMonths;

      const hist = esPron ? null : productos.reduce((s, p) => s + (p.historical[i] ?? 0), 0);
      const baseF = esPron ? productos.reduce((s, p) => s + (p.forecast[idxF] ?? 0), 0) : null;
      const escF = esPron ? productos.reduce((s, p) => s + (p.escenario[idxF] ?? 0), 0) : null;

      // En el mes de corte las tres series comparten valor, para que las
      // líneas queden unidas.
      const ultimoHist = i === base.historicalMonths - 1;

      return {
        mes: fila.mes,
        real: hist,
        base: esPron ? baseF : ultimoHist ? hist : null,
        escenario: esPron ? escF : ultimoHist ? hist : null,
      };
    });

    const totalBase = productos.reduce((s, p) => s + p.baseTotal, 0);
    const totalEsc = productos.reduce((s, p) => s + p.escTotal, 0);

    return {
      productos: productos.sort((a, b) => b.escTotal - a.escTotal),
      filas,
      totalBase,
      totalEsc,
      deltaPct: totalBase > 0 ? Math.round(((totalEsc - totalBase) / totalBase) * 100) : 0,
    };
  }, [base, factorMes]);

  const modificado = esc.seasonality !== 0 || esc.marketingLift !== 0 || esc.trendWeight !== 60;
  const mesCorte = base?.months.find((m) => m.isForecast)?.label;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Simulador de escenarios</h3>
            </div>
            <p className="max-w-2xl text-xs leading-relaxed text-slate-600">
              Ajusta variables externas y observa cómo cambia la rotación proyectada. El
              recálculo ocurre en el navegador, así que la curva se mueve mientras arrastras.
            </p>
          </div>

          <div className="no-print flex items-center gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 cursor-pointer"
              aria-label="Categoría"
            >
              <option value="TODAS">Todas las categorías</option>
              {(base?.categories || []).map((c) => (
                <option key={c.value} value={c.value}>{c.value}</option>
              ))}
            </select>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 cursor-pointer"
              aria-label="Almacén"
            >
              <option value="TODOS">Todos los almacenes</option>
              {(base?.warehouses || []).map((w) => (
                <option key={w.value} value={w.value}>{w.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="no-print flex flex-wrap gap-2 border-t border-slate-100 pt-3">
          <span className="self-center text-[10px] font-bold uppercase tracking-wider text-slate-400">Escenarios rápidos</span>
          {PRESETS.map((p) => (
            <button
              key={p.nombre}
              onClick={() => setEsc(p)}
              className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold cursor-pointer ${
                esc.nombre === p.nombre
                  ? 'border-blue-300 bg-blue-50 text-blue-700'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {p.nombre}
            </button>
          ))}
          {modificado && (
            <button
              onClick={() => setEsc(BASE)}
              className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-200 cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              Volver a base
            </button>
          )}
        </div>
      </div>

      {/* Variables */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="no-print grid gap-5 md:grid-cols-3">
          <Control
            icono={Sun}
            titulo="Estacionalidad"
            valor={esc.seasonality}
            min={-50}
            max={50}
            izq="Baja"
            der="Alta"
            nota="Supuesto de temporada. El sistema no tiene historia suficiente para estimarla, lo decides tú."
            onChange={(v) => setEsc((s) => ({ ...s, seasonality: v, nombre: 'Personalizado' }))}
          />
          <Control
            icono={Megaphone}
            titulo="Promoción de marketing"
            valor={esc.marketingLift}
            min={0}
            max={60}
            izq="Sin campaña"
            der="Campaña fuerte"
            nota="Empuje de demanda por promoción. Levanta el volumen del periodo, no cambia la pendiente del material."
            onChange={(v) => setEsc((s) => ({ ...s, marketingLift: v, nombre: 'Personalizado' }))}
          />
          <Control
            icono={TrendingUp}
            titulo="Peso de la tendencia"
            valor={esc.trendWeight}
            min={0}
            max={100}
            izq="Promedio plano"
            der="Tendencia completa"
            nota="Cuánto de la variación entre trimestres se traslada a la proyección."
            onChange={(v) => setEsc((s) => ({ ...s, trendWeight: v, nombre: 'Personalizado' }))}
          />
        </div>

        {simulacion && (
          <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Proyección base</div>
              <div className="font-mono text-base font-bold text-slate-700">{fmt(simulacion.totalBase)}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Escenario</div>
              <div className="font-mono text-base font-bold text-blue-700">{fmt(simulacion.totalEsc)}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Diferencia</div>
              <div
                className={`font-mono text-base font-bold ${
                  simulacion.deltaPct > 0 ? 'text-amber-600' : simulacion.deltaPct < 0 ? 'text-emerald-600' : 'text-slate-500'
                }`}
              >
                {simulacion.deltaPct > 0 ? '+' : ''}
                {simulacion.deltaPct}%
              </div>
            </div>

            <button
              onClick={() => setGuardados((g) => [...g.filter((x) => x.nombre !== esc.nombre), { ...esc, nombre: esc.nombre === 'Personalizado' ? `Escenario ${g.length + 1}` : esc.nombre }])}
              className="no-print ml-auto flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Save className="h-3 w-3" />
              Guardar escenario
            </button>
          </div>
        )}

        {guardados.length > 0 && (
          <div className="no-print mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
            {guardados.map((g) => (
              <span key={g.nombre} className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                <button onClick={() => setEsc(g)} className="cursor-pointer hover:text-blue-700">
                  {g.nombre} ({g.seasonality > 0 ? '+' : ''}{g.seasonality}% · +{g.marketingLift}%)
                </button>
                <button onClick={() => setGuardados((l) => l.filter((x) => x.nombre !== g.nombre))} className="cursor-pointer text-slate-400 hover:text-red-600">
                  <Trash2 className="h-3 w-3" />
                </button>
              </span>
            ))}
            <span className="self-center text-[10px] text-slate-400">Los escenarios guardados se pierden al salir de la pantalla</span>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <span className="text-xs text-red-800">{error}</span>
        </div>
      )}

      {/* Gráfico */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        {!simulacion || simulacion.productos.length === 0 ? (
          <p className="py-16 text-center text-xs text-slate-500">
            {cargando ? 'Cargando serie base...' : 'No hay salidas registradas en los últimos 6 meses para simular.'}
          </p>
        ) : (
          <div style={{ width: '100%', height: 340 }}>
            <ResponsiveContainer>
              <LineChart data={simulacion.filas} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-slate-200)" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'var(--color-slate-500)' }} stroke="var(--color-slate-300)" />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-slate-500)' }} stroke="var(--color-slate-300)" width={56} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--color-white)', border: '1px solid var(--color-slate-200)', borderRadius: 10, fontSize: 12 }}
                  formatter={(v: any, n: any) => [fmt(v as number), n]}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {mesCorte && (
                  <ReferenceLine x={mesCorte} stroke="var(--color-slate-400)" strokeDasharray="4 4" />
                )}
                <Line type="monotone" dataKey="real" name="Salidas reales" stroke="var(--color-slate-800)" strokeWidth={2.5} dot={{ r: 2.5 }} connectNulls isAnimationActive={false} />
                <Line type="monotone" dataKey="base" name="Proyección base" stroke="var(--color-slate-400)" strokeWidth={1.8} strokeDasharray="5 4" dot={{ r: 2 }} connectNulls isAnimationActive={false} />
                <Line type="monotone" dataKey="escenario" name="Escenario simulado" stroke="var(--color-blue-600)" strokeWidth={2.5} strokeDasharray="5 4" dot={{ r: 3 }} connectNulls isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Detalle por material */}
      {simulacion && simulacion.productos.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Impacto por material</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-slate-100">
                <tr className="text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-2 font-bold">Material</th>
                  <th className="px-3 py-2 text-right font-bold">Base</th>
                  <th className="px-3 py-2 text-right font-bold">Escenario</th>
                  <th className="px-4 py-2 text-right font-bold">Diferencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {simulacion.productos.map((p) => (
                  <tr key={p.productCode} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5">
                      <div className="max-w-xs truncate text-xs font-semibold text-slate-900">{p.productName}</div>
                      <div className="font-mono text-[10px] text-slate-500">{p.productCode}</div>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs text-slate-600">{fmt(p.baseTotal)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs font-bold text-blue-700">{fmt(p.escTotal)}</td>
                    <td className={`px-4 py-2.5 text-right font-mono text-xs font-bold ${p.delta > 0 ? 'text-amber-600' : p.delta < 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {p.delta > 0 ? '+' : ''}{fmt(p.delta)} <span className="text-[10px] font-normal">{p.unit}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5">
            <p className="text-[10px] leading-relaxed text-slate-500">
              Un escenario no es un pronóstico: es una hipótesis sobre condiciones que todavía
              no ocurren. Sirve para dimensionar el riesgo de una decisión de compra, no para
              sustituir la proyección base.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const Control: React.FC<{
  icono: React.ElementType;
  titulo: string;
  valor: number;
  min: number;
  max: number;
  izq: string;
  der: string;
  nota: string;
  onChange: (v: number) => void;
}> = ({ icono: Icono, titulo, valor, min, max, izq, der, nota, onChange }) => (
  <div>
    <div className="mb-1.5 flex items-baseline justify-between">
      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
        <Icono className="h-3.5 w-3.5 text-slate-400" />
        {titulo}
      </label>
      <span className="font-mono text-sm font-bold text-blue-700">
        {valor > 0 && min < 0 ? '+' : ''}{valor}%
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
      <span>{izq}</span>
      <span>{der}</span>
    </div>
    <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">{nota}</p>
  </div>
);
