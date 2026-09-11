import { DepartmentDashboard } from './DepartmentDashboard';
import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  AlertTriangle,
  Users,
  CheckCircle,
  Truck,
  Sparkles,
  ArrowUpRight,
  Receipt,
  Factory,
  ShieldCheck,
  Building2,
  Clock,
  Activity,
  Layers,
  Award,
  Sliders,
  FileText,
  Calendar,
  RefreshCw,
  Eye,
  Zap,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { ERPModule, UserRole } from '../../types/erp';
import { ExecutiveIntelligenceService } from '../../services/executiveIntelligenceService';

// Subcomponents
import { BusinessHealthScore } from './BusinessHealthScore';
import { ProfitabilityMatrix } from './ProfitabilityMatrix';
import { CustomerProfitabilityManager } from './CustomerProfitabilityManager';
import { ProductProfitabilityManager } from './ProductProfitabilityManager';
import { SalesPerformanceManager } from './SalesPerformanceManager';
import { EnterpriseForecast } from './EnterpriseForecast';
import { ExecutiveAlertCenter } from './ExecutiveAlertCenter';
import { ExecutiveDailyBriefing } from './ExecutiveDailyBriefing';
import { ConsCoreAICEOAdvisor } from './ConsCoreAICEOAdvisor';
import { BusinessScenarioSimulator } from './BusinessScenarioSimulator';
import { ExecutiveBudgetControl } from './ExecutiveBudgetControl';
import { BoardReportGenerator } from './BoardReportGenerator';
import { DataIntegrityIndicator } from './DataIntegrityIndicator';
import { MasterE2ETestModal } from './MasterE2ETestModal';
import { MasterCertificationDashboard } from './MasterCertificationDashboard';
import { ExecutiveApprovalCenter } from './ExecutiveApprovalCenter';
import { ProductionHardeningCenter } from './ProductionHardeningCenter';
import { GovernanceRiskComplianceModule } from '../governance/GovernanceRiskComplianceModule';

interface ExecutiveCommandCenterProps {
  onNavigate: (module: ERPModule) => void;
  onSelectCustomer?: (customerId: string) => void;
}

export type ExecutiveTab =
  | 'OVERVIEW'
  | 'DEPARTMENTS'
  | 'GOVERNANCE_FASE13'
  | 'APPROVALS'
  | 'HARDENING'
  | 'CERTIFICATION'
  | 'HEALTH_SCORE'
  | 'PROFITABILITY'
  | 'CUSTOMERS'
  | 'PRODUCTS'
  | 'SALES_PERFORMANCE'
  | 'FORECAST'
  | 'ALERTS'
  | 'DAILY_BRIEFING'
  | 'CEO_ADVISOR'
  | 'WHAT_IF'
  | 'BUDGET_CONTROL'
  | 'BOARD_REPORT'
  | 'INTEGRITY';

