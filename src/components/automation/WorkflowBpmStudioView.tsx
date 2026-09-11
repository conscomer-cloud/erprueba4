/**
 * @license
 * CONSCORE ERP IA - FASE 14: AUTOMATIZACIÓN EMPRESARIAL + BPM + WORKFLOWS + RPA
 * BPM Workflow Studio & State Machine Visualizer
 */

import React, { useState } from 'react';
import {
  Workflow,
  Plus,
  Play,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowRight,
  GitBranch,
  RotateCcw,
  UserCheck,
  Zap,
  Sliders,
  History,
  FileCode,
} from 'lucide-react';
import {
  BpmWorkflowDefinition,
  BpmWorkflowStep,
  WorkflowExecutionInstance,
} from '../../types/automationBpmTypes';
import { AutomationBpmEngine } from '../../services/automationBpmEngine';

interface WorkflowBpmStudioViewProps {
  workflows: BpmWorkflowDefinition[];
  executions: WorkflowExecutionInstance[];
  onRefresh: () => void;
}

export const WorkflowBpmStudioView: React.FC<WorkflowBpmStudioViewProps> = ({
  workflows,
  executions,
  onRefresh,
}) => {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>(
    workflows[0]?.workflowId || 'WF-COMMERCIAL-E2E-01'
  );
  const [selectedStep, setSelectedStep] = useState<BpmWorkflowStep | null>(null);
  const [activeTab, setActiveTab] = useState<'DESIGNER' | 'EXECUTIONS' | 'ROLLBACK_POLICY'>('DESIGNER');
  const [testPayload, setTestPayload] = useState<string>(
    JSON.stringify({ total: 350000, marginPct: 22.4, customerName: 'Constructora Atlas S.A.' }, null, 2)
  );
  const [executionMessage, setExecutionMessage] = useState<string | null>(null);

  const currentWf = workflows.find((w) => w.workflowId === selectedWorkflowId) || workflows[0];
  const currentExecutions = executions.filter((e) => e.workflowId === selectedWorkflowId);

  const handleRunLiveTest = () => {
    try {
      const parsed = JSON.parse(testPayload);
      const res = AutomationBpmEngine.emitEvent({
        eventType: currentWf.triggerEvent,
        sourceModule: currentWf.category,
        entityType: 'MANUAL_TEST_INSTANCE',
        entityId: `TEST-${Date.now().toString(36).toUpperCase()}`,
        userId: 'USR-ADMIN-01',
        severity: 'INFO',
        payload: parsed,
        idempotencyKey: `IDEMP-TEST-${Date.now()}`,
        correlationId: `CORR-${Date.now()}`,
        masterTransactionId: `TRX-TEST-${Date.now()}`,
        securityHash: 'SHA256-TEST-VALIDATED',
      });

      setExecutionMessage(
        `Evento ${res.event.eventType} emitido. Instancia creada ID: ${res.triggeredWorkflows[0] || 'Auto-completada'}`
      );
      onRefresh();
      setTimeout(() => setExecutionMessage(null), 5000);
    } catch (err: any) {
      alert(`Error en formato JSON: ${err.message}`);
    }
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'START':
        return <Play className="w-4 h-4 text-emerald-600" />;
      case 'AUTOMATED_TASK':
        return <Zap className="w-4 h-4 text-indigo-600" />;
      case 'DECISION_GATEWAY':
        return <GitBranch className="w-4 h-4 text-amber-600" />;
      case 'HUMAN_APPROVAL':
        return <UserCheck className="w-4 h-4 text-rose-600" />;
      case 'AUDIT_LOG':
        return <Clock className="w-4 h-4 text-slate-600" />;
      case 'END':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      default:
        return <Workflow className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-100 text-indigo-800">
              BPM Engine v3.4
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
              Estado: Activo
            </span>
            <span className="text-xs text-slate-500 font-mono">
              SLA Max: {currentWf?.slaMinutes} min
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            {currentWf?.name} ({currentWf?.workflowId})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {currentWf?.triggerConditionDescription}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedWorkflowId}
            onChange={(e) => setSelectedWorkflowId(e.target.value)}
            className="text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            {workflows.map((wf) => (
              <option key={wf.workflowId} value={wf.workflowId}>
                {wf.workflowId} - {wf.name} (v{wf.version})
              </option>
            ))}
          </select>

          <button
            onClick={handleRunLiveTest}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
          >
            <Play className="w-3.5 h-3.5" />
            Lanzar Instancia de Prueba
          </button>
        </div>
      </div>

      {executionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium flex items-center justify-between">
          <span>{executionMessage}</span>
          <button
            onClick={() => setExecutionMessage(null)}
            className="text-emerald-600 hover:text-emerald-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Subtabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('DESIGNER')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'DESIGNER'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Diagrama de Estados & Transiciones ({currentWf?.steps.length} Pasos)
        </button>

        <button
          onClick={() => setActiveTab('EXECUTIONS')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'EXECUTIONS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          Instancias de Ejecución ({currentExecutions.length})
        </button>

        <button
          onClick={() => setActiveTab('ROLLBACK_POLICY')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'ROLLBACK_POLICY'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Estrategia Atómica de Compensación & Rollback
        </button>
      </div>

      {/* Tab 1: Designer View */}
      {activeTab === 'DESIGNER' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Visual Step Pipeline (Left 2 cols) */}
          <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
              <span>Flujo de Ejecución Secuencial & Decisional</span>
              <span className="text-xs text-slate-400 font-normal">
                Trigger: <code className="text-indigo-600 font-mono">{currentWf?.triggerEvent}</code>
              </span>
            </h3>

            <div className="relative pl-6 space-y-4 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
              {currentWf?.steps.map((step, idx) => {
                const isSelected = selectedStep?.stepId === step.stepId;
                return (
                  <div
                    key={step.stepId}
                    onClick={() => setSelectedStep(step)}
                    className={`relative p-3.5 rounded-lg border transition cursor-pointer ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-200'
                        : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/80'
                    }`}
                  >
                    {/* Circle on line */}
                    <div
                      className={`absolute -left-[30px] top-4 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 bg-white ${
                        step.requiresHumanValidation
                          ? 'border-rose-500 text-rose-600'
                          : 'border-indigo-500 text-indigo-600'
                      }`}
                    >
                      {idx + 1}
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded bg-white border border-slate-200 shadow-2xs">
                          {getStepIcon(step.type)}
                        </span>
                        <div>
                          <span className="text-xs font-bold text-slate-900">
                            {step.name}
                          </span>
                          <span className="ml-2 text-[10px] font-mono text-slate-400">
                            ({step.stepId})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {step.requiresHumanValidation ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
                            <UserCheck className="w-3 h-3" />
                            {step.assignedRole}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-800 flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            Automático
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono">
                          SLA {step.timeoutMinutes}m
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 mt-2">
                      {step.description}
                    </p>

                    {step.requiresHumanValidation && step.humanActionPrompt && (
                      <div className="mt-2 p-2 bg-amber-50 rounded border border-amber-200 text-[11px] text-amber-900 flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span><strong>Directiva SoD:</strong> {step.humanActionPrompt}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step Inspector & Test Variables (Right 1 col) */}
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-indigo-500" />
                Inspector de Paso
              </h4>

              {selectedStep ? (
                <div className="space-y-2.5 text-xs">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase">
                      ID & Nombre
                    </label>
                    <p className="font-bold text-slate-900">
                      {selectedStep.stepId} - {selectedStep.name}
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase">
                      Tipo de Nodo
                    </label>
                    <p className="font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded inline-block">
                      {selectedStep.type}
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase">
                      Rol Responsable
                    </label>
                    <p className="font-semibold text-slate-800">
                      {selectedStep.assignedRole || 'SYSTEM AUTOMATION ENGINE'}
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase">
                      SLA Máximo Permitido
                    </label>
                    <p className="text-slate-800">
                      {selectedStep.timeoutMinutes} minutos
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase">
                      Siguiente Paso (Forward Link)
                    </label>
                    <p className="font-mono text-slate-700">
                      {selectedStep.nextStepId || '(Fin de Flujo)'}
                    </p>
                  </div>
                  {selectedStep.condition && (
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase">
                        Expresión Condicional
                      </label>
                      <pre className="p-2 bg-slate-900 text-emerald-400 rounded text-[11px] font-mono overflow-x-auto">
                        {JSON.stringify(selectedStep.condition)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  Selecciona un paso del flujo de la izquierda para inspeccionar sus propiedades técnicas.
                </p>
              )}
            </div>

            {/* Test Payload Box */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Variables de Prueba (JSON)
              </h4>
              <textarea
                value={testPayload}
                onChange={(e) => setTestPayload(e.target.value)}
                rows={5}
                className="w-full text-xs font-mono p-2.5 bg-slate-900 text-indigo-200 rounded-lg border border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                onClick={handleRunLiveTest}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                Ejecutar Simulación de Instancia
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Executions View */}
      {activeTab === 'EXECUTIONS' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Historial de Instancias del Flujo ({currentExecutions.length})
            </h3>
            <span className="text-xs text-slate-500">
              Trazabilidad 100% inmutable con Master Transaction ID
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5">ID Ejecución</th>
                  <th className="px-3 py-2.5">Master Trx ID</th>
                  <th className="px-3 py-2.5">Estado</th>
                  <th className="px-3 py-2.5">Paso Actual</th>
                  <th className="px-3 py-2.5">Inicio</th>
                  <th className="px-3 py-2.5">Validación Humana</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentExecutions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-slate-400">
                      No hay ejecuciones registradas para este workflow. Haz clic en "Lanzar Instancia de Prueba".
                    </td>
                  </tr>
                ) : (
                  currentExecutions.map((exec) => (
                    <tr key={exec.executionId} className="hover:bg-slate-50/80">
                      <td className="px-3 py-2.5 font-mono font-semibold text-indigo-700">
                        {exec.executionId}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-600">
                        {exec.masterTransactionId}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            exec.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : exec.status === 'WAITING_HUMAN_APPROVAL'
                              ? 'bg-amber-100 text-amber-800'
                              : exec.status === 'ROLLED_BACK'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {exec.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-medium text-slate-800">
                        {exec.currentStepId}
                      </td>
                      <td className="px-3 py-2.5 text-slate-500">
                        {new Date(exec.startTime).toLocaleTimeString()}
                      </td>
                      <td className="px-3 py-2.5">
                        {exec.humanValidationRequired ? (
                          <span className="text-amber-700 font-semibold text-[11px] flex items-center gap-1">
                            <UserCheck className="w-3 h-3" />
                            {exec.humanValidationPendingRole}
                          </span>
                        ) : (
                          <span className="text-slate-400">No requerida</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Rollback Policy */}
      {activeTab === 'ROLLBACK_POLICY' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Estrategia de Compensación y Rollback Atómico ({currentWf?.rollbackStrategy.enabled ? 'Habilitada' : 'Deshabilitada'})
            </h3>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Cada ejecución crítica en CONSCORE ERP se realiza bajo el patrón <strong>BEGIN &rarr; VALIDATE &rarr; EXECUTE &rarr; COMMIT</strong>. Si en cualquier punto una validación de crédito, reserva de almacén o timbrado falla, se dispara la compensación reversa sin dejar saldos huérfanos.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-xs font-bold text-indigo-700">1. Reserva de Inventario</span>
              <p className="text-xs text-slate-600">
                Si la orden no se autoriza en 24h, el stock apartado se reintegra al balance disponible de WMS.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-xs font-bold text-indigo-700">2. Límite de Crédito CXC</span>
              <p className="text-xs text-slate-600">
                Si el pedido se cancela, la línea de crédito comprometida se libera inmediatamente en el submayor.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-xs font-bold text-indigo-700">3. Certificado de Reversión</span>
              <p className="text-xs text-slate-600">
                Se estampa un hash SHA-256 inmutable de auditoría para documentar el motivo y autor del rollback.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
