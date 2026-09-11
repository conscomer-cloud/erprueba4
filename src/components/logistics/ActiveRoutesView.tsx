import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Route, RouteStop, RouteStatus, DeliveryEvidence, FailureReason } from '../../types/erp';
import { LoadingSheetPrintModal } from './LoadingSheetPrintModal';
import { DriverDeliveryModal } from './DriverDeliveryModal';
import { DepartureChecklistModal } from './DepartureChecklistModal';
import {
  Truck,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Play,
  RotateCcw,
  User,
  ShieldCheck,
  Package,
  Phone,
  ChevronRight,
  ExternalLink,
  Ban,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface ActiveRoutesViewProps {
  onOpenNewRouteModal: () => void;
}

export const ActiveRoutesView: React.FC<ActiveRoutesViewProps> = ({ onOpenNewRouteModal }) => {
  const {
    routes,
    startRouteLoading,
    completeRouteLoadingAndDepart,
    updateStopStatus,
    registerDeliveryEvidence,
    registerDeliveryFailure,
    cancelRoute,
  } = useERP();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(() => routes[0]?.id || null);

  // Modals state
  const [printingRoute, setPrintingRoute] = useState<Route | null>(null);
  const [checklistRoute, setChecklistRoute] = useState<Route | null>(null);
  const [podDeliveryStop, setPodDeliveryStop] = useState<{ stop: RouteStop; routeId: string } | null>(null);

  const filteredRoutes = routes.filter((r) => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (
      searchQuery &&
      !(r.routeNumber || "").toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(r.driverName || "").toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(r.vehiclePlate || "").toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const activeRoute = routes.find((r) => r.id === selectedRouteId) || filteredRoutes[0] || null;

  const handleStartLoading = (routeId: string) => {
    const res = startRouteLoading(routeId);
    if (res && !res.success) {
      alert(res.error || 'Carga bloqueada: Todos los pedidos deben contar con surtido físico y picking confirmado.');
    }
  };

  const handleOpenDepartureChecklist = (route: Route) => {
    setChecklistRoute(route);
  };

  const handleConfirmDeparture = (checklist: any) => {
    if (!checklistRoute) return;
    const res = completeRouteLoadingAndDepart(checklistRoute.id, checklist);
    if (res && !res.success) {
      alert(res.error || 'Despacho bloqueado: Todos los pedidos deben contar con surtido físico y picking confirmado.');
      return;
    }
    setChecklistRoute(null);
  };

  const handleConfirmDeliveryFromModal = async (evidence: DeliveryEvidence, deliveredItems: any[]) => {
    if (!podDeliveryStop) return;
    const res = await registerDeliveryEvidence(podDeliveryStop.routeId, podDeliveryStop.stop.id, evidence, deliveredItems);
    if (res && !res.success) {
      throw new Error(res.error || 'Error al registrar evidencia POD');
    }
  };

  const handleConfirmFailureFromModal = (reason: FailureReason, comment: string, rescheduledDate?: string) => {
    if (!podDeliveryStop) return;
    registerDeliveryFailure(podDeliveryStop.routeId, podDeliveryStop.stop.id, reason, comment, rescheduledDate);
    setPodDeliveryStop(null);
  };

  const getStatusBadge = (status: RouteStatus) => {
    switch (status) {
      case 'PLANNED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-800">
            <Clock className="h-3 w-3" /> Programada
          </span>
        );
      case 'LOADING':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 animate-pulse">
            <Package className="h-3 w-3" /> En Carga / Andén
          </span>
        );
      case 'IN_ROUTE':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold text-indigo-800">
            <Truck className="h-3 w-3" /> En Tránsito
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
            <CheckCircle2 className="h-3 w-3" /> Completada
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">
            Cancelada
          </span>
        );
      default:
        return null;
    }
  };

  const getStopStatusBadge = (status: RouteStop['status']) => {
    switch (status) {
      case 'DELIVERED':
        return (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
            Entregado
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
            Parcial
          </span>
        );
      case 'FAILED':
        return (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">
            No Entregado
          </span>
        );
      case 'ARRIVED':
        return (
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
            En Sitio / Descarga
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
            Pendiente
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Buscar ruta, chofer, placas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-56 rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
          />
          <div className="flex rounded-xl bg-slate-100 p-1">
            {(['ALL', 'PLANNED', 'LOADING', 'IN_ROUTE', 'COMPLETED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {st === 'ALL'
                  ? 'Todas'
                  : st === 'PLANNED'
                  ? 'Programadas'
                  : st === 'LOADING'
                  ? 'En Carga'
                  : st === 'IN_ROUTE'
                  ? 'En Ruta'
                  : 'Completadas'}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onOpenNewRouteModal}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-colors"
        >
          <Truck className="h-4 w-4" />
          Nueva Ruta de Entrega
        </button>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Routes List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
            <span>Rutas Registradas ({filteredRoutes.length})</span>
            <span className="text-[11px] text-slate-400 font-normal">Selecciona para ver detalle</span>
          </div>

          {filteredRoutes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 text-xs">
              No se encontraron rutas con los filtros aplicados.
            </div>
          ) : (
            filteredRoutes.map((route) => {
              const isSelected = activeRoute?.id === route.id;
              const deliveredCount = route.stops.filter((s) => s.status === 'DELIVERED').length;
              const progressPct = Math.round((deliveredCount / (route.stops.length || 1)) * 100);

              return (
                <div
                  key={route.id}
                  onClick={() => setSelectedRouteId(route.id)}
                  className={`rounded-2xl border p-4 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/40 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-slate-900">{route.routeNumber}</span>
                        {getStatusBadge(route.status)}
                      </div>
                      <p className="text-xs font-semibold text-slate-700 mt-1">
                        {route.zone || 'Zona Metropolitana'}
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">{route.date}</span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Unidad</span>
                      <span className="font-semibold text-slate-800">{route.vehicleName}</span> ({route.vehiclePlate})
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Operador</span>
                      <span className="font-semibold text-slate-800">{route.driverName}</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>
                        Paradas: <b>{deliveredCount} / {route.stops.length}</b> entregadas
                      </span>
                      <span className="font-bold text-slate-700">{progressPct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          route.status === 'COMPLETED' ? 'bg-emerald-600' : 'bg-blue-600'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Selected Route Detail */}
        <div className="lg:col-span-7">
          {activeRoute ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-5">
              {/* Header with Title & Action Buttons */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{activeRoute.routeNumber}</h3>
                    {getStatusBadge(activeRoute.status)}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Almacén: <b>{activeRoute.warehouseName}</b> · Fecha: <b>{activeRoute.date}</b> · Zona:{' '}
                    <b>{activeRoute.zone}</b>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    id="btn-hoja-envio"
                    data-testid="btn-hoja-envio"
                    onClick={() => setPrintingRoute(activeRoute)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 shadow-2xs transition-colors cursor-pointer"
                    title="Abrir Hoja de Envío"
                  >
                    <FileText className="h-4 w-4 text-blue-600" />
                    Hoja de Envío
                  </button>

                  {/* Flow Action Buttons */}
                  {activeRoute.status === 'PLANNED' && (
                    <button
                      onClick={() => handleStartLoading(activeRoute.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700 transition-colors"
                    >
                      <Package className="h-4 w-4" />
                      Iniciar Carga en Andén
                    </button>
                  )}

                  {activeRoute.status === 'LOADING' && (
                    <button
                      onClick={() => handleOpenDepartureChecklist(activeRoute)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Liberar y Salir a Ruta
                    </button>
                  )}

                  {activeRoute.status !== 'COMPLETED' && activeRoute.status !== 'CANCELLED' && (
                    <button
                      onClick={() => {
                        if (window.confirm('¿Deseas cancelar esta ruta? Los pedidos regresarán a LISTO PARA EMBARQUE.')) {
                          cancelRoute(activeRoute.id, 'Cancelada por el usuario');
                        }
                      }}
                      className="inline-flex items-center gap-1 rounded-xl p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Cancelar Ruta"
                    >
                      <Ban className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Transportation Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Vehículo</span>
                  <span className="font-bold text-slate-900 block">{activeRoute.vehicleName}</span>
                  <span className="text-[11px] font-mono text-slate-500">{activeRoute.vehiclePlate}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Operador</span>
                  <span className="font-bold text-slate-900 block">{activeRoute.driverName}</span>
                  <span className="text-[11px] text-slate-500">{activeRoute.driverPhone}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Carga Consolidada</span>
                  <span className="font-bold text-slate-900 block">
                    {(Number(activeRoute.totalWeightKg) || 0).toLocaleString('es-MX')} kg
                  </span>
                  <span className="text-[11px] text-slate-500">{activeRoute.totalVolumeM3} m³ ({activeRoute.totalItems} pzas)</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Tiempo / Distancia</span>
                  <span className="font-bold text-slate-900 block">{activeRoute.estimatedDuration}</span>
                  <span className="text-[11px] text-slate-500">~{activeRoute.estimatedDistanceKm} km</span>
                </div>
              </div>

              {/* Stops & Deliveries Timeline */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center justify-between">
                  <span>Secuencia de Paradas y Entregas ({activeRoute.stops.length})</span>
                  <span className="text-[11px] font-normal text-slate-400">
                    Orden de descarga programado
                  </span>
                </h4>

                <div className="space-y-3">
                  {activeRoute.stops.map((stop, idx) => (
                    <div
                      key={stop.id}
                      className="rounded-xl border border-slate-200 bg-white p-3.5 hover:border-slate-300 transition-all space-y-2.5"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-800 font-bold font-mono text-xs">
                            {stop.orderIndex || idx + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-blue-700 text-xs">
                                {stop.orderNumber}
                              </span>
                              <span className="font-bold text-slate-900 text-xs">
                                {stop.customerName}
                              </span>
                              {getStopStatusBadge(stop.status)}
                            </div>
                            <p className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                              {stop.deliveryAddress} ({stop.city})
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Contacto: <b>{stop.contactName}</b> · Tel: {stop.phone} · Ventana: {stop.scheduledTime}
                            </p>
                          </div>
                        </div>

                        {/* Stop Action: POD Registration (Available when in route or loading) */}
                        {activeRoute.status !== 'CANCELLED' && (
                          <div>
                            {stop.status === 'DELIVERED' || stop.status === 'PARTIAL' || stop.evidence || (stop as any).deliveryEvidence ? (
                              <button
                                onClick={() => setPodDeliveryStop({ stop, routeId: activeRoute.id })}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-300 hover:bg-emerald-100 transition-colors"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                Ver Evidencia POD
                              </button>
                            ) : (
                              <button
                                onClick={() => setPodDeliveryStop({ stop, routeId: activeRoute.id })}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 transition-colors"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Registrar Entrega (POD)
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Items shipped in this stop */}
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-[10px] text-slate-600">
                        <span className="font-semibold text-slate-700 block mb-0.5">Partidas a entregar:</span>
                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                          {stop.items.map((itm, i) => (
                            <span key={i}>
                              • [<b>{itm.quantityShipped} {itm.unit}</b>] {itm.productName} ({itm.productCode})
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Evidence Summary if delivered */}
                      {(stop.evidence || (stop as any).deliveryEvidence) && (
                        <div className="p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200 text-[11px] text-emerald-900 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <div>
                              <b>Recibido por:</b> {(stop.evidence || (stop as any).deliveryEvidence).recipientName || (stop.evidence || (stop as any).deliveryEvidence).receivedByName}{' '}
                              {((stop.evidence || (stop as any).deliveryEvidence).recipientIdNumber || (stop.evidence || (stop as any).deliveryEvidence).receivedByRole) &&
                                `(${((stop.evidence || (stop as any).deliveryEvidence).recipientIdNumber || (stop.evidence || (stop as any).deliveryEvidence).receivedByRole)})`}
                            </div>
                            <span className="text-[10px] text-emerald-700 block font-mono">
                              Fecha/Hora: {(stop.evidence || (stop as any).deliveryEvidence).timestamp || (stop.evidence || (stop as any).deliveryEvidence).deliveryDate} · Firma digital capturada
                            </span>
                          </div>
                          <button
                            onClick={() => setPodDeliveryStop({ stop, routeId: activeRoute.id })}
                            className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-300 hover:bg-emerald-200 transition-colors flex items-center gap-1"
                          >
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            Ver POD
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400 text-xs">
              Selecciona una ruta para inspeccionar su despacho, paradas y control de entregas.
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {printingRoute && (
        <LoadingSheetPrintModal route={printingRoute} onClose={() => setPrintingRoute(null)} />
      )}

      {checklistRoute && (
        <DepartureChecklistModal
          route={checklistRoute}
          onConfirmDeparture={handleConfirmDeparture}
          onClose={() => setChecklistRoute(null)}
        />
      )}

      {podDeliveryStop && (
        <DriverDeliveryModal
          stop={podDeliveryStop.stop}
          routeId={podDeliveryStop.routeId}
          onConfirmDelivery={handleConfirmDeliveryFromModal}
          onConfirmFailure={handleConfirmFailureFromModal}
          onClose={() => setPodDeliveryStop(null)}
        />
      )}
    </div>
  );
};
