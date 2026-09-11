import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  AlertTriangle,
  Bot,
  Sparkles,
  PieChart,
  BarChart3,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';

export const SalesForecast: React.FC = () => {
  const { opportunities, pipelineStages, salesGoals } = useERP();

  const [selectedRep, setSelectedRep] = useState('TODOS');

  // Filter opportunities
  const filteredOpps = opportunities.filter((o) => {
    return selectedRep === 'TODOS' || o.salespersonId === selectedRep;
  });

  // Calculate totals
  const totalPipeline = filteredOpps.reduce((acc, o) => acc + o.estimatedValue, 0);
  const weightedPipeline = filteredOpps.reduce(
    (acc, o) => acc + o.estimatedValue * (o.probability / 100),
    0
  );

  // Scenarios
  // Optimistic: all opportunities with prob >= 30% close at 100%, others at current prob
  const optimisticValue = filteredOpps.reduce(
    (acc, o) => acc + (o.probability >= 30 ? o.estimatedValue : o.estimatedValue * 0.5),
    0
  );
  // Pessimistic: only opportunities >= 70% probability close at 80% value
  const pessimisticValue = filteredOpps.reduce(
    (acc, o) => acc + (o.probability >= 70 ? o.estimatedValue * 0.8 : 0),
    0
  );

  // Target comparison
  const totalTarget = salesGoals.filter((g) => g.period === 'Agosto 2026').reduce((acc, g) => acc + (g.targetAmount ?? g.goalAmount), 0);
  const quotaGap = totalTarget - weightedPipeline;

  // Breakdown by stage
  const stageBreakdown = pipelineStages.map((stage) => {
    const oppsInStage = filteredOpps.filter((o) => o.stage === stage.code || o.stage === stage.name);
    const nominal = oppsInStage.reduce((acc, o) => acc + o.estimatedValue, 0);
    const weighted = oppsInStage.reduce((acc, o) => acc + o.estimatedValue * (o.probability / 100), 0);
    return {
      stage,
      count: oppsInStage.length,
      nominal,
      weighted,
    };
  });

  const distinctReps: Array<{ id: string; name: string }> = Array.from(
    new Set(opportunities.map((o) => JSON.stringify({ id: o.salespersonId, name: o.salespersonName })))
  ).map((s) => JSON.parse(s as string));

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400 text-slate-950">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Pronóstico de Ventas & Análisis Ponderado (Forecast)</h3>
            <p className="text-xs text-slate-400">Proyección estocástica basada en probabilidades de cierre y etapas</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-semibold">Filtrar por Vendedor:</label>
          <select
            value={selectedRep}
            onChange={(e) => setSelectedRep(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-200 focus:border-yellow-400 focus:outline-none"
          >
            <option value="TODOS">Todo el Equipo Comercial</option>
            {distinctReps.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3 Scenarios Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pesimista */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-red-400">Escenario Pesimista</span>
            <span className="rounded bg-red-950/60 border border-red-800/40 px-2 py-0.5 text-[10px] font-bold text-red-300">
              Prob. &gt; 70%
            </span>
          </div>
          <p className="text-2xl font-black text-white">${(Number(Math.round(pessimisticValue)) || 0).toLocaleString('es-MX')}</p>
          <p className="text-xs text-slate-400">
            Solo considera oportunidades con acuerdos verbales avanzados y cotizaciones aceptadas.
          </p>
        </div>

        {/* Probable / Ponderado IA */}
        <div className="rounded-xl border border-yellow-400/40 bg-slate-900 p-5 shadow-md space-y-2 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-yellow-400/10 blur-xl pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-yellow-400 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" />
              Escenario Ponderado (Forecast Realista)
            </span>
            <span className="rounded bg-yellow-400/20 border border-yellow-400/30 px-2 py-0.5 text-[10px] font-black text-yellow-300">
              IA CONSCORE
            </span>
          </div>
          <p className="text-2xl font-black text-yellow-400">
            ${(Number(Math.round(weightedPipeline)) || 0).toLocaleString('es-MX')}
          </p>
          <p className="text-xs text-slate-300">
            Valor ponderado matemático (<code className="text-yellow-300">Σ(Monto × Probabilidad)</code>) de todas las oportunidades activas.
          </p>
        </div>

        {/* Optimista */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Escenario Optimista</span>
            <span className="rounded bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
              Pipeline Total
            </span>
          </div>
          <p className="text-2xl font-black text-white">${(Number(Math.round(optimisticValue)) || 0).toLocaleString('es-MX')}</p>
          <p className="text-xs text-slate-400">
            Conversión acelerada de cotizaciones y proyectos en etapa de información.
          </p>
        </div>
      </div>

      {/* Target Gap Analysis */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
        <h4 className="text-sm font-bold text-white mb-2">Análisis de Brecha contra Cuota (Gap to Target)</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="space-y-1">
            <span className="text-xs text-slate-400">Cuota Mensual Objetivo</span>
            <p className="text-lg font-bold text-white">${(Number(totalTarget) || 0).toLocaleString('es-MX')} MXN</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-slate-400">Cierre Estimado Ponderado</span>
            <p className="text-lg font-bold text-yellow-400">${(Number(Math.round(weightedPipeline)) || 0).toLocaleString('es-MX')} MXN</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-slate-400">Estado de Cobertura</span>
            <p className={`text-lg font-bold ${quotaGap <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {quotaGap <= 0 ? '✓ Cuota 100% Cubierta por Pipeline' : `Brecha: $${(Number(Math.round(quotaGap)) || 0).toLocaleString('es-MX')} MXN`}
            </p>
          </div>
        </div>
      </div>

      {/* Stage Breakdown Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 shadow-sm overflow-hidden">
        <div className="border-b border-slate-800 bg-slate-950/80 px-6 py-4">
          <h4 className="text-sm font-bold text-white">Desglose de Pipeline por Etapa</h4>
          <p className="text-xs text-slate-400">Distribución de valor nominal y ponderado por cada estado</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-3">Etapa del Pipeline</th>
                <th className="px-6 py-3 text-center">Probabilidad</th>
                <th className="px-6 py-3 text-center">Oportunidades</th>
                <th className="px-6 py-3 text-right">Valor Nominal Total</th>
                <th className="px-6 py-3 text-right">Valor Ponderado</th>
                <th className="px-6 py-3 text-right">% del Forecast</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {stageBreakdown.map(({ stage, count, nominal, weighted }) => {
                const pctOfForecast = weightedPipeline > 0 ? (weighted / weightedPipeline) * 100 : 0;

                return (
                  <tr key={stage.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${stage.color || 'bg-blue-400'}`} />
                        <span className="font-bold text-white">{stage.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-center font-bold text-yellow-400">{stage.probability}%</td>
                    <td className="px-6 py-3.5 text-center font-bold text-slate-200">{count}</td>
                    <td className="px-6 py-3.5 text-right font-medium text-slate-300">
                      ${(Number(nominal) || 0).toLocaleString('es-MX')} MXN
                    </td>
                    <td className="px-6 py-3.5 text-right font-bold text-emerald-400">
                      ${(Number(Math.round(weighted)) || 0).toLocaleString('es-MX')} MXN
                    </td>
                    <td className="px-6 py-3.5 text-right font-bold text-slate-300">
                      {pctOfForecast.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
