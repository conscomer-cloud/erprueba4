/**
 * @license
 * CONSCORE ERP IA - Governance, Risk, Compliance & Internal Control Types
 * FASE 13 - Modelos de Datos para Gobierno Corporativo, SoD, Riesgos, Compliance, Auditoría y AI Risk Advisor
 */

import { ERPModule, UserRole, AuditLog } from './erp';

// ==========================================
// 1. GOBIERNO CORPORATIVO Y POLÍTICAS
// ==========================================

export type PolicyStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'SUPERSEDED'
  | 'CANCELLED';

export type PolicyArea =
  | 'DIRECCION_GENERAL'
  | 'FINANZAS_Y_TESORERIA'
  | 'VENTAS_Y_CREDITO'
  | 'COMPRAS_Y_ABASTECIMIENTO'
  | 'ALMACEN_E_INVENTARIOS'
  | 'LOGISTICA_Y_DISTRIBUCION'
  | 'RECURSOS_HUMANOS_Y_NOMINA'
  | 'CALIDAD_Y_SERVICIO'
  | 'TECNOLOGIA_Y_SEGURIDAD'
  | 'COMPLIANCE_Y_LEGAL';

export interface CorporatePolicy {
  id: string;
  code: string; // e.g. POL-FIN-001
  name: string;
  description: string;
  area: PolicyArea;
  version: string;
  status: PolicyStatus;
  effectiveDate: string; // YYYY-MM-DD
  expirationDate: string; // YYYY-MM-DD
  ownerId: string;
  ownerName: string;
  approverId: string;
  approverName: string;
  documentId?: string;
  auditId: string;
  scope: string;
  keyControls: string[];
  reviewFrequencyDays: number;
}

export interface CommitteeAgreement {
  id: string;
  agreementNumber: string;
  description: string;
  responsibleId: string;
  responsibleName: string;
  targetDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  evidenceDocumentId?: string;
}

export interface CorporateCommittee {
  id: string;
  code: string;
  name: string;
  description: string;
  frequency: 'SEMANAL' | 'QUINCENAL' | 'MENSUAL' | 'TRIMESTRAL' | 'EXTRAORDINARIO';
  presidentName: string;
  secretaryName: string;
  members: Array<{
    userId: string;
    userName: string;
    role: string;
  }>;
  lastSessionDate: string;
  nextSessionDate: string;
  agreements: CommitteeAgreement[];
}

// ==========================================
// 2. MATRIZ DE FACULTADES Y AUTORIZACIONES
// ==========================================

export type AuthorityDomain =
  | 'VENTAS_DESCUENTOS'
  | 'VENTAS_CREDITO'
  | 'COMPRAS_OC'
  | 'PAGOS_TESORERIA'
  | 'AJUSTES_INVENTARIO'
  | 'NOMINA_Y_BONOS'
  | 'CONTRATOS_LEGALES';

export interface AuthorityLimitRule {
  id: string;
  code: string;
  domain: AuthorityDomain;
  name: string;
  description: string;
  minThreshold: number; // e.g., 0
  maxThreshold: number; // e.g., 50000 (or Infinity)
  metricUnit: 'MXN' | 'PERCENTAGE' | 'DAYS' | 'COUNT';
  requiredRole: UserRole;
  fallbackApproverRole?: UserRole;
  requiresTwoSignatures: boolean;
  secondRequiredRole?: UserRole;
  allowSelfApproval: boolean;
  isActive: boolean;
}

export interface AuthorityMatrixConfig {
  version: string;
  updatedAt: string;
  updatedBy: string;
  rules: AuthorityLimitRule[];
}

export type ApprovalDecision = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';

