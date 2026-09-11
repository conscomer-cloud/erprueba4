import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  FileCheck,
  AlertTriangle,
  Plus,
  ArrowRight,
  ShieldCheck,
  Layers,
  RefreshCw
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { PurchaseRequest, PurchaseRequestPriority, PurchaseRequestStatus } from '../../types/erp';

interface WarehouseReplenishmentRequestsListProps {
  onOpenNewRequestModal: () => void;
}

export const WarehouseReplenishmentRequestsList: React.FC<WarehouseReplenishmentRequestsListProps> = ({
  onOpenNewRequestModal,
}) => {
  const { purchaseRequests, lastSyncTimestamp } = useERP();
  const { currentUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [priorityFilter, setPriorityFilter] = useState<string>('TODOS');
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);

  // Filter requests
  const filtered = useMemo(() => {
    return purchaseRequests.filter((pr) => {
      const term = searchTerm.toLowerCase().trim();
      const targetSku = (pr.sku || pr.items?.[0]?.product_code || '').toLowerCase();
      const targetName = (pr.items?.[0]?.product_name || '').toLowerCase();
      const targetFolio = (pr.request_number || '').toLowerCase();
      const targetWh = (pr.warehouse_name || pr.warehouseName || '').toLowerCase();
      const targetJust = (pr.justification || pr.observations || '').toLowerCase();

      const matchesSearch =
        !term ||
        targetFolio.includes(term) ||
        targetSku.includes(term) ||
        targetName.includes(term) ||
        targetWh.includes(term) ||
        targetJust.includes(term);

      const matchesStatus =
        statusFilter === 'TODOS' ||
        pr.status === statusFilter ||
        (statusFilter === 'PENDIENTE' && (pr.status === 'PENDIENTE' || pr.status === 'PENDIENTE_APROBACION')) ||
        (statusFilter === 'EN_COTIZACION' && (pr.status === 'EN_COTIZACION' || pr.status === 'EN_REVISION')) ||
        (statusFilter === 'CONVERTIDA_OC' && (pr.status === 'CONVERTIDA_OC' || pr.status === 'CONVERTIDA_A_ORDEN'));

      const matchesPriority = priorityFilter === 'TODOS' || pr.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [purchaseRequests, searchTerm, statusFilter, priorityFilter]);

  const getStatusBadge = (status: PurchaseRequestStatus | string) => {
    switch (status) {
      case 'APROBADA':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
            <CheckCircle className="h-3 w-3" /> Aprobada por Compras
          </span>
        );
      case 'PENDIENTE':
      case 'PENDIENTE_APROBACION':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 border border-amber-200">
            <Clock className="h-3 w-3" /> En Bandeja de Compras
          </span>
        );
      case 'EN_COTIZACION':
      case 'EN_REVISION':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">
            <RefreshCw className="h-3 w-3" /> Cotizando Proveedores
          </span>
        );
      case 'CONVERTIDA_OC':
      case 'CONVERTIDA_A_ORDEN':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-200">
            <FileCheck className="h-3 w-3" /> OC Generada
          </span>
        );
      case 'RECHAZADA':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700 border border-red-200">
            <XCircle className="h-3 w-3" /> No Aprobada
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
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">
            Urgente
          </span>
        );
      case 'ALTA':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
            Alta
          </span>
        );
      case 'MEDIA':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
            Media
          </span>
        );
      case 'BAJA':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
            Baja
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Info & Action */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-bold shrink-0">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Solicitudes de Reabastecimiento Emitidas por Almacén
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                {filtered.length} registradas
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Seguimiento operativo en tiempo real del ciclo de abastecimiento gestionado por Compras.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenNewRequestModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Solicitar Reabastecimiento</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por folio (SC-...), SKU, material, almacén u observaciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-9 pr-3 py-1.5 text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 shrink-0">
            <Filter className="h-3.5 w-3.5" />
            <span>Estatus:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-600 focus:outline-hidden"
          >
            <option value="TODOS">Todos</option>
            <option value="PENDIENTE">En Bandeja de Compras</option>
            <option value="EN_COTIZACION">Cotizando Proveedores</option>
            <option value="APROBADA">Aprobadas</option>
            <option value="CONVERTIDA_OC">Convertidas a OC</option>
            <option value="RECHAZADA">Rechazadas</option>
          </select>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-semibold text-slate-500 shrink-0">Prioridad:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-600 focus:outline-hidden"
          >
            <option value="TODOS">Todas</option>
            <option value="URGENTE">Urgente</option>
            <option value="ALTA">Alta</option>
            <option value="MEDIA">Media</option>
            <option value="BAJA">Baja</option>
          </select>
        </div>
      </div>

      {/* Table & Detail Layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className={`space-y-3 ${selectedRequest ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="px-3.5 py-3">Folio</th>
                    <th className="px-3.5 py-3">Prioridad</th>
                    <th className="px-3.5 py-3">Material / SKU</th>
                    <th className="px-3.5 py-3 text-right">Cant. Req.</th>
                    <th className="px-3.5 py-3">Almacén</th>
                    <th className="px-3.5 py-3">Solicitante</th>
                    <th className="px-3.5 py-3">Estatus</th>
                    <th className="px-3.5 py-3 text-center">OC Vinculada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No se encontraron solicitudes de reabastecimiento con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((pr) => {
                      const item = pr.items?.[0];
                      const sku = pr.sku || item?.product_code || 'N/A';
                      const name = item?.product_name || pr.sku || 'Material operativo';
                      const qty = pr.requestedQty || item?.quantity || 1;
                      const unit = item?.unit || 'PZA';
                      const poFolio =
                        pr.converted_purchase_order_number ||
                        (pr as any).convertedPurchaseOrderNumber ||
                        null;

                      return (
                        <tr
                          key={pr.id}
                          onClick={() => setSelectedRequest(pr)}
                          className={`cursor-pointer transition hover:bg-slate-50/80 ${
                            selectedRequest?.id === pr.id ? 'bg-emerald-50/60 font-semibold' : ''
                          }`}
                        >
                          <td className="px-3.5 py-3 font-mono font-bold text-slate-900">
                            {pr.request_number}
                          </td>
                          <td className="px-3.5 py-3">{getPriorityBadge(pr.priority)}</td>
                          <td className="px-3.5 py-3">
                            <div className="font-bold text-slate-900 truncate max-w-[200px]">{name}</div>
                            <div className="font-mono text-[10px] text-slate-500">{sku}</div>
                          </td>
                          <td className="px-3.5 py-3 text-right font-bold text-slate-900">
                            {qty} {unit}
                          </td>
                          <td className="px-3.5 py-3 text-slate-700 truncate max-w-[140px]">
                            {pr.warehouse_name || pr.warehouseName || 'Almacén Central'}
                          </td>
                          <td className="px-3.5 py-3 text-slate-600 truncate max-w-[120px]">
                            {pr.requested_by_name || (pr as any).requestedByUserName || 'Almacén'}
                          </td>
                          <td className="px-3.5 py-3">{getStatusBadge(pr.status)}</td>
                          <td className="px-3.5 py-3 text-center">
                            {poFolio ? (
                              <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                                {poFolio}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">—</span>
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

        {/* Selected Request Detail Drawer */}
        {selectedRequest && (
          <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Detalle de Solicitud de Reabastecimiento
                </span>
                <h4 className="text-base font-bold text-slate-900 font-mono">
                  {selectedRequest.request_number}
                </h4>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Estatus Actual:</span>
                <div>{getStatusBadge(selectedRequest.status)}</div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Prioridad:</span>
                <div>{getPriorityBadge(selectedRequest.priority)}</div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                <div className="font-bold text-slate-800">Partida Solicitada:</div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900">
                      {selectedRequest.items?.[0]?.product_name || selectedRequest.sku}
                    </div>
                    <div className="font-mono text-[10px] text-slate-500">
                      SKU: {selectedRequest.sku || selectedRequest.items?.[0]?.product_code}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-emerald-700">
                      {selectedRequest.requestedQty || selectedRequest.items?.[0]?.quantity || 1}
                    </span>{' '}
                    <span className="text-slate-600 font-semibold">
                      {selectedRequest.items?.[0]?.unit || 'PZA'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 block">Almacén Destino:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedRequest.warehouse_name || selectedRequest.warehouseName || 'Almacén Central'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Fecha Registro:</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(selectedRequest.created_at || (selectedRequest as any).requestedAt || Date.now()).toLocaleDateString('es-MX')}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 block">Solicitante:</span>
                <span className="font-semibold text-slate-800">
                  {selectedRequest.requested_by_name || (selectedRequest as any).requestedByUserName || 'Personal de Almacén'}
                </span>
              </div>

              {selectedRequest.justification && (
                <div>
                  <span className="text-slate-500 block">Motivo / Justificación:</span>
                  <div className="mt-1 rounded-lg border border-slate-200 bg-white p-2.5 text-slate-700 font-normal">
                    {selectedRequest.justification}
                  </div>
                </div>
              )}

              {/* SoD Protection Notice */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-[11px] text-blue-900 flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Principio de Segregación SoD:</span>
                  <p className="mt-0.5 text-blue-800">
                    El personal de Almacén no visualiza costos ni proveedores asignados para garantizar la imparcialidad del proceso de compras.
                  </p>
                </div>
              </div>

              {/* Converted PO Information if available */}
              {(selectedRequest.converted_purchase_order_number || (selectedRequest as any).convertedPurchaseOrderNumber) && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                    <FileCheck className="h-4 w-4 text-indigo-700" />
                    <span>Orden de Compra Emitida por Compras</span>
                  </div>
                  <div className="font-mono text-sm font-bold text-indigo-800">
                    {selectedRequest.converted_purchase_order_number || (selectedRequest as any).convertedPurchaseOrderNumber}
                  </div>
                  <p className="text-[11px] text-indigo-700">
                    El material se encuentra en proceso de adquisición por Compras y arribará según el programa de entregas.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
