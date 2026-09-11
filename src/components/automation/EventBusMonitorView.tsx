/**
 * @license
 * CONSCORE ERP IA - FASE 14: AUTOMATIZACIÓN EMPRESARIAL + BPM + WORKFLOWS + RPA
 * Event Bus Monitor & Idempotency Inspector
 */

import React, { useState } from 'react';
import {
  Activity,
  Search,
  Filter,
  ShieldCheck,
  Zap,
  Play,
  RotateCw,
  Code,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { EnterpriseEvent, EnterpriseEventType } from '../../types/automationBpmTypes';
import { AutomationBpmEngine } from '../../services/automationBpmEngine';

interface EventBusMonitorViewProps {
  events: EnterpriseEvent[];
  onRefresh: () => void;
}

export const EventBusMonitorView: React.FC<EventBusMonitorViewProps> = ({
  events,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState<string>('TODOS');
  const [selectedEvent, setSelectedEvent] = useState<EnterpriseEvent | null>(events[0] || null);

  // Manual event dispatcher state
  const [newEventType, setNewEventType] = useState<EnterpriseEventType>('QUOTE_CREATED');
  const [newModule, setNewModule] = useState<string>('VENTAS');
  const [newEntityId, setNewEntityId] = useState<string>('COT-2026-999');
  const [newPayload, setNewPayload] = useState<string>(
    JSON.stringify({ total: 180000, marginPct: 21.0, customerId: 'CUST-089' }, null, 2)
  );
  const [idempotencyKey, setIdempotencyKey] = useState<string>(`IDEMP-${Date.now()}`);
  const [emitStatus, setEmitStatus] = useState<string | null>(null);

  const filteredEvents = events.filter((e) => {
    const matchesModule = filterModule === 'TODOS' || e.sourceModule === filterModule;
    const matchesSearch =
      (e.eventType || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.eventId || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.idempotencyKey || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.entityId || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesModule && matchesSearch;
  });

  const handleEmitManualEvent = () => {
    try {
      const parsedPayload = JSON.parse(newPayload);
      const res = AutomationBpmEngine.emitEvent({
        eventType: newEventType,
        sourceModule: newModule,
        entityType: newEventType.split('_')[0],
        entityId: newEntityId,
        userId: 'USR-ADMIN-01',
        severity: 'INFO',
        payload: parsedPayload,
        idempotencyKey,
        correlationId: `CORR-${Date.now().toString(36).toUpperCase()}`,
        masterTransactionId: `TRX-${Date.now().toString(36).toUpperCase()}`,
        securityHash: `SHA256-${Date.now()}`,
      });

      if (res.blockedAsDuplicate) {
        setEmitStatus(`⚠️ Evento bloqueado como duplicado por Idempotency Key (${idempotencyKey})`);
      } else {
        setEmitStatus(`✅ Evento ${res.event.eventId} emitido exitosamente. Reglas disparadas: ${res.rulesTriggered.length}`);
        // Reset key for next test
        setIdempotencyKey(`IDEMP-${Date.now()}`);
      }
      onRefresh();
      setTimeout(() => setEmitStatus(null), 6000);
    } catch (err: any) {
      alert(`Error en formato JSON del payload: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-100 text-indigo-800">
              Enterprise Event Bus
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
              Total Eventos: {(Number(events.length) || 0).toLocaleString()}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Monitor del Bus de Eventos & Idempotencia
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro unificado de eventos de dominio con trazabilidad de payload, correlationId y deduplicación atómica.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
        >
          <RotateCw className="w-3.5 h-3.5" />
          Actualizar Flujo
        </button>
      </div>

      {emitStatus && (
        <div className={`p-3.5 rounded-lg border text-xs font-medium ${
          emitStatus.startsWith('✅')
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          {emitStatus}
        </div>
      )}

      {/* Main Grid: Left Event Stream (2 cols), Right Inspector / Dispatcher (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Stream List */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por Event ID, tipo, entidad o idempotency key..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
              className="text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none"
            >
              <option value="TODOS">Todos los Módulos</option>
              <option value="CRM">CRM</option>
              <option value="VENTAS">Ventas</option>
              <option value="INVENTARIOS">Inventarios / WMS</option>
              <option value="FINANZAS">Finanzas</option>
              <option value="CXP">CXP</option>
              <option value="CXC">CXC</option>
              <option value="RH">RH</option>
              <option value="CALIDAD">Calidad</option>
            </select>
          </div>

          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
            {filteredEvents.map((evt) => {
              const isSelected = selectedEvent?.eventId === evt.eventId;
              return (
                <div
                  key={evt.eventId}
                  onClick={() => setSelectedEvent(evt)}
                  className={`p-3.5 rounded-lg border transition cursor-pointer text-xs ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/60 ring-1 ring-indigo-200'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded text-[11px]">
                        {evt.eventType}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-semibold">
                        {evt.sourceModule}
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-400">
                      {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-2 text-slate-700">
                    <span className="font-medium">
                      {evt.entityType}: <strong className="text-slate-900">{evt.entityId}</strong>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Trx: {evt.masterTransactionId?.substring(0, 14)}...
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-200/80 text-[10px] text-slate-400">
                    <span className="font-mono truncate max-w-[200px]">
                      Key: {evt.idempotencyKey}
                    </span>
                    <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 font-semibold rounded">
                      Procesado
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Inspector & Manual Event Dispatcher */}
        <div className="space-y-6">
          {/* Event Inspector */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Code className="w-4 h-4 text-indigo-500" />
              Inspector de Evento Seleccionado
            </h4>

            {selectedEvent ? (
              <div className="space-y-2.5 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">ID & Timestamp</span>
                  <p className="font-mono font-bold text-slate-800">{selectedEvent.eventId}</p>
                  <p className="text-[11px] text-slate-500">{new Date(selectedEvent.timestamp).toLocaleString()}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded border border-slate-200 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Master Trx ID</span>
                    <span className="font-mono text-indigo-700 font-semibold truncate block">{selectedEvent.masterTransactionId}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Correlation ID</span>
                    <span className="font-mono text-slate-700 font-semibold truncate block">{selectedEvent.correlationId}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Payload (JSON Inmutable)</span>
                  <pre className="p-2.5 bg-slate-900 text-indigo-200 rounded text-[11px] font-mono overflow-x-auto max-h-[160px]">
                    {JSON.stringify(selectedEvent.payload, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Selecciona un evento para ver detalles.</p>
            )}
          </div>

          {/* Emit Manual Event Form */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              Emitir Evento de Prueba
            </h4>

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-[10px] font-semibold text-slate-400">Tipo de Evento</label>
                <select
                  value={newEventType}
                  onChange={(e) => setNewEventType(e.target.value as EnterpriseEventType)}
                  className="w-full mt-0.5 p-2 bg-slate-50 border border-slate-300 rounded text-xs"
                >
                  <option value="QUOTE_CREATED">QUOTE_CREATED</option>
                  <option value="QUOTE_ACCEPTED">QUOTE_ACCEPTED</option>
                  <option value="ORDER_CREDIT_BLOCKED">ORDER_CREDIT_BLOCKED</option>
                  <option value="STOCK_LOW">STOCK_LOW</option>
                  <option value="INVOICE_ISSUED">INVOICE_ISSUED</option>
                  <option value="PAYMENT_RECEIVED">PAYMENT_RECEIVED</option>
                  <option value="THREE_WAY_MATCH_DISCREPANCY">THREE_WAY_MATCH_DISCREPANCY</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400">Idempotency Key (Prueba de Deduplicación)</label>
                <input
                  type="text"
                  value={idempotencyKey}
                  onChange={(e) => setIdempotencyKey(e.target.value)}
                  className="w-full mt-0.5 p-2 bg-slate-50 border border-slate-300 rounded text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400">Payload JSON</label>
                <textarea
                  value={newPayload}
                  onChange={(e) => setNewPayload(e.target.value)}
                  rows={3}
                  className="w-full mt-0.5 p-2 bg-slate-900 text-emerald-400 rounded text-xs font-mono"
                />
              </div>

              <button
                onClick={handleEmitManualEvent}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Play className="w-3.5 h-3.5" />
                Emitir Evento al Bus
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
