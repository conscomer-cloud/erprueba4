import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  HelpCircle,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Package,
  Layers,
  Clock,
  ArrowRight,
  UserCheck,
  Lock,
  Flame,
  Target,
  FileText,
  BadgePercent,
  Calculator,
  Database,
} from 'lucide-react';
import {
  ExecutiveAdvisorPromptSuggestion,
  ExecutiveAdvisorResponse,
  ExecutiveKpiSummary,
  BusinessHealthScoreData,
} from '../../types/erp';
import { ExecutiveIntelligenceService } from '../../services/executiveIntelligenceService';

interface ConsCoreAICEOAdvisorProps {
  kpis: ExecutiveKpiSummary;
  health: BusinessHealthScoreData;
}

export const ConsCoreAICEOAdvisor: React.FC<ConsCoreAICEOAdvisorProps> = ({ kpis, health }) => {
  const [customQuestion, setCustomQuestion] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState<string>('¿Cómo está la empresa?');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [isThinking, setIsThinking] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<ExecutiveAdvisorResponse | null>(() =>
    ExecutiveIntelligenceService.queryExecutiveAdvisor(kpis, health, '¿Cómo está la empresa?')
  );

  const predefinedPrompts: ExecutiveAdvisorPromptSuggestion[] = [
    // 1. Visión General
    {
      id: 'p1',
      category: 'ESTADO_GENERAL',
      question: '¿Cómo está la empresa?',
      description: 'Diagnóstico holístico de salud financiera, cumplimiento de metas, liquidez y márgenes.',
    },
    {
      id: 'p2',
      category: 'ESTADO_GENERAL',
      question: '¿Estamos creciendo?',
      description: 'Análisis comparativo YoY de facturación, retención neta (NDR) y ticket promedio.',
    },
    {
      id: 'p3',
      category: 'RENTABILIDAD',
      question: '¿Dónde estamos perdiendo dinero?',
      description: 'Audita márgenes diluidos, descuentos excesivos, fletes no cobrados y costos ocultos.',
    },
    {
      id: 'p4',
      category: 'RENTABILIDAD',
      question: '¿Cuál es nuestro producto más rentable?',
      description: 'Identifica el SKU con mayor margen bruto y contribución neta en pesos.',
    },
    {
      id: 'p5',
      category: 'CLIENTES',
      question: '¿Cuál es nuestro cliente más rentable?',
      description: 'Ranking de cuentas por utilidad neta generada, volumen y puntualidad de pago (DSO).',
    },
    {
      id: 'p6',
      category: 'EQUIPO_COMERCIAL',
      question: '¿Qué vendedor genera más utilidad?',
      description: 'Compara margen de contribución real vs volumen bruto y descuentos por ejecutivo.',
    },
    {
      id: 'p7',
      category: 'EQUIPO_COMERCIAL',
      question: '¿Qué vendedor vende mucho pero deja poco margen?',
      description: 'Detecta ejecutivos comerciales con alta facturación basada en descuentos no autorizados.',
    },
    {
      id: 'p8',
      category: 'CLIENTES',
      question: '¿Qué clientes están en riesgo?',
      description: 'Cuentas con retraso en compras, atraso crediticio o reducción en frecuencia de pedido.',
    },
    {
      id: 'p9',
      category: 'CARTERA',
      question: '¿Dónde está concentrada nuestra cartera vencida?',
      description: 'Estratificación de cuentas por cobrar por tramos de vencimiento (>30, >60, >90 días).',
    },
    {
      id: 'p10',
      category: 'TESORERIA',
      question: '¿Cuánto efectivo tendremos en 30 días?',
      description: 'Proyección predictiva de flujo de caja considerando cobranza esperada, CXP y nómina.',
    },
    {
      id: 'p11',
      category: 'INVENTARIOS',
      question: '¿Qué productos debo comprar?',
      description: 'Sugerencias de reabastecimiento basadas en punto de reorden y velocidad de rotación.',
    },
    {
      id: 'p12',
      category: 'INVENTARIOS',
      question: '¿Qué productos están inmovilizando capital?',
      description: 'SKUs de baja rotación o descontinuados que absorben capital de trabajo en bodega.',
    },
    {
      id: 'p13',
      category: 'MARKETING',
      question: '¿Qué campañas generan dinero real?',
      description: 'Atribución multitoque de ingresos efectivamente cobrados por canal y campaña.',
    },
    {
      id: 'p14',
      category: 'MARKETING',
      question: '¿Qué campañas debo reducir?',
      description: 'Campañas con ROAS deficiente, CAC elevado o baja conversión en ventas cobradas.',
    },
    {
      id: 'p15',
      category: 'OPERACIONES',
      question: '¿Qué pedidos están en riesgo?',
      description: 'Órdenes en tránsito o pendientes de surtido con probabilidad de incumplir fecha de entrega.',
    },
    {
      id: 'p16',
      category: 'FINANZAS',
      question: '¿Cuál es nuestro EBITDA?',
      description: 'Cálculo auditado de EBITDA operativo, margen EBITDA y benchmarking del sector.',
    },
    {
      id: 'p17',
      category: 'SIMULACION',
      question: '¿Qué pasaría si las ventas bajan 15%?',
      description: 'Simulación de estrés de sensibilidad en utilidad operativa y flujo de caja a 90 días.',
    },
    {
      id: 'p18',
      category: 'SIMULACION',
      question: '¿Qué pasaría si aumentamos precios 5%?',
      description: 'Impacto proyectado en margen bruto y utilidad neta con elasticidad estimada.',
    },
    {
      id: 'p19',
      category: 'SIMULACION',
      question: '¿Qué pasaría si el costo de producto aumenta 8%?',
      description: 'Evaluación del impacto del aumento de materias primas sobre el margen de contribución.',
    },
  ];

  const categories = [
    { id: 'TODAS', label: 'Todas las Preguntas' },
    { id: 'ESTADO_GENERAL', label: 'Estado & Crecimiento' },
    { id: 'RENTABILIDAD', label: 'Rentabilidad & Fugas' },
    { id: 'CLIENTES', label: 'Clientes & Cartera' },
    { id: 'EQUIPO_COMERCIAL', label: 'Ventas & Vendedores' },
    { id: 'TESORERIA', label: 'Flujo & EBITDA' },
    { id: 'INVENTARIOS', label: 'Inventario & Compras' },
    { id: 'SIMULACION', label: 'Simulaciones What-If' },
  ];

  const filteredPrompts = predefinedPrompts.filter((p) => {
    if (selectedCategory === 'TODAS') return true;
    if (selectedCategory === 'CLIENTES') return p.category === 'CLIENTES' || p.category === 'CARTERA';
    if (selectedCategory === 'TESORERIA') return p.category === 'TESORERIA' || p.category === 'FINANZAS';
    return p.category === selectedCategory;
  });

  const handleSelectPrompt = (question: string) => {
    setSelectedPrompt(question);
    setIsThinking(true);
    setTimeout(() => {
      const resp = ExecutiveIntelligenceService.queryExecutiveAdvisor(kpis, health, question);
      setCurrentResponse(resp);
      setIsThinking(false);
    }, 350);
  };

  const handleAskCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim()) return;
    setSelectedPrompt(customQuestion);
    setIsThinking(true);
    setTimeout(() => {
      const resp = ExecutiveIntelligenceService.queryExecutiveAdvisor(kpis, health, customQuestion);
      setCurrentResponse(resp);
      setIsThinking(false);
      setCustomQuestion('');
    }, 450);
  };

  const getSourceBadge = (type: string) => {
    switch (type) {
      case 'REAL':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'CALCULATED':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
      case 'PROJECTED':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/40';
      case 'INSUFFICIENT_DATA':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      default:
        return 'bg-slate-800 text-slate-300';
    }
  };

  return (
    <div id="conscore-ai-ceo-advisor" className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-yellow-400/40 bg-gradient-to-r from-yellow-400/10 via-slate-900 to-slate-900 p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-yellow-400/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-yellow-400 text-slate-950 font-black shadow-lg shadow-yellow-500/20">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-yellow-400">
                  CONSCORE AI CEO ADVISOR · Consejero Estratégico Ejecutivo (Fase 10)
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-0.5">Inteligencia Directiva & Honestidad de Datos</h2>
              <p className="text-xs text-slate-300">
                Dictámenes en 11 puntos con clasificación de fuentes:{' '}
                <span className="text-emerald-400 font-mono font-bold">REAL</span> ·{' '}
                <span className="text-blue-400 font-mono font-bold">CALCULATED</span> ·{' '}
                <span className="text-purple-400 font-mono font-bold">PROJECTED</span>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-3.5 py-2 text-xs text-yellow-300">
            <Lock className="h-4 w-4 shrink-0 text-yellow-400" />
            <span>
              <b>Gobernanza Human-in-the-Loop:</b> La IA aconseja; toda acción financiera requiere firma humana.
            </span>
          </div>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all ${
              selectedCategory === c.id
                ? 'bg-yellow-400 text-slate-950 font-bold shadow-md shadow-yellow-400/20'
                : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Predefined Prompts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredPrompts.map((p) => {
          const isSelected = selectedPrompt === p.question;
          return (
            <button
              key={p.id}
              onClick={() => handleSelectPrompt(p.question)}
              className={`text-left rounded-xl border p-3.5 transition-all flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? 'border-yellow-400 bg-yellow-400/10 shadow-lg shadow-yellow-400/10'
                  : 'border-slate-800 bg-slate-900/80 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div>
                <span className="text-[9px] font-bold font-mono uppercase tracking-wider text-yellow-400">
                  {p.category.replace('_', ' ')}
                </span>
                <h4 className="text-xs font-bold text-white mt-1 leading-snug">{p.question}</h4>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{p.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom Question Input */}
      <form onSubmit={handleAskCustom} className="flex gap-2">
        <input
          type="text"
          placeholder="Escribe tu propia consulta para el Director General IA (ej. ¿Qué pasaría si...?, ¿Dónde está la merma)..."
          value={customQuestion}
          onChange={(e) => setCustomQuestion(e.target.value)}
          className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-white placeholder-slate-500 focus:border-yellow-400 focus:outline-none font-mono"
        />
        <button
          type="submit"
          disabled={!customQuestion.trim()}
          className="flex items-center gap-1.5 rounded-xl bg-yellow-400 px-5 py-3 text-xs font-bold text-slate-950 hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-yellow-400/20 font-mono"
        >
          <Send className="h-3.5 w-3.5" />
          <span>Consultar IA</span>
        </button>
      </form>

      {/* Response Display (11 Points Format) */}
      {isThinking ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-10 text-center shadow-xl">
          <div className="inline-flex items-center gap-3 text-yellow-400 text-xs font-bold font-mono animate-pulse">
            <Sparkles className="h-5 w-5 animate-spin" />
            <span>Auditando estados financieros SAT CFDI, Kardex valuado y libros contables...</span>
          </div>
        </div>
      ) : currentResponse ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl space-y-6">
          {/* Header of Response */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-yellow-400">
                  Dictamen Estratégico Ejecutivo
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-yellow-400/20 text-yellow-300 border border-yellow-400/30">
                  FASE 10 PRODUCCIÓN
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-1">{currentResponse.question}</h3>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-slate-400">
                Periodo: <b className="text-slate-200">{currentResponse.periodAnalyzed}</b>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-[11px] border border-emerald-500/40">
                {currentResponse.confidencePct}% Confianza
              </span>
            </div>
          </div>

          {/* Section 1: Financial Snapshot Bar */}
          {currentResponse.financialMetricsSnapshot && (
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
              <div>
                <span className="text-[10px] text-slate-500 font-mono block">Ventas Netas</span>
                <span className="text-xs font-bold font-mono text-white">
                  ${(currentResponse.financialMetricsSnapshot.salesRevenue / 1000).toFixed(0)}k
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-mono block">Margen Bruto</span>
                <span className="text-xs font-bold font-mono text-yellow-400">
                  {currentResponse.financialMetricsSnapshot.grossMarginPct}%
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-mono block">EBITDA</span>
                <span className="text-xs font-bold font-mono text-emerald-400">
                  ${(currentResponse.financialMetricsSnapshot.ebitda / 1000).toFixed(0)}k
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-mono block">Bancos / Caja</span>
                <span className="text-xs font-bold font-mono text-emerald-400">
                  ${(currentResponse.financialMetricsSnapshot.availableCash / 1000).toFixed(0)}k
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-mono block">Cartera (CXC)</span>
                <span className="text-xs font-bold font-mono text-white">
                  ${(currentResponse.financialMetricsSnapshot.accountsReceivable / 1000).toFixed(0)}k
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-mono block">Proveedores (CXP)</span>
                <span className="text-xs font-bold font-mono text-amber-400">
                  ${(currentResponse.financialMetricsSnapshot.accountsPayable / 1000).toFixed(0)}k
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-mono block">Inventario Kardex</span>
                <span className="text-xs font-bold font-mono text-cyan-400">
                  ${(currentResponse.financialMetricsSnapshot.inventoryValuation / 1000).toFixed(0)}k
                </span>
              </div>
            </div>
          )}

          {/* Section 2: Data Sources Used (Data Honesty Labels) */}
          <div>
            <h4 className="text-[11px] font-bold font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-yellow-400" />
              1. Fuentes de Datos & Clasificación de Honestidad
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {Array.isArray(currentResponse.dataSourcesUsed) &&
                currentResponse.dataSourcesUsed.map((src: any, idx: number) => {
                  const isObj = typeof src === 'object' && src !== null;
                  const sourceName = isObj ? src.source : src;
                  const sourceType = isObj ? src.type : 'REAL';
                  const sourceDetail = isObj ? src.detail : '';

                  return (
                    <div
                      key={idx}
                      className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 flex items-start justify-between gap-2 text-xs"
                    >
                      <div>
                        <span className="font-medium text-slate-200">{sourceName}</span>
                        {sourceDetail && (
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">{sourceDetail}</div>
                        )}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border shrink-0 ${getSourceBadge(
                          sourceType
                        )}`}
                      >
                        {sourceType}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Section 3: Core Executive Analysis */}
          <div>
            <h4 className="text-[11px] font-bold font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-yellow-400" />
              2. Análisis Ejecutivo
            </h4>
            <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans">
              {currentResponse.analysis}
            </div>
          </div>

          {/* Section 4: Key Findings */}
          <div>
            <h4 className="text-[11px] font-bold font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-yellow-400" />
              3. Hallazgos Transaccionales Auditados
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {currentResponse.findings.map((f, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 rounded-xl bg-slate-950/70 p-3 border border-slate-800/80 text-xs text-slate-300"
                >
                  <span className="text-yellow-400 font-bold shrink-0 mt-0.5">✦</span>
                  <span className="leading-relaxed">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5 & 6: Risks & Opportunities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Risks */}
            <div className="rounded-xl border border-rose-500/30 bg-rose-950/10 p-4 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold font-mono text-xs pb-2 border-b border-rose-500/20">
                <AlertTriangle className="h-4 w-4" />
                <span>4. Riesgos Identificados</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                {currentResponse.risks.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold shrink-0">✕</span>
                    <span className="leading-relaxed">{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Opportunities */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono text-xs pb-2 border-b border-emerald-500/20">
                <Lightbulb className="h-4 w-4" />
                <span>5. Oportunidades de Captura de Valor</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-200">
                {(currentResponse.opportunities || currentResponse.recommendations.slice(0, 2)).map(
                  (opp, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span className="leading-relaxed">{opp}</span>
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>

          {/* Section 7: Recommendations */}
          <div>
            <h4 className="text-[11px] font-bold font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-yellow-400" />
              6. Recomendaciones Estratégicas
            </h4>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              {currentResponse.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-200">
                  <span className="font-mono text-yellow-400 font-bold shrink-0">{i + 1}.</span>
                  <span className="leading-relaxed">{rec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 8: Next Best Action (Human-in-the-Loop Direct Action Card) */}
          {currentResponse.nextBestAction && (
            <div className="rounded-xl border border-yellow-400/50 bg-gradient-to-r from-yellow-400/10 via-slate-950 to-slate-950 p-5 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-yellow-400" />
                  <h4 className="text-xs font-bold font-mono text-yellow-300 uppercase tracking-wider">
                    7. Próxima Mejor Acción Ejecutiva (Next Best Action)
                  </h4>
                </div>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-yellow-400 text-slate-950">
                  PRIORIDAD: {currentResponse.nextBestAction.priority}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono block">Entidad & Problema:</span>
                  <div className="font-bold text-white font-mono mt-0.5">
                    {currentResponse.nextBestAction.entity}
                  </div>
                  <p className="text-slate-300 mt-1">{currentResponse.nextBestAction.problem}</p>
                </div>

                <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono block">Acción & Responsable:</span>
                  <div className="font-bold text-yellow-400 font-mono mt-0.5">
                    {currentResponse.nextBestAction.action}
                  </div>
                  <p className="text-slate-300 mt-1">
                    Resp: <strong className="text-white">{currentResponse.nextBestAction.responsible}</strong>
                  </p>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between pt-1">
                <span>Fecha sugerida: <strong className="text-yellow-300">{currentResponse.nextBestAction.suggestedDate}</strong></span>
                <span>Justificación: {currentResponse.nextBestAction.justification}</span>
              </div>
            </div>
          )}

          {/* Section 9: Limitations & Confidence Footer */}
          <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500 font-mono flex flex-wrap items-center justify-between gap-2">
            <span>
              Limitaciones:{' '}
              <b className="text-slate-400">
                {currentResponse.limitations || 'Datos validados contra el estado transaccional local.'}
              </b>
            </span>
            <span className="text-yellow-400/80">CONSCORE ERP IA v10.0 · Production Certified</span>
          </div>
        </div>
      ) : null}
    </div>
  );
};
