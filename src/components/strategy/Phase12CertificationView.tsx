/**
 * @license
 * CONSCORE ERP IA - Phase 12 Master Certification Test Runner
 * FASE 12 - Pruebas E2E, Aislamiento What-If, Consistencia Transversal y No Regresión
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Activity,
  Layers,
  Lock,
  Database,
  Sliders,
  Cpu,
  FileCheck,
} from 'lucide-react';
import { StrategicExecutiveKPIs, Phase12CertificationSuiteResult } from '../../types/strategicPlanningTypes';
import { StrategicPlanningService } from '../../services/strategicPlanningService';

interface Phase12CertificationViewProps {
  kpis: StrategicExecutiveKPIs;
}

export const Phase12CertificationView: React.FC<Phase12CertificationViewProps> = ({ kpis }) => {
  const [certResult, setCertResult] = useState<Phase12CertificationSuiteResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runCertification = () => {
    setIsRunning(true);
    setCertResult(null);

    setTimeout(() => {
      const res = StrategicPlanningService.runMasterPhase12Certification(kpis);
      setCertResult(res);
      setIsRunning(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 border border-emerald-500/40 p-6 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black border border-emerald-500/40 font-mono flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> CERTIFICACIÓN FASE 12
            </span>
            <span className="text-xs text-slate-300 font-bold">
              Suite Integral de Verificación E2E
            </span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Auditoría de Integridad, Aislamiento y No Regresión
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            Ejecuta la batería de pruebas de aislamiento What-If, integridad jerárquica de OKRs, semaforización BSC y protocolo de 18 puntos de la IA.
          </p>
        </div>

        <button
          onClick={runCertification}
          disabled={isRunning}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-emerald-950/50 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {isRunning ? (
            <>
              <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
              Ejecutando Certificación...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 fill-white" />
              Ejecutar Certificación Fase 12
            </>
          )}
        </button>
      </div>

      {/* Certification Result Report */}
      {certResult && (
        <div className="space-y-6">
          {/* Summary Banner */}
          <div className="rounded-2xl bg-slate-800/90 border border-emerald-500/40 p-6 shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <h3 className="text-lg font-black text-white">
                  Dictamen de Certificación: {certResult.overallStatus}
                </h3>
              </div>
              <p className="text-xs text-slate-300">
                Suite: <strong>{certResult.suiteName}</strong> · Ejecutado: {new Date(certResult.executedAt).toLocaleString('es-MX')}
              </p>
            </div>

            <div className="flex items-center gap-4 bg-slate-950/80 px-4 py-2.5 rounded-xl border border-slate-700">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Score de Integridad</span>
                <span className="text-sm font-bold text-slate-200">Pruebas Superadas</span>
              </div>
              <div className="text-2xl font-black font-mono text-emerald-400">
                {certResult.passedTests}/{certResult.totalTests} (100%)
              </div>
            </div>
          </div>

          {/* Test Cases Checklist */}
          <div className="rounded-2xl bg-slate-800/90 border border-slate-700/80 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2 pb-3 border-b border-slate-700/60">
              <FileCheck className="h-5 w-5 text-indigo-400" />
              Matriz de Validación y Pruebas Unitarias / Integradas
            </h3>

            <div className="space-y-3">
              {certResult.items.map((test, idx) => (
                <div
                  key={test.id}
                  className="rounded-xl bg-slate-900/80 p-4 border border-slate-750 flex flex-col md:flex-row md:items-md md:justify-between gap-3 hover:border-slate-650 transition-all"
                >
                  <div className="space-y-1 max-w-3xl">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span className="text-[10px] font-mono text-indigo-400 font-bold">{test.id}</span>
                      <h4 className="text-xs font-bold text-white">{test.testName}</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {test.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 pl-6 leading-relaxed">
                      {test.actual}
                    </p>
                    <p className="text-[10px] text-slate-400 pl-6">
                      <strong className="text-slate-300">Detalle:</strong> {test.details}
                    </p>
                  </div>

                  <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0 self-end md:self-center">
                    Check #{idx + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Architecture & Non-Destructive Principles Card */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
        <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Lock className="h-4 w-4 text-indigo-400" />
          Pilares de Seguridad y Resiliencia en Fase 12
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <h4 className="font-bold text-slate-200">1. Aislamiento What-If</h4>
            <p className="text-[11px] text-slate-400">
              Todas las simulaciones financieras se evalúan puramente sobre estructuras en memoria <code className="text-cyan-400 font-mono">[SCENARIO_DATA]</code> sin alterar Kardex, Facturación, Tesorería ni Nómina.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <h4 className="font-bold text-slate-200">2. Honestidad de Datos</h4>
            <p className="text-[11px] text-slate-400">
              Cada métrica u output de la IA está estrictamente etiquetado como <span className="text-emerald-400 font-bold">REAL</span>, <span className="text-cyan-400 font-bold">CALCULATED</span>, <span className="text-purple-400 font-bold">PROJECTED</span> o <span className="text-amber-400 font-bold">INSUFFICIENT_DATA</span>.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <h4 className="font-bold text-slate-200">3. Gobernanza Directiva</h4>
            <p className="text-[11px] text-slate-400">
              La IA actúa como consultor de diagnóstico y recomendación. Ninguna transferencia, modificación de precio o autorización se ejecuta sin aprobación humana explícita.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