export interface ExecutiveApprovalRequest {
  approvalId: string;
  entityType:
    | 'DESCUENTO_VENTA'
    | 'EXCEPCION_CREDITO'
    | 'ORDEN_COMPRA'
    | 'PAGO_TESORERIA'
    | 'AJUSTE_INVENTARIO'
    | 'INCREMENTO_SALARIO'
    | 'APERTURA_PERIODO'
    | 'CANCELACION_FACTURA';
  entityId: string;
  folio: string;
  requesterId: string;
  requesterName: string;
  requesterRole: UserRole;
  approverId?: string;
  approverName?: string;
  approverRole?: UserRole;
  requestedAmount: number;
  currency: 'MXN' | 'USD';
  reason: string;
  decision: ApprovalDecision;
  decisionReason?: string;
  timestamp: string;
  decisionTimestamp?: string;
  ip: string;
  auditId: string;
  masterTransactionId?: string;
  riskEvaluationScore: number; // 1-25
  isSoDCompliant: boolean;
}

// ==========================================
// 3. SEGREGACIÓN DE FUNCIONES (SoD)
// ==========================================

export type SoDRiskSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface SoDConflictRule {
  id: string;
  code: string; // e.g. SOD-001
  name: string;
  functionA: string; // e.g. "CREAR_PROVEEDOR"
  functionB: string; // e.g. "AUTORIZAR_PROVEEDOR"
  area: PolicyArea;
  severity: SoDRiskSeverity;
  description: string;
  mitigatingControl: string;
  enforceBlock: boolean; // if true, system physically blocks execution
  isActive: boolean;
}

export interface SoDViolationRisk {
  id: string;
  ruleCode: string;
  ruleName: string;
  userId: string;
  userName: string;
  attemptedAction: string;
  conflictingAction: string;
  entityType: string;
  entityId: string;
  severity: SoDRiskSeverity;
  detectedAt: string;
  isBlocked: boolean;
  status: 'OPEN' | 'MITIGATED' | 'ACCEPTED_RISK' | 'RESOLVED';
  auditId: string;
  masterTransactionId?: string;
  mitigationNotes?: string;
}

export interface SoDCheckResult {
  isAllowed: boolean;
  hasConflict: boolean;
  ruleViolated?: SoDConflictRule;
  reason: string;
  violationRisk?: SoDViolationRisk;
}

// ==========================================
// 4. GESTIÓN EMPRESARIAL DE RIESGOS (ERM)
// ==========================================

export type RiskCategory =
  | 'FINANCIAL'
  | 'OPERATIONAL'
  | 'COMMERCIAL'
  | 'INVENTORY'
  | 'LOGISTICS'
  | 'CUSTOMER'
  | 'HR'
  | 'CYBERSECURITY'
  | 'COMPLIANCE'
  | 'LEGAL'
  | 'STRATEGIC'
  | 'REPUTATIONAL'
  | 'FRAUD'
  | 'DATA';

export type RiskProbability = 1 | 2 | 3 | 4 | 5; // 1: Muy Rara, 5: Muy Frecuente
export type RiskImpact = 1 | 2 | 3 | 4 | 5;      // 1: Insignificante, 5: Catastrófico

export type RiskSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface EnterpriseRisk {
  id: string;
  code: string; // e.g. RSK-FIN-001
  name: string;
  description: string;
  area: PolicyArea;
  process: string;
  category: RiskCategory;
  probability: RiskProbability;
  impact: RiskImpact;
  inherentRiskScore: number; // probability * impact (1-25)
  inherentRiskSeverity: RiskSeverity;
  controls: string[];
  mitigation: string;
  residualProbability: RiskProbability;
  residualImpact: RiskImpact;
  residualRiskScore: number; // residualProb * residualImpact
  residualRiskSeverity: RiskSeverity;
  ownerId: string;
  ownerName: string;
  dueDate: string; // YYYY-MM-DD
  status: 'IDENTIFICADO' | 'EN_MITIGACION' | 'CONTROLADO' | 'CERRADO';
  evidence?: string;
  auditId: string;
  estimatedFinancialExposureMXN: number;
}

// ==========================================
// 5. COMPLIANCE & CUMPLIMIENTO REGULATORIO
// ==========================================

export type ComplianceStatus =
  | 'COMPLIANT'
  | 'PARTIALLY_COMPLIANT'
  | 'NON_COMPLIANT'
  | 'PENDING_REVIEW'
  | 'INSUFFICIENT_DATA';

