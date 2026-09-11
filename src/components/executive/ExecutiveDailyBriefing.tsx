import React from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  Megaphone,
  Truck,
  ArrowRight,
  Sun,
} from 'lucide-react';
import { ExecutiveDailyBriefingData } from '../../types/erp';

interface ExecutiveDailyBriefingProps {
  briefing: ExecutiveDailyBriefingData;
  onNavigateToTab?: (tabKey: string) => void;
}

export const ExecutiveDailyBriefing: React.FC<ExecutiveDailyBriefingProps> = ({
  briefing,
  onNavigateToTab,
}) => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 p-5 shadow-xl backdrop-blur-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 font-black shadow-lg">
              <Sun className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  CONSCORE ERP IA · Briefing Matutino
                </span>
                <span className="text-[10px] text-slate-500">|</span>
                <span className="text-[10px] text-slate-400 capitalize">{briefing.date}</span>
              </div>
              <h2 className="text-xl font-bold text-white mt-0.5">Resumen Ejecutivo del Día</h2>
              <p className="text-xs text-slate-300">
                Síntesis consolidada de desempeño comercial, liquidez, riesgos y recomendaciones estratégicas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950 text-xs font-semibold text-slate-300">
              100% Datos Verificados
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Lo Bueno vs Lo que Requiere Atención */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. LO BUENO */}
        <div className="rounded-xl border border-emerald-500/30 bg-slate-900/90 p-4 shadow-md">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              1. Lo Bueno (Hitos & Fortalezas)
            </h3>
          </div>
          <ul className="mt-3 space-y-2.5 text-xs text-slate-200">
            {briefing.theGood.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold shrink-0">✓</span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 2. LO QUE REQUIERE ATENCIÓN */}
        <div className="rounded-xl border border-amber-500/30 bg-slate-900/90 p-4 shadow-md">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              2. Requiere Atención Inmediata
            </h3>
          </div>
          <ul className="mt-3 space-y-2.5 text-xs text-slate-200">
            {briefing.requiresAttention.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-amber-400 font-bold shrink-0">⚠️</span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Grid: Riesgos vs Oportunidades */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 3. RIESGOS */}
        <div className="rounded-xl border border-rose-500/30 bg-slate-900/90 p-4 shadow-md">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <AlertTriangle className="h-4 w-4 text-rose-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400">
              3. Matriz de Riesgos Identificados
            </h3>
          </div>
          <ul className="mt-3 space-y-2 text-xs text-slate-300">
            {briefing.risks.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-rose-400 font-bold shrink-0">✕</span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 4. OPORTUNIDADES */}
        <div className="rounded-xl border border-blue-500/30 bg-slate-900/90 p-4 shadow-md">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <TrendingUp className="h-4 w-4 text-blue-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">
              4. Oportunidades Comerciales
            </h3>
          </div>
          <ul className="mt-3 space-y-2 text-xs text-slate-300">
            {briefing.opportunities.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-blue-400 font-bold shrink-0">✦</span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Áreas Transversales: Dinero, Ventas, Operaciones, RH, Marketing */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-800">
          5 al 9. Estado por Pilares de Gestión
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
          <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs mb-1">
              <DollarSign className="h-3.5 w-3.5" />
              <span>5. Dinero & Tesorería</span>
            </div>
            <p className="text-slate-300 leading-relaxed">{briefing.moneySummary}</p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-1">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>6. Ventas & Facturación</span>
            </div>
            <p className="text-slate-300 leading-relaxed">{briefing.salesSummary}</p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs mb-1">
              <Package className="h-3.5 w-3.5" />
              <span>7. Operaciones & Surtido</span>
            </div>
            <p className="text-slate-300 leading-relaxed">{briefing.operationsSummary}</p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-xs mb-1">
              <Users className="h-3.5 w-3.5" />
              <span>8. Recursos Humanos</span>
            </div>
            <p className="text-slate-300 leading-relaxed">{briefing.hrSummary}</p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
            <div className="flex items-center gap-2 text-pink-400 font-bold text-xs mb-1">
              <Megaphone className="h-3.5 w-3.5" />
              <span>9. Marketing & Demanda</span>
            </div>
            <p className="text-slate-300 leading-relaxed">{briefing.marketingSummary}</p>
          </div>
        </div>
      </div>

      {/* 10. RECOMENDACIONES IA */}
      <div className="rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-slate-950 to-slate-950 p-5 shadow-xl">
        <div className="flex items-center gap-2 pb-3 border-b border-amber-500/20">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
            10. Recomendaciones Estratégicas CONSCORE AI
          </h3>
        </div>
        <ul className="mt-3 space-y-2 text-xs text-slate-200">
          {briefing.aiRecommendations.map((rec, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400 text-slate-950 font-black text-[10px]">
                {i + 1}
              </span>
              <span className="leading-relaxed mt-0.5">{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
