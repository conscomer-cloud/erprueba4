import React from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Truck,
  PackageCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  TrendingUp,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';

interface LogisticsDashboardProps {
  onNavigateTab: (tab: 'DASHBOARD' | 'EMBARQUES' | 'RUTAS' | 'FLOTA' | 'INCIDENCIAS') => void;
  onOpenNewRouteModal: () => void;
}

export const LogisticsDashboard: React.FC<LogisticsDashboardProps> = ({
  onNavigateTab,
  onOpenNewRouteModal,
}) => {
  const { logisticsKPIs, routes, vehicles, orders, logisticsIncidents } = useERP();

  const activeRoutes = routes.filter((r) => r.status === 'IN_ROUTE' || r.status === 'LOADING');
  const plannedRoutes = routes.filter((r) => r.status === 'PLANNED');

  return (
    <div className="space-y-6">
      {/* Top Banner KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* OTIF Master Metric */}
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-blue-900">
            <span className="text-[10px] font-bold uppercase tracking-wider">OTIF Global</span>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-blue-900">
            {logisticsKPIs.otif_percentage}%
          </p>
          <span className="text-[10px] text-blue-700 font-semibold">On-Time In-Full Meta &gt;95%</span>
        </div>

        {/* On-Time */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">A Tiempo (On-Time)</span>
            <Clock className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {logisticsKPIs.on_time_percentage}%
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold">Cumplimiento de Ventanas</span>
        </div>

        {/* In-Full */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Completo (In-Full)</span>
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {logisticsKPIs.in_full_percentage}%
          </p>
          <span className="text-[10px] text-slate-500">Sin mermas ni faltantes</span>
        </div>

        {/* Ready to Ship */}
        <div
          onClick={() => onNavigateTab('EMBARQUES')}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-blue-400 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Listos Embarque</span>
            <PackageCheck className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-amber-600">
            {logisticsKPIs.pedidos_listos_count}
          </p>
          <span className="text-[10px] text-slate-500">Pedidos para programar</span>
        </div>

        {/* Fleet in Route */}
        <div
          onClick={() => onNavigateTab('FLOTA')}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-blue-400 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Flota en Ruta</span>
            <Truck className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-indigo-600">
            {logisticsKPIs.vehiculos_en_ruta_count} / {vehicles.length}
          </p>
          <span className="text-[10px] text-slate-500">{logisticsKPIs.vehiculos_disponibles_count} disponibles en base</span>
        </div>

        {/* Active Incidents */}
        <div
          onClick={() => onNavigateTab('INCIDENCIAS')}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-red-400 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Incidencias</span>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-red-600">
            {logisticsKPIs.incidencias_activas_count}
          </p>
          <span className="text-[10px] text-red-600 font-semibold">Requieren atención</span>
        </div>
      </div>

      {/* Real-time Logistics Command Center */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Active Routes Live Monitor */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                  <Truck className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Rutas Activas en Tránsito y Andén</h3>
                  <p className="text-[11px] text-slate-500">Seguimiento en vivo de unidades y paradas programadas</p>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('RUTAS')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                Ver Todas ({routes.length}) <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {activeRoutes.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                No hay unidades en tránsito en este momento.
              </div>
            ) : (
              <div className="space-y-3">
                {activeRoutes.map((route) => {
                  const deliveredCount = route.stops.filter((s) => s.status === 'DELIVERED').length;
                  const progressPct = Math.round((deliveredCount / (route.stops.length || 1)) * 100);

                  return (
                    <div
                      key={route.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all space-y-2.5"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-blue-700 text-xs">{route.routeNumber}</span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                                route.status === 'IN_ROUTE'
                                  ? 'bg-indigo-100 text-indigo-800 animate-pulse'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {route.status === 'IN_ROUTE' ? 'En Tránsito' : 'Cargando en Andén'}
                            </span>
                            <span className="text-xs font-bold text-slate-800">{route.zone}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            Unidad: <b>{route.vehicleName}</b> ({route.vehiclePlate}) · Operador: <b>{route.driverName}</b>
                          </p>
                        </div>
                        <div className="text-right text-[11px]">
                          <span className="font-bold text-slate-900">{deliveredCount} / {route.stops.length} Entregados</span>
                          <span className="text-[10px] text-slate-500 block">
                            Carga: {(Number(route.totalWeightKg) || 0).toLocaleString('es-MX')} kg ({route.totalItems} pzas)
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>

                      {/* Stops pills preview */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {route.stops.map((stop, i) => (
                          <span
                            key={stop.id}
                            className={`rounded-lg px-2 py-1 text-[10px] font-semibold border ${
                              stop.status === 'DELIVERED'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : stop.status === 'PARTIAL'
                                ? 'bg-amber-50 border-amber-200 text-amber-800'
                                : stop.status === 'FAILED'
                                ? 'bg-red-50 border-red-200 text-red-800'
                                : 'bg-white border-slate-200 text-slate-700'
                            }`}
                          >
                            #{stop.orderIndex} {stop.customerName.slice(0, 16)}... ({stop.status})
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Quick Action & Dispatch Queue */}
        <div className="lg:col-span-4 space-y-4">
          {/* Quick Dispatch Box */}
          <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white shadow-xs">
            <h3 className="font-bold text-sm">Despacho Inteligente CONSCORE</h3>
            <p className="text-xs text-blue-100 mt-1 leading-relaxed">
              Consolida pedidos listos para entrega con optimización de estiba LIFO y cálculo automático de peso/volumen.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={onOpenNewRouteModal}
                className="w-full rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-blue-900 shadow-xs hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
              >
                <Truck className="h-4 w-4" />
                Crear Nueva Ruta
              </button>
            </div>
          </div>

          {/* Incidents / Alerts Summary */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                Alertas Operativas Recientes
              </h4>
              <button
                onClick={() => onNavigateTab('INCIDENCIAS')}
                className="text-[11px] font-bold text-blue-600 hover:underline"
              >
                Ver ({logisticsIncidents.length})
              </button>
            </div>

            <div className="space-y-2">
              {logisticsIncidents.slice(0, 3).map((inc) => (
                <div key={inc.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{inc.type}</span>
                    <span className="text-[10px] text-red-600 font-bold">{inc.severity}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 truncate">{inc.description}</p>
                  <span className="text-[10px] text-slate-400 font-mono block mt-1">
                    {inc.orderNumber} · {inc.customerName}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
