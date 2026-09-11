/**
 * @license
 * CONSCORE ERP IA - FASE 14: AUTOMATIZACIÓN EMPRESARIAL + BPM + WORKFLOWS + RPA
 * Business Rules Engine View (IF / THEN / AND / OR / Conditions / Simulator)
 */

import React, { useState } from 'react';
import {
  Sliders,
  Play,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ShieldCheck,
  Zap,
  Tag,
  ToggleLeft,
  ToggleRight,
  Code,
} from 'lucide-react';
import { BusinessRule } from '../../types/automationBpmTypes';
import { AutomationBpmEngine } from '../../services/automationBpmEngine';

interface BusinessRulesEngineViewProps {
  rules: BusinessRule[];
  onRefresh: () => void;
}

export const BusinessRulesEngineView: React.FC<BusinessRulesEngineViewProps> = ({
  rules,
  onRefresh,
}) => {
  const [selectedRuleId, setSelectedRuleId] = useState<string>(rules[0]?.ruleId || 'RUL-CREDIT-CHECK');
  const [filterModule, setFilterModule] = useState<string>('TODOS');
  const [testPayload, setTestPayload] = useState<string>(
    JSON.stringify({ total: 450000, creditLimit: 200000, marginPct: 14.2, currentStock: 80, minStock: 150 }, null, 2)
  );
  const [testResult, setTestResult] = useState<{ matched: boolean; actionsTriggered: string[] } | null>(null);

  const selectedRule = rules.find((r) => r.ruleId === selectedRuleId) || rules[0];

  const filteredRules = rules.filter((r) => {
    if (filterModule === 'TODOS') return true;
    return r.module === filterModule;
  });

  const handleToggleRule = (ruleId: string) => {
    const r = rules.find((x) => x.ruleId === ruleId);
    if (r) {
      r.isEnabled = !r.isEnabled;
      onRefresh();
    }
  };

  const handleTestRule = () => {
    try {
      const parsed = JSON.parse(testPayload);
      const res = AutomationBpmEngine.emitEvent({
        eventType: 'ORDER_CREDIT_BLOCKED',
        sourceModule: selectedRule.module,
        entityType: 'TEST_EVALUATION',
        entityId: `EVAL-${Date.now().toString(36).toUpperCase()}`,
        userId: 'USR-ADMIN-01',
        severity: 'HIGH',
        payload: parsed,
        idempotencyKey: `IDEMP-EVAL-${Date.now()}`,
        correlationId: `CORR-EVAL-${Date.now()}`,
        masterTransactionId: `TRX-EVAL-${Date.now()}`,
        securityHash: 'SHA256-EVAL',
      });

      setTestResult({
        matched: (res?.rulesTriggered || []).includes(selectedRule?.code || ''),
        actionsTriggered: res?.rulesTriggered || [],
      });
      onRefresh();
    } catch (err: any) {
      alert(`Error en formato JSON: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-100 text-indigo-800">
              Motor de Reglas v2.8
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
              Evaluación en Memoria &lt; 2ms
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Catálogo y Simulador de Reglas de Negocio
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Parametrización visual de condiciones booleanas (IF/THEN), umbrales financieros y acciones automatizadas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            className="text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="TODOS">Todos los Módulos</option>
            <option value="VENTAS">Ventas / Comercial</option>
            <option value="FINANZAS">Finanzas / Crédito</option>
            <option value="INVENTARIOS">Inventarios / WMS</option>
            <option value="CXP">Cuentas por Pagar</option>
            <option value="GOBIERNO">Gobierno & Riesgo</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1 Col: Rule List */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Reglas Registradas ({filteredRules.length})</span>
          </h3>

          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {filteredRules.map((rule) => {
              const isSelected = selectedRule?.ruleId === rule.ruleId;
              return (
                <div
                  key={rule.ruleId}
                  onClick={() => setSelectedRuleId(rule.ruleId)}
                  className={`p-3 rounded-lg border transition cursor-pointer text-xs ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/60 ring-1 ring-indigo-200'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900">{rule.code}</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded">
                        {rule.module}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleRule(rule.ruleId);
                      }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      {rule.isEnabled ? (
                        <ToggleRight className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-slate-400" />
                      )}
                    </button>
                  </div>
                  <p className="font-medium text-slate-800 mt-1 line-clamp-1">
                    {rule.name}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                    {rule.description}
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-200/80 text-[10px] text-slate-400">
                    <span>{rule.executionCount} ejecuciones</span>
                    <span className="font-semibold text-indigo-600">
                      Prioridad {rule.priority}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Cols: Selected Rule Inspector & Live Simulator */}
        <div className="lg:col-span-2 space-y-6">
          {/* Rule Details & Condition Tree */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  {selectedRule.code}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {selectedRule.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedRule.description}
                </p>
              </div>

              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  selectedRule.isEnabled
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {selectedRule.isEnabled ? 'Habilitada' : 'Deshabilitada'}
              </span>
            </div>

            {/* Condition Groups Tree */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Estructura Lógica de Condiciones (IF)
              </h4>

              {selectedRule.conditionGroups.map((group, gIdx) => (
                <div
                  key={group.groupId}
                  className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">
                      Grupo {gIdx + 1} ({group.logicalOperator})
                    </span>
                  </div>

                  <div className="space-y-1.5 pl-2 border-l-2 border-indigo-400">
                    {group.conditions.map((c, cIdx) => (
                      <div
                        key={cIdx}
                        className="p-2 bg-white rounded border border-slate-200 text-xs flex items-center justify-between font-mono"
                      >
                        <span className="text-indigo-700 font-bold">{c.field}</span>
                        <span className="text-amber-700 font-semibold px-2">
                          {c.operator}
                        </span>
                        <span className="text-emerald-700 font-bold">{JSON.stringify(c.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Actions (THEN) */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Acciones a Ejecutar (THEN)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedRule.actions.map((act, aIdx) => (
                  <div
                    key={aIdx}
                    className="p-3 rounded-lg bg-indigo-50/50 border border-indigo-200 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-900 font-mono">
                        {act.type}
                      </span>
                      {act.targetRole && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-200 text-indigo-800 font-semibold">
                          {act.targetRole}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-indigo-700">
                      {act.payloadTemplate?.message || JSON.stringify(act.payloadTemplate)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Live Simulator Box */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Code className="w-4 h-4 text-indigo-500" />
                Simulador de Evaluación en Vivo (Payload JSON)
              </h4>
              <button
                onClick={handleTestRule}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
              >
                <Play className="w-3.5 h-3.5" />
                Evaluar Regla
              </button>
            </div>

            <textarea
              value={testPayload}
              onChange={(e) => setTestPayload(e.target.value)}
              rows={4}
              className="w-full text-xs font-mono p-3 bg-slate-900 text-emerald-400 rounded-lg border border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />

            {testResult && (
              <div
                className={`p-3.5 rounded-lg border text-xs flex items-start gap-2.5 ${
                  testResult.matched
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                {testResult.matched ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">
                    {testResult.matched
                      ? '¡Condiciones Cumplidas! La regla se disparó con éxito.'
                      : 'Condiciones NO cumplidas con los valores ingresados.'}
                  </p>
                  <p className="text-[11px] mt-0.5 opacity-90">
                    Reglas gatilladas en este evento: {testResult.actionsTriggered.join(', ') || 'Ninguna'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
