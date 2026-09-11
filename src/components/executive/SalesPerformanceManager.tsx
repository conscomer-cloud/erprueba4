import React, { useState } from 'react';
import {
  TrendingUp,
  Award,
  DollarSign,
  Target,
  Users,
  Activity,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { SalesPerformanceRecord } from '../../types/erp';

interface SalesPerformanceManagerProps {
  sellers: SalesPerformanceRecord[];
}

export const SalesPerformanceManager: React.FC<SalesPerformanceManagerProps> = ({ sellers }) => {
  const [activeRankView, setActiveRankView] = useState<'EFFICIENCY' | 'SALES' | 'MARGIN' | 'CONVERSION'>('EFFICIENCY');

  const sortedSellers = [...sellers].sort((a, b) => {
    if (activeRankView === 'SALES') return b.salesActual - a.salesActual;
    if (activeRankView === 'MARGIN') return b.grossMarginPct - a.grossMarginPct;
    if (activeRankView === 'CONVERSION') return b.conversionRatePct - a.conversionRatePct;
    return b.efficiencyScore - a.efficiencyScore;
  });

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl backdrop-blur-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-400" />
              Inteligencia Comercial & Matriz de Eficiencia por Ejecutivo
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Evaluación multidimensional de cuota, margen generado, tasa de conversión y pipeline activo.
            </p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2">
              Ordenar por:
            </span>
            {(['EFFICIENCY', 'SALES', 'MARGIN', 'CONVERSION'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setActiveRankView(view)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  activeRankView === view
                    ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                {view === 'EFFICIENCY' && '⚡ Eficiencia Global'}
                {view === 'SALES' && '💰 Volumen de Ventas'}
                {view === 'MARGIN' && '📈 % de Margen'}
                {view === 'CONVERSION' && '🎯 Conversión'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Seller Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedSellers.map((seller, index) => {
          const isTop = index === 0;
          return (
            <div
              key={seller.sellerId}
              className={`rounded-xl border p-4 shadow-md transition-all flex flex-col justify-between ${
                isTop
                  ? 'border-amber-400/60 bg-gradient-to-b from-amber-500/10 via-slate-900/90 to-slate-900'
                  : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-sm font-black text-amber-400">
                      {seller.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white leading-tight">{seller.name}</h4>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                        <span>Rank #{seller.rankSales} en Ventas</span>
                        <span>·</span>
                        <span>Rank #{seller.rankMargin} en Margen</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Eficiencia</div>
                    <div className="text-base font-black text-amber-400">{seller.efficiencyScore}/100</div>
                  </div>
                </div>

                {/* Progress bar to target */}
                <div className="mt-3.5">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400 font-medium">Cumplimiento de Meta</span>
                    <span className="font-mono font-bold text-emerald-400">{seller.attainmentPct}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        seller.attainmentPct >= 100 ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                      style={{ width: `${Math.min(100, seller.attainmentPct)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 my-3.5 text-xs">
                  <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800/60">
                    <div className="text-[10px] text-slate-400">Ventas Reales</div>
                    <div className="font-mono font-bold text-white mt-0.5">
                      ${(seller?.salesActual || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-slate-400">Meta: ${(seller?.salesTarget || 0).toLocaleString('es-MX')}</div>
                  </div>

                  <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800/60">
                    <div className="text-[10px] text-slate-400">Margen Bruto Generado</div>
                    <div className="font-mono font-bold text-emerald-400 mt-0.5">
                      ${(seller?.grossMarginGenerated || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] font-bold text-emerald-400">{seller?.grossMarginPct || 0}% de margen</div>
                  </div>

                  <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800/60">
                    <div className="text-[10px] text-slate-400">Pipeline Activo</div>
                    <div className="font-mono font-bold text-amber-300 mt-0.5">
                      ${(seller?.pipelineAmount || 0).toLocaleString('es-MX')}
                    </div>
                    <div className="text-[10px] text-slate-400">Forecast: ${(seller?.forecastWeighted || 0).toLocaleString('es-MX')}</div>
                  </div>

                  <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800/60">
                    <div className="text-[10px] text-slate-400">Conversión / Ticket</div>
                    <div className="font-mono font-bold text-slate-200 mt-0.5">
                      {seller?.conversionRatePct || 0}% conv.
                    </div>
                    <div className="text-[10px] text-slate-400">Avg: ${(seller?.averageTicket || 0).toLocaleString('es-MX')}</div>
                  </div>
                </div>
              </div>

              {/* Footer info: Commissions & Activities */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>Comisión devengada: <b className="text-white font-mono">${(seller?.commissionsEarned || 0).toLocaleString('es-MX')}</b></span>
                <span>{seller?.activitiesLoggedCount || 0} actividades</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
