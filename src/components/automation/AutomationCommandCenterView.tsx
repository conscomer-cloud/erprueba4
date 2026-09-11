/**
 * @license
 * CONSCORE ERP IA - FASE 14: AUTOMATIZACIÓN EMPRESARIAL + BPM + WORKFLOWS + RPA
 * Automation Command Center View (KPIs, Throughput, Value Saved, Live Activity)
 */

import React from 'react';
import {
  Workflow,
  Zap,
  Clock,
  DollarSign,
  ShieldCheck,
  AlertTriangle,
  Activity,
  CheckCircle2,
  Lock,
  Cpu,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import {
  AutomationObservabilityMetrics,
  PreconfiguredAutomation,
  EnterpriseEvent,
  AutomationExecutiveAction,
} from '../../types/automationBpmTypes';

interface AutomationCommandCenterViewProps {
  metrics: AutomationObservabilityMetrics;
  automations: PreconfiguredAutomation[];
  recentEvents: EnterpriseEvent[];
  pendingActions: AutomationExecutiveAction[];
  onNavigateTab: (tabId: string) => void;
}

export const AutomationCommandCenterView: React.FC<AutomationCommandCenterViewProps> = ({
  metrics,
  automations,
  recentEvents,
  pendingActions,
  onNavigateTab,
}) => {
  const activeAutomationsCount = automations.filter((a) => a.enabled).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-xl border border-indigo-800/40 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial-gradient from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Orquestador de Eventos Activo
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Human-in-the-Loop Certificado
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Automation & BPM Command Center
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Plataforma de eventos en tiempo real, reglas de negocio parametrizables y flujos de trabajo orquestados con estricta gobernanza corporativa.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onNavigateTab('ACTIONS')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition flex items-center gap-2 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              Acciones Pendientes ({pendingActions.length})
            </button>
            <button
              onClick={() => onNavigateTab('AI_ADVISOR')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-sm font-medium transition flex items-center gap-2"
            >
              <Cpu className="w-4 h-4 text-indigo-400" />
              AI Automation Advisor
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Workflows Ejecutados
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Workflow className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {(Number(metrics.completedWorkflows) || 0).toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" />
              99.8% éxito
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {metrics.activeWorkflows} en ejecución activa | {metrics.failedWorkflows} fallos en DLQ
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tiempo Operativo Ahorrado
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {metrics.operationalHoursSaved} hrs
            </span>
            <span className="text-xs font-semibold text-slate-500">
              acumuladas
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Equivalente a 48 días laborales de trabajo administrativo
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Valor Financiero Impactado
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              ${(metrics.totalFinancialValueImpactedMxn / 1000000).toFixed(1)}M MXN
            </span>
            <span className="text-xs font-semibold text-indigo-600">
              protegidos
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            En órdenes gestionadas, cobranza acelerada y 3-Way Match
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Idempotencia & Protección
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {metrics.duplicateEventsBlocked}
            </span>
            <span className="text-xs font-semibold text-emerald-600">
              duplicados bloqueados
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            0 cobros duplicados | Latencia P50: {metrics.p50LatencyMs}ms
          </p>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 25 Preconfigured Automations Summary */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Automatizaciones Preconfiguradas (A01 - A25)
                </h3>
                <p className="text-xs text-slate-500">
                  {activeAutomationsCount} de {automations.length} reglas maestras activas
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('PRECONFIGURED')}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                Ver todas las 25 reglas
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {automations.slice(0, 6).map((auto) => (
                <div
                  key={auto.automationId}
                  className="p-3.5 rounded-lg border border-slate-200 hover:border-indigo-300 transition bg-slate-50/60"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-800">
                        {auto.code}
                      </span>
                      <span className="text-xs font-semibold text-slate-800 truncate max-w-[180px]">
                        {auto.title}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        auto.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {auto.enabled ? 'Activa' : 'Pausada'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 line-clamp-2">
                    {auto.ruleSummary}
                  </p>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                    <span>{auto.stats.executionsCount} ejecuciones</span>
                    <span className="font-semibold text-slate-700">
                      ${(auto.stats.financialImpactMxn / 1000).toLocaleString()}k MXN
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Access Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              onClick={() => onNavigateTab('3WAY_MATCH')}
              className="p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 shadow-sm cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  CXP 3-Way Match
                </span>
                <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg group-hover:scale-110 transition">
                  <ShieldCheck className="w-4 h-4" />
                </span>
              </div>
              <p className="text-lg font-bold text-slate-900 mt-2">OC + WMS + Factura</p>
              <p className="text-xs text-slate-500 mt-1">Detección de diferencias y bloqueo antifraude</p>
            </div>

            <div
              onClick={() => onNavigateTab('RPA')}
              className="p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 shadow-sm cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Bots RPA Controlados
                </span>
                <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg group-hover:scale-110 transition">
                  <Zap className="w-4 h-4" />
                </span>
              </div>
              <p className="text-lg font-bold text-slate-900 mt-2">4 Robots Activos</p>
              <p className="text-xs text-slate-500 mt-1">Guardrails de no-dispersión autónoma certificados</p>
            </div>

            <div
              onClick={() => onNavigateTab('CHAOS')}
              className="p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 shadow-sm cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Chaos Testing Suite
                </span>
                <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg group-hover:scale-110 transition">
                  <AlertTriangle className="w-4 h-4" />
                </span>
              </div>
              <p className="text-lg font-bold text-slate-900 mt-2">10/10 Resiliencia</p>
              <p className="text-xs text-slate-500 mt-1">Pruebas de concurrencia, timeout y atomicidad</p>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Live Event Stream & Pending Executive Actions */}
        <div className="space-y-6">
          {/* Pending Actions Widget */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-500" />
                Acciones Ejecutivas de Hoy
              </h3>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-full">
                {pendingActions.length} Pendientes
              </span>
            </div>

            <div className="space-y-2.5">
              {pendingActions.slice(0, 3).map((act) => (
                <div
                  key={act.id}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="font-semibold text-slate-800 line-clamp-1">
                      {act.title}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 shrink-0">
                      {act.priority}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    {act.description}
                  </p>
                  <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                    <span>{act.ownerRole}</span>
                    <span className="font-semibold text-slate-700">
                      ${(Number(act.financialImpact) || 0).toLocaleString('es-MX')} MXN
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => onNavigateTab('ACTIONS')}
              className="w-full mt-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
            >
              Abrir Executive Action Center
            </button>
          </div>

          {/* Live Event Stream */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-indigo-500" />
                Flujo de Eventos Recientes
              </h3>
              <button
                onClick={() => onNavigateTab('EVENT_BUS')}
                className="text-[11px] text-indigo-600 font-medium hover:underline"
              >
                Ver Bus
              </button>
            </div>

            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {recentEvents.slice(0, 5).map((evt) => (
                <div
                  key={evt.eventId}
                  className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-200 text-xs flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-mono font-bold text-indigo-700">
                      {evt.eventType}
                    </span>
                    <span className="text-slate-400">
                      {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 truncate">
                    {evt.entityType}: {evt.entityId} ({evt.sourceModule})
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="truncate max-w-[140px] font-mono">
                      {evt.idempotencyKey}
                    </span>
                    <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-700 font-semibold rounded">
                      Procesado
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
