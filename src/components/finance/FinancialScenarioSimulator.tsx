/**
 * @license
 * CONSCORE ERP IA - Financial Scenario Simulator
 * FASE 7: Simulador Interactivo de Escenarios Financieros y Sensibilidad (What-If)
 * Strict Read-Only Engine: Proyecciones en memoria sin mutación de libros contables
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import {
  Sliders,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Zap,
  RotateCcw,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Activity,
  Layers,
  RefreshCw,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Scale,
} from 'lucide-react';
import { FinancialSimulationParams, FinancialSimulationResult } from '../../types/erp';
import { ErrorBoundaryProps, ErrorBoundaryState } from '../../types/errorBoundary';

// Safe numeric formatters
const safeNumber = (val: any, fallback = 0): number => {
  if (typeof val === 'number' && !Number.isNaN(val) && Number.isFinite(val)) {
    return val;
  }
  if (typeof val === 'string') {
    const parsed = parseFloat(val);
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
};

const formatCurrency = (val: any): string => {
  const num = safeNumber(val, 0);
  return `$${num.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatPercent = (val: any): string => {
  const num = safeNumber(val, 0);
  return `${num.toFixed(1)}%`;
};

// Error Boundary
interface SimulatorErrorBoundaryProps {
  children: React.ReactNode;
  onRetry?: () => void;
}

interface SimulatorErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class SimulatorErrorBoundary extends (React.Component as any)<ErrorBoundaryProps, ErrorBoundaryState> {
  props!: ErrorBoundaryProps;
  state: SimulatorErrorBoundaryState;

  constructor(props: SimulatorErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): SimulatorErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[FinancialSimulator] Error atrapado por Error Boundary:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white rounded-xl border border-rose-200 p-8 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              No fue posible cargar el Simulador.
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Ocurrió un error inesperado al inicializar las proyecciones financieras.
              Puedes intentar recargar la vista.
            </p>
          </div>
          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            REINTENTAR
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Inner Simulator Component
const FinancialScenarioSimulatorInner: React.FC = () => {
  const { runFinancialSimulation, getFinancialKPIs, financialKPIs } = useERP();
  const { currentUser, can } = useAuth();

  // RBAC Permission Check
  const hasFinancePermission = can ? can('FINANZAS', 'VIEW') : true;

  // Loading & Error States
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [lastSimulatedTime, setLastSimulatedTime] = useState<string | null>(null);

  // Simulation Slider States
  const [salesGrowthPct, setSalesGrowthPct] = useState<number>(0);
  const [collectionEfficiencyPct, setCollectionEfficiencyPct] = useState<number>(90);
  const [cogsChangePct, setCogsChangePct] = useState<number>(0);
  const [supplierTermsDays, setSupplierTermsDays] = useState<number>(30);
  const [opexChangePct, setOpexChangePct] = useState<number>(0);

  // Active preset
  const [activePreset, setActivePreset] = useState<'BASE' | 'OPTIMISTA' | 'CONSERVADOR' | 'CUSTOM'>('BASE');

  // Baseline data from backend or local fallback
  const [baselineData, setBaselineData] = useState<{
    baseSales: number;
    baseCogs: number;
    baseGrossProfit: number;
    baseOpex: number;
    baseEbitda: number;
    baseNetCashFlow: number;
    baseWorkingCapital: number;
  }>({
    baseSales: 100000,
    baseCogs: 68000,
    baseGrossProfit: 32000,
    baseOpex: 25000,
    baseEbitda: 7000,
    baseNetCashFlow: 12000,
    baseWorkingCapital: 25000,
  });

  // Fetch baseline data on mount
  const fetchBaseline = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('conscore_auth_token') || sessionStorage.getItem('conscore_auth_token');
      let loadedFromApi = false;

      if (token) {
        try {
          const res = await fetch('/api/finance/simulator', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const json = await res.json();
            if (json?.success && json?.baseline) {
              setBaselineData({
                baseSales: safeNumber(json.baseline.baseSales, 100000),
                baseCogs: safeNumber(json.baseline.baseCogs, 68000),
                baseGrossProfit: safeNumber(json.baseline.baseGrossProfit, 32000),
                baseOpex: safeNumber(json.baseline.baseOpex, 25000),
                baseEbitda: safeNumber(json.baseline.baseEbitda, 7000),
                baseNetCashFlow: safeNumber(json.baseline.baseNetCashFlow, 12000),
                baseWorkingCapital: safeNumber(json.baseline.baseWorkingCapital, 25000),
              });
              loadedFromApi = true;
            }
          }
        } catch (apiErr) {
          console.warn('[FinancialSimulator] Endpoint /api/finance/simulator no disponible, usando estado reactivo local:', apiErr);
        }
      }

      if (!loadedFromApi) {
        // Safe local fallback from ERP Context
        const kpis = getFinancialKPIs ? getFinancialKPIs() : financialKPIs;
        const bSales = safeNumber(kpis?.revenuePeriod, 100000);
        const bGross = safeNumber(kpis?.grossProfitPeriod, bSales * 0.32);
        const bCogs = Math.max(0, bSales - bGross || bSales * 0.68);
        const bOpex = Math.max(0, safeNumber(bGross - safeNumber(kpis?.operatingProfitPeriod, 0), 25000));
        const bEbitda = safeNumber(kpis?.ebitdaPeriod, bGross - bOpex);
        const bCash = safeNumber(kpis?.netCashFlowPeriod, 0);
        const bWc = safeNumber(kpis?.workingCapital, bSales * 0.25);

        setBaselineData({
          baseSales: bSales,
          baseCogs: bCogs,
          baseGrossProfit: bGross,
          baseOpex: bOpex,
          baseEbitda: bEbitda,
          baseNetCashFlow: bCash,
          baseWorkingCapital: bWc,
        });
      }

      setLoading(false);
    } catch (err: any) {
      console.error('[FinancialSimulator] Error cargando simulador:', err);
      setError(err?.message || 'No fue posible cargar el Simulador.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBaseline();
  }, []);

  // Compute simulation result safely (Read-Only / What-If)
  const simulationResult: FinancialSimulationResult = useMemo(() => {
    const params: Partial<FinancialSimulationParams> = {
      salesGrowthPct,
      collectionEfficiencyPct,
      cogsChangePct,
      supplierTermsDays,
      opexChangePct,
    };

    // If ERP context method is available
    if (typeof runFinancialSimulation === 'function') {
      try {
        const res = runFinancialSimulation(params);
        if (res && typeof res.projectedSales === 'number') {
          return res;
        }
      } catch (calcErr) {
        console.warn('[FinancialSimulator] Fallback to internal simulator calculation:', calcErr);
      }
    }

    // Defensive internal calculation if context method throws or is unavailable
    const bSales = baselineData.baseSales;
    const bCogs = baselineData.baseCogs;
    const bGross = baselineData.baseGrossProfit;
    const bOpex = baselineData.baseOpex;
    const bEbitda = baselineData.baseEbitda;
    const bNetCash = baselineData.baseNetCashFlow;
    const bWc = baselineData.baseWorkingCapital;

    const projectedSales = Number((bSales * (1 + salesGrowthPct / 100)).toFixed(2));
    const projectedCogs = Number((bCogs * (1 + salesGrowthPct / 100) * (1 + cogsChangePct / 100)).toFixed(2));
    const projectedGrossProfit = Number((projectedSales - projectedCogs).toFixed(2));
    const projectedOpex = Number((bOpex * (1 + opexChangePct / 100)).toFixed(2));
    const projectedEbitda = Number((projectedGrossProfit - projectedOpex).toFixed(2));
    const projectedMarginPct = projectedSales > 0 ? Number(((projectedEbitda / projectedSales) * 100).toFixed(2)) : 0;
    const projectedInflow = Number((projectedSales * (collectionEfficiencyPct / 100)).toFixed(2));

    const termsFactor = Math.max(0.33, Math.min(2.0, 30 / Math.max(supplierTermsDays, 1)));
    const projectedSupplierPayment = projectedCogs * termsFactor;
    const projectedOutflow = Number((projectedSupplierPayment + projectedOpex).toFixed(2));
    const projectedNetCashFlow = Number((projectedInflow - projectedOutflow).toFixed(2));
    const projectedWorkingCapital = Number((projectedSales * 0.22 + projectedCogs * (supplierTermsDays / 365) * 0.8).toFixed(2));

    const salesDelta = Number((projectedSales - bSales).toFixed(2));
    const grossProfitDelta = Number((projectedGrossProfit - bGross).toFixed(2));
    const ebitdaDelta = Number((projectedEbitda - bEbitda).toFixed(2));
    const netCashFlowDelta = Number((projectedNetCashFlow - bNetCash).toFixed(2));
    const workingCapitalDelta = Number((projectedWorkingCapital - bWc).toFixed(2));

    let aiAssessment = '';
    if (projectedNetCashFlow > 500000) {
      aiAssessment = 'Excelente solidez de tesorería. El escenario genera excedentes suficientes para reinversión en inventario de alta rotación o reducción anticipada de pasivos.';
    } else if (projectedNetCashFlow >= 0) {
      aiAssessment = 'Escenario equilibrado con flujo de caja positivo. Se recomienda mantener una cobranza rigurosa por encima del 85% para mitigar desviaciones operativas.';
    } else {
      aiAssessment = '¡Alerta de déficit de liquidez! Bajo estos parámetros, la empresa requerirá financiamiento a corto plazo o renegociar plazos de proveedores a 60+ días.';
    }

    return {
      baseSales: bSales,
      baseCogs: bCogs,
      baseGrossProfit: bGross,
      baseOpex: bOpex,
      baseEbitda: bEbitda,
      baseNetCashFlow: bNetCash,
      baseWorkingCapital: bWc,
      projectedSales,
      projectedCogs,
      projectedGrossProfit,
      projectedOpex,
      projectedEbitda,
      projectedMarginPct,
      projectedInflow,
      projectedOutflow,
      projectedNetCashFlow,
      projectedWorkingCapital,
      salesDelta,
      grossProfitDelta,
      ebitdaDelta,
      netCashFlowDelta,
      workingCapitalDelta,
      aiAssessment,
    };
  }, [
    salesGrowthPct,
    collectionEfficiencyPct,
    cogsChangePct,
    supplierTermsDays,
    opexChangePct,
    baselineData,
    runFinancialSimulation,
  ]);

  // Server-side audit synchronization (debounced or on-demand)
  const handleServerSimulationSync = async () => {
    if (isSimulating) return; // Prevent double-execution
    setIsSimulating(true);

    try {
      const token = localStorage.getItem('conscore_auth_token') || sessionStorage.getItem('conscore_auth_token');
      if (token) {
        const res = await fetch('/api/finance/simulate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            salesGrowthPct,
            collectionEfficiencyPct,
            cogsChangePct,
            supplierTermsDays,
            opexChangePct,
          }),
        });

        if (res.ok) {
          setLastSimulatedTime(new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
      }
    } catch (syncErr) {
      console.warn('[FinancialSimulator] Sincronización de auditoría server:', syncErr);
    } finally {
      setIsSimulating(false);
    }
  };

  // Reset to default baseline parameters
  const handleReset = () => {
    setSalesGrowthPct(0);
    setCollectionEfficiencyPct(90);
    setCogsChangePct(0);
    setSupplierTermsDays(30);
    setOpexChangePct(0);
    setActivePreset('BASE');
  };

  // Apply quick preset scenarios
  const applyPreset = (preset: 'BASE' | 'OPTIMISTA' | 'CONSERVADOR') => {
    setActivePreset(preset);
    if (preset === 'BASE') {
      setSalesGrowthPct(0);
      setCollectionEfficiencyPct(90);
      setCogsChangePct(0);
      setSupplierTermsDays(30);
      setOpexChangePct(0);
    } else if (preset === 'OPTIMISTA') {
      setSalesGrowthPct(15);
      setCollectionEfficiencyPct(95);
      setCogsChangePct(-5);
      setSupplierTermsDays(45);
      setOpexChangePct(-5);
    } else if (preset === 'CONSERVADOR') {
      setSalesGrowthPct(-15);
      setCollectionEfficiencyPct(75);
      setCogsChangePct(8);
      setSupplierTermsDays(20);
      setOpexChangePct(5);
    }
  };

  // RBAC Access Restricted Guard
  if (!hasFinancePermission) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center space-y-3">
        <ShieldAlert className="w-8 h-8 text-amber-600 mx-auto" />
        <h3 className="text-base font-bold text-amber-900">Acceso Restringido</h3>
        <p className="text-xs text-amber-700 max-w-md mx-auto">
          Tu rol actual ({currentUser?.role || 'USUARIO'}) no cuenta con privilegios de visualización en el módulo de Finanzas y Simulador de Escenarios.
        </p>
      </div>
    );
  }

  // Loading State
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3 shadow-xs">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-700">Inicializando Simulador Financiero...</p>
        <p className="text-xs text-slate-400">Cargando datos base de ventas, inventario y estructura de costos.</p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="bg-white rounded-xl border border-rose-200 p-8 text-center space-y-4 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900">No fue posible cargar el Simulador.</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">{error}</p>
        </div>
        <button
          type="button"
          onClick={fetchBaseline}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          REINTENTAR
        </button>
      </div>
    );
  }

  const isNetPositive = simulationResult.projectedNetCashFlow >= 0;
  const isEbitdaPositive = simulationResult.projectedEbitda >= 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-bold">Simulador Financiero & Sensibilidad de Flujo (What-If)</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Solo Lectura / Proyección
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl">
              Modela en tiempo real el impacto en Flujo de Efectivo, EBITDA y Capital de Trabajo ante variaciones de mercado.
              Los datos contables reales permanecen 100% protegidos e inalterados.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors flex items-center gap-1.5 border border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restablecer Parámetros Base
            </button>

            <button
              type="button"
              onClick={handleServerSimulationSync}
              disabled={isSimulating}
              className="px-3.5 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
              {isSimulating ? 'Auditando...' : 'Auditar Simulación'}
            </button>
          </div>
        </div>

        {/* Read-Only Safety Assurance Note */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Garantía Read-Only: No altera cuentas por cobrar, pagar, bancos, Kardex ni inventarios reales.</span>
          </div>
          {lastSimulatedTime && (
            <span className="text-slate-400 font-mono text-[10px]">
              Última auditoría registrada: {lastSimulatedTime}
            </span>
          )}
        </div>
      </div>

      {/* Preset Scenarios Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
          <Scale className="w-3.5 h-3.5" />
          Escenarios Rápidos:
        </span>
        <button
          type="button"
          onClick={() => applyPreset('BASE')}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
            activePreset === 'BASE'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Base (0% Variación)
        </button>
        <button
          type="button"
          onClick={() => applyPreset('OPTIMISTA')}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
            activePreset === 'OPTIMISTA'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Optimista (+15% Vtas, -5% Costos)
        </button>
        <button
          type="button"
          onClick={() => applyPreset('CONSERVADOR')}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
            activePreset === 'CONSERVADOR'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Conservador / Estrés (-15% Vtas, +8% Costos)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sliders Control Panel */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              Variables de Sensibilidad
            </h4>
            <span className="text-[11px] text-slate-400">Ajuste Dinámico</span>
          </div>

          {/* 1. Variación en Ventas */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1.5">
              <span className="text-slate-700">Crecimiento / Caída en Ventas</span>
              <span className={salesGrowthPct >= 0 ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                {salesGrowthPct > 0 ? `+${salesGrowthPct}%` : `${salesGrowthPct}%`}
              </span>
            </div>
            <input
              type="range"
              min="-40"
              max="60"
              step="5"
              value={salesGrowthPct}
              onChange={(e) => {
                setSalesGrowthPct(parseInt(e.target.value) || 0);
                setActivePreset('CUSTOM');
              }}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>-40% (Crisis)</span>
              <span>0% (Base)</span>
              <span>+60% (Expansión)</span>
            </div>
          </div>

          {/* 2. Eficiencia de Cobranza */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1.5">
              <span className="text-slate-700">Eficiencia de Cobranza (Recuperación)</span>
              <span className="text-blue-700 font-bold">{collectionEfficiencyPct}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="100"
              step="5"
              value={collectionEfficiencyPct}
              onChange={(e) => {
                setCollectionEfficiencyPct(parseInt(e.target.value) || 90);
                setActivePreset('CUSTOM');
              }}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>50% (Mora alta)</span>
              <span>90% (Estándar)</span>
              <span>100% (Óptimo)</span>
            </div>
          </div>

          {/* 3. Variación en Costo de Mercancía (COGS) */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1.5">
              <span className="text-slate-700">Variación en Costos de Insumos (COGS)</span>
              <span className={cogsChangePct <= 0 ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                {cogsChangePct > 0 ? `+${cogsChangePct}%` : `${cogsChangePct}%`}
              </span>
            </div>
            <input
              type="range"
              min="-20"
              max="30"
              step="2"
              value={cogsChangePct}
              onChange={(e) => {
                setCogsChangePct(parseInt(e.target.value) || 0);
                setActivePreset('CUSTOM');
              }}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>-20% (Ahorro)</span>
              <span>0% (Estable)</span>
              <span>+30% (Inflación)</span>
            </div>
          </div>

          {/* 4. Plazo de Crédito a Proveedores */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1.5">
              <span className="text-slate-700">Plazo de Pago a Proveedores</span>
              <span className="text-indigo-700 font-bold">{supplierTermsDays} días</span>
            </div>
            <input
              type="range"
              min="15"
              max="90"
              step="15"
              value={supplierTermsDays}
              onChange={(e) => {
                setSupplierTermsDays(parseInt(e.target.value) || 30);
                setActivePreset('CUSTOM');
              }}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>15 días (Contado)</span>
              <span>30 días</span>
              <span>90 días (Financiamiento)</span>
            </div>
          </div>

          {/* 5. Variación en Gastos Operativos (OPEX) */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1.5">
              <span className="text-slate-700">Ajuste en Gastos Fijos (OPEX)</span>
              <span className={opexChangePct <= 0 ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                {opexChangePct > 0 ? `+${opexChangePct}%` : `${opexChangePct}%`}
              </span>
            </div>
            <input
              type="range"
              min="-30"
              max="30"
              step="5"
              value={opexChangePct}
              onChange={(e) => {
                setOpexChangePct(parseInt(e.target.value) || 0);
                setActivePreset('CUSTOM');
              }}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>-30% (Recorte)</span>
              <span>0% (Presupuesto)</span>
              <span>+30% (Expansión)</span>
            </div>
          </div>
        </div>

        {/* Projected Financial Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Result Highlight Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              className={`p-5 rounded-xl border shadow-xs flex flex-col justify-between ${
                isNetPositive ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider block ${
                      isNetPositive ? 'text-emerald-800' : 'text-rose-800'
                    }`}
                  >
                    Flujo Neto Proyectado
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    Base: {formatCurrency(simulationResult.baseNetCashFlow)}
                  </span>
                </div>
                <p
                  className={`text-3xl font-bold mt-2 ${
                    isNetPositive ? 'text-emerald-900' : 'text-rose-900'
                  }`}
                >
                  {formatCurrency(simulationResult.projectedNetCashFlow)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {simulationResult.netCashFlowDelta >= 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
                  )}
                  <span className={`text-xs font-semibold ${simulationResult.netCashFlowDelta >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    Impacto: {simulationResult.netCashFlowDelta >= 0 ? '+' : ''}{formatCurrency(simulationResult.netCashFlowDelta)}
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/50 flex justify-between text-xs text-slate-600">
                <span>Ingresos Proy: {formatCurrency(simulationResult.projectedInflow)}</span>
                <span>Egresos Proy: {formatCurrency(simulationResult.projectedOutflow)}</span>
              </div>
            </div>

            <div
              className={`p-5 rounded-xl border shadow-xs flex flex-col justify-between ${
                isEbitdaPositive ? 'bg-indigo-50/70 border-indigo-200' : 'bg-amber-50/70 border-amber-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider block ${
                      isEbitdaPositive ? 'text-indigo-800' : 'text-amber-800'
                    }`}
                  >
                    EBITDA Operativo Proyectado
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    Base: {formatCurrency(simulationResult.baseEbitda)}
                  </span>
                </div>
                <p
                  className={`text-3xl font-bold mt-2 ${
                    isEbitdaPositive ? 'text-indigo-900' : 'text-amber-900'
                  }`}
                >
                  {formatCurrency(simulationResult.projectedEbitda)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {simulationResult.ebitdaDelta >= 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5 text-indigo-600" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5 text-amber-600" />
                  )}
                  <span className={`text-xs font-semibold ${simulationResult.ebitdaDelta >= 0 ? 'text-indigo-700' : 'text-amber-700'}`}>
                    Impacto: {simulationResult.ebitdaDelta >= 0 ? '+' : ''}{formatCurrency(simulationResult.ebitdaDelta)}
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/50 flex justify-between text-xs text-slate-600">
                <span>Margen EBITDA: {formatPercent(simulationResult.projectedMarginPct)}</span>
                <span>Ventas Proy: {formatCurrency(simulationResult.projectedSales)}</span>
              </div>
            </div>
          </div>

          {/* Detailed Financial Comparison Table (DATO ACTUAL vs ESCENARIO SIMULADO vs IMPACTO) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-900">
                Impacto Comparativo: Estado Base vs Proyección
              </h4>
              <span className="text-[11px] text-slate-400 font-medium">Moneda: MXN</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[11px]">
                    <th className="py-2 font-semibold">Concepto Financiero</th>
                    <th className="py-2 text-right font-semibold">Dato Actual (Base)</th>
                    <th className="py-2 text-right font-semibold">Escenario Simulado</th>
                    <th className="py-2 text-right font-semibold">Diferencia ($\Delta$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2.5 font-medium text-slate-700">Ventas Totales</td>
                    <td className="py-2.5 text-right font-mono text-slate-500">
                      {formatCurrency(simulationResult.baseSales)}
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(simulationResult.projectedSales)}
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold text-blue-600">
                      {salesGrowthPct >= 0 ? `+${salesGrowthPct}%` : `${salesGrowthPct}%`}
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2.5 font-medium text-slate-700">Costo de Mercancía (COGS)</td>
                    <td className="py-2.5 text-right font-mono text-slate-500">
                      {formatCurrency(simulationResult.baseCogs)}
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(simulationResult.projectedCogs)}
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold text-slate-600">
                      {cogsChangePct >= 0 ? `+${cogsChangePct}%` : `${cogsChangePct}%`}
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2.5 font-medium text-slate-700">Utilidad Bruta Estimada</td>
                    <td className="py-2.5 text-right font-mono text-slate-500">
                      {formatCurrency(simulationResult.baseGrossProfit)}
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(simulationResult.projectedGrossProfit)}
                    </td>
                    <td className={`py-2.5 text-right font-mono font-bold ${simulationResult.grossProfitDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {simulationResult.grossProfitDelta >= 0 ? '+' : ''}{formatCurrency(simulationResult.grossProfitDelta)}
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2.5 font-medium text-slate-700">Gastos Operativos (OPEX)</td>
                    <td className="py-2.5 text-right font-mono text-slate-500">
                      {formatCurrency(simulationResult.baseOpex)}
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(simulationResult.projectedOpex)}
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold text-slate-600">
                      {opexChangePct >= 0 ? `+${opexChangePct}%` : `${opexChangePct}%`}
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/50 bg-indigo-50/40">
                    <td className="py-2.5 font-bold text-indigo-900">Capital de Trabajo Estimado</td>
                    <td className="py-2.5 text-right font-mono text-slate-500">
                      {formatCurrency(simulationResult.baseWorkingCapital)}
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold text-indigo-900">
                      {formatCurrency(simulationResult.projectedWorkingCapital)}
                    </td>
                    <td className={`py-2.5 text-right font-mono font-bold ${simulationResult.workingCapitalDelta >= 0 ? 'text-indigo-700' : 'text-amber-700'}`}>
                      {simulationResult.workingCapitalDelta >= 0 ? '+' : ''}{formatCurrency(simulationResult.workingCapitalDelta)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* AI Advisor Assessment Alert */}
            <div className="mt-4 p-3.5 bg-slate-900 text-white rounded-lg flex items-start gap-3">
              <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-amber-300">Diagnóstico CONSCORE AI:</span>
                <p className="text-slate-300 mt-0.5">{simulationResult.aiAssessment}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Exported component wrapped with ErrorBoundary for zero-crash guarantee
export const FinancialScenarioSimulator: React.FC = () => {
  return (
    <SimulatorErrorBoundary>
      <FinancialScenarioSimulatorInner />
    </SimulatorErrorBoundary>
  );
};
