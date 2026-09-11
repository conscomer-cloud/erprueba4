import React from 'react';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { BusinessHealthScoreData, HealthDimensionMetric } from '../../types/erp';

interface BusinessHealthScoreProps {
  healthData: BusinessHealthScoreData;
  onDimensionClick?: (dimension: string) => void;
}

export const BusinessHealthScore: React.FC<BusinessHealthScoreProps> = ({
  healthData,
  onDimensionClick,
}) => {
  const { overallScore, status, statusLabel, dimensions } = healthData;

  const getStatusColor = (score: number) => {
    if (score >= 80) return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', ring: 'stroke-emerald-400' };
    if (score >= 60) return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', ring: 'stroke-amber-400' };
    if (score >= 40) return { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30', ring: 'stroke-orange-400' };
    return { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30', ring: 'stroke-rose-400' };
  };

  const colors = getStatusColor(overallScore);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl backdrop-blur-xs">
      {/* Header & Overall Score */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-5 border-b border-slate-800/80">
        <div className="flex items-center gap-4">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950 p-2 shadow-inner">
            <svg className="h-16 w-16 -rotate-90 transform" viewBox="0 0 36 36">
              <path
                className="stroke-slate-800"
                strokeWidth="3.5"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={`${colors.ring} transition-all duration-1000 ease-out`}
                strokeDasharray={`${overallScore}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-xl font-black tracking-tight text-white">{overallScore}</span>
              <span className="text-[9px] font-semibold uppercase text-slate-400">Score</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Semáforo Empresarial 360°
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-0.5">{statusLabel}</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Evaluación multifactorial auditada en tiempo real sobre 8 dimensiones operativas, financieras y comerciales.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Motor de Diagnóstico Activo</span>
          </div>
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            <span>CONSCORE AI Health Auditor</span>
          </div>
        </div>
      </div>

      {/* 8 Dimensions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5">
        {dimensions.map((dim) => {
          const dimColors = getStatusColor(dim.score);
          return (
            <div
              key={dim.dimension}
              onClick={() => onDimensionClick && onDimensionClick(dim.dimension)}
              className="group relative flex flex-col justify-between rounded-lg border border-slate-800/90 bg-slate-950/70 p-3.5 hover:border-amber-400/50 hover:bg-slate-900/90 transition-all cursor-pointer shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-amber-400 transition-colors">
                    {dim.label}
                  </span>
                  <div className="flex items-center gap-1">
                    {dim.trend === 'SUBIENDO' && <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />}
                    {dim.trend === 'BAJANDO' && <TrendingDown className="h-3.5 w-3.5 text-rose-400" />}
                    {dim.trend === 'ESTABLE' && <Minus className="h-3.5 w-3.5 text-slate-400" />}
                    <span className={`text-xs font-black px-1.5 py-0.5 rounded-sm ${dimColors.bg} ${dimColors.text}`}>
                      {dim.score}/100
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2.5">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      dim.score >= 80 ? 'bg-emerald-400' : dim.score >= 60 ? 'bg-amber-400' : 'bg-rose-400'
                    }`}
                    style={{ width: `${dim.score}%` }}
                  ></div>
                </div>

                {/* Detected issue or status */}
                <div className="mt-3 text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                  {dim.problemDetected ? (
                    <span className="text-amber-300 font-medium">⚠️ {dim.problemDetected}</span>
                  ) : (
                    <span className="text-slate-400">{dim.impact || 'Operación dentro de los parámetros esperados.'}</span>
                  )}
                </div>
              </div>

              {/* Recommended Action */}
              {dim.recommendedAction && (
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 group-hover:text-slate-200">
                  <span className="truncate pr-1">💡 {dim.recommendedAction}</span>
                  <ArrowRight className="h-3 w-3 shrink-0 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
