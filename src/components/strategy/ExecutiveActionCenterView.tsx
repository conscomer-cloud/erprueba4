/**
 * @license
 * CONSCORE ERP IA - Executive Action Center View
 * FASE 12 - Tablero de Acciones Ejecutivas & Gobernanza (Hoy, Esta Semana, Este Mes)
 */

import React, { useState } from 'react';
import {
  CheckSquare,
  Clock,
  Calendar,
  ShieldCheck,
  UserCheck,
  CheckCircle,
  AlertCircle,
  PlusCircle,
  ArrowRight,
  Filter,
} from 'lucide-react';
import {
  ExecutiveActionItem,
  ActionHorizon,
  ExecutiveActionStatus,
} from '../../types/strategicPlanningTypes';

interface ExecutiveActionCenterViewProps {
  actions: ExecutiveActionItem[];
  onUpdateAction: (action: ExecutiveActionItem) => void;
  onApproveAction: (actionId: string) => void;
}

export const ExecutiveActionCenterView: React.FC<ExecutiveActionCenterViewProps> = ({
  actions,
  onUpdateAction,
  onApproveAction,
}) => {
  const [selectedHorizon, setSelectedHorizon] = useState<ActionHorizon | 'ALL'>('ALL');

  const horizons: { id: ActionHorizon; label: string; icon: React.ElementType; badge: string }[] = [
    { id: 'HOY', label: 'Acciones para Hoy', icon: Clock, badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
    { id: 'ESTA_SEMANA', label: 'Acciones de Esta Semana', icon: Calendar, badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
    { id: 'ESTE_MES', label: 'Acciones de Este Mes', icon: CheckSquare, badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
  ];

  const getStatusBadge = (status: ExecutiveActionStatus) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            EJECUTADA
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
            EN PROCESO
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/40">
            PENDIENTE APROBACIÓN
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-indigo-400" />
            Centro de Acciones Ejecutivas & Gobernanza Directiva
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gobernanza directiva: Las recomendaciones de la IA y alertas requieren aprobación humana explícita antes de su ejecución.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700/80">
          <button
            onClick={() => setSelectedHorizon('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedHorizon === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Todas ({actions.length})
          </button>
          {horizons.map((h) => (
            <button
              key={h.id}
              onClick={() => setSelectedHorizon(h.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedHorizon === h.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {h.id.replace('_', ' ')} ({actions.filter((a) => a.horizon === h.id).length})
            </button>
          ))}
        </div>
      </div>

      {/* Horizons Columns / Cards */}
      <div className="space-y-5">
        {horizons.map((h) => {
          if (selectedHorizon !== 'ALL' && selectedHorizon !== h.id) return null;
          const items = actions.filter((a) => a.horizon === h.id);
          const IconComp = h.icon;

          return (
            <div
              key={h.id}
              className="rounded-2xl bg-slate-800/90 border border-slate-700/80 p-5 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-900 text-indigo-400 border border-slate-750">
                    <IconComp className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">{h.label}</h3>
                    <p className="text-[11px] text-slate-400">
                      {items.length} tareas directivas registradas
                    </p>
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${h.badge}`}>
                  {h.id}
                </span>
              </div>

              {/* Action items list */}
              <div className="grid grid-cols-1 gap-3">
                {items.map((action) => (
                  <div
                    key={action.actionId}
                    className="rounded-xl bg-slate-900/80 p-4 border border-slate-750 hover:border-slate-650 transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  >
                    <div className="space-y-1.5 max-w-3xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] font-bold border border-slate-700">
                          {action.actionId}
                        </span>
                        <span className="text-[10px] font-mono text-indigo-400 font-bold">
                          Fuente: {action.source}
                        </span>
                        {getStatusBadge(action.status)}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          Prioridad {action.priority}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white leading-snug">{action.title}</h4>
                      <p className="text-xs text-slate-300">{action.description}</p>

                      <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                        <span>Límite: <strong className="text-slate-200">{action.deadline}</strong></span>
                        <span>Resp: <strong className="text-slate-200">{action.ownerName}</strong> ({action.department})</span>
                        <span>Impacto Est: <strong className="text-emerald-400 font-mono">+${(action?.expectedFinancialImpactMXN || 0).toLocaleString('es-MX')} MXN</strong></span>
                      </div>
                    </div>

                    {/* Approval Action Gate */}
                    <div className="shrink-0 flex items-center gap-3">
                      {action.isHumanApproved ? (
                        <div className="text-right font-mono text-[11px]">
                          <span className="text-emerald-400 font-bold flex items-center gap-1 justify-end">
                            <ShieldCheck className="h-4 w-4" /> Aprobado por {action.approvedBy}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {action.approvedAt ? new Date(action.approvedAt).toLocaleTimeString('es-MX') : 'Hoy'}
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => onApproveAction(action.actionId)}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-md shadow-emerald-950 transition-all flex items-center gap-1.5"
                        >
                          <UserCheck className="h-4 w-4" />
                          Aprobar y Ejecutar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