export interface ComplianceEvidence {
  id: string;
  documentName: string;
  documentType: string;
  date: string;
  responsibleName: string;
  version: string;
  evidenceUrlOrHash: string;
  reviewerName?: string;
  reviewDate?: string;
  reviewResult: 'APROBADA' | 'RECHAZADA' | 'OBSERVACIONES';
  observations: string;
  auditId: string;
}

export interface CorrectiveActionPlan {
  id: string;
  obligationId?: string;
  title: string;
  description: string;
  responsible: string;
  targetDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  progressPct: number;
}

export interface ComplianceObligation {
  id: string;
  code: string; // e.g. CMP-SAT-001
  regulationSource: string; // SAT, STPS, ISO 9001, IMSS, etc.
  name: string;
  description: string;
  area: PolicyArea;
  frequency: 'MENSUAL' | 'BIMESTRAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL' | 'PERMANENTE';
  mandatoryControls: string[];
  evidences: ComplianceEvidence[];
  actionPlans?: CorrectiveActionPlan[];
  status: ComplianceStatus;
  dueDate: string;
  lastReviewDate?: string;
  ownerName: string;
  correctivePlan?: string;
  auditId: string;
}

// ==========================================
// 6. CONTROL DOCUMENTAL CORPORATIVO
// ==========================================

export type CorporateDocumentStatus =
  | 'VALID'
  | 'EXPIRING'
  | 'EXPIRED'
  | 'PENDING_REVIEW'
  | 'REJECTED';

export type DocumentAssociationEntityType =
  | 'CLIENT'
  | 'SUPPLIER'
  | 'EMPLOYEE'
  | 'VEHICLE'
  | 'WAREHOUSE'
  | 'CONTRACT'
  | 'PURCHASE_ORDER'
  | 'SALES_ORDER'
  | 'INVOICE'
  | 'WARRANTY'
  | 'POLICY'
  | 'COMPLIANCE'
  | 'RISK'
  | 'AUDIT';

export interface CorporateDocument {
  id: string;
  code: string; // e.g. DOC-CONTRATO-2026-001
  title: string;
  category: string;
  entityType: DocumentAssociationEntityType;
  entityId: string;
  entityLabel: string;
  version: string;
  status: CorporateDocumentStatus;
  validFrom: string;
  validTo: string;
  uploadedBy: string;
  approvedBy?: string;
  sha256Hash: string;
  fileSizeKb: number;
  auditId: string;
  storagePath: string;
  isConfidential: boolean;
  notes?: string;
  tags?: string[];
  fileExtension?: string;
  mimeType?: string;
  downloadUrl?: string;
  uploadedByName?: string;
  contentPreview?: string;
}

// ==========================================
// 7. MOTOR EMPRESARIAL DE ALERTAS
// ==========================================

export type AlertSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AlertStatus =
  | 'OPEN'
  | 'ACKNOWLEDGED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'DISMISSED';

export type AlertDomain =
  | 'FINANZAS'
  | 'VENTAS'
  | 'INVENTARIO'
  | 'LOGISTICA'
  | 'RH'
  | 'CLIENTES'
  | 'SEGURIDAD'
  | 'COMPLIANCE'
  | 'GOBIERNO';

export interface EnterpriseAlert {
  alertId: string;
  type: string;
  severity: AlertSeverity;
  module: ERPModule;
  domain: AlertDomain;
  entityId?: string;
  entityName?: string;
  description: string;
  detectedAt: string;
  ownerId: string;
  ownerName: string;
  status: AlertStatus;
  recommendedAction: string;
  auditId: string;
  masterTransactionId?: string;
  financialImpactEstimatedMXN?: number;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
  dismissedAt?: string;
  dismissedBy?: string;
  dismissReason?: string;
  id?: string;
  title?: string;
  code?: string;
  suggestedRemediation?: string;
  ownerRole?: string;
  timestamp?: string;
}

// ==========================================
// 8. MOTOR DE DETECCIÓN DE ANOMALÍAS
// ==========================================

