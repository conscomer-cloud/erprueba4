/**
 * @license
 * CONSCORE ERP IA - Budget & Expense Control Component
 * FASE 7: Control Presupuestal, Gastos Operativos y Comprobación Fiscal
 */

import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { DepartmentBudget, OperatingExpense } from '../../types/erp';
import {
  PieChart,
  DollarSign,
  Receipt,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Calendar,
  Building,
  Upload,
} from 'lucide-react';

export const BudgetAndExpenseControl: React.FC = () => {
  const {
    budgets,
    expenses,
    costCenters,
    chartOfAccounts,
    bankAccounts,
    recordOperatingExpense,
    authorizeOperatingExpense,
  } = useERP();

  const [activeTab, setActiveTab] = useState<'BUDGETS' | 'EXPENSES'>('BUDGETS');
  const [expenseSearch, setExpenseSearch] = useState('');
  const [showNewExpenseModal, setShowNewExpenseModal] = useState(false);

  // New Expense Form State
  const [newExpData, setNewExpData] = useState<{
    costCenterId: string;
    accountId: string;
    description: string;
    category: OperatingExpense['category'];
    vendor: string;
    taxId: string;
    invoiceNumber: string;
    subtotal: number;
    tax: number;
    total: number;
    paymentMethod: 'TRANSFERENCIA' | 'TARJETA_EMPRESARIAL' | 'CAJA_CHICA';
    bankAccountId: string;
    notes: string;
  }>({
    costCenterId: costCenters[0]?.id || '',
    accountId: chartOfAccounts.find((a) => a.type === 'GASTOS')?.id || '',
    description: '',
    category: 'LOGISTICA_Y_FLOTA',
    vendor: '',
    taxId: '',
    invoiceNumber: '',
    subtotal: 0,
    tax: 0,
    total: 0,
    paymentMethod: 'TRANSFERENCIA',
    bankAccountId: bankAccounts[0]?.id || '',
    notes: '',
  });

  const totalAnnualBudget = budgets.reduce((sum, b) => sum + b.annualAllocated, 0);
  const totalAnnualSpent = budgets.reduce((sum, b) => sum + b.annualSpent, 0);
  const totalAnnualCommitted = budgets.reduce((sum, b) => sum + b.annualCommitted, 0);

  const filteredExpenses = expenses.filter((e) => {
    return (
      (e.description || "").toLowerCase().includes(expenseSearch.toLowerCase()) ||
      (e.vendor || "").toLowerCase().includes(expenseSearch.toLowerCase()) ||
      e.invoiceNumber?.toLowerCase().includes(expenseSearch.toLowerCase())
    );
  });

  const handleSubtotalChange = (sub: number) => {
    const tax = Math.round(sub * 0.16 * 100) / 100;
    const total = sub + tax;
    setNewExpData({
      ...newExpData,
      subtotal: sub,
      tax,
      total,
    });
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (newExpData.total <= 0 || !newExpData.description || !newExpData.vendor) return;

    const cc = costCenters.find((c) => c.id === newExpData.costCenterId);
    const acc = chartOfAccounts.find((a) => a.id === newExpData.accountId);

    recordOperatingExpense({
      costCenterId: newExpData.costCenterId,
      costCenterName: cc?.name || 'Operaciones',
      accountId: newExpData.accountId,
      accountCode: acc?.code || '5101',
      accountName: acc?.name || 'Gastos Generales',
      description: newExpData.description,
      category: newExpData.category,
      expenseDate: new Date().toISOString().slice(0, 10),
      vendor: newExpData.vendor,
      taxId: newExpData.taxId,
      invoiceNumber: newExpData.invoiceNumber,
      subtotal: newExpData.subtotal,
      tax: newExpData.tax,
      total: newExpData.total,
      paymentMethod: newExpData.paymentMethod,
      bankAccountId: newExpData.paymentMethod === 'TRANSFERENCIA' ? newExpData.bankAccountId : undefined,
      notes: newExpData.notes,
    });

    setShowNewExpenseModal(false);
  };

  return (
    <div className="space-y-6">

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('BUDGETS')}
          className={`pb-3 text-xs font-bold transition-all relative ${
            activeTab === 'BUDGETS' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Presupuesto Anual & Mensual ({budgets.length})
          {activeTab === 'BUDGETS' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('EXPENSES')}
          className={`pb-3 text-xs font-bold transition-all relative ${
            activeTab === 'EXPENSES' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Comprobación de Gastos Operativos ({expenses.length})
          {activeTab === 'EXPENSES' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
          )}
        </button>
      </div>

      {/* TAB 1: Budgets */}
      {activeTab === 'BUDGETS' && (
        <div className="space-y-6">
          {/* Executive Budget KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Presupuesto Anual Total
              </span>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                ${(Number(totalAnnualBudget) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-xs text-slate-400 mt-1 block">Año fiscal en curso</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block">
                Ejercido a la Fecha
              </span>
              <p className="text-2xl font-bold text-blue-900 mt-1">
                ${(Number(totalAnnualSpent) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-xs text-blue-600 font-medium mt-1 block">
                {totalAnnualBudget > 0 ? Math.round((totalAnnualSpent / totalAnnualBudget) * 100) : 0}% consumido
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider block">
                Comprometido (OCs)
              </span>
              <p className="text-2xl font-bold text-amber-900 mt-1">
                ${(Number(totalAnnualCommitted) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-xs text-amber-600 font-medium mt-1 block">En proceso de recepción</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block">
                Saldo Disponible Anual
              </span>
              <p className="text-2xl font-bold text-emerald-900 mt-1">
                ${(totalAnnualBudget - totalAnnualSpent - totalAnnualCommitted).toLocaleString('es-MX', {
                  minimumFractionDigits: 2,
                })}
              </p>
              <span className="text-xs text-emerald-600 font-medium mt-1 block">Holgura disponible</span>
            </div>
          </div>

          {/* Departmental Budgets Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Control Presupuestal por Departamento</h3>
              <p className="text-xs text-slate-500">Comparativa de asignación vs ejercicio real con semáforo de alerta al 80% y 100%</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                    <th className="py-3 px-4">Departamento</th>
                    <th className="py-3 px-4">Centro de Costo</th>
                    <th className="py-3 px-4 text-right">Asignado Anual</th>
                    <th className="py-3 px-4 text-right">Ejercido</th>
                    <th className="py-3 px-4 text-right">Disponible</th>
                    <th className="py-3 px-4 text-center">Avance</th>
                    <th className="py-3 px-4 text-center">Semáforo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {budgets.map((b) => {
                    const pct = b.annualAllocated > 0 ? Math.round((b.annualSpent / b.annualAllocated) * 100) : 0;
                    const available = b.annualAllocated - b.annualSpent - b.annualCommitted;
                    const isRed = pct >= 100;
                    const isAmber = pct >= 80 && pct < 100;

                    return (
                      <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-4 font-bold text-slate-900">{b.departmentName}</td>
                        <td className="py-2.5 px-4 font-medium text-slate-700">{b.costCenterName}</td>
                        <td className="py-2.5 px-4 text-right font-medium text-slate-700">
                          ${(Number(b.annualAllocated) || 0).toLocaleString('es-MX')}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                          ${(Number(b.annualSpent) || 0).toLocaleString('es-MX')}
                        </td>
                        <td className="py-2.5 px-4 text-right font-medium text-emerald-700">
                          ${(Number(available) || 0).toLocaleString('es-MX')}
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="w-28 mx-auto">
                            <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                              <span>{pct}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${isRed ? 'bg-rose-500' : isAmber ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              isRed
                                ? 'bg-rose-100 text-rose-800'
                                : isAmber
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isRed ? 'EXCEDIDO' : isAmber ? 'ALERTA (80%+)' : 'NORMAL'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Operating Expenses */}
      {activeTab === 'EXPENSES' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por concepto, proveedor o factura..."
                value={expenseSearch}
                onChange={(e) => setExpenseSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={() => setShowNewExpenseModal(true)}
              className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Registrar Gasto Operativo
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                  <th className="py-3 px-4">Folio / Fecha</th>
                  <th className="py-3 px-4">Concepto / Proveedor</th>
                  <th className="py-3 px-4">Centro de Costo</th>
                  <th className="py-3 px-4">Factura Fiscal</th>
                  <th className="py-3 px-4">Método de Pago</th>
                  <th className="py-3 px-4 text-right">Total ($)</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-4 font-bold text-slate-900">
                      {exp.folio}
                      <span className="block text-[10px] text-slate-400 font-normal">{exp.expenseDate}</span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="font-semibold text-slate-800">{exp.description}</span>
                      <span className="block text-[10px] text-slate-400 font-medium">Prov: {exp.vendor}</span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-700">{exp.costCenterName}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-600">
                      {exp.invoiceNumber || 'Sin comprobante'}
                      {exp.isTaxDeductible && (
                        <span className="ml-1.5 inline-block text-[10px] text-emerald-600 font-bold">✓ SAT</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">{exp.paymentMethod.replace('_', ' ')}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-900 text-sm">
                      ${(Number(exp.total) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          exp.status === 'AUTORIZADO'
                            ? 'bg-emerald-100 text-emerald-800'
                            : exp.status === 'RECHAZADO'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {exp.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {exp.status === 'BORRADOR' ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => authorizeOperatingExpense(exp.id, true)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-semibold"
                          >
                            Aprobar
                          </button>
                          <button
                            onClick={() => authorizeOperatingExpense(exp.id, false)}
                            className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-semibold"
                          >
                            Rechazar
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400">
                          {exp.authorizedBy ? `Aprobado por: ${exp.authorizedBy.split(' ')[0]}` : 'Cerrado'}
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

      {/* New Expense Modal */}
      {showNewExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">Registrar Gasto Operativo</h3>

            <form onSubmit={handleCreateExpense} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Descripción del Gasto</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Combustible diesel para unidad Ford Transit..."
                  value={newExpData.description}
                  onChange={(e) => setNewExpData({ ...newExpData, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Centro de Costo</label>
                  <select
                    value={newExpData.costCenterId}
                    onChange={(e) => setNewExpData({ ...newExpData, costCenterId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                  >
                    {costCenters.map((cc) => (
                      <option key={cc.id} value={cc.id}>
                        {cc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Categoría</label>
                  <select
                    value={newExpData.category}
                    onChange={(e) => setNewExpData({ ...newExpData, category: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                  >
                    <option value="LOGISTICA_Y_FLOTA">Logística y Flotilla</option>
                    <option value="SERVICIOS_PUBLICOS">Servicios Públicos (Luz/Agua/Net)</option>
                    <option value="MANTENIMIENTO">Mantenimiento y Reparaciones</option>
                    <option value="MARKETING">Publicidad y Marketing</option>
                    <option value="HONORARIOS">Honorarios Profesionales</option>
                    <option value="PAPELERIA_Y_OFICINA">Papelería y Oficina</option>
                    <option value="OTRO">Otro Gasto</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Proveedor / Beneficiario</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Gasolinera Oxxo Gas"
                    value={newExpData.vendor}
                    onChange={(e) => setNewExpData({ ...newExpData, vendor: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Factura / Folio Fiscal (SAT)</label>
                  <input
                    type="text"
                    placeholder="Ej. FAC-98231"
                    value={newExpData.invoiceNumber}
                    onChange={(e) => setNewExpData({ ...newExpData, invoiceNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Subtotal ($)</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={newExpData.subtotal || ''}
                    onChange={(e) => handleSubtotalChange(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">IVA 16% ($)</label>
                  <input
                    type="number"
                    readOnly
                    value={newExpData.tax || ''}
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 text-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Total ($)</label>
                  <input
                    type="number"
                    readOnly
                    value={newExpData.total || ''}
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 text-slate-900 font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewExpenseModal(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Registrar y Afectar Presupuesto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
