/**
 * @license
 * CONSCORE ERP IA - FASE 14: AUTOMATIZACIÓN EMPRESARIAL + BPM + WORKFLOWS + RPA
 * 3-Way Match CXP Validation Dashboard (PO vs WMS Receipt vs Supplier Invoice)
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Package,
  Receipt,
  Plus,
  ArrowRight,
  UserCheck,
  Lock,
} from 'lucide-react';
import { ThreeWayMatchRecord } from '../../types/automationBpmTypes';
import { AutomationBpmEngine } from '../../services/automationBpmEngine';

interface ThreeWayMatchCenterViewProps {
  records: ThreeWayMatchRecord[];
  onRefresh: () => void;
}

export const ThreeWayMatchCenterView: React.FC<ThreeWayMatchCenterViewProps> = ({
  records,
  onRefresh,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');
  const [selectedRecord, setSelectedRecord] = useState<ThreeWayMatchRecord | null>(null);
  const [exceptionModal, setExceptionModal] = useState<ThreeWayMatchRecord | null>(null);
  const [approver, setApprover] = useState<string>('Lic. Fernando Garza (Gerente de Compras)');
  const [justification, setJustification] = useState<string>('Faltante acreditado mediante nota de crédito NC-2026-088.');

  // Form for testing new 3-way match
  const [showNewMatchForm, setShowNewMatchForm] = useState(false);
  const [poId, setPoId] = useState('OC-2026-220');
  const [poTotal, setPoTotal] = useState(120000);
  const [poQuantity, setPoQuantity] = useState(100);
  const [supplierName, setSupplierName] = useState('Siderúrgica del Norte S.A.');
  const [receiptQuantity, setReceiptQuantity] = useState(100);
  const [invoiceTotal, setInvoiceTotal] = useState(120000);
  const [invoiceQuantity, setInvoiceQuantity] = useState(100);

  const filtered = records.filter((r) => {
    if (filterStatus === 'TODOS') return true;
    return r.status === filterStatus;
  });

  const handleEvaluateNew = (e: React.FormEvent) => {
    e.preventDefault();
    AutomationBpmEngine.evaluate3WayMatch(
      { id: poId, total: poTotal, quantity: poQuantity, supplierName },
      { id: `REC-${poId.replace('OC-', '')}`, receivedQuantity: receiptQuantity },
      { id: `FAC-PROV-${Date.now().toString().slice(-4)}`, total: invoiceTotal, quantity: invoiceQuantity }
    );
    setShowNewMatchForm(false);
    onRefresh();
  };

  const handleApproveException = () => {
    if (!exceptionModal) return;
    AutomationBpmEngine.approve3WayMatchException(exceptionModal.id, approver, justification);
    setExceptionModal(null);
    onRefresh();
  };

  const blockedCount = records.filter((r) => r.status === 'DISCREPANCY_BLOCKED').length;
  const totalBlockedValue = records
    .filter((r) => r.status === 'DISCREPANCY_BLOCKED')
    .reduce((sum, r) => sum + r.invoiceTotal, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Validación Tripartita CXP
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800">
              {blockedCount} Facturas Retenidas
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            CXP 3-Way Match & Prevención de Pagos Erróneos
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cruce obligatorio entre Orden de Compra, Recepción WMS y Factura CFDI del Proveedor. Tolerancia: 0% en piezas, 0.5% en precio.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Retenido</span>
            <span className="text-sm font-bold text-rose-600">${(Number(totalBlockedValue) || 0).toLocaleString('es-MX')} MXN</span>
          </div>

          <button
            onClick={() => setShowNewMatchForm(!showNewMatchForm)}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Evaluar Factura
          </button>
        </div>
      </div>

      {/* New Match Evaluation Form */}
      {showNewMatchForm && (
        <form onSubmit={handleEvaluateNew} className="p-5 bg-white rounded-xl border border-indigo-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-indigo-600" />
            Simular Validación Tripartita (3-Way Match)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-200 space-y-2">
              <span className="font-bold text-blue-900 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> 1. Orden de Compra
              </span>
              <div>
                <label className="text-[10px] text-slate-500">Folio OC</label>
                <input
                  type="text"
                  value={poId}
                  onChange={(e) => setPoId(e.target.value)}
                  className="w-full mt-0.5 p-1.5 bg-white border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500">Proveedor</label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full mt-0.5 p-1.5 bg-white border border-slate-300 rounded"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500">Total OC ($)</label>
                  <input
                    type="number"
                    value={poTotal}
                    onChange={(e) => setPoTotal(Number(e.target.value))}
                    className="w-full mt-0.5 p-1.5 bg-white border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500">Cantidad</label>
                  <input
                    type="number"
                    value={poQuantity}
                    onChange={(e) => setPoQuantity(Number(e.target.value))}
                    className="w-full mt-0.5 p-1.5 bg-white border border-slate-300 rounded"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200 space-y-2">
              <span className="font-bold text-amber-900 flex items-center gap-1">
                <Package className="w-3.5 h-3.5" /> 2. Recepción Almacén (WMS)
              </span>
              <div>
                <label className="text-[10px] text-slate-500">Cantidad Recibida Física</label>
                <input
                  type="number"
                  value={receiptQuantity}
                  onChange={(e) => setReceiptQuantity(Number(e.target.value))}
                  className="w-full mt-0.5 p-1.5 bg-white border border-slate-300 rounded"
                />
              </div>
              <p className="text-[11px] text-slate-500 pt-3">
                El sistema contrasta las piezas registradas en el Kardex contra las facturadas.
              </p>
            </div>

            <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-200 space-y-2">
              <span className="font-bold text-purple-900 flex items-center gap-1">
                <Receipt className="w-3.5 h-3.5" /> 3. Factura CFDI Proveedor
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500">Importe Factura ($)</label>
                  <input
                    type="number"
                    value={invoiceTotal}
                    onChange={(e) => setInvoiceTotal(Number(e.target.value))}
                    className="w-full mt-0.5 p-1.5 bg-white border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500">Piezas Facturadas</label>
                  <input
                    type="number"
                    value={invoiceQuantity}
                    onChange={(e) => setInvoiceQuantity(Number(e.target.value))}
                    className="w-full mt-0.5 p-1.5 bg-white border border-slate-300 rounded"
                  />
                </div>
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-semibold text-xs transition"
                >
                  Ejecutar Validación 3-Way Match
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {['TODOS', 'DISCREPANCY_BLOCKED', 'AUTO_MATCHED', 'EXCEPTION_APPROVED'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterStatus === st
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* 3-Way Match Records Table */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200">
              <tr>
                <th className="px-3 py-2.5">ID Validación</th>
                <th className="px-3 py-2.5">Proveedor</th>
                <th className="px-3 py-2.5">Orden Compra</th>
                <th className="px-3 py-2.5">Recepción WMS</th>
                <th className="px-3 py-2.5">Factura CFDI</th>
                <th className="px-3 py-2.5">Discrepancia</th>
                <th className="px-3 py-2.5">Estado</th>
                <th className="px-3 py-2.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((rec) => {
                const isBlocked = rec.status === 'DISCREPANCY_BLOCKED';
                return (
                  <tr key={rec.id} className="hover:bg-slate-50/80">
                    <td className="px-3 py-2.5 font-mono font-bold text-indigo-700">
                      {rec.id}
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-slate-900">
                      {rec.supplierName}
                    </td>
                    <td className="px-3 py-2.5 text-slate-700 font-mono">
                      {rec.purchaseOrderId} (${(Number(rec.poTotal) || 0).toLocaleString('es-MX')} | {rec.poQuantity} pzas)
                    </td>
                    <td className="px-3 py-2.5 text-slate-700 font-mono">
                      {rec.goodsReceiptId} ({rec.receivedQuantity} pzas)
                    </td>
                    <td className="px-3 py-2.5 font-bold text-slate-900 font-mono">
                      {rec.supplierInvoiceId} (${(Number(rec.invoiceTotal) || 0).toLocaleString('es-MX')})
                    </td>
                    <td className="px-3 py-2.5">
                      {rec.matchStatus === 'PERFECT_MATCH' ? (
                        <span className="text-emerald-700 font-semibold text-[11px]">0% Diferencia</span>
                      ) : (
                        <span className="text-rose-700 font-bold text-[11px] block">
                          {rec.varianceQuantity !== 0 && `Cant: ${rec.varianceQuantity} pzas `}
                          {rec.varianceAmount > 0 && `Precio: +$${(Number(rec.varianceAmount) || 0).toLocaleString('es-MX')}`}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rec.status === 'AUTO_MATCHED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rec.status === 'DISCREPANCY_BLOCKED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {isBlocked ? (
                        <button
                          onClick={() => setExceptionModal(rec)}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[11px] font-semibold transition"
                        >
                          Aprobar Excepción
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Liberado</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Exception Approval Modal */}
      {exceptionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Aprobar Excepción de Pago (3-Way Match)
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {exceptionModal.id} · {exceptionModal.supplierName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setExceptionModal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs space-y-1 text-rose-900">
              <p className="font-bold">Motivo de Bloqueo:</p>
              <p>{exceptionModal.discrepancyNotes}</p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase">
                  Aprobador Autorizado (Compras / Finanzas)
                </label>
                <input
                  type="text"
                  value={approver}
                  onChange={(e) => setApprover(e.target.value)}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase">
                  Justificación Comercial / Nota de Crédito
                </label>
                <textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  rows={3}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setExceptionModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleApproveException}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition"
              >
                Liberar Pago con Excepción
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
