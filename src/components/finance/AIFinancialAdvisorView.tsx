/**
 * @license
 * CONSCORE ERP IA - AI Financial Advisor & Period Closing Component
 * FASE 7: Asesor Financiero IA con Gobernanza y Cierre Contable con Bloqueos
 */

import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { AIFinancialInsight, PeriodClosing } from '../../types/erp';
import {
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Brain,
  Lightbulb,
  FileCheck,
  Calendar,
  Send,
  Loader2,
} from 'lucide-react';

export const AIFinancialAdvisorView: React.FC = () => {
  const {
    aiFinancialInsights,
    periodClosings,
    financialKPIs,
    askFinancialAI,
    closeAccountingPeriod,
    reopenAccountingPeriod,
  } = useERP();

  const [promptQuery, setPromptQuery] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [customAnswer, setCustomAnswer] = useState<string | null>(null);

  // Closing modal state
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closePeriodYear, setClosePeriodYear] = useState(2026);
  const [closePeriodMonth, setClosePeriodMonth] = useState(1);
  const [closeNotes, setCloseNotes] = useState('');

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptQuery.trim()) return;

    setIsAsking(true);
    try {
      const resp = await askFinancialAI(promptQuery);
      setCustomAnswer(resp);
    } finally {
      setIsAsking(false);
    }
  };

  const handleExecuteClose = (e: React.FormEvent) => {
    e.preventDefault();
    closeAccountingPeriod({
      year: closePeriodYear,
      month: closePeriodMonth,
      notes: closeNotes || 'Cierre mensual contable regular',
    });
    setShowCloseModal(false);
    setCloseNotes('');
  };

  return (
    <div className="space-y-6">

      {/* Governance & Safeguards Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-5 shadow-sm border border-slate-800 flex items-start gap-4">
        <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl shrink-0 mt-0.5 border border-blue-500/30">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div className="text-xs">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white">Gobernanza & Reglas de Integridad CONSCORE AI</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Gobernanza Activa
            </span>
          </div>
          <p className="text-slate-300 mt-1 leading-relaxed">
            El motor de Inteligencia Artificial actúa exclusivamente como <b>asesor analítico y consultivo</b>. 
            Tiene <b>estrictamente prohibido</b> realizar pagos automáticos, cancelar facturas, modificar saldos contables, 
            alterar cuentas bancarias o reabrir periodos históricos sin intervención y autorización expresa de Dirección.
          </p>
        </div>
      </div>

      {/* AI Interactive Advisor Chat / Query Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">Consultor Financiero CONSCORE AI</h3>
        </div>

        <form onSubmit={handleAskAI} className="flex gap-2">
          <input
            type="text"
            value={promptQuery}
            onChange={(e) => setPromptQuery(e.target.value)}
            placeholder="Pregunta a la IA (ej. ¿Cuál es el diagnóstico de capital de trabajo y qué proveedores podemos pagar hoy)..."
            className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isAsking}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {isAsking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Consultar
          </button>
        </form>

        {customAnswer && (
          <div className="mt-4 p-4 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-slate-800 leading-relaxed whitespace-pre-line animate-in fade-in">
            <div className="flex items-center gap-1.5 text-blue-900 font-bold mb-2">
              <Brain className="w-4 h-4 text-blue-600" />
              Respuesta del Asesor Financiero:
            </div>
            {customAnswer}
          </div>
        )}
      </div>

      {/* Active AI Insights Stream */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          Diagnósticos y Recomendaciones Financieras Proactivas
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {aiFinancialInsights.map((insight) => {
            const isHigh = insight.severity === 'ALTA';
            return (
              <div
                key={insight.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-blue-200 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        isHigh ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {insight.type.replace('_', ' ')} · {insight.severity}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Confianza: {Math.round(insight.confidence * 100)}%
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mt-2.5">{insight.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{insight.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 bg-slate-50/50 -mx-5 -mb-5 p-4 rounded-b-xl">
                  <span className="text-[10px] font-bold text-blue-800 uppercase block mb-1">
                    Acción Recomendada:
                  </span>
                  <p className="text-xs text-slate-700 font-medium">{insight.recommendation}</p>
                  {insight.potentialImpact && (
                    <div className="mt-2 text-[11px] text-emerald-700 font-semibold">
                      Impacto estimado: {insight.potentialImpact}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Accounting Period Closings & Locks */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-700" />
              Cierres Contables & Bloqueo de Periodos
            </h3>
            <p className="text-xs text-slate-500">
              Protección contra alteraciones en pólizas históricas una vez dictaminado el periodo
            </p>
          </div>

          <button
            onClick={() => setShowCloseModal(true)}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5" />
            Cerrar Periodo Contable
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                <th className="py-2.5 px-4">Periodo</th>
                <th className="py-2.5 px-4">Fecha de Cierre</th>
                <th className="py-2.5 px-4">Cerrado Por</th>
                <th className="py-2.5 px-4 text-right">Ingresos</th>
                <th className="py-2.5 px-4 text-right">Egresos</th>
                <th className="py-2.5 px-4 text-right">Resultado Neto</th>
                <th className="py-2.5 px-4 text-center">Estado</th>
                <th className="py-2.5 px-4 text-center">Bloqueo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {periodClosings.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-4 font-bold text-slate-900">{c.period}</td>
                  <td className="py-2.5 px-4 text-slate-600">{c.closedDate ? c.closedDate.slice(0, 10) : 'Pendiente'}</td>
                  <td className="py-2.5 px-4 text-slate-700">{c.closedBy || 'Sin cerrar'}</td>
                  <td className="py-2.5 px-4 text-right font-medium text-emerald-700">
                    ${(Number(c.totalIncome) || 0).toLocaleString('es-MX')}
                  </td>
                  <td className="py-2.5 px-4 text-right font-medium text-rose-700">
                    ${(Number(c.totalExpense) || 0).toLocaleString('es-MX')}
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                    ${(Number(c.netResult) || 0).toLocaleString('es-MX')}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.status === 'CERRADO' ? 'bg-slate-100 text-slate-800' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {c.isLocked ? (
                      <button
                        onClick={() => {
                          const reason = prompt('Motivo de reapertura justificada (requiere auditoría):');
                          if (reason) reopenAccountingPeriod(c.id, reason);
                        }}
                        className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded text-[10px] font-semibold flex items-center gap-1 mx-auto"
                        title="Reabrir con justificación"
                      >
                        <Unlock className="w-3 h-3" />
                        Reabrir
                      </button>
                    ) : (
                      <span className="text-[10px] text-emerald-600 font-medium">Abierto</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Period Close Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2">Cierre de Periodo Contable</h3>
            <p className="text-xs text-slate-500 mb-4">
              Al cerrar el periodo, se calcularán las pólizas de cierre y se activará el bloqueo contra modificaciones.
            </p>

            <form onSubmit={handleExecuteClose} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Año</label>
                  <input
                    type="number"
                    value={closePeriodYear}
                    onChange={(e) => setClosePeriodYear(parseInt(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Mes</label>
                  <select
                    value={closePeriodMonth}
                    onChange={(e) => setClosePeriodMonth(parseInt(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 font-bold"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                      <option key={m} value={m}>
                        Mes {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Notas de Auditoría / Dictamen</label>
                <input
                  type="text"
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder="Ej. Conciliación bancaria al 100% y pólizas de depreciación aplicadas"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-lg font-semibold shadow-xs"
                >
                  Confirmar y Bloquear Periodo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
