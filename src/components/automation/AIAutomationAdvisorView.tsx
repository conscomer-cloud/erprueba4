/**
 * @license
 * CONSCORE ERP IA - FASE 14: AUTOMATIZACIÓN EMPRESARIAL + BPM + WORKFLOWS + RPA
 * CONSCORE AI Automation Advisor (15-Point Protocol & Data Honesty Taxonomy)
 */

import React, { useState } from 'react';
import {
  Cpu,
  Send,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  ArrowRight,
  Sparkles,
  Lock,
  Tag,
  HelpCircle,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { AIAutomationAdvisorResponse } from '../../types/automationBpmTypes';
import { AutomationBpmEngine } from '../../services/automationBpmEngine';

export const AIAutomationAdvisorView: React.FC = () => {
  const erp = useERP();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AIAutomationAdvisorResponse | null>(null);

  const quickQuestions = [
    '¿Qué pedidos están bloqueados por límite de crédito y qué acción se sugiere?',
    '¿Cuáles productos de inventario alcanzaron punto de reorden y requieren OC?',
    '¿Qué discrepancias de 3-Way Match en CXP están pendientes de aprobación?',
    '¿Cómo optimizar el tiempo operativo en el ciclo comercial de Cotización a Cobro?',
  ];

  const handleAsk = (questionToAsk?: string) => {
    const q = questionToAsk || query;
    if (!q.trim()) return;

    setLoading(true);
    setTimeout(() => {
      const res = AutomationBpmEngine.queryAIAutomationAdvisor(q, erp);
      setResponse(res);
      setLoading(false);
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-xl border border-indigo-800/40 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                CONSCORE AI Advisor v14.0
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Human-in-the-Loop Obligatorio
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              CONSCORE AI Automation Advisor
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Asesor cognitivo empresarial que evalúa eventos, reglas y workflows. Genera diagnósticos de 15 dimensiones con honestidad de datos (REAL / CALCULATED / PROJECTED).
            </p>
          </div>
        </div>
      </div>

      {/* Query Bar & Suggestions */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Haz una consulta estratégica o de automatización (ej. ¿Qué pedidos están bloqueados por crédito)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            className="flex-1 px-4 py-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <button
            onClick={() => handleAsk()}
            disabled={loading}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold transition flex items-center gap-2 shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            {loading ? 'Analizando...' : 'Consultar Asesor'}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-semibold text-slate-400">Consultas Rápidas:</span>
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(q);
                handleAsk(q);
              }}
              className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition border border-slate-200"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* AI Response in 15-Point Protocol */}
      {response && (
        <div className="bg-white p-6 rounded-xl border border-indigo-200 shadow-md space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Dictamen del CONSCORE AI Advisor (15 Dimensiones)
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-1">
                {response.question}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                Confianza: {response.confidenceLevel}%
              </span>
              <span className="px-2.5 py-1 rounded text-xs font-bold bg-indigo-100 text-indigo-800">
                Clasificación: {response.dataClassification}
              </span>
            </div>
          </div>

          {/* Mandatory Human-in-the-Loop Notice */}
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-300 text-amber-900 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <strong className="font-bold block text-sm">Directiva de Gobernanza Corporativa:</strong>
              <p className="mt-0.5">{response.humanValidationMandate}</p>
            </div>
          </div>

          {/* 15 Dimensions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {/* 1. Data Points Used */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-slate-800 uppercase text-[10px] block">
                1. Datos Reales de Entrada ({response.dataUsed.length})
              </span>
              <div className="space-y-1.5">
                {response.dataUsed.map((dp, i) => (
                  <div key={i} className="p-2 bg-white rounded border border-slate-200 text-[11px]">
                    <div className="flex justify-between font-semibold text-slate-900">
                      <span>{dp.label}</span>
                      <span className="text-indigo-700">{dp.value}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Fuente: {dp.source} · [{dp.classification}]
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Events & Rules */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-slate-800 uppercase text-[10px] block">
                2. Eventos & Reglas Evaluadas
              </span>
              <div className="space-y-2">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Eventos Detectados:</span>
                  {response.eventsDetected.map((e, i) => (
                    <span key={i} className="block text-[11px] font-mono text-indigo-800 bg-indigo-50 p-1 rounded mt-1">
                      {e}
                    </span>
                  ))}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Reglas Disparadas:</span>
                  {response.rulesApplied.map((r, i) => (
                    <span key={i} className="block text-[11px] text-slate-700 bg-white p-1 rounded border border-slate-200 mt-1">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Suggested Workflow */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-slate-800 uppercase text-[10px] block">
                3. Flujo Orquestado Sugerido
              </span>
              <p className="font-bold text-indigo-900 bg-indigo-50 p-2.5 rounded border border-indigo-200">
                {response.suggestedWorkflow}
              </p>
              <div className="space-y-1 text-[11px] pt-1">
                <p><strong>Rol Responsable:</strong> {response.responsibleRole}</p>
                <p><strong>Fecha Límite:</strong> {new Date(response.targetDate).toLocaleDateString()}</p>
                <p><strong>Prioridad / Riesgo:</strong> {response.priority} / {response.risk}</p>
              </div>
            </div>

            {/* 4. Operational & Financial Impact */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 md:col-span-2">
              <span className="font-bold text-slate-800 uppercase text-[10px] block">
                4. Impacto Operativo & Financiero Cuantificado
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Impacto Operativo</span>
                  <p className="text-slate-800 font-medium mt-1">{response.operationalImpact}</p>
                </div>
                <div className="p-3 bg-white rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Impacto Financiero</span>
                  <p className="text-emerald-700 font-bold mt-1">{response.financialImpact}</p>
                </div>
              </div>
            </div>

            {/* 5. Recommendation & Next Best Action */}
            <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-2 md:col-span-3">
              <span className="font-bold text-indigo-950 uppercase text-[10px] block">
                5. Recomendación Ejecutiva & Next Best Action
              </span>
              <div className="space-y-2">
                <div className="p-3 bg-white rounded-lg border border-indigo-200">
                  <span className="text-[10px] font-bold uppercase text-indigo-600 block">Recomendación Estratégica</span>
                  <p className="text-slate-900 font-semibold text-sm mt-0.5">{response.recommendation}</p>
                </div>
                <div className="p-3 bg-indigo-900 text-white rounded-lg flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-300 block">Next Best Action Inmediata</span>
                    <p className="text-xs font-medium">{response.nextBestAction}</p>
                  </div>
                  <button
                    onClick={() => alert(`Acción "${response.nextBestAction}" enviada al Executive Action Center para revisión del rol ${response.responsibleRole}.`)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold text-xs transition shrink-0 flex items-center gap-1"
                  >
                    Crear Tarea Ejecutiva
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
