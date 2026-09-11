import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import { Order, OrderStatus } from '../../types/erp';
import {
  PackageCheck,
  Truck,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ExternalLink,
  Calendar,
  Layers,
  Sparkles,
  Lock
} from 'lucide-react';
import { validateLogisticsReadiness } from '../../utils/logisticsValidation';

interface EmbarquesTableProps {
  onPlanRouteWithOrders: (orderIds: string[]) => void;
}

export const EmbarquesTable: React.FC<EmbarquesTableProps> = ({ onPlanRouteWithOrders }) => {
  const { orders, customers, products, pickings } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // Canonical Logistics Readiness Map (Observación #12)
  const orderReadinessMap = useMemo(() => {
    const map: Record<string, ReturnType<typeof validateLogisticsReadiness>> = {};
    orders.forEach((o) => {
      const associatedPicking = pickings.find((p) => p.orderId === o.id || p.orderFolio === o.folio);
      map[o.id] = validateLogisticsReadiness(o, associatedPicking);
    });
    return map;
  }, [orders, pickings]);

  // Filter orders that are ready or in process of fulfillment
  const eligibleOrders = useMemo(() => {
    return orders.filter((o) => {
      // Must be at least confirmed or fulfilled
      const isValidLogisticsCandidate =
        o.status === 'LISTO_PARA_EMBARQUE' ||
        o.status === 'SURTIDO' ||
        o.status === 'RESERVADO' ||
        o.status === 'CONFIRMADO' ||
        o.status === 'PROGRAMADO' ||
        o.status === 'EN_PREPARACION_DE_CARGA' ||
        o.status === 'EN RUTA';

      if (!isValidLogisticsCandidate) return false;

      const isReady = orderReadinessMap[o.id]?.isReady;
      if (statusFilter === 'READY' && !isReady) return false;
      if (statusFilter === 'BLOCKED' && isReady) return false;
      if (statusFilter !== 'ALL' && statusFilter !== 'READY' && statusFilter !== 'BLOCKED' && o.status !== statusFilter) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesFolio = (o.folio || "").toLowerCase().includes(q);
        const matchesClient = (o.customerName || "").toLowerCase().includes(q);
        const matchesCity = (o.deliveryAddress || '').toLowerCase().includes(q);
        if (!matchesFolio && !matchesClient && !matchesCity) return false;
      }

      return true;
    });
  }, [orders, statusFilter, searchQuery, orderReadinessMap]);

  const selectableEligibleOrders = useMemo(() => {
    return eligibleOrders.filter((o) => orderReadinessMap[o.id]?.isReady);
  }, [eligibleOrders, orderReadinessMap]);

  const handleToggleSelectAll = () => {
    if (selectedOrderIds.length === selectableEligibleOrders.length && selectableEligibleOrders.length > 0) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(selectableEligibleOrders.map((o) => o.id));
    }
  };

  const handleToggleSelect = (orderId: string) => {
    const readiness = orderReadinessMap[orderId];
    if (!readiness?.isReady) {
      alert(`BLOQUEO LOGÍSTICO ACTIVO (Observación #12):\n${readiness?.reason || 'El pedido no cuenta con surtido físico ni picking completado en almacén.'}`);
      return;
    }
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const handleDispatchSelected = () => {
    if (selectedOrderIds.length === 0) {
      alert('Selecciona al menos un pedido para programar la ruta.');
      return;
    }
    for (const id of selectedOrderIds) {
      const readiness = orderReadinessMap[id];
      if (!readiness?.isReady) {
        alert(`NO ES POSIBLE PROGRAMAR RUTA: El pedido ${id} cuenta con bloqueo logístico activo.\n${readiness?.reason}`);
        return;
      }
    }
    onPlanRouteWithOrders(selectedOrderIds);
  };

  const getStatusBadge = (order: Order) => {
    const readiness = orderReadinessMap[order.id];
    const isReady = !!readiness?.isReady;

    if (!isReady) {
      return (
        <span
          className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[10px] font-bold text-amber-800"
          title={readiness?.reason}
        >
          <Lock className="h-3 w-3 text-amber-700" /> Bloqueo Activo (Surtido Pendiente)
        </span>
      );
    }

    switch (order.status) {
      case 'LISTO_PARA_EMBARQUE':
      case 'SURTIDO':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
            <CheckCircle2 className="h-3 w-3" /> Surtido Físico Confirmado
          </span>
        );
      case 'PROGRAMADO':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold text-indigo-800">
            <Calendar className="h-3 w-3" /> En Ruta Programada
          </span>
        );
      case 'EN RUTA':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold text-purple-800">
            <Truck className="h-3 w-3" /> En Tránsito
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">
            {order.status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Mesa de Embarques Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por folio, cliente, destino..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="flex rounded-xl bg-slate-100 p-1">
            {(['ALL', 'READY', 'BLOCKED', 'PROGRAMADO', 'EN RUTA'] as const).map((st) => (
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
                  ? 'Todos'
                  : st === 'READY'
                  ? 'Surtidos Confirmados'
                  : st === 'BLOCKED'
                  ? 'Bloqueados p/ Picking'
                  : st === 'PROGRAMADO'
                  ? 'Programados'
                  : 'En Tránsito'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDispatchSelected}
            disabled={selectedOrderIds.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Truck className="h-4 w-4" />
            Programar Ruta con Seleccionados ({selectedOrderIds.length})
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-600">
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectableEligibleOrders.length > 0 && selectedOrderIds.length === selectableEligibleOrders.length}
                    onChange={handleToggleSelectAll}
                    className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3">Folio Pedido</th>
                <th className="py-3 px-3">Cliente / Destino</th>
                <th className="py-3 px-3">Estatus Logístico</th>
                <th className="py-3 px-3 text-center">Partidas / Unidades</th>
                <th className="py-3 px-3 text-right">Peso Estimado</th>
                <th className="py-3 px-3 text-right">Total Pedido</th>
                <th className="py-3 px-3 text-center">Fecha Compromiso</th>
                <th className="py-3 px-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {eligibleOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    No se encontraron pedidos listos para despacho en la Mesa de Embarques.
                  </td>
                </tr>
              ) : (
                eligibleOrders.map((order) => {
                  const isSelected = (selectedOrderIds || []).includes(order.id);
                  const client = customers.find((c) => c.id === order.customerId);
                  const totalUnits = order.items.reduce((sum, i) => sum + i.quantityOrdered, 0);
                  const readiness = orderReadinessMap[order.id];
                  const isReady = !!readiness?.isReady;

                  // Calculate approximate weight
                  const estWeightKg = Math.round(
                    order.items.reduce((sum, itm) => {
                      const prod = products.find((p) => p.id === itm.productId || p.sku === itm.sku);
                      return sum + ((prod?.cost || 20) * 0.08 + 2) * itm.quantityOrdered;
                    }, 0)
                  );

                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        !isReady ? 'bg-slate-50/30' : isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={!isReady}
                          onChange={() => handleToggleSelect(order.id)}
                          className={`h-4 w-4 rounded text-blue-600 focus:ring-blue-500 ${
                            !isReady ? 'cursor-not-allowed opacity-30' : 'cursor-pointer'
                          }`}
                        />
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-blue-700">
                        {order.folio}
                      </td>
                      <td className="py-3.5 px-3">
                        <p className="font-bold text-slate-900">{order.customerName}</p>
                        <p className="text-[10px] text-slate-500 max-w-xs truncate">
                          {order.deliveryAddress || client?.address || 'Entrega en Obra Matriz'}
                        </p>
                      </td>
                      <td className="py-3.5 px-3">
                        {getStatusBadge(order)}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="font-semibold text-slate-800">{order.items.length} partidas</span>
                        <span className="text-[10px] text-slate-500 block">({totalUnits} piezas)</span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-semibold text-slate-900">
                        {(Number(estWeightKg) || 0).toLocaleString('es-MX')} kg
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                        ${(Number(order.total) || 0).toLocaleString('es-MX')}
                      </td>
                      <td className="py-3.5 px-3 text-center text-slate-600 font-mono text-[11px]">
                        {order.deliveryDate || order.orderDate}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        {isReady ? (
                          <button
                            onClick={() => onPlanRouteWithOrders([order.id])}
                            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            Despachar <ArrowRight className="h-3 w-3" />
                          </button>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 cursor-not-allowed"
                            title={readiness?.reason}
                          >
                            <Lock className="h-3 w-3 text-amber-600" /> Bloqueado
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
