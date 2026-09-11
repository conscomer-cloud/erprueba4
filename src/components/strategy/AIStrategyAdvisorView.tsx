/**
 * @license
 * CONSCORE ERP IA - CONSCORE AI Strategy Advisor View
 * FASE 12 - Asesor Estratégico Directivo con Protocolo de 18 Puntos & Honestidad de Datos
 */

import React, { useState } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Layers,
  HelpCircle,
  ChevronRight,
  UserCheck,
  PlusCircle,
} from 'lucide-react';
import {
  StrategicExecutiveKPIs,
  AIStrategyAdvisorResponse,
  ExecutiveActionItem,
} from '../../types/strategicPlanningTypes';
import { StrategicPlanningService } from '../../services/strategicPlanningService';

interface AIStrategyAdvisorViewProps {
  kpis: StrategicExecutiveKPIs;
  onCreateExecutiveAction: (action: ExecutiveActionItem) => void;
}

export const AIStrategyAdvisorView: React.FC<AIStrategyAdvisorViewProps> = ({
  kpis,
  onCreateExecutiveAction,
}) => {
  const [queryInput, setQueryInput] = useState('');
  const [activeResponse, setActiveResponse] = useState<AIStrategyAdvisorResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [actionSavedMsg, setActionSavedMsg] = useState<string | null>(null);

  const presetQueries = [
    {
      title: 'Diagnóstico Integral',
      query: '¿Cómo está realmente la empresa?',
    },
    {
      title: 'Aumento de Precios 4%',
      query: '¿Qué pasaría si aumentamos precios 4%?',
    },
    {
      title: 'Contratar 2 Vendedores',
      query: '¿Qué pasaría si contratamos 2 vendedores?',
    },
    {
      title: 'Maximización de EBITDA',
      query: '¿Cómo maximizamos el EBITDA en un 15% sin perder clientes industriales clave?',
    },
    {
      title: 'Optimización de Liquidez',
      query: '¿Cómo optimizar el ciclo de conversión de efectivo y reducir el DSO a menos de 45 días?',
    },
  ];

  const handleRunQuery = (prompt: string) => {
    setIsAnalyzing(true);
    setActiveResponse(null);

    setTimeout(() => {
      const resp = StrategicPlanningService.queryAIStrategyAdvisor(prompt, {}, kpis);
      setActiveResponse(resp);
      setIsAnalyzing(false);
    }, 500);
  };

  const handleConvertToAction = () => {
    if (!activeResponse) return;

    const newAction: ExecutiveActionItem = {
      actionId: `ACT-AI-${Date.now().toString().slice(-4)}`,
      horizon: 'ESTA_SEMANA',
      source: 'RECOMENDACION_IA',
      title: activeResponse.nextBestAction,
      description: `Recomendación AI Strategy Advisor: ${activeResponse.recomendacion}. Impacto estimado: ${activeResponse.impactoFinanciero}.`,
      ownerId: 'USR-001',
      ownerName: activeResponse.responsable,
      department: 'Dirección General / Finanzas',
      priority: 'HIGH',
      expectedImpact: activeResponse.impactoFinanciero,
      expectedFinancialImpactMXN: 500000,
      deadline: activeResponse.fechaObjetivo,
      status: 'PENDING',
      requiresHumanApproval: true,
      isHumanApproved: false,
    };

    onCreateExecutiveAction(newAction);
    setActionSavedMsg('¡Recomendación convertida en Acción Ejecutiva exitosamente!');
    setTimeout(() => setActionSavedMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 border border-purple-500/30 p-6 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-black border border-purple-500/40 font-mono flex items-center gap-1">
              <Bot className="h-3.5 w-3.5" /> CONSCORE AI STRATEGY ADVISOR
            </span>
            <span className="text-xs text-slate-300 font-bold">
              Protocolo Directivo de 18 Puntos Certificado
            </span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Consultor Estratégico & Inteligencia de Decisión
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            Formula preguntas directivas para obtener diagnósticos rigurosos con trazabilidad completa y estricta honestidad de datos (REAL, CALCULATED, PROJECTED, INSUFFICIENT_DATA).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-purple-300 bg-purple-950/80 px-3 py-1.5 rounded-xl border border-purple-700/60 font-bold">
            Gobernanza: Recomendación (Requiere Aprobación Humana)
          </span>
        </div>
      </div>

      {actionSavedMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-lg">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          {actionSavedMsg}
        </div>
      )}

      {/* Preset Queries Grid */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
          Consultas Directivas Preconfiguradas
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {presetQueries.map((pq, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQueryInput(pq.query);
                handleRunQuery(pq.query);
              }}
              className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 hover:border-purple-500/50 text-left transition-all space-y-1 group"
            >
              <div className="flex items-center justify-between text-xs font-black text-slate-200 group-hover:text-purple-300">
                <span>{pq.title}</span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-purple-400" />
              </div>
              <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                {pq.query}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Query Input Bar */}
      <div className="flex gap-2">
        <input
          type="text"
          value={queryInput}
          onChange={(e) => setQueryInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && queryInput.trim() && handleRunQuery(queryInput)}
          placeholder="Escribe una pregunta directiva estratégica para CONSCORE AI Advisor..."
          className="flex-1 px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-all font-medium"
        />
        <button
          onClick={() => queryInput.trim() && handleRunQuery(queryInput)}
          disabled={isAnalyzing || !queryInput.trim()}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black shadow-md shadow-purple-950 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {isAnalyzing ? (
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
              Analizando...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Consultar AI
            </span>
          )}
        </button>
      </div>

      {/* 18-Point Protocol Display */}
      {activeResponse && (
        <div className="rounded-2xl bg-slate-800/90 border border-purple-500/40 p-6 shadow-xl space-y-6">
          {/* Header of Response (Points 1 & 2) */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-700/60 gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  ID: {activeResponse.queryId}
                </span>
                <span className="text-xs text-slate-400">
                  Periodo: {activeResponse.periodo}
                </span>
              </div>
              <h3 className="text-base font-black text-white">
                1. PREGUNTA: "{activeResponse.pregunta}"
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">18. Nivel de Confianza:</span>
                <span className="text-xs font-black font-mono text-emerald-400">
                  {activeResponse.nivelDeConfianza}
                </span>
              </div>

              <button
                onClick={handleConvertToAction}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-950 transition-all flex items-center gap-1.5 shrink-0"
              >
                <PlusCircle className="h-4 w-4" />
                Convertir en Acción
              </button>
            </div>
          </div>

          {/* Section: Data Honesty Protocol (Points 3, 4, 5, 6, 7) */}
          <div className="rounded-xl bg-slate-950/70 p-4 border border-slate-700/70 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <h4 className="text-xs font-black text-white uppercase tracking-wide">
                  3-7. Protocolo de Honestidad y Clasificación de Datos
                </h4>
              </div>
              <span className="text-[10px] text-slate-400">
                {activeResponse.datosUtilizados.length} fuentes consultadas
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 pt-1 text-[11px]">
              {/* 4. DATOS REALES */}
              <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 space-y-1">
                <span className="font-bold text-emerald-400 block">4. [DATOS REALES - ERP]:</span>
                <div className="space-y-1 text-[10px] text-slate-300">
                  {activeResponse.datosReales.map((d, i) => (
                    <div key={i} className="flex justify-between border-b border-emerald-900/30 pb-0.5">
                      <span className="text-slate-400">{d.label}:</span>
                      <strong className="text-white font-mono">{d.value}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. DATOS CALCULADOS */}
              <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/30 space-y-1">
                <span className="font-bold text-cyan-400 block">5. [DATOS CALCULADOS]:</span>
                <div className="space-y-1 text-[10px] text-slate-300">
                  {activeResponse.datosCalculados.map((d, i) => (
                    <div key={i} className="flex justify-between border-b border-cyan-900/30 pb-0.5">
                      <span className="text-slate-400">{d.label}:</span>
                      <strong className="text-white font-mono">{d.value}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* 6. DATOS PROYECTADOS */}
              <div className="p-2.5 rounded-lg bg-purple-950/30 border border-purple-500/30 space-y-1">
                <span className="font-bold text-purple-400 block">6. [DATOS PROYECTADOS]:</span>
                <div className="space-y-1 text-[10px] text-slate-300">
                  {activeResponse.datosProyectados.map((d, i) => (
                    <div key={i} className="flex justify-between border-b border-purple-900/30 pb-0.5">
                      <span className="text-slate-400">{d.label}:</span>
                      <strong className="text-white font-mono">{d.value}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* 7. DATOS INSUFICIENTES */}
              <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/30 space-y-1">
                <span className="font-bold text-amber-400 block">7. [DATOS INSUFICIENTES]:</span>
                <ul className="text-slate-300 space-y-0.5 list-disc list-inside text-[10px]">
                  {activeResponse.datosInsuficientes.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* 8. Diagnostico & 9. Hallazgos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-750 space-y-2">
              <h4 className="text-xs font-black text-indigo-400 uppercase tracking-wide">
                8. Diagnóstico Ejecutivo
              </h4>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                {activeResponse.diagnostico}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-750 space-y-2">
              <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wide">
                9. Hallazgos Clave
              </h4>
              <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                {activeResponse.hallazgos.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* 10. Riesgos & 11. Oportunidades */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-2">
              <h4 className="text-xs font-black text-rose-400 uppercase tracking-wide flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" /> 10. Riesgos Directivos
              </h4>
              <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                {activeResponse.riesgos.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-teal-950/20 border border-teal-500/30 space-y-2">
              <h4 className="text-xs font-black text-teal-400 uppercase tracking-wide flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4" /> 11. Oportunidades Identificadas
              </h4>
              <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                {activeResponse.oportunidades.map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* 12. Escenarios Evaluados */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-750 space-y-2">
            <h4 className="text-xs font-black text-cyan-400 uppercase tracking-wide">
              12. Escenarios Evaluados
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {activeResponse.escenarios.map((sc, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1 text-xs">
                  <span className="font-bold text-white block">{sc.name}</span>
                  <p className="text-[11px] text-slate-400">{sc.summary}</p>
                  <span className="font-mono text-[11px] text-emerald-400 font-bold block pt-1">
                    {sc.financialOutcome}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 13-17. Recomendación Estratégica, Next Best Action, Responsable, Fecha, Impacto */}
          <div className="p-5 rounded-xl bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/40 space-y-4">
            <div>
              <span className="text-[10px] font-black uppercase text-indigo-300 tracking-wider block mb-1">
                13. Recomendación Estratégica
              </span>
              <p className="text-sm font-bold text-white leading-relaxed">
                {activeResponse.recomendacion}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-3 border-t border-indigo-900/60 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">14. Next Best Action:</span>
                <span className="font-bold text-emerald-400">{activeResponse.nextBestAction}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">15. Responsable:</span>
                <span className="font-bold text-slate-200">{activeResponse.responsable}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">16. Fecha Objetivo:</span>
                <span className="font-bold text-slate-200">{activeResponse.fechaObjetivo}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">17. Impacto Financiero:</span>
                <span className="font-bold font-mono text-cyan-400">{activeResponse.impactoFinanciero}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
