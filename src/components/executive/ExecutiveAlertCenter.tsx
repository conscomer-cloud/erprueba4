import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Info,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  DollarSign,
  Filter,
} from 'lucide-react';
import { ExecutiveAlertItem, ExecutiveAlertPriority, ERPModule } from '../../types/erp';

interface ExecutiveAlertCenterProps {
  alerts: ExecutiveAlertItem[];
  onNavigateToModule: (module: ERPModule) => void;
}

export const ExecutiveAlertCenter: React.FC<ExecutiveAlertCenterProps> = ({
  alerts,
  onNavigateToModule,
}) => {
  const [selectedPriority, setSelectedPriority] = useState<'ALL' | ExecutiveAlertPriority>('ALL');

  const filtered = alerts.filter(
    (a) => selectedPriority === 'ALL' || a.priority === selectedPriority
  );

  const getPriorityBadge = (p: ExecutiveAlertPriority) => {
    switch (p) {
      case 'CRITICAL':
        return {
          label: 'CRÍTICA',
          style: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
          icon: ShieldAlert,
        };
      case 'HIGH':
        return {
          label: 'ALTA',
          style: 'bg-orange-500/20 text-orange-300 border-orange-500/50',
          icon: AlertTriangle,
        };
      case 'MEDIUM':
        return {
          label: 'MEDIA',
          style: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
          icon: Info,
        };
      case 'LOW':
        return {
          label: 'BAJA',
          style: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
          icon: Info,
        };
      default:
        return {
          label: 'INFO',
          style: 'bg-slate-800 text-slate-300 border-slate-700',
          icon: Info,
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Filters */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl backdrop-blur-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2 flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-amber-400" />
              Prioridad:
            </span>
            {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'INFO'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPriority(p)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedPriority === p
                    ? 'bg-amber-400 text-slate-950 font-black'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                {p === 'ALL' && `Todas (${alerts.length})`}
                {p === 'CRITICAL' && '🚨 Críticas'}
                {p === 'HIGH' && '⚠️ Altas'}
                {p === 'MEDIUM' && '⚡ Medias'}
                {p === 'INFO' && 'ℹ️ Informativas'}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-400">
            Total impacto financiero estimado:{' '}
            <b className="font-mono text-rose-400">
              ${alerts.reduce((s, a) => s + a.estimatedFinancialImpact, 0).toLocaleString('es-MX')} MXN
            </b>
          </div>
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {filtered.map((alert) => {
          const badge = getPriorityBadge(alert.priority);
          const Icon = badge.icon;
          return (
            <div
              key={alert.id}
              className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-md hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className={`p-2.5 rounded-xl border shrink-0 ${badge.style}`}>
                  <Icon className="h-5 w-5" />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.style}`}>
                      {badge.label}
                    </span>
                    <span className="text-xs font-bold text-white">{alert.title}</span>
                    <span className="text-[10px] font-mono text-amber-400/80">
                      [{alert.moduleOrigin} · {alert.entity}]
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{alert.problem}</p>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-amber-400" />
                      <span className="text-slate-300"><b>Acción recomendada:</b> {alert.recommendation}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between md:flex-col md:items-end gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase">Impacto Financiero</div>
                  <div className="font-mono font-bold text-rose-400 text-sm">
                    ${(Number(alert.estimatedFinancialImpact) || 0).toLocaleString('es-MX')} MXN
                  </div>
                </div>

                <button
                  onClick={() => onNavigateToModule(alert.actionTargetModule)}
                  className="flex items-center gap-1.5 rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-300 transition-colors shadow-sm cursor-pointer"
                >
                  <span>{alert.availableActionLabel}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
