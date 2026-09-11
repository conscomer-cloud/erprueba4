import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { SupplierReturn } from '../../types/erp';
import {
  Search,
  Plus,
  Undo2,
  AlertCircle,
  Truck,
  FileText,
  DollarSign,
  Eye,
  CheckCircle,
  ShieldAlert,
} from 'lucide-react';

interface SupplierReturnsTabProps {
  onNewReturn: () => void;
}

export const SupplierReturnsTab: React.FC<SupplierReturnsTabProps> = ({ onNewReturn }) => {
  const { supplierReturns } = useERP();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReturn, setSelectedReturn] = useState<SupplierReturn | null>(null);

  const filteredReturns = supplierReturns.filter((sr) => {
    const term = searchTerm.toLowerCase().trim();
    return (
      !term ||
      (sr.return_number || "").toLowerCase().includes(term) ||
      (sr.supplier_name || "").toLowerCase().includes(term) ||
      (sr.warehouse_name || "").toLowerCase().includes(term) ||
      (sr.reason && (sr.reason || "").toLowerCase().includes(term)) ||
      (sr.carrier && (sr.carrier || "").toLowerCase().includes(term)) ||
      (sr.tracking_number && (sr.tracking_number || "").toLowerCase().includes(term)) ||
      sr.items.some((it) => (it.product_name || "").toLowerCase().includes(term) || (it.product_code || "").toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-4">
      {/* Filter and Actions Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative min-w-[280px] flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por folio RMA, proveedor, motivo, rastreo o producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-slate-50/50 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:bg-white focus:outline-hidden"
          />
        </div>

        <button
          onClick={onNewReturn}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-red-700 transition shrink-0"
        >
          <Plus className="h-4 w-4" />
          Nueva Devolución (RMA)
        </button>
      </div>

      {/* Grid Layout: Table + Detail */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className={`space-y-3 ${selectedReturn ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="px-3.5 py-3">Folio RMA</th>
                    <th className="px-3.5 py-3">Proveedor</th>
                    <th className="px-3.5 py-3">Almacén Origen</th>
                    <th className="px-3.5 py-3">Motivo</th>
                    <th className="px-3.5 py-3">Transporte / Guía</th>
                    <th className="px-3.5 py-3 text-right">Monto Total</th>
                    <th className="px-3.5 py-3">Estatus</th>
                    <th className="px-3.5 py-3 text-center">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReturns.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No hay devoluciones a proveedores registradas.
                      </td>
                    </tr>
                  ) : (
                    filteredReturns.map((sr) => (
                      <tr
                        key={sr.id}
                        onClick={() => setSelectedReturn(sr)}
                        className={`cursor-pointer transition hover:bg-slate-50/80 ${
                          selectedReturn?.id === sr.id ? 'bg-red-50/60 font-semibold' : ''
                        }`}
                      >
                        <td className="px-3.5 py-3 font-mono font-bold text-red-600">
                          {sr.return_number}
                        </td>
                        <td className="px-3.5 py-3 font-medium text-slate-900">
                          {sr.supplier_name}
                        </td>
                        <td className="px-3.5 py-3 text-slate-600">{sr.warehouse_name}</td>
                        <td className="px-3.5 py-3 text-slate-600 max-w-[160px] truncate">
                          {sr.reason || sr.reason_summary}
                        </td>
                        <td className="px-3.5 py-3 text-slate-600 font-mono text-[11px]">
                          {sr.carrier ? `${sr.carrier} (${sr.tracking_number || 'S/G'})` : '—'}
                        </td>
                        <td className="px-3.5 py-3 text-right font-bold text-slate-900">
                          ${(sr?.total_amount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                        </td>
                        <td className="px-3.5 py-3">
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700 border border-red-200">
                            {sr.status}
                          </span>
                        </td>
                        <td className="px-3.5 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedReturn(sr)}
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

        {/* Selected Return Detail Panel */}
        {selectedReturn && (
          <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-black text-slate-900">
                    {selectedReturn.return_number}
                  </span>
                  <span className="rounded-md bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-800">
                    SALIDA DE STOCK APLICADA
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Proveedor: <b>{selectedReturn.supplier_name}</b> • Creado por:{' '}
                  <b>{selectedReturn.created_by_name}</b>
                </p>
              </div>
              <button
                onClick={() => setSelectedReturn(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Info Box */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <div>
                <span className="text-slate-500 block">Almacén Origen:</span>
                <span className="font-bold text-slate-800">{selectedReturn.warehouse_name}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Monto Reclamado:</span>
                <span className="font-bold text-red-700">
                  ${(selectedReturn?.total_amount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Transportista / Flete:</span>
                <span className="font-semibold text-slate-800">{selectedReturn.carrier || 'No especificado'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">No. de Rastreo / Guía:</span>
                <span className="font-mono font-bold text-slate-800">{selectedReturn.tracking_number || 'N/A'}</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-600 block mb-1">Motivo de Reclamo:</span>
              <p className="text-xs bg-slate-50 p-2.5 rounded-lg text-slate-700 border border-slate-200/60">
                {selectedReturn.reason || selectedReturn.reason_summary}
              </p>
            </div>

            {/* Items */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
                Partidas Devueltas ({selectedReturn.items.length})
              </span>
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden text-xs">
                {selectedReturn.items.map((it, idx) => (
                  <div key={idx} className="p-3 space-y-1 hover:bg-slate-50">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        [{it.product_code}] {it.product_name}
                      </span>
                      <span className="font-bold text-red-700">
                        -${(it?.total_amount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>
                        Cantidad: <b>{it.quantity} {it.unit}</b> • Costo: ${(it?.unit_cost || 0).toLocaleString()}
                      </span>
                      <span className="rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700 border border-red-100">
                        {it.condition}
                      </span>
                    </div>
                    {it.reason && (
                      <p className="text-[11px] text-slate-600 italic">"{it.reason}"</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
