/**
 * @license
 * CONSCORE ERP IA - What-If Scenario Simulator View
 * FASE 12 - Simulación Financiera No Destructiva & Aislamiento Estricto
 */

import React, { useState, useMemo } from 'react';
import {
  Sliders,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Layers,
  ArrowRight,
  PlusCircle,
  HelpCircle,
  Clock,
  Zap,
} from 'lucide-react';
import {
  StrategicExecutiveKPIs,
  WhatIfSimulationParameters,
  WhatIfSimulationResult,
  SimulationHorizonDays,
  PresetScenarioType,
  StrategicInitiative,
} from '../../types/strategicPlanningTypes';
import { StrategicPlanningService } from '../../services/strategicPlanningService';

interface WhatIfSimulatorViewProps {
  baselineKPIs: StrategicExecutiveKPIs;
  onSaveToActionPlan?: (initiative: StrategicInitiative) => void;
}

export const WhatIfSimulatorView: React.FC<WhatIfSimulatorViewProps> = ({
  baselineKPIs,
  onSaveToActionPlan,
}) => {
  // Default Simulation Parameters
  const defaultParams: WhatIfSimulationParameters = {
    scenarioName: 'Escenario Estratégico Personalizado',
    scenarioType: 'PERSONALIZADO',
    horizonDays: 90,
    priceChangePct: 4,
    volumeChangePct: 10,
    cogsChangePct: 0,
    salesCommissionRateChangePct: 0,
    logisticsCostChangePct: -5,
    inventoryStockIncreasePct: 0,
    marketingBudgetChangePct: 15,
    newSellersHiredCount: 1,
    averageSellerQuotaMonthly: 250000,
    salariesIncreasePct: 0,
    operatingExpensesChangePct: 0,
    dsoDaysChange: -5,
    dpoDaysChange: +3,
    assumptions: [
      'Ajuste de precio selectivo +4% en materiales de alta densidad térmica.',
      'Ahorro logístico de 5% por optimización de rutas en zona Noreste.',
      'Contratación de 1 ejecutivo técnico para zona Bajío con cuota mensual de $250k MXN.',
      'Aceleración de cobranza para reducir DSO en 5 días.',
    ],
    risksIdentified: [
      'Riesgo moderado de fricción inicial en clientes con contrato marco próximo a vencer.',
    ],
  };

  const [params, setParams] = useState<WhatIfSimulationParameters>(defaultParams);
  const [selectedHorizon, setSelectedHorizon] = useState<SimulationHorizonDays>(90);
  const [activePreset, setActivePreset] = useState<PresetScenarioType>('PERSONALIZADO');
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);

  // Apply Preset Scenarios
  const applyPreset = (preset: PresetScenarioType) => {
    setActivePreset(preset);
    if (preset === 'CONSERVADOR') {
      setParams({
        scenarioName: 'Escenario Conservador (Estrés & Prudencia)',
        scenarioType: 'CONSERVADOR',
        horizonDays: selectedHorizon,
        priceChangePct: 0,
        volumeChangePct: 2,
        cogsChangePct: 4,
        salesCommissionRateChangePct: 0,
        logisticsCostChangePct: 3,
        inventoryStockIncreasePct: 5,
        marketingBudgetChangePct: 0,
        newSellersHiredCount: 0,
        averageSellerQuotaMonthly: 250000,
        salariesIncreasePct: 4,
        operatingExpensesChangePct: 3,
        dsoDaysChange: +8,
        dpoDaysChange: -4,
        assumptions: ['Inflación en materias primas (+4%) y retrasos de clientes en pagos (+8 días DSO)'],
        risksIdentified: ['Compresión de margen y flujo de caja'],
      });
    } else if (preset === 'ESPERADO') {
      setParams({
        scenarioName: 'Escenario Esperado (Plan de Negocio 2026)',
        scenarioType: 'ESPERADO',
        horizonDays: selectedHorizon,
        priceChangePct: 2,
        volumeChangePct: 8,
        cogsChangePct: 1,
        salesCommissionRateChangePct: 0,
        logisticsCostChangePct: -3,
        inventoryStockIncreasePct: 0,
        marketingBudgetChangePct: 10,
        newSellersHiredCount: 1,
        averageSellerQuotaMonthly: 250000,
        salariesIncreasePct: 2,
        operatingExpensesChangePct: 1,
        dsoDaysChange: -3,
        dpoDaysChange: +2,
        assumptions: ['Crecimiento orgánico sostenido con 1 vendedor adicional y control de gastos'],
        risksIdentified: ['Bajo riesgo operativo'],
      });
    } else if (preset === 'OPTIMISTA') {
      setParams({
        scenarioName: 'Escenario Optimista (Expansión de Alta Rentabilidad)',
        scenarioType: 'OPTIMISTA',
        horizonDays: selectedHorizon,
        priceChangePct: 5,
        volumeChangePct: 15,
        cogsChangePct: -1,
        salesCommissionRateChangePct: 0,
        logisticsCostChangePct: -8,
        inventoryStockIncreasePct: 10,
        marketingBudgetChangePct: 25,
        newSellersHiredCount: 2,
        averageSellerQuotaMonthly: 300000,
        salariesIncreasePct: 3,
        operatingExpensesChangePct: 2,
        dsoDaysChange: -8,
        dpoDaysChange: +5,
        assumptions: ['Captura de nuevos proyectos en Pemex y CFE con precio +5% y 2 nuevos ejecutivos'],
        risksIdentified: ['Capacidad de almacén cercana al 95%'],
      });
    } else if (preset === 'BASE') {
      setParams({
        scenarioName: 'Escenario Base (Sin Modificaciones)',
        scenarioType: 'BASE',
        horizonDays: selectedHorizon,
        priceChangePct: 0,
        volumeChangePct: 0,
        cogsChangePct: 0,
        salesCommissionRateChangePct: 0,
        logisticsCostChangePct: 0,
        inventoryStockIncreasePct: 0,
        marketingBudgetChangePct: 0,
        newSellersHiredCount: 0,
        averageSellerQuotaMonthly: 250000,
        salariesIncreasePct: 0,
        operatingExpensesChangePct: 0,
        dsoDaysChange: 0,
        dpoDaysChange: 0,
        assumptions: ['Línea base actual del negocio'],
        risksIdentified: [],
      });
    }
  };

  // Run isolated simulation engine
  const simResult: WhatIfSimulationResult = useMemo(() => {
    return StrategicPlanningService.runWhatIfSimulation(
      { ...params, horizonDays: selectedHorizon },
      baselineKPIs
    );
  }, [params, selectedHorizon, baselineKPIs]);

  const handleSaveToPlan = () => {
    if (!onSaveToActionPlan) return;
    const newInit: StrategicInitiative = {
      initiativeId: `INIT-SIM-${Date.now().toString().slice(-4)}`,
      objectiveId: 'OBJ-2026-001',
      objectiveName: 'Maximizar Rentabilidad y Expansión del Margen EBITDA',
      name: `Iniciativa What-If: ${params.scenarioName}`,
      description: `Simulación calculada a ${selectedHorizon} días. Impacto proyectado en EBITDA: +$${(Number(Math.round(simResult.ebitdaDelta)) || 0).toLocaleString('es-MX')} MXN. Supuestos: Precio ${params.priceChangePct > 0 ? '+' : ''}${params.priceChangePct}%, Volumen ${params.volumeChangePct > 0 ? '+' : ''}${params.volumeChangePct}%, Vendedores +${params.newSellersHiredCount}.`,
      ownerId: 'USR-001',
      ownerName: 'Lic. Fernando Garza (Director General)',
      department: 'Estrategia & Finanzas',
      budget: 50000,
      spentBudget: 0,
      expectedFinancialImpact: Math.max(0, simResult.ebitdaDelta),
      actualFinancialImpact: 0,
      expectedImpactSummary: `Score de conveniencia: ${simResult.financialConvenienceScore}/100. Driver principal: ${simResult.primaryDriver}.`,
      impactScore: Math.min(10, Math.max(1, Math.round(simResult.financialConvenienceScore / 10))),
      effortScore: 4,
      matrixClassification: simResult.financialConvenienceScore > 75 ? 'QUICK_WINS' : 'STRATEGIC',
      startDate: new Date().toISOString().split('T')[0],
      targetDate: new Date(Date.now() + selectedHorizon * 86400000).toISOString().split('T')[0],
      status: 'PLANNED',
      priority: 'HIGH',
      notes: 'Generado desde el Simulador What-If no destructivo de Fase 12.',
    };

    onSaveToActionPlan(newInit);
    setSavedSuccessMsg('¡Simulación registrada con éxito en el Plan de Iniciativas Estratégicas!');
    setTimeout(() => setSavedSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header & Isolation Guarantee */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-500/30 p-6 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-black border border-cyan-500/40 font-mono flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> AMBIENTE AISLADO [SCENARIO_DATA]
            </span>
            <span className="text-xs text-slate-400 font-bold">
              Cero mutación de datos reales
            </span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Sliders className="h-6 w-6 text-cyan-400" />
            Simulador Financiero & Sensibilidad What-If
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            Modela escenarios de precio, volumen, costos Kardex, nómina y condiciones de crédito en un entorno estrictamente aislado.
          </p>
        </div>

        {/* Preset Selector Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-700/80 overflow-x-auto no-scrollbar">
          {(['BASE', 'CONSERVADOR', 'ESPERADO', 'OPTIMISTA', 'PERSONALIZADO'] as PresetScenarioType[]).map((type) => (
            <button
              key={type}
              onClick={() => applyPreset(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                activePreset === type
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {savedSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-lg">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          {savedSuccessMsg}
        </div>
      )}

      {/* Main Simulator Layout: Controls (Left) vs Real-Time Output (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Parameter Sliders & Toggles (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl bg-slate-800/90 border border-slate-700/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Sliders className="h-4 w-4 text-cyan-400" />
                Variables de Simulación
              </h3>
              <button
                onClick={() => applyPreset('BASE')}
                className="text-[11px] font-bold text-slate-400 hover:text-white flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            </div>

            {/* Horizon Selector */}
            <div>
              <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1.5">
                Horizonte de Simulación
              </label>
              <div className="grid grid-cols-5 gap-1">
                {([30, 60, 90, 180, 365] as SimulationHorizonDays[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setSelectedHorizon(d)}
                    className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                      selectedHorizon === d
                        ? 'bg-cyan-600 text-white shadow'
                        : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-750'
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>

            {/* Slider 1: Precio de Venta */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-200">Ajuste de Precio de Venta:</span>
                <span className="font-mono font-black text-cyan-400">
                  {params.priceChangePct > 0 ? `+${params.priceChangePct}%` : `${params.priceChangePct}%`}
                </span>
              </div>
              <input
                type="range"
                min="-10"
                max="20"
                step="1"
                value={params.priceChangePct}
                onChange={(e) => {
                  setParams({ ...params, priceChangePct: Number(e.target.value) });
                  setActivePreset('PERSONALIZADO');
                }}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>-10%</span>
                <span>0% (Base)</span>
                <span>+20%</span>
              </div>
            </div>

            {/* Slider 2: Volumen de Venta */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-200">Volumen de Ventas (Demanda):</span>
                <span className="font-mono font-black text-cyan-400">
                  {params.volumeChangePct > 0 ? `+${params.volumeChangePct}%` : `${params.volumeChangePct}%`}
                </span>
              </div>
              <input
                type="range"
                min="-20"
                max="30"
                step="1"
                value={params.volumeChangePct}
                onChange={(e) => {
                  setParams({ ...params, volumeChangePct: Number(e.target.value) });
                  setActivePreset('PERSONALIZADO');
                }}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>-20%</span>
                <span>0%</span>
                <span>+30%</span>
              </div>
            </div>

            {/* Slider 3: Costo de Ventas (COGS) */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-200">Variación Costo COGS (Materia Prima):</span>
                <span className="font-mono font-black text-amber-400">
                  {params.cogsChangePct > 0 ? `+${params.cogsChangePct}%` : `${params.cogsChangePct}%`}
                </span>
              </div>
              <input
                type="range"
                min="-10"
                max="15"
                step="1"
                value={params.cogsChangePct}
                onChange={(e) => {
                  setParams({ ...params, cogsChangePct: Number(e.target.value) });
                  setActivePreset('PERSONALIZADO');
                }}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>-10%</span>
                <span>0%</span>
                <span>+15%</span>
              </div>
            </div>

            {/* Slider 4: Vendedores Nuevos */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-200">Nuevos Vendedores Técnicos:</span>
                <span className="font-mono font-black text-indigo-400">
                  +{params.newSellersHiredCount} ejecutivos
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="1"
                value={params.newSellersHiredCount}
                onChange={(e) => {
                  setParams({ ...params, newSellersHiredCount: Number(e.target.value) });
                  setActivePreset('PERSONALIZADO');
                }}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-400"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0</span>
                <span>+2</span>
                <span>+5</span>
              </div>
            </div>

            {/* Slider 5: Costo Logístico */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-200">Costo Logístico / Fletes:</span>
                <span className="font-mono font-black text-purple-400">
                  {params.logisticsCostChangePct > 0 ? `+${params.logisticsCostChangePct}%` : `${params.logisticsCostChangePct}%`}
                </span>
              </div>
              <input
                type="range"
                min="-15"
                max="15"
                step="1"
                value={params.logisticsCostChangePct}
                onChange={(e) => {
                  setParams({ ...params, logisticsCostChangePct: Number(e.target.value) });
                  setActivePreset('PERSONALIZADO');
                }}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-400"
              />
            </div>

            {/* Slider 6: Cobranza DSO */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-200">Variación Días de Cartera (DSO):</span>
                <span className="font-mono font-black text-emerald-400">
                  {params.dsoDaysChange > 0 ? `+${params.dsoDaysChange}d` : `${params.dsoDaysChange}d`}
                </span>
              </div>
              <input
                type="range"
                min="-15"
                max="20"
                step="1"
                value={params.dsoDaysChange}
                onChange={(e) => {
                  setParams({ ...params, dsoDaysChange: Number(e.target.value) });
                  setActivePreset('PERSONALIZADO');
                }}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Real-Time Financial Results (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Executive Scorecard Result */}
          <div className="rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-850 border border-slate-700/80 p-6 shadow-md space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-700/60 gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">
                  Horizonte: {selectedHorizon} Días · Modo Proyección
                </span>
                <h3 className="text-lg font-black text-white flex items-center gap-2 mt-0.5">
                  Resultados Financieros Simulados
                </h3>
              </div>

              {/* Convenience Score */}
              <div className="flex items-center gap-3 bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-700">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Conveniencia Financiera</span>
                  <span className="text-xs font-bold text-slate-200">{simResult.primaryDriver}</span>
                </div>
                <div
                  className={`h-11 w-11 rounded-full flex items-center justify-center font-black text-sm font-mono border-2 ${
                    simResult.financialConvenienceScore >= 75
                      ? 'border-emerald-400 text-emerald-400 bg-emerald-500/10'
                      : simResult.financialConvenienceScore >= 45
                      ? 'border-yellow-400 text-yellow-400 bg-yellow-500/10'
                      : 'border-rose-400 text-rose-400 bg-rose-500/10'
                  }`}
                >
                  {simResult.financialConvenienceScore}
                </div>
              </div>
            </div>

            {/* Financial Comparison Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {/* Ventas Netas */}
              <div className="rounded-xl bg-slate-950/70 p-3.5 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 block">Ventas Netas:</span>
                <p className="text-base font-black font-mono text-white">
                  ${(simResult.simulatedRevenue / 1000000).toFixed(2)}M
                </p>
                <div className="flex items-center gap-1 text-[11px] font-mono">
                  {simResult.revenueDelta >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
                  )}
                  <span className={(simResult?.revenueDelta || 0) >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {(simResult?.revenueDelta || 0) >= 0 ? '+' : ''}${Math.round(simResult?.revenueDelta || 0).toLocaleString('es-MX')}
                  </span>
                </div>
              </div>

              {/* Margen Bruto */}
              <div className="rounded-xl bg-slate-950/70 p-3.5 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 block">Margen Bruto:</span>
                <p className="text-base font-black font-mono text-cyan-400">
                  {(simResult?.grossMarginPct || 0).toFixed(1)}%
                </p>
                <span className="text-[11px] font-mono text-slate-300 block">
                  ${((simResult?.simulatedGrossProfit || 0) / 1000000).toFixed(2)}M MXN
                </span>
              </div>

              {/* EBITDA */}
              <div className="rounded-xl bg-slate-950/70 p-3.5 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 block">EBITDA Proyectado:</span>
                <p className="text-base font-black font-mono text-emerald-400">
                  ${((simResult?.simulatedEbitda || 0) / 1000000).toFixed(2)}M
                </p>
                <div className="flex items-center gap-1 text-[11px] font-mono">
                  <span className={(simResult?.ebitdaDelta || 0) >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {(simResult?.ebitdaDelta || 0) >= 0 ? '+' : ''}${Math.round(simResult?.ebitdaDelta || 0).toLocaleString('es-MX')} ({(simResult?.ebitdaMarginPct || 0).toFixed(1)}%)
                  </span>
                </div>
              </div>

              {/* Flujo Operativo de Caja */}
              <div className="rounded-xl bg-slate-950/70 p-3.5 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 block">Flujo de Caja Op:</span>
                <p className="text-base font-black font-mono text-white">
                  ${((simResult?.simulatedOperatingCashFlow || 0) / 1000000).toFixed(2)}M
                </p>
                <span className="text-[11px] text-slate-400 font-mono">
                  DSO estimado: {(baselineKPIs?.dsoDays || 42) + (params?.dsoDaysChange || 0)}d
                </span>
              </div>

              {/* Capital de Trabajo */}
              <div className="rounded-xl bg-slate-950/70 p-3.5 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 block">Capital de Trabajo:</span>
                <p className="text-base font-black font-mono text-slate-200">
                  ${((simResult?.simulatedWorkingCapital || 0) / 1000000).toFixed(2)}M
                </p>
                <span className="text-[10px] text-slate-400 font-mono">
                  Δ: {(simResult?.workingCapitalDelta || 0) > 0 ? '+' : ''}${((simResult?.workingCapitalDelta || 0) / 1000000).toFixed(2)}M
                </span>
              </div>

              {/* Financiamiento Necesario */}
              <div className="rounded-xl bg-slate-950/70 p-3.5 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 block">Necesidad Financiamiento:</span>
                <p className="text-base font-black font-mono text-amber-400">
                  ${(simResult?.externalFinancingRequirement || 0).toLocaleString('es-MX')}
                </p>
                <span className="text-[10px] text-slate-400">
                  {simResult.externalFinancingRequirement === 0 ? 'Autofinanciable' : 'Requiere Crédito'}
                </span>
              </div>
            </div>

            {/* Recommendation Note Card */}
            <div className="rounded-xl bg-slate-950/80 p-4 border border-slate-700/60 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wide block">
                  Diagnóstico del Motor de Simulación
                </span>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {simResult.recommendationNote}
                </p>
              </div>

              <button
                onClick={handleSaveToPlan}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md shadow-indigo-950 shrink-0 transition-all flex items-center gap-1.5"
              >
                <PlusCircle className="h-4 w-4" />
                Guardar en Plan OKR
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
