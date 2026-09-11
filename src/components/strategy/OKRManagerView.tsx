/**
 * @license
 * CONSCORE ERP IA - OKR Manager View (Objectives & Key Results)
 * FASE 12 - Jerarquía de Objetivos, Resultados Clave e Iniciativas
 */

import React, { useState } from 'react';
import {
  Target,
  ChevronDown,
  ChevronRight,
  User,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  ArrowUpRight,
  Zap,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import {
  StrategicObjective,
  OKRKeyResult,
  StrategicInitiative,
  StrategicObjectiveStatus,
} from '../../types/strategicPlanningTypes';

interface OKRManagerViewProps {
  objectives: StrategicObjective[];
  keyResults: OKRKeyResult[];
  initiatives: StrategicInitiative[];
  onUpdateObjective: (objective: StrategicObjective) => void;
  onUpdateKR: (kr: OKRKeyResult) => void;
  onUpdateInitiative: (init: StrategicInitiative) => void;
}

export const OKRManagerView: React.FC<OKRManagerViewProps> = ({
  objectives,
  keyResults,
  initiatives,
  onUpdateObjective,
  onUpdateKR,
  onUpdateInitiative,
}) => {
  const [expandedObjectiveIds, setExpandedObjectiveIds] = useState<string[]>(
    objectives.map((o) => o.objectiveId)
  );

  const toggleExpand = (id: string) => {
    setExpandedObjectiveIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const getStatusBadge = (status: StrategicObjectiveStatus) => {
    switch (status) {
      case 'ON_TRACK':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            EN TIEMPO
          </span>
        );
      case 'AT_RISK':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
            EN RIESGO
          </span>
        );
      case 'DELAYED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30">
            RETRASADO
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            COMPLETADO
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-700 text-slate-300">
            NO INICIADO
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Target className="h-6 w-6 text-indigo-400" />
            OKR Master Manager (Objetivos & Resultados Clave)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Estructura jerárquica: Objetivo Estratégico → Key Results Cuantificables → Iniciativas de Acción → Responsable.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpandedObjectiveIds(objectives.map((o) => o.objectiveId))}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
          >
            Expandir Todos
          </button>
          <button
            onClick={() => setExpandedObjectiveIds([])}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
          >
            Colapsar Todos
          </button>
        </div>
      </div>

      {/* Objectives Tree */}
      <div className="space-y-4">
        {objectives.map((obj) => {
          const isExpanded = (expandedObjectiveIds || []).includes(obj.objectiveId);
          const objKRs = keyResults.filter((kr) => kr.objectiveId === obj.objectiveId);
          const objInits = initiatives.filter((init) => init.objectiveId === obj.objectiveId);

          return (
            <div
              key={obj.objectiveId}
              className="rounded-2xl bg-slate-800/90 border border-slate-700/80 overflow-hidden shadow-sm transition-all"
            >
              {/* Objective Header Card */}
              <div
                onClick={() => toggleExpand(obj.objectiveId)}
                className="p-5 bg-gradient-to-r from-slate-800 via-slate-800/90 to-slate-850 cursor-pointer hover:bg-slate-750 transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <button className="mt-1 text-slate-400 hover:text-white">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-indigo-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    )}
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-xs font-black border border-indigo-500/40">
                        {obj.code}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        Perspectiva {obj.perspective}
                      </span>
                      {getStatusBadge(obj.status)}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                        Prioridad {obj.priority}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-white">{obj.name}</h3>
                    <p className="text-xs text-slate-300 max-w-3xl">{obj.description}</p>
                  </div>
                </div>

                {/* Progress and Owner */}
                <div className="flex items-center gap-6 self-end md:self-center">
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-xs text-slate-400">Progreso Global:</span>
                      <span className="text-sm font-black font-mono text-cyan-400">
                        {obj.progress}%
                      </span>
                    </div>
                    <div className="w-32 h-2 rounded-full bg-slate-700 overflow-hidden mt-1">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full"
                        style={{ width: `${obj.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Responsable: {obj.ownerName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expanded Children: Key Results & Initiatives */}
              {isExpanded && (
                <div className="p-5 border-t border-slate-700/60 bg-slate-900/60 space-y-4">
                  {/* Key Results Section */}
                  <div>
                    <h4 className="text-xs font-black text-indigo-300 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Key Results Asociados ({objKRs.length})
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {objKRs.map((kr) => (
                        <div
                          key={kr.krId}
                          className="rounded-xl bg-slate-850 p-4 border border-slate-700/70 space-y-2 hover:border-slate-600 transition-all"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-mono text-indigo-400 font-bold block">
                                {kr.code} · {kr.metricName}
                              </span>
                              <h5 className="text-xs font-bold text-slate-100">{kr.title}</h5>
                            </div>
                            {getStatusBadge(kr.status)}
                          </div>

                          {/* Metric values & progress */}
                          <div className="pt-2 border-t border-slate-750">
                            <div className="flex items-baseline justify-between text-xs">
                              <span className="text-slate-400">
                                Base: {kr.baseline} {kr.unit}
                              </span>
                              <span className="font-mono font-bold text-white">
                                Actual: {kr.currentValue} {kr.unit}
                              </span>
                              <span className="font-mono text-cyan-400 font-bold">
                                Meta: {kr.target} {kr.unit}
                              </span>
                            </div>

                            <div className="w-full h-1.5 rounded-full bg-slate-700 overflow-hidden mt-2">
                              <div
                                className="h-full bg-cyan-400 rounded-full"
                                style={{ width: `${Math.min(100, kr.progressPct)}%` }}
                              ></div>
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                              <span>Confianza: {(kr.confidenceScore * 100).toFixed(0)}%</span>
                              <span>Límite: {kr.deadline}</span>
                              <span>Resp: {kr.ownerName}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Initiatives Section */}
                  {objInits.length > 0 && (
                    <div className="pt-3 border-t border-slate-800">
                      <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Iniciativas y Planes de Acción ({objInits.length})
                      </h4>

                      <div className="grid grid-cols-1 gap-2.5">
                        {objInits.map((init) => (
                          <div
                            key={init.initiativeId}
                            className="rounded-xl bg-slate-800/80 p-3.5 border border-slate-700/60 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                          >
                            <div className="space-y-1 max-w-2xl">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 font-mono">
                                  {init.initiativeId}
                                </span>
                                <span className="text-xs font-bold text-white">{init.name}</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-700 text-slate-300">
                                  {init.matrixClassification}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400">{init.description}</p>
                            </div>

                            <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                              <div className="text-right">
                                <span className="text-[10px] text-slate-400 block">Presupuesto:</span>
                                <span className="text-slate-200">
                                  ${(init?.spentBudget || 0).toLocaleString('es-MX')} / ${(init?.budget || 0).toLocaleString('es-MX')}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] text-slate-400 block">Impacto Esperado:</span>
                                <span className="text-emerald-400 font-bold">
                                  +${(init?.expectedFinancialImpact || 0).toLocaleString('es-MX')}
                                </span>
                              </div>
                              <div className="text-right text-[11px]">
                                <span className="text-slate-400 block text-[10px]">Resp:</span>
                                <span className="text-slate-300">{init.ownerName}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
