/**
 * @license
 * CONSCORE ERP IA - FASE 14: AUTOMATIZACIÓN EMPRESARIAL + BPM + WORKFLOWS + RPA + CONSCORE AI AUTOMATION ADVISOR
 * Type Definitions & Data Schemas
 */

import { UserRole } from './erp';

export type EnterpriseModule =
  | 'CRM'
  | 'VENTAS'
  | 'MARKETING'
  | 'INVENTARIOS'
  | 'WMS'
  | 'COMPRAS'
  | 'LOGISTICA'
  | 'RH'
  | 'NOMINA'
  | 'FINANZAS'
  | 'CXC'
  | 'CXP'
  | 'TESORERIA'
  | 'SERVICIO'
  | 'CALIDAD'
  | 'RIESGOS'
  | 'COMPLIANCE'
  | 'GOBIERNO'
  | 'ESTRATEGIA';

export type EventSeverity = 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';

export type EnterpriseEventType =
  // CRM & Marketing
  | 'LEAD_CREATED'
  | 'LEAD_QUALIFIED'
  | 'LEAD_UNATTENDED'
  | 'OPPORTUNITY_WON'
  // Ventas & Cotizaciones
  | 'QUOTE_CREATED'
  | 'QUOTE_EXPIRING_SOON'
  | 'QUOTE_EXPIRED'
  | 'QUOTE_ACCEPTED'
  | 'ORDER_CREATED'
  | 'ORDER_CREDIT_BLOCKED'
  | 'ORDER_APPROVED'
  | 'ORDER_DISCOUNT_EXCEPTION'
  // Inventario & WMS & Compras
  | 'STOCK_LOW'
  | 'STOCK_CRITICAL'
  | 'REORDER_POINT_REACHED'
  | 'PURCHASE_RECOMMENDATION_GENERATED'
  | 'PURCHASE_ORDER_CREATED'
  | 'GOODS_RECEIVED'
  | 'WMS_DISPATCH_CONFIRMED'
  // Finanzas, CXC, CXP & Tesorería
  | 'INVOICE_ISSUED'
  | 'PAYMENT_RECEIVED'
  | 'CUSTOMER_OVERDUE'
  | 'PAYMENT_PROMISE_BROKEN'
  | 'CREDIT_LIMIT_EXCEEDED'
  | 'AP_BILL_RECEIVED'
  | 'AP_BILL_DUPLICATE_DETECTED'
  | 'THREE_WAY_MATCH_DISCREPANCY'
  | 'THREE_WAY_MATCH_PASSED'
  | 'TREASURY_DEFICIT_WARNING'
  | 'BUDGET_THRESHOLD_REACHED'
  | 'BUDGET_EXCEEDED'
  // RH & Nómina
  | 'EMPLOYEE_ABSENCE_LOGGED'
  | 'COMMISSION_PENDING_APPROVAL'
  | 'COMMISSION_APPROVED'
  | 'HR_DOCUMENT_EXPIRING'
  | 'HR_DOCUMENT_EXPIRED'
  // Servicio & Calidad
  | 'TICKET_CREATED'
  | 'TICKET_SLA_WARNING'
  | 'TICKET_SLA_BREACHED'
  | 'CUSTOMER_DETRACTOR_DETECTED'
  | 'WARRANTY_RMA_REQUESTED'
  // Riesgos, Compliance & Gobierno
  | 'ENTERPRISE_RISK_TRIGGERED'
  | 'SOD_CONFLICT_DETECTED'
  | 'COMPLIANCE_OBLIGATION_EXPIRING'
  | 'COMPLIANCE_EVIDENCE_MISSING'
  | 'EXECUTIVE_ACTION_OVERDUE';

export interface EnterpriseEvent<T = any> {
  eventId: string;
  eventType: EnterpriseEventType;
  entityType: string; // e.g. 'Lead', 'Quote', 'Order', 'Invoice', 'Product', 'Employee', 'Ticket'
  entityId: string;
  masterTransactionId?: string;
  timestamp: string;
  userId: string;
  userRole?: UserRole;
  sourceModule: EnterpriseModule;
  payload: T;
  previousState?: any;
  newState?: any;
  severity: EventSeverity;
  correlationId: string;
  idempotencyKey: string;
  securityHash?: string;
  processed: boolean;
  processedAt?: string;
  workflowExecutionId?: string;
}

// -------------------------------------------------------------
// WORKFLOW / BPM ENGINE TYPES
// -------------------------------------------------------------

export type WorkflowStatus = 'ACTIVE' | 'DRAFT' | 'PAUSED' | 'DEPRECATED';

export type WorkflowStepType =
  | 'START'
  | 'VALIDATION'
  | 'CONDITION'
  | 'TASK'
  | 'APPROVAL'
  | 'REJECTION'
  | 'ESCALATION'
  | 'WAIT'
  | 'NOTIFICATION'
  | 'EXECUTION'
  | 'COMPENSATION'
  | 'AUDIT'
  | 'END';

