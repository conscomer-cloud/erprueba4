import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { PurchaseRequest, PurchaseRequestStatus } from '../../types/erp';
import {
  Search,
  Filter,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Eye,
  FileCheck,
  AlertTriangle,
  ChevronDown,
  ShoppingBag,
} from 'lucide-react';

interface PurchaseRequestsTabProps {
  onNewRequest: () => void;
  onConvertToOrder: (requestId: string) => void;
}

export const PurchaseRequestsTab: React.FC<PurchaseRequestsTabProps> = ({
  onNewRequest,
  onConvertToOrder,
}) => {
  const { purchaseRequests, approvePurchaseRequest, rejectPurchaseRequest } = useERP();
  const { can, currentUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [priorityFilter, setPriorityFilter] = useState<string>('TODOS');
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);

  // Filtered requests
  const filtered = purchaseRequests.filter((pr) => {
    const term = searchTerm.toLowerCase().trim();
    const requester = pr.requester_name || (pr as any).requested_by_name || (pr as any).requestedByUserName || '';
    const whName = pr.warehouse_name || (pr as any).warehouseName || '';
    const just = pr.justification || (pr as any).observations || '';
    const sku = pr.sku || '';

    const matchesSearch =
      !term ||
      (pr.request_number || "").toLowerCase().includes(term) ||
      requester.toLowerCase().includes(term) ||
      whName.toLowerCase().includes(term) ||
      just.toLowerCase().includes(term) ||
      sku.toLowerCase().includes(term) ||
      (pr.items && pr.items.some(
        (it) =>
          (it.product_code || (it as any).productCode || "").toLowerCase().includes(term) ||
          (it.product_name || (it as any).productName || "").toLowerCase().includes(term)
      ));

    const matchesStatus =
      statusFilter === 'TODOS' ||
      pr.status === statusFilter ||
      (statusFilter === 'PENDIENTE_APROBACION' && (pr.status === 'PENDIENTE_APROBACION' || pr.status === 'PENDIENTE')) ||
      (statusFilter === 'PENDIENTE' && (pr.status === 'PENDIENTE_APROBACION' || pr.status === 'PENDIENTE'));

    const matchesPriority = priorityFilter === 'TODOS' || pr.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusBadge = (status: PurchaseRequestStatus | string) => {
    switch (status) {
      case 'APROBADA':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
            <CheckCircle className="h-3 w-3" /> Aprobada
          </span>
        );
      case 'PENDIENTE':
      case 'PENDIENTE_APROBACION':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 border border-amber-200">
            <Clock className="h-3 w-3" /> Por Atender / Aprobar
          </span>
        );
      case 'EN_COTIZACION':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">
            <ShoppingBag className="h-3 w-3" /> En Cotización
          </span>
        );
      case 'CONVERTIDA_A_ORDEN':
      case 'CONVERTIDA_OC':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-200">
            <FileCheck className="h-3 w-3" /> Convertida a OC
          </span>
        );
      case 'RECHAZADA':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700 border border-red-200">
            <XCircle className="h-3 w-3" /> Rechazada
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

  const getPriorityBadge = (prio: string) => {
    switch (prio) {
      case 'URGENTE':
        return (
          <span className="rounded-md bg-red-100 px-2 py-0.5 text-[11px] font-extrabold text-red-800 animate-pulse">
            URGENTE
          </span>
        );
      case 'ALTA':
        return <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">ALTA</span>;
      case 'MEDIA':
        return <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-800">MEDIA</span>;
      default:
        return <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">BAJA</span>;
    }
  };

  const handleApprove = async (id: string) => {
    await approvePurchaseRequest(id);
    if (selectedRequest?.id === id) {
      setSelectedRequest((prev) => (prev ? { ...prev, status: 'APROBADA' } : null));
    }
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt('Indica el motivo de rechazo de la solicitud:') || 'Presupuesto no asignado';
    await rejectPurchaseRequest(id, reason);
    if (selectedRequest?.id === id) {
      setSelectedRequest((prev) => (prev ? { ...prev, status: 'RECHAZADA' } : null));
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por folio, solicitante, producto o justificación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-slate-50/50 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Estatus:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-hidden"
            >
              <option value="TODOS">Todos</option>
              <option value="PENDIENTE_APROBACION">Por Aprobar</option>
              <option value="APROBADA">Aprobadas</option>
              <option value="EN_COTIZACION">En Cotización</option>
              <option value="CONVERTIDA_A_ORDEN">Convertidas a OC</option>
              <option value="RECHAZADA">Rechazadas</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Prioridad:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-hidden"
            >
              <option value="TODOS">Todas</option>
              <option value="URGENTE">Urgente</option>
              <option value="ALTA">Alta</option>
              <option value="MEDIA">Media</option>
              <option value="BAJA">Baja</option>
            </select>
          </div>
        </div>

        <button
          onClick={onNewRequest}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition shrink-0"
        >
          <Plus className="h-4 w-4" />
          Nueva Solicitud de Compra
        </button>
      </div>

      {/* Requests Table & Detail View Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className={`space-y-3 ${selectedRequest ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="px-3.5 py-3">Folio</th>
                    <th className="px-3.5 py-3">Prioridad</th>
                    <th className="px-3.5 py-3">Solicitante</th>
                    <th className="px-3.5 py-3">Almacén Destino</th>
                    <th className="px-3.5 py-3">Fecha Req.</th>
                    <th className="px-3.5 py-3 text-right">Monto Estimado</th>
                    <th className="px-3.5 py-3">Estatus</th>
                    <th className="px-3.5 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No se encontraron solicitudes de compra con los filtros indicados.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((pr) => (
                      <tr
                        key={pr.id}
                        onClick={() => setSelectedRequest(pr)}
                        className={`cursor-pointer transition hover:bg-slate-50/80 ${
                          selectedRequest?.id === pr.id ? 'bg-blue-50/60 font-semibold' : ''
                        }`}
                      >
                        <td className="px-3.5 py-3 font-mono font-bold text-blue-600">
                          {pr.request_number}
                        </td>
                        <td className="px-3.5 py-3">{getPriorityBadge(pr.priority)}</td>
                        <td className="px-3.5 py-3 font-medium text-slate-900">
                          {pr.requester_name || (pr as any).requested_by_name || (pr as any).requestedByUserName || 'Personal Almacén'}
                        </td>
                        <td className="px-3.5 py-3 text-slate-600">{pr.warehouse_name || (pr as any).warehouseName || 'Almacén Central'}</td>
                        <td className="px-3.5 py-3 text-slate-600">{pr.required_date || ((pr as any).requestedAt ? (pr as any).requestedAt.split('T')[0] : 'N/A')}</td>
                        <td className="px-3.5 py-3 text-right font-bold text-slate-900">
                          {pr.estimated_total && Number(pr.estimated_total) > 0
                            ? `$${(Number(pr.estimated_total)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`
                            : <span className="text-[11px] font-normal text-slate-400 italic">Por cotizar (SoD)</span>}
                        </td>
                        <td className="px-3.5 py-3">{getStatusBadge(pr.status)}</td>
                        <td className="px-3.5 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            {(pr.status === 'PENDIENTE_APROBACION' || pr.status === 'PENDIENTE') && (
                              <>
                                <button
                                  onClick={() => handleApprove(pr.id)}
                                  className="rounded-md bg-emerald-50 p-1.5 text-emerald-600 hover:bg-emerald-100 transition"
                                  title="Aprobar Solicitud"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleReject(pr.id)}
                                  className="rounded-md bg-red-50 p-1.5 text-red-600 hover:bg-red-100 transition"
                                  title="Rechazar Solicitud"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => onConvertToOrder(pr.id)}
                                  className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2 py-1 text-[11px] font-bold text-white shadow-xs hover:bg-indigo-700 transition"
                                  title="Generar Orden de Compra"
                                >
                                  <span>Crear OC</span>
                                  <ArrowRight className="h-3 w-3" />
                                </button>
                              </>
                            )}
                            {pr.status === 'APROBADA' && (
                              <button
                                onClick={() => onConvertToOrder(pr.id)}
                                className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2 py-1 text-[11px] font-bold text-white shadow-xs hover:bg-indigo-700 transition"
                                title="Generar Orden de Compra"
                              >
                                <span>Crear OC</span>
                                <ArrowRight className="h-3 w-3" />
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedRequest(pr)}
                              className="rounded-md bg-slate-100 p-1.5 text-slate-600 hover:bg-slate-200 transition"
                              title="Ver Detalle"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Selected Request Detail Drawer / Panel */}
        {selectedRequest && (
          <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-black text-slate-900">
                    {selectedRequest.request_number}
                  </span>
                  {getStatusBadge(selectedRequest.status)}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Solicitado el {new Date(selectedRequest.created_at).toLocaleString('es-MX')} por{' '}
                  <b>{selectedRequest.requester_name}</b>
                </p>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <div>
                <span className="text-slate-500 block">Almacén Destino:</span>
                <span className="font-bold text-slate-800">{selectedRequest.warehouse_name}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Prioridad:</span>
                <div>{getPriorityBadge(selectedRequest.priority)}</div>
              </div>
              <div>
                <span className="text-slate-500 block">Fecha Requerida:</span>
                <span className="font-semibold text-slate-800">{selectedRequest.required_date}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Presupuesto Estimado:</span>
                <span className="font-bold text-blue-700">
                  {selectedRequest.estimated_total && Number(selectedRequest.estimated_total) > 0
                    ? `$${(Number(selectedRequest.estimated_total)).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`
                    : 'Por cotizar en Compras (SoD)'}
                </span>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-600 block mb-1">Justificación:</span>
              <p className="text-xs bg-slate-50 p-2.5 rounded-lg text-slate-700 italic border border-slate-200/60">
                "{selectedRequest.justification || (selectedRequest as any).observations || 'Sin justificación adicional'}"
              </p>
            </div>

            {/* Items List */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
                Partidas Solicitadas ({selectedRequest.items.length})
              </span>
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden text-xs">
                {selectedRequest.items.map((it, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <div className="font-bold text-slate-900">
                        [{it.product_code || (it as any).productCode || selectedRequest.sku || 'PRD'}] {it.product_name || (it as any).productName || 'Material'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Cantidad: <b>{it.quantity || (selectedRequest as any).requestedQty || 1} {it.unit || 'PZA'}</b>
                        {it.estimated_unit_cost && Number(it.estimated_unit_cost) > 0 ? (
                          <> • Costo Est.: ${(Number(it.estimated_unit_cost)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</>
                        ) : (
                          <span className="ml-1 text-slate-400 italic">• Pendiente de cotizar por Compras</span>
                        )}
                        {it.suggested_supplier_name && (
                          <span className="ml-1 text-indigo-600 font-medium">
                            • Proveedor: {it.suggested_supplier_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right font-black text-slate-900">
                      {it.estimated_total && Number(it.estimated_total) > 0
                        ? `$${(Number(it.estimated_total)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
                        : <span className="text-slate-400 text-xs font-normal">--</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Converted OC Banner */}
            {((selectedRequest.status as string) === 'CONVERTIDA_A_ORDEN' || (selectedRequest as any).converted_purchase_order_number) && (
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/80 p-3 text-xs text-indigo-900 flex items-center justify-between">
                <div>
                  <div className="font-bold">Solicitud Convertida en Orden de Compra</div>
                  <div className="text-indigo-700">
                    Folio generado: <span className="font-mono font-bold">{(selectedRequest as any).converted_purchase_order_number || 'OC Generada'}</span>
                  </div>
                </div>
                <FileCheck className="h-5 w-5 text-indigo-600" />
              </div>
            )}

            {/* Approval Info / Actions */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              {(selectedRequest.status === 'PENDIENTE_APROBACION' || selectedRequest.status === 'PENDIENTE') && (
                <div className="flex w-full gap-2">
                  <button
                    onClick={() => handleReject(selectedRequest.id)}
                    className="flex-1 rounded-lg border border-red-200 bg-red-50 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition text-center"
                  >
                    Rechazar
                  </button>
                  <button
                    onClick={() => handleApprove(selectedRequest.id)}
                    className="flex-1 rounded-lg bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-xs text-center"
                  >
                    Aprobar
                  </button>
                  <button
                    onClick={() => onConvertToOrder(selectedRequest.id)}
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-indigo-600 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition text-center"
                  >
                    <span>Crear OC</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {selectedRequest.status === 'APROBADA' && (
                <button
                  onClick={() => onConvertToOrder(selectedRequest.id)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition"
                >
                  <FileCheck className="h-4 w-4" />
                  <span>Convertir a Orden de Compra Formal</span>
                </button>
              )}

              {selectedRequest.approved_by_name && (
                <div className="text-[11px] text-slate-500">
                  Aprobado por <b>{selectedRequest.approved_by_name}</b> el{' '}
                  {selectedRequest.approved_at ? new Date(selectedRequest.approved_at).toLocaleDateString('es-MX') : ''}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
