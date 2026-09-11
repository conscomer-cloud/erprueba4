import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  Sparkles,
  Calendar,
  Building2,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Award,
} from 'lucide-react';
import {
  BoardReportData,
  ExecutiveKpiSummary,
  BusinessHealthScoreData,
  EnterpriseForecastData,
} from '../../types/erp';
import { ExecutiveIntelligenceService } from '../../services/executiveIntelligenceService';

interface BoardReportGeneratorProps {
  kpis: ExecutiveKpiSummary;
  health: BusinessHealthScoreData;
  forecast: EnterpriseForecastData;
}

export const BoardReportGenerator: React.FC<BoardReportGeneratorProps> = ({
  kpis,
  health,
  forecast,
}) => {
  const [period, setPeriod] = useState<string>('Q1 2026');
  const [boardType, setBoardType] = useState<'MONTHLY' | 'QUARTERLY' | 'ANNUAL'>('QUARTERLY');

  const report = ExecutiveIntelligenceService.generateBoardReport(kpis, health, forecast, period);

  const handlePrint = () => {
    window.print();
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Informe_Consejo_Administracion_${period.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl backdrop-blur-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Periodo del Informe:
          </span>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-hidden"
          >
            <option value="Enero 2026">Enero 2026 (Mensual)</option>
            <option value="Febrero 2026">Febrero 2026 (Mensual)</option>
            <option value="Q1 2026">Q1 2026 (Trimestral)</option>
            <option value="Ejercicio Anual 2026">Ejercicio Anual 2026</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-bold text-slate-300 hover:border-slate-700 hover:text-white transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Descargar JSON</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-lg bg-amber-400 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-300 transition-colors shadow-sm"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Imprimir / Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Board Document */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-8 shadow-2xl text-slate-200 space-y-8 print:border-none print:p-0 print:bg-white print:text-slate-900">
        {/* Document Header */}
        <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 font-black text-xl shadow-lg">
              CS
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                {report.companyName} · Órgano de Gobierno
              </div>
              <h1 className="text-2xl font-black text-white mt-0.5 tracking-tight">{report.reportTitle}</h1>
              <div className="text-xs text-slate-400 mt-1">
                Periodo auditado: <b>{report.period}</b> · Fecha de emisión: <b>{report.generatedDate}</b>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] font-bold uppercase text-slate-500">Dictamen Auditoría</div>
            <div className="text-xs font-bold text-emerald-400 mt-0.5 flex items-center justify-end gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>CONSCORE ERP 100% E2E Certificado</span>
            </div>
          </div>
        </div>

        {/* 1. Executive Summary */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>1. Resumen Ejecutivo de Dirección</span>
          </h2>
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 text-xs text-slate-300 leading-relaxed">
            {report.executiveSummary}
          </div>
        </div>

        {/* 2. Key Metrics Table */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <DollarSign className="h-3.5 w-3.5" />
            <span>2. Desempeño Financiero Consolidado</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {report.financialHighlights.map((item, idx) => (
              <div key={idx} className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5">
                <div className="text-[10px] text-slate-400 font-bold uppercase">{item.metric}</div>
                <div className="text-lg font-black text-white font-mono mt-1">{item.actual}</div>
                <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-slate-800">
                  <span className="text-slate-500">Meta: {item.budget}</span>
                  <span
                    className={`font-mono font-bold ${
                      item.variance.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {item.variance}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Operational Highlights */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>3. Hitos Operativos y Comerciales</span>
          </h2>

          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
            <ul className="space-y-2 text-xs text-slate-300">
              {report.operationalHighlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">✓</span>
                  <span className="leading-relaxed">{h}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 4. Strategic Initiatives & Votes */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <Award className="h-3.5 w-3.5" />
            <span>4. Acuerdos y Decisiones Propuestas para Aprobación del Consejo</span>
          </h2>

          <div className="space-y-2.5">
            {report.strategicInitiatives.map((item, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 flex items-start gap-3"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-400/20 text-amber-400 font-black text-xs">
                  {i + 1}
                </div>
                <div className="text-xs text-slate-300 leading-relaxed">{item}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Signatures & Corporate Governance */}
        <div className="pt-8 border-t border-slate-800 grid grid-cols-2 gap-8 text-center text-xs text-slate-400">
          <div>
            <div className="h-12 border-b border-slate-700/80 mx-auto w-48 mb-2"></div>
            <div className="font-bold text-slate-200">Dirección General (CEO)</div>
            <div className="text-[10px]">CONSCORE ERP IA Systems</div>
          </div>

          <div>
            <div className="h-12 border-b border-slate-700/80 mx-auto w-48 mb-2"></div>
            <div className="font-bold text-slate-200">Presidente del Consejo de Administración</div>
            <div className="text-[10px]">Comité de Auditoría y Finanzas</div>
          </div>
        </div>
      </div>
    </div>
  );
};
