/**
 * @license
 * CONSCORE ERP IA - Phase 13 Certification View
 * FASE 13 - Suite de Certificación de 20 Pruebas y Aserción de No Regresión Fases 1 a 12
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Layers,
  Award,
  AlertCircle,
  FileCheck,
  Zap,
  Lock,
} from 'lucide-react';
import { GovernanceRiskComplianceService } from '../../services/governanceRiskComplianceService';
import { ERPContextType } from '../../context/ERPContext';
import { Phase13CertificationResult } from '../../types/governanceRiskComplianceTypes';

interface Phase13CertificationViewProps {
  erpContext: ERPContextType;
}

export const Phase13CertificationView: React.FC<Phase13CertificationViewProps> = ({
  erpContext,
}) => {
  const [certResult, setCertResult] = useState<Phase13CertificationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleRunCertification = () => {
    setIsRunning(true);
    setTimeout(() => {
      const res = GovernanceRiskComplianceService.runMasterPhase13Certification(erpContext);
      setCertResult(res);
      setIsRunning(false);
    }, 450);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Award className="h-6 w-6 text-emerald-600" />
            Suite de Certificación Oficial FASE 13 (20/20 Pruebas Maestras)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Batería de validación formal de Gobierno Corporativo, Facultades, SoD, ERM, Compliance, Auditoría y No Regresión (Fases 1–12).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunCertification}
            disabled={isRunning}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            {isRunning ? 'Ejecutando Suite...' : 'Ejecutar Certificación 20/20'}
          </button>
        </div>
      </div>

      {/* Certification Status Banner */}
      {certResult && (
        <div
          className={`rounded-xl border p-6 text-white shadow-lg transition-all ${
            certResult.failedTests === 0 && certResult.passedTests === certResult.totalTests && certResult.totalTests > 0
              ? 'bg-linear-to-r from-emerald-950 via-slate-900 to-emerald-900 border-emerald-500/40'
              : 'bg-linear-to-r from-red-950 via-slate-900 to-red-900 border-red-500/40'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 rounded bg-white/10 px-2.5 py-0.5 text-xs font-bold font-mono">
                {certResult.suiteName}
              </div>
              <h3 className="text-2xl font-black tracking-tight flex items-center gap-2">
                {certResult.failedTests === 0 && certResult.passedTests === certResult.totalTests && certResult.totalTests > 0 ? (
                  <>
                    <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                    CERTIFICACIÓN FASE 13: APROBADA AL 100%
                  </>
                ) : (
                  <>
                    <XCircle className="h-7 w-7 text-red-400" />
                    CERTIFICACIÓN INCOMPLETA
                  </>
                )}
              </h3>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                {certResult.overallStatus}
              </p>
            </div>

            <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl border border-white/15 shrink-0">
              <div className="text-center">
                <span className="text-3xl font-black text-emerald-300">
                  {certResult.passedTests} / {certResult.totalTests}
                </span>
                <span className="text-[10px] font-bold text-slate-300 block uppercase tracking-wider mt-0.5">
                  Pruebas Exitosas
                </span>
              </div>
              <div className="h-10 w-px bg-white/20" />
              <div className="text-center">
                <span className="text-3xl font-black text-emerald-300 font-mono">
                  {(certResult.totalTests ? 100 * certResult.passedTests / certResult.totalTests : 0).toFixed(1)}%
                </span>
                <span className="text-[10px] font-bold text-slate-300 block uppercase tracking-wider mt-0.5">
                  Conformidad
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 20 Test Checklist */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <FileCheck className="h-4 w-4 text-blue-600" />
          Desglose de las 20 Pruebas Obligatorias de FASE 13
        </h3>

        {!certResult && (
          <div className="py-12 text-center text-xs text-slate-400 space-y-3">
            <p>Haz clic en el botón superior para ejecutar la verificación formal de los 20 criterios de Gobierno Corporativo y Control Interno.</p>
            <button
              onClick={handleRunCertification}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 inline-flex items-center gap-1.5"
            >
              <Play className="h-3.5 w-3.5" /> Iniciar Verificación Automática
            </button>
          </div>
        )}

        {certResult && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {certResult.items.map((chk) => (
              <div
                key={chk.testNumber}
                className={`rounded-lg border p-3.5 space-y-1.5 transition-all ${
                  chk.status === 'PASS'
                    ? 'border-emerald-200 bg-emerald-50/40'
                    : 'border-red-200 bg-red-50/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                    Prueba #{chk.testNumber} · {chk.category}
                  </span>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded ${
                      chk.status === 'PASS'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-red-100 text-red-800 border border-red-300'
                    }`}
                  >
                    {chk.status}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-900">{chk.testName}</h4>
                <p className="text-[11px] text-slate-600 leading-snug">{chk.details}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
