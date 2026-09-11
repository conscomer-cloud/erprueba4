/**
 * @license
 * CONSCORE ERP IA - Authority Matrix & Approvals View
 * FASE 13 - Matriz de Facultades, Límites Monetarios y Centro de Aprobaciones Ejecutivas
 */

import React, { useState } from 'react';
import {
  Sliders,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Lock,
  DollarSign,
  Percent,
  Shield,
  Layers,
  Scale,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { UserRole } from '../../types/erp';
import {
  AuthorityLimitRule,
  ExecutiveApprovalRequest,
  AuthorityDomain,
} from '../../types/governanceRiskComplianceTypes';
import { GovernanceRiskComplianceService } from '../../services/governanceRiskComplianceService';

interface AuthorityMatrixViewProps {
  rules: AuthorityLimitRule[];
  approvals: ExecutiveApprovalRequest[];
  onProcessApproval?: (approvalId: string, decision: 'APPROVED' | 'REJECTED', reason: string) => void;
}

export const AuthorityMatrixView: React.FC<AuthorityMatrixViewProps> = ({
  rules,
  approvals,
  onProcessApproval,
}) => {
  const [selectedDomain, setSelectedDomain] = useState<string>('TODAS');
  const [approvalDecisionReason, setApprovalDecisionReason] = useState<string>('');
  const [selectedApprovalForModal, setSelectedApprovalForModal] = useState<ExecutiveApprovalRequest | null>(null);

  // Interactive Test Sandbox State
  const [testDomain, setTestDomain] = useState<AuthorityDomain>('VENTAS_DESCUENTOS');
  const [testAmount, setTestAmount] = useState<number>(8.5);
  const [testRole, setTestRole] = useState<UserRole>('VENDEDOR');

  const testEvaluation = GovernanceRiskComplianceService.evaluateAuthorityLimit(
    testDomain,
    testAmount,
    testRole,
    rules
  );

  const filteredRules = rules.filter(
    (r) => selectedDomain === 'TODAS' || r.domain === selectedDomain
  );

  const domains = ['TODAS', ...new Set(rules.map((r) => r.domain))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="h-6 w-6 text-blue-600" />
            Matriz de Facultades & Niveles de Autorización
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Límites monetarios y porcentuales por rol para descuentos de venta, órdenes de compra, pagos y ajustes de inventario.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-800">
            {rules.length} Reglas Parametrizadas
          </span>
          <span className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-bold text-amber-800">
            {approvals.filter((a) => a.decision === 'PENDING').length} Pendientes
          </span>
        </div>
      </div>

      {/* Interactive Authority Simulator / Sandbox */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-blue-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-blue-700" />
            <h3 className="text-sm font-bold text-blue-950 uppercase tracking-wider">
              Simulador de Validación de Facultades en Tiempo Real
            </h3>
          </div>
          <span className="text-xs font-mono text-blue-700">Sandbox Motor de Reglas</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Ámbito de Operación
            </label>
            <select
              value={testDomain}
              onChange={(e) => setTestDomain(e.target.value as AuthorityDomain)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="VENTAS_DESCUENTOS">Ventas - Descuento Comercial (%)</option>
              <option value="COMPRAS_OC">Compras - Orden de Compra (MXN)</option>
              <option value="PAGOS_TESORERIA">Finanzas - Pago Tesorería (MXN)</option>
              <option value="AJUSTES_INVENTARIO">Almacén - Ajuste Kardex (MXN)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Monto o Valor Propuesto
            </label>
            <input
              type="number"
              value={testAmount}
              onChange={(e) => setTestAmount(parseFloat(e.target.value) || 0)}
              step="any"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Rol del Solicitante
            </label>
            <select
              value={testRole}
              onChange={(e) => setTestRole(e.target.value as UserRole)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="VENDEDOR">VENDEDOR</option>
              <option value="GERENTE_VENTAS">GERENTE_VENTAS</option>
              <option value="COMPRAS">COMPRAS</option>
              <option value="ALMACEN">ALMACEN</option>
              <option value="FINANZAS">FINANZAS</option>
              <option value="DIRECTOR">DIRECTOR</option>
              <option value="ADMINISTRADOR">ADMINISTRADOR</option>
            </select>
          </div>
        </div>

        {/* Evaluation Output Result */}
        <div className="mt-4 rounded-lg bg-white p-4 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {testEvaluation.isAuthorizedImmediately ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  <CheckCircle className="h-3.5 w-3.5" /> AUTORIZADO INMEDIATAMENTE
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                  <Clock className="h-3.5 w-3.5" /> REQUIERE AUTORIZACIÓN ESCALONADA
                </span>
              )}
              {testEvaluation.requiresTwoSignatures && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                  Doble Firma Obligatoria
                </span>
              )}
            </div>
            <p className="text-xs text-slate-700 font-medium">
              {testEvaluation.reason}
            </p>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Nivel Requerido</span>
            <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-1 rounded border border-blue-200">
              {testEvaluation.requiredRole}
              {testEvaluation.secondRequiredRole ? ` + ${testEvaluation.secondRequiredRole}` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Cola de Solicitudes de Aprobación */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              Bandeja de Aprobaciones Ejecutivas
            </h3>
            <p className="text-xs text-slate-500">
              Solicitudes activas que requieren dictamen de Gerencia o Dirección General.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-3">Folio / Tipo</th>
                <th className="py-2.5 px-3">Solicitante</th>
                <th className="py-2.5 px-3 text-right">Monto / Descuento</th>
                <th className="py-2.5 px-3">Justificación</th>
                <th className="py-2.5 px-3">Riesgo</th>
                <th className="py-2.5 px-3">Estado</th>
                <th className="py-2.5 px-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {approvals.map((app) => (
                <tr key={app.approvalId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-mono font-bold text-slate-900">{app.folio}</div>
                    <span className="text-[10px] text-slate-500 uppercase">{app.entityType}</span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-medium text-slate-800">{app.requesterName}</div>
                    <span className="text-[10px] text-slate-400 font-mono">{app.requesterRole}</span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                    {app.entityType === 'DESCUENTO_VENTA'
                      ? `${app.requestedAmount}%`
                      : `$${(Number(app.requestedAmount) || 0).toLocaleString('es-MX')} ${app.currency}`}
                  </td>
                  <td className="py-3 px-3 max-w-xs text-slate-600 truncate">
                    {app.reason}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        app.riskEvaluationScore >= 15
                          ? 'bg-red-100 text-red-800'
                          : app.riskEvaluationScore >= 10
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {app.riskEvaluationScore}/25 Risk
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        app.decision === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : app.decision === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {app.decision}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    {app.decision === 'PENDING' ? (
                      <button
                        onClick={() => setSelectedApprovalForModal(app)}
                        className="rounded bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-blue-700 shadow-xs"
                      >
                        Dictaminar
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-mono">
                        {app.approverName || 'Procesado'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reglas de la Matriz Tabuladas */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-600" />
              Tabulador de Facultades Oficiales
            </h3>
            <p className="text-xs text-slate-500">
              Límites inferiores y superiores de autorización parametrizados en CONSCORE ERP IA.
            </p>
          </div>

          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            {domains.map((dom) => (
              <option key={dom} value={dom}>
                {dom}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRules.map((rule) => (
            <div
              key={rule.id}
              className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                  {rule.code}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-500">
                  {rule.domain}
                </span>
              </div>

              <h4 className="text-xs font-bold text-slate-900">{rule.name}</h4>
              <p className="text-[11px] text-slate-600">{rule.description}</p>

              <div className="pt-2 border-t border-slate-200/80 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Rango</span>
                  <b>
                    {rule.minThreshold} a {rule.maxThreshold === 99999999 ? 'Ilimitado' : rule.maxThreshold}{' '}
                    {rule.metricUnit}
                  </b>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Rol Requerido</span>
                  <b className="text-blue-900">{rule.requiredRole}</b>
                </div>
                {rule.requiresTwoSignatures && (
                  <div className="col-span-2 text-purple-800 bg-purple-50 p-1.5 rounded border border-purple-200 text-[10px] font-bold">
                    Requiere 2da firma: {rule.secondRequiredRole}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Dictamen */}
      {selectedApprovalForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                  {selectedApprovalForModal.folio}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Dictamen de Autorización
                </h3>
              </div>
              <button
                onClick={() => setSelectedApprovalForModal(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1">
                <div>Tipo: <b>{selectedApprovalForModal.entityType}</b></div>
                <div>
                  Monto / Valor:{' '}
                  <b>
                    {selectedApprovalForModal.entityType === 'DESCUENTO_VENTA'
                      ? `${selectedApprovalForModal.requestedAmount}%`
                      : `$${(Number(selectedApprovalForModal.requestedAmount) || 0).toLocaleString('es-MX')} MXN`}
                  </b>
                </div>
                <div>Solicitante: <b>{selectedApprovalForModal.requesterName}</b></div>
                <div>Justificación: <span className="italic">{selectedApprovalForModal.reason}</span></div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Justificación de la Decisión / Firma Digital:
                </label>
                <textarea
                  value={approvalDecisionReason}
                  onChange={(e) => setApprovalDecisionReason(e.target.value)}
                  placeholder="Escribe el motivo del dictamen (aprobación o rechazo)..."
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  if (onProcessApproval) {
                    onProcessApproval(
                      selectedApprovalForModal.approvalId,
                      'REJECTED',
                      approvalDecisionReason || 'Rechazado por exceder directrices comerciales/financieras.'
                    );
                  }
                  selectedApprovalForModal.decision = 'REJECTED';
                  selectedApprovalForModal.decisionReason = approvalDecisionReason || 'Rechazado';
                  setSelectedApprovalForModal(null);
                  setApprovalDecisionReason('');
                }}
                className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-100"
              >
                Rechazar
              </button>
              <button
                onClick={() => {
                  if (onProcessApproval) {
                    onProcessApproval(
                      selectedApprovalForModal.approvalId,
                      'APPROVED',
                      approvalDecisionReason || 'Aprobado conforme a matriz de facultades.'
                    );
                  }
                  selectedApprovalForModal.decision = 'APPROVED';
                  selectedApprovalForModal.decisionReason = approvalDecisionReason || 'Aprobado';
                  setSelectedApprovalForModal(null);
                  setApprovalDecisionReason('');
                }}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs"
              >
                Aprobar y Firmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
