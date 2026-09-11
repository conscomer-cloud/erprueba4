import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { LogisticsIncident, LogisticsReturn } from '../../types/erp';
import { ProductReturnService, ReturnCertificationSuiteResult } from '../../services/productReturnService';
import {
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Package,
  Wrench,
  FileText,
  Clock,
  ArrowRight,
  ShieldAlert,
  Archive,
  RefreshCw,
  X,
  Play,
  Copy,
  Check,
  ShieldCheck
} from 'lucide-react';

export const IncidentsReturnsTab: React.FC = () => {
  const {
    logisticsIncidents,
    logisticsReturns,
    resolveLogisticsIncident,
    inspectAndReintegrateReturn,
    authorizeLogisticsReturn,
  } = useERP();

  const [activeTab, setActiveTab] = useState<'INCIDENTS' | 'RETURNS'>('RETURNS');

  // Modal for resolving incident
  const [resolvingIncident, setResolvingIncident] = useState<LogisticsIncident | null>(null);
  const [resolutionAction, setResolutionAction] = useState<LogisticsIncident['actionTaken']>('REPROGRAMAR_ENTREGA');
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Modal for inspecting return & reintegration
  const [inspectingReturn, setInspectingReturn] = useState<LogisticsReturn | null>(null);
  const [inspectionDisposition, setInspectionDisposition] = useState<'BUEN_ESTADO' | 'DANADO' | 'MERMA'>('BUEN_ESTADO');
  const [reintegratedQty, setReintegratedQty] = useState<number>(0);
  const [inspectionNotes, setInspectionNotes] = useState('');

  // Observation 15 E2E Certification Modal
  const [showCertModal, setShowCertModal] = useState(false);
  const [certResult, setCertResult] = useState<ReturnCertificationSuiteResult | null>(null);
  const [copiedReport, setCopiedReport] = useState(false);

  const runE2ECertification = () => {
    const result = ProductReturnService.runObservacion15Certification();
    setCertResult(result);
    setShowCertModal(true);
  };

  const handleCopyReport = () => {
    if (!certResult) return;
    navigator.clipboard.writeText(certResult.structuredReport);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  const openResolveModal = (inc: LogisticsIncident) => {
    setResolvingIncident(inc);
    setResolutionAction(inc.actionTaken || 'REPROGRAMAR_ENTREGA');
    setResolutionNotes(inc.resolutionNotes || '');
  };

  const handleConfirmResolveIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingIncident) return;
    resolveLogisticsIncident(resolvingIncident.id, resolutionAction, resolutionNotes.trim() || 'Incidencia atendida y resuelta.');
    setResolvingIncident(null);
  };

  const openInspectModal = (ret: LogisticsReturn) => {
    setInspectingReturn(ret);
    setInspectionDisposition('BUEN_ESTADO');
    setReintegratedQty(ret.items.reduce((sum, i) => sum + i.quantityReturned, 0));
    setInspectionNotes('');
  };

  const handleConfirmReintegration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectingReturn) return;
    inspectAndReintegrateReturn(
      inspectingReturn.id,
      inspectionDisposition,
      reintegratedQty,
      inspectionNotes.trim() || 'Inspección de calidad aprobada en almacén.'
    );
    setInspectingReturn(null);
  };

  return (
    <div className="space-y-4">
      {/* Tab Switcher & Certification CTA */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 border border-slate-200 shadow-2xs">
        <div className="flex rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => setActiveTab('RETURNS')}
            className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
              activeTab === 'RETURNS'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <RotateCcw className="h-4 w-4 text-amber-500" />
            Devoluciones & Reingresos ({logisticsReturns.length})
          </button>
          <button
            onClick={() => setActiveTab('INCIDENTS')}
            className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
              activeTab === 'INCIDENTS'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Incidencias Operativas ({logisticsIncidents.length})
          </button>
        </div>

        {/* Observation 15 Certification CTA Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={runE2ECertification}
            className="flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-800 transition-colors"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-200" />
            Validación E2E Devoluciones (Obs 15)
          </button>
        </div>
      </div>

      {/* Returns Table */}
      {activeTab === 'RETURNS' && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-600">
                  <th className="py-3 px-4">Folio Devolución</th>
                  <th className="py-3 px-3">Pedido / Cliente</th>
                  <th className="py-3 px-3">Motivo Reportado</th>
                  <th className="py-3 px-3">Materiales Retornados</th>
                  <th className="py-3 px-3">Estatus Inspección</th>
                  <th className="py-3 px-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logisticsReturns.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400 text-xs">
                      No hay devoluciones registradas.
                    </td>
                  </tr>
                ) : (
                  logisticsReturns.map((ret) => (
                    <tr key={ret.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {ret.folio || ret.returnNumber || ret.id}
                        <span className="text-[10px] text-slate-400 block font-normal">{ret.timestamp || ret.date}</span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-mono font-bold text-blue-700 block">{ret.orderNumber}</span>
                        <span className="font-semibold text-slate-800">{ret.customerName}</span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-slate-800 block text-[11px]">{ret.reasonSummary || ret.reason}</span>
                        <p className="text-[10px] text-slate-500 max-w-xs">{ret.comment}</p>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="space-y-0.5">
                          {ret.items.map((i, idx) => (
                            <div key={idx} className="text-[11px] text-slate-700">
                              • <b>{i.quantityReturned} {i.unit}</b> - {i.productName}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            ret.status === 'COMPLETADA' || ret.status === 'REINTEGRADO_INVENTARIO' || ret.status === 'REINGRESADA_INVENTARIO'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ret.status === 'RECHAZADA' || ret.status === 'RECHAZADO_MERMA'
                              ? 'bg-red-100 text-red-800'
                              : ret.status === 'AUTORIZADA'
                              ? 'bg-blue-100 text-blue-800'
                              : ret.status === 'PENDIENTE_AUTORIZACION' || ret.status === 'SOLICITADA'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ret.status === 'COMPLETADA' || ret.status === 'REINTEGRADO_INVENTARIO' || ret.status === 'REINGRESADA_INVENTARIO'
                            ? 'Reintegrado al Kardex'
                            : ret.status === 'RECHAZADA' || ret.status === 'RECHAZADO_MERMA'
                            ? 'Merma / Rechazado'
                            : ret.status === 'AUTORIZADA'
                            ? 'Autorizada (Lista p/ Recibir)'
                            : ret.status === 'PENDIENTE_AUTORIZACION' || ret.status === 'SOLICITADA'
                            ? 'Pendiente Autorización'
                            : 'En Inspección Almacén'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        {ret.status === 'PENDIENTE_AUTORIZACION' || ret.status === 'SOLICITADA' ? (
                          <button
                            onClick={() => authorizeLogisticsReturn(ret.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-blue-700"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Autorizar
                          </button>
                        ) : ret.status === 'PENDIENTE_INSPECCION' || ret.status === 'EN_INSPECCION' || ret.status === 'AUTORIZADA' || ret.status === 'PENDIENTE_ACEPTACION' ? (
                          <button
                            onClick={() => openInspectModal(ret)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700"
                          >
                            <Archive className="h-3.5 w-3.5" />
                            Aceptar & Reingresar
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-500">
                            Atendido por <b>{ret.inspectedByName || ret.inspectorName || 'Almacén'}</b>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Incidents Table */}
      {activeTab === 'INCIDENTS' && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-600">
                  <th className="py-3 px-4">Folio Incidencia</th>
                  <th className="py-3 px-3">Pedido / Ruta</th>
                  <th className="py-3 px-3">Cliente Afectado</th>
                  <th className="py-3 px-3">Tipo & Severidad</th>
                  <th className="py-3 px-3">Descripción</th>
                  <th className="py-3 px-3">Estatus</th>
                  <th className="py-3 px-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logisticsIncidents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                      No hay incidencias logísticas registradas.
                    </td>
                  </tr>
                ) : (
                  logisticsIncidents.map((inc) => (
                    <tr key={inc.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {inc.incidentNumber}
                        <span className="text-[10px] text-slate-400 block font-normal">{inc.timestamp}</span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-mono font-bold text-blue-700 block">{inc.orderNumber}</span>
                        <span className="text-[10px] text-slate-500 font-mono">Ruta: {inc.routeNumber}</span>
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-slate-900">
                        {inc.customerName}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-slate-800 block text-[11px]">{inc.type}</span>
                        <span
                          className={`inline-block rounded-full px-2 py-0.2 text-[9px] font-bold ${
                            inc.severity === 'CRITICA'
                              ? 'bg-red-100 text-red-800'
                              : inc.severity === 'ALTA'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {inc.severity}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 max-w-xs text-slate-600 text-[11px]">
                        <p className="line-clamp-2">{inc.description}</p>
                        {inc.resolutionNotes && (
                          <p className="text-[10px] text-emerald-700 mt-1 bg-emerald-50 p-1 rounded">
                            <b>Resolución:</b> {inc.resolutionNotes}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            inc.status === 'RESUELTA'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inc.status === 'EN_PROCESO'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {inc.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        {inc.status !== 'RESUELTA' ? (
                          <button
                            onClick={() => openResolveModal(inc)}
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-blue-700"
                          >
                            Resolver
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-700 font-bold flex items-center justify-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Atendida
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Resolve Incident */}
      {resolvingIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                Atender Incidencia · {resolvingIncident.incidentNumber}
              </h3>
              <button onClick={() => setResolvingIncident(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmResolveIncident} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-900">{resolvingIncident.type}</p>
                <p className="text-[11px] text-slate-600 mt-1">{resolvingIncident.description}</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                  Acción Correctiva Aplicada
                </label>
                <select
                  value={resolutionAction}
                  onChange={(e) => setResolutionAction(e.target.value as LogisticsIncident['actionTaken'])}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-900"
                >
                  <option value="REPROGRAMAR_ENTREGA">Reprogramar Entrega en Nueva Ruta</option>
                  <option value="GENERAR_DEVOLUCION">Generar Devolución Física a Almacén</option>
                  <option value="CAMBIO_UNIDAD">Cambio / Traspaso de Unidad de Transporte</option>
                  <option value="CANCELAR_PEDIDO">Cancelar Pedido y Liberar Reserva</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                  Notas de Cierre y Resolución
                </label>
                <textarea
                  required
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Explica qué acuerdo se tuvo con el cliente o qué acciones se ejecutaron..."
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setResolvingIncident(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700"
                >
                  Confirmar Resolución
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Inspect & Reintegrate Return */}
      {inspectingReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                Inspección de Calidad y Reingreso al Kardex
              </h3>
              <button onClick={() => setInspectingReturn(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReintegration} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Materiales a Inspeccionar</span>
                {inspectingReturn.items.map((itm, i) => (
                  <p key={i} className="font-bold text-slate-900 mt-1">
                    {itm.quantityReturned} {itm.unit} - {itm.productName} ({itm.productCode})
                  </p>
                ))}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                  Dictamen de Calidad
                </label>
                <select
                  value={inspectionDisposition}
                  onChange={(e) => setInspectionDisposition(e.target.value as any)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-900"
                >
                  <option value="BUEN_ESTADO">Aprobado / Buen Estado (Reintegrar a Stock Disponible)</option>
                  <option value="DANADO">Dañado / Cuarentena (Revisión técnica)</option>
                  <option value="MERMA">Merma Definitiva (Enviar a Desecho)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                  Cantidad Física Verificada y Aceptada
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  required
                  value={reintegratedQty}
                  onChange={(e) => setReintegratedQty(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                  Observaciones de Inspección
                </label>
                <textarea
                  rows={2}
                  value={inspectionNotes}
                  onChange={(e) => setInspectionNotes(e.target.value)}
                  placeholder="Ej. Cajas intactas con sello de fábrica. Se reubican en Rack R-02 Nivel 1."
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setInspectingReturn(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  Aprobar y Reingresar al Kardex
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Observation 15 E2E Certification Diagnostic Viewer */}
      {showCertModal && certResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    Certificación E2E de Devoluciones — Observación 15
                  </h3>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                    COMPLETADO A ESPERA DE REVISIÓN
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Prueba controlada SKU DEV-TEST-015 · Secuencia estricta de 9 etapas
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyReport}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs"
                >
                  {copiedReport ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  {copiedReport ? 'Copiado al Portapapeles' : 'Copiar Reporte'}
                </button>
                <button
                  onClick={() => setShowCertModal(false)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* Mandatory Matrix Table (Section 33) */}
              <div className="space-y-2">
                <h4 className="font-bold uppercase tracking-wider text-[11px] text-slate-700">
                  Matriz de Resultados Obligatoria (Evolución de Existencias & Kardex)
                </h4>
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-700">
                        <th className="py-2.5 px-3">Etapa</th>
                        <th className="py-2.5 px-3">Estado Devolución</th>
                        <th className="py-2.5 px-3">Stock Físico</th>
                        <th className="py-2.5 px-3">Kardex Entrada</th>
                        <th className="py-2.5 px-3">Delta</th>
                        <th className="py-2.5 px-3 text-center">Validación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {certResult.matrix.map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                          <td className="py-2 px-3 font-semibold text-slate-900">{row.etapa}</td>
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-700">{row.estadoDevolucion}</td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-900">{row.stock}</td>
                          <td className="py-2 px-3 font-mono text-slate-700">{row.kardexEntrada}</td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-600">
                            {row.delta > 0 ? `+${row.delta}` : `${row.delta}`}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                              <CheckCircle2 className="h-3.5 w-3.5" /> PASS
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 26 Assertions Checklist */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold uppercase tracking-wider text-[11px] text-slate-700">
                    Verificación de Criterios de Aceptación ({certResult.passedTests}/{certResult.totalTests} Aprobadas)
                  </h4>
                  <span className="text-[11px] font-semibold text-emerald-700">
                    Cero fallas críticas · Idempotencia estricta 100%
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {certResult.tests.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs"
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{t.name}</p>
                        <p className="text-[10px] text-slate-500 line-clamp-1">{t.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strict Terminal Report */}
              <div className="space-y-2">
                <h4 className="font-bold uppercase tracking-wider text-[11px] text-slate-700">
                  Reporte Final Obligatorio Formateado
                </h4>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-emerald-400 font-mono text-[11px] leading-relaxed overflow-x-auto whitespace-pre">
                  {certResult.structuredReport}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3">
              <div className="text-[11px] text-slate-500">
                Estado asignado: <b className="text-emerald-700">COMPLETADO A ESPERA DE REVISIÓN</b>
              </div>
              <button
                onClick={() => setShowCertModal(false)}
                className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 shadow-2xs"
              >
                Cerrar Visor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
