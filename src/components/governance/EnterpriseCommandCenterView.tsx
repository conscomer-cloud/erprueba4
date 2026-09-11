/**
 * @license
 * CONSCORE ERP IA - Enterprise Command Center View
 * FASE 13 - Tablero Ejecutivo de Gobierno Corporativo, Salud Empresarial, Riesgos y Alertas
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Activity,
  CheckCircle2,
  Lock,
  TrendingUp,
  FileText,
  Users,
  Building2,
  DollarSign,
  Layers,
  ArrowUpRight,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldAlert,
  Sliders,
  Scale,
} from 'lucide-react';
import { ERPContextType } from '../../context/ERPContext';
import {
  EnterpriseHealthScoreReport,
  EnterpriseRisk,
  ExecutiveApprovalRequest,
  EnterpriseAlert,
  AnomalyDetectionResult,
} from '../../types/governanceRiskComplianceTypes';

interface EnterpriseCommandCenterViewProps {
  healthScore: EnterpriseHealthScoreReport;
  risks: EnterpriseRisk[];
  approvals: ExecutiveApprovalRequest[];
  alerts: EnterpriseAlert[];
  anomalies: AnomalyDetectionResult[];
  onNavigateTab: (tabKey: string) => void;
  onRefresh: () => void;
}

export const EnterpriseCommandCenterView: React.FC<EnterpriseCommandCenterViewProps> = ({
  healthScore,
  risks,
  approvals,
  alerts,
  anomalies,
  onNavigateTab,
  onRefresh,
}) => {
  const [selectedDimension, setSelectedDimension] = useState<string | null>(null);

  const pendingApprovals = approvals.filter((a) => a.decision === 'PENDING');
  const criticalAlerts = alerts.filter((a) => a.severity === 'CRITICAL' || a.severity === 'HIGH');
  const criticalRisks = risks.filter((r) => r.residualRiskSeverity === 'CRITICAL' || r.residualRiskSeverity === 'HIGH');

  const getStatusColor = (score: number) => {
    if (score >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 65) return 'text-blue-700 bg-blue-50 border-blue-200';
    if (score >= 50) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-red-700 bg-red-50 border-red-200';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 65) return 'bg-blue-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border border-slate-200 bg-linear-to-r from-slate-900 via-slate-800 to-blue-950 p-6 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-md bg-blue-500/20 px-2.5 py-1 text-xs font-bold text-blue-300 border border-blue-400/30">
              <ShieldCheck className="h-3.5 w-3.5" />
              GOBIERNO CORPORATIVO & CONTROL INTERNO TRANSVERSAL · FASE 13
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              Enterprise Command Center
            </h2>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              Supervisión en tiempo real de la salud corporativa, matriz de facultades, segregación de funciones (SoD), gestión integral de riesgos (ERM), compliance normativo y auditoría de extremo a extremo con MASTER_TRANSACTION_ID.
            </p>
          </div>

          {/* Health Score Main Dial */}
          <div className="flex items-center gap-5 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 shrink-0">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-slate-950/80 border-4 border-emerald-400 shadow-inner">
              <span className="text-2xl font-black text-white">{healthScore.overallScore}</span>
              <span className="absolute bottom-2 text-[9px] font-bold text-emerald-400 tracking-wider">/ 100</span>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Enterprise Health Score
              </div>
              <div className="inline-block rounded px-2 py-0.5 text-xs font-black bg-emerald-500/30 text-emerald-300 border border-emerald-400/40">
                ESTADO: {healthScore.overallStatus}
              </div>
              <div className="text-[11px] text-slate-300 font-mono">
                12 Dimensiones Ponderadas
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top 4 Real-time Executive Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigateTab('AUTHORITY_MATRIX')}
          className="cursor-pointer rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-400 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Aprobaciones Pendientes
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Lock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{pendingApprovals.length}</span>
            <span className="text-xs font-semibold text-amber-600">Requieren Dictamen</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 leading-snug">
            Matriz de facultades activa con doble firma para montos mayores.
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('RISK_MANAGEMENT')}
          className="cursor-pointer rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-400 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Riesgos Críticos / Altos
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{criticalRisks.length}</span>
            <span className="text-xs font-semibold text-slate-600">de {risks.length} Identificados</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 leading-snug">
            Matriz ERM 5x5 con evaluación inherente y residual.
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('ALERT_ENGINE')}
          className="cursor-pointer rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-400 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Alertas Empresariales
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{criticalAlerts.length}</span>
            <span className="text-xs font-semibold text-red-600">Prioridad Alta / Crítica</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 leading-snug">
            Monitoreo en Finanzas, Almacén, Ventas y Seguridad.
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('SOD_MANAGER')}
          className="cursor-pointer rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-400 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Segregación (SoD)
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Scale className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">100%</span>
            <span className="text-xs font-semibold text-emerald-700">Bloqueo Preventivo</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 leading-snug">
            Incompatibilidades de funciones blindadas en base de datos.
          </p>
        </div>
      </div>

      {/* 12-Pillar Enterprise Health Breakdown */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Matriz de las 12 Dimensiones del Enterprise Health Score
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Modelo ponderado con trazabilidad estricta a datos transaccionales certificados del ERP.
            </p>
          </div>
          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Recalcular Score
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {healthScore.dimensions.map((dim) => {
            const isSelected = selectedDimension === dim.dimensionKey;
            return (
              <div
                key={dim.dimensionKey}
                onClick={() => setSelectedDimension(isSelected ? null : dim.dimensionKey)}
                className={`cursor-pointer rounded-lg border p-4 transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/40 shadow-sm ring-1 ring-blue-500'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {dim.dimensionName}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded">
                    Peso: {dim.weightPct}%
                  </span>
                </div>

                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-xl font-black text-slate-900">{dim.score} / 100</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusColor(dim.score)}`}>
                    {dim.status}
                  </span>
                </div>

                <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${getProgressColor(dim.score)}`}
                    style={{ width: `${dim.score}%` }}
                  />
                </div>

                <p className="mt-2.5 text-[11px] text-slate-600 line-clamp-2 leading-snug">
                  {dim.explanation}
                </p>

                {isSelected && (
                  <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2 text-[11px]">
                    <div>
                      <span className="font-bold text-slate-700">Fuentes ERP:</span>{' '}
                      <span className="text-slate-600">{dim.dataSourcesUsed.join(', ')}</span>
                    </div>
                    <div>
                      <span className="font-bold text-emerald-700">Fortalezas:</span>{' '}
                      <span className="text-slate-600">{dim.positiveDrivers.join(' · ')}</span>
                    </div>
                    {dim.negativeDrivers.length > 0 && (
                      <div>
                        <span className="font-bold text-amber-700">Puntos de Atención:</span>{' '}
                        <span className="text-slate-600">{dim.negativeDrivers.join(' · ')}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Columns: Pending Critical Approvals & Active Anomalies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Approvals Widget */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-blue-600" />
                <h4 className="text-sm font-bold text-slate-900">
                  Solicitudes de Aprobación en Cola ({pendingApprovals.length})
                </h4>
              </div>
              <button
                onClick={() => onNavigateTab('AUTHORITY_MATRIX')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800"
              >
                Ver Matriz Completa →
              </button>
            </div>

            <div className="space-y-3">
              {pendingApprovals.map((req) => (
                <div
                  key={req.approvalId}
                  className="rounded-lg border border-slate-200 bg-slate-50/60 p-3.5 hover:bg-white transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-200 px-1.5 py-0.5 rounded">
                      {req.folio} · {req.entityType}
                    </span>
                    <span className="text-xs font-black text-blue-900">
                      {req.entityType === 'DESCUENTO_VENTA'
                        ? `${req.requestedAmount}% Descuento`
                        : `$${(Number(req.requestedAmount) || 0).toLocaleString('es-MX')} ${req.currency}`}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-700 font-medium">
                    {req.reason}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>Solicita: <b>{req.requesterName}</b> ({req.requesterRole})</span>
                    <span>Risk Score: {req.riskEvaluationScore}/25</span>
                  </div>
                </div>
              ))}
              {pendingApprovals.length === 0 && (
                <div className="py-6 text-center text-xs text-slate-400">
                  No hay solicitudes pendientes de autorización.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Anomalies Widget */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <h4 className="text-sm font-bold text-slate-900">
                  Comportamientos Atípicos & Desviaciones Estadísticas ({anomalies.length})
                </h4>
              </div>
              <button
                onClick={() => onNavigateTab('ANOMALY_DETECTION')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800"
              >
                Ver Análisis →
              </button>
            </div>

            <div className="space-y-3">
              {anomalies.slice(0, 3).map((anom) => (
                <div
                  key={anom.anomalyId}
                  className="rounded-lg border border-amber-200/80 bg-amber-50/40 p-3.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-950">
                      {anom.metricName}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                      {anom.severity} · {anom.domain}
                    </span>
                  </div>
                  <div className="mt-1.5 text-xs text-slate-700 grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Línea Base Histórica</span>
                      <b className="text-slate-800">{anom.historicalBaseline}</b>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Valor Observado</span>
                      <b className="text-red-700">{anom.currentObservedValue}</b>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-600 italic">
                    "{anom.diagnosticNote}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