export interface AnomalyDetectionResult {
  anomalyId: string;
  domain: AlertDomain;
  metricName: string;
  historicalBaseline: string; // e.g. "Margen habitual: 24% – 28%"
  currentObservedValue: string; // e.g. "Margen actual: 11.2%"
  deviationPercentage: number;
  severity: AlertSeverity;
  detectedAt: string;
  entityId?: string;
  entityName?: string;
  diagnosticNote: string; // "Comportamiento atípico detectado. Requiere revisión humana."
  recommendedAction: string;
  status: 'ACTIVO' | 'EN_REVISION' | 'JUSTIFICADO' | 'CORREGIDO';
  auditId: string;
  masterTransactionId?: string;

  // Campos complementarios y defensivos de compatibilidad analítica:
  id?: string;
  title?: string;
  deviationSigma?: number; // Z-Score estadístico
  deviationPct?: number; // Alias retrocompatible de deviationPercentage
  historicalSampleCount?: number; // Cantidad de observaciones de la muestra
  investigationAction?: string; // Alias retrocompatible de recommendedAction
  expectedValue?: number | string;
  observedValue?: number | string;
  confidenceScore?: number;
  sourceModule?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

// ==========================================
// 9. ENTERPRISE HEALTH SCORE (12 DIMENSIONES)
// ==========================================

export interface EnterpriseHealthDimensionScore {
  dimensionKey:
    | 'VENTAS'
    | 'RENTABILIDAD'
    | 'LIQUIDEZ'
    | 'CXC'
    | 'CXP'
    | 'INVENTARIO'
    | 'OPERACION'
    | 'CLIENTES'
    | 'RH'
    | 'MARKETING'
    | 'COMPLIANCE'
    | 'RIESGOS';
  dimensionName: string;
  score: number; // 0 - 100
  weightPct: number; // e.g. 10%
  weightedScore: number;
  status: 'EXCELENTE' | 'BUENO' | 'ATENCION' | 'CRITICO';
  positiveDrivers: string[];
  negativeDrivers: string[];
  dataSourcesUsed: string[];
  explanation: string;
}

export interface EnterpriseHealthScoreReport {
  overallScore: number; // 0 - 100
  overallStatus: 'EXCELENTE' | 'SALUDABLE' | 'MODERADO' | 'RIESGOSO' | 'CRITICO';
  evaluatedAt: string;
  dimensions: EnterpriseHealthDimensionScore[];
  summary: string;
  trend: 'ALCISTA' | 'ESTABLE' | 'BAJISTA';
  topRecommendations: string[];
}

// ==========================================
// 10. CONSCORE AI RISK ADVISOR & DATA HONESTY
// ==========================================

export type AIDataClassification =
  | 'REAL'
  | 'CALCULATED'
  | 'PROJECTED'
  | 'INSUFFICIENT_DATA';

export interface AIDataPointEntry {
  label: string;
  value: string;
  source: string;
  classification: AIDataClassification;
}

export interface AIRiskAdvisorResponse {
  queryId: string;
  pregunta: string;
  periodo: string;
  datosUtilizados: string[];
  datosReales: AIDataPointEntry[];
  datosCalculados: AIDataPointEntry[];
  datosProyectados: AIDataPointEntry[];
  datosInsuficientes: string[];
  hallazgos: string[];
  riesgos: string[];
  severidad: AlertSeverity;
  probabilidad: string;
  impactoFinanciero: string;
  tendencia: string;
  oportunidades: string[];
  recomendaciones: string[];
  nextBestActions: string[];
  responsableSugerido: string;
  nivelDeConfianza: string;
  governanceGuardrail: string; // "REQUIERE VALIDACIÓN HUMANA - Función Consultiva"
  isBlockedFromAutonomousExecution: boolean;
}

// ==========================================
// 11. ACCIONES EJECUTIVAS DE GOBIERNO (ACTION CENTER)
// ==========================================

export type GovernanceActionHorizon = 'HOY' | 'ESTA_SEMANA' | 'ESTE_MES';
export type GovernanceActionStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface GovernanceExecutiveAction {
  actionId: string;
  id?: string; // Retrocompatibilidad defensiva
  horizon: GovernanceActionHorizon;
  timeframe?: GovernanceActionHorizon; // Retrocompatibilidad defensiva
  title: string;
  description: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  priorityScore?: number; // Puntuación normalizada de prioridad
  ownerId: string;
  ownerName: string;
  dueDate: string;
  deadlineDate?: string; // Retrocompatibilidad defensiva
  financialImpactMXN: number;
  expectedFinancialImpact?: string | number; // Retrocompatibilidad defensiva
  riskImpact: string;
  expectedRiskReduction?: string; // Retrocompatibilidad defensiva
  source: 'AUDITORIA' | 'RIESGO_ERM' | 'COMPLIANCE' | 'ANOMALIA' | 'SoD' | 'AI_ADVISOR' | 'DIRECTIVA';
  domain?: string; // Retrocompatibilidad defensiva
  status: GovernanceActionStatus;
  requiresHumanValidation: boolean;
  masterTransactionId?: string;
  auditId: string;
  sourceEntityId?: string;
  urgency?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  reviewedBy?: string;
  reviewedAt?: string;
  resolutionNotes?: string;
  assignedRole?: string;
  completedAt?: string;
}

// ==========================================
// 12. AUDITORÍA TRANSVERSAL & TIMELINE
// ==========================================

export interface MasterAuditTraceEvent {
  eventId: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  module: ERPModule;
  entityType: string;
  entityId: string;
  folio?: string;
  action: string;
  previousValue?: string;
  newValue?: string;
  masterTransactionId: string;
  ip: string;
  amount?: number;
  metadata?: Record<string, unknown>;
}

export interface MasterAuditTraceTimeline {
  masterTransactionId: string;
  clientName: string;
  rfc: string;
  totalAmount: number;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'UNDER_AUDIT' | 'BLOCKED';
  lifecycleSteps: Array<{
    stepCode:
      | 'LEAD'
      | 'OPPORTUNITY'
      | 'QUOTATION'
      | 'ORDER'
      | 'RESERVATION'
      | 'PICKING'
      | 'DELIVERY'
      | 'INVOICE'
      | 'CXC'
      | 'PAYMENT'
      | 'COMMISSION'
      | 'PAYROLL'
      | 'PROFITABILITY'
      | 'EBITDA'
      | 'RISK'
      | 'COMPLIANCE'
      | 'AUDIT';
    stepLabel: string;
    module: ERPModule;
    isCompleted: boolean;
    timestamp?: string;
    user?: string;
    amount?: number;
    folio?: string;
    details?: string;
  }>;
  events: MasterAuditTraceEvent[];
}

// ==========================================
// 13. CERTIFICACIÓN FASE 13 (20 PRUEBAS)
// ==========================================

export interface Phase13CertificationTest {
  id: string; // e.g. TEST-P13-01
  testNumber: number;
  testName: string;
  category: string;
  expected: string;
  actual: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  details: string;
  executionTimeMs: number;
}

export interface Phase13CertificationSuiteResult {
  suiteName: string;
  executedAt: string;
  overallStatus: 'PASS (20/20 VALIDATED)' | 'FAILED';
  totalTests: number;
  passedTests: number;
  failedTests: number;
  items: Phase13CertificationTest[];
  noRegressionSummary: {
    phases1to12Protected: boolean;
    entitiesDuplicatedCount: number;
    orphanRecordsCount: number;
    uncontrolledSodViolationsCount: number;
    unauthorizedAiAutonomousOperationsCount: number;
    auditIntegrityLostCount: number;
  };
}

export type AnomalySeverity = AlertSeverity;
export type ExecutiveActionTimeframe = GovernanceActionHorizon;
export type Phase13CertificationResult = Phase13CertificationSuiteResult;

export interface MasterTransactionAuditTrace {
  masterTransactionId: string;
  leadId?: string;
  quoteId?: string;
  orderId?: string;
  wmsDispatchId?: string;
  invoiceId?: string;
  arPaymentId?: string;
  treasuryDepositId?: string;
  commissionId?: string;
  totalAmount: number;
  ebitdaContribution: number;
  status: 'COMPLETE' | 'IN_PROGRESS' | 'FLAGGED';
  integrityHash: string;
  tracePoints: MasterAuditTraceEvent[];
  clientName?: string;
  currency?: string;
  monetaryAmount?: number;
  isChainIntegrityValid?: boolean;
  stages?: any[];
}