export interface WorkflowStepCondition {
  field: string;
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'IN' | 'CONTAINS' | 'CUSTOM';
  value: any;
  trueNextStepId: string;
  falseNextStepId?: string;
}

export interface WorkflowStep {
  stepId: string;
  name: string;
  type: WorkflowStepType;
  description: string;
  nextStepId?: string;
  failureStepId?: string;
  condition?: WorkflowStepCondition;
  timeoutMinutes?: number;
  assignedRole?: UserRole;
  approvers?: UserRole[];
  requiresHumanValidation?: boolean;
  humanActionPrompt?: string;
  isAutomated?: boolean;
  rpaActionId?: string;
}

export type BpmWorkflowStep = WorkflowStep;

export interface WorkflowRollbackStrategy {
  enabled: boolean;
  compensatingSteps: Array<{
    stepId: string;
    action: string;
    undoEndpoint: string;
  }>;
  onRollbackNotificationRole: UserRole;
}

export interface WorkflowEscalationRule {
  unattendedHours: number;
  targetRole: UserRole;
  notificationMessage: string;
}

export interface BpmWorkflowDefinition {
  workflowId: string;
  version: number;
  name: string;
  category: EnterpriseModule;
  owner: string;
  status: WorkflowStatus;
  triggerEvent: EnterpriseEventType;
  triggerConditionDescription: string;
  steps: WorkflowStep[];
  slaMinutes: number;
  escalationRules: WorkflowEscalationRule[];
  rollbackStrategy: WorkflowRollbackStrategy;
  auditPolicy: 'FULL_TRACE' | 'MINIMAL';
  createdAt: string;
  updatedAt: string;
  versionHistoryNotes?: string;
}

export type ExecutionState =
  | 'PENDING'
  | 'RUNNING'
  | 'WAITING_HUMAN_APPROVAL'
  | 'WAITING_TIMER'
  | 'COMPLETED'
  | 'REJECTED'
  | 'FAILED'
  | 'ROLLED_BACK';

export interface WorkflowStepExecutionRecord {
  stepId: string;
  stepName: string;
  stepType: WorkflowStepType;
  startedAt: string;
  completedAt?: string;
  status: 'PENDING' | 'SUCCESS' | 'WAITING' | 'FAILED' | 'ROLLED_BACK';
  actor: string;
  inputPayload?: any;
  outputResult?: any;
  error?: string;
  humanDecision?: {
    approver: string;
    decision: 'APPROVED' | 'REJECTED';
    timestamp: string;
    comments: string;
    digitalSignatureHash?: string;
  };
}

export interface WorkflowExecutionInstance {
  executionId: string;
  workflowId: string;
  workflowVersion: number;
  workflowName: string;
  masterTransactionId?: string;
  correlationId: string;
  idempotencyKey: string;
  triggeredByEventId: string;
  eventType: EnterpriseEventType;
  status: ExecutionState;
  currentStepId: string;
  startTime: string;
  endTime?: string;
  elapsedSeconds?: number;
  variables: Record<string, any>;
  stepHistory: WorkflowStepExecutionRecord[];
  rollbackApplied: boolean;
  auditId: string;
  humanValidationRequired: boolean;
  humanValidationPendingRole?: UserRole;
  humanValidationMessage?: string;
}

// -------------------------------------------------------------
// BUSINESS RULES ENGINE
// -------------------------------------------------------------

export type RuleOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'GREATER_THAN'
  | 'LESS_THAN'
  | 'GREATER_EQUAL'
  | 'LESS_EQUAL'
  | 'BETWEEN'
  | 'CONTAINS'
  | 'IN_LIST'
  | 'THRESHOLD_PCT'
  | 'DAYS_OVERDUE_GREATER';

export interface RuleSingleCondition {
  field: string;
  operator: RuleOperator;
  value: any;
  secondaryValue?: any;
}

export interface RuleConditionGroup {
  logicalOperator: 'AND' | 'OR';
  conditions: RuleSingleCondition[];
}

export interface RuleAction {
  type:
    | 'TRIGGER_WORKFLOW'
    | 'CREATE_ENTERPRISE_ALERT'
    | 'REQUEST_EXECUTIVE_APPROVAL'
    | 'BLOCK_TRANSACTION'
    | 'DISPATCH_NOTIFICATION'
    | 'SUGGEST_PURCHASE_ORDER'
    | 'TRIGGER_ESCALATION'
    | 'INVOKE_RPA_BOT';
  targetWorkflowId?: string;
  targetRole?: UserRole;
  severity?: EventSeverity;
  payloadTemplate: Record<string, any>;
}

