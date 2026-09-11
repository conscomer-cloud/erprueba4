/**
 * @license
 * CONSCORE ERP IA - Master Financial Dashboard
 * FASE 7: Finanzas, Tesorería, CXC, CXP, Rentabilidad, Presupuestos y Asesor IA
 */

import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { TreasuryOverview } from './TreasuryOverview';
import { CXCManagement } from './CXCManagement';
import { CXPManagement } from './CXPManagement';
import { AccountsAndCostCenters } from './AccountsAndCostCenters';
import { BudgetAndExpenseControl } from './BudgetAndExpenseControl';
import { ProfitabilityAnalysisView } from './ProfitabilityAnalysisView';
import { FinancialScenarioSimulator } from './FinancialScenarioSimulator';
import { AIFinancialAdvisorView } from './AIFinancialAdvisorView';
import {
  DollarSign,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  FolderTree,
  PieChart,
  TrendingUp,
  Sliders,
  Sparkles,
  ShieldCheck,
  Building,
  RotateCcw,
} from 'lucide-react';

export const FinancialDashboard: React.FC = () => {
  const {
    resetFinanceData,
    financialKPIs,
    cxcInvoices,
    cxpInvoices,
    aiFinancialInsights,

  } = useERP();

  const { currentUser } = useAuth();
  const handleResetFinance = () => {
    if (window.confirm('¿Restablecer los datos financieros de demostración?')) resetFinanceData();
  };
  const [activeTab, setActiveTab] = useState<
    'TREASURY' | 'CXC' | 'CXP' | 'ACCOUNTS_CC' | 'BUDGETS_EXPENSES' | 'PROFITABILITY' | 'SIMULATOR' | 'AI_ADVISOR'
  >('TREASURY');

  const pendingCXCCount = cxcInvoices.filter((i) => i.status !== 'PAGADA').length;
  const pendingCXPCount = cxpInvoices.filter((i) => i.status !== 'PAGADA').length;
  const highAlertsCount = aiFinancialInsights.filter((i) => i.severity === 'ALTA').length;



  return (
    <div className="space-y-6">

      {/* Main Module Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Módulo Financiero & Tesorería</h1>
              <p className="text-xs text-slate-500">
                FASE 7 · Flujo de Efectivo, CXC, CXP, Centros de Costo, Rentabilidad Real y Asesor IA
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-slate-600">Usuario:</span>
            <span className="font-bold text-slate-800">{currentUser?.name || 'Director Financiero'}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">
              {currentUser?.role || 'FINANZAS'}
            </span>
          </div>

          {import.meta.env.DEV && currentUser?.role === 'ADMINISTRADOR' && <button
            onClick={handleResetFinance}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            title="Restablecer datos financieros demo"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restablecer Demo
          </button>}
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-1.5 shadow-xs flex gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('TREASURY')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'TREASURY' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Wallet className="w-4 h-4" />
          Tesorería & Flujo
        </button>

        <button
          onClick={() => setActiveTab('CXC')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'CXC' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ArrowDownRight className="w-4 h-4" />
          Cuentas por Cobrar
          {pendingCXCCount > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'CXC' ? 'bg-blue-800 text-white' : 'bg-blue-100 text-blue-800'
              }`}
            >
              {pendingCXCCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('CXP')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'CXP' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          Cuentas por Pagar
          {pendingCXPCount > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'CXP' ? 'bg-blue-800 text-white' : 'bg-rose-100 text-rose-800'
              }`}
            >
              {pendingCXPCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('ACCOUNTS_CC')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'ACCOUNTS_CC' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          Cuentas & C. Costo
        </button>

        <button
          onClick={() => setActiveTab('BUDGETS_EXPENSES')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'BUDGETS_EXPENSES' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <PieChart className="w-4 h-4" />
          Presupuestos & Gastos
        </button>

        <button
          onClick={() => setActiveTab('PROFITABILITY')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'PROFITABILITY' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Rentabilidad Real
        </button>

        <button
          onClick={() => setActiveTab('SIMULATOR')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'SIMULATOR' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Simulador
        </button>

        <button
          onClick={() => setActiveTab('AI_ADVISOR')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'AI_ADVISOR' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          Asesor IA & Cierres
          {highAlertsCount > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'AI_ADVISOR' ? 'bg-amber-400 text-slate-900' : 'bg-rose-500 text-white'
              }`}
            >
              {highAlertsCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'TREASURY' && <TreasuryOverview />}
        {activeTab === 'CXC' && <CXCManagement />}
        {activeTab === 'CXP' && <CXPManagement />}
        {activeTab === 'ACCOUNTS_CC' && <AccountsAndCostCenters />}
        {activeTab === 'BUDGETS_EXPENSES' && <BudgetAndExpenseControl />}
        {activeTab === 'PROFITABILITY' && <ProfitabilityAnalysisView />}
        {activeTab === 'SIMULATOR' && <FinancialScenarioSimulator />}
        {activeTab === 'AI_ADVISOR' && <AIFinancialAdvisorView />}
      </div>

    </div>
  );
};
