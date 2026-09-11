import React, { useState } from 'react';
import { api } from '../../services/apiClient';
import {
  Sparkles,
  Bot,
  Zap,
  CheckCircle2,
  XCircle,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Send,
  HelpCircle,
  Layers,
  DollarSign,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { AIMarketingProposal } from '../../types/erp';

export const AIMarketingAdvisor: React.FC = () => {
  const {
    aiMarketingProposals,
    authorizeAIMarketingProposal,
    rejectAIMarketingProposal,
    marketingCampaigns,
    marketingKPIs,
  } = useERP();
  const { can } = useAuth();

  const [aiQuestion, setAiQuestion] = useState('');
  const [aiChatHistory, setAiChatHistory] = useState<
    Array<{ sender: 'USER' | 'AI'; text: string; time: string }>
  >([
    {
      sender: 'AI',
      text: 'Hola. Soy CONSCORE AI Marketing Advisor. Analizo continuamente las campañas publicitarias, costos por lead (CPL), puntos de contacto (touchpoints) y la facturación real del CRM bajo la arquitectura DATO → ANÁLISIS → RECOMENDACIÓN. ¿Qué análisis deseas consultar hoy?',
      time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isAsking, setIsAsking] = useState(false);

  const fmtCurrency = (val: number) => `$${(val || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;

  const handleAskAI = async (promptText?: string) => {
    const query = promptText || aiQuestion;
    if (!query.trim() || isAsking) return;

    const userMsgTime = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    setAiChatHistory(prev => [...prev, { sender: 'USER', text: query, time: userMsgTime }]);
    setAiQuestion('');
    setIsAsking(true);

    try {
      const { reply: aiResponseText } = await api.askAI('Consulta de marketing, solo análisis: ' + query);
      const aiMsgTime = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
      setAiChatHistory(prev => [...prev, { sender: 'AI', text: aiResponseText, time: aiMsgTime }]);
    } catch (error) {
      setAiChatHistory(prev => [...prev, { sender: 'AI', text: error instanceof Error ? error.message : 'No fue posible consultar a la IA', time: new Date().toLocaleTimeString('es-MX') }]);
    } finally { setIsAsking(false); }
  };

  const handleAuthorize = (proposal: AIMarketingProposal) => {
    if (confirm(`¿Autorizar explícitamente la recomendación "${proposal.title}"?\n\nLa IA aplicará el cambio en el presupuesto o configuración de la campaña de inmediato con registro en la bitácora de auditoría.`)) {
      authorizeAIMarketingProposal(proposal.id);
    }
  };

  const handleReject = (proposal: AIMarketingProposal) => {
    const reason = prompt('Por favor ingresa el motivo del rechazo:') || 'Rechazado por criterio directivo.';
    rejectAIMarketingProposal(proposal.id, reason);
  };

  const pendingProposals = aiMarketingProposals.filter(p => p.status === 'PROPUESTA');
  const processedProposals = aiMarketingProposals.filter(p => p.status !== 'PROPUESTA');

  return (
    <div className="space-y-6">
      {/* Top Banner explaining DATO -> ANALISIS -> RECOMENDACION */}
      <div className="rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50 via-white to-amber-50/40 p-6 shadow-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md">
              <Bot className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-900">
                  Arquitectura Predictiva
                </span>
                <span className="text-xs font-semibold text-slate-500">CONSCORE AI Marketing Engine</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                Optimizador Algorítmico de Inversión y Retorno (ROAS)
              </h2>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Nuestra IA nunca realiza cambios automáticos sin supervisión. Cada sugerencia sigue la estructura
                rigurosa: <b className="text-slate-900">DATO</b> (hecho cuantificable del ERP) →{' '}
                <b className="text-slate-900">ANÁLISIS</b> (evaluación de impacto) →{' '}
                <b className="text-slate-900">RECOMENDACIÓN</b> (acción concreta que requiere tu autorización expresa).
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-100/60 p-4 text-center shrink-0">
            <span className="text-[10px] font-bold uppercase text-amber-800 block">Propuestas Pendientes</span>
            <span className="text-2xl font-black text-amber-950">{pendingProposals.length}</span>
            <span className="text-[11px] text-amber-800 block mt-0.5">Requieren tu aprobación</span>
          </div>
        </div>
      </div>

      {/* Proposals Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-600" />
            Recomendaciones Estratégicas Pendientes ({pendingProposals.length})
          </h3>
          <span className="text-xs text-slate-500 font-medium">Control de Aprobación Humana</span>
        </div>

        {pendingProposals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
            <h4 className="text-sm font-bold text-slate-800">Todas las propuestas han sido atendidas</h4>
            <p className="text-xs text-slate-500 mt-1">
              Las campañas actuales están operando dentro de los parámetros esperados de costo y rentabilidad.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingProposals.map(prop => (
              <div
                key={prop.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition hover:shadow-md"
              >
                {/* Header of proposal */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        prop.impactLevel === 'ALTO'
                          ? 'bg-red-100 text-red-800'
                          : prop.impactLevel === 'MEDIO'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      Impacto {prop.impactLevel || 'ALTO'}
                    </span>
                    <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                      {prop.category || prop.type}
                    </span>
                    <span className="font-mono text-xs font-bold text-blue-700">{prop.code || `IA-${prop.id.slice(-4)}`}</span>
                  </div>

                  <span className="text-xs text-slate-400 font-mono">Detectado: {prop.createdAt}</span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-3">{prop.title}</h3>

                {/* 3 Steps: DATO -> ANALISIS -> RECOMENDACION */}
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  {/* Step 1: DATO */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-slate-500 mb-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-slate-800 text-[10px]">
                        1
                      </span>
                      Dato Observado (ERP)
                    </div>
                    <p className="text-xs text-slate-800 leading-relaxed font-medium">{prop.dataObservation || prop.dataPoint}</p>
                  </div>

                  {/* Step 2: ANALISIS */}
                  <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-blue-700 mb-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-200 text-blue-900 text-[10px]">
                        2
                      </span>
                      Análisis Estratégico
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{prop.analysis}</p>
                  </div>

                  {/* Step 3: RECOMENDACION */}
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-emerald-800 mb-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-200 text-emerald-950 text-[10px]">
                        3
                      </span>
                      Recomendación Propuesta
                    </div>
                    <p className="text-xs font-bold text-emerald-950 leading-relaxed">{prop.recommendation}</p>
                  </div>
                </div>

                {/* Financial and expected impact */}
                <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Impacto Estimado</span>
                      <span className="font-bold text-slate-900">{prop.expectedImpact || prop.expectedOutcome}</span>
                    </div>
                    {prop.suggestedBudgetDelta !== 0 && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Delta Presupuestal</span>
                        <span
                          className={`font-mono font-bold ${
                            prop.suggestedBudgetDelta > 0 ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {prop.suggestedBudgetDelta > 0 ? '+' : ''}
                          {fmtCurrency(prop.suggestedBudgetDelta)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {can('MARKETING', 'EDITAR') && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReject(prop)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                      >
                        Rechazar
                      </button>
                      <button
                        onClick={() => handleAuthorize(prop)}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-xs"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        Autorizar Cambio
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History of Authorized / Rejected proposals */}
      {processedProposals.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <h3 className="text-xs font-bold uppercase text-slate-700 mb-3 flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-slate-400" />
            Historial de Recomendaciones Procesadas ({processedProposals.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                <tr>
                  <th className="py-2 px-3">Código</th>
                  <th className="py-2 px-3">Propuesta</th>
                  <th className="py-2 px-3">Categoría</th>
                  <th className="py-2 px-3 text-center">Estado</th>
                  <th className="py-2 px-3">Autorizado / Decidido Por</th>
                  <th className="py-2 px-3">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {processedProposals.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{p.code}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">{p.title}</td>
                    <td className="py-2.5 px-3 font-mono text-[10px]">{p.category}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          p.status === 'AUTORIZADO' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{p.authorizedByName || 'Dirección General'}</td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{p.authorizedAt || p.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Interactive AI Marketing Chat & Consultant */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Bot className="h-5 w-5 text-blue-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">Consultor Interactivo CONSCORE AI Marketing</h3>
            <p className="text-xs text-slate-500">
              Formula preguntas comerciales sobre CAC, CPL, ROAS o estrategia de medios industriales.
            </p>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            '¿Cuál es la campaña con mejor ROAS y cómo escalar su presupuesto?',
            '¿Por qué el CPL de LinkedIn es más alto que Google Ads?',
            '¿Qué modelo de atribución es más adecuado para nuestro ciclo B2B?',
            '¿Cómo reasignar $30,000 MXN para maximizar ventas el próximo mes?',
          ].map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleAskAI(q)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:border-blue-300 hover:bg-blue-50/60 transition"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Chat History Box */}
        <div className="mt-4 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
          {aiChatHistory.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'AI' && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white text-xs font-bold shadow-xs">
                  IA
                </div>
              )}
              <div
                className={`rounded-xl p-3.5 text-xs max-w-2xl leading-relaxed ${
                  msg.sender === 'USER'
                    ? 'bg-blue-600 text-white rounded-br-none shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-xs'
                }`}
              >
                <div className="whitespace-pre-line">{msg.text}</div>
                <div
                  className={`mt-1 text-[10px] ${
                    msg.sender === 'USER' ? 'text-blue-200 text-right' : 'text-slate-400'
                  }`}
                >
                  {msg.time}
                </div>
              </div>
            </div>
          ))}

          {isAsking && (
            <div className="flex items-center gap-2 text-xs text-amber-700 font-medium">
              <Sparkles className="h-4 w-4 animate-spin" />
              CONSCORE AI está analizando los registros del ERP...
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            placeholder="Pregunta a la IA sobre métricas, campañas o atribución..."
            value={aiQuestion}
            onChange={e => setAiQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAskAI()}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden"
          />
          <button
            onClick={() => handleAskAI()}
            disabled={isAsking || !aiQuestion.trim()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition shadow-xs"
          >
            <Send className="h-4 w-4" />
            Consultar
          </button>
        </div>
      </div>
    </div>
  );
};
