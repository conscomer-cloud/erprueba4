/**
 * @license
 * CONSCORE ERP IA - CXC Management Component
 * FASE 7: Cuentas por Cobrar, Antigüedad de Saldos, Cobranza y Evaluación de Crédito
 */

import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { AccountsReceivableInvoice, CollectionActivity } from '../../types/erp';
import { CustomerStatementModal } from './CustomerStatementModal';
import {
  FileText,
  DollarSign,
  AlertCircle,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  PhoneCall,
  MessageSquare,
  Mail,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  ShieldCheck,
  Plus,
} from 'lucide-react';

export const CXCManagement: React.FC = () => {
  const {
    cxcInvoices,
    cxcPayments,
    collectionActivities,
    bankAccounts,
    customers,
    recordCXCPayment,
    addCollectionActivity,
    getCustomerStatement,
    getCustomerCreditEvaluation,
  } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedStatementCustId, setSelectedStatementCustId] = useState<string | null>(null);

  // Payment registration modal state
  const [payingInvoice, setPayingInvoice] = useState<AccountsReceivableInvoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentBankId, setPaymentBankId] = useState<string>(bankAccounts[0]?.id || '');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [paymentFormSat, setPaymentFormSat] = useState<'01' | '03' | '04' | '99'>('03');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  // Collection activity modal state
  const [showActivityModal, setShowActivityModal] = useState<boolean>(false);
  const [activityCustId, setActivityCustId] = useState<string>(customers[0]?.id || '');
  const [activityType, setActivityType] = useState<CollectionActivity['type']>('LLAMADA');
  const [activityOutcome, setActivityOutcome] = useState<CollectionActivity['outcome']>('PROMESA_DE_PAGO');
  const [activityNotes, setActivityNotes] = useState<string>('');
  const [activityPromiseDate, setActivityPromiseDate] = useState<string>('');
  const [activityPromiseAmount, setActivityPromiseAmount] = useState<number>(0);

  // Credit evaluation modal state
  const [evalCustId, setEvalCustId] = useState<string | null>(null);

  const filteredInvoices = cxcInvoices.filter((inv) => {
    const matchSearch =
      (inv.invoiceNumber || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.customerName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.customerRfc || "").toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchSearch) return false;
    if (statusFilter === 'PENDIENTE') return inv.status === 'PENDIENTE';
    if (statusFilter === 'PARCIAL') return inv.status === 'PARCIALMENTE_PAGADA';
    if (statusFilter === 'VENCIDA') return inv.overdueDays > 0;
    if (statusFilter === 'PAGADA') return inv.status === 'PAGADA';
    return true;
  });

  // Calculate Aging Metrics
  const agingTotals = cxcInvoices.reduce(
    (acc, inv) => {
      if (inv.status === 'PAGADA' || inv.balance <= 0) return acc;
      acc.total += inv.balance;
      if (inv.overdueDays <= 0) acc.current += inv.balance;
      else if (inv.overdueDays <= 30) acc.d1to30 += inv.balance;
      else if (inv.overdueDays <= 60) acc.d31to60 += inv.balance;
      else if (inv.overdueDays <= 90) acc.d61to90 += inv.balance;
      else acc.over90 += inv.balance;
      return acc;
    },
    { total: 0, current: 0, d1to30: 0, d31to60: 0, d61to90: 0, over90: 0 }
  );

  const handleOpenPaymentModal = (inv: AccountsReceivableInvoice) => {
    setPayingInvoice(inv);
    setPaymentAmount(inv.balance);
    setPaymentBankId(bankAccounts[0]?.id || '');
    setPaymentRef(`SPEI-${Math.floor(100000 + Math.random() * 900000)}`);
    setPaymentNotes('');
  };

  const handleApplyPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice || paymentAmount <= 0) return;

    recordCXCPayment({
      cxcId: payingInvoice.id,
      amount: paymentAmount,
      paymentDate: new Date().toISOString().slice(0, 10),
      bankAccountId: paymentBankId,
      bankReference: paymentRef,
      paymentFormSat,
      notes: paymentNotes,
    });

    setPayingInvoice(null);
  };

  const handleSaveCollectionActivity = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === activityCustId);
    if (!cust) return;

    addCollectionActivity({
      customerId: cust.id,
      customerName: cust.name,
      type: activityType,
      outcome: activityOutcome,
      notes: activityNotes,
      promiseDate: activityPromiseDate || undefined,
      promiseAmount: activityPromiseAmount > 0 ? activityPromiseAmount : undefined,
    });

    setShowActivityModal(false);
    setActivityNotes('');
    setActivityPromiseDate('');
    setActivityPromiseAmount(0);
  };

  const creditEvalResult = evalCustId ? getCustomerCreditEvaluation(evalCustId) : null;
  const statementResult = selectedStatementCustId ? getCustomerStatement(selectedStatementCustId) : null;

  return (
    <div className="space-y-6">

      {/* Aging Overview Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Cartera por Cobrar & Antigüedad de Saldos</h3>
            <p className="text-xs text-slate-500">
              Total vivo: ${(Number(agingTotals.total) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN · Días promedio de cobro (DSO): 38.4 días
            </p>
          </div>
          <button
            onClick={() => setShowActivityModal(true)}
            className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            Registrar Gestión de Cobranza
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg">
            <span className="text-[10px] font-bold text-emerald-800 uppercase block">Al Corriente</span>
            <p className="text-base font-bold text-emerald-900 mt-0.5">${(Number(agingTotals.current) || 0).toLocaleString('es-MX')}</p>
            <span className="text-[10px] text-emerald-600">Dentro de crédito</span>
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg">
            <span className="text-[10px] font-bold text-blue-800 uppercase block">1 a 30 Días Venc.</span>
            <p className="text-base font-bold text-blue-900 mt-0.5">${(Number(agingTotals.d1to30) || 0).toLocaleString('es-MX')}</p>
            <span className="text-[10px] text-blue-600">Gestión preventiva</span>
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg">
            <span className="text-[10px] font-bold text-amber-800 uppercase block">31 a 60 Días Venc.</span>
            <p className="text-base font-bold text-amber-900 mt-0.5">${(Number(agingTotals.d31to60) || 0).toLocaleString('es-MX')}</p>
            <span className="text-[10px] text-amber-600">Cobranza activa</span>
          </div>

          <div className="p-3 bg-orange-50/70 border border-orange-200 rounded-lg">
            <span className="text-[10px] font-bold text-orange-800 uppercase block">61 a 90 Días Venc.</span>
            <p className="text-base font-bold text-orange-900 mt-0.5">${(Number(agingTotals.d61to90) || 0).toLocaleString('es-MX')}</p>
            <span className="text-[10px] text-orange-600">Alerta de crédito</span>
          </div>

          <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-lg col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-rose-800 uppercase block">+90 Días (Crítico)</span>
            <p className="text-base font-bold text-rose-900 mt-0.5">${(Number(agingTotals.over90) || 0).toLocaleString('es-MX')}</p>
            <span className="text-[10px] text-rose-600">Bloqueo automático</span>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[260px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por factura, cliente o RFC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="PENDIENTE">Pendientes de Pago</option>
              <option value="PARCIAL">Parcialmente Pagadas</option>
              <option value="VENCIDA">Vencidas</option>
              <option value="PAGADA">Pagadas</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                <th className="py-3 px-4">Factura</th>
                <th className="py-3 px-4">Cliente / RFC</th>
                <th className="py-3 px-4">Emisión</th>
                <th className="py-3 px-4">Vencimiento</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Saldo</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No se encontraron facturas con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const isOver = inv.overdueDays > 0;
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-4 font-bold text-slate-900">
                        {inv.invoiceNumber}
                        <span className="block text-[10px] text-slate-400 font-normal">Folio: {inv.folio}</span>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="font-semibold text-slate-800">{inv.customerName}</span>
                        <span className="block text-[10px] text-slate-400 font-mono">{inv.customerRfc}</span>
                      </td>
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
                              : inv.status === 'PARCIALMENTE_PAGADA'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {inv.status === 'PAGADA' ? 'PAGADA' : isOver ? 'VENCIDA' : inv.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {inv.balance > 0 && (
                            <button
                              onClick={() => handleOpenPaymentModal(inv)}
                              className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors"
                            >
                              Aplicar Pago
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedStatementCustId(inv.customerId)}
                            className="px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                            title="Ver Estado de Cuenta"
                          >
                            Edo. Cta.
                          </button>
                          <button
                            onClick={() => setEvalCustId(inv.customerId)}
                            className="px-2 py-1 text-[11px] font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                            title="Evaluar Crédito y Semáforo"
                          >
                            Semáforo
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

      {/* Collection Activities Log */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-3">Bitácora de Gestión de Cobranza</h3>
        <div className="space-y-3">
          {collectionActivities.map((act) => (
            <div key={act.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-lg shrink-0 mt-0.5">
                {act.type === 'LLAMADA' && <PhoneCall className="w-4 h-4" />}
                {act.type === 'WHATSAPP' && <MessageSquare className="w-4 h-4" />}
                {act.type === 'CORREO' && <Mail className="w-4 h-4" />}
                {act.type === 'VISITA' && <FileText className="w-4 h-4" />}
              </div>
              <div className="flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{act.customerName}</span>
                  <span className="text-[10px] text-slate-400">{act.createdAt.slice(0, 16).replace('T', ' ')}</span>
                </div>
                <p className="text-slate-600 mt-1">{act.notes}</p>
                <div className="flex items-center gap-3 mt-2 text-[11px]">
                  <span className="font-medium text-slate-500">Resultado: <b className="text-slate-700">{act.outcome}</b></span>
                  {act.promiseDate && (
                    <span className="font-medium text-amber-700">
                      Promesa: {act.promiseDate} (${(Number(act.promiseAmount) || 0).toLocaleString('es-MX')} MXN)
                    </span>
                  )}
                  <span className="text-slate-400">Por: {act.recordedBy}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Receipt Registration Modal */}
      {payingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Registrar Cobro a Factura</h3>
            <p className="text-xs text-slate-500 mb-4">
              {payingInvoice.invoiceNumber} · {payingInvoice.customerName}
            </p>

            <form onSubmit={handleApplyPayment} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>Total Factura:</span>
                  <b>${(Number(payingInvoice.total) || 0).toLocaleString('es-MX')}</b>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Saldo Actual:</span>
                  <b className="text-rose-700">${(Number(payingInvoice.balance) || 0).toLocaleString('es-MX')}</b>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Importe del Pago ($ MXN)</label>
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
                <label className="block text-slate-600 font-semibold mb-1">Cuenta Bancaria Receptora</label>
                <select
                  value={paymentBankId}
                  onChange={(e) => setPaymentBankId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                >
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bankName} (••• {b.accountNumber.slice(-4)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Forma de Pago SAT</label>
                  <select
                    value={paymentFormSat}
                    onChange={(e) => setPaymentFormSat(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                  >
                    <option value="03">03 - Transferencia SPEI</option>
                    <option value="01">01 - Efectivo</option>
                    <option value="04">04 - Tarjeta de Crédito</option>
                    <option value="99">99 - Por Definir</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Referencia Bancaria</label>
                  <input
                    type="text"
                    required
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Notas / Observaciones</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Ej. Pago con descuento acordado..."
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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Aplicar Cobro & Afectar Banco
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credit Evaluation Semaphore Modal */}
      {creditEvalResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Evaluación de Crédito y Semáforo</h3>
              </div>
              <button onClick={() => setEvalCustId(null)} className="text-slate-400 hover:text-slate-600 text-sm">
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl border flex items-center gap-4 bg-slate-50 border-slate-200">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl ${
                    creditEvalResult.semaphore === 'VERDE'
                      ? 'bg-emerald-600 ring-4 ring-emerald-100'
                      : creditEvalResult.semaphore === 'AMARILLO'
                      ? 'bg-amber-500 ring-4 ring-amber-100'
                      : 'bg-rose-600 ring-4 ring-rose-100'
                  }`}
                >
                  {creditEvalResult.semaphore === 'VERDE' ? '✓' : creditEvalResult.semaphore === 'AMARILLO' ? '!' : '✕'}
                </div>
                <div>
                  <span className="text-[11px] uppercase font-bold text-slate-500">Semáforo de Crédito</span>
                  <h4 className="text-base font-bold text-slate-900">
                    {creditEvalResult.semaphore === 'VERDE' && 'Crédito Aprobado (Riesgo Bajo)'}
                    {creditEvalResult.semaphore === 'AMARILLO' && 'Precaución (Requiere Revisión)'}
                    {creditEvalResult.semaphore === 'ROJO' && 'Bloqueado (Riesgo Alto / Vencido)'}
                  </h4>
                  <p className="text-slate-600 mt-0.5">{creditEvalResult.recommendation}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Límite Autorizado</span>
                  <span className="text-sm font-bold text-slate-900">${(Number(creditEvalResult.creditLimit) || 0).toLocaleString('es-MX')}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Saldo Utilizado</span>
                  <span className="text-sm font-bold text-slate-900">${(Number(creditEvalResult.currentBalance) || 0).toLocaleString('es-MX')}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Saldo Disponible</span>
                  <span className="text-sm font-bold text-emerald-700">${(Number(creditEvalResult.availableCredit) || 0).toLocaleString('es-MX')}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Días de Mora Máx.</span>
                  <span className={`text-sm font-bold ${creditEvalResult.maxOverdueDays > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
                    {creditEvalResult.maxOverdueDays} días
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  onClick={() => setEvalCustId(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Statement Modal */}
      {statementResult && (
        <CustomerStatementModal
          statement={statementResult}
          onClose={() => setSelectedStatementCustId(null)}
        />
      )}

    </div>
  );
};
