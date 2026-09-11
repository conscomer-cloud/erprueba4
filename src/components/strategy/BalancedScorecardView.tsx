/**
 * @license
 * CONSCORE ERP IA - Balanced Scorecard View (Cuadro de Mando Integral)
 * FASE 12 - 4 Perspectivas Estratégicas & Semáforos
 */

import React, { useState } from 'react';
import {
  Layers,
  DollarSign,
  Users,
  Factory,
  GraduationCap,
  TrendingUp,
  TrendingDown,
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import {
  BSCIndicator,
  BSCPerspective,
  BSCSemaphore,
} from '../../types/strategicPlanningTypes';

interface BalancedScorecardViewProps {
  indicators: BSCIndicator[];
  onUpdateIndicator: (indicator: BSCIndicator) => void;
}

export const BalancedScorecardView: React.FC<BalancedScorecardViewProps> = ({
  indicators,
  onUpdateIndicator,
}) => {
  const [selectedPerspective, setSelectedPerspective] = useState<BSCPerspective | 'ALL'>('ALL');

  const perspectives: { id: BSCPerspective; label: string; icon: React.ElementType; color: string }[] = [
    { id: 'FINANCIERA', label: '1. Perspectiva Financiera', icon: DollarSign, color: 'text-emerald-400 bg-emerald-500/10' },
    { id: 'CLIENTES', label: '2. Perspectiva Clientes', icon: Users, color: 'text-cyan-400 bg-cyan-500/10' },
    { id: 'PROCESOS_INTERNOS', label: '3. Procesos Internos', icon: Factory, color: 'text-indigo-400 bg-indigo-500/10' },
    { id: 'APRENDIZAJE_CRECIMIENTO', label: '4. Aprendizaje & Crecimiento', icon: GraduationCap, color: 'text-pink-400 bg-pink-500/10' },
  ];

  const getSemaphoreBadge = (semaphore: BSCSemaphore) => {
    switch (semaphore) {
      case 'GREEN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <CheckCircle2 className="h-3 w-3" /> VERDE / EN META
          </span>
        );
      case 'YELLOW':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black bg-yellow-500/20 text-yellow-400 border border-yellow-500/40">
            <Clock className="h-3 w-3" /> AMARILLO / PRECAUCIÓN
          </span>
        );
      case 'ORANGE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black bg-orange-500/20 text-orange-400 border border-orange-500/40">
            <AlertTriangle className="h-3 w-3" /> NARANJA / DESVIACIÓN
          </span>
        );
      case 'RED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black bg-rose-500/20 text-rose-400 border border-rose-500/40">
            <XCircle className="h-3 w-3" /> ROJO / CRÍTICO
          </span>
        );
    }
  };

  const filtered = selectedPerspective === 'ALL'
    ? indicators
    : indicators.filter((i) => i.perspective === selectedPerspective);

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Layers className="h-6 w-6 text-indigo-400" />
            Balanced Scorecard (Cuadro de Mando Integral)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Evaluación balanceada de las 4 perspectivas corporativas con rangos de tolerancia y semaforización automatizada.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedPerspective('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              selectedPerspective === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Todas ({indicators.length})
          </button>
          {perspectives.map((p) => {
            const count = indicators.filter((i) => i.perspective === p.id).length;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPerspective(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  selectedPerspective === p.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p.label.split('.')[1]} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Perspective Sections */}
      {perspectives.map((persp) => {
        if (selectedPerspective !== 'ALL' && selectedPerspective !== persp.id) return null;
        const items = indicators.filter((i) => i.perspective === persp.id);
        const IconComponent = persp.icon;

        return (
          <div key={persp.id} className="rounded-2xl bg-slate-800/90 border border-slate-700/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${persp.color}`}>
                  <IconComponent className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">{persp.label}</h3>
                  <p className="text-[11px] text-slate-400">
                    {items.length} indicadores monitoreados en tiempo real
                  </p>
                </div>
              </div>
            </div>

            {/* Indicator Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((ind) => {
                const isPositiveYoY = ind.yoyChangePct >= 0;
                return (
                  <div
                    key={ind.indicatorId}
                    className="rounded-xl bg-slate-900/70 border border-slate-700/70 p-4 space-y-3 hover:border-slate-600 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wide">
                            {ind.code}
                          </span>
                          <h4 className="text-sm font-bold text-slate-100 mt-0.5 leading-snug">
                            {ind.name}
                          </h4>
                        </div>
                        {getSemaphoreBadge(ind.semaphore)}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        {ind.description}
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-800/80">
                      {/* Metric Values Display */}
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Actual:</span>
                          <span className="text-xl font-black font-mono text-white">
                            {ind.unit === 'MXN' ? `$${(ind?.currentValue || 0).toLocaleString('es-MX')}` : ind.currentValue}
                            <span className="text-xs font-normal text-slate-400 ml-1">{ind.unit !== 'MXN' && ind.unit}</span>
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Meta 2026:</span>
                          <span className="text-sm font-bold font-mono text-cyan-400">
                            {ind.unit === 'MXN' ? `$${(ind?.target || 0).toLocaleString('es-MX')}` : ind.target} {ind.unit !== 'MXN' && ind.unit}
                          </span>
                        </div>
                      </div>

                      {/* YoY Change and Baseline */}
                      <div className="flex items-center justify-between text-[11px] bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800">
                        <span className="text-slate-400">Base: {ind.baseline} {ind.unit}</span>
                        <div className="flex items-center gap-1 font-mono font-bold">
                          {isPositiveYoY ? (
                            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
                          )}
                          <span className={isPositiveYoY ? 'text-emerald-400' : 'text-rose-400'}>
                            {ind.yoyChangePct > 0 ? `+${ind.yoyChangePct}%` : `${ind.yoyChangePct}%`} YoY
                          </span>
                        </div>
                      </div>

                      {/* Formula & Tag footer */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                        <span className="truncate max-w-[170px]" title={ind.formulaDescription}>
                          fx: {ind.formulaDescription}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-indigo-300 font-bold border border-slate-700">
                          {ind.dataHonesty}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
