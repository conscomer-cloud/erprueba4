/**
 * @license
 * CONSCORE ERP IA - FASE 14: AUTOMATIZACIÓN EMPRESARIAL + BPM + WORKFLOWS + RPA
 * Executive Action Center & Human-in-the-Loop Approval Hub
 */

import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  ShieldCheck,
  UserCheck,
  XCircle,
  Filter,
  Search,
  FileCheck,
  Lock,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { AutomationExecutiveAction } from '../../types/automationBpmTypes';
import { AutomationBpmEngine } from '../../services/automationBpmEngine';

interface ExecutiveActionCenterViewProps {
  actions: AutomationExecutiveAction[];
  onRefresh: () => void;
}

export const ExecutiveActionCenterView: React.FC<ExecutiveActionCenterViewProps> = ({
  actions,
  onRefresh,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [selectedPriority, setSelectedPriority] = useState<string>('TODAS');
  const [selectedAction, setSelectedAction] = useState<AutomationExecutiveAction | null>(null);
  const [actionModal, setActionModal] = useState<{
    action: AutomationExecutiveAction;
    type: 'APPROVE' | 'REJECT';
  } | null>(null);
  const [approverName, setApproverName] = useState<string>('Ing. Roberto Garza (Director de Operaciones)');
  const [decisionNotes, setDecisionNotes] = useState<string>('Aprobado conforme al presupuesto y políticas de control interno.');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const categories = ['TODAS', 'HOY', 'URGENTE', 'ESTA_SEMANA', 'PENDIENTE'];

  const filtered = actions.filter((a) => {
    const matchesCategory =
      selectedCategory === 'TODAS' ||
      (selectedCategory === 'HOY' && a.category === 'HOY') ||
      (selectedCategory === 'URGENTE' && a.priority === 'CRITICAL') ||
      (selectedCategory === 'ESTA_SEMANA' && a.category === 'ESTA_SEMANA') ||
      (selectedCategory === 'PENDIENTE' && a.status === 'PENDING_APPROVAL');

    const matchesPriority = selectedPriority === 'TODAS' || a.priority === selectedPriority;

    return matchesCategory && matchesPriority;
  });

  const pendingCount = actions.filter((a) => a.status === 'PENDING_APPROVAL').length;
  const totalFinancialExposure = actions
    .filter((a) => a.status === 'PENDING_APPROVAL')
    .reduce((sum, a) => sum + a.financialImpact, 0);

  const handleConfirmDecision = () => {
    if (!actionModal) return;
    const { action, type } = actionModal;

    const res = AutomationBpmEngine.resolveAction(
      action.id,
      type === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      approverName,
      decisionNotes
    );

    setSuccessBanner(
      `Acción "${res.title}" fue ${type === 'APPROVE' ? 'APROBADA' : 'RECHAZADA'} exitosamente por ${approverName}. Certificado SHA-256 generado.`
    );
    setActionModal(null);
    setSelectedAction(null);
    onRefresh();
    setTimeout(() => setSuccessBanner(null), 6000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Human-in-the-Loop Gatekeeper
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800">
              {pendingCount} Tareas en Espera
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Executive Action Center
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Bandeja centralizada de decisiones humanas requeridas para órdenes, créditos, excepciones 3-Way Match y nómina.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-medium">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Exposición Financiera</span>
            <span className="text-sm font-bold text-rose-600">${(Number(totalFinancialExposure) || 0).toLocaleString('es-MX')} MXN</span>
          </div>
        </div>
      </div>

      {successBanner && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="text-emerald-700 font-bold">✕</button>
        </div>
      )}

      {/* Category Pills & Priority Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Prioridad:</span>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs focus:outline-none"
          >
            <option value="TODAS">Todas</option>
            <option value="CRITICAL">Crítica</option>
            <option value="HIGH">Alta</option>
            <option value="MEDIUM">Media</option>
            <option value="LOW">Baja</option>
          </select>
        </div>
      </div>

      {/* Action Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((action) => {
          const isPending = action.status === 'PENDING_APPROVAL';
          return (
            <div
              key={action.id}
              className={`p-4 rounded-xl border transition flex flex-col justify-between space-y-3 bg-white shadow-2xs hover:shadow-sm ${
                action.priority === 'CRITICAL'
                  ? 'border-rose-300 bg-rose-50/20'
                  : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                    {action.module}
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      action.priority === 'CRITICAL'
                        ? 'bg-rose-100 text-rose-800 animate-pulse'
                        : action.priority === 'HIGH'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {action.priority}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mt-2">
                  {action.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                  {action.description}
                </p>

                {/* Mandate badge */}
                <div className="mt-3 p-2 bg-amber-50 rounded border border-amber-200 text-[11px] text-amber-900 flex items-start gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>{action.humanValidationNotice || 'REQUIERE VALIDACIÓN HUMANA: Aprobación mandataria.'}</span>
                </div>
              </div>

              <div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Rol: <strong className="text-slate-700">{action.ownerRole}</strong></span>
                  <span className="font-bold text-slate-900">
                    ${(Number(action.financialImpact) || 0).toLocaleString('es-MX')} MXN
                  </span>
                </div>

                {isPending ? (
                  <div className="flex items-center gap-2 mt-3 pt-2">
                    <button
                      onClick={() => setActionModal({ action, type: 'APPROVE' })}
                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Aprobar
                    </button>
                    <button
                      onClick={() => setActionModal({ action, type: 'REJECT' })}
                      className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1 border border-rose-200"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Rechazar
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 p-2 bg-slate-50 rounded text-center text-xs font-semibold text-slate-500">
                    Resuelto: <span className="font-bold text-slate-800">{action.status}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Decision Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {actionModal.type === 'APPROVE' ? (
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="p-2 bg-rose-100 text-rose-700 rounded-lg">
                    <XCircle className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {actionModal.type === 'APPROVE' ? 'Autorizar Acción Ejecutiva' : 'Rechazar Acción Ejecutiva'}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {actionModal.action.id} · {actionModal.action.module}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActionModal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
              <p className="font-semibold text-slate-800">{actionModal.action.title}</p>
              <p className="text-slate-600">{actionModal.action.description}</p>
              <p className="font-bold text-indigo-700 pt-1">
                Impacto Financiero: ${(Number(actionModal.action.financialImpact) || 0).toLocaleString('es-MX')} MXN
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase">
                  Firma Digital del Aprobador (Nombre y Cargo)
                </label>
                <input
                  type="text"
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase">
                  Dictamen y Comentarios de Auditoría
                </label>
                <textarea
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  rows={3}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs"
                />
              </div>

              <div className="p-2.5 bg-slate-100 rounded text-[10px] font-mono text-slate-500">
                <span>Certificado Inmutable: </span>
                <strong className="text-slate-700">SHA256-SIGN-{Date.now().toString(36).toUpperCase()}</strong>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setActionModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDecision}
                className={`px-4 py-2 rounded-lg text-xs font-semibold text-white transition ${
                  actionModal.type === 'APPROVE'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                Confirmar {actionModal.type === 'APPROVE' ? 'Aprobación' : 'Rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
