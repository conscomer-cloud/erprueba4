/**
 * @license
 * CONSCORE ERP IA - CONSCORE AI Risk Advisor View
 * FASE 13 - Asesor Consultivo de Riesgos con Protocolo de 18 Puntos y Honestidad de Datos
 */

import React, { useState } from 'react';
import {
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  FileCheck2,
  Lock,
  Send,
  HelpCircle,
  CheckCircle,
  Info,
  Scale,
  DollarSign,
  TrendingDown,
  Layers,
  Bot,
  UserCheck,
} from 'lucide-react';
import {
  AIRiskAdvisorResponse,
  EnterpriseRisk,
  EnterpriseHealthScoreReport,
  ComplianceObligation,
  CorporatePolicy,
} from '../../types/governanceRiskComplianceTypes';
import { GovernanceRiskComplianceService } from '../../services/governanceRiskComplianceService';
import { useERP } from '../../context/ERPContext';

interface AIRiskAdvisorViewProps {
  risks: EnterpriseRisk[];
  healthScore: EnterpriseHealthScoreReport;
  obligations: ComplianceObligation[];
  policies: CorporatePolicy[];
}

export const AIRiskAdvisorView: React.FC<AIRiskAdvisorViewProps> = ({
  risks,
  healthScore,
  obligations,
  policies,
}) => {
  const erpContext = useERP();
  const [queryInput, setQueryInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [advisorResponse, setAdvisorResponse] = useState<AIRiskAdvisorResponse | null>(null);

  const samplePrompts = [
    '¿Cuál es la exposición financiera agregada de los riesgos críticos y qué controles faltan?',
    'Evaluar impacto de otorgar 12% de descuento en cotizaciones y validación de facultades',
    'Auditoría preventiva de cumplimiento fiscal SAT y obligaciones laborales STPS',
    'Revisar si existen posibles conflictos de segregación de funciones (SoD) en compras',
  ];

  const handleRunAdvisorQuery = (queryText: string) => {
    setIsLoading(true);
    setTimeout(() => {
      const resp = GovernanceRiskComplianceService.queryAIRiskAdvisor(
        queryText,
        erpContext,
        risks,
        obligations
      );
      setAdvisorResponse(resp);
      setIsLoading(false);
    }, 400);
  };

  const getHonestyBadge = (cls: string) => {
    switch (cls) {
      case 'REAL':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'CALCULATED':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'PROJECTED':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      default:
        return 'bg-amber-100 text-amber-900 border-amber-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Bot className="h-6 w-6 text-purple-600" />
            CONSCORE AI Risk Advisor · Asesor Consultivo Estratégico
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Motor analítico con protocolo riguroso de 18 puntos de control y honestidad de datos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-purple-50 border border-purple-200 px-3 py-1.5 text-xs font-bold text-purple-800 flex items-center gap-1.5">
            <Lock className="h-4 w-4" /> Bloqueo Autónomo 100%
          </span>
          <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-800 flex items-center gap-1.5">
            <UserCheck className="h-4 w-4" /> Human-in-the-Loop
          </span>
        </div>
      </div>

      {/* Guardrails Banner */}
      <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-4 text-xs text-purple-950 flex items-start gap-3">
        <Scale className="h-5 w-5 text-purple-700 shrink-0 mt-0.5" />
        <div>
          <b className="font-bold block text-sm text-purple-900">
            Regla de Salvaguarda FASE 13: Capacidad Consultiva Exclusiva
          </b>
          <p className="mt-1 text-purple-800 leading-relaxed">
            CONSCORE AI Risk Advisor emite dictámenes orientativos y diagnósticos cuantitativos. <b>NO tiene facultades de auto-ejecución ni aprobación unilateral</b> en base de datos. Toda recomendación sensible concluye obligatoriamente con el protocolo: <code className="bg-purple-200 text-purple-900 px-1 rounded font-bold">REQUIERE VALIDACIÓN HUMANA</code>.
          </p>
        </div>
      </div>

      {/* Interactive AI Query Box */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          Consulta al Asesor de Riesgos & Gobierno Corporativo:
        </label>

        <div className="flex gap-2">
          <input
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && queryInput.trim()) {
                handleRunAdvisorQuery(queryInput);
              }
            }}
            placeholder="Escribe tu consulta ejecutiva sobre riesgos, facultades, cumplimiento o auditoría..."
            className="flex-1 rounded-lg border border-slate-300 p-3 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={() => {
              if (queryInput.trim()) handleRunAdvisorQuery(queryInput);
            }}
            disabled={isLoading || !queryInput.trim()}
            className="rounded-lg bg-purple-700 px-5 py-3 text-xs font-bold text-white hover:bg-purple-800 disabled:opacity-50 flex items-center gap-2 shadow-xs"
          >
            <Send className="h-4 w-4" />
            {isLoading ? 'Analizando...' : 'Consultar'}
          </button>
        </div>

        {/* Quick Prompts */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Consultas Recomendadas:</span>
          <div className="flex flex-wrap gap-2">
            {samplePrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => {
                  setQueryInput(p);
                  handleRunAdvisorQuery(p);
                }}
                className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-700 hover:bg-purple-50 hover:text-purple-900 hover:border-purple-200 transition-colors text-left"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Protocol Response Display */}
      {advisorResponse && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-md space-y-6">
          {/* Response Title & Classification */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="font-mono text-xs font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded">
                Protocolo 18 Puntos · Consulta Ejecutiva
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-1">
                Dictamen Técnico del AI Risk Advisor
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded border ${getHonestyBadge(
                  advisorResponse.dataHonestyClassification
                )}`}
              >
                HONESTIDAD DE DATOS: {advisorResponse.dataHonestyClassification}
              </span>
            </div>
          </div>

          {/* Core Response Narrative */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
            {advisorResponse.responseNarrative}
          </div>

          {/* Structured Points */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Impact & Drivers */}
            <div className="rounded-lg border border-slate-200 p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                Impacto Cuantitativo & Drivers
              </h4>
              <div className="space-y-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Impacto Financiero Estimado</span>
                  <b className="text-slate-900">{advisorResponse.estimatedFinancialImpact}</b>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Métricas y Drivers Afectados</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {advisorResponse.affectedDrivers.map((d, i) => (
                      <span key={i} className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded font-mono">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Mitigations & Actions */}
            <div className="rounded-lg border border-slate-200 p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                Mitigación & Recomendaciones
              </h4>
              <div className="space-y-1.5 text-xs text-slate-700">
                <span className="font-bold text-slate-900 block text-[11px]">Acciones Clave Recomendadas:</span>
                <ul className="list-disc pl-4 space-y-1">
                  {advisorResponse.suggestedMitigations.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Guardrail Footer Mandatory Statement */}
          <div className="rounded-lg border-2 border-dashed border-red-300 bg-red-50/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="font-mono font-black text-red-900 uppercase tracking-wider block">
                {advisorResponse.governanceGuardrail}
              </span>
              <p className="text-red-800 text-[11px]">
                Este análisis no sustituye la deliberación de los comités estatutarios ni la autorización de facultades de Dirección General.
              </p>
            </div>
            <div className="shrink-0 text-right">
              <span className="text-[10px] font-bold text-slate-500 font-mono block">
                Audit Token: {advisorResponse.auditTraceId}
              </span>
              <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                Bloqueo Autónomo: ACTIVO
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
