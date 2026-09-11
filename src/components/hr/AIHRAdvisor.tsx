import React, { useState } from 'react';
import {
  Bot,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  RefreshCw,
  Clock,
  Filter,
  Eye,
  Check,
  X,
  Lock,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { AIHRAdvisorInsight } from '../../types/erp';

export const AIHRAdvisor: React.FC = () => {
  const { aiHRInsights, generateAIHRAnalysis, updateAIHRInsightStatus } = useERP();
  const { can, user } = useAuth();
  const canManageHR = can('RH', 'EDITAR') || user?.role === 'ADMINISTRADOR' || user?.role === 'DIRECTOR';

  const [selectedTopic, setSelectedTopic] = useState<'ALL' | 'PERFORMANCE' | 'ATTENDANCE' | 'TRAINING' | 'COMMISSIONS' | 'DOCUMENTS'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const filteredInsights = aiHRInsights.filter((ins) => {
    const matchesTopic =
      selectedTopic === 'ALL' ||
      (selectedTopic === 'PERFORMANCE' && ins.type === 'DESEMPENO') ||
      (selectedTopic === 'ATTENDANCE' && ins.type === 'ASISTENCIA') ||
      (selectedTopic === 'TRAINING' && ins.type === 'CAPACITACION') ||
      (selectedTopic === 'COMMISSIONS' && ins.type === 'COMISIONES') ||
      (selectedTopic === 'DOCUMENTS' && ins.type === 'ALERTAS_DOCUMENTOS');

    const matchesStatus = selectedStatus === 'ALL' || ins.status === selectedStatus;

    return matchesTopic && matchesStatus;
  });

  const handleRunAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      generateAIHRAnalysis({ topic: selectedTopic });
      setIsAnalyzing(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Strict Human In The Loop Governance */}
      <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-600 text-white shadow-md">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-amber-200/80 px-2 py-0.5 text-[10px] font-black uppercase text-amber-900">
                  CONSCORE AI Talent Core
                </span>
                <span className="text-xs font-semibold text-amber-800">
                  Inteligencia Organizacional & Talento
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Asesor Estratégico de Recursos Humanos & Desempeño
              </h2>
            </div>
          </div>

          <button
            onClick={handleRunAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-black uppercase text-white shadow-md hover:bg-amber-700 transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'Analizando Patrones...' : 'Ejecutar Diagnóstico IA'}
          </button>
        </div>

        {/* Human in the loop guarantee card */}
        <div className="rounded-xl border border-amber-300/80 bg-white/80 p-3 text-xs text-slate-700 flex items-start gap-2.5">
          <Lock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-900 block">
              Garantía de Supervisión Humana (Human-in-the-Loop):
            </span>
            <span>
              CONSCORE AI está facultado exclusivamente para analizar datos operativos, detectar anomalías de asistencia, correlacionar márgenes y proponer planes de capacitación. <b>En ningún caso ejecuta sanciones, despidos o modificaciones contractuales automáticas.</b> Todas las acciones sugeridas requieren aprobación expresa de la Dirección o RH.
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'ALL', label: 'Todos los Temas' },
            { id: 'ATTENDANCE', label: 'Patrones de Asistencia' },
            { id: 'PERFORMANCE', label: 'Desempeño & Metas' },
            { id: 'COMMISSIONS', label: 'Comisiones & Margen' },
            { id: 'TRAINING', label: 'Brechas de Habilidades' },
            { id: 'DOCUMENTS', label: 'Expedientes & Vencimientos' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTopic(t.id as any)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                selectedTopic === t.id
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-900 focus:outline-none"
        >
          <option value="ALL">Todos los Estados</option>
          <option value="NUEVO">NUEVOS</option>
          <option value="EN_REVISION">EN REVISIÓN</option>
          <option value="ATENDIDO">ATENDIDOS</option>
          <option value="DESCARTADO">DESCARTADOS</option>
        </select>
      </div>

      {/* Insights Cards Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {filteredInsights.map((ins) => (
          <div
            key={ins.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-amber-300 transition"
          >
            <div className="space-y-3">
              {/* Header Badge */}
              <div className="flex items-center justify-between">
                <span
                  className={`rounded-md px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                    ins.type === 'ASISTENCIA'
                      ? 'bg-blue-100 text-blue-900'
                      : ins.type === 'COMISIONES'
                      ? 'bg-emerald-100 text-emerald-900'
                      : ins.type === 'ALERTAS_DOCUMENTOS'
                      ? 'bg-red-100 text-red-900'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {ins.type}
                </span>

                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                      ins.impactLevel === 'ALTO'
                        ? 'bg-red-100 text-red-800'
                        : ins.impactLevel === 'MEDIO'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    Impacto {ins.impactLevel}
                  </span>

                  <span className="text-[10px] text-slate-400 font-mono">
                    {ins.createdAt ? ins.createdAt.slice(0, 10) : '2026-08-26'}
                  </span>
                </div>
              </div>

              {/* Title & Observations */}
              <h3 className="text-base font-black text-slate-900">{ins.title}</h3>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs space-y-1.5">
                <div className="text-slate-700">
                  <b className="text-slate-900">Dato Observado:</b> {ins.dataObservation}
                </div>
                <div className="text-slate-600">
                  <b className="text-slate-900">Análisis del Patrón:</b> {ins.patternAnalysis}
                </div>
              </div>

              {/* Recommendation */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-amber-900 font-black">
                  <Lightbulb className="h-4 w-4 text-amber-600" />
                  Recomendación Estratégica
                </div>
                <p className="text-slate-800 font-medium">{ins.recommendation}</p>
                <div className="text-[11px] text-amber-800 mt-1 font-semibold">
                  Acción sugerida: {ins.actionSuggested}
                </div>
              </div>
            </div>

            {/* Bottom Actions for Human Decision */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                  ins.status === 'ATENDIDO'
                    ? 'bg-emerald-100 text-emerald-800'
                    : ins.status === 'EN_REVISION'
                    ? 'bg-blue-100 text-blue-800'
                    : ins.status === 'DESCARTADO'
                    ? 'bg-slate-100 text-slate-500'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                Estado: {ins.status}
              </span>

              {canManageHR && ins.status === 'NUEVO' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateAIHRInsightStatus(ins.id, 'EN_REVISION')}
                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                  >
                    Revisar
                  </button>
                  <button
                    onClick={() => updateAIHRInsightStatus(ins.id, 'ATENDIDO')}
                    className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700 transition"
                  >
                    Marcar Atendido
                  </button>
                  <button
                    onClick={() => updateAIHRInsightStatus(ins.id, 'DESCARTADO')}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold text-slate-400 hover:bg-slate-100 transition"
                  >
                    Descartar
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
