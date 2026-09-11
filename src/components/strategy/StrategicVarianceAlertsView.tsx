/**
 * @license
 * CONSCORE ERP IA - Strategic Variance Engine & Alert Center
 * FASE 12 - Control de Desviaciones (Meta vs Real vs Forecast) & Alertas Críticas
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  PlusCircle,
  Clock,
  Filter,
} from 'lucide-react';
import {
  StrategicVarianceItem,
  StrategicAlert,
  StrategicAlertSeverity,
  ExecutiveActionItem,
} from '../../types/strategicPlanningTypes';

interface StrategicVarianceAlertsViewProps {
  variances: StrategicVarianceItem[];
  alerts: StrategicAlert[];
  onResolveAlert: (alertId: string) => void;
  onCreateExecutiveAction: (action: ExecutiveActionItem) => void;
}

export const StrategicVarianceAlertsView: React.FC<StrategicVarianceAlertsViewProps> = ({
  variances,
  alerts,
  onResolveAlert,
  onCreateExecutiveAction,
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<StrategicAlertSeverity | 'ALL'>('ALL');

  const getSeverityBadge = (sev: StrategicAlertSeverity) => {
    switch (sev) {
      case 'CRITICA':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/40">
            CRÍTICA
          </span>
        );
      case 'ALTA':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-500/20 text-orange-400 border border-orange-500/40">
            ALTA
          </span>
        );
      case 'MEDIA':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/40">
            MEDIA
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/40">
            INFORMATIVA
          </span>
        );
    }
  };

  const filteredAlerts = selectedSeverity === 'ALL'
    ? alerts
    : alerts.filter((a) => a.severity === selectedSeverity);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-amber-400" />
          Control de Desviaciones & Centro de Alertas Estratégicas
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Comparativa transversal de META vs REAL y FORECAST vs META con alertas predictivas de riesgo financiero y operativo.
        </p>
      </div>

      {/* Part 1: Strategic Alerts Grid */}
      <div className="rounded-2xl bg-slate-800/90 border border-slate-700/80 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-700/60 gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-rose-400" />
            <h3 className="text-sm font-black text-white">
              Alertas Estratégicas Activas ({alerts.filter((a) => a.status === 'ACTIVA').length})
            </h3>
          </div>

          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-700/80">
            {(['ALL', 'CRITICA', 'ALTA', 'MEDIA'] as (StrategicAlertSeverity | 'ALL')[]).map((sev) => (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedSeverity === sev ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sev === 'ALL' ? 'Todas' : sev}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.alertId}
              className={`rounded-2xl border p-4 space-y-3 transition-all flex flex-col justify-between ${
                alert.status === 'MITIGADA'
                  ? 'bg-slate-900/40 border-slate-700/40 opacity-60'
                  : alert.severity === 'CRITICA'
                  ? 'bg-rose-950/30 border-rose-500/50 shadow-md shadow-rose-950/20'
                  : alert.severity === 'ALTA'
                  ? 'bg-orange-950/30 border-orange-500/40'
                  : 'bg-slate-900/80 border-slate-700/70'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-mono text-slate-400 font-bold block">
                    {alert.alertId} · {alert.type}
                  </span>
                  {getSeverityBadge(alert.severity)}
                </div>

                <h4 className="text-xs font-bold text-white leading-snug">{alert.metric}</h4>

                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] space-y-1 font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Umbral:</span>
                    <span className="text-slate-200">{alert.threshold}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Actual:</span>
                    <span className="text-rose-400 font-bold">{alert.actual}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Impacto Est.:</span>
                    <span className="text-amber-400 font-bold">${(alert?.financialImpactMXN || 0).toLocaleString('es-MX')} MXN</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300">
                  <strong className="text-slate-400">Acción sugerida:</strong> {alert.recommendedAction}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-400">Resp: {alert.owner}</span>
                {alert.status === 'ACTIVA' ? (
                  <button
                    onClick={() => onResolveAlert(alert.alertId)}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all flex items-center gap-1"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Mitigar
                  </button>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Mitigada
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Part 2: Strategic Variance Engine Table */}
      <div className="rounded-2xl bg-slate-800/90 border border-slate-700/80 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-indigo-400" />
              Matriz de Control de Desviaciones (Meta vs Real vs Forecast)
            </h3>
            <p className="text-[11px] text-slate-400">
              Detección automática de desviaciones presupuestales y operativas en los 7 pilares.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono text-[11px]">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 font-sans text-xs bg-slate-900/50">
                <th className="py-3 px-3">Métrica Estratégica</th>
                <th className="py-3 px-3">Pilar</th>
                <th className="py-3 px-3 text-right">Meta (Target)</th>
                <th className="py-3 px-3 text-right">Valor Real</th>
                <th className="py-3 px-3 text-right">Variación vs Meta</th>
                <th className="py-3 px-3 text-right">Forecast EOY</th>
                <th className="py-3 px-3 text-right">Impacto Financiero</th>
                <th className="py-3 px-3">Responsable</th>
                <th className="py-3 px-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {variances.map((v) => {
                const isNegative = v.isNegativeDeviation;
                return (
                  <tr key={v.varianceId} className="hover:bg-slate-750 transition-colors">
                    <td className="py-3 px-3 font-sans font-bold text-slate-200 text-xs">
                      {v.metricName}
                    </td>
                    <td className="py-3 px-3 font-sans text-slate-400">
                      {v.category}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300">
                      {v.unit === 'MXN' ? `$${(v?.targetValue || 0).toLocaleString('es-MX')}` : v.targetValue} {v.unit !== 'MXN' && v.unit}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-white">
                      {v.unit === 'MXN' ? `$${(v?.realValue || 0).toLocaleString('es-MX')}` : v.realValue} {v.unit !== 'MXN' && v.unit}
                    </td>
                    <td className={`py-3 px-3 text-right font-bold ${isNegative ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {v.varianceVsTargetPct > 0 ? `+${v.varianceVsTargetPct}%` : `${v.varianceVsTargetPct}%`}
                    </td>
                    <td className="py-3 px-3 text-right text-cyan-400">
                      {v.unit === 'MXN' ? `$${(v?.forecastValue || 0).toLocaleString('es-MX')}` : v.forecastValue}
                    </td>
                    <td className={`py-3 px-3 text-right font-bold ${(v?.financialImpactMXN || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {(v?.financialImpactMXN || 0) >= 0 ? '+' : ''}${(v?.financialImpactMXN || 0).toLocaleString('es-MX')}
                    </td>
                    <td className="py-3 px-3 font-sans text-slate-300 text-[11px]">
                      {v.responsibleOwner.split('(')[0]}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() =>
                          onCreateExecutiveAction({
                            actionId: `ACT-VAR-${Date.now().toString().slice(-4)}`,
                            horizon: 'ESTA_SEMANA',
                            source: 'DESVIACION_BSC',
                            title: `Mitigación: ${v.metricName}`,
                            description: v.suggestedCorrectionAction,
                            ownerId: 'USR-001',
                            ownerName: v.responsibleOwner,
                            department: v.category,
                            priority: 'HIGH',
                            expectedImpact: `Corregir desviación de ${v.varianceVsTargetPct}% vs meta.`,
                            expectedFinancialImpactMXN: Math.abs(v.financialImpactMXN),
                            deadline: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
                            status: 'PENDING',
                            requiresHumanApproval: true,
                            isHumanApproved: false,
                          })
                        }
                        className="p-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-500 text-white transition-all text-[10px] font-sans font-bold"
                      >
                        Crear Acción
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