export interface BusinessRule {
  ruleId: string;
  code: string; // e.g. RUL-SLS-001
  name: string;
  module: EnterpriseModule;
  description: string;
  priority: number; // 1 (Highest) to 10
  conditionGroups: RuleConditionGroup[];
  actions: RuleAction[];
  isEnabled: boolean;
  executionCount: number;
  lastEvaluatedAt?: string;
  lastTriggeredAt?: string;
}

// -------------------------------------------------------------
// 25 PRECONFIGURED AUTOMATIONS (A01 - A25)
// -------------------------------------------------------------

export interface PreconfiguredAutomation {
  automationId: string;
  code: string; // 'A01' to 'A25'
  title: string;
  module: EnterpriseModule;
  triggerEvent: EnterpriseEventType;
  ruleSummary: string;
  workflowSummary: string;
  requiresHumanApproval: boolean;
  requiredRole?: UserRole;
  financialRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  enabled: boolean;
  stats: {
    executionsCount: number;
    approvedCount: number;
    rejectedCount: number;
    timeSavedMinutes: number;
    financialImpactMxn: number;
    lastExecutedAt?: string;
  };
}

// -------------------------------------------------------------
// EXECUTIVE ACTION CENTER
// -------------------------------------------------------------

export type ActionCategory =
  | 'HOY'
  | 'URGENTE'
  | 'ESTA_SEMANA'
  | 'PENDIENTE'
  | 'EN_APROBACION'
  | 'EN_EJECUCION'
  | 'COMPLETADO'
  | 'RECHAZADO';

