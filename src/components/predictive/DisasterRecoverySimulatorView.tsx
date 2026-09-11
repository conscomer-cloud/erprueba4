/**
 * @license
 * CONSCORE ERP IA - Disaster Recovery Simulator View
 * 10 Non-Destructive Scenarios with 6-Phase Realtime Failover Stepper
 */

import React, { useState } from 'react';
import { DisasterRecoveryScenario } from '../../types/predictiveOperationsTypes';
import { PredictiveOperationsService } from '../../services/predictiveOperationsService';
import { DataClassificationBadge } from './DataClassificationBadge';
import {
  Play,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Zap,
  Clock,
  FlaskConical,
  Lock,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const DisasterRecoverySimulatorView: React.FC = () => {
  const [scenarios, setScenarios] = useState<DisasterRecoveryScenario[]>(
    PredictiveOperationsService.getDisasterScenarios()
  );
  const [activeScenarioId, setActiveScenarioId] = useState<string>(scenarios[0].scenarioId);
  const [isSimulating, setIsSimulating] = useState(false);

  const selectedScenario =
    scenarios.find((s) => s.scenarioId === activeScenarioId) || scenarios[0];

  const handleRunSimulation = async (scenarioId: string) => {
    setIsSimulating(true);
    try {
      await PredictiveOperationsService.runDisasterRecoverySimulation(
        scenarioId,
        (updated) => {
          setScenarios((prev) =>
            prev.map((s) => (s.scenarioId === updated.scenarioId ? { ...updated } : s))
          );
        }
      );
    } finally {
      setIsSimulating(false);
    }
  };

  const phaseNames = {
    DETECT: '1. DETECCIÓN',
    ISOLATE: '2. AISLAMIENTO',
    PROTECT: '3. PROTECCIÓN',
    RECOVER: '4. RECUPERACIÓN',
    RECONCILE: '5. CONCILIACIÓN',
    AUDIT: '6. AUDITORÍA',
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Sandbox Guarantee */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Disaster Recovery Simulator</h2>
            <DataClassificationBadge classification="SIMULATED" />
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Simulador de contingencias en Sandbox No Destructivo. 10 escenarios con conmutación en caliente.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3.5 py-2 rounded-lg text-xs font-semibold text-amber-900">
          <FlaskConical className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>Garantía de Aislamiento: 0 mutación de datos reales en producción.</span>
        </div>
      </div>

      {/* Main Grid: Scenario Selector & Live Stepper */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scenario List */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2 max-h-[650px] overflow-y-auto">
          <div className="text-xs font-bold text-slate-500 uppercase px-2 pb-2 border-b border-slate-100">
            Escenarios de Contingencia (10)
          </div>

          {scenarios.map((scen) => (
            <button
              key={scen.scenarioId}
              onClick={() => setActiveScenarioId(scen.scenarioId)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                activeScenarioId === scen.scenarioId
                  ? 'border-purple-500 bg-purple-50/40 shadow-sm'
                  : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">{scen.name}</span>
                {scen.status === 'RECOVERED' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                )}
                {scen.status === 'SIMULATING' && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                )}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                {scen.description}
              </div>
            </button>
          ))}
        </div>

        {/* Live 6-Phase Execution Stepper Panel */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    {selectedScenario.scenarioId}
                  </span>
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    Objetivo: {selectedScenario.targetComponent}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedScenario.name}</h3>
                <p className="text-xs text-slate-600 mt-0.5">{selectedScenario.description}</p>
              </div>

              <button
                disabled={isSimulating}
                onClick={() => handleRunSimulation(selectedScenario.scenarioId)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs shadow-sm transition-colors ${
                  isSimulating
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                {isSimulating ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    Simulando Failover...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Ejecutar Simulación
                  </>
                )}
              </button>
            </div>

            {/* Stepper Display */}
            <div className="space-y-3 mt-5">
              {selectedScenario.steps.map((step, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-lg border transition-all ${
                    step.status === 'SUCCESS'
                      ? 'border-emerald-200 bg-emerald-50/40 text-emerald-950'
                      : step.status === 'RUNNING'
                      ? 'border-purple-300 bg-purple-50/60 shadow-sm animate-pulse'
                      : 'border-slate-100 bg-slate-50/60 text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="flex items-center gap-2">
                      {step.status === 'SUCCESS' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : step.status === 'RUNNING' ? (
                        <span className="w-2 h-2 rounded-full bg-purple-600" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-slate-300" />
                      )}
                      {phaseNames[step.phase]}
                    </span>
                    <span className="font-mono text-[11px]">
                      {step.status === 'SUCCESS' ? 'PASSED (0 error)' : step.status}
                    </span>
                  </div>
                  <p className="text-xs ml-6 leading-relaxed">{step.details}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Metrics */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4">
              <span className="text-slate-500 font-medium">
                Latencia Failover:{' '}
                <strong className="text-slate-900 font-mono">
                  {selectedScenario.durationMs > 0
                    ? `${(selectedScenario.durationMs / 1000).toFixed(2)}s`
                    : 'N/A'}
                </strong>
              </span>
              <span className="text-slate-500 font-medium">
                SLA RTO:{' '}
                <strong className="text-emerald-700 font-mono">&lt; 5.0 seg</strong>
              </span>
            </div>

            <span className="text-slate-400 font-mono text-[11px]">
              Audit Trail: {selectedScenario.auditTrailId}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
