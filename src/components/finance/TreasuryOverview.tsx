/**
 * @license
 * CONSCORE ERP IA - Treasury Overview Component
 * FASE 7: Tesorería, Cuentas Bancarias, Flujo de Efectivo e Indicadores de Liquidez
 */

import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { BankAccount, BankTransaction } from '../../types/erp';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Plus,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  Wallet,
} from 'lucide-react';

export const TreasuryOverview: React.FC = () => {
  const {
    bankAccounts,
    bankTransactions,
    financialKPIs,
    registerBankTransaction,
    addBankAccount,
  } = useERP();

  const [selectedBankFilter, setSelectedBankFilter] = useState<string>('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [showNewTxModal, setShowNewTxModal] = useState<boolean>(false);
  const [newTxData, setNewTxData] = useState<{
    bankAccountId: string;
    type: 'INGRESO' | 'EGRESO';
    category: 'COBRO_CLIENTE' | 'PAGO_PROVEEDOR' | 'PAGO_GASTO' | 'PAGO_NOMINA' | 'TRANSFERENCIA_INTERNA' | 'OTRO';
    amount: number;
    reference: string;
    concept: string;
  }>({
    bankAccountId: bankAccounts[0]?.id || '',
    type: 'INGRESO',
    category: 'COBRO_CLIENTE',
    amount: 0,
    reference: '',
    concept: '',
  });

  const filteredTransactions = bankTransactions.filter((tx) => {
    if (selectedBankFilter !== 'ALL' && tx.bankAccountId !== selectedBankFilter) return false;
    if (selectedTypeFilter !== 'ALL' && tx.type !== selectedTypeFilter) return false;
    return true;
  });

  const totalBankBalance = bankAccounts.reduce((sum, b) => sum + b.currentBalance, 0);

  const handleCreateTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTxData.amount <= 0 || !newTxData.concept || !newTxData.bankAccountId) return;

    const acc = bankAccounts.find((b) => b.id === newTxData.bankAccountId);
    registerBankTransaction({
      bankAccountId: newTxData.bankAccountId,
      bankAccountName: acc?.bankName || 'Banco BBVA',
      type: newTxData.type,
      category: newTxData.category,
      date: new Date().toISOString().slice(0, 10),
      amount: Number(newTxData.amount),
      reference: newTxData.reference || `REF-${Date.now().toString(36).toUpperCase()}`,
      concept: newTxData.concept,
    });

    setShowNewTxModal(false);
    setNewTxData({
      bankAccountId: bankAccounts[0]?.id || '',
      type: 'INGRESO',
      category: 'COBRO_CLIENTE',
      amount: 0,
      reference: '',
      concept: '',
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Treasury Header KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cash in Banks */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Tesorería Total (Bancos)</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ${(Number(totalBankBalance) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Disponible en {bankAccounts.length} cuentas activas</span>
          </div>
        </div>

        {/* Monthly Inflows */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Ingresos del Mes</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700">
            +${(financialKPIs?.totalInflowsPeriod || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Cobranza efectiva y depósitos
          </div>
        </div>

        {/* Monthly Outflows */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Egresos del Mes</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-700">
            -${(financialKPIs?.totalOutflowsPeriod || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Proveedores, nómina y gastos
          </div>
        </div>

        {/* Net Cash Flow & Runway */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Flujo Neto / Runway</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-bold ${(financialKPIs?.netCashFlowPeriod || 0) >= 0 ? 'text-indigo-900' : 'text-rose-900'}`}>
            ${(financialKPIs?.netCashFlowPeriod || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-indigo-600 font-medium mt-2">
            Runway: sin estimación disponible
          </div>
        </div>
      </div>

      {/* Bank Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {bankAccounts.map((acc) => (
          <div
            key={acc.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-blue-200 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{acc.bankName}</h4>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Cta: •••• {acc.accountNumber.slice(-4)} · {acc.currency}
                    </span>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    acc.status === 'ACTIVA' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {acc.status === 'ACTIVA' ? 'ACTIVA' : 'INACTIVA'}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <span className="text-[11px] text-slate-500 uppercase font-medium">Saldo Disponible</span>
                <p className="text-xl font-bold text-slate-900 mt-0.5">
                  ${(Number(acc.currentBalance) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} {acc.currency}
                </p>
                <div className="text-[11px] text-slate-400 mt-1 font-mono">
                  CLABE: {acc.clabe}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-2 flex items-center justify-between text-xs text-slate-500">
              <span>Última conciliación: {acc.lastReconciliationDate}</span>
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Conciliada
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Transactions Feed & Audit Trail */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Libro de Movimientos Bancarios</h3>
            <p className="text-xs text-slate-500">Registro con trazabilidad y conciliación en tiempo real</p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedBankFilter}
              onChange={(e) => setSelectedBankFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Todos los Bancos</option>
              {bankAccounts.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bankName}
                </option>
              ))}
            </select>

            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Ingresos & Egresos</option>
              <option value="INGRESO">Sólo Ingresos</option>
              <option value="EGRESO">Sólo Egresos</option>
            </select>

            <button
              onClick={() => setShowNewTxModal(true)}
              className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Nuevo Movimiento
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                <th className="py-3 px-4">Folio</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Banco / Cuenta</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Concepto / Referencia</th>
                <th className="py-3 px-4">Auditoría / Usuario</th>
                <th className="py-3 px-4 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No se encontraron transacciones bancarias con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isIngreso = tx.type === 'INGRESO';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-medium text-slate-900">{tx.folio}</td>
                      <td className="py-2.5 px-4 text-slate-600">{tx.date}</td>
                      <td className="py-2.5 px-4 font-medium text-slate-800">{tx.bankAccountName}</td>
                      <td className="py-2.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {tx.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-700">
                        <span className="font-medium">{tx.concept}</span>
                        <span className="block text-[11px] text-slate-400 font-mono">Ref: {tx.reference}</span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">{tx.auditUser}</td>
                      <td
                        className={`py-2.5 px-4 text-right font-bold text-sm ${
                          isIngreso ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {isIngreso ? '+' : '-'}${(Number(tx.amount) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Transaction Modal */}
      {showNewTxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">Registrar Movimiento en Tesorería</h3>
            
            <form onSubmit={handleCreateTx} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Tipo de Movimiento</label>
                  <select
                    value={newTxData.type}
                    onChange={(e) => setNewTxData({ ...newTxData, type: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                  >
                    <option value="INGRESO">Ingreso (+)</option>
                    <option value="EGRESO">Egreso (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Cuenta Bancaria</label>
                  <select
                    value={newTxData.bankAccountId}
                    onChange={(e) => setNewTxData({ ...newTxData, bankAccountId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                  >
                    {bankAccounts.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bankName} - Saldo: ${(Number(b.currentBalance) || 0).toLocaleString('es-MX')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Categoría</label>
                  <select
                    value={newTxData.category}
                    onChange={(e) => setNewTxData({ ...newTxData, category: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                  >
                    <option value="COBRO_CLIENTE">Cobro de Cliente</option>
                    <option value="PAGO_PROVEEDOR">Pago a Proveedor</option>
                    <option value="PAGO_GASTO">Pago de Gasto Operativo</option>
                    <option value="PAGO_NOMINA">Dispersión de Nómina</option>
                    <option value="TRANSFERENCIA_INTERNA">Traspaso entre Cuentas</option>
                    <option value="OTRO">Otro Concepto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Importe ($ MXN)</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={newTxData.amount || ''}
                    onChange={(e) => setNewTxData({ ...newTxData, amount: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Concepto</label>
                <input
                  type="text"
                  required
                  value={newTxData.concept}
                  onChange={(e) => setNewTxData({ ...newTxData, concept: e.target.value })}
                  placeholder="Ej. Liquidación de anticipo, pago de servicio luz..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Referencia / Folio Bancario</label>
                <input
                  type="text"
                  value={newTxData.reference}
                  onChange={(e) => setNewTxData({ ...newTxData, reference: e.target.value })}
                  placeholder="Ej. SPEI-892301"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewTxModal(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Confirmar y Aplicar Saldo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
