/**
 * @license
 * CONSCORE ERP IA - FASE 14: AUTOMATIZACIÓN EMPRESARIAL + BPM + WORKFLOWS + RPA
 * Master Module Coordinator
 */

import React, { useState } from 'react';
import {
  Workflow,
  Zap,
  Sliders,
  CheckCircle2,
  Activity,
  Bell,
  Cpu,
  ShieldCheck,
  RotateCw,
  Award,
  Play,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';

import { AutomationBpmEngine } from '../../services/automationBpmEngine';
import { AutomationCommandCenterView } from './AutomationCommandCenterView';
import { WorkflowBpmStudioView } from './WorkflowBpmStudioView';
import { BusinessRulesEngineView } from './BusinessRulesEngineView';
import { PreconfiguredAutomationsView } from './PreconfiguredAutomationsView';
import { ExecutiveActionCenterView } from './ExecutiveActionCenterView';
import { ThreeWayMatchCenterView } from './ThreeWayMatchCenterView';
import { EventBusMonitorView } from './EventBusMonitorView';
import { NotificationEscalationCenterView } from './NotificationEscalationCenterView';
import { RpaBotsManagerView } from './RpaBotsManagerView';
import { AutomationObservabilityView } from './AutomationObservabilityView';
import { AIAutomationAdvisorView } from './AIAutomationAdvisorView';
import { MasterE2ESimulatorView } from './MasterE2ESimulatorView';
import { ChaosTestingSuiteView } from './ChaosTestingSuiteView';
import { Phase14CertificationView } from './Phase14CertificationView';

export const AutomationBpmModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('COMMAND_CENTER');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const metrics = AutomationBpmEngine.getObservabilityMetrics();
  const automations = AutomationBpmEngine.getPreconfiguredAutomations();
  const workflows = AutomationBpmEngine.getWorkflows();
  const executions = AutomationBpmEngine.getExecutions();
  const events = AutomationBpmEngine.getEvents();
  const actions = AutomationBpmEngine.getActions();
  const threeWayMatches = AutomationBpmEngine.getThreeWayMatches();
  const notifications = AutomationBpmEngine.getNotifications();
  const escalations = AutomationBpmEngine.getEscalations();
  const rpaBots = AutomationBpmEngine.getRpaBots();
  const dlqItems = AutomationBpmEngine.getDLQ();

  const pendingActionsCount = actions.filter((a) => a.status === 'PENDING_APPROVAL').length;
  const blocked3WayCount = threeWayMatches.filter((m) => m.status === 'DISCREPANCY_BLOCKED').length;

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Top Main Navigation Tabs */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-1.5 overflow-x-auto">
        <button
          onClick={() => setActiveTab('COMMAND_CENTER')}
          className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'COMMAND_CENTER'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-4 h-4" />
          Command Center
        </button>

        <button
          onClick={() => setActiveTab('WORKFLOWS')}
          className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'WORKFLOWS'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Workflow className="w-4 h-4" />
          BPM Studio
        </button>

        <button
          onClick={() => setActiveTab('RULES')}
          className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'RULES'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Reglas de Negocio
        </button>

        <button
          onClick={() => setActiveTab('PRECONFIGURED')}
          className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'PRECONFIGURED'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Zap className="w-4 h-4" />
          25 Reglas (A01-A25)
        </button>

        <button
          onClick={() => setActiveTab('ACTIONS')}
          className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'ACTIONS'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Acciones Ejecutivas
          {pendingActionsCount > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold">
              {pendingActionsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('3WAY_MATCH')}
          className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === '3WAY_MATCH'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          3-Way Match CXP
          {blocked3WayCount > 0 && (
            <span className="px-1.5 py-0.2 bg-rose-100 text-rose-800 rounded-full text-[10px] font-bold">
              {blocked3WayCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('EVENT_BUS')}
          className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'EVENT_BUS'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-4 h-4" />
          Bus de Eventos
        </button>

        <button
          onClick={() => setActiveTab('NOTIFICATIONS')}
          className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'NOTIFICATIONS'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Bell className="w-4 h-4" />
          Notificaciones & SLA
        </button>

        <button
          onClick={() => setActiveTab('RPA')}
          className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'RPA'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Cpu className="w-4 h-4" />
          Robots RPA
        </button>

        <button
          onClick={() => setActiveTab('OBSERVABILITY')}
          className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'OBSERVABILITY'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <RotateCw className="w-4 h-4" />
          DLQ & Salud
        </button>

        <button
          onClick={() => setActiveTab('AI_ADVISOR')}
          className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'AI_ADVISOR'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Cpu className="w-4 h-4 text-indigo-400" />
          AI Advisor
        </button>

        <button
          onClick={() => setActiveTab('E2E_SIMULATOR')}
          className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'E2E_SIMULATOR'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Play className="w-4 h-4" />
          Simulador E2E
        </button>

        <button
          onClick={() => setActiveTab('CHAOS')}
          className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'CHAOS'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Chaos Testing
        </button>

        <button
          onClick={() => setActiveTab('CERTIFICATION')}
          className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'CERTIFICATION'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
          }`}
        >
          <Award className="w-4 h-4" />
          Certificación FASE 14
        </button>
      </div>

      {/* Main Tab Content Display */}
      {activeTab === 'COMMAND_CENTER' && (
        <AutomationCommandCenterView
          metrics={metrics}
          automations={automations}
          recentEvents={events}
          pendingActions={actions.filter((a) => a.status === 'PENDING_APPROVAL')}
          onNavigateTab={setActiveTab}
        />
      )}

      {activeTab === 'WORKFLOWS' && (
        <WorkflowBpmStudioView
          workflows={workflows}
          executions={executions}
          onRefresh={handleRefresh}
        />
      )}

      {activeTab === 'RULES' && (
        <BusinessRulesEngineView
          rules={AutomationBpmEngine.getBusinessRules()}
          onRefresh={handleRefresh}
        />
      )}

      {activeTab === 'PRECONFIGURED' && (
        <PreconfiguredAutomationsView
          automations={automations}
          onRefresh={handleRefresh}
        />
      )}

      {activeTab === 'ACTIONS' && (
        <ExecutiveActionCenterView
          actions={actions}
          onRefresh={handleRefresh}
        />
      )}

      {activeTab === '3WAY_MATCH' && (
        <ThreeWayMatchCenterView
          records={threeWayMatches}
          onRefresh={handleRefresh}
        />
      )}

      {activeTab === 'EVENT_BUS' && (
        <EventBusMonitorView
          events={events}
          onRefresh={handleRefresh}
        />
      )}

      {activeTab === 'NOTIFICATIONS' && (
        <NotificationEscalationCenterView
          notifications={notifications}
          escalations={escalations}
          onRefresh={handleRefresh}
        />
      )}

      {activeTab === 'RPA' && (
        <RpaBotsManagerView
          bots={rpaBots}
          onRefresh={handleRefresh}
        />
      )}

      {activeTab === 'OBSERVABILITY' && (
        <AutomationObservabilityView
          metrics={metrics}
          dlqItems={dlqItems}
          onRefresh={handleRefresh}
        />
      )}

      {activeTab === 'AI_ADVISOR' && <AIAutomationAdvisorView />}

      {activeTab === 'E2E_SIMULATOR' && <MasterE2ESimulatorView />}

      {activeTab === 'CHAOS' && <ChaosTestingSuiteView />}

      {activeTab === 'CERTIFICATION' && <Phase14CertificationView />}
    </div>
  );
};