export interface AutomationExecutiveAction {
  id: string;
  category: ActionCategory;
  title: string;
  description: string;
  module: EnterpriseModule;
  owner: string;
  ownerRole: UserRole;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  dueDate: string;
  financialImpact: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  approvalRequired: boolean;
  requiresHumanValidation: boolean;
  humanValidationNotice: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  auditId: string;
  masterTransactionId?: string;
  sourceWorkflowId?: string;
  sourceEventId?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

// -------------------------------------------------------------
// THREE-WAY MATCH (CXP AUTOMATION)
// -------------------------------------------------------------

export interface ThreeWayMatchRecord {
  id: string;
  masterTransactionId: string;
  purchaseOrderId: string;
  poTotal: number;
  poQuantity: number;
  supplierName: string;
  goodsReceiptId: string;
  receivedQuantity: number;
  supplierInvoiceId: string;
  invoiceTotal: number;
  invoiceQuantity: number;
  varianceQuantity: number;
  varianceAmount: number;
  variancePct: number;
  matchStatus: 'PERFECT_MATCH' | 'DISCREPANCY_QUANTITY' | 'DISCREPANCY_PRICE' | 'UNMATCHED';
  discrepancyNotes?: string;
  status: 'PENDING' | 'AUTO_MATCHED' | 'DISCREPANCY_BLOCKED' | 'EXCEPTION_APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvalDate?: string;
  timestamp: string;
}

// -------------------------------------------------------------
// OMNICHANNEL NOTIFICATION CENTER & ESCALATIONS
// -------------------------------------------------------------

export interface OmniNotification {
  notificationId: string;
  recipientId: string;
  recipientRole: UserRole;
  channel: 'APP' | 'EMAIL' | 'PUSH' | 'SYSTEM';
  severity: EventSeverity;
  title: string;
  message: string;
  entityType: string;
  entityId: string;
  timestamp: string;
  readAt?: string;
  actionUrl?: string;
  actionLabel?: string;
  status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  masterTransactionId?: string;
}

export interface EscalationIncident {
  incidentId: string;
  sourceModule: EnterpriseModule;
  entityType: string;
  entityId: string;
  title: string;
  slaMinutes: number;
  elapsedMinutes: number;
  currentLevel: 'SUPERVISOR' | 'GERENTE' | 'DIRECTOR';
  nextEscalationAt: string;
  history: Array<{
    tier: string;
    notifiedRole: UserRole;
    timestamp: string;
    note: string;
  }>;
  resolved: boolean;
  resolvedAt?: string;
}

// -------------------------------------------------------------
// RPA / CONTROLLED BOTS
// -------------------------------------------------------------

export interface RpaRobotTask {
  taskId: string;
  robotName: string;
  category:
    | 'REPORT_GENERATION'
    | 'DOC_CLASSIFICATION'
    | 'DRAFT_RECONCILIATION'
    | 'PRE_PAYROLL_PREPARATION'
    | 'EXPEDIENT_PREPARATION'
    | 'REMINDER_DISPATCH';
  description: string;
  scheduledCron?: string;
  lastRunAt?: string;
  status: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'BLOCKED_HUMAN_REQUIRED';
  allowedAutonomous: boolean;
  sensitiveGuardrailsVerified: boolean;
  executionCount: number;
  timeSavedPerRunMinutes: number;
  logs: string[];
}

// -------------------------------------------------------------
// DEAD LETTER QUEUE (DLQ) & RETRIES
// -------------------------------------------------------------

export interface DeadLetterQueueItem {
  id: string;
  eventId: string;
  eventType: EnterpriseEventType;
  correlationId: string;
  payload: any;
  errorReason: string;
  failureTimestamp: string;
  retryCount: number;
  maxRetries: number;
  workflowId?: string;
  stackReference: string;
  resolutionStatus: 'UNRESOLVED' | 'RETRYING' | 'MANUALLY_RESOLVED' | 'DISCARDED';
  resolutionNotes?: string;
}

// -------------------------------------------------------------
// OBSERVABILITY & HEALTH METRICS
// -------------------------------------------------------------

export interface AutomationObservabilityMetrics {
  activeWorkflows: number;
  completedWorkflows: number;
  failedWorkflows: number;
  pendingApprovals: number;
  totalEventsProcessed: number;
  duplicateEventsBlocked: number;
  totalRollbacks: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  operationalHoursSaved: number;
  totalFinancialValueImpactedMxn: number;
  throughputEventsPerMin: number;
  healthyServicesPct: number;
}

// -------------------------------------------------------------
// CONSCORE AI AUTOMATION ADVISOR
// -------------------------------------------------------------

export type AIDataTaxonomy = 'REAL' | 'CALCULATED' | 'PROJECTED' | 'INSUFFICIENT_DATA';

export interface AIDataPointSummary {
  label: string;
  value: string;
  source: string;
  classification: AIDataTaxonomy;
}

export interface AIAutomationAdvisorResponse {
  question: string;
  dataUsed: AIDataPointSummary[];
  eventsDetected: string[];
  rulesApplied: string[];
  suggestedWorkflow: string;
  operationalImpact: string;
  financialImpact: string;
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  priority: 'URGENTE' | 'ALTA' | 'MEDIA' | 'BAJA';
  recommendation: string;
  nextBestAction: string;
  responsibleRole: UserRole;
  targetDate: string;
  confidenceLevel: number; // 0 - 100%
  dataClassification: AIDataTaxonomy;
  humanValidationMandate: string; // 'REQUIERE VALIDACIÓN HUMANA'
  generatedAt: string;
}

// -------------------------------------------------------------
// E2E MASTER SIMULATION & CHAOS SUITE
// -------------------------------------------------------------

export interface E2EMasterSimulationStep {
  stepNumber: number;
  module: EnterpriseModule;
  stepName: string;
  actionDescription: string;
  eventIdGenerated: string;
  eventType: EnterpriseEventType;
  rulesEvaluated: string[];
  workflowTriggered: string;
  requiresHumanDecision: boolean;
  humanDecisionRole?: UserRole;
  status: 'PENDING' | 'EXECUTING' | 'PASS' | 'FAIL';
  financialState: string;
  auditHash: string;
  timestamp?: string;
}

export interface E2EMasterSimulationResult {
  simulationId: string;
  masterTransactionId: string;
  startedAt: string;
  completedAt: string;
  totalSteps: number;
  passedSteps: number;
  failedSteps: number;
  isFullyValidated: boolean;
  totalEbitdaEarned: number;
  steps: E2EMasterSimulationStep[];
}

export interface ChaosTestScenario {
  id: string;
  code: string;
  title: string;
  failureInjected: string;
  expectedBehavior: string;
  observedResult: 'PASS' | 'FAIL';
  recoveryStrategy: 'ROLLBACK_ATOMIC' | 'PROGRESSIVE_RETRY' | 'DLQ_CAPTURE' | 'IDEMPOTENCY_DEDUPLICATION';
  auditProof: string;
  latencyMs: number;
  details: string;
}

export interface Phase14CertificationTest {
  id: string;
  category: 'EVENT_BUS' | 'BPM_ENGINE' | 'RULES_ENGINE' | 'IDEMPOTENCY' | 'THREE_WAY_MATCH' | 'RPA_GUARDRAILS' | 'AI_ADVISOR' | 'CHAOS_RESILIENCE' | 'E2E_TRANSACTION' | 'NO_REGRESSION';
  code: string;
  name: string;
  description: string;
  status: 'PASS' | 'FAIL';
  executionTimeMs: number;
  evidence: string;
}

export interface Phase14CertificationSuiteResult {
  suiteId: string;
  timestamp: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  status: '100% VALIDATED' | 'NOT VALIDATED';
  tests: Phase14CertificationTest[];
  summary: {
    eventsProcessedCount: number;
    workflowsExecutedCount: number;
    idempotentBlocksCount: number;
    atomicRollbacksCount: number;
    noRegressionPhasesValidated: number;
  };
}
