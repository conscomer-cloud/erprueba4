import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { BellRing, AlertTriangle, PackageX, RefreshCw, Info, Warehouse, CheckCircle2 } from 'lucide-react';

interface CapacityAlert {
  warehouseId: string;
  warehouseName: string;
  productId: string;
  productCode: string;
  productName: string;
  unit: string;
  currentStock: number;
  capacity: number;
  projectedDemand: number;
  utilizationPct: number;
  severity: 'CRITICA' | 'ALTA';
  message: string;
}

interface CapacityAlertResult {
  generatedAt: string;
  thresholdPct: number;
  horizonMonths: number;
  alerts: CapacityAlert[];
  evaluated: number;
  withoutCapacity: number;
}

const fmt = (n: number) => (Number(n) || 0).toLocaleString('es-MX');
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('conscore_auth_token') || ''}` });

/** Cada cuánto se vuelve a consultar mientras la pantalla está abierta. */
const INTERVALO_MS = 5 * 60 * 1000;

/**
 * Centro de alerta temprana por capacidad.
 *
 * Avisa cuando la demanda proyectada de un material supera un porcentaje de la
 * capacidad del almacén donde vive. La notificación se emite una sola vez por
 * material y almacén mientras la alerta siga activa: repetir el aviso en cada
 * refresco entrena al usuario a ignorarlas, que es justo lo contrario de lo que
 * debe hacer una alerta.
 */
export const StockCapacityAlertCenter: React.FC = () => {
  const { addNotification } = useERP();

  const [data, setData] = useState<CapacityAlertResult | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [umbral, setUmbral] = useState(85);

  // Claves ya notificadas, para no repetir el aviso en cada consulta.
  const notificadas = useRef<Set<string>>(new Set());

  const cargar = useCallback(
    async (notificar = true) => {
      setCargando(true);
      setError(null);
      try {
        const res = await fetch(`/api/predictive/capacity-alerts?threshold=${umbral}&horizonMonths=2`, {
          headers: auth(),
        });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
        const json: CapacityAlertResult = await res.json();
        setData(json);

        if (notificar) {
          const nuevas = json.alerts.filter((a) => !notificadas.current.has(`${a.warehouseId}|${a.productId}`));
          nuevas.forEach((a) => {
            notificadas.current.add(`${a.warehouseId}|${a.productId}`);
            addNotification?.({
              title: a.severity === 'CRITICA' ? 'Capacidad de almacén rebasada' : 'Capacidad de almacén al límite',
              message: `${a.productCode} en ${a.warehouseName}: la demanda proyectada ocupa el ${a.utilizationPct}% de la capacidad.`,
              type: a.severity === 'CRITICA' ? 'CRITICA' : 'ADVERTENCIA',
              module: 'INVENTARIO',
            });
          });

          // Lo que dejó de estar en alerta se olvida, para que si vuelve a
          // superar el umbral se avise otra vez.
          const activas = new Set(json.alerts.map((a) => `${a.warehouseId}|${a.productId}`));
          notificadas.current.forEach((k) => {
            if (!activas.has(k)) notificadas.current.delete(k);
          });
        }
      } catch (err: any) {
        setError(err?.message || 'No se pudieron consultar las alertas.');
      } finally {
        setCargando(false);
      }
    },
    [umbral, addNotification]
  );

  useEffect(() => {
    cargar();
    const t = setInterval(() => cargar(), INTERVALO_MS);
    return () => clearInterval(t);
  }, [cargar]);

  const criticas = (data?.alerts || []).filter((a) => a.severity === 'CRITICA');
  const porAlmacen = (data?.alerts || []).reduce((acc, a) => {
    (acc[a.warehouseName] ||= []).push(a);
    return acc;
  }, {} as Record<string, CapacityAlert[]>);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <BellRing className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Centro de alerta temprana</h3>
            </div>
            <p className="max-w-2xl text-xs leading-relaxed text-slate-600">
              Avisa cuando la demanda proyectada a 2 meses ocupa más del umbral de la capacidad
              de almacenamiento. Se revisa cada 5 minutos mientras esta pantalla esté abierta.
            </p>
          </div>

          <div className="no-print flex items-center gap-2">
            <label className="text-[11px] font-semibold text-slate-600" htmlFor="umbral-capacidad">
              Umbral
            </label>
            <select
              id="umbral-capacidad"
              value={umbral}
              onChange={(e) => setUmbral(Number(e.target.value))}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              {[70, 80, 85, 90, 100].map((v) => (
                <option key={v} value={v}>{v}%</option>
              ))}
            </select>
            <button
              onClick={() => cargar()}
              disabled={cargando}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw className={`h-3 w-3 ${cargando ? 'animate-spin' : ''}`} />
              Revisar
            </button>
          </div>
        </div>

        {data && (
          <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 sm:grid-cols-4">
            <Dato titulo="Alertas activas" valor={String(data.alerts.length)} tono={data.alerts.length ? 'text-amber-600' : 'text-emerald-600'} />
            <Dato titulo="Críticas" valor={String(criticas.length)} tono={criticas.length ? 'text-red-600' : 'text-slate-400'} />
            <Dato titulo="Evaluados" valor={String(data.evaluated)} tono="text-slate-700" />
            <Dato titulo="Sin capacidad" valor={String(data.withoutCapacity)} tono="text-slate-400" />
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <span className="text-xs text-red-800">{error}</span>
        </div>
      )}

      {data && data.withoutCapacity > 0 && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-[11px] leading-relaxed text-amber-800">
            {data.withoutCapacity} registro(s) de inventario no tienen capacidad máxima
            configurada y quedaron fuera del análisis. No se asume una capacidad por omisión:
            eso produciría alertas inventadas. Configura el stock máximo por almacén para
            incluirlos.
          </p>
        </div>
      )}

      {data && data.alerts.length === 0 && !cargando && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <div>
              <h4 className="text-xs font-bold text-emerald-900">Sin alertas de capacidad</h4>
              <p className="text-[11px] text-emerald-700">
                {data.evaluated > 0
                  ? `Ningún material supera el ${umbral}% de la capacidad de su almacén en los ${data.horizonMonths} meses proyectados.`
                  : 'No hay materiales con capacidad configurada y demanda proyectada que evaluar.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {(Object.entries(porAlmacen) as [string, CapacityAlert[]][]).map(([almacen, lista]) => (
        <div key={almacen} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
            <Warehouse className="h-3.5 w-3.5 text-slate-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">{almacen}</h4>
            <span className="text-[11px] text-slate-500">{lista.length} material(es)</span>
          </div>

          <div className="divide-y divide-slate-100">
            {lista.map((a) => (
              <div key={`${a.warehouseId}-${a.productId}`} className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-3">
                  {a.severity === 'CRITICA' ? (
                    <PackageX className="h-4 w-4 shrink-0 text-red-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-xs font-bold text-slate-900">{a.productName}</span>
                      <span className="shrink-0 rounded-sm bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">
                        {a.productCode}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-600">{a.message}</p>
                  </div>

                  <div className="shrink-0 text-right">
                    <div
                      className={`font-mono text-lg font-bold ${
                        a.severity === 'CRITICA' ? 'text-red-600' : 'text-amber-600'
                      }`}
                    >
                      {a.utilizationPct}%
                    </div>
                    <div className="text-[10px] text-slate-400">de capacidad</div>
                  </div>
                </div>

                {/* Barra de ocupación. Se corta visualmente en 100 aunque el
                    porcentaje lo supere, pero el número real sigue a la vista. */}
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${a.severity === 'CRITICA' ? 'bg-red-600' : 'bg-amber-500'}`}
                    style={{ width: `${Math.min(a.utilizationPct, 100)}%` }}
                  />
                </div>

                <div className="mt-1.5 flex flex-wrap gap-x-4 text-[10px] text-slate-500">
                  <span>Existencia <b className="text-slate-700">{fmt(a.currentStock)}</b> {a.unit}</span>
                  <span>Capacidad <b className="text-slate-700">{fmt(a.capacity)}</b> {a.unit}</span>
                  <span>Demanda proyectada <b className="text-slate-700">{fmt(a.projectedDemand)}</b> {a.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const Dato: React.FC<{ titulo: string; valor: string; tono: string }> = ({ titulo, valor, tono }) => (
  <div>
    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{titulo}</div>
    <div className={`font-mono text-xl font-bold ${tono}`}>{valor}</div>
  </div>
);
