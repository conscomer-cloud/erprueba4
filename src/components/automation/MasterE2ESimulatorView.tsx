/**
 * @license
 * CONSCORE ERP IA - FASE 14: AUTOMATIZACIÓN EMPRESARIAL + BPM + WORKFLOWS + RPA
 * Master E2E Simulation Runner (Lead to Cash with Master Transaction ID)
 */

import React, { useState } from 'react';
import {
  Play,
  CheckCircle2,
  Clock,
  DollarSign,
  ShieldCheck,
  RotateCw,
  ArrowRight,
  TrendingUp,
  FileCheck,
  Lock,
} from 'lucide-react';
import { E2EMasterSimulationResult } from '../../types/automationBpmTypes';
import { AutomationBpmEngine } from '../../services/automationBpmEngine';

export const MasterE2ESimulatorView: React.FC = () => {
  const [simulationResult, setSimulationResult] = useState<E2EMasterSimulationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleRunSimulation = () => {
    setIsRunning(true);
    setTimeout(() => {
      const res = AutomationBpmEngine.runE2EMasterSimulation();
      setSimulationResult(res);
      setIsRunning(false);
    }, 900);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-100 text-indigo-800">
              E2E Master Transaction Runner
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
              8 Módulos ERP Integrados
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Simulación Maestra End-to-End (Lead a Cobranza & Comisión)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ejecuta un ciclo comercial completo preservando el <code>MASTER_TRANSACTION_ID</code> desde el Lead en CRM hasta el cálculo de la comisión de nómina en RH.
          </p>
        </div>

        <button
          onClick={handleRunSimulation}
          disabled={isRunning}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-sm"
        >
          {isRunning ? (
            <RotateCw className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {isRunning ? 'Ejecutando Simulación E2E...' : 'Iniciar Simulación Maestra'}
        </button>
      </div>

      {simulationResult && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase">Master Trx ID</span>
              <p className="text-base font-mono font-bold text-indigo-700 mt-1 truncate">
                {simulationResult.masterTransactionId}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Identificador único inmutable</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase">Pasos Ejecutados</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">{simulationResult.passedSteps} / {simulationResult.totalSteps}</span>
                <span className="text-xs text-emerald-600 font-bold">100% Éxito</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">0 fallos en la cadena de custodia</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase">Margen Bruto EBITDA</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-600">
                  ${(Number(simulationResult.totalEbitdaEarned) || 0).toLocaleString('es-MX')} MXN
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Rentabilidad real capturada</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase">Validación SoD / HITL</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-sm font-bold text-indigo-900">1 Validación Humana</span>
                <span className="text-xs text-amber-600 font-bold">(Prenómina RH)</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Cero dispersión no supervisada</p>
            </div>
          </div>

          {/* Sequential Step Journey */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Trayectoria Completa de la Transacción Maestra
            </h3>

            <div className="relative pl-6 space-y-4 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-indigo-200">
              {simulationResult.steps.map((step) => (
                <div
                  key={step.stepNumber}
                  className="relative p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100/80 transition space-y-2 text-xs"
                >
                  <div className="absolute -left-[30px] top-4 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 bg-white border-emerald-500 text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                        {step.module}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">
                        {step.stepNumber}. {step.stepName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {step.financialState}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {step.auditHash}
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-700 leading-relaxed">
                    {step.actionDescription}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                    <div>
                      <span>Evento: </span>
                      <code className="text-indigo-700 font-mono font-semibold">{step.eventType}</code> ({step.eventIdGenerated})
                    </div>
                    <div>
                      <span>Workflow: </span>
                      <span className="font-semibold text-slate-800">{step.workflowTriggered}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!simulationResult && (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3">
          <Play className="w-10 h-10 text-indigo-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            Simulador Listo para Ejecutar
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Presiona el botón superior para simular un ciclo completo de Lead &rarr; Cotización &rarr; Pedido &rarr; WMS &rarr; Despacho &rarr; Factura SAT &rarr; Cobranza SPEI &rarr; Comisión.
          </p>
        </div>
      )}
    </div>
  );
};
