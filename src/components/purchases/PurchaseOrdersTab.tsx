import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { PurchaseOrder, PurchaseOrderStatus } from '../../types/erp';
import {
  Search,
  Plus,
  Send,
  CheckCircle2,
  PackageCheck,
  Eye,
  FileText,
  Clock,
  Truck,
  XCircle,
  Download,
  DollarSign,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface PurchaseOrdersTabProps {
  onNewOrder: () => void;
  onReceiveOrder: (orderId: string) => void;
}

export const PurchaseOrdersTab: React.FC<PurchaseOrdersTabProps> = ({
  onNewOrder,
  onReceiveOrder,
}) => {
  const {
    purchaseOrders,
    approvePurchaseOrder,
    sendPurchaseOrderToSupplier,
    cancelPurchaseOrder,
  } = useERP();
  const { can, currentUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

  const filteredOrders = purchaseOrders.filter((po) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      (po.purchase_order_number || "").toLowerCase().includes(term) ||
      (po.supplier_name || "").toLowerCase().includes(term) ||
      (po.warehouse_name || "").toLowerCase().includes(term) ||
      (po.buyer_name || "").toLowerCase().includes(term) ||
      po.items.some(
        (it) =>
          (it.product_code || "").toLowerCase().includes(term) ||
          (it.product_name || "").toLowerCase().includes(term)
      );

    const matchesStatus = statusFilter === 'TODOS' || po.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: PurchaseOrderStatus) => {
    switch (status) {
      case 'RECEIVED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" /> Recibida Completa
          </span>
        );
      case 'PARTIAL_RECEIVED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs font-bold text-cyan-700 border border-cyan-200">
            <PackageCheck className="h-3 w-3" /> Recibo Parcial
          </span>
        );
      case 'SENT':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">
            <Send className="h-3 w-3" /> Enviada a Proveedor
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-200">
            <Truck className="h-3 w-3" /> Confirmada por Prov.
          </span>
        );
      case 'APROBADA':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" /> Aprobada
          </span>
        );
      case 'PENDIENTE_APROBACION':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 border border-amber-200">
            <Clock className="h-3 w-3" /> Por Aprobar
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700 border border-red-200">
            <XCircle className="h-3 w-3" /> Cancelada
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
            {status}
          </span>
        );
    }
  };

  const handleApprove = async (id: string) => {
    const res = await approvePurchaseOrder(id);
    if (!res.success) {
      alert(res.error || 'No se pudo aprobar la orden.');
    }
  };

  const handleSend = async (po: PurchaseOrder) => {
    const method = window.prompt(
      `Selecciona método de envío para ${po.supplier_name}:\n1: EMAIL\n2: WHATSAPP\n3: PORTAL`,
      'EMAIL'
    ) || 'EMAIL';

    await sendPurchaseOrderToSupplier(po.id, {
      sendMethod: method.toUpperCase() === 'WHATSAPP' ? 'WHATSAPP' : 'EMAIL',
      contactEmail: po.supplier_email,
      notes: `PO-${po.purchase_order_number}-ENVIO`,
    });
  };

  const handleCancel = async (id: string) => {
    const reason = window.prompt('Indica el motivo de cancelación de la orden:') || 'Cancelada por compras';
    await cancelPurchaseOrder(id, reason);
  };

  return (
    <div className="space-y-4">
      {/* Top Filter & Actions Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por orden PO, proveedor, almacén o producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-slate-50/50 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Estatus:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:outline-hidden"
            >
              <option value="TODOS">Todos</option>
              <option value="PENDIENTE_APROBACION">Por Aprobar</option>
              <option value="APROBADA">Aprobadas</option>
              <option value="SENT">Enviadas a Prov.</option>
              <option value="CONFIRMED">Confirmadas</option>
              <option value="PARTIAL_RECEIVED">Recibo Parcial</option>
              <option value="RECEIVED">Completadas</option>
              <option value="CANCELLED">Canceladas</option>
            </select>
          </div>
        </div>

        <button
          onClick={onNewOrder}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition shrink-0"
        >
          <Plus className="h-4 w-4" />
          Nueva Orden de Compra (PO)
        </button>
      </div>

      {/* Orders Table & Detail Layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className={`space-y-3 ${selectedOrder ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="px-3.5 py-3">No. Orden</th>
                    <th className="px-3.5 py-3">Proveedor</th>
                    <th className="px-3.5 py-3">Almacén Destino</th>
                    <th className="px-3.5 py-3">Fecha Emisión</th>
                    <th className="px-3.5 py-3">Entrega Prometida</th>
                    <th className="px-3.5 py-3 text-right">Total Factura</th>
                    <th className="px-3.5 py-3 text-right">Landed Cost</th>
                    <th className="px-3.5 py-3">Estatus</th>
                    <th className="px-3.5 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        No se encontraron órdenes de compra registradas con los filtros indicados.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((po) => {
                      const landed = po.landed_cost_total || po.total;
                      return (
                        <tr
                          key={po.id}
                          onClick={() => setSelectedOrder(po)}
                          className={`cursor-pointer transition hover:bg-slate-50/80 ${
                            selectedOrder?.id === po.id ? 'bg-indigo-50/60 font-semibold' : ''
                          }`}
                        >
                          <td className="px-3.5 py-3 font-mono font-bold text-indigo-600">
                            {po.purchase_order_number}
                          </td>
                          <td className="px-3.5 py-3 font-medium text-slate-900">
                            {po.supplier_name}
                          </td>
                          <td className="px-3.5 py-3 text-slate-600">{po.warehouse_name}</td>
                          <td className="px-3.5 py-3 text-slate-600">{po.order_date}</td>
                          <td className="px-3.5 py-3 text-slate-600">
                            {po.expected_date || po.expected_delivery_date || '—'}
                          </td>
                          <td className="px-3.5 py-3 text-right font-bold text-slate-900">
                            ${(Number(po.total) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} {po.currency}
                          </td>
                          <td className="px-3.5 py-3 text-right font-bold text-emerald-700">
                            ${(Number(landed) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-3.5 py-3">{getStatusBadge(po.status)}</td>
                          <td
                            className="px-3.5 py-3 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-center gap-1.5">
                              {po.status === 'PENDIENTE_APROBACION' && (
                                <button
                                  onClick={() => handleApprove(po.id)}
                                  className="rounded-md bg-emerald-50 p-1.5 text-emerald-600 hover:bg-emerald-100 transition"
                                  title="Aprobar Orden de Compra"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </button>
                              )}
                              {po.status === 'APROBADA' && (
                                <button
                                  onClick={() => handleSend(po)}
                                  className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2 py-1 text-[11px] font-bold text-white shadow-xs hover:bg-blue-700 transition"
                                  title="Enviar Orden a Proveedor"
                                >
                                  <Send className="h-3 w-3" />
                                  <span>Enviar</span>
                                </button>
                              )}
                              {['SENT', 'CONFIRMED', 'PARTIAL_RECEIVED'].includes(po.status) && (
                                <button
                                  onClick={() => onReceiveOrder(po.id)}
                                  className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                                  title="Registrar Recepción en Almacén"
                                >
                                  <PackageCheck className="h-3 w-3" />
                                  <span>Recibir</span>
                                </button>
                              )}
                              <button
                                onClick={() => setSelectedOrder(po)}
                                className="rounded-md bg-slate-100 p-1.5 text-slate-600 hover:bg-slate-200 transition"
                                title="Ver Detalle"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </div>
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

        {/* Selected Order Detail Drawer / Panel */}
        {selectedOrder && (
          <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-black text-slate-900">
                    {selectedOrder.purchase_order_number}
                  </span>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Proveedor: <b>{selectedOrder.supplier_name}</b> • Comprador:{' '}
                  <b>{selectedOrder.buyer_name}</b>
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Commercial Terms Summary */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <div>
                <span className="text-slate-500 block">Almacén Destino:</span>
                <span className="font-bold text-slate-800">{selectedOrder.warehouse_name}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Condiciones de Pago:</span>
                <span className="font-bold text-slate-800">{selectedOrder.payment_terms}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Fecha Promesa:</span>
                <span className="font-semibold text-slate-800">
                  {selectedOrder.expected_date || selectedOrder.expected_delivery_date || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Moneda:</span>
                <span className="font-bold text-slate-800">{selectedOrder.currency}</span>
              </div>
            </div>

            {/* Items List with Delivery Progress */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
                Partidas & Avance de Surtido ({selectedOrder.items.length})
              </span>
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden text-xs">
                {selectedOrder.items.map((it, idx) => {
                  const rec = it.quantity_received || 0;
                  const pct = Math.min(100, Math.round((rec / it.quantity_ordered) * 100));
                  return (
                    <div key={idx} className="p-2.5 space-y-1 hover:bg-slate-50">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">
                          [{it.product_code}] {it.product_name}
                        </span>
                        <span className="font-bold text-slate-900">
                          ${(Number(it.total) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>
                          Ordenado: <b>{it.quantity_ordered}</b> • Recibido: <b>{rec}</b> {it.unit} (
                          {pct}%)
                        </span>
                        <span>Costo Unit: ${(Number(it.unit_cost) || 0).toLocaleString()}</span>
                      </div>
                      {/* Mini progress bar */}
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            pct >= 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-cyan-500' : 'bg-slate-300'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Landed Cost Breakdown Card */}
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Mercancía:</span>
                <span className="font-medium text-slate-800">
                  ${(Number(selectedOrder.subtotal) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>IVA Trasladado (16%):</span>
                <span className="font-medium text-slate-800">
                  ${(Number(selectedOrder.tax) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-emerald-200/60 pt-1">
                <span>Total Factura Proveedor:</span>
                <span className="text-indigo-600">
                  ${(Number(selectedOrder.total) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}{' '}
                  {selectedOrder.currency}
                </span>
              </div>
              {(selectedOrder.freight_cost || selectedOrder.insurance_cost || selectedOrder.customs_cost) ? (
                <div className="border-t border-emerald-200/60 pt-1 flex justify-between text-emerald-800 font-bold">
                  <span>Costo Puesto en Almacén (Landed Total):</span>
                  <span>
                    ${(selectedOrder.landed_cost_total || selectedOrder.total).toLocaleString('es-MX', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              ) : null}
            </div>

            {/* Order actions footer */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
              {['SENT', 'CONFIRMED', 'PARTIAL_RECEIVED'].includes(selectedOrder.status) && (
                <button
                  onClick={() => onReceiveOrder(selectedOrder.id)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
                >
                  <PackageCheck className="h-4 w-4" />
                  <span>Recibir Mercancía en Andén</span>
                </button>
              )}

              {selectedOrder.status === 'APROBADA' && (
                <button
                  onClick={() => handleSend(selectedOrder)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
                >
                  <Send className="h-4 w-4" />
                  <span>Enviar Orden a Proveedor</span>
                </button>
              )}

              {selectedOrder.status !== 'CANCELLED' && selectedOrder.status !== 'RECEIVED' && (
                <button
                  onClick={() => handleCancel(selectedOrder.id)}
                  className="w-full rounded-lg border border-red-200 bg-red-50 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 transition"
                >
                  Cancelar Orden de Compra
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
