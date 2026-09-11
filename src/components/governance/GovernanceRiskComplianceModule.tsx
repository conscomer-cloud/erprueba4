/**
 * @license
 * CONSCORE ERP IA - Governance, Risk & Compliance Module
 * FASE 13 - Módulo Maestro de Gobierno Corporativo, Control Interno, Compliance, SoD y Auditoría
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building2,
  Sliders,
  Scale,
  AlertTriangle,
  FileCheck,
  FileText,
  GitBranch,
  ShieldAlert,
  Activity,
  CheckSquare,
  Bot,
  Award,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import {
  EnterpriseHealthScoreReport,
  EnterpriseRisk,
  ExecutiveApprovalRequest,
  EnterpriseAlert,
  AnomalyDetectionResult,
  CorporatePolicy,
  CorporateCommittee,
  AuthorityLimitRule,
  SoDConflictRule,
  SoDViolationRisk,
  ComplianceObligation,
  ComplianceEvidence,
  CorrectiveActionPlan,
  CorporateDocument,
  GovernanceExecutiveAction,
  MasterTransactionAuditTrace,
} from '../../types/governanceRiskComplianceTypes';
import { GovernanceRiskComplianceService } from '../../services/governanceRiskComplianceService';
import { initialGovernanceData } from '../../services/governanceRiskComplianceInitialData';

// Subviews
import { EnterpriseCommandCenterView } from './EnterpriseCommandCenterView';
import { CorporateGovernanceCenterView } from './CorporateGovernanceCenterView';
import { AuthorityMatrixView } from './AuthorityMatrixView';
import { SegregationOfDutiesView } from './SegregationOfDutiesView';
import { RiskManagementCenterView } from './RiskManagementCenterView';
import { ComplianceCenterView } from './ComplianceCenterView';
import { CorporateDocumentManagerView } from './CorporateDocumentManagerView';
import { ExecutiveAuditCenterView } from './ExecutiveAuditCenterView';
import { EnterpriseAlertEngineView } from './EnterpriseAlertEngineView';
import { AnomalyDetectionView } from './AnomalyDetectionView';
import { GovernanceExecutiveActionView } from './GovernanceExecutiveActionView';
import { AIRiskAdvisorView } from './AIRiskAdvisorView';
import { Phase13CertificationView } from './Phase13CertificationView';

export const GovernanceRiskComplianceModule: React.FC = () => {
  const erpContext = useERP();
  const [activeTab, setActiveTab] = useState<string>('COMMAND_CENTER');

  // State initialized with certified FASE 13 data
  const [policies, setPolicies] = useState<CorporatePolicy[]>(initialGovernanceData.policies);
  const [committees, setCommittees] = useState<CorporateCommittee[]>(initialGovernanceData.committees);
  const [authorityRules, setAuthorityRules] = useState<AuthorityLimitRule[]>(initialGovernanceData.authorityRules);
  const [approvalRequests, setApprovalRequests] = useState<ExecutiveApprovalRequest[]>(initialGovernanceData.approvalRequests);
  const [sodRules, setSodRules] = useState<SoDConflictRule[]>(initialGovernanceData.sodRules);
  const [sodViolations, setSodViolations] = useState<SoDViolationRisk[]>(initialGovernanceData.sodViolations);
  const [risks, setRisks] = useState<EnterpriseRisk[]>(initialGovernanceData.risks);
  const [obligations, setObligations] = useState<ComplianceObligation[]>(initialGovernanceData.obligations);
  const [evidenceList, setEvidenceList] = useState<ComplianceEvidence[]>(initialGovernanceData.evidenceList);
  const [actionPlans, setActionPlans] = useState<CorrectiveActionPlan[]>(initialGovernanceData.actionPlans);
  const [documents, setDocuments] = useState<CorporateDocument[]>(initialGovernanceData.documents);
  const [alerts, setAlerts] = useState<EnterpriseAlert[]>(initialGovernanceData.alerts);
  const [anomalies, setAnomalies] = useState<AnomalyDetectionResult[]>(initialGovernanceData.anomalies);
  const [executiveActions, setExecutiveActions] = useState<GovernanceExecutiveAction[]>(initialGovernanceData.executiveActions);
  const [sampleTraces, setSampleTraces] = useState<MasterTransactionAuditTrace[]>(initialGovernanceData.sampleTraces);

  // Dynamic calculated Health Score based on real ERP state
  const [healthScore, setHealthScore] = useState<EnterpriseHealthScoreReport>(() =>
    GovernanceRiskComplianceService.calculateEnterpriseHealthScore(erpContext)
  );

  const handleRefreshHealthScore = () => {
    const updated = GovernanceRiskComplianceService.calculateEnterpriseHealthScore(erpContext);
    setHealthScore(updated);
  };

  const handleProcessApproval = (
    approvalId: string,
    decision: 'APPROVED' | 'REJECTED',
    reason: string
  ) => {
    setApprovalRequests((prev) =>
      prev.map((a) =>
        a.approvalId === approvalId
          ? {
              ...a,
              decision,
              decisionReason: reason,
              decisionTimestamp: new Date().toISOString(),
              approverName: 'Dirección General (Firma Digital)',
              approverRole: 'DIRECTOR',
            }
          : a
      )
    );
  };

  const handleAcknowledgeAlert = (alertId: string, userName: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        (a.alertId === alertId || a.id === alertId)
          ? { ...a, status: 'ACKNOWLEDGED', acknowledgedBy: userName, acknowledgedAt: new Date().toISOString() }
          : a
      )
    );
  };

  const handleResolveAlert = (alertId: string, note: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        (a.alertId === alertId || a.id === alertId)
          ? {
              ...a,
              status: 'RESOLVED',
              resolvedAt: new Date().toISOString(),
              resolutionNotes: note,
            }
          : a
      )
    );
  };

  const handleDismissAlert = (alertId: string, reason: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        (a.alertId === alertId || a.id === alertId)
          ? {
              ...a,
              status: 'DISMISSED',
              dismissedAt: new Date().toISOString(),
              dismissReason: reason,
            }
          : a
      )
    );
  };

  const handleUpdateAnomalyStatus = (
    anomalyId: string,
    status: 'ACTIVO' | 'EN_REVISION' | 'JUSTIFICADO' | 'CORREGIDO',
    note?: string
  ) => {
    setAnomalies((prev) =>
      prev.map((a) =>
        (a.anomalyId === anomalyId || a.id === anomalyId)
          ? {
              ...a,
              status,
              reviewedAt: new Date().toISOString(),
              reviewedBy: 'Auditor de Control',
              reviewNotes: note || a.reviewNotes,
            }
          : a
      )
    );
  };

  const handleCompleteAction = (actionId: string, notes?: string) => {
    setExecutiveActions((prev) =>
      prev.map((act) =>
        (act.actionId === actionId || act.id === actionId)
          ? {
              ...act,
              status: 'COMPLETED',
              completedAt: new Date().toISOString(),
              resolutionNotes: notes || act.resolutionNotes,
            }
          : act
      )
    );
  };

  const handleUpdateActionStatus = (
    actionId: string,
    status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
    notes?: string
  ) => {
    setExecutiveActions((prev) =>
      prev.map((act) =>
        (act.actionId === actionId || act.id === actionId)
          ? {
              ...act,
              status,
              resolutionNotes: notes || act.resolutionNotes,
              completedAt: status === 'COMPLETED' ? new Date().toISOString() : act.completedAt,
            }
          : act
      )
    );
  };

  const navTabs = [
    { key: 'COMMAND_CENTER', label: 'Command Center', icon: ShieldCheck },
    { key: 'CORPORATE_GOVERNANCE', label: 'Gobierno y Políticas', icon: Building2 },
    { key: 'AUTHORITY_MATRIX', label: 'Facultades & Aprobaciones', icon: Sliders },
    { key: 'SOD_MANAGER', label: 'Segregación (SoD)', icon: Scale },
    { key: 'RISK_MANAGEMENT', label: 'Gestión de Riesgos (ERM)', icon: AlertTriangle },
    { key: 'COMPLIANCE_CENTER', label: 'Compliance & Evidencias', icon: FileCheck },
    { key: 'DOCUMENTS_VAULT', label: 'Bóveda Documental', icon: FileText },
    { key: 'AUDIT_CENTER', label: 'Auditoría Transversal', icon: GitBranch },
    { key: 'ALERT_ENGINE', label: 'Motor de Alertas', icon: ShieldAlert },
    { key: 'ANOMALY_DETECTION', label: 'Anomalías Estadísticas', icon: Activity },
    { key: 'EXECUTIVE_ACTIONS', label: 'Acciones Priorizadas', icon: CheckSquare },
    { key: 'AI_RISK_ADVISOR', label: 'AI Risk Advisor', icon: Bot },
    { key: 'CERTIFICATION_SUITE', label: 'Certificación FASE 13', icon: Award },
  ];

  return (
    <div className="space-y-6">
      {/* Top Navigation Bar with Horizontal Scrolling */}
      <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {navTabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="transition-all">
        {activeTab === 'COMMAND_CENTER' && (
          <EnterpriseCommandCenterView
            healthScore={healthScore}
            risks={risks}
            approvals={approvalRequests}
            alerts={alerts}
            anomalies={anomalies}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onRefresh={handleRefreshHealthScore}
          />
        )}

        {activeTab === 'CORPORATE_GOVERNANCE' && (
          <CorporateGovernanceCenterView policies={policies} committees={committees} />
        )}

        {activeTab === 'AUTHORITY_MATRIX' && (
          <AuthorityMatrixView
            rules={authorityRules}
            approvals={approvalRequests}
            onProcessApproval={handleProcessApproval}
          />
        )}

        {activeTab === 'SOD_MANAGER' && (
          <SegregationOfDutiesView
            rules={sodRules}
            violations={sodViolations}
            onAddViolation={(v) => setSodViolations((prev) => [v, ...prev])}
          />
        )}

        {activeTab === 'RISK_MANAGEMENT' && (
          <RiskManagementCenterView risks={risks} />
        )}

        {activeTab === 'COMPLIANCE_CENTER' && (
          <ComplianceCenterView
            obligations={obligations}
            evidenceList={evidenceList}
            actionPlans={actionPlans}
            onUploadEvidence={(newEvi) => {
              setEvidenceList((prev) => [newEvi, ...prev]);
            }}
            onObligationUpdated={(updatedOb) => {
              setObligations((prev) => prev.map((o) => (o.id === updatedOb.id ? updatedOb : o)));
            }}
          />
        )}

        {activeTab === 'DOCUMENTS_VAULT' && (
          <CorporateDocumentManagerView documents={documents} />
        )}

        {activeTab === 'AUDIT_CENTER' && (
          <ExecutiveAuditCenterView
            auditLogs={erpContext.auditLogs}
            sampleTraces={sampleTraces}
          />
        )}

        {activeTab === 'ALERT_ENGINE' && (
          <EnterpriseAlertEngineView
            alerts={alerts}
            onAcknowledgeAlert={handleAcknowledgeAlert}
            onResolveAlert={handleResolveAlert}
            onDismissAlert={handleDismissAlert}
            onAlertsUpdated={(newAlerts) => setAlerts(newAlerts)}
          />
        )}

        {activeTab === 'ANOMALY_DETECTION' && (
          <AnomalyDetectionView
            anomalies={anomalies}
            onAnomalyStatusChange={handleUpdateAnomalyStatus}
            onAnomaliesUpdated={(updated) => setAnomalies(updated)}
          />
        )}

        {activeTab === 'EXECUTIVE_ACTIONS' && (
          <GovernanceExecutiveActionView
            actions={executiveActions}
            onCompleteAction={handleCompleteAction}
            onUpdateActionStatus={handleUpdateActionStatus}
            onActionsUpdated={(updated) => setExecutiveActions(updated)}
          />
        )}

        {activeTab === 'AI_RISK_ADVISOR' && (
          <AIRiskAdvisorView
            risks={risks}
            healthScore={healthScore}
            obligations={obligations}
            policies={policies}
          />
        )}

        {activeTab === 'CERTIFICATION_SUITE' && (
          <Phase13CertificationView erpContext={erpContext} />
        )}
      </div>
    </div>
  );
};
