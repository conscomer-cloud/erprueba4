/**
 * @license
 * CONSCORE ERP IA - Business Health Score View
 * 11-Dimension Algorithmic Enterprise Health Index (0-100)
 */

import React from 'react';
import { BusinessHealthScoreBreakdown } from '../../types/predictiveOperationsTypes';
import { PredictiveOperationsService } from '../../services/predictiveOperationsService';
import { DataClassificationBadge } from './DataClassificationBadge';
import {
  Activity,
  Heart,
  TrendingUp,
  ShieldCheck,
  Award,
  Layers,
  Percent,
} from 'lucide-react';

export const BusinessHealthScoreView: React.FC = () => {
  const health = PredictiveOperationsService.calculateLiveHealthScore();

  const dimensionEntries = Object.entries(health.dimensions);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 80) return 'text-blue-700 bg-blue-50 border-blue-200';
    if (score >= 70) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-rose-700 bg-rose-50 border-rose-200';
  };

  const getBarColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-500';
    if (score >= 80) return 'bg-blue-500';
    if (score >= 70) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="space-y-6">
      {/* Top Health Summary Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <h2 className="text-xl font-bold text-slate-900">CONSCORE Business Health Score</h2>
            <DataClassificationBadge classification="CALCULATED" />
          </div>
          <p className="text-sm text-slate-600">
            Índice algorítmico multidimensional ponderado en 11 áreas funcionales de la empresa.
          </p>
        </div>

        {/* Big Score Gauge */}
        <div className="flex items-center gap-5 bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-200">
          <div className="text-center">
            <div className="text-4xl font-extrabold text-purple-950 font-mono">
              {health.overallScore}
            </div>
            <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">
              de 100 Puntos
            </div>
          </div>

          <div className="h-10 w-px bg-purple-200" />

          <div className="space-y-0.5">
            <div className="text-xs font-bold text-slate-600 uppercase">Calificación</div>
            <div className="text-base font-bold text-emerald-700 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> {health.rating}
            </div>
            <div className="text-[11px] text-slate-500">Ponderación Total: 100%</div>
          </div>
        </div>
      </div>

      {/* 11 Dimensions Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dimensionEntries.map(([key, dim]) => (
          <div
            key={key}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3 hover:border-purple-300 transition-colors"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{dim.name}</h3>
                <div className="text-[11px] text-slate-500">
                  Ponderación: <strong>{(((dim.weight ?? 0) * 100)).toFixed(0)}%</strong>
                </div>
              </div>

              <span
                className={`font-mono text-sm font-bold px-2.5 py-1 rounded-md border ${getScoreColor(
                  dim.score
                )}`}
              >
                {dim.score} pts
              </span>
            </div>

            {/* Score Bar */}
            <div className="space-y-1">
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${getBarColor(dim.score)}`}
                  style={{ width: `${dim.score}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                <span>Contribución al Global:</span>
                <span className="font-mono font-bold text-slate-800">
                  +{((dim.contribution ?? 0)).toFixed(2)} pts
                </span>
              </div>
            </div>

            {/* Primary KPI */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>KPI Principal:</span>
              <span className="font-semibold text-slate-900">{dim.kpi}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
