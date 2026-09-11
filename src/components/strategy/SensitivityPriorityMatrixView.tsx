/**
 * @license
 * CONSCORE ERP IA - Sensitivity Analysis & Strategic Priority Matrix (Impact vs Effort)
 * FASE 12 - Matriz de Decisión Ejecutiva & Análisis de Sensibilidad
 */

import React, { useState } from 'react';
import {
  TrendingUp,
  Activity,
  Zap,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Sliders,
  DollarSign,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import {
  PriorityMatrixItem,
  SensitivityVariableEffect,
  MatrixClassification,
} from '../../types/strategicPlanningTypes';

interface SensitivityPriorityMatrixViewProps {
  priorityItems: PriorityMatrixItem[];
  sensitivityEffects: SensitivityVariableEffect[];
  onSelectScenario: () => void;
}

export const SensitivityPriorityMatrixView: React.FC<SensitivityPriorityMatrixViewProps> = ({
  priorityItems,
  sensitivityEffects,
  onSelectScenario,
}) => {
  const [selectedQuadrant, setSelectedQuadrant] = useState<MatrixClassification | 'ALL'>('ALL');

  const quadrants: { id: MatrixClassification; label: string; desc: string; color: string; badge: string }[] = [
    {
      id: 'QUICK_WINS',
      label: '1. Quick Wins (Alto Impacto / Bajo Esfuerzo)',
      desc: 'Ejecución prioritaria inmediata: alto retorno con mínima inversión o tiempo.',
      color: 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300',
      badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    },
    {
      id: 'STRATEGIC',
      label: '2. Proyectos Estratégicos (Alto Impacto / Alto Esfuerzo)',
      desc: 'Transformación y crecimiento de mediano plazo: requieren presupuesto y gestión.',
      color: 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300',
      badge: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40',
    },
    {
      id: 'LOW_PRIORITY',
      label: '3. Baja Prioridad (Bajo Impacto / Alto Esfuerzo)',
      desc: 'Evaluar postergación o descarte: alto consumo de recursos para poco retorno.',
      color: 'bg-slate-900/60 border-slate-700/60 text-slate-400',
      badge: 'bg-slate-700 text-slate-300',
    },
    {
      id: 'AVOID',
      label: '4. Tareas a Evitar / Descartar (Bajo Impacto / Alto Riesgo)',
      desc: 'Descartar de inmediato para evitar destrucción de valor o distracción.',
      color: 'bg-rose-950/40 border-rose-500/40 text-rose-300',
      badge: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
    },
  ];

  const filteredItems = selectedQuadrant === 'ALL'
    ? priorityItems
    : priorityItems.filter((i) => i.quadrant === selectedQuadrant);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-indigo-400" />
            Matriz de Priorización (Impacto vs Esfuerzo) & Sensibilidad
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Identificación de las palancas financieras de mayor apalancamiento y clasificación de proyectos estratégicos.
          </p>
        </div>

        <button
          onClick={onSelectScenario}
          className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-950 transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Sliders className="h-4 w-4" />
          Probar en Simulador What-If
        </button>
      </div>

      {/* Part 1: Sensitivity Analysis Table */}
      <div className="rounded-2xl bg-slate-800/90 border border-slate-700/80 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-black text-white">
                Análisis de Sensibilidad de Variables Financieras
              </h3>
              <p className="text-[11px] text-slate-400">
                Efecto marginal de cada variable sobre el EBITDA, Flujo de Caja y Capital de Trabajo.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/40">
            Rank de Apalancamiento
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono text-[11px]">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 font-sans text-xs bg-slate-900/50">
                <th className="py-3 px-3">#</th>
                <th className="py-3 px-3">Variable Clave</th>
                <th className="py-3 px-3">Variación Test</th>
                <th className="py-3 px-3 text-right">Impacto EBITDA</th>
                <th className="py-3 px-3 text-right">Impacto Flujo Caja</th>
                <th className="py-3 px-3 text-right">Margen Bruto Δ</th>
                <th className="py-3 px-3 text-center">Nivel Impacto</th>
                <th className="py-3 px-4 font-sans">Comentario Estratégico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {sensitivityEffects.map((eff) => (
                <tr key={eff.leverageRank} className="hover:bg-slate-750 transition-colors">
                  <td className="py-3 px-3 font-bold text-indigo-400">
                    #{eff.leverageRank}
                  </td>
                  <td className="py-3 px-3 font-sans font-bold text-slate-200 text-xs">
                    {eff.variableName}
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    {eff.testShift}
                  </td>
                  <td className={`py-3 px-3 text-right font-bold ${(eff?.ebitdaImpactMXN || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {(eff?.ebitdaImpactMXN || 0) >= 0 ? '+' : ''}${(eff?.ebitdaImpactMXN || 0).toLocaleString('es-MX')}
                  </td>
                  <td className={`py-3 px-3 text-right font-bold ${(eff?.cashFlowImpactMXN || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {(eff?.cashFlowImpactMXN || 0) >= 0 ? '+' : ''}${(eff?.cashFlowImpactMXN || 0).toLocaleString('es-MX')}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-300">
                    {eff.grossMarginImpactPct > 0 ? `+${eff.grossMarginImpactPct}%` : `${eff.grossMarginImpactPct}%`}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                      eff.impactLevel === 'HIGH_IMPACT'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : eff.impactLevel === 'MEDIUM_IMPACT'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-700 text-slate-300'
                    }`}>
                      {eff.impactLevel === 'HIGH_IMPACT' ? 'ALTO' : eff.impactLevel === 'MEDIUM_IMPACT' ? 'MEDIO' : 'BAJO'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-300 text-[11px]">
                    {eff.commentary}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Part 2: Impact vs Effort Priority Matrix */}
      <div className="rounded-2xl bg-slate-800/90 border border-slate-700/80 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-700/60 gap-3">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-400" />
              Matriz Estratégica de Impacto vs Esfuerzo (4 Cuadrantes)
            </h3>
            <p className="text-[11px] text-slate-400">
              Clasificación de iniciativas para optimizar asignación de recursos y maximizar ROI.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-700/80 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedQuadrant('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedQuadrant === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todas ({priorityItems.length})
            </button>
            {quadrants.map((q) => (
              <button
                key={q.id}
                onClick={() => setSelectedQuadrant(q.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedQuadrant === q.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {q.label.split('(')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Quadrant Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quadrants.map((q) => {
            if (selectedQuadrant !== 'ALL' && selectedQuadrant !== q.id) return null;
            const items = priorityItems.filter((i) => i.quadrant === q.id);

            return (
              <div key={q.id} className={`rounded-2xl border p-4 space-y-3 ${q.color}`}>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider">{q.label}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${q.badge}`}>
                    {items.length} proyectos
                  </span>
                </div>
                <p className="text-[11px] opacity-80">{q.desc}</p>

                <div className="space-y-2 pt-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl bg-slate-900/80 p-3.5 border border-slate-800 space-y-2 text-slate-200 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono text-indigo-400 font-bold block">
                            {item.category}
                          </span>
                          <h5 className="text-xs font-bold text-white">{item.title}</h5>
                        </div>
                        <div className="text-right font-mono text-xs">
                          <span className="text-[10px] text-slate-400 block">ROI:</span>
                          <span className="font-bold text-emerald-400">{item.roiRatio}x</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-800 font-mono">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Retorno Estimado:</span>
                          <span className="text-emerald-400 font-bold">+${(item?.estimatedReturnMXN || 0).toLocaleString('es-MX')}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Costo Estimado:</span>
                          <span className="text-slate-300">${(item?.estimatedCostMXN || 0).toLocaleString('es-MX')}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                        <span>Resp: {item.recommendedOwner}</span>
                        <span>Plazo: {item.suggestedTimeframe}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
