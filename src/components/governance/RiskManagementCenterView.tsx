/**
 * @license
 * CONSCORE ERP IA - Risk Management Center (ERM) View
 * FASE 13 - Gestión Empresarial de Riesgos (ERM), Matriz 5x5, Heatmap y Mitigaciones
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  Shield,
  Filter,
  Search,
  CheckCircle,
  Clock,
  Layers,
  ArrowRight,
  TrendingDown,
  DollarSign,
  Activity,
} from 'lucide-react';
import {
  EnterpriseRisk,
  RiskCategory,
  RiskSeverity,
} from '../../types/governanceRiskComplianceTypes';

interface RiskManagementCenterViewProps {
  risks: EnterpriseRisk[];
  onSelectRisk?: (risk: EnterpriseRisk) => void;
}

export const RiskManagementCenterView: React.FC<RiskManagementCenterViewProps> = ({
  risks,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('TODAS');
  const [selectedRiskModal, setSelectedRiskModal] = useState<EnterpriseRisk | null>(null);

  const categories: string[] = ['TODAS', ...Array.from(new Set<string>(risks.map((r) => r.category)))];

  const filteredRisks = risks.filter((r) => {
    const matchesSearch =
      (r.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.code || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.process || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'TODAS' || r.category === selectedCategory;
    const matchesSev =
      selectedSeverity === 'TODAS' || r.residualRiskSeverity === selectedSeverity;
    return matchesSearch && matchesCat && matchesSev;
  });

  const getHeatmapColor = (prob: number, imp: number) => {
    const score = prob * imp;
    if (score >= 16) return 'bg-red-600 text-white';
    if (score >= 10) return 'bg-amber-500 text-slate-950';
    if (score >= 5) return 'bg-yellow-300 text-slate-950';
    return 'bg-emerald-500 text-white';
  };

  const getSeverityBadge = (severity: RiskSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'HIGH':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
            Gestión Empresarial de Riesgos (Enterprise Risk Management - ERM)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Matriz integral de riesgos en 14 categorías corporativas, evaluación de severidad 5x5 y controles preventivos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-slate-100 border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-800">
            {risks.length} Riesgos en Registro
          </span>
          <span className="rounded-lg bg-red-50 border border-red-200 px-3 py-1.5 text-xs font-bold text-red-800">
            {risks.filter((r) => r.residualRiskSeverity === 'CRITICAL' || r.residualRiskSeverity === 'HIGH').length} Críticos / Altos
          </span>
        </div>
      </div>

      {/* 5x5 Heatmap Matrix Visualizer */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              Matriz de Riesgo 5×5 (Probabilidad vs Impacto)
            </h3>
            <p className="text-xs text-slate-500">
              Distribución de riesgos identificados con evaluación de impacto financiero y operativo.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          {/* Heatmap Grid */}
          <div className="space-y-2">
            <div className="text-center font-bold text-xs text-slate-500 uppercase tracking-wider mb-2">
              Probabilidad (1 a 5) vs Impacto (1 a 5)
            </div>
            <div className="grid grid-cols-5 gap-1.5 text-center font-mono text-xs">
              {[5, 4, 3, 2, 1].map((prob) => (
                <React.Fragment key={prob}>
                  {[1, 2, 3, 4, 5].map((imp) => {
                    const cellRisks = risks.filter(
                      (r) => r.probability === prob && r.impact === imp
                    );
                    return (
                      <div
                        key={`${prob}-${imp}`}
                        className={`h-12 rounded flex flex-col items-center justify-center font-bold transition-transform hover:scale-105 cursor-pointer ${getHeatmapColor(
                          prob,
                          imp
                        )}`}
                        title={`Probabilidad: ${prob} · Impacto: ${imp} · Score: ${prob * imp}`}
                      >
                        <span className="text-[10px] opacity-80">{prob * imp}</span>
                        {cellRisks.length > 0 && (
                          <span className="text-[11px] font-black bg-slate-950/50 text-white rounded-full px-1.5">
                            {cellRisks.length}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase pt-2">
              <span>Impacto 1 (Leve)</span>
              <span>Impacto 5 (Catastrófico)</span>
            </div>
          </div>

          {/* Legend & Summary */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Escala de Valoración del Riesgo
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded bg-red-600" />
                  <b>CRITICAL (16 – 25 pts)</b>
                </span>
                <span className="text-slate-500">Requiere plan de mitigación inmediato y supervisión de Consejo</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded bg-amber-500" />
                  <b>HIGH (10 – 15 pts)</b>
                </span>
                <span className="text-slate-500">Controles preventivos obligatorios y dueño asignado</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded bg-yellow-300 border border-slate-300" />
                  <b>MEDIUM (5 – 9 pts)</b>
                </span>
                <span className="text-slate-500">Monitoreo periódico en Comités de Operaciones</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded bg-emerald-500" />
                  <b>LOW (1 – 4 pts)</b>
                </span>
                <span className="text-slate-500">Riesgo tolerable bajo procedimientos regulares</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Registro Empresarial de Riesgos (Enterprise Risk Register) */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-600" />
              Registro Maestro de Riesgos (Risk Register)
            </h3>
            <p className="text-xs text-slate-500">
              Evaluación inherente vs residual con plan de mitigación y exposición financiera estimada.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar riesgo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-lg border border-slate-200 pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 w-44 sm:w-60"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRisks.map((risk) => (
            <div
              key={risk.id}
              onClick={() => setSelectedRiskModal(risk)}
              className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50/50 p-4 hover:bg-white hover:border-blue-300 hover:shadow-xs transition-all space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                  {risk.code}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getSeverityBadge(risk.residualRiskSeverity)}`}>
                  Residual: {risk.residualRiskSeverity} ({risk.residualRiskScore}/25)
                </span>
              </div>

              <h4 className="text-xs font-bold text-slate-900 line-clamp-2">
                {risk.name}
              </h4>

              <p className="text-[11px] text-slate-600 line-clamp-2">
                {risk.description}
              </p>

              <div className="pt-2 border-t border-slate-200/80 space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-500 text-[10px]">
                  <span>Proceso: <b>{risk.process}</b></span>
                  <span>Categoría: <b>{risk.category}</b></span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Exposición MXN:</span>
                  <b className="text-slate-900">${(Number(risk.estimatedFinancialExposureMXN) || 0).toLocaleString('es-MX')}</b>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Dueño: <b>{risk.ownerName}</b></span>
                  <span>Estado: <b className="text-blue-700">{risk.status}</b></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Detalle de Riesgo */}
      {selectedRiskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 max-w-2xl w-full shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                  {selectedRiskModal.code} · Categoría {selectedRiskModal.category}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {selectedRiskModal.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRiskModal(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">Descripción:</span>
                <p className="text-slate-600 leading-relaxed">{selectedRiskModal.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-red-50 rounded border border-red-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-red-900 block">
                    Riesgo Inherente (Sin Controles)
                  </span>
                  <div className="text-lg font-black text-red-950">
                    Score: {selectedRiskModal.inherentRiskScore}/25 ({selectedRiskModal.inherentRiskSeverity})
                  </div>
                  <div className="text-[10px] text-red-800">
                    Probabilidad: {selectedRiskModal.probability}/5 · Impacto: {selectedRiskModal.impact}/5
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 rounded border border-emerald-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-emerald-900 block">
                    Riesgo Residual (Con Controles)
                  </span>
                  <div className="text-lg font-black text-emerald-950">
                    Score: {selectedRiskModal.residualRiskScore}/25 ({selectedRiskModal.residualRiskSeverity})
                  </div>
                  <div className="text-[10px] text-emerald-800">
                    Probabilidad: {selectedRiskModal.residualProbability}/5 · Impacto: {selectedRiskModal.residualImpact}/5
                  </div>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-900 block mb-1">Controles Preventivos Establecidos:</span>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                  {selectedRiskModal.controls.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-blue-50 rounded border border-blue-200">
                <span className="font-bold text-blue-950 block mb-1">Plan de Mitigación:</span>
                <p className="text-blue-900">{selectedRiskModal.mitigation}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-100">
                <div>Dueño: <b>{selectedRiskModal.ownerName}</b></div>
                <div>Exposición MXN: <b>${(Number(selectedRiskModal.estimatedFinancialExposureMXN) || 0).toLocaleString('es-MX')}</b></div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedRiskModal(null)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
