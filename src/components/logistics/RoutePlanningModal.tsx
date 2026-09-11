import React, { useState, useMemo, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import { Order, Vehicle, Driver, Warehouse, AIRouteRecommendation, Route } from '../../types/erp';
import {
  X,
  Truck,
  User,
  MapPin,
  Calendar,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowUpDown,
  Compass,
  DollarSign,
  Fuel,
  Info,
  Clock,
  Lock,
  FileText
} from 'lucide-react';
import { validateLogisticsReadiness } from '../../utils/logisticsValidation';
import { LoadingSheetPrintModal } from './LoadingSheetPrintModal';

interface RoutePlanningModalProps {
  initialSelectedOrderIds?: string[];
  onClose: () => void;
  onRouteCreated: (routeId: string) => void;
}

export const RoutePlanningModal: React.FC<RoutePlanningModalProps> = ({
  initialSelectedOrderIds = [],
  onClose,
  onRouteCreated,
}) => {
  const {
    routes,
    orders,
    vehicles,
    drivers,
    warehouses,
    customers,
    products,
    pickings,
    createRoute,
    generateAIRouteRecommendation,
  } = useERP();

  const [viewingShippingSheetRoute, setViewingShippingSheetRoute] = useState<Route | null>(null);

  // ESC key handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (viewingShippingSheetRoute) {
          setViewingShippingSheetRoute(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, viewingShippingSheetRoute]);

  // Validate canonical logistics readiness for each order
  const orderReadinessMap = useMemo(() => {
    const map: Record<string, ReturnType<typeof validateLogisticsReadiness>> = {};
    orders.forEach((ord) => {
      const associatedPicking = pickings.find((p) => p.orderId === ord.id || p.orderFolio === ord.folio);
      map[ord.id] = validateLogisticsReadiness(ord, associatedPicking);
    });
    return map;
  }, [orders, pickings]);

  // Orders available for logistics (Confirmed, Ready, or Fulfill partial/complete)
  const candidateOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        o.status === 'LISTO_PARA_EMBARQUE' ||
        o.status === 'SURTIDO' ||
        o.status === 'RESERVADO' ||
        o.status === 'CONFIRMADO'
    );
  }, [orders]);

  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>(() => {
    if (initialSelectedOrderIds.length > 0) {
      // Only keep orders that pass the logistics lock
      return initialSelectedOrderIds.filter((id) => {
        const ord = orders.find((o) => o.id === id);
        const p = pickings.find((pk) => pk.orderId === id || pk.orderFolio === ord?.folio);
        return validateLogisticsReadiness(ord, p).isReady;
      });
    }
    return candidateOrders
      .filter((o) => {
        const p = pickings.find((pk) => pk.orderId === o.id || pk.orderFolio === o.folio);
        return validateLogisticsReadiness(o, p).isReady;
      })
      .slice(0, 3)
      .map((o) => o.id);
  });

  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [warehouseId, setWarehouseId] = useState<string>(() => warehouses[0]?.id || 'WH-01');
  const [zone, setZone] = useState<string>('Corredor Metropolitano Industrial');
  const [notes, setNotes] = useState<string>('');

  // Selected vehicle & driver
  const availableVehicles = useMemo(() => vehicles.filter((v) => v.status === 'AVAILABLE'), [vehicles]);
  const availableDrivers = useMemo(() => drivers.filter((d) => d.status === 'ACTIVO'), [drivers]);

  const [vehicleId, setVehicleId] = useState<string>(() => availableVehicles[0]?.id || vehicles[0]?.id || '');
  const [driverId, setDriverId] = useState<string>(() => availableDrivers[0]?.id || drivers[0]?.id || '');

  // AI Recommendation State
  const [aiAnalysis, setAiAnalysis] = useState<AIRouteRecommendation | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Compute total load metrics of currently selected orders
  const loadMetrics = useMemo(() => {
    const selected = (orders || []).filter((o) => (selectedOrderIds || []).includes(o.id));
    let totalWeight = 0;
    let totalVolume = 0;
    let totalUnits = 0;

    selected.forEach((o) => {
      o.items.forEach((itm) => {
        const qty = itm.quantityFulfilled > 0 ? itm.quantityFulfilled : itm.quantityOrdered;
        const prod = products.find((p) => p.id === itm.productId || p.sku === itm.sku);
        const unitWeight = (prod?.cost || 20) * 0.08 + 2;
        const unitVol = 0.05 + ((prod?.cost || 100) / 2000);

        totalWeight += unitWeight * qty;
        totalVolume += unitVol * qty;
        totalUnits += qty;
      });
    });

    const activeVehicle = vehicles.find((v) => v.id === vehicleId);
    const maxWeight = activeVehicle?.capacityWeight || 3500;
    const maxVolume = activeVehicle?.capacityVolume || 18;

    const weightPct = Math.min(100, Math.round((totalWeight / maxWeight) * 100));
    const volumePct = Math.min(100, Math.round((totalVolume / maxVolume) * 100));
    const isOverweight = totalWeight > maxWeight;
    const isOvervolume = totalVolume > maxVolume;

    return {
      totalWeight: Math.round(totalWeight),
      totalVolume: Math.round(totalVolume * 10) / 10,
      totalUnits,
      maxWeight,
      maxVolume,
      weightPct,
      volumePct,
      isOverweight,
      isOvervolume,
      vehicle: activeVehicle,
    };
  }, [orders, selectedOrderIds, products, vehicles, vehicleId]);

  const handleToggleOrder = (orderId: string) => {
    const readiness = orderReadinessMap[orderId];
    if (!readiness?.isReady) {
      alert(`BLOQUEO LOGÍSTICO ACTIVO (Observación #12):\n${readiness?.reason || 'El pedido no cuenta con surtido físico ni picking completado en almacén.'}`);
      return;
    }
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const handleRunAIRecommendation = () => {
    if (selectedOrderIds.length === 0) return;
    setIsGeneratingAI(true);
    setTimeout(() => {
      const rec = generateAIRouteRecommendation(selectedOrderIds, warehouseId);
      setAiAnalysis(rec);
      if (rec.recommendedVehicleId) setVehicleId(rec.recommendedVehicleId);
      if (rec.recommendedDriverId) setDriverId(rec.recommendedDriverId);
      setIsGeneratingAI(false);
    }, 600);
  };

  const handleCreateRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedOrderIds.length === 0) {
      alert('Debes seleccionar al menos un pedido para armar la ruta.');
      return;
    }

    // Validar bloqueo en todos los pedidos seleccionados
    for (const id of selectedOrderIds) {
      const readiness = orderReadinessMap[id];
      if (!readiness?.isReady) {
        alert(`NO ES POSIBLE PROGRAMAR RUTA:\n${readiness?.reason || 'Pedido sin surtido físico confirmado.'}`);
        return;
      }
    }

    if (!vehicleId) {
      alert('Selecciona un vehículo de transporte.');
      return;
    }
    if (!driverId) {
      alert('Selecciona un operador / chofer.');
      return;
    }

    if (loadMetrics.isOverweight || loadMetrics.isOvervolume) {
      const confirmExceed = window.confirm(
        'El peso o volumen supera la capacidad de la unidad seleccionada. ¿Deseas continuar de todas formas?'
      );
      if (!confirmExceed) return;
    }

    const res = createRoute({
      date,
      warehouseId,
      vehicleId,
      driverId,
      zone,
      notes,
      orderIds: selectedOrderIds,
    });

    if (res.success && res.route) {
      onRouteCreated(res.route.id);
    } else {
      alert(res.error || 'No se pudo crear la ruta.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 my-6 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Programación y Despacho de Ruta de Entrega
              </h2>
              <p className="text-xs text-slate-500">
                Consolidación de pedidos listos para embarque y asignación de flota
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {routes.length > 0 && (
              <button
                type="button"
                id="btn-open-shipping-sheet-planner"
                onClick={() => setViewingShippingSheetRoute(routes[0])}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Consultar Hoja de Envío"
              >
                <FileText className="h-3.5 w-3.5 text-slate-500" />
                Hoja de Envío
              </button>
            )}
            <button
              onClick={onClose}
              id="btn-close-planner-modal"
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="overflow-y-auto pr-1 py-4 space-y-5 text-xs">
          {/* Top Form Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Fecha de Salida
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 bg-white font-semibold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Almacén de Origen
              </label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 bg-white font-semibold text-slate-900"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Zona / Corredor Logístico
              </label>
              <input
                type="text"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                placeholder="Ej. CDMX Norte / Naucalpan"
                className="w-full p-2 rounded-lg border border-slate-300 bg-white text-slate-900"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleRunAIRecommendation}
                disabled={isGeneratingAI || selectedOrderIds.length === 0}
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-gradient-to-r from-blue-700 to-indigo-700 text-white font-bold text-xs shadow-xs hover:from-blue-800 hover:to-indigo-800 disabled:opacity-50 transition-all"
              >
                <Sparkles className="h-4 w-4 text-amber-300" />
                {isGeneratingAI ? 'Optimizando...' : 'Optimizar con IA'}
              </button>
            </div>
          </div>

          {/* AI Route Recommendation Callout */}
          {aiAnalysis && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  CONSCORE AI: Recomendación de Ruta y Estiba (Score: {aiAnalysis.optimizationScore}/100)
                </div>
                <span className="rounded-full bg-indigo-100 text-indigo-800 px-2.5 py-0.5 text-[10px] font-bold">
                  Distancia Est: {aiAnalysis.estimatedTotalDistanceKm} km · {aiAnalysis.estimatedTotalDurationMinutes} mins
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                  <span className="text-slate-400 text-[10px] block uppercase font-bold">Unidad Óptima</span>
                  <b className="text-slate-900">{aiAnalysis.recommendedVehicleName}</b>
                  <span className="text-slate-500 block text-[10px]">
                    Capacidad: {aiAnalysis.capacityUtilizationPct.weightPct}% peso | {aiAnalysis.capacityUtilizationPct.volumePct}% vol
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                  <span className="text-slate-400 text-[10px] block uppercase font-bold">Operador Asignado</span>
                  <b className="text-slate-900">{aiAnalysis.recommendedDriverName}</b>
                  <span className="text-slate-500 block text-[10px]">Licencia Federal Vigente</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                  <span className="text-slate-400 text-[10px] block uppercase font-bold">Costo Est. Combustible</span>
                  <b className="text-emerald-700">${(Number(aiAnalysis.estimatedFuelCostMxn) || 0).toLocaleString('es-MX')} MXN</b>
                  <span className="text-slate-500 block text-[10px]">Incluye casetas estimadas</span>
                </div>
              </div>

              {/* LIFO Loading Instructions */}
              <div className="bg-white p-3 rounded-lg border border-indigo-100">
                <span className="font-bold text-slate-800 text-[11px] block mb-1 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-indigo-600" />
                  Secuencia de Carga y Estiba LIFO Recomendada:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                  {aiAnalysis.loadingOrderAdvice.map((advice) => (
                    <div key={advice.loadingOrder} className="p-1.5 bg-slate-50 rounded border border-slate-200">
                      <b className="text-indigo-800">Paso {advice.loadingOrder} ({advice.orderNumber}):</b>{' '}
                      <span className="text-slate-700">{advice.advice}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Vehicle & Driver Assignment Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Vehicle Selection */}
            <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2">
              <label className="block text-[11px] font-bold uppercase text-slate-700 flex items-center justify-between">
                <span>Vehículo de Transporte</span>
                <span className="text-[10px] font-normal text-slate-500">
                  {availableVehicles.length} disponibles
                </span>
              </label>
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900 bg-white"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.economicNumber} - {v.brandModel} ({v.type}) [{v.capacityWeight}kg / {v.capacityVolume}m³] - {v.status === 'AVAILABLE' ? 'DISPONIBLE' : v.status}
                  </option>
                ))}
              </select>

              {/* Vehicle Capacity Progress Bars */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[10px]">
                  <span className="font-semibold text-slate-600">
                    Carga en Peso: {(Number(loadMetrics.totalWeight) || 0).toLocaleString('es-MX')} / {(Number(loadMetrics.maxWeight) || 0).toLocaleString('es-MX')} kg
                  </span>
                  <span className={`font-bold ${loadMetrics.isOverweight ? 'text-red-600' : 'text-slate-800'}`}>
                    {loadMetrics.weightPct}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      loadMetrics.isOverweight ? 'bg-red-500' : loadMetrics.weightPct > 85 ? 'bg-amber-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${Math.min(100, loadMetrics.weightPct)}%` }}
                  />
                </div>

                <div className="flex justify-between text-[10px]">
                  <span className="font-semibold text-slate-600">
                    Carga en Volumen: {loadMetrics.totalVolume} / {loadMetrics.maxVolume} m³
                  </span>
                  <span className={`font-bold ${loadMetrics.isOvervolume ? 'text-red-600' : 'text-slate-800'}`}>
                    {loadMetrics.volumePct}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      loadMetrics.isOvervolume ? 'bg-red-500' : loadMetrics.volumePct > 85 ? 'bg-amber-500' : 'bg-emerald-600'
                    }`}
                    style={{ width: `${Math.min(100, loadMetrics.volumePct)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Driver Selection */}
            <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2">
              <label className="block text-[11px] font-bold uppercase text-slate-700 flex items-center justify-between">
                <span>Operador / Chofer Asignado</span>
                <span className="text-[10px] font-normal text-slate-500">
                  {availableDrivers.length} en base
                </span>
              </label>
              <select
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900 bg-white"
              >
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.employeeId}) - Lic: {d.licenseType} [{d.status}]
                  </option>
                ))}
              </select>

              {/* Driver info card */}
              {(() => {
                const selDriver = drivers.find((d) => d.id === driverId);
                return selDriver ? (
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-[10px] space-y-0.5">
                    <p className="text-slate-700">
                      <b>Licencia:</b> {selDriver.licenseNumber} ({selDriver.licenseType}) · Vigencia:{' '}
                      <span className="text-slate-900 font-semibold">{selDriver.licenseExpiration}</span>
                    </p>
                    <p className="text-slate-700">
                      <b>Teléfono Móvil:</b> {selDriver.phone} · <b>Estatus:</b> {selDriver.status}
                    </p>
                  </div>
                ) : null;
              })()}
            </div>
          </div>

          {/* Orders Selection Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900">
                  Pedidos Disponibles para Embarque ({selectedOrderIds.length} seleccionados)
                </span>
                <p className="text-[10px] text-slate-500">
                  Marca los pedidos confirmados y listos para consolidar en esta ruta
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrderIds(candidateOrders.filter((o) => orderReadinessMap[o.id]?.isReady).map((o) => o.id))}
                  className="text-[10px] font-bold text-blue-600 hover:underline"
                >
                  Seleccionar Listos
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => setSelectedOrderIds([])}
                  className="text-[10px] font-bold text-slate-500 hover:underline"
                >
                  Limpiar
                </button>
              </div>
            </div>

            <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
              {candidateOrders.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No hay pedidos pendientes en estatus LISTO PARA EMBARQUE o SURTIDO.
                </div>
              ) : (
                candidateOrders.map((ord) => {
                  const isSelected = (selectedOrderIds || []).includes(ord.id);
                  const client = customers.find((c) => c.id === ord.customerId);
                  const readiness = orderReadinessMap[ord.id];
                  const isReady = !!readiness?.isReady;

                  // Calculate order weight approx
                  const orderUnits = ord.items.reduce((sum, i) => sum + i.quantityOrdered, 0);

                  return (
                    <div
                      key={ord.id}
                      onClick={() => handleToggleOrder(ord.id)}
                      className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                        !isReady
                          ? 'bg-slate-50/60 opacity-80 hover:bg-amber-50/30'
                          : isSelected
                          ? 'bg-blue-50/70 border-l-4 border-blue-600'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={!isReady}
                          onChange={() => {}}
                          className={`h-4 w-4 rounded text-blue-600 focus:ring-blue-500 ${
                            !isReady ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
                          }`}
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-mono font-bold text-blue-700">{ord.folio}</span>
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600">
                              {ord.status}
                            </span>
                            {isReady ? (
                              <span className="inline-flex items-center gap-1 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 text-[9px] font-bold">
                                <CheckCircle2 className="h-2.5 w-2.5" /> Surtido Confirmado
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 rounded bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 text-[9px] font-bold"
                                title={readiness?.reason}
                              >
                                <Lock className="h-2.5 w-2.5" /> Bloqueo Activo (Surtido Pendiente)
                              </span>
                            )}
                          </div>
                          <p className="font-bold text-slate-900 mt-0.5">{ord.customerName}</p>
                          <p className="text-[10px] text-slate-500">
                            {ord.deliveryAddress || client?.address || 'Dirección de obra'}
                          </p>
                          {!isReady && (
                            <p className="text-[10px] text-amber-700 mt-0.5 font-medium flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3 shrink-0 text-amber-600" />
                              {readiness?.reason}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-[11px] shrink-0 ml-2">
                        <p className="font-mono font-bold text-slate-900">${(Number(ord.total) || 0).toLocaleString('es-MX')} MXN</p>
                        <p className="text-[10px] text-slate-500">{orderUnits} unidades / {ord.items.length} partidas</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
              Instrucciones y Observaciones de Ruta
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Llevar pase de seguridad para contratistas. Contactar a residente de obra antes de llegar..."
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-4 shrink-0">
          <div className="text-xs text-slate-500">
            Total a cargar: <b>{(Number(loadMetrics.totalWeight) || 0).toLocaleString('es-MX')} kg</b> ({loadMetrics.totalUnits} piezas)
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCreateRoute}
              className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              Confirmar y Programar Ruta
            </button>
          </div>
        </div>
      </div>

      {viewingShippingSheetRoute && (
        <LoadingSheetPrintModal
          route={viewingShippingSheetRoute}
          onClose={() => setViewingShippingSheetRoute(null)}
        />
      )}
    </div>
  );
};
