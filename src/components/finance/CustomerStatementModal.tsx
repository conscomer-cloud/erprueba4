/**
 * @license
 * CONSCORE ERP IA - Customer Financial Statement Modal
 * FASE 7: Estado de Cuenta Financiero del Cliente
 */

import React from 'react';
import { useERP } from '../../context/ERPContext';
import { CustomerFinancialStatement } from '../../types/erp';
import { X, Printer, Download, AlertTriangle, CheckCircle, FileText, DollarSign, Calendar, Clock } from 'lucide-react';

interface Props {
  statement: CustomerFinancialStatement | null;
  onClose: () => void;
}

export const CustomerStatementModal: React.FC<Props> = ({ statement, onClose }) => {
  const { cxcInvoices, cxcPayments } = useERP();
  if (!statement) return null;

  const { currentBalance: totalDebt, overdueBalance: overdueDebt, availableCredit } = statement;
  const customer = { name: statement.customerName, rfc: statement.rfc, creditLimit: statement.creditLimit, creditDays: statement.creditDays };
  const invoices = cxcInvoices.filter(inv => inv.customerId === statement.customerId && inv.status !== 'CANCELADA' && inv.balance > 0);
  const customerInvoiceIds = new Set(cxcInvoices.filter(inv => inv.customerId === statement.customerId).map(inv => inv.id));
  const payments = cxcPayments.filter(payment => customerInvoiceIds.has(payment.cxcId));
  const aging = invoices.reduce((totals, inv) => {
    if (inv.overdueDays <= 30) totals.current += inv.balance;
    else if (inv.overdueDays <= 60) totals.days31to60 += inv.balance;
    else if (inv.overdueDays <= 90) totals.days61to90 += inv.balance;
    else totals.over90Days += inv.balance;
    return totals;
  }, { current: 0, days31to60: 0, days61to90: 0, over90Days: 0 });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Estado de Cuenta de Cliente</h2>
              <p className="text-xs text-slate-500">
                {customer.name} · RFC: {customer.rfc || 'Sin RFC registrado'} · Emitido: {new Date().toISOString().slice(0, 10)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Límite Autorizado</span>
              <p className="text-lg font-bold text-slate-900 mt-1">
                ${(customer.creditLimit || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-slate-400">Plazo: {customer.creditDays || 30} días</span>
            </div>

            <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-lg">
              <span className="text-[11px] font-semibold text-blue-700 uppercase">Saldo Total Pendiente</span>
              <p className="text-lg font-bold text-blue-900 mt-1">
                ${(Number(totalDebt) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-blue-600">Facturas vivas: {invoices.length}</span>
            </div>

            <div className={`p-3.5 rounded-lg border ${overdueDebt > 0 ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
              <span className={`text-[11px] font-semibold uppercase ${overdueDebt > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                Cartera Vencida
              </span>
              <p className={`text-lg font-bold mt-1 ${overdueDebt > 0 ? 'text-rose-900' : 'text-emerald-900'}`}>
                ${(Number(overdueDebt) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
              <span className={`text-[10px] ${overdueDebt > 0 ? 'text-rose-600 font-medium' : 'text-emerald-600'}`}>
                {overdueDebt > 0 ? '¡Requiere gestión!' : 'Al corriente'}
              </span>
            </div>

            <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-lg">
              <span className="text-[11px] font-semibold text-amber-700 uppercase">Crédito Disponible</span>
              <p className="text-lg font-bold text-amber-900 mt-1">
                ${(Number(availableCredit) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-amber-600">Para nuevos pedidos</span>
            </div>
          </div>

          {/* Aging Breakdown */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Antigüedad de Saldos</h4>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 bg-white rounded border border-slate-200">
                <span className="text-slate-500 block text-[10px]">Vigente o hasta 30 días de mora</span>
                <span className="font-bold text-slate-800">${(Number(aging.current) || 0).toLocaleString('es-MX')}</span>
              </div>
              <div className="p-2 bg-white rounded border border-amber-200">
                <span className="text-amber-600 block text-[10px]">31 a 60 días</span>
                <span className="font-bold text-amber-900">${(Number(aging.days31to60) || 0).toLocaleString('es-MX')}</span>
              </div>
              <div className="p-2 bg-white rounded border border-orange-200">
                <span className="text-orange-600 block text-[10px]">61 a 90 días</span>
                <span className="font-bold text-orange-900">${(Number(aging.days61to90) || 0).toLocaleString('es-MX')}</span>
              </div>
              <div className="p-2 bg-white rounded border border-rose-200">
                <span className="text-rose-600 block text-[10px]">Más de 90 días</span>
                <span className="font-bold text-rose-900">${(Number(aging.over90Days) || 0).toLocaleString('es-MX')}</span>
              </div>
            </div>
          </div>

          {/* Invoices List */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Facturas por Cobrar</h4>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Factura</th>
                    <th className="py-2.5 px-3">Emisión</th>
                    <th className="py-2.5 px-3">Vencimiento</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                    <th className="py-2.5 px-3 text-right">Abonado</th>
                    <th className="py-2.5 px-3 text-right">Saldo</th>
                    <th className="py-2.5 px-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-4 text-center text-slate-400">
                        No hay facturas con saldo pendiente.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv) => {
                      const isOver = inv.overdueDays > 0;
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/80">
                          <td className="py-2 px-3 font-semibold text-slate-900">{inv.invoiceNumber}</td>
                          <td className="py-2 px-3 text-slate-600">{inv.issueDate}</td>
                          <td className="py-2 px-3 text-slate-600">{inv.dueDate}</td>
                          <td className="py-2 px-3 text-right font-medium">${(Number(inv.total) || 0).toLocaleString('es-MX')}</td>
                          <td className="py-2 px-3 text-right text-emerald-600 font-medium">${(Number(inv.paidAmount) || 0).toLocaleString('es-MX')}</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">${(Number(inv.balance) || 0).toLocaleString('es-MX')}</td>
                          <td className="py-2 px-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                                isOver
                                  ? 'bg-rose-100 text-rose-800'
                                  : inv.status === 'PAGADA'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {isOver ? `Vencida (${inv.overdueDays}d)` : inv.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payments History */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Últimos Pagos Aplicados</h4>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                    <th className="py-2 px-3">Recibo</th>
                    <th className="py-2 px-3">Fecha</th>
                    <th className="py-2 px-3">Factura</th>
                    <th className="py-2 px-3">Banco / Cuenta</th>
                    <th className="py-2 px-3">Referencia</th>
                    <th className="py-2 px-3 text-right">Importe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-3 text-center text-slate-400">
                        Sin pagos recientes registrados.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80">
                        <td className="py-2 px-3 font-semibold text-slate-800">{p.folio}</td>
                        <td className="py-2 px-3 text-slate-600">{p.paymentDate}</td>
                        <td className="py-2 px-3 text-slate-700">{p.invoiceNumber}</td>
                        <td className="py-2 px-3 text-slate-600">{p.bankAccountName}</td>
                        <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">{p.bankReference}</td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-700">
                          +${(Number(p.amount) || 0).toLocaleString('es-MX')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 rounded-b-xl flex items-center justify-between text-xs text-slate-500">
          <span>CONSCORE ERP · Módulo de Finanzas & Tesorería</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
