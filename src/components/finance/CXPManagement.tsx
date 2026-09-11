/**
 * @license
 * CONSCORE ERP IA - CXP Management Component
 * FASE 7: Cuentas por Pagar, Proveedores, Programación de Pagos y Dispersión
 */

import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { AccountsPayableInvoice, PaymentScheduleItem } from '../../types/erp';
import {
  FileText,
  DollarSign,
  Calendar,
  Clock,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building,
  ArrowRight,
  ShieldCheck,
  Plus,
  Lock,
} from 'lucide-react';

export const CXPManagement: React.FC = () => {
  const {
    cxpInvoices,
    cxpPayments,
    paymentSchedule,
    bankAccounts,
    suppliers,
    recordCXPPayment,
    authorizePaymentScheduleItem,
    addPaymentScheduleItem,
  } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'INVOICES' | 'SCHEDULE'>('INVOICES');
  
  // Payment modal state
  const [payingInvoice, setPayingInvoice] = useState<AccountsPayableInvoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentBankId, setPaymentBankId] = useState<string>(bankAccounts[0]?.id || '');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  const totalCXP = cxpInvoices.reduce((sum, inv) => (inv.status !== 'PAGADA' ? sum + inv.balance : sum), 0);
  const totalScheduled = paymentSchedule
    .filter((p) => p.authorizationStatus === 'AUTORIZADO')
    .reduce((sum, p) => sum + p.amount, 0);

  const filteredInvoices = cxpInvoices.filter((inv) => {
    const matchSearch =
      (inv.supplierInvoiceNumber || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.supplierName || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch;
  });

  const handleOpenPaymentModal = (inv: AccountsPayableInvoice) => {
    setPayingInvoice(inv);
    setPaymentAmount(inv.balance);
    setPaymentBankId(bankAccounts[0]?.id || '');
    setPaymentRef(`DISP-${Math.floor(100000 + Math.random() * 900000)}`);
    setPaymentNotes('');
  };

  const handleApplyPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice || paymentAmount <= 0) return;

    recordCXPPayment({
      cxpId: payingInvoice.id,
      amount: paymentAmount,
      paymentDate: new Date().toISOString().slice(0, 10),
      bankAccountId: paymentBankId,
      bankReference: paymentRef,
      notes: paymentNotes,
    });

    setPayingInvoice(null);
  };

  return (
    <div className="space-y-6">

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Pasivo Total con Proveedores (CXP)
          </span>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            ${(Number(totalCXP) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-slate-400 mt-1 block">
            {cxpInvoices.filter((i) => i.status !== 'PAGADA').length} facturas vivas por liquidar
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block">
            Pagos Autorizados en Calendario
          </span>
          <p className="text-2xl font-bold text-blue-900 mt-1">
            ${(Number(totalScheduled) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-blue-600 font-medium mt-1 block">
            Listos para dispersión bancaria
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider block">
            Días Promedio de Pago (DPO)
          </span>
          <p className="text-2xl font-bold text-indigo-900 mt-1">
            28.5 días
          </p>
          <span className="text-xs text-emerald-600 font-medium mt-1 block">
            Aprovechamiento óptimo de crédito
          </span>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('INVOICES')}
          className={`pb-3 text-xs font-bold transition-all relative ${
            activeTab === 'INVOICES' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Facturas de Proveedores ({cxpInvoices.length})
          {activeTab === 'INVOICES' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('SCHEDULE')}
          className={`pb-3 text-xs font-bold transition-all relative ${
            activeTab === 'SCHEDULE' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Programación Semanal de Pagos ({paymentSchedule.length})
          {activeTab === 'SCHEDULE' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
          )}
        </button>
      </div>

      {/* TAB 1: Invoices */}
      {activeTab === 'INVOICES' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por factura o proveedor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                  <th className="py-3 px-4">Factura Prov.</th>
                  <th className="py-3 px-4">Proveedor</th>
                  <th className="py-3 px-4">Orden de Compra</th>
                  <th className="py-3 px-4">Emisión</th>
                  <th className="py-3 px-4">Vencimiento</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-right">Saldo</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      No se encontraron facturas por pagar.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => {
                    const isOver = inv.overdueDays > 0;
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-4 font-bold text-slate-900">{inv.supplierInvoiceNumber}</td>
                        <td className="py-2.5 px-4 font-medium text-slate-800">{inv.supplierName}</td>
                        <td className="py-2.5 px-4 font-mono text-slate-600">{inv.purchaseOrderFolio || 'S/N'}</td>
                        <td className="py-2.5 px-4 text-slate-600">{inv.issueDate}</td>
                        <td className="py-2.5 px-4">
                          <span className={`font-medium ${isOver ? 'text-rose-700' : 'text-slate-700'}`}>
                            {inv.dueDate}
                          </span>
                          {isOver && (
                            <span className="block text-[10px] text-rose-600 font-bold">
                              +{inv.overdueDays} días venc.
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right font-medium text-slate-700">
                          ${(Number(inv.total) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-900 text-sm">
                          ${(Number(inv.balance) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                              inv.status === 'PAGADA'
                                ? 'bg-emerald-100 text-emerald-800'
                                : isOver
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {inv.balance > 0 ? (
                            <button
                              onClick={() => handleOpenPaymentModal(inv)}
                              className="px-2.5 py-1 text-[11px] font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded transition-colors"
                            >
                              Dispersar Pago
                            </button>
                          ) : (
                            <span className="text-[10px] text-emerald-600 font-medium flex items-center justify-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Liquidada
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
      )}

      {/* TAB 2: Payment Schedule */}
      {activeTab === 'SCHEDULE' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Programación Semanal de Pagos</h3>
              <p className="text-xs text-slate-500">Autorización previa por Dirección General antes de dispersión</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                  <th className="py-3 px-4">Semana / Fecha</th>
                  <th className="py-3 px-4">Beneficiario / Proveedor</th>
                  <th className="py-3 px-4">Concepto</th>
                  <th className="py-3 px-4">Prioridad</th>
                  <th className="py-3 px-4 text-right">Importe</th>
                  <th className="py-3 px-4 text-center">Autorización</th>
                  <th className="py-3 px-4 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paymentSchedule.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      {item.scheduledDate}
                      <span className="block text-[10px] text-slate-400 font-normal">Sem {item.weekNumber}</span>
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-800">{item.payeeName}</td>
                    <td className="py-2.5 px-4 text-slate-600">{item.concept}</td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.priority === 'ALTA'
                            ? 'bg-rose-100 text-rose-800'
                            : item.priority === 'MEDIA'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {item.priority}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-900 text-sm">
                      ${(Number(item.amount) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.authorizationStatus === 'AUTORIZADO'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.authorizationStatus === 'RECHAZADO'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.authorizationStatus}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {item.authorizationStatus === 'PENDIENTE' ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => authorizePaymentScheduleItem(item.id, true)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-semibold"
                          >
                            Autorizar
                          </button>
                          <button
                            onClick={() => authorizePaymentScheduleItem(item.id, false)}
                            className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-semibold"
                          >
                            Rechazar
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400">
                          {item.authorizedBy ? `Por: ${item.authorizedBy.split(' ')[0]}` : 'Listo'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Supplier Payment Modal */}
      {payingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Dispersar Pago a Proveedor</h3>
            <p className="text-xs text-slate-500 mb-4">
              {payingInvoice.supplierInvoiceNumber} · {payingInvoice.supplierName}
            </p>

            <form onSubmit={handleApplyPayment} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>Total Factura:</span>
                  <b>${(Number(payingInvoice.total) || 0).toLocaleString('es-MX')}</b>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Saldo a Liquidar:</span>
                  <b className="text-rose-700">${(Number(payingInvoice.balance) || 0).toLocaleString('es-MX')}</b>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Importe a Pagar ($ MXN)</label>
                <input
                  type="number"
                  min="0.01"
                  max={payingInvoice.balance}
                  step="0.01"
                  required
                  value={paymentAmount || ''}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Cuenta Bancaria Emisora</label>
                <select
                  value={paymentBankId}
                  onChange={(e) => setPaymentBankId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                >
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bankName} - Saldo Disp: ${(Number(b.currentBalance) || 0).toLocaleString('es-MX')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Referencia / Folio Bancario</label>
                <input
                  type="text"
                  required
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Notas / Motivo</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Ej. Transferencia electrónica programada..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPayingInvoice(null)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Dispersar y Descontar Saldo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
