/**
 * @license
 * CONSCORE ERP IA - FASE 14: AUTOMATIZACIÓN EMPRESARIAL + BPM + WORKFLOWS + RPA
 * 25 Preconfigured Automations Catalog (A01 - A25)
 */

import React, { useState } from 'react';
import {
  Zap,
  Search,
  CheckCircle2,
  Clock,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  Filter,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { PreconfiguredAutomation } from '../../types/automationBpmTypes';
import { AutomationBpmEngine } from '../../services/automationBpmEngine';

interface PreconfiguredAutomationsViewProps {
  automations: PreconfiguredAutomation[];
  onRefresh: () => void;
}

export const PreconfiguredAutomationsView: React.FC<PreconfiguredAutomationsViewProps> = ({
  automations,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('TODOS');
  const [selectedAutomation, setSelectedAutomation] = useState<PreconfiguredAutomation | null>(null);

  const modules = ['TODOS', 'CRM', 'VENTAS', 'INVENTARIOS', 'FINANZAS', 'CXC', 'CXP', 'RH', 'SERVICIO', 'CALIDAD', 'RIESGOS', 'GOBIERNO'];

  const filtered = automations.filter((a) => {
    const matchesModule = selectedModule === 'TODOS' || a.module === selectedModule;
    const matchesSearch =
      (a.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.code || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.ruleSummary || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesModule && matchesSearch;
  });

  const handleToggle = (id: string, current: boolean) => {
    AutomationBpmEngine.togglePreconfiguredAutomation(id, !current);
    onRefresh();
  };

  const totalFinancialImpact = automations.reduce((sum, a) => sum + a.stats.financialImpactMxn, 0);
  const totalExecutions = automations.reduce((sum, a) => sum + a.stats.executionsCount, 0);
  const activeCount = automations.filter((a) => a.enabled).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-100 text-indigo-800">
              Catálogo A01 - A25
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
              {activeCount} de {automations.length} Activas
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            25 Automatizaciones Preconfiguradas Multimódulo
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Reglas de negocio corporativas transversales para CRM, Comercial, WMS, CXC, CXP, RH, Calidad y Compliance.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Ejecuciones</span>
            <span className="text-sm font-bold text-slate-900">{(Number(totalExecutions) || 0).toLocaleString()}</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Impacto Financiero</span>
            <span className="text-sm font-bold text-emerald-600">${(totalFinancialImpact / 1000000).toFixed(1)}M MXN</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por código (ej. A01), título, módulo o regla..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {modules.map((m) => (
            <button
              key={m}
              onClick={() => setSelectedModule(m)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedModule === m
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Automations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((auto) => (
          <div
            key={auto.automationId}
            onClick={() => setSelectedAutomation(auto)}
            className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 shadow-2xs hover:shadow-sm transition flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-100 text-indigo-800 font-mono">
                    {auto.code}
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                    {auto.module}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle(auto.automationId, auto.enabled);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  {auto.enabled ? (
                    <ToggleRight className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-slate-400" />
                  )}
                </button>
              </div>

              <h3 className="text-sm font-bold text-slate-900 mt-2 group-hover:text-indigo-600 transition">
                {auto.title}
              </h3>
              <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                {auto.ruleSummary}
              </p>

              <div className="mt-3 p-2 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-500 space-y-1">
                <div className="flex items-center justify-between">
                  <span>Trigger:</span>
                  <code className="text-indigo-700 font-mono font-semibold">{auto.triggerEvent}</code>
                </div>
                <div className="flex items-center justify-between">
                  <span>Workflow:</span>
                  <span className="text-slate-700 font-medium">{auto.targetWorkflow}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                {auto.stats.executionsCount} ejecuciones
              </span>
              <span className="font-bold text-slate-800">
                ${(auto.stats.financialImpactMxn / 1000).toLocaleString()}k MXN
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedAutomation && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-indigo-100 text-indigo-800">
                  {selectedAutomation.code} - {selectedAutomation.module}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {selectedAutomation.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAutomation(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-semibold text-slate-400 uppercase text-[10px]">Descripción de la Regla</span>
                <p className="text-slate-700 mt-0.5">{selectedAutomation.ruleSummary}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <span className="font-semibold text-slate-400 uppercase text-[10px]">Evento Disparador</span>
                  <p className="font-mono text-indigo-700 font-bold">{selectedAutomation.triggerEvent}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-400 uppercase text-[10px]">Workflow Destino</span>
                  <p className="font-semibold text-slate-800">{selectedAutomation.targetWorkflow}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-400 uppercase text-[10px]">Acción Ejecutada</span>
                  <p className="font-semibold text-slate-800">{selectedAutomation.actionType}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-400 uppercase text-[10px]">Rol Destino</span>
                  <p className="font-semibold text-slate-800">{selectedAutomation.targetRole}</p>
                </div>
              </div>

              {selectedAutomation.requiresHumanValidation && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span><strong>Human-in-the-Loop:</strong> Requiere validación humana mandataria antes de cualquier ejecución irreversible.</span>
                </div>
              )}

              <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-200 space-y-1">
                <span className="font-semibold text-indigo-900 uppercase text-[10px]">Estadísticas Reales</span>
                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Ejecuciones</span>
                    <span className="font-bold text-slate-900">{selectedAutomation.stats.executionsCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Aprobadas</span>
                    <span className="font-bold text-emerald-600">{selectedAutomation.stats.approvedCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Impacto MXN</span>
                    <span className="font-bold text-indigo-700">${(selectedAutomation.stats.financialImpactMxn / 1000).toLocaleString()}k</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedAutomation(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
