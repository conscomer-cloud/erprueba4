/**
 * @license
 * CONSCORE ERP IA - FASE 14: AUTOMATIZACIÓN EMPRESARIAL + BPM + WORKFLOWS + RPA
 * Observability, Health Metrics & Dead Letter Queue (DLQ) Center
 */

import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Clock,
  Zap,
  Server,
  Database,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import {
  AutomationObservabilityMetrics,
  DeadLetterQueueItem,
} from '../../types/automationBpmTypes';
import { AutomationBpmEngine } from '../../services/automationBpmEngine';

interface AutomationObservabilityViewProps {
  metrics: AutomationObservabilityMetrics;
  dlqItems: DeadLetterQueueItem[];
  onRefresh: () => void;
}

export const AutomationObservabilityView: React.FC<AutomationObservabilityViewProps> = ({
  metrics,
  dlqItems,
  onRefresh,
}) => {
  const [selectedDlq, setSelectedDlq] = useState<DeadLetterQueueItem | null>(dlqItems[0] || null);
  const [reDriveMsg, setReDriveMsg] = useState<string | null>(null);

  const handleReDrive = (id: string) => {
    const res = AutomationBpmEngine.reDriveDeadLetterItem(id);
    setReDriveMsg(res.message);
    onRefresh();
    setTimeout(() => setReDriveMsg(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-100 text-indigo-800">
              Observabilidad & Telemetría
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
              Servicios saludables: {metrics.healthyServicesPct}%
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Salud del Motor, Latencias y Dead Letter Queue (DLQ)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoreo en tiempo real de rendimiento, latencias percentiles (P50, P95, P99), reintentos exponenciales y aislamiento de fallas.
          </p>
        </div>
      </div>

      {reDriveMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{reDriveMsg}</span>
          </div>
          <button onClick={() => setReDriveMsg(null)} className="text-emerald-700 font-bold">✕</button>
        </div>
      )}

      {/* Latency & Health Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Latencia P50 (Mediana)</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics.p50LatencyMs} ms</span>
            <span className="text-xs text-emerald-600 font-bold">Óptimo</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Tiempo promedio de evaluación de reglas</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Latencia P95</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics.p95LatencyMs} ms</span>
            <span className="text-xs text-indigo-600 font-bold">En Rango</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Incluyendo persistencia e idempotencia</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Latencia P99 (Cola)</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics.p99LatencyMs} ms</span>
            <span className="text-xs text-slate-500 font-medium">SLA &lt; 500ms</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Workflows con múltiples llamadas API</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Throughput Eventos</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics.throughputEventsPerMin} / min</span>
            <span className="text-xs text-emerald-600 font-bold">Capacidad 1000/s</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Total procesados: {(Number(metrics.totalEventsProcessed) || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Dead Letter Queue (DLQ) Inspector */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Dead Letter Queue (DLQ) & Aislamiento de Errores ({dlqItems.length} Registros)
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Política de 3 reintentos con backoff exponencial (1s, 2s, 4s)
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List of DLQ items */}
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {dlqItems.map((item) => {
              const isSelected = selectedDlq?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedDlq(item)}
                  className={`p-3 rounded-lg border transition cursor-pointer text-xs ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/60 ring-1 ring-indigo-200'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900">{item.id}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        item.resolutionStatus === 'MANUALLY_RESOLVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {item.resolutionStatus}
                    </span>
                  </div>

                  <p className="font-semibold text-slate-800 mt-1 truncate">
                    {item.workflowId}
                  </p>
                  <p className="text-[11px] text-rose-600 mt-0.5 truncate">
                    {item.errorReason}
                  </p>

                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-200/80 text-[10px] text-slate-400">
                    <span>Reintentos: {item.retryCount}</span>
                    <span>{new Date(item.failureTimestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DLQ Inspector & Re-Drive Button */}
          <div className="lg:col-span-2 bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
            {selectedDlq ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">Item ID & Master Trx</span>
                    <p className="font-mono font-bold text-slate-900">{selectedDlq.id} · {selectedDlq.correlationId}</p>
                  </div>

                  {selectedDlq.resolutionStatus === 'UNRESOLVED' ? (
                    <button
                      onClick={() => handleReDrive(selectedDlq.id)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition flex items-center gap-1.5 shadow-sm"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Re-Procesar (Re-Drive)
                    </button>
                  ) : (
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-800 font-bold rounded">
                      Resuelto Manualmente
                    </span>
                  )}
                </div>

                <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-rose-900 text-xs">
                  <p className="font-bold">Mensaje de Error:</p>
                  <p className="font-mono text-[11px] mt-0.5">{selectedDlq.errorReason}</p>
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Payload Aislado</span>
                  <pre className="p-2.5 bg-slate-900 text-indigo-200 rounded text-[11px] font-mono overflow-x-auto max-h-[140px]">
                    {JSON.stringify(selectedDlq.payload, null, 2)}
                  </pre>
                </div>

                {selectedDlq.resolutionNotes && (
                  <div className="p-2.5 bg-emerald-50 rounded border border-emerald-200 text-emerald-900 text-[11px]">
                    <strong>Nota de Resolución:</strong> {selectedDlq.resolutionNotes}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Selecciona un elemento de la lista para inspeccionar el stacktrace y re-procesar.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
