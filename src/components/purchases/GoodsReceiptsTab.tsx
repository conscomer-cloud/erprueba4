import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { GoodsReceipt } from '../../types/erp';
import {
  Search,
  Plus,
  PackageCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  MapPin,
  Truck,
  User,
  Calendar,
  Eye,
} from 'lucide-react';

interface GoodsReceiptsTabProps {
  onNewReceipt: () => void;
}

export const GoodsReceiptsTab: React.FC<GoodsReceiptsTabProps> = ({ onNewReceipt }) => {
  const { goodsReceipts, purchaseOrders } = useERP();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<GoodsReceipt | null>(null);

  const filteredReceipts = goodsReceipts.filter((gr) => {
    const term = searchTerm.toLowerCase().trim();
    return (
      !term ||
      (gr.receipt_number || "").toLowerCase().includes(term) ||
      (gr.purchase_order_number || "").toLowerCase().includes(term) ||
      (gr.supplier_name || "").toLowerCase().includes(term) ||
      (gr.warehouse_name || "").toLowerCase().includes(term) ||
      (gr.received_by_name || "").toLowerCase().includes(term) ||
      (gr.supplier_document && (gr.supplier_document || "").toLowerCase().includes(term)) ||
      gr.items.some((it) => (it.product_name || "").toLowerCase().includes(term) || (it.product_code || "").toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-4">
      {/* Top Filter & Actions Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative min-w-[280px] flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por folio de recepción, OC, factura o producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-slate-50/50 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-hidden"
          />
        </div>

        <button
          onClick={onNewReceipt}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition shrink-0"
        >
          <Plus className="h-4 w-4" />
          Registrar Entrada en Almacén
        </button>
      </div>

      {/* Grid Layout: Table + Detail */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className={`space-y-3 ${selectedReceipt ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="px-3.5 py-3">Folio Entrada</th>
                    <th className="px-3.5 py-3">Orden de Compra</th>
                    <th className="px-3.5 py-3">Proveedor</th>
                    <th className="px-3.5 py-3">Almacén</th>
                    <th className="px-3.5 py-3">Doc. Proveedor</th>
                    <th className="px-3.5 py-3">Recibido Por</th>
                    <th className="px-3.5 py-3">Fecha</th>
                    <th className="px-3.5 py-3 text-center">QC</th>
                    <th className="px-3.5 py-3 text-center">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReceipts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        No se encontraron registros de recepción física.
                      </td>
                    </tr>
                  ) : (
                    filteredReceipts.map((gr) => (
                      <tr
                        key={gr.id}
                        onClick={() => setSelectedReceipt(gr)}
                        className={`cursor-pointer transition hover:bg-slate-50/80 ${
                          selectedReceipt?.id === gr.id ? 'bg-emerald-50/60 font-semibold' : ''
                        }`}
                      >
                        <td className="px-3.5 py-3 font-mono font-bold text-emerald-700">
                          {gr.receipt_number}
                        </td>
                        <td className="px-3.5 py-3 font-mono text-indigo-600">
                          {gr.purchase_order_number}
                        </td>
                        <td className="px-3.5 py-3 font-medium text-slate-900">
                          {gr.supplier_name}
                        </td>
                        <td className="px-3.5 py-3 text-slate-600">{gr.warehouse_name}</td>
                        <td className="px-3.5 py-3 font-mono text-slate-700">
                          {gr.supplier_document || gr.supplier_remission_invoice_number || '—'}
                        </td>
                        <td className="px-3.5 py-3 text-slate-600">{gr.received_by_name}</td>
                        <td className="px-3.5 py-3 text-slate-500 text-[11px]">
                          {gr.receipt_date || (gr.received_at ? new Date(gr.received_at).toLocaleDateString('es-MX') : '—')}
                        </td>
                        <td className="px-3.5 py-3 text-center">
                          {gr.quality_inspection_status === 'RECHAZADO' ||
                          gr.items.some((it) => (it.quantity_rejected || 0) > 0) ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                              Parcial
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                              100% OK
                            </span>
                          )}
                        </td>
                        <td className="px-3.5 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedReceipt(gr)}
                            className="rounded-md bg-slate-100 p-1.5 text-slate-600 hover:bg-slate-200"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Detail Panel */}
        {selectedReceipt && (
          <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-black text-slate-900">
                    {selectedReceipt.receipt_number}
                  </span>
                  <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                    KARDEX AFECTADO
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Orden: <b>{selectedReceipt.purchase_order_number}</b> • Proveedor:{' '}
                  <b>{selectedReceipt.supplier_name}</b>
                </p>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Reception info card */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <div>
                <span className="text-slate-500 block">Almacén Recibido:</span>
                <span className="font-bold text-slate-800">{selectedReceipt.warehouse_name}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Factura/Remisión:</span>
                <span className="font-mono font-bold text-slate-800">
                  {selectedReceipt.supplier_document || selectedReceipt.supplier_remission_invoice_number || 'N/D'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Recibido por:</span>
                <span className="font-semibold text-slate-800">{selectedReceipt.received_by_name}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Transporte:</span>
                <span className="font-semibold text-slate-800">
                  {selectedReceipt.carrier_name || selectedReceipt.supplier_carrier || 'Propio'}
                </span>
              </div>
            </div>

            {/* Received Items Breakdown */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
                Partidas Inspeccionadas & Ubicación ({selectedReceipt.items.length})
              </span>
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden text-xs">
                {selectedReceipt.items.map((it, idx) => (
                  <div key={idx} className="p-3 space-y-1 hover:bg-slate-50">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        [{it.product_code}] {it.product_name}
                      </span>
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        +{it.quantity_received} {it.unit}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>
                        Aceptadas: <b>{it.quantity_accepted ?? it.quantity_received}</b> • Rechazadas:{' '}
                        <b>{it.quantity_rejected ?? 0}</b>
                      </span>
                      <span className="flex items-center gap-1 font-mono text-slate-700">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        {it.destination_location || it.warehouse_location || 'Almacén General'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedReceipt.notes && (
              <div className="text-xs">
                <span className="font-bold text-slate-600 block mb-1">Notas de Entrada:</span>
                <p className="bg-slate-50 p-2.5 rounded-lg text-slate-700 border border-slate-200/60">
                  {selectedReceipt.notes}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
