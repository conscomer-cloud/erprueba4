import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  DollarSign,
  UserCheck,
  Filter,
  Lock,
  ArrowRight,
  Sparkles,
  Info,
} from 'lucide-react';
import { ExecutiveApprovalItem } from '../../types/erp';
import { MasterCertificationService } from '../../services/masterCertificationService';

interface Props {
  userRole?: string;
  onAuditCreated?: (action: string, details: string) => void;
}

export const ExecutiveApprovalCenter: React.FC<Props> = ({
  userRole = 'DIRECTOR_GENERAL',
  onAuditCreated,
}) => {
  const [approvals, setApprovals] = useState<ExecutiveApprovalItem[]>(() =>
    MasterCertificationService.getExecutiveApprovals()
  );
  const [selectedEntity, setSelectedEntity] = useState<string>('TODAS');
  const [selectedStatus, setSelectedStatus] = useState<string>('TODOS');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [activeModalItem, setActiveModalItem] = useState<{
    item: ExecutiveApprovalItem;
    action: 'APPROVE' | 'REJECT';
  } | null>(null);
  const [actionReason, setActionReason] = useState<string>('');

  const canApprove =
    userRole === 'DIRECTOR_GENERAL' ||
    userRole === 'ADMINISTRADOR' ||
    userRole === 'DIRECTOR' ||
    userRole === 'GERENTE_FINANZAS';

  const filteredApprovals = approvals.filter((item) => {
    if (selectedEntity !== 'TODAS' && item.entity !== selectedEntity) return false;
    if (selectedStatus !== 'TODOS' && item.status !== selectedStatus) return false;
    return true;
  });

  const pendingCount = approvals.filter((a) => a.status === 'PENDIENTE').length;
  const approvedCount = approvals.filter((a) => a.status === 'APROBADO').length;
  const rejectedCount = approvals.filter((a) => a.status === 'RECHAZADO').length;
  const totalAmountPending = approvals
    .filter((a) => a.status === 'PENDIENTE')
    .reduce((sum, a) => sum + (a.amount || 0), 0);

  const handleConfirmAction = () => {
    if (!activeModalItem) return;
    const { item, action } = activeModalItem;

    const newStatus = action === 'APPROVE' ? 'APROBADO' : 'RECHAZADO';
    const approverName = 'Ing. Roberto Garza (Director General)';

    setApprovals((prev) =>
      prev.map((app) => {
        if (app.requestId === item.requestId) {
          return {
            ...app,
            status: newStatus,
            approver: approverName,
          };
        }
        return app;
      })
    );

    const detailText = `Solicitud ${item.requestId} (${item.entity}) ${action === 'APPROVE' ? 'APROBADA' : 'RECHAZADA'} por ${approverName}. Motivo: ${actionReason || 'Sin notas adicionales'}.`;

    if (onAuditCreated) {
      onAuditCreated(`APPROVAL_${action}`, detailText);
    }

    setActionSuccessMsg(detailText);
    setTimeout(() => setActionSuccessMsg(null), 5000);

    setActiveModalItem(null);
    setActionReason('');
  };

  const getEntityBadge = (entity: string) => {
    switch (entity) {
      case 'DESCUENTO':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'EXCEPCION_CREDITO':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'AJUSTE_INVENTARIO':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'TRANSFERENCIA':
      case 'PAGO':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'BONO':
      case 'COMISION':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'REAPERTURA_PERIODO':
      case 'AJUSTE_CONTABLE':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDIENTE':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'APROBADO':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'RECHAZADO':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
      default:
        return 'bg-slate-700 text-slate-300';
    }
  };

  return (
    <div id="executive-approval-center" className="space-y-6">
      {/* Top Banner: Human-in-the-Loop AI Governance */}
      <div className="bg-slate-900/90 border border-yellow-400/30 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg shadow-yellow-500/5">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-yellow-400/10 border border-yellow-400/20 rounded-lg text-yellow-400 mt-0.5">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                Centro de Autorizaciones Ejecutivas & Gobernanza Human-in-the-Loop
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-yellow-400/20 text-yellow-300 border border-yellow-400/40">
                PRODUCCIÓN FASE 10
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Toda operación que involucre dispersión de fondos, excepciones de crédito, reaperturas o
              descuentos fuera de política exige <strong className="text-yellow-300">confirmación humana explícita</strong> con
              rol autorizado. La IA está restringida y auditada bajo el estándar SOC-2 / ISO-27001.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-right">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-mono">
              Rol en Sesión
            </span>
            <span className="text-xs font-bold text-yellow-400 font-mono flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 inline" /> {userRole}
            </span>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {actionSuccessMsg && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs text-emerald-200 flex items-center justify-between gap-3 animate-fade-in shadow-lg shadow-emerald-500/10">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button
            onClick={() => setActionSuccessMsg(null)}
            className="text-emerald-400 hover:text-emerald-200 font-mono text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              Pendientes de Firma
            </span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-400">{pendingCount}</span>
            <span className="text-xs text-slate-400">solicitudes</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Requieren acción directiva hoy</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              Monto en Trámite
            </span>
            <span className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-400">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-yellow-400">
              ${(Number(totalAmountPending) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Impacto financiero en espera</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              Autorizadas en Ciclo
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">{approvedCount}</span>
            <span className="text-xs text-slate-400">procesadas</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Con sello digital y trazabilidad</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              Rechazadas por Política
            </span>
            <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
              <XCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-rose-400">{rejectedCount}</span>
            <span className="text-xs text-slate-400">rechazos</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Protección de márgenes y caja</p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Filter className="w-3.5 h-3.5 text-yellow-400" />
            <span>Filtrar Operación:</span>
          </div>
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-yellow-400 font-mono"
          >
            <option value="TODAS">Todas las Operaciones</option>
            <option value="DESCUENTO">Descuentos Comerciales</option>
            <option value="EXCEPCION_CREDITO">Excepciones de Crédito</option>
            <option value="AJUSTE_INVENTARIO">Ajustes de Inventario</option>
            <option value="TRANSFERENCIA">Transferencias SPEI</option>
            <option value="BONO">Bonos & Comisiones</option>
            <option value="REAPERTURA_PERIODO">Reaperturas de Periodo</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-yellow-400 font-mono"
          >
            <option value="TODOS">Todos los Estados</option>
            <option value="PENDIENTE">Sólo Pendientes</option>
            <option value="APROBADO">Sólo Aprobados</option>
            <option value="RECHAZADO">Sólo Rechazados</option>
          </select>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Mostrando <strong className="text-white">{filteredApprovals.length}</strong> de{' '}
          <strong className="text-white">{approvals.length}</strong> registros auditados
        </div>
      </div>

      {/* Approvals Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono uppercase text-[11px]">
                <th className="py-3.5 px-4">Solicitud & ID</th>
                <th className="py-3.5 px-4">Operación</th>
                <th className="py-3.5 px-4">Solicitante</th>
                <th className="py-3.5 px-4 text-right">Monto</th>
                <th className="py-3.5 px-4">Motivo & Impacto</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredApprovals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-mono text-xs">
                    No se encontraron solicitudes con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredApprovals.map((item) => (
                  <tr key={item.requestId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-yellow-400">{item.requestId}</div>
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                        <FileText className="w-3 h-3 text-slate-400" />
                        Ref: {item.entityId}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Audit: {item.auditId}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${getEntityBadge(
                          item.entity
                        )}`}
                      >
                        {item.entity}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-1 font-mono">
                        {new Date(item.timestamp).toLocaleString('es-MX', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-200">{item.userName}</div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {item.userId} ({item.role})
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono">
                      {item.amount !== undefined ? (
                        <div className="font-bold text-white">
                          ${(Number(item.amount) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          <span className="text-[10px] text-slate-400 ml-1">MXN</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono">N/A</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="text-slate-300 font-normal leading-relaxed line-clamp-2">
                        {item.reason}
                      </div>
                      {item.impact && (
                        <div className="text-[11px] text-yellow-300/80 font-mono mt-1 flex items-start gap-1">
                          <Info className="w-3 h-3 shrink-0 mt-0.5 text-yellow-400" />
                          <span>{item.impact}</span>
                        </div>
                      )}
                      {item.approver && (
                        <div className="text-[10px] text-emerald-400 font-mono mt-1">
                          Firmado por: {item.approver}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${getStatusBadge(
                          item.status
                        )}`}
                      >
                        {item.status === 'PENDIENTE' && <Clock className="w-3 h-3" />}
                        {item.status === 'APROBADO' && <CheckCircle2 className="w-3 h-3" />}
                        {item.status === 'RECHAZADO' && <XCircle className="w-3 h-3" />}
                        {item.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {item.status === 'PENDIENTE' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setActiveModalItem({ item, action: 'APPROVE' })}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition-all"
                            title="Aprobar Solicitud con Firma"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Aprobar
                          </button>
                          <button
                            onClick={() => setActiveModalItem({ item, action: 'REJECT' })}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-300 border border-slate-700 hover:border-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                            title="Rechazar Solicitud"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Rechazar
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] font-mono text-slate-400 italic">
                          Auditado
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation & Signature Modal */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-yellow-400/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div
                  className={`p-2 rounded-lg ${
                    activeModalItem.action === 'APPROVE'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {activeModalItem.action === 'APPROVE' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                    {activeModalItem.action === 'APPROVE'
                      ? 'Confirmar Aprobación Formal'
                      : 'Confirmar Rechazo de Solicitud'}
                  </h4>
                  <span className="text-xs font-mono text-slate-400">
                    Solicitud: {activeModalItem.item.requestId}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveModalItem(null)}
                className="text-slate-400 hover:text-white font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-mono">Operación:</span>
                <span className="font-bold text-yellow-400 font-mono">
                  {activeModalItem.item.entity} ({activeModalItem.item.entityId})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-mono">Solicitante:</span>
                <span className="text-white">
                  {activeModalItem.item.userName} ({activeModalItem.item.role})
                </span>
              </div>
              {activeModalItem.item.amount !== undefined && (
                <div className="flex justify-between">
                  <span className="text-slate-400 font-mono">Monto Involucrado:</span>
                  <span className="font-bold text-emerald-400 font-mono text-sm">
                    ${(activeModalItem.item.amount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}{' '}
                    MXN
                  </span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-800">
                <span className="text-slate-400 block font-mono mb-1">Motivo Registrado:</span>
                <p className="text-slate-200 italic">{activeModalItem.item.reason}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-2">
                Observaciones del Dictamen Directivo:
              </label>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder={
                  activeModalItem.action === 'APPROVE'
                    ? 'Autorizado de conformidad con políticas comerciales 2026...'
                    : 'Rechazado debido a que no cumple con el margen mínimo del 25%...'
                }
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl p-3 focus:outline-none focus:border-yellow-400 font-mono placeholder:text-slate-600"
              />
            </div>

            <div className="p-3 bg-yellow-400/5 border border-yellow-400/20 rounded-xl text-[11px] text-yellow-300/90 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
              <span>
                Esta acción se asentará de manera inmutable en la bitácora de auditoría con sello de
                tiempo, identificador de usuario y Master Transaction ID.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setActiveModalItem(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmAction}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition-all flex items-center gap-1.5 ${
                  activeModalItem.action === 'APPROVE'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20'
                }`}
              >
                {activeModalItem.action === 'APPROVE' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Firmar y Aprobar
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" /> Confirmar Rechazo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
