/**
 * @license
 * CONSCORE ERP IA - Planeación Estratégica, BI Ejecutivo, OKR & What-If Simulator
 * FASE 12 - Módulo Principal
 */

import React, { useState, useMemo } from 'react';
import {
  Compass,
  Target,
  BarChart3,
  Sliders,
  AlertTriangle,
  CheckSquare,
  Bot,
  ShieldCheck,
  TrendingUp,
  Layers,
  Sparkles,
  RefreshCw,
  PlusCircle,
  FileSpreadsheet,
  Zap,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { ERPModule } from '../../types/erp';
import {
  StrategicObjective,
  BSCIndicator,
  OKRKeyResult,
  StrategicInitiative,
  StrategicVarianceItem,
  StrategicAlert,
  ExecutiveActionItem,
  WhatIfSimulationParameters,
  WhatIfSimulationResult,
  PresetScenarioType,
} from '../../types/strategicPlanningTypes';
import {
  INITIAL_STRATEGIC_OBJECTIVES,
  INITIAL_BSC_INDICATORS,
  INITIAL_OKR_KEY_RESULTS,
  INITIAL_STRATEGIC_INITIATIVES,
  INITIAL_STRATEGIC_VARIANCES,
  INITIAL_STRATEGIC_ALERTS,
  INITIAL_EXECUTIVE_ACTIONS,
  INITIAL_STRATEGIC_FORECASTS,
  INITIAL_PRIORITY_MATRIX_ITEMS,
  INITIAL_SENSITIVITY_EFFECTS,
} from '../../services/strategicPlanningInitialData';
import { StrategicPlanningService } from '../../services/strategicPlanningService';

// Subviews
import { StrategicCommandCenterView } from './StrategicCommandCenterView';
import { BalancedScorecardView } from './BalancedScorecardView';
import { OKRManagerView } from './OKRManagerView';
import { WhatIfSimulatorView } from './WhatIfSimulatorView';
import { SensitivityPriorityMatrixView } from './SensitivityPriorityMatrixView';
import { StrategicVarianceAlertsView } from './StrategicVarianceAlertsView';
import { ExecutiveActionCenterView } from './ExecutiveActionCenterView';
import { AIStrategyAdvisorView } from './AIStrategyAdvisorView';
import { Phase12CertificationView } from './Phase12CertificationView';

export type StrategicTab =
  | 'COMMAND_CENTER'
  | 'BALANCED_SCORECARD'
  | 'OKR_MANAGER'
  | 'WHAT_IF_SIMULATOR'
  | 'SENSITIVITY_PRIORITY'
  | 'VARIANCE_ALERTS'
  | 'ACTION_CENTER'
  | 'AI_STRATEGY_ADVISOR'
  | 'CERTIFICATION_PHASE12';

interface StrategicPlanningModuleProps {
  onNavigate?: (module: ERPModule) => void;
}

export const StrategicPlanningModule: React.FC<StrategicPlanningModuleProps> = ({ onNavigate }) => {
  const erp = useERP();
  const { currentRole, currentUser: user } = useAuth();

  const [activeTab, setActiveTab] = useState<StrategicTab>('COMMAND_CENTER');

  // Master State
  const [objectives, setObjectives] = useState<StrategicObjective[]>(INITIAL_STRATEGIC_OBJECTIVES);
  const [bscIndicators, setBscIndicators] = useState<BSCIndicator[]>(INITIAL_BSC_INDICATORS);
  const [keyResults, setKeyResults] = useState<OKRKeyResult[]>(INITIAL_OKR_KEY_RESULTS);
  const [initiatives, setInitiatives] = useState<StrategicInitiative[]>(INITIAL_STRATEGIC_INITIATIVES);
  const [variances, setVariances] = useState<StrategicVarianceItem[]>(INITIAL_STRATEGIC_VARIANCES);
  const [alerts, setAlerts] = useState<StrategicAlert[]>(INITIAL_STRATEGIC_ALERTS);
  const [actions, setActions] = useState<ExecutiveActionItem[]>(INITIAL_EXECUTIVE_ACTIONS);

  // Calculate live Executive KPIs
  const masterKPIs = useMemo(() => {
    return StrategicPlanningService.calculateMasterExecutiveKPIs(erp);
  }, [erp]);

  // Multidimensional breakdown
  const multiDimBreakdown = useMemo(() => {
    return StrategicPlanningService.calculateMultiDimensionalBreakdown(erp);
  }, [erp]);

  // Quick Stats
  const activeAlertsCount = alerts.filter((a) => a.status === 'ACTIVA').length;
  const pendingActionsCount = actions.filter((a) => a.status === 'PENDING').length;
  const criticalObjectivesCount = objectives.filter((o) => o.status === 'AT_RISK' || o.status === 'DELAYED').length;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-900 text-slate-100 pb-16">
      {/* Header Bar */}
      <div className="border-b border-slate-800 bg-slate-950/80 px-6 py-5 sticky top-0 z-20 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-950">
              <Compass className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">
                  Planeación Estratégica & BI Ejecutivo
                </h1>
                <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-xs font-black text-indigo-400 border border-indigo-500/40">
                  FASE 12
                </span>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Data Honesty Certified
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Balanced Scorecard · OKR Master · What-If Simulator · Variance Engine · CONSCORE AI Advisor
              </p>
            </div>
          </div>

          {/* Action pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="rounded-lg bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 flex items-center gap-2 text-xs">
              <span className="text-slate-400">EBITDA YTD:</span>
              <span className="font-mono font-bold text-emerald-400">
                ${(masterKPIs.ebitdaMXN / 1000000).toFixed(2)}M ({masterKPIs.ebitdaMarginPct}%)
              </span>
            </div>

            <div className="rounded-lg bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 flex items-center gap-2 text-xs">
              <span className="text-slate-400">Ventas YTD:</span>
              <span className="font-mono font-bold text-cyan-400">
                ${(masterKPIs.actualSalesYTD / 1000000).toFixed(2)}M ({masterKPIs.salesFulfillmentPct.toFixed(1)}%)
              </span>
            </div>

            <button
              onClick={() => setActiveTab('CERTIFICATION_PHASE12')}
              className="rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-1.5 text-xs font-black text-slate-950 hover:brightness-110 shadow-sm transition-all flex items-center gap-1.5"
            >
              <ShieldCheck className="h-4 w-4" />
              Auditoría Master F12
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-4 mt-2 no-scrollbar border-t border-slate-800/60">
          <button
            onClick={() => setActiveTab('COMMAND_CENTER')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'COMMAND_CENTER'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Command Center
          </button>

          <button
            onClick={() => setActiveTab('BALANCED_SCORECARD')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'BALANCED_SCORECARD'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            Balanced Scorecard
          </button>

          <button
            onClick={() => setActiveTab('OKR_MANAGER')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'OKR_MANAGER'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Target className="h-3.5 w-3.5" />
            OKR Master
            {criticalObjectivesCount > 0 && (
              <span className="rounded-full bg-amber-500/20 text-amber-300 px-1.5 py-0.2 text-[10px] font-mono">
                {criticalObjectivesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('WHAT_IF_SIMULATOR')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'WHAT_IF_SIMULATOR'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="h-3.5 w-3.5 text-cyan-300" />
            What-If Simulator
            <span className="rounded-full bg-cyan-400/20 text-cyan-300 px-1.5 py-0.2 text-[10px] font-mono">
              Aislado
            </span>
          </button>

          <button
            onClick={() => setActiveTab('SENSITIVITY_PRIORITY')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'SENSITIVITY_PRIORITY'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Sensibilidad & Matriz
          </button>

          <button
            onClick={() => setActiveTab('VARIANCE_ALERTS')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'VARIANCE_ALERTS'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Desviaciones & Alertas
            {activeAlertsCount > 0 && (
              <span className="rounded-full bg-rose-500 text-white px-1.5 py-0.2 text-[10px] font-mono">
                {activeAlertsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('ACTION_CENTER')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'ACTION_CENTER'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <CheckSquare className="h-3.5 w-3.5" />
            Acciones Ejecutivas
            {pendingActionsCount > 0 && (
              <span className="rounded-full bg-amber-500 text-slate-950 font-black px-1.5 py-0.2 text-[10px] font-mono">
                {pendingActionsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('AI_STRATEGY_ADVISOR')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'AI_STRATEGY_ADVISOR'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-950'
                : 'text-purple-300 hover:text-purple-100 hover:bg-purple-900/30'
            }`}
          >
            <Bot className="h-3.5 w-3.5 text-purple-300" />
            CONSCORE AI Strategy Advisor
          </button>

          <button
            onClick={() => setActiveTab('CERTIFICATION_PHASE12')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'CERTIFICATION_PHASE12'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Certificación F12
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 max-w-7xl w-full mx-auto">
        {activeTab === 'COMMAND_CENTER' && (
          <StrategicCommandCenterView
            kpis={masterKPIs}
            multiDimBreakdown={multiDimBreakdown}
            onOpenWhatIf={() => setActiveTab('WHAT_IF_SIMULATOR')}
            onOpenAIAdvisor={() => setActiveTab('AI_STRATEGY_ADVISOR')}
            onOpenAlerts={() => setActiveTab('VARIANCE_ALERTS')}
            onOpenActions={() => setActiveTab('ACTION_CENTER')}
          />
        )}

        {activeTab === 'BALANCED_SCORECARD' && (
          <BalancedScorecardView
            indicators={bscIndicators}
            onUpdateIndicator={(updated) => {
              setBscIndicators((prev) => prev.map((i) => (i.indicatorId === updated.indicatorId ? updated : i)));
            }}
          />
        )}

        {activeTab === 'OKR_MANAGER' && (
          <OKRManagerView
            objectives={objectives}
            keyResults={keyResults}
            initiatives={initiatives}
            onUpdateObjective={(upd) => setObjectives((prev) => prev.map((o) => (o.objectiveId === upd.objectiveId ? upd : o)))}
            onUpdateKR={(upd) => setKeyResults((prev) => prev.map((k) => (k.krId === upd.krId ? upd : k)))}
            onUpdateInitiative={(upd) => setInitiatives((prev) => prev.map((i) => (i.initiativeId === upd.initiativeId ? upd : i)))}
          />
        )}

        {activeTab === 'WHAT_IF_SIMULATOR' && (
          <WhatIfSimulatorView
            baselineKPIs={masterKPIs}
            onSaveToActionPlan={(initiative) => {
              setInitiatives((prev) => [initiative, ...prev]);
              setActiveTab('OKR_MANAGER');
            }}
          />
        )}

        {activeTab === 'SENSITIVITY_PRIORITY' && (
          <SensitivityPriorityMatrixView
            priorityItems={INITIAL_PRIORITY_MATRIX_ITEMS}
            sensitivityEffects={INITIAL_SENSITIVITY_EFFECTS}
            onSelectScenario={() => setActiveTab('WHAT_IF_SIMULATOR')}
          />
        )}

        {activeTab === 'VARIANCE_ALERTS' && (
          <StrategicVarianceAlertsView
            variances={variances}
            alerts={alerts}
            onResolveAlert={(alertId) => {
              setAlerts((prev) =>
                prev.map((a) => (a.alertId === alertId ? { ...a, status: 'MITIGADA' } : a))
              );
            }}
            onCreateExecutiveAction={(action) => {
              setActions((prev) => [action, ...prev]);
              setActiveTab('ACTION_CENTER');
            }}
          />
        )}

        {activeTab === 'ACTION_CENTER' && (
          <ExecutiveActionCenterView
            actions={actions}
            onUpdateAction={(upd) => setActions((prev) => prev.map((a) => (a.actionId === upd.actionId ? upd : a)))}
            onApproveAction={(actionId) => {
              setActions((prev) =>
                prev.map((a) =>
                  a.actionId === actionId
                    ? {
                        ...a,
                        isHumanApproved: true,
                        approvedBy: user?.name || 'Director General',
                        approvedAt: new Date().toISOString(),
                        status: 'IN_PROGRESS',
                      }
                    : a
                )
              );
            }}
          />
        )}

        {activeTab === 'AI_STRATEGY_ADVISOR' && (
          <AIStrategyAdvisorView
            kpis={masterKPIs}
            onCreateExecutiveAction={(action) => {
              setActions((prev) => [action, ...prev]);
              setActiveTab('ACTION_CENTER');
            }}
          />
        )}

        {activeTab === 'CERTIFICATION_PHASE12' && (
          <Phase12CertificationView kpis={masterKPIs} />
        )}
      </div>
    </div>
  );
};
