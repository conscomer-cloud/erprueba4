/**
 * @license
 * CONSCORE ERP IA - Executive Early Warning Center View
 * Multi-Module Preventive Alert System with Financial Impact Analytics
 */

import React, { useState } from 'react';
import { EarlyWarningAlert, PredictiveRiskLevel } from '../../types/predictiveOperationsTypes';
import { PredictiveOperationsService } from '../../services/predictiveOperationsService';
import { DataClassificationBadge } from './DataClassificationBadge';
import {
  AlertTriangle,
  AlertOctagon,
  ShieldAlert,
  Calendar,
  User,
  CheckCircle2,
  Filter,
  DollarSign,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export const EarlyWarningCenterView: React.FC = () => {
  const [alerts, setAlerts] = useState<EarlyWarningAlert[]>(
    PredictiveOperationsService.getEarlyWarnings()
  );
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');

  const filteredAlerts = alerts.filter((a) => {
    const matchesModule = selectedModule === 'ALL' || a.MODULE === selectedModule;
    const matchesSeverity = selectedSeverity === 'ALL' || a.SEVERITY === selectedSeverity;
    return matchesModule && matchesSeverity;
  });

  const handleStatusChange = (
    alertId: string,
    newStatus: 'OPEN' | 'IN_REVIEW' | 'MITIGATED' | 'ESCALATED'
  ) => {
    PredictiveOperationsService.updateAlertStatus(alertId, newStatus);
    setAlerts(PredictiveOperationsService.getEarlyWarnings());
  };

  const formatMoney = (n: number) =>
    `$${(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;

  const totalAtRisk = alerts
    .filter((a) => a.STATUS === 'OPEN' || a.STATUS === 'IN_REVIEW')
    .reduce((acc, curr) => acc + curr.FINANCIAL_IMPACT, 0);

  const getSeverityBadge = (sev: PredictiveRiskLevel) => {
    switch (sev) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" /> CRÍTICA
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> ALTA
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <ShieldAlert className="w-3.5 h-3.5 text-blue-600" /> MEDIA
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-500" /> BAJA
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Executive Early Warning Center</h2>
            <DataClassificationBadge classification="PROJECTED" />
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Centro de alerta temprana multi-módulo con identificación de causa, impacto y cuantificación financiera.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-rose-50 border border-rose-200 px-4 py-2 rounded-lg text-center">
            <div className="text-xs font-semibold text-rose-700 uppercase">Monto Total en Riesgo</div>
            <div className="text-lg font-bold text-rose-900">{formatMoney(totalAtRisk)}</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 px-4 py-2 rounded-lg text-center">
            <div className="text-xs font-semibold text-purple-700 uppercase">Alertas Activas</div>
            <div className="text-lg font-bold text-purple-900">
              {alerts.filter((a) => a.STATUS === 'OPEN').length} / {alerts.length}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-600 uppercase mr-1">Módulo:</span>
          {['ALL', 'VENTAS', 'FINANZAS', 'INVENTARIO', 'OPERACION', 'CLIENTES'].map((mod) => (
            <button
              key={mod}
              onClick={() => setSelectedModule(mod)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                selectedModule === mod
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {mod === 'ALL' ? 'Todos' : mod}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600 uppercase">Severidad:</span>
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="text-xs font-semibold border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none"
          >
            <option value="ALL">Todas las Severidades</option>
            <option value="CRITICAL">Crítica</option>
            <option value="HIGH">Alta</option>
            <option value="MEDIUM">Media</option>
            <option value="LOW">Baja</option>
          </select>
        </div>
      </div>

      {/* Alerts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredAlerts.map((alert) => (
          <div
            key={alert.ALERT_ID}
            className={`bg-white rounded-xl border p-5 shadow-sm space-y-4 ${
              alert.SEVERITY === 'CRITICAL'
                ? 'border-rose-300 bg-rose-50/10'
                : alert.SEVERITY === 'HIGH'
                ? 'border-amber-300 bg-amber-50/10'
                : 'border-slate-200'
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    {alert.ALERT_ID}
                  </span>
                  <span className="text-xs font-bold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded">
                    {alert.MODULE}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base mt-1.5">{alert.ENTITY}</h3>
              </div>

              {getSeverityBadge(alert.SEVERITY)}
            </div>

            {/* Financial Impact & Confidence */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
              <div>
                <span className="text-slate-500 font-medium">Impacto Financiero:</span>
                <span className="font-mono font-bold text-slate-900 ml-1.5 text-sm">
                  {formatMoney(alert.FINANCIAL_IMPACT)}
                </span>
              </div>
              <div className="flex items-center gap-1 text-slate-600 font-semibold">
                <span>Confianza:</span>
                <span className="font-mono text-purple-700">{alert.CONFIDENCE}%</span>
              </div>
            </div>

            {/* Cause & Impact Breakdown */}
            <div className="space-y-2 text-xs">
              <div>
                <span className="font-bold text-slate-700">Causa Raíz:</span>
                <p className="text-slate-600 mt-0.5">{alert.CAUSE}</p>
              </div>
              <div>
                <span className="font-bold text-slate-700">Impacto Estimado:</span>
                <p className="text-slate-600 mt-0.5">{alert.IMPACT}</p>
              </div>
              <div className="bg-purple-50/60 p-2.5 rounded-lg border border-purple-100">
                <span className="font-bold text-purple-900">Recomendación Preventiva:</span>
                <p className="text-purple-800 mt-0.5">{alert.RECOMMENDATION}</p>
              </div>
            </div>

            {/* Owner & Status Actions */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="text-slate-500 space-y-0.5">
                <div className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  <span>{alert.OWNER}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Objetivo: {alert.TARGET_DATE}</span>
                </div>
              </div>

              {/* Status Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Estado:</span>
                <select
                  value={alert.STATUS}
                  onChange={(e) =>
                    handleStatusChange(
                      alert.ALERT_ID,
                      e.target.value as 'OPEN' | 'IN_REVIEW' | 'MITIGATED' | 'ESCALATED'
                    )
                  }
                  className="border border-slate-200 rounded px-2 py-1 bg-white font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="OPEN">ABIERTA</option>
                  <option value="IN_REVIEW">EN REVISIÓN</option>
                  <option value="MITIGATED">MITIGADA</option>
                  <option value="ESCALATED">ESCALADA</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
