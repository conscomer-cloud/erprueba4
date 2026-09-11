/**
 * @license
 * CONSCORE ERP IA - Accounts & Cost Centers Component
 * FASE 7: Catálogo de Cuentas Contables y Centros de Costos
 */

import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { ChartOfAccount, CostCenter } from '../../types/erp';
import {
  FolderTree,
  Building,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  DollarSign,
  PieChart,
  Layers,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export const AccountsAndCostCenters: React.FC = () => {
  const { chartOfAccounts, costCenters, addAccount, addCostCenter } = useERP();

  const [activeSubTab, setActiveSubTab] = useState<'ACCOUNTS' | 'COST_CENTERS'>('ACCOUNTS');
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // New Account Modal State
  const [showNewAccountModal, setShowNewAccountModal] = useState(false);
  const [newAccData, setNewAccData] = useState<Partial<ChartOfAccount>>({
    code: '',
    name: '',
    type: 'GASTOS',
    nature: 'DEUDORA',
    level: 2,
    parentCode: '5000',
    allowsMovement: true,
  });

  // New Cost Center Modal State
  const [showNewCCModal, setShowNewCCModal] = useState(false);
  const [newCCData, setNewCCData] = useState<Partial<CostCenter>>({
    code: '',
    name: '',
    managerName: '',
    monthlyBudget: 0,
  });

  const filteredAccounts = chartOfAccounts.filter((acc) => {
    if (accountTypeFilter !== 'ALL' && acc.type !== accountTypeFilter) return false;
    if (
      searchQuery &&
      !(acc.code || "").toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(acc.name || "").toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccData.code || !newAccData.name) return;

    addAccount({
      code: newAccData.code,
      name: newAccData.name,
      type: newAccData.type as any,
      nature: newAccData.nature as any,
      level: Number(newAccData.level) || 2,
      parentCode: newAccData.parentCode || undefined,
      allowsMovement: newAccData.allowsMovement ?? true,
      currentBalance: 0,
      isActive: true,
    });

    setShowNewAccountModal(false);
  };

  const handleCreateCostCenter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCCData.code || !newCCData.name) return;

    addCostCenter({
      code: newCCData.code,
      name: newCCData.name,
      managerName: newCCData.managerName || 'Gerencia Responsable',
      monthlyBudget: Number(newCCData.monthlyBudget) || 0,
      currentSpent: 0,
      isActive: true,
    });

    setShowNewCCModal(false);
  };

  const totalCCBudget = costCenters.reduce((sum, cc) => sum + cc.monthlyBudget, 0);
  const totalCCSpent = costCenters.reduce((sum, cc) => sum + cc.currentSpent, 0);
  const overallCCConsumedPct = totalCCBudget > 0 ? Math.round((totalCCSpent / totalCCBudget) * 100) : 0;

  return (
    <div className="space-y-6">

      {/* Sub-tab navigation */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveSubTab('ACCOUNTS')}
          className={`pb-3 text-xs font-bold transition-all relative ${
            activeSubTab === 'ACCOUNTS' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Plan de Cuentas Contable ({chartOfAccounts.length})
          {activeSubTab === 'ACCOUNTS' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveSubTab('COST_CENTERS')}
          className={`pb-3 text-xs font-bold transition-all relative ${
            activeSubTab === 'COST_CENTERS' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Centros de Costo ({costCenters.length})
          {activeSubTab === 'COST_CENTERS' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
          )}
        </button>
      </div>

      {/* TAB 1: Chart of Accounts */}
      {activeSubTab === 'ACCOUNTS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[260px]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por código o nombre de cuenta..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={accountTypeFilter}
                onChange={(e) => setAccountTypeFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
              >
                <option value="ALL">Todos los Tipos</option>
                <option value="ACTIVO">Activo</option>
                <option value="PASIVO">Pasivo</option>
                <option value="CAPITAL">Capital</option>
                <option value="INGRESOS">Ingresos</option>
                <option value="COSTOS">Costos</option>
                <option value="GASTOS">Gastos</option>
              </select>
            </div>

            <button
              onClick={() => setShowNewAccountModal(true)}
              className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Nueva Cuenta
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Nombre de la Cuenta</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Naturaleza</th>
                  <th className="py-3 px-4 text-center">Nivel</th>
                  <th className="py-3 px-4 text-right">Saldo Actual</th>
                  <th className="py-3 px-4 text-center">Afectable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAccounts.map((acc) => {
                  const isMayor = acc.level === 1;
                  return (
                    <tr
                      key={acc.id}
                      className={`hover:bg-slate-50/70 transition-colors ${isMayor ? 'bg-slate-50/40 font-bold' : ''}`}
                    >
                      <td className="py-2.5 px-4 font-mono text-slate-900">{acc.code}</td>
                      <td className="py-2.5 px-4">
                        <span style={{ paddingLeft: `${(acc.level - 1) * 16}px` }} className="inline-block">
                          {acc.level > 1 && <span className="text-slate-400 mr-1.5">↳</span>}
                          {acc.name}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            acc.type === 'ACTIVO'
                              ? 'bg-blue-100 text-blue-800'
                              : acc.type === 'PASIVO'
                              ? 'bg-rose-100 text-rose-800'
                              : acc.type === 'CAPITAL'
                              ? 'bg-purple-100 text-purple-800'
                              : acc.type === 'INGRESOS'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {acc.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 font-medium">{acc.nature}</td>
                      <td className="py-2.5 px-4 text-center text-slate-500 font-mono">N{acc.level}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900 font-mono">
                        ${(Number(acc.currentBalance) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            acc.allowsMovement ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {acc.allowsMovement ? 'Sí' : 'No (Acum.)'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Cost Centers */}
      {activeSubTab === 'COST_CENTERS' && (
        <div className="space-y-6">
          {/* Header Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Presupuesto Mensual Total
              </span>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                ${(Number(totalCCBudget) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-xs text-slate-400 mt-1 block">Distribuido en {costCenters.length} centros</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block">
                Ejercido / Consumido
              </span>
              <p className="text-2xl font-bold text-blue-900 mt-1">
                ${(Number(totalCCSpent) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-xs text-blue-600 font-medium mt-1 block">
                {overallCCConsumedPct}% del presupuesto general
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block">
                Remanente Disponible
              </span>
              <p className="text-2xl font-bold text-emerald-900 mt-1">
                ${(totalCCBudget - totalCCSpent).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-xs text-emerald-600 font-medium mt-1 block">
                Holgura operativa global
              </span>
            </div>
          </div>

          {/* Cost Centers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {costCenters.map((cc) => {
              const consumedPct = cc.monthlyBudget > 0 ? Math.round((cc.currentSpent / cc.monthlyBudget) * 100) : 0;
              const isOver = consumedPct > 90;
              return (
                <div
                  key={cc.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-blue-200 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
                          <Building className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{cc.name}</h4>
                          <span className="text-[10px] text-slate-400 font-mono">Código: {cc.code}</span>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isOver ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {consumedPct}%
                      </span>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Presupuesto:</span>
                        <span className="font-semibold text-slate-800">
                          ${(Number(cc.monthlyBudget) || 0).toLocaleString('es-MX')}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Ejercido:</span>
                        <span className="font-bold text-slate-900">
                          ${(Number(cc.currentSpent) || 0).toLocaleString('es-MX')}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
                        <div
                          className={`h-full transition-all duration-300 ${
                            consumedPct > 90
                              ? 'bg-rose-500'
                              : consumedPct > 75
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, consumedPct)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between items-center">
                    <span>Responsable: {cc.managerName.split(' ')[0]}</span>
                    <span className="font-semibold text-slate-700">
                      Disp: ${(cc.monthlyBudget - cc.currentSpent).toLocaleString('es-MX')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* New Account Modal */}
      {showNewAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">Nueva Cuenta Contable</h3>

            <form onSubmit={handleCreateAccount} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Código Contable</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 5104"
                    value={newAccData.code}
                    onChange={(e) => setNewAccData({ ...newAccData, code: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Tipo de Cuenta</label>
                  <select
                    value={newAccData.type}
                    onChange={(e) => setNewAccData({ ...newAccData, type: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                  >
                    <option value="ACTIVO">Activo</option>
                    <option value="PASIVO">Pasivo</option>
                    <option value="CAPITAL">Capital</option>
                    <option value="INGRESOS">Ingresos</option>
                    <option value="COSTOS">Costos</option>
                    <option value="GASTOS">Gastos</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Nombre de la Cuenta</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Gastos de Mantenimiento de Flotilla"
                  value={newAccData.name}
                  onChange={(e) => setNewAccData({ ...newAccData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Naturaleza</label>
                  <select
                    value={newAccData.nature}
                    onChange={(e) => setNewAccData({ ...newAccData, nature: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                  >
                    <option value="DEUDORA">Deudora</option>
                    <option value="ACREEDORA">Acreedora</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Nivel</label>
                  <select
                    value={newAccData.level}
                    onChange={(e) => setNewAccData({ ...newAccData, level: parseInt(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                  >
                    <option value={1}>Nivel 1 (Mayor)</option>
                    <option value={2}>Nivel 2 (Subcuenta)</option>
                    <option value={3}>Nivel 3 (Detalle)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewAccountModal(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Guardar Cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
