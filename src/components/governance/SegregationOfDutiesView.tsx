/**
 * @license
 * CONSCORE ERP IA - Segregation of Duties (SoD) View
 * FASE 13 - Matriz de Incompatibilidades, Detección de Conflictos y Bloqueo Físico de SoD
 */

import React, { useState } from 'react';
import {
  Scale,
  ShieldAlert,
  AlertOctagon,
  CheckCircle,
  XCircle,
  Lock,
  Play,
  Users,
  Search,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import {
  SoDConflictRule,
  SoDViolationRisk,
} from '../../types/governanceRiskComplianceTypes';
import { GovernanceRiskComplianceService } from '../../services/governanceRiskComplianceService';
import { AuditLog } from '../../types/erp';

interface SegregationOfDutiesViewProps {
  rules: SoDConflictRule[];
  violations: SoDViolationRisk[];
  onAddViolation?: (v: SoDViolationRisk) => void;
}

export const SegregationOfDutiesView: React.FC<SegregationOfDutiesViewProps> = ({
  rules,
  violations,
  onAddViolation,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('TODAS');

  // Interactive SoD Sandbox Test
  const [simUser, setSimUser] = useState('USR-ALBERTO-01');
  const [simEntityId, setSimEntityId] = useState('PRV-009-ACEROS');
  const [simActionA, setSimActionA] = useState('CREAR_PROVEEDOR');
  const [simActionB, setSimActionB] = useState('AUTORIZAR_PROVEEDOR');
  const [simResult, setSimResult] = useState<string | null>(null);
  const [simSuccess, setSimSuccess] = useState<boolean>(true);

  const handleRunSoDSimulation = () => {
    // Mock audit where user created the entity
    const mockAuditLogs: AuditLog[] = [
      {
        id: `LOG-SIM-${Date.now()}`,
        userId: simUser,
        user_id: simUser,
        userName: 'Alberto Ramírez (Compras)',
        action: simActionA,
        entityId: simEntityId,
        entity_id: simEntityId,
        module: 'COMPRAS',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
    ];

    const res = GovernanceRiskComplianceService.checkSegregationOfDuties(
      simActionB,
      simUser,
      'Alberto Ramírez (Compras)',
      'PROVEEDOR',
      simEntityId,
      mockAuditLogs,
      rules
    );

    if (!res.isAllowed) {
      setSimSuccess(false);
      setSimResult(
        `🚨 OPERACIÓN BLOQUEADA POR MOTOR SoD [${res.ruleViolated?.code}]: ${res.reason}`
      );
      if (res.violationRisk && onAddViolation) {
        onAddViolation(res.violationRisk);
      }
    } else {
      setSimSuccess(true);
      setSimResult('✅ OPERACIÓN PERMITIDA: No se detectaron incompatibilidades directas para esta combinación.');
    }
  };

  const filteredRules = rules.filter((r) => {
    const matchesSearch =
      (r.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.code || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.functionA || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.functionB || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSev = selectedSeverity === 'TODAS' || r.severity === selectedSeverity;
    return matchesSearch && matchesSev;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Scale className="h-6 w-6 text-blue-600" />
            Segregación de Funciones (SoD) & Control de Incompatibilidades
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Matriz de funciones incompatibles con bloqueo en tiempo real para evitar fraudes internos y errores operativos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-800 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4" /> Bloqueo Físico Activado
          </span>
          <span className="rounded-lg bg-red-50 border border-red-200 px-3 py-1.5 text-xs font-bold text-red-800">
            {violations.length} Conflictos Detectados
          </span>
        </div>
      </div>

      {/* Interactive SoD Sandbox */}
      <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-purple-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <AlertOctagon className="h-5 w-5 text-purple-700" />
            <h3 className="text-sm font-bold text-purple-950 uppercase tracking-wider">
              Simulador de Conflicto de Segregación (SoD Verification Sandbox)
            </h3>
          </div>
          <span className="text-xs font-mono text-purple-700 font-bold">Prueba de Fuego SoD</span>
        </div>

        <p className="text-xs text-purple-900 mb-4 leading-relaxed">
          Simula un intento en el que el Usuario <b>A</b> realiza una acción preliminar (Ej: <i>Crear Proveedor</i> o <i>Capturar Pago</i>) y posteriormente intenta realizar la acción incompatible (Ej: <i>Autorizar Proveedor</i> o <i>Dispersar Transferencia</i>).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Usuario en Simulación
            </label>
            <input
              type="text"
              value={simUser}
              onChange={(e) => setSimUser(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono text-slate-800"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              ID Entidad / Documento
            </label>
            <input
              type="text"
              value={simEntityId}
              onChange={(e) => setSimEntityId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono text-slate-800"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Función Inicial (A)
            </label>
            <select
              value={simActionA}
              onChange={(e) => setSimActionA(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800"
            >
              <option value="CREAR_PROVEEDOR">CREAR_PROVEEDOR</option>
              <option value="CREAR_FACTURA_CXP">CREAR_FACTURA_CXP</option>
              <option value="CREAR_PAGO">CREAR_PAGO</option>
              <option value="CREAR_DESCUENTO">CREAR_DESCUENTO</option>
              <option value="CREAR_AJUSTE_INVENTARIO">CREAR_AJUSTE_INVENTARIO</option>
              <option value="CREAR_NOMINA">CREAR_NOMINA</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Función Intentada (B)
            </label>
            <select
              value={simActionB}
              onChange={(e) => setSimActionB(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800"
            >
              <option value="AUTORIZAR_PROVEEDOR">AUTORIZAR_PROVEEDOR</option>
              <option value="AUTORIZAR_PAGO">AUTORIZAR_PAGO</option>
              <option value="EJECUTAR_TRANSFERENCIA">EJECUTAR_TRANSFERENCIA</option>
              <option value="AUTORIZAR_DESCUENTO">AUTORIZAR_DESCUENTO</option>
              <option value="APROBAR_AJUSTE">APROBAR_AJUSTE</option>
              <option value="AUTORIZAR_NOMINA">AUTORIZAR_NOMINA</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            onClick={handleRunSoDSimulation}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-700 px-4 py-2 text-xs font-bold text-white hover:bg-purple-800 shadow-xs"
          >
            <Play className="h-3.5 w-3.5" /> Ejecutar Prueba de SoD
          </button>

          {simResult && (
            <div
              className={`flex-1 rounded-lg p-3 text-xs font-medium border ${
                simSuccess
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-red-50 text-red-950 border-red-200'
              }`}
            >
              {simResult}
            </div>
          )}
        </div>
      </div>

      {/* Registro de Conflictos SoD Detectados */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-red-600" />
          Bitácora de Conflictos SoD y Operaciones Bloqueadas
        </h3>

        <div className="space-y-3">
          {violations.map((vio) => (
            <div
              key={vio.id}
              className="rounded-lg border border-red-200 bg-red-50/40 p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-red-900 bg-red-200 px-2 py-0.5 rounded">
                    {vio.ruleCode}
                  </span>
                  <span className="text-xs font-bold text-slate-900">{vio.ruleName}</span>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-red-600 text-white">
                  BLOQUEADO POR CONTROL INTERNO
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-700 bg-white p-2.5 rounded border border-red-100 font-mono">
                <div>Usuario: <b>{vio.userName}</b> ({vio.userId})</div>
                <div>Intento: <b className="text-red-700">{vio.attemptedAction}</b></div>
                <div>Previo: <b className="text-blue-700">{vio.conflictingAction}</b></div>
              </div>

              <p className="text-xs text-slate-600">{vio.mitigationNotes}</p>
            </div>
          ))}

          {violations.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-400">
              No hay violaciones activas de Segregación de Funciones.
            </div>
          )}
        </div>
      </div>

      {/* Matriz Oficial de Reglas SoD */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-600" />
              Matriz Oficial de Incompatibilidades SoD
            </h3>
            <p className="text-xs text-slate-500">
              Catálogo de combinaciones de funciones mutuamente excluyentes en CONSCORE ERP IA.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar regla SoD..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-lg border border-slate-200 pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 w-48 sm:w-64"
              />
            </div>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="TODAS">Todas las Severidades</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
            </select>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRules.map((rule) => (
            <div
              key={rule.id}
              className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                  {rule.code}
                </span>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded ${
                    rule.severity === 'CRITICAL'
                      ? 'bg-red-100 text-red-800 border border-red-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {rule.severity}
                </span>
              </div>

              <h4 className="text-xs font-bold text-slate-900">{rule.name}</h4>

              <div className="flex items-center justify-between gap-2 p-2 bg-white rounded border border-slate-200 font-mono text-[11px]">
                <span className="text-blue-700 font-bold">{rule.functionA}</span>
                <span className="text-red-500 font-bold">≠</span>
                <span className="text-purple-700 font-bold">{rule.functionB}</span>
              </div>

              <p className="text-[11px] text-slate-600">{rule.description}</p>

              <div className="pt-2 border-t border-slate-200/80 text-[10px] text-slate-500">
                <span className="font-bold text-slate-700 block">Control Mitigante:</span>
                <p className="text-slate-600 mt-0.5">{rule.mitigatingControl}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