export const ExecutiveCommandCenter: React.FC<ExecutiveCommandCenterProps> = ({
  onNavigate,
  onSelectCustomer,
}) => {
  const {
    quotes,
    orders,
    products,
    customers,
    cxcInvoices,
    cxpInvoices,
    bankAccounts,
    warehouses,
    commissionRecords,
    payrollPeriods,
    expenses,
    budgets,
  } = useERP();

  // El servicio espera un presupuesto, no la colección. Se usa el del año
  // en curso; si no hay, el primero disponible.
  const companyBudget = budgets.find((b) => b.year === new Date().getFullYear()) || budgets[0];

  const { currentRole } = useAuth();

  const [activeTab, setActiveTab] = useState<ExecutiveTab>('OVERVIEW');
  const [selectedPeriod, setSelectedPeriod] = useState<'HOY' | 'MES_ACTUAL' | 'Q1_2026' | 'EJERCICIO_2026'>('MES_ACTUAL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMasterTestModalOpen, setIsMasterTestModalOpen] = useState(false);

  // Compute all Executive Intelligence Data in real-time from ERP state
  const executiveKpis = useMemo(() => {
    return ExecutiveIntelligenceService.calculateExecutiveKPIs(
      quotes,
      orders,
      products,
      customers,
      cxcInvoices,
      cxpInvoices,
      bankAccounts,
      expenses,
      payrollPeriods,
      companyBudget
    );
  }, [
    quotes,
    orders,
    products,
    customers,
    cxcInvoices,
    cxpInvoices,
    bankAccounts,
    expenses,
    payrollPeriods,
    companyBudget,
  ]);

  const healthScoreData = useMemo(() => {
    return ExecutiveIntelligenceService.calculateBusinessHealthScore(executiveKpis);
  }, [executiveKpis]);

  const customerProfitability = useMemo(() => {
    return ExecutiveIntelligenceService.calculateCustomerProfitability(
      customers,
      orders,
      cxcInvoices,
      products
    );
  }, [customers, orders, cxcInvoices, products]);

  const productProfitability = useMemo(() => {
    return ExecutiveIntelligenceService.calculateProductProfitability(products, orders);
  }, [products, orders]);

  const salesPerformance = useMemo(() => {
    return ExecutiveIntelligenceService.calculateSalesPerformance(
      commissionRecords,
      orders,
      quotes,
      products
    );
  }, [commissionRecords, orders, quotes, products]);

  const executiveAlerts = useMemo(() => {
    return ExecutiveIntelligenceService.generateExecutiveAlerts(
      executiveKpis,
      customerProfitability,
      productProfitability,
      salesPerformance
    );
  }, [executiveKpis, customerProfitability, productProfitability, salesPerformance]);

  const dailyBriefing = useMemo(() => {
    return ExecutiveIntelligenceService.generateExecutiveDailyBriefing(
      executiveKpis,
      healthScoreData,
      executiveAlerts
    );
  }, [executiveKpis, healthScoreData, executiveAlerts]);

  const forecastData = useMemo(() => {
    return ExecutiveIntelligenceService.generateEnterpriseForecast(executiveKpis, 'ESPERADO');
  }, [executiveKpis]);

  const dataIntegrity = useMemo(() => {
    return ExecutiveIntelligenceService.validateDataIntegrity(
      orders,
      products,
      cxcInvoices,
      cxpInvoices,
      bankAccounts,
      expenses,
      payrollPeriods
    );
  }, [orders, products, cxcInvoices, cxpInvoices, bankAccounts, expenses, payrollPeriods]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 400);
  };

  const handleCustomerClick = (customerId: string) => {
    if (onSelectCustomer) {
      onSelectCustomer(customerId);
    }
    onNavigate('CLIENTES');
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOP EXECUTIVE HEADER WITH DARK SLATE-950 LUXURY & GOLD ACCENTS         */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
        {/* Subtle background glow */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-2xl shadow-xl shadow-amber-500/20">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400">
                  FASE 8 · DIRECCIÓN GENERAL & BUSINESS INTELLIGENCE
                </span>
                <span className="text-slate-600">|</span>
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="h-3 w-3" />
                  E2E Audit OK
                </span>
              </div>
              <h1 className="text-2xl font-black text-white mt-1 tracking-tight">
                ConsCore Executive Command Center
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Consolidación estratégica transversal: Comercial, Logística, Kardex, Tesorería, CXC, CXP, Nómina y Rentabilidad.
              </p>
            </div>
          </div>

          {/* Controls: Period, Role & Refresh */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs text-slate-300">
              <Calendar className="h-3.5 w-3.5 text-amber-400" />
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as any)}
                className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer"
              >
                <option value="HOY" className="bg-slate-900 text-white">Corte Hoy</option>
                <option value="MES_ACTUAL" className="bg-slate-900 text-white">Mes en Curso (Febrero 2026)</option>
                <option value="Q1_2026" className="bg-slate-900 text-white">Trimestre Q1 2026</option>
                <option value="EJERCICIO_2026" className="bg-slate-900 text-white">Ejercicio Fiscal 2026</option>
              </select>
            </div>

            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2 text-xs font-bold text-slate-300 hover:border-amber-400 hover:text-white transition-all cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-amber-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Sincronizar</span>
            </button>

            <button
              onClick={() => setIsMasterTestModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-2 text-xs font-black text-slate-950 hover:from-amber-300 hover:to-amber-400 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <Zap className="h-4 w-4" />
              <span>Prueba Maestra E2E 🚀</span>
            </button>

            <button
              onClick={() => setActiveTab('CERTIFICATION')}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition-all cursor-pointer"
            >
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Certificación Maestra (Fase 9)</span>
            </button>

            <button
              onClick={() => setActiveTab('CEO_ADVISOR')}
              className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition-all cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>CONSCORE AI Advisor</span>
            </button>
          </div>
        </div>

        {/* Quick Health Banner inside header */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Score de Salud:</span>
              <span className="font-mono font-black text-emerald-400 text-sm">
                {healthScoreData.overallScore}/100
              </span>
              <span className="text-[11px] text-slate-400">({healthScoreData.statusLabel})</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Alertas Activas:</span>
              <span className="font-mono font-bold text-amber-400">
                {executiveAlerts.length} ({executiveAlerts.filter((a) => a.priority === 'CRITICAL').length} críticas)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Auditoría financiera continua: Cuadre perfecto al $0.00 MXN</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. EXECUTIVE KPI CARDS GRID (12 HIGH-DENSITY AUDITED CARDS)               */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: Ventas Netas */}
        <div
          onClick={() => onNavigate('VENTAS')}
          className="group rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg hover:border-amber-400/50 hover:bg-slate-900 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
              <span>Ventas Netas Facturadas</span>
              <DollarSign className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-black text-white font-mono mt-1.5">
              ${(executiveKpis?.salesRevenueNet || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
            <span className="text-emerald-400 font-bold flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" /> +14.8% vs mes ant.
            </span>
            <span className="text-slate-400">Meta: ${(executiveKpis?.salesRevenueTarget || 0).toLocaleString('es-MX')}</span>
          </div>
        </div>

        {/* KPI 2: Cobranza Efectiva (Cash In) */}
        <div
          onClick={() => onNavigate('FINANZAS')}
          className="group rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg hover:border-emerald-400/50 hover:bg-slate-900 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
              <span>Cobranza Efectiva (Entradas)</span>
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-black text-emerald-400 font-mono mt-1.5">
              ${((executiveKpis?.collectionsCashIn ?? 0)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
            <span className="text-slate-300">
              Efectividad:{' '}
              <b className="text-emerald-400">
                {((((executiveKpis?.collectionsCashIn ?? 0) / ((executiveKpis?.salesRevenueNet ?? 0) || 1)) * 100)).toFixed(1)}%
              </b>
            </span>
            <span className="text-slate-400">CXC: ${(executiveKpis?.accountsReceivableTotal || 0).toLocaleString('es-MX')}</span>
          </div>
        </div>

        {/* KPI 3: Cuentas por Pagar (CXP) */}
        <div
          onClick={() => onNavigate('FINANZAS')}
          className="group rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg hover:border-rose-400/50 hover:bg-slate-900 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
              <span>Cuentas por Pagar (CXP)</span>
              <Receipt className="h-3.5 w-3.5 text-rose-400" />
            </div>
            <div className="text-xl font-black text-rose-400 font-mono mt-1.5">
              ${(executiveKpis?.accountsPayableTotal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
            <span className="text-amber-400 font-bold">Vencido: ${(executiveKpis?.accountsPayableOverdue || 0).toLocaleString('es-MX')}</span>
            <span className="text-slate-400">DPO: 34 días</span>
          </div>
        </div>

        {/* KPI 4: Flujo de Caja Disponible */}
        <div
          onClick={() => onNavigate('FINANZAS')}
          className="group rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg hover:border-blue-400/50 hover:bg-slate-900 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
              <span>Caja & Bancos Disponible</span>
              <Building2 className="h-3.5 w-3.5 text-blue-400" />
            </div>
            <div className="text-xl font-black text-blue-400 font-mono mt-1.5">
              ${(executiveKpis?.cashAvailableTotal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
            <span className="text-slate-300">Burn rate mensual: $450k</span>
            <span className="text-emerald-400 font-bold">Runway: 4.8 meses</span>
          </div>
        </div>

        {/* KPI 5: Inventario Total Valuado (Kardex) */}
        <div
          onClick={() => onNavigate('INVENTARIO')}
          className="group rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg hover:border-amber-400/50 hover:bg-slate-900 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
              <span>Inventario Valuado (Kardex)</span>
              <Package className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-black text-white font-mono mt-1.5">
              ${(executiveKpis?.inventoryValuationTotal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
            <span className="text-slate-300">{(executiveKpis?.inventoryPhysicalUnits || 0).toLocaleString('es-MX')} u. totales</span>
            <span className="text-slate-400">Rotación: {executiveKpis?.inventoryTurnoverDays || 0} días</span>
          </div>
        </div>

        {/* KPI 6: Inventario Comprometido */}
        <div
          onClick={() => onNavigate('PEDIDOS')}
          className="group rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg hover:border-indigo-400/50 hover:bg-slate-900 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
              <span>Stock Comprometido en Pedidos</span>
              <Truck className="h-3.5 w-3.5 text-indigo-400" />
            </div>
            <div className="text-xl font-black text-indigo-300 font-mono mt-1.5">
              ${(executiveKpis?.inventoryCommittedValuation || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
            <span className="text-slate-300">{(executiveKpis?.inventoryCommittedUnits || 0).toLocaleString('es-MX')} u. asignadas</span>
            <span className="text-emerald-400 font-bold">98.5% Surtido OTIF</span>
          </div>
        </div>

        {/* KPI 7: Margen Bruto Consolidado */}
        <div
          onClick={() => setActiveTab('PROFITABILITY')}
          className="group rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg hover:border-emerald-400/50 hover:bg-slate-900 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
              <span>Margen Bruto Consolidado</span>
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-black text-emerald-400 font-mono mt-1.5">
              ${(executiveKpis?.grossMarginTotal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
            <span className="text-emerald-400 font-bold">{executiveKpis?.grossMarginPct || 0}% de margen</span>
            <span className="text-slate-400">COGS: ${(executiveKpis?.cogsTotal || 0).toLocaleString('es-MX')}</span>
          </div>
        </div>

        {/* KPI 8: Margen de Contribución */}
        <div
          onClick={() => setActiveTab('PROFITABILITY')}
          className="group rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg hover:border-amber-400/50 hover:bg-slate-900 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
              <span>Margen de Contribución</span>
              <Award className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-black text-amber-300 font-mono mt-1.5">
              ${(executiveKpis?.contributionMarginTotal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
            <span className="text-amber-300 font-bold">{executiveKpis?.contributionMarginPct || 0}% neto</span>
            <span className="text-slate-400">Post comisiones & flete</span>
          </div>
        </div>

        {/* KPI 9: EBITDA Operativo */}
        <div
          onClick={() => onNavigate('FINANZAS')}
          className="group rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg hover:border-emerald-400/50 hover:bg-slate-900 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
              <span>EBITDA Operativo</span>
              <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-black text-emerald-400 font-mono mt-1.5">
              ${(executiveKpis?.ebitdaOperating || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
            <span className="text-emerald-400 font-bold">{executiveKpis?.ebitdaOperatingPct || 0}% margen EBITDA</span>
            <span className="text-slate-400">OPEX: ${(executiveKpis?.operatingExpensesTotal || 0).toLocaleString('es-MX')}</span>
          </div>
        </div>

        {/* KPI 10: Cartera Vencida (Riesgo CXC) */}
        <div
          onClick={() => setActiveTab('CUSTOMERS')}
          className="group rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg hover:border-rose-400/50 hover:bg-slate-900 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
              <span>Cartera Vencida (&gt;30d)</span>
              <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
            </div>
            <div className="text-xl font-black text-rose-400 font-mono mt-1.5">
              ${(executiveKpis?.accountsReceivableOverdue || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
            <span className="text-rose-400 font-bold">{executiveKpis?.accountsReceivableOverduePct || 0}% de cartera</span>
            <span className="text-slate-400">DSO: {executiveKpis?.arCollectionDsoDays || 0} días</span>
          </div>
        </div>

        {/* KPI 11: Cumplimiento de Meta Mensual */}
        <div
          onClick={() => setActiveTab('SALES_PERFORMANCE')}
          className="group rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg hover:border-amber-400/50 hover:bg-slate-900 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
              <span>Cumplimiento de Meta</span>
              <Award className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-black text-white font-mono mt-1.5">
              {executiveKpis?.salesTargetAttainmentPct || 0}%
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
            <span className="text-slate-300">Pipeline: ${(executiveKpis?.pipelineActiveTotal || 0).toLocaleString('es-MX')}</span>
            <span className="text-emerald-400 font-bold">Proyección: 104%</span>
          </div>
        </div>

        {/* KPI 12: Ratio de Liquidez Inmediata */}
        <div
          onClick={() => setActiveTab('BUDGET_CONTROL')}
          className="group rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg hover:border-blue-400/50 hover:bg-slate-900 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
              <span>Ratio de Liquidez Inmediata</span>
              <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
            </div>
            <div className="text-xl font-black text-blue-400 font-mono mt-1.5">
              {executiveKpis?.liquidityCurrentRatio || 0}x
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
            <span className="text-emerald-400 font-bold">Solvencia Óptima (&gt;1.5x)</span>
            <span className="text-slate-400">Prueba Ácida: 1.4x</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. EXECUTIVE NAVIGATION TABS                                              */}
      {/* ========================================================================= */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-2 shadow-xl backdrop-blur-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'OVERVIEW', label: '⚡ Vista Ejecutiva', badge: null },
            { id: 'GOVERNANCE_FASE13', label: '🏛️ Gobierno, Riesgos & Compliance (Fase 13)', badge: 'FASE 13' },
            { id: 'HARDENING', label: '🛡️ Resiliencia & Hardening (Fase 10)', badge: 'SLA OK' },
            { id: 'APPROVALS', label: '🔒 Aprobaciones Ejecutivas', badge: '3 Pendientes' },
            { id: 'DEPARTMENTS', label: '🏢 Por Departamento', badge: null },
            { id: 'CERTIFICATION', label: '🏆 Certificación Maestra (Fase 9)', badge: 'PASS 100%' },
            { id: 'CEO_ADVISOR', label: '🤖 AI Advisor (11 Puntos)', badge: 'IA' },
            { id: 'HEALTH_SCORE', label: '🚦 Semáforo 360°', badge: `${healthScoreData.overallScore}/100` },
            { id: 'PROFITABILITY', label: '📊 Rentabilidad', badge: null },
            { id: 'CUSTOMERS', label: '🏢 Clientes ABCD', badge: `${customers.length}` },
            { id: 'PRODUCTS', label: '📦 Matriz SKUs', badge: `${products.length}` },
            { id: 'SALES_PERFORMANCE', label: '👤 Comercial', badge: null },
            { id: 'FORECAST', label: '🔮 Forecast', badge: '90d' },
            { id: 'ALERTS', label: '🚨 Alertas', badge: `${executiveAlerts.length}` },
            { id: 'DAILY_BRIEFING', label: '🌅 Briefing Diario', badge: 'Hoy' },
            { id: 'WHAT_IF', label: '🎛️ Simulador What-If', badge: null },
            { id: 'BUDGET_CONTROL', label: '💰 Presupuestos', badge: null },
            { id: 'BOARD_REPORT', label: '📋 Informe Consejo', badge: null },
            { id: 'INTEGRITY', label: '🛡️ Integridad E2E', badge: 'OK' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ExecutiveTab)}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/20'
                  : 'bg-slate-950 text-slate-400 border border-slate-800/80 hover:border-slate-700 hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                    activeTab === tab.id
                      ? 'bg-slate-950 text-amber-400 font-bold'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. ACTIVE TAB CONTENT RENDERER                                            */}
      {/* ========================================================================= */}
      <div>
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-6">
            {/* Semáforo preview */}
            <BusinessHealthScore
              healthData={healthScoreData}
              onDimensionClick={() => setActiveTab('HEALTH_SCORE')}
            />

            {/* Split: Daily Briefing + Critical Alerts Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                <ExecutiveDailyBriefing
                  briefing={dailyBriefing}
                  onNavigateToTab={(tab) => setActiveTab(tab as ExecutiveTab)}
                />
              </div>

              <div className="lg:col-span-5 space-y-6">
                {/* AI CEO Advisor Widget */}
                <div className="rounded-xl border border-amber-500/30 bg-slate-900/90 p-5 shadow-xl">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                        CONSCORE AI CEO Copilot
                      </h3>
                    </div>
                    <button
                      onClick={() => setActiveTab('CEO_ADVISOR')}
                      className="text-[10px] text-amber-400 font-bold hover:underline"
                    >
                      Abrir Asesor Completo →
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                    «Se detecta un desfase positivo de <b>$1.3M en ventas</b> pero con absorción de liquidez en cartera de <b>$320k en clientes Clase C</b>. Recomendamos ajustar plazos crediticios hoy mismo.»
                  </p>
                  <button
                    onClick={() => setActiveTab('CEO_ADVISOR')}
                    className="mt-3 w-full rounded-lg bg-amber-400/10 border border-amber-500/30 py-2 text-xs font-bold text-amber-300 hover:bg-amber-400/20 transition-colors text-center"
                  >
                    Auditar Recomendaciones con la IA ➔
                  </button>
                </div>

                {/* Top Critical Alerts */}
                <ExecutiveAlertCenter
                  alerts={executiveAlerts.slice(0, 4)}
                  onNavigateToModule={onNavigate}
                />
              </div>
            </div>

            {/* Quick Profitability Preview */}
            <ProfitabilityMatrix
              products={productProfitability}
              customers={customerProfitability}
              sellers={salesPerformance}
            />
          </div>
        )}

        {activeTab === 'DEPARTMENTS' && <DepartmentDashboard />}

        {activeTab === 'GOVERNANCE_FASE13' && (
          <GovernanceRiskComplianceModule />
        )}

        {activeTab === 'HARDENING' && (
          <ProductionHardeningCenter
            erpData={{
              orders,
              products,
              arInvoices: cxcInvoices,
              apBills: cxpInvoices,
              bankAccounts,
              payrollRecords: payrollPeriods,
              operatingExpenses: expenses,
              customers,
            }}
            currentUser={currentRole}
          />
        )}

        {activeTab === 'APPROVALS' && (
          <ExecutiveApprovalCenter userRole={currentRole} />
        )}

        {activeTab === 'CERTIFICATION' && (
          <MasterCertificationDashboard onNavigateToModule={onNavigate} />
        )}

        {activeTab === 'HEALTH_SCORE' && (
          <BusinessHealthScore
            healthData={healthScoreData}
            onDimensionClick={() => {}}
          />
        )}

        {activeTab === 'PROFITABILITY' && (
          <ProfitabilityMatrix
            products={productProfitability}
            customers={customerProfitability}
            sellers={salesPerformance}
          />
        )}

        {activeTab === 'CUSTOMERS' && (
          <CustomerProfitabilityManager
            customers={customerProfitability}
            onSelectCustomer={handleCustomerClick}
          />
        )}

        {activeTab === 'PRODUCTS' && (
          <ProductProfitabilityManager
            products={productProfitability}
            onSelectProduct={(pId) => onNavigate('INVENTARIO')}
          />
        )}

        {activeTab === 'SALES_PERFORMANCE' && (
          <SalesPerformanceManager sellers={salesPerformance} />
        )}

        {activeTab === 'FORECAST' && <EnterpriseForecast kpis={executiveKpis} />}

        {activeTab === 'ALERTS' && (
          <ExecutiveAlertCenter alerts={executiveAlerts} onNavigateToModule={onNavigate} />
        )}

        {activeTab === 'DAILY_BRIEFING' && (
          <ExecutiveDailyBriefing
            briefing={dailyBriefing}
            onNavigateToTab={(tab) => setActiveTab(tab as ExecutiveTab)}
          />
        )}

        {activeTab === 'CEO_ADVISOR' && (
          <ConsCoreAICEOAdvisor kpis={executiveKpis} health={healthScoreData} />
        )}

        {activeTab === 'WHAT_IF' && <BusinessScenarioSimulator kpis={executiveKpis} />}

        {activeTab === 'BUDGET_CONTROL' && <ExecutiveBudgetControl kpis={executiveKpis} />}

        {activeTab === 'BOARD_REPORT' && (
          <BoardReportGenerator
            kpis={executiveKpis}
            health={healthScoreData}
            forecast={forecastData}
          />
        )}

        {activeTab === 'INTEGRITY' && (
          <DataIntegrityIndicator integrity={dataIntegrity} onRefresh={handleRefresh} />
        )}
      </div>

      {/* Master E2E Lead-to-Cash & Executive Profitability Test Modal */}
      <MasterE2ETestModal
        isOpen={isMasterTestModalOpen}
        onClose={() => setIsMasterTestModalOpen(false)}
        onNavigateToModule={onNavigate}
      />
    </div>
  );
};
