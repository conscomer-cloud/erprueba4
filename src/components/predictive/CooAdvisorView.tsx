/**
 * @license
 * CONSCORE ERP IA - CONSCORE AI COO Advisor View
 * Executive Decision Engine with 20-Point Protocol & Strict HITL Guardrails
 */

import React, { useState } from 'react';
import { CooAdvisorAdvice } from '../../types/predictiveOperationsTypes';
import { PredictiveOperationsService } from '../../services/predictiveOperationsService';
import { DataClassificationBadge } from './DataClassificationBadge';
import {
  Sparkles,
  ShieldCheck,
  Lock,
  ArrowRight,
  AlertTriangle,
  Calendar,
  User,
  Target,
  FileCheck,
  CheckCircle2,
  DollarSign,
  Layers,
  Percent,
} from 'lucide-react';

export const CooAdvisorView: React.FC = () => {
  const advices = PredictiveOperationsService.getCooAdvices();
  const [selectedAdviceId, setSelectedAdviceId] = useState<string>(advices[0].id);

  const activeAdvice =
    advices.find((a) => a.id === selectedAdviceId) || advices[0];

  const formatMoney = (n: number) =>
    `$${(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">CONSCORE AI COO Advisor</h2>
            <DataClassificationBadge classification={activeAdvice.clasificacionDatos} />
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Asesor ejecutivo de operaciones. Protocolo riguroso de 20 puntos con salvaguardas Human-in-the-Loop.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3.5 py-2 rounded-lg text-xs font-semibold text-indigo-900">
          <Lock className="w-4 h-4 text-indigo-600 flex-shrink-0" />
          <span>HITL: La IA asesora y proyecta; la ejecución sensible requiere autorización humana.</span>
        </div>
      </div>

      {/* Selector of Strategic Advices */}
      <div className="flex flex-wrap gap-2">
        {advices.map((adv) => (
          <button
            key={adv.id}
            onClick={() => setSelectedAdviceId(adv.id)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
              selectedAdviceId === adv.id
                ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {adv.id} · {adv.problemaDetectado}
          </button>
        ))}
      </div>

      {/* 20-Point Protocol Card Detail */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        {/* Header & Meta */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                {activeAdvice.id}
              </span>
              <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded border border-rose-200">
                PRIORIDAD: {activeAdvice.prioridad}
              </span>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                RIESGO: {activeAdvice.riesgo}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-2">
              {activeAdvice.problemaDetectado}
            </h3>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-500 font-semibold uppercase">Nivel de Confianza</div>
            <div className="text-2xl font-bold text-purple-700 font-mono">
              {activeAdvice.nivelConfianza}%
            </div>
          </div>
        </div>

        {/* 20 Points Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-sm">
          {/* Column 1: Diagnóstico & Causas */}
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
              <div className="text-xs font-bold text-slate-500 uppercase">1. Situación Actual</div>
              <p className="text-slate-800 leading-relaxed text-xs">{activeAdvice.situacionActual}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                <div className="text-[11px] font-bold text-slate-500 uppercase">2. Datos Utilizados</div>
                <div className="text-xs text-slate-700">{activeAdvice.datosUtilizados.join(', ')}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                <div className="text-[11px] font-bold text-slate-500 uppercase">3. Datos Faltantes</div>
                <div className="text-xs text-slate-500 italic">
                  {activeAdvice.datosFaltantes.length > 0
                    ? activeAdvice.datosFaltantes.join(', ')
                    : 'Ninguno (Datos completos)'}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
              <div className="text-xs font-bold text-slate-500 uppercase">5. Causa Probable</div>
              <p className="text-slate-800 leading-relaxed text-xs">{activeAdvice.causaProbable}</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
              <div className="text-xs font-bold text-slate-500 uppercase">6. Impacto Operativo</div>
              <p className="text-slate-800 leading-relaxed text-xs">{activeAdvice.impactoOperativo}</p>
            </div>

            <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100 space-y-1">
              <div className="text-xs font-bold text-rose-700 uppercase">7. Impacto Financiero Cuantificado</div>
              <div className="text-lg font-bold text-rose-900 font-mono">
                {formatMoney(activeAdvice.impactoFinanciero)}
              </div>
            </div>
          </div>

          {/* Column 2: Oportunidades, Recomendación y Next Best Action */}
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
              <div className="text-xs font-bold text-slate-500 uppercase">10. Oportunidad Estratégica</div>
              <p className="text-slate-800 leading-relaxed text-xs">{activeAdvice.oportunidad}</p>
            </div>

            {/* Alternativas */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
              <div className="text-xs font-bold text-slate-500 uppercase">11. Alternativas de Solución</div>
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-700">
                {activeAdvice.alternativas.map((alt, i) => (
                  <li key={i}>{alt}</li>
                ))}
              </ul>
            </div>

            {/* Recomendación */}
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 space-y-2">
              <div className="text-xs font-bold text-purple-900 uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                12. Recomendación del COO
              </div>
              <p className="text-purple-950 font-medium leading-relaxed text-xs">
                {activeAdvice.recomendacion}
              </p>
            </div>

            {/* Next Best Action */}
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 space-y-2">
              <div className="text-xs font-bold text-emerald-900 uppercase flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                13. Next Best Action (Próxima Mejor Acción)
              </div>
              <p className="text-emerald-950 font-bold leading-relaxed text-xs">
                {activeAdvice.nextBestAction}
              </p>
            </div>

            {/* Meta Responsable & KPI */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                <div className="text-[10px] font-bold text-slate-500 uppercase">14. Responsable</div>
                <div className="font-semibold text-slate-900 mt-0.5 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" />
                  {activeAdvice.responsable} ({activeAdvice.responsibleRole})
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                <div className="text-[10px] font-bold text-slate-500 uppercase">15. Fecha Objetivo</div>
                <div className="font-semibold text-slate-900 mt-0.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {activeAdvice.fechaObjetivo}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* HITL Directive Footer Banner */}
        <div className="pt-4 border-t border-slate-100 bg-slate-50 p-4 rounded-xl flex items-center gap-3">
          <Lock className="w-5 h-5 text-indigo-600 flex-shrink-0" />
          <div className="text-xs text-slate-700">
            <strong className="text-indigo-900">20. Directiva Human-in-the-Loop:</strong>{' '}
            {activeAdvice.directivaHitl}
          </div>
        </div>
      </div>
    </div>
  );
};
