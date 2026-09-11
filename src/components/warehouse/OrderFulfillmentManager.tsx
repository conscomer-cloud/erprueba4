import React, { useState, useMemo } from 'react';
import {
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  Search,
  Box,
  Calendar,
  Printer,
  ShieldCheck,
  Check,
  Package,
  Layers,
  FileText,
  Clock,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { Order, OrderItem, Picking } from '../../types/erp';
import { PickingSheetModal } from './PickingSheetModal';

export const OrderFulfillmentManager: React.FC = () => {
  const {
    orders,
    products,
    reservations,
    warehouses,
    pickings,
    confirmPhysicalFulfillment,
    getOrCreatePicking,
    addNotification,
  } = useERP();
  const { currentUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDIENTE' | 'CONFIRMADO' | 'RESERVADO' | 'EN SURTIDO' | 'SURTIDO'>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [fulfillmentNotes, setFulfillmentNotes] = useState('');
  const [actionFeedback, setActionFeedback] = useState<{ text: string; ok: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal for clean printable & verifiable picking sheet
  const [pickingModalOrder, setPickingModalOrder] = useState<Order | null>(null);

  // Filter fulfillable orders
  const fulfillableOrders = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return orders.filter((o) => {
      const isFulfillable = ['PENDIENTE', 'CONFIRMADO', 'RESERVADO', 'EN SURTIDO', 'SURTIDO'].includes(o.status);
      if (!isFulfillable) return false;

      if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;

      if (q) {
        const matchFolio = (o.folio || '').toLowerCase().includes(q);
        const matchCustomer = (o.customerName || '').toLowerCase().includes(q);
        const matchSeller = o.sellerName?.toLowerCase().includes(q);
        if (!matchFolio && !matchCustomer && !matchSeller) return false;
      }

      return true;
    });
  }, [orders, searchTerm, statusFilter]);

  // Keep selectedOrder in sync with orders from context
  const currentSelectedOrder = useMemo(() => {
    if (!selectedOrder) return null;
    return orders.find((o) => o.id === selectedOrder.id) || selectedOrder;
  }, [orders, selectedOrder]);

  // Associated picking for current selected order
  const currentPicking: Picking | undefined = useMemo(() => {
    if (!currentSelectedOrder) return undefined;
    return pickings.find(
      (p) => p.orderId === currentSelectedOrder.id || p.orderFolio === currentSelectedOrder.folio
    );
  }, [pickings, currentSelectedOrder]);

  // Execute physical fulfillment
  const handleExecuteFulfillment = async (order: Order) => {
    if (currentUser?.role === 'VENDEDOR') {
      setActionFeedback({
        text: '❌ 403 Acceso Denegado: El rol VENDEDOR no cuenta con autorización para surtido de almacén.',
        ok: false,
      });
      return;
    }

    if (!currentPicking || (currentPicking.status !== 'COMPLETADO' && currentPicking.status !== 'VERIFICADO')) {
      setActionFeedback({
        text: '⚠️ El picking debe estar completado o verificado antes de confirmar el surtido físico. Abriendo Hoja de Picking para registrar las cantidades reales surtidas...',
        ok: false,
      });
      openPickingModal(order);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await confirmPhysicalFulfillment(order.id, currentPicking.id, fulfillmentNotes);
      if (res.success) {
        setActionFeedback({
          text: `✅ Surtido físico confirmado para pedido ${order.folio}. Partidas: ${res.summary?.itemsCount || currentPicking.items.length}, Unidades: ${res.summary?.unitsFulfilled || 0}. Stock descontado y Kardex registrado.`,
          ok: true,
        });
        setFulfillmentNotes('');
        setTimeout(() => setActionFeedback(null), 7000);
      } else {
        setActionFeedback({
          text: `❌ Error al confirmar surtido: ${res.error || 'Falla en validación de stock.'}`,
          ok: false,
        });
      }
    } catch (err: any) {
      setActionFeedback({
        text: `❌ Error inesperado: ${err?.message || 'Error del servidor'}`,
        ok: false,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPickingModal = (order: Order, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    // Ensure picking record is initialized
    getOrCreatePicking(order.id);
    setPickingModalOrder(order);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <ClipboardList className="h-5 w-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">Surtido de Pedidos y Picking</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestión operativa de picking con hoja de surtido de almacén, verificación en rack y confirmación de salida física en Kardex.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 bg-slate-100 rounded-lg text-slate-600 font-medium flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5 text-slate-500" />
            {fulfillableOrders.length} Pedidos en Proceso
          </span>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between shadow-xs ${
            actionFeedback.ok
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-red-50 text-red-900 border border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.ok ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
            )}
            <span>{actionFeedback.text}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-xs font-bold px-2 py-1 bg-white rounded border border-slate-200 hover:bg-slate-50 transition"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Filters bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por Folio (PED-...), Cliente o Vendedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(['ALL', 'CONFIRMADO', 'RESERVADO', 'EN SURTIDO', 'SURTIDO'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'ALL' ? 'Todos' : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Grid & Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Order list */}
        <div className="lg:col-span-1 space-y-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
            Pedidos para Surtido ({fulfillableOrders.length})
          </div>

          {fulfillableOrders.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800">No hay pedidos pendientes de surtir</p>
              <p className="text-xs text-slate-500 mt-1">Todos los pedidos se encuentran entregados o cancelados.</p>
            </div>
          ) : (
            fulfillableOrders.map((ord) => {
              const isSelected = currentSelectedOrder?.id === ord.id;
              const hasReservations = reservations.some(
                (r) => (r.orderId === ord.id || r.orderFolio === ord.folio) && r.status === 'ACTIVE'
              );
              const p = pickings.find((x) => x.orderId === ord.id || x.orderFolio === ord.folio);

              return (
                <div
                  key={ord.id}
                  onClick={() => setSelectedOrder(ord)}
                  className={`p-4 rounded-xl border transition cursor-pointer text-left ${
                    isSelected
                      ? 'bg-blue-50/50 border-blue-500 ring-1 ring-blue-500 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-slate-900">{ord.folio}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        ord.status === 'SURTIDO'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ord.status === 'RESERVADO'
                          ? 'bg-amber-100 text-amber-800'
                          : ord.status === 'EN SURTIDO'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {ord.status}
                    </span>
                  </div>

                  <p className="font-semibold text-sm text-slate-800 mt-1.5 truncate">{ord.customerName}</p>

                  <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {ord.orderDate}
                    </span>
                    <span className="font-bold text-slate-900">${(ord?.total || 0).toLocaleString('es-MX')} MXN</span>
                  </div>

                  {/* Picking Status & Quick Action */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    {p ? (
                      <span
                        className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full ${
                          p.status === 'VERIFICADO'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.status === 'COMPLETADO'
                            ? 'bg-blue-100 text-blue-800'
                            : p.status === 'EN_PROCESO'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.status === 'VERIFICADO' && <ShieldCheck className="h-3 w-3" />}
                        {p.status === 'VERIFICADO' ? 'Picking Verificado' : `Picking ${p.status}`}
                      </span>
                    ) : (
                      <span className="text-slate-400">Sin picking generado</span>
                    )}

                    <button
                      onClick={(e) => openPickingModal(ord, e)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 py-0.5 px-1.5 rounded hover:bg-blue-50 transition"
                      title="Ver / Imprimir Hoja de Picking"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Hoja
                    </button>
                  </div>

                  {hasReservations && (
                    <div className="mt-2 pt-1.5 border-t border-slate-50 flex items-center justify-between text-[10px] text-amber-700 font-medium">
                      <span className="flex items-center gap-1">
                        <Box className="h-3 w-3" /> Stock Apartado
                      </span>
                      <span>Listo para surtido</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Picking & Fulfillment Detail */}
        <div className="lg:col-span-2">
          {currentSelectedOrder ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-slate-900 font-mono">{currentSelectedOrder.folio}</h3>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        currentSelectedOrder.status === 'SURTIDO'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {currentSelectedOrder.status}
                    </span>

                    {currentPicking?.status === 'VERIFICADO' && (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Verificado por Jefe
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mt-1 font-medium">{currentSelectedOrder.customerName}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openPickingModal(currentSelectedOrder)}
                    className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                  >
                    <FileText className="h-4 w-4" />
                    Abrir Hoja de Picking
                  </button>
                </div>
              </div>

              {/* Order Metadata info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl text-xs">
                <div>
                  <span className="text-slate-500 block">Vendedor</span>
                  <span className="font-semibold text-slate-800">{currentSelectedOrder.sellerName || 'Ventas Directas'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Fecha Pedido</span>
                  <span className="font-semibold text-slate-800">{currentSelectedOrder.orderDate}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Almacén de Salida</span>
                  <span className="font-semibold text-slate-800">
                    {warehouses.find((w) => w.id === currentSelectedOrder.warehouseId)?.name || 'Almacén Central Tultitlán'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Monto Total</span>
                  <span className="font-bold text-blue-700">${(currentSelectedOrder?.total || 0).toLocaleString('es-MX')} MXN</span>
                </div>
              </div>

              {/* Picking Status Alert */}
              {currentPicking && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
                    currentPicking.status === 'VERIFICADO'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : currentPicking.status === 'COMPLETADO'
                      ? 'bg-blue-50 border-blue-200 text-blue-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {currentPicking.status === 'VERIFICADO' ? (
                      <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                    )}
                    <div>
                      <span className="font-bold">Estatus de Picking: {currentPicking.status}</span>
                      {currentPicking.verifiedByName && (
                        <p className="text-[11px] text-slate-600">
                          Certificado por: {currentPicking.verifiedByName} ({currentPicking.verifiedAt ? new Date(currentPicking.verifiedAt).toLocaleTimeString() : ''})
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => openPickingModal(currentSelectedOrder)}
                    className="px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-50 transition"
                  >
                    Ver Detalle Picking
                  </button>
                </div>
              )}

              {/* Line items picking checklist */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Box className="h-4 w-4 text-blue-600" />
                    Partidas a Surtir ({currentSelectedOrder.items?.length || 0})
                  </h4>
                  <span className="text-xs text-slate-500">Ubicaciones y existencias de almacén</span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                      <tr>
                        <th className="p-3">Código / SKU</th>
                        <th className="p-3">Descripción de Material</th>
                        <th className="p-3">Ubicación Rack</th>
                        <th className="p-3 text-right">Cant. Pedida</th>
                        <th className="p-3 text-right">Físico Disponible</th>
                        <th className="p-3 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentSelectedOrder.items?.map((item, idx) => {
                        const product = products.find((p) => p.id === item.productId || p.code === item.productCode);
                        const physStock = product?.stock ?? product?.physicalStock ?? 0;
                        const availStock = product?.availableStock ?? 0;
                        const hasEnoughStock = physStock >= item.quantity;
                        const loc = typeof product?.warehouseLocation === 'string'
                          ? product.warehouseLocation
                          : 'N1 / R-01 / P-01 / Niv-1';

                        return (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-3 font-mono font-bold text-slate-900">{item.productCode}</td>
                            <td className="p-3">
                              <p className="font-medium text-slate-800">{item.productName}</p>
                              <span className="text-[11px] text-slate-400">Unidad: {item.unit || product?.unit || 'PZA'}</span>
                            </td>
                            <td className="p-3 font-mono text-slate-700 bg-slate-50/50">
                              {loc}
                            </td>
                            <td className="p-3 text-right font-bold text-slate-900 text-sm">
                              {(item?.quantity || 0).toLocaleString('es-MX')}
                            </td>
                            <td className="p-3 text-right">
                              <span className={`font-bold ${physStock >= item.quantity ? 'text-emerald-700' : 'text-red-700'}`}>
                                {(physStock || 0).toLocaleString('es-MX')}
                              </span>
                              <span className="text-[10px] text-slate-400 block">({availStock} disponibles)</span>
                            </td>
                            <td className="p-3 text-center">
                              {hasEnoughStock ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  <Check className="h-3 w-3" /> Disponible
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                                  <AlertTriangle className="h-3 w-3" /> Faltante
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Fulfillment Actions & Notes */}
              {currentSelectedOrder.status !== 'SURTIDO' &&
              currentSelectedOrder.status !== 'ENTREGADO' &&
              currentSelectedOrder.status !== 'CANCELADO' ? (
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Observaciones de Surtido / Transportista
                    </label>
                    <span className="text-xs text-slate-500">Operador: {currentUser?.name || 'Almacén'}</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Ej. Surtido en tarima 3, flejado completo, entrega a chofer Juan Pérez..."
                    value={fulfillmentNotes}
                    onChange={(e) => setFulfillmentNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <p className="text-xs text-slate-600">
                      Al confirmar el surtido, se descontará automáticamente el stock físico y se registrará la salida en el Kardex.
                    </p>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => openPickingModal(currentSelectedOrder)}
                        className="px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition"
                      >
                        Ver Hoja de Picking
                      </button>
                      <button
                        onClick={() => handleExecuteFulfillment(currentSelectedOrder)}
                        disabled={isSubmitting}
                        className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-white text-xs font-bold rounded-xl transition shadow-xs ${
                          isSubmitting
                            ? 'bg-emerald-400 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700'
                        }`}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {isSubmitting ? 'Confirmando Surtido...' : 'Confirmar Surtido Físico'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Este pedido ya fue surtido físicamente y descontado de los inventarios de CONSCORE.</span>
                  </div>
                  <button
                    onClick={() => openPickingModal(currentSelectedOrder)}
                    className="px-3 py-1.5 bg-white border border-emerald-200 rounded-lg text-xs font-bold text-emerald-800 hover:bg-emerald-100/50 transition"
                  >
                    Ver Hoja de Picking
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
              <ClipboardList className="h-10 w-10 text-slate-400 mx-auto mb-3" />
              <h4 className="text-base font-semibold text-slate-700">Selecciona un pedido de la lista</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Haz clic en cualquier pedido pendiente de la izquierda para revisar la lista de materiales, verificar ubicaciones de rack y registrar el despacho de almacén.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Picking Sheet Modal (Dedicated Document & Physical Verification) */}
      {pickingModalOrder && (
        <PickingSheetModal
          order={pickingModalOrder}
          onClose={() => setPickingModalOrder(null)}
          onFulfillSuccess={() => {
            setActionFeedback({
              text: `✅ Surtido físico confirmado para el pedido ${pickingModalOrder.folio}.`,
              ok: true,
            });
            setTimeout(() => setActionFeedback(null), 6000);
          }}
        />
      )}
    </div>
  );
};
