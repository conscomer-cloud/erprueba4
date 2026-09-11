/**
 * @license
 * CONSCORE ERP IA - FASE 14: AUTOMATIZACIÓN EMPRESARIAL + BPM + WORKFLOWS + RPA
 * Chaos Testing Lab & Resilience Scenarios
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  Play,
  CheckCircle2,
  XCircle,
  RotateCw,
  ShieldCheck,
  Zap,
  Lock,
} from 'lucide-react';
import { ChaosTestScenario } from '../../types/automationBpmTypes';
import { AutomationBpmEngine } from '../../services/automationBpmEngine';

export const ChaosTestingSuiteView: React.FC = () => {
  const [scenarios, setScenarios] = useState<ChaosTestScenario[]>(
    AutomationBpmEngine.runChaosTestSuite()
  );
  const [runningId, setRunningId] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<ChaosTestScenario | null>(scenarios[0] || null);

  const handleRunChaosTest = (id: string) => {
    setRunningId(id);
    setTimeout(() => {
      const result = AutomationBpmEngine.runChaosTestSuite().find(s => s.id === id);
      const updated = scenarios.map(s => s.id === id && result ? result : s);
      setSelectedScenario(prev => prev?.id === id ? result || prev : prev);
      setScenarios(updated);
      setRunningId(null);
    }, 700);
  };

  const handleRunAll = () => {
    setRunningId('ALL');
    setTimeout(() => {
      const updated = AutomationBpmEngine.runChaosTestSuite();
      setSelectedScenario(prev => updated.find(s => s.id === prev?.id) || null);
      setScenarios(updated);
      setRunningId(null);
    }, 1200);
  };

  const passedCount = scenarios.filter((s) => s.observedResult === 'PASS').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Escenarios de demostración
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
              Resiliencia: {passedCount} / {scenarios.length} Escenarios
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Laboratorio de Caos — catálogo de demostración
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Simula caídas de red, timeouts de base de datos, eventos duplicados concurrentes, bloqueos de concurrencia y tentativas de dispersión no autorizadas.
          </p>
        </div>

        <button
          onClick={handleRunAll}
          disabled={runningId !== null}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-sm"
        >
          {runningId === 'ALL' ? (
            <RotateCw className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {runningId === 'ALL' ? 'Inyectando Caos en 10 Puntos...' : 'Ejecutar Toda la Suite de Caos'}
        </button>
      </div>

      {/* Grid: Scenarios List (Left 2 cols) & Scenario Inspector (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Scenarios List */}
        <div className="lg:col-span-2 space-y-3">
          {scenarios.map((sc) => {
            const isSelected = selectedScenario?.id === sc.id;
            const isRunning = runningId === sc.id || runningId === 'ALL';

            return (
              <div
                key={sc.id}
                onClick={() => setSelectedScenario(sc)}
                className={`p-4 rounded-xl border transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white shadow-2xs hover:shadow-sm ${
                  isSelected ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-200'
                }`}
              >
                <div className="space-y-1 text-xs flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[11px]">
                      {sc.id}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">
                      {sc.title}
                    </span>
                  </div>
                  <p className="text-slate-600">
                    {sc.failureInjected}
                  </p>
                  <p className="text-[11px] text-indigo-700 font-semibold pt-1">
                    Defensa: {sc.recoveryStrategy}
                  </p>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                  <span className="px-2.5 py-1 rounded text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {sc.observedResult}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRunChaosTest(sc.id);
                    }}
                    disabled={isRunning}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold transition flex items-center gap-1"
                  >
                    {isRunning ? (
                      <RotateCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Play className="w-3 h-3" />
                    )}
                    Re-probar
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Selected Scenario Inspector */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          {selectedScenario ? (
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Dictamen de Resiliencia ({selectedScenario.id})
                </h3>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Hipótesis de Falla</span>
                <p className="text-slate-800 font-medium">{selectedScenario.failureInjected}</p>
              </div>

              <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200 space-y-1">
                <span className="text-[10px] text-indigo-700 font-semibold uppercase">Mecanismo de Defensa Implementado</span>
                <p className="text-indigo-950 font-bold">{selectedScenario.recoveryStrategy}</p>
              </div>

              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 space-y-1">
                <span className="text-[10px] text-emerald-700 font-semibold uppercase">Evidencia de Aprobación</span>
                <p className="text-emerald-900 font-medium leading-relaxed">{selectedScenario.auditProof}</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">Selecciona un escenario de la lista para ver la evidencia.</p>
          )}
        </div>
      </div>
    </div>
  );
};
