import React, { useState } from 'react';
import {
  Sliders,
  RotateCcw,
  Sparkles,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShieldAlert,
  Info,
  CheckCircle2,
} from 'lucide-react';
import {
  WhatIfSimulationInput,
  WhatIfSimulationResult,
  ExecutiveKpiSummary,
} from '../../types/erp';
import { ExecutiveIntelligenceService } from '../../services/executiveIntelligenceService';

interface BusinessScenarioSimulatorProps {
  kpis: ExecutiveKpiSummary;
}

const initialInputs: WhatIfSimulationInput = {
  salesGrowthPct: 0,
  priceChangePct: 0,
  cogsReductionPct: 0,
  arDaysImprovement: 0,
  cxpExtensionDays: 0,
  operatingExpenseChangePct: 0,
  inventoryReductionPct: 0,
};

export const BusinessScenarioSimulator: React.FC<BusinessScenarioSimulatorProps> = ({ kpis }) => {
  const [inputs, setInputs] = useState<WhatIfSimulationInput>(initialInputs);

  const simulation: WhatIfSimulationResult = ExecutiveIntelligenceService.simulateWhatIfScenario(
    kpis,
    inputs
  );

  const handleReset = () => {
    setInputs(initialInputs);
  };

  const handleInputChange = (field: keyof WhatIfSimulationInput, value: number) => {
    setInputs((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl backdrop-blur-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-slate-950 font-black shadow-md">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Simulador de Escenarios What-If
              </span>
              <h2 className="text-lg font-bold text-white">Modelador de Sensibilidad Financiera</h2>
              <p className="text-xs text-slate-400">
                Ajusta las palancas de negocio para proyectar el impacto en Utilidad Neta, Flujo de Caja y EBITDA.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-bold text-slate-300 hover:border-slate-700 hover:text-white transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Restablecer Palancas</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Sliders Panel (5 cols) */}
        <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 pb-2 border-b border-slate-800">
            Palancas Estratégicas de Negocio
          </h3>

          {/* 1. Crecimiento en Volumen de Ventas */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Volumen de Ventas</span>
              <span className="font-mono font-bold text-amber-400">
                {inputs.salesGrowthPct > 0 ? `+${inputs.salesGrowthPct}` : inputs.salesGrowthPct}%
              </span>
            </div>
            <input
              type="range"
              min="-30"
              max="50"
              step="5"
              value={inputs.salesGrowthPct}
              onChange={(e) => handleInputChange('salesGrowthPct', Number(e.target.value))}
              className="w-full accent-amber-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
              <span>-30%</span>
              <span>0%</span>
              <span>+50%</span>
            </div>
          </div>

          {/* 2. Ajuste de Precios */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Ajuste de Precios al Público</span>
              <span className="font-mono font-bold text-amber-400">
                {inputs.priceChangePct > 0 ? `+${inputs.priceChangePct}` : inputs.priceChangePct}%
              </span>
            </div>
            <input
              type="range"
              min="-15"
              max="25"
              step="1"
              value={inputs.priceChangePct}
              onChange={(e) => handleInputChange('priceChangePct', Number(e.target.value))}
              className="w-full accent-amber-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
              <span>-15%</span>
              <span>0%</span>
              <span>+25%</span>
            </div>
          </div>

          {/* 3. Negociación de Costo de Ventas (COGS) */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Ahorro en Costo de Compras (COGS)</span>
              <span className="font-mono font-bold text-emerald-400">
                {inputs.cogsReductionPct > 0 ? `-${inputs.cogsReductionPct}` : inputs.cogsReductionPct}%
              </span>
            </div>
            <input
              type="range"
              min="-10"
              max="20"
              step="1"
              value={inputs.cogsReductionPct}
              onChange={(e) => handleInputChange('cogsReductionPct', Number(e.target.value))}
              className="w-full accent-emerald-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
              <span>+10% más caro</span>
              <span>0%</span>
              <span>-20% ahorro</span>
            </div>
          </div>

          {/* 4. Aceleración de Cobranza (DSO) */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Mejora en Cobranza Cartera</span>
              <span className="font-mono font-bold text-blue-400">
                {inputs.arDaysImprovement > 0 ? `-${inputs.arDaysImprovement} días` : `${inputs.arDaysImprovement} días`}
              </span>
            </div>
            <input
              type="range"
              min="-15"
              max="30"
              step="5"
              value={inputs.arDaysImprovement}
              onChange={(e) => handleInputChange('arDaysImprovement', Number(e.target.value))}
              className="w-full accent-blue-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
              <span>+15d atraso</span>
              <span>0d</span>
              <span>-30d cobro rápido</span>
            </div>
          </div>

          {/* 5. Optimización de Gastos Operativos (OPEX) */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Variación en Gastos OPEX</span>
              <span className="font-mono font-bold text-purple-400">
                {inputs.operatingExpenseChangePct > 0 ? `+${inputs.operatingExpenseChangePct}` : inputs.operatingExpenseChangePct}%
              </span>
            </div>
            <input
              type="range"
              min="-25"
              max="25"
              step="5"
              value={inputs.operatingExpenseChangePct}
              onChange={(e) => handleInputChange('operatingExpenseChangePct', Number(e.target.value))}
              className="w-full accent-purple-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
              <span>-25% contención</span>
              <span>0%</span>
              <span>+25% expansión</span>
            </div>
          </div>

          {/* 6. Liquidación de Inventario Lento */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Liberación de Stock Inmovilizado</span>
              <span className="font-mono font-bold text-amber-400">
                {inputs.inventoryReductionPct}% liberado
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              step="5"
              value={inputs.inventoryReductionPct}
              onChange={(e) => handleInputChange('inventoryReductionPct', Number(e.target.value))}
              className="w-full accent-amber-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
              <span>0%</span>
              <span>20%</span>
              <span>40%</span>
            </div>
          </div>
        </div>

        {/* Right: Results Dashboard (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Ventas Proyectadas */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-md">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                Ventas Totales Proyectadas
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-lg font-black text-white font-mono">
                  ${(Number(simulation.simulatedSales) || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                </span>
                <span
                  className={`text-xs font-bold font-mono ${
                    simulation.salesDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {simulation.salesDelta >= 0 ? '+' : ''}
                  ${(Number(simulation.salesDelta) || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Base actual: ${(Number(simulation.baseSales) || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}
              </div>
            </div>

            {/* Margen Bruto */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-md">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                Margen Bruto Proyectado
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-lg font-black text-emerald-400 font-mono">
                  ${(Number(simulation.simulatedGrossProfit) || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                </span>
                <span className="text-xs font-bold font-mono text-emerald-400">
                  {simulation.simulatedGrossMarginPct}%
                </span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Delta: {simulation.grossProfitDelta >= 0 ? '+' : ''}$
                {(Number(simulation.grossProfitDelta) || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}
              </div>
            </div>

            {/* Utilidad Neta */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-md">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                Utilidad Neta Proyectada
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-lg font-black text-amber-300 font-mono">
                  ${(Number(simulation.simulatedNetProfit) || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                </span>
                <span
                  className={`text-xs font-bold font-mono ${
                    simulation.netProfitDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {simulation.netProfitDelta >= 0 ? '+' : ''}
                  ${(Number(simulation.netProfitDelta) || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Base actual: ${(Number(simulation.baseNetProfit) || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}
              </div>
            </div>

            {/* Flujo de Efectivo Neto */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-md">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                Flujo de Efectivo Proyectado
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-lg font-black text-blue-400 font-mono">
                  ${(Number(simulation.simulatedCashFlow) || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                </span>
                <span
                  className={`text-xs font-bold font-mono ${
                    simulation.cashFlowDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {simulation.cashFlowDelta >= 0 ? '+' : ''}
                  ${(Number(simulation.cashFlowDelta) || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Efecto de cartera, inventario y EBITDA
              </div>
            </div>
          </div>

          {/* AI Simulation Verdict & Strategic Recommendation */}
          <div className="rounded-xl border border-amber-500/30 bg-slate-900/90 p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Dictamen de Sensibilidad CONSCORE AI
                </h4>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  simulation.riskLevel === 'BAJO'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : simulation.riskLevel === 'MEDIO'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-rose-500/20 text-rose-400'
                }`}
              >
                Riesgo del Escenario: {simulation.riskLevel}
              </span>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed">{simulation.summary}</p>

            <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-300">
              <b className="text-white">Recomendación Táctica:</b> {simulation.aiRecommendation}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
