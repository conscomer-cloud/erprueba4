import React, { useState } from 'react';
import {
  TrendingUp,
  Calendar,
  Layers,
  Sparkles,
  Info,
  ShieldCheck,
  ArrowUpRight,
  DollarSign,
  Package,
} from 'lucide-react';
import { EnterpriseForecastData, ExecutiveKpiSummary } from '../../types/erp';
import { ExecutiveIntelligenceService } from '../../services/executiveIntelligenceService';

interface EnterpriseForecastProps {
  kpis: ExecutiveKpiSummary;
}

export const EnterpriseForecast: React.FC<EnterpriseForecastProps> = ({ kpis }) => {
  const [activeScenario, setActiveScenario] = useState<'CONSERVADOR' | 'ESPERADO' | 'OPTIMISTA'>('ESPERADO');
  const [activeHorizon, setActiveHorizon] = useState<'30_DIAS' | '60_DIAS' | '90_DIAS' | '6_MESES' | '12_MESES'>('90_DIAS');

  const forecastData: EnterpriseForecastData = ExecutiveIntelligenceService.generateEnterpriseForecast(kpis, activeScenario);

  return (
    <div className="space-y-6">
      {/* Scenario Controls */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl backdrop-blur-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-amber-400" />
              Escenario Predictivo:
            </span>
            {(['CONSERVADOR', 'ESPERADO', 'OPTIMISTA'] as const).map((sc) => (
              <button
                key={sc}
                onClick={() => setActiveScenario(sc)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeScenario === sc
                    ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                {sc === 'CONSERVADOR' && '🛡️ Conservador (-4%)'}
                {sc === 'ESPERADO' && '📊 Esperado (+5% mensual)'}
                {sc === 'OPTIMISTA' && '🚀 Optimista (+14%)'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300">
              <span className="text-slate-500">Confianza del Modelo:</span>
              <span className="font-bold text-emerald-400">{forecastData.confidenceLevelPct}%</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Corte: {forecastData.cutoffDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Forecast Data Points Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {forecastData.dataPoints.map((point) => (
          <div
            key={point.periodLabel}
            className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-amber-400">{point.periodLabel}</span>
                <span className="text-[10px] font-mono text-slate-400">T+{point.horizonDays}d</span>
              </div>

              <div className="mt-3 space-y-2 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400">Ventas Proyectadas</div>
                  <div className="font-mono font-bold text-white text-sm">
                    ${(Number(point.salesRevenue) || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400">Cobranza Estimada</div>
                  <div className="font-mono font-bold text-emerald-400">
                    +${(Number(point.collectionsCash) || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400">Pasivos & Pagos CXP</div>
                  <div className="font-mono font-bold text-rose-400">
                    -${(Number(point.paymentsCxp) || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400">Saldo de Caja Proyectado</div>
                  <div className="font-mono font-bold text-amber-300">
                    ${(Number(point.netCashBalance) || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Utilidad: <b className="text-white">${(Number(point.netProfit) || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}</b></span>
              <span>Margen: <b className="text-emerald-400">${(Number(point.grossMargin) || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}</b></span>
            </div>
          </div>
        ))}
      </div>

      {/* Methodology, Assumptions & Governance Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-5 text-xs text-slate-300 space-y-4">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
          <Info className="h-4 w-4" />
          <span>Ficha Técnica y Transparencia de Proyección</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="font-bold text-white uppercase text-[10px] tracking-wider mb-1">
              Metodología de Cálculo
            </div>
            <p className="text-slate-400 leading-relaxed">{forecastData.methodology}</p>

            <div className="font-bold text-white uppercase text-[10px] tracking-wider mt-3 mb-1">
              Fuentes de Datos Utilizadas
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-slate-400">
              {forecastData.dataSources.map((src, i) => (
                <li key={i}>{src}</li>
              ))}
            </ul>
          </div>

          <div>
            <div className="font-bold text-white uppercase text-[10px] tracking-wider mb-1">
              Supuestos Clave del Modelo
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              {forecastData.assumptions.map((ass, i) => (
                <li key={i}>{ass}</li>
              ))}
            </ul>

            <div className="mt-3 p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[11px] flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                <b>Aviso de Gobernanza:</b> Los valores presentados son modelos predictivos estadísticos basados en datos transaccionales reales. Nunca deben tomarse como saldos bancarios consolidados existentes.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
