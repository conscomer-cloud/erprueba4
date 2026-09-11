/**
 * @license
 * CONSCORE ERP IA - Tipos y Modelos de Servicio al Cliente, Postventa, Garantías,
 * Calidad, CAPA, NPS, Churn Risk, BI Ejecutivo y CONSCORE AI Customer Advisor
 * FASE 11: Certificación Integral Postventa y Excelencia en el Servicio
 */

import { UserRole } from './erp';

export type TicketPriority = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export type TicketStatus =
  | 'ABIERTO'
  | 'ASIGNADO'
  | 'EN_PROCESO'
  | 'ESPERA_CLIENTE'
  | 'ESPERA_INTERNA'
  | 'RESUELTO'
  | 'CERRADO'
  | 'CANCELADO';

export type TicketCategory =
  | 'CONSULTA'
  | 'RECLAMO'
  | 'ENTREGA'
  | 'PRODUCTO'
  | 'FACTURACION'
  | 'COBRANZA'
  | 'INSTALACION'
  | 'GARANTIA'
  | 'DEVOLUCION'
  | 'CALIDAD'
  | 'TECNICO'
  | 'OTRO';

export type TicketType =
  | 'INCIDENCIA_CALIDAD'
  | 'RECLAMO_GARANTIA'
  | 'SOLICITUD_DEVOLUCION'
  | 'RETRASO_ENTREGA'
  | 'ASESORIA_TECNICA'
  | 'FACTURACION_COBRANZA'
  | 'OTRO';

export type ServiceChannel =
  | 'PORTAL'
  | 'EMAIL'
  | 'TELEFONO'
  | 'WHATSAPP'
  | 'PRESENCIAL'
  | 'SISTEMA';

export type ReturnDisposition =
  | 'REINGRESO_INVENTARIO'
  | 'CUARENTENA'
  | 'MERMA_DESTRUCCION'
  | 'DEVOLUCION_PROVEEDOR';

export interface TicketComment {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  isInternal: boolean;
  content: string;
  timestamp: string;
  attachments?: string[];
}

export interface TicketTimelineEvent {
  id: string;
  action: string;
  userId: string;
  userName: string;
  timestamp: string;
  details: string;
  previousStatus?: TicketStatus;
  newStatus?: TicketStatus;
}

export interface ServiceTicket {
  id: string;
  ticketNumber: string; // e.g. "TCK-2026-0001"
  customerId: string;
  customerName: string;
  customerRfc?: string;
  customerTier?: 'A' | 'B' | 'C' | 'D';
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  salespersonId?: string;
  salespersonName?: string;
  orderId?: string;
  orderNumber?: string;
  invoiceId?: string;
  invoiceFolio?: string;
  productId?: string;
  productCode?: string;
  productName?: string;
  category: TicketCategory;
  subcategory: string;
  priority: TicketPriority;
  status: TicketStatus;
  title: string;
  description: string;
  attachments?: string[];
  assignedUserId?: string;
  assignedUserName?: string;
  department: string;
  createdAt: string;
  updatedAt: string;
  firstResponseAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  // SLA Fields
  slaRuleId?: string;
  firstResponseDeadline: string;
  resolutionDeadline: string;
  firstResponseSlaMinutes: number;
  resolutionSlaHours: number;
  slaBreached: boolean;
  firstResponseBreached: boolean;
  resolutionBreached: boolean;
  slaWarningNotified?: boolean;
  // Resolution & Quality
  resolutionSummary?: string;
  rootCause?: string;
  correctiveAction?: string;
  qualityIncidentId?: string;
  warrantyClaimId?: string;
  returnId?: string;
  customerRating?: number; // 1 to 5
  customerSatisfactionNotes?: string;
  comments: TicketComment[];
  timeline: TicketTimelineEvent[];
  idempotencyKey?: string;
}

// ==================== SLA RULES & ALERTS ====================

export interface SLARule {
  id: string;
  name: string;
  priority: TicketPriority;
  customerTier?: 'A' | 'B' | 'C' | 'D' | 'ALL';
  category?: TicketCategory | 'ALL';
  firstResponseMinutes: number;
  resolutionHours: number;
  warningThresholdPct: number; // e.g. 75%
  escalationRole: UserRole;
  isActive: boolean;
}

export interface SLAAlert {
  id: string;
  ticketId: string;
  ticketNumber: string;
  type: 'WARNING_FIRST_RESPONSE' | 'WARNING_RESOLUTION' | 'BREACH_FIRST_RESPONSE' | 'BREACH_RESOLUTION';
  severity: 'WARNING' | 'CRITICAL';
  message: string;
  elapsedPct: number;
  timeRemainingMinutes: number;
  createdAt: string;
  acknowledged: boolean;
}

// ==================== WARRANTIES & CLAIMS ====================

export type WarrantyStatus =
  | 'ACTIVA'
  | 'VENCIDA'
  | 'RECLAMADA'
  | 'EN_REVISION'
  | 'APROBADA'
  | 'RECHAZADA'
  | 'RESUELTA';

export interface WarrantyCertificate {
  id: string;
  folio: string; // e.g. "GAR-2026-0082"
  customerId: string;
  customerName: string;
  orderId: string;
  orderNumber: string;
  invoiceFolio: string;
  productId: string;
  productCode: string;
  productName: string;
  lotNumber?: string;
  quantity: number;
  unit: string;
  purchaseDate: string;
  deliveryDate: string;
  warrantyStart: string;
  warrantyEnd: string;
  warrantyMonths: number;
  termsAndConditions: string;
  status: WarrantyStatus;
  claimsCount: number;
}

export interface WarrantyClaim {
  id: string;
  claimFolio: string; // e.g. "REC-GAR-2026-0012"
  warrantyId: string;
  warrantyFolio: string;
  ticketId?: string;
  ticketNumber?: string;
  customerId: string;
  customerName: string;
  productId: string;
  productCode: string;
  productName: string;
  lotNumber?: string;
  quantityClaimed: number;
  defectDescription: string;
  installationEnvironment?: string;
  operatingTempC?: number;
  evidencePhotos: string[];
  status: WarrantyStatus;
  // AI Decision Support (Advisory only)
  aiRecommendation?: 'APPROVE' | 'REVIEW' | 'REJECT';
  aiConfidencePct?: number;
  aiAnalysisNotes?: string;
  // Human Resolution
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  decision?: 'APROBADA' | 'RECHAZADA' | 'PARCIAL';
  approvedQuantity?: number;
  replacementOrderId?: string;
  creditNoteId?: string;
  rejectionReason?: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== CUSTOMER RETURNS ====================

export type ReturnStatus =
  | 'SOLICITADA'
  | 'EN_REVISION'
  | 'AUTORIZADA'
  | 'RECOLECCION'
  | 'RECIBIDA'
  | 'INSPECCION'
  | 'APROBADA'
  | 'REEMBOLSO_O_CAMBIO'
  | 'CERRADA'
  | 'RECHAZADA';

export type ReturnReason =
  | 'PRODUCTO_DEFECTUOSO'
  | 'PRODUCTO_EQUIVOCADO'
  | 'DANADO_EN_TRANSPORTE'
  | 'EXCESO_PEDIDO_CLIENTE'
  | 'ESPECIFICACION_NO_CUMPLE'
  | 'CANCELACION_OBRA'
  | 'OTRO';

export interface CustomerReturnItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  lotNumber?: string;
  unit: string;
  quantityRequested: number;
  quantityReceived: number;
  quantityApproved: number;
  quantityRejected: number;
  unitCost: number;
  unitPrice: number;
  inspectionCondition?: 'BUEN_ESTADO' | 'DEFECTO_REPARABLE' | 'MERMA_TOTAL';
  restockWarehouseId?: string;
  restockWarehouseName?: string;
  restockLocation?: string;
  dispositionAction?: 'REINGRESO_INVENTARIO' | 'MERMA_CALIDAD' | 'DEVOLUCION_PROVEEDOR';
}

export interface CustomerReturn {
  id: string;
  returnFolio: string; // e.g. "DEV-2026-0045"
  ticketId?: string;
  ticketNumber?: string;
  customerId: string;
  customerName: string;
  orderId: string;
  orderNumber: string;
  invoiceFolio?: string;
  reason: ReturnReason;
  reasonNotes: string;
  status: ReturnStatus;
  items: CustomerReturnItem[];
  totalValue: number;
  pickupRequired: boolean;
  pickupAddress?: string;
  routeId?: string;
  receivedAt?: string;
  receivedBy?: string;
  receivedByName?: string;
  inspectionDate?: string;
  inspectedBy?: string;
  inspectedByName?: string;
  inspectionPassed: boolean;
  inspectionNotes?: string;
  inventoryMovementId?: string;
  creditNoteId?: string;
  creditNoteFolio?: string;
  refundMethod?: 'NOTA_CREDITO' | 'CAMBIO_FISICO' | 'REEMBOLSO_TRANSFERENCIA';
  authorizedBy?: string;
  authorizedByName?: string;
  authorizedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
  idempotencyKey?: string;
}

// ==================== QUALITY & CAPA ====================

export type QualitySeverity = 'CRITICA' | 'MAYOR' | 'MENOR';

export type QualityCategory =
  | 'ESPECIFICACION_TECNICA'
  | 'EMPAQUE_DANADO'
  | 'HUMEDAD_CONTAMINACION'
  | 'DIMENSIONES_FUERA_TOLERANCIA'
  | 'DENSIDAD_DIVERGENTE'
  | 'DESPRENDIMIENTO_ALUMINIO'
  | 'LOTE_INCORRECTO'
  | 'DOCUMENTACION_CALIDAD_FALTANTE';

export interface QualityIncident {
  id: string;
  incidentFolio: string; // e.g. "NC-CAL-2026-0034"
  title: string;
  date: string;
  productId: string;
  productCode: string;
  productName: string;
  lotNumber?: string;
  supplierId?: string;
  supplierName?: string;
  warehouseId?: string;
  warehouseName?: string;
  orderId?: string;
  orderNumber?: string;
  customerId?: string;
  customerName?: string;
  severity: QualitySeverity;
  category: QualityCategory;
  affectedQuantity: number;
  unit: string;
  estimatedLoss: number;
  description: string;
  rootCauseMethod: '5_WHYS' | 'ISHIKAWA' | 'FMEA' | 'DIRECTA';
  rootCauseAnalysis: string;
  evidenceUrls?: string[];
  disposition: 'CUARENTENA' | 'SCRAP' | 'REPROCESO' | 'DEVOLUCION_PROVEEDOR' | 'USO_BAJO_CONCESION';
  capaId?: string;
  capaFolio?: string;
  status: 'ABIERTA' | 'EN_INVESTIGACION' | 'EN_CAPA' | 'CERRADA';
  recordedBy: string;
  recordedByName: string;
  closedAt?: string;
}

export type CAPAStatus = 'ABIERTA' | 'EN_PROCESO' | 'EN_VERIFICACION' | 'CERRADA' | 'VENCIDA';

export interface CAPAAction {
  id: string;
  capaFolio: string; // e.g. "CAPA-2026-0015"
  incidentId: string;
  incidentFolio: string;
  title: string;
  rootCauseIdentified: string;
  correctiveAction: string;
  preventiveAction: string;
  ownerId: string;
  ownerName: string;
  targetDate: string;
  implementationDate?: string;
  verificationDate?: string;
  verifiedBy?: string;
  verifiedByName?: string;
  verificationEvidence?: string;
  effectivenessRating?: 'EFICAZ' | 'PARCIALMENTE_EFICAZ' | 'INEFICAZ';
  status: CAPAStatus;
  isOverdue: boolean;
  costEstimate: number;
  actualCost?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DefectParetoItem {
  category: string;
  count: number;
  totalLoss: number;
  pct: number;
  cumulativePct: number;
}

// ==================== CUSTOMER FEEDBACK & NPS ====================

export type SurveyType = 'NPS' | 'CSAT' | 'CES';

export interface CustomerSurvey {
  id: string;
  surveyType: SurveyType;
  customerId: string;
  customerName: string;
  orderId?: string;
  orderNumber?: string;
  salespersonId?: string;
  salespersonName?: string;
  driverId?: string;
  driverName?: string;
  routeId?: string;
  score: number; // NPS 0-10, CSAT 1-5, CES 1-7
  classification: 'PROMOTER' | 'PASSIVE' | 'DETRACTOR' | 'SATISFIED' | 'NEUTRAL' | 'UNSATISFIED';
  feedbackComments: string;
  primaryFactor: 'CALIDAD_PRODUCTO' | 'TIEMPO_ENTREGA' | 'ATENCION_ASESOR' | 'PRECIO' | 'DOCUMENTACION' | 'OTRO';
  followUpRequired: boolean;
  followUpTicketId?: string;
  followUpCompleted: boolean;
  createdAt: string;
}

export interface NPSMetrics {
  totalSurveys: number;
  promotersCount: number;
  promotersPct: number;
  passivesCount: number;
  passivesPct: number;
  detractorsCount: number;
  detractorsPct: number;
  npsScore: number; // -100 to +100
  avgCsat: number; // 1 to 5
  avgCes: number; // 1 to 7
  responseRatePct: number;
}

export interface CSATMetrics {
  totalSurveys: number;
  avgScore: number;
  satisfiedPct: number;
}

export interface CESMetrics {
  totalSurveys: number;
  avgScore: number;
  lowEffortPct: number;
}

// ==================== CUSTOMER HEALTH SCORE & CHURN RISK ====================

export type HealthScoreBand = 'VERDE' | 'AMARILLO' | 'NARANJA' | 'ROJO';
export type ChurnRiskLevel = 'BAJO' | 'MEDIO' | 'ALTO';

export interface CustomerHealthFactorBreakdown {
  purchaseFrequencyScore: number; // 0-25
  recencyScore: number; // 0-20
  marginContributionScore: number; // 0-20
  cxcPaymentPunctualityScore: number; // 0-15
  ticketsAndComplaintsScore: number; // 0-10
  npsSatisfactionScore: number; // 0-10
}

export interface CustomerHealthScoreData {
  customerId: string;
  customerCode: string;
  customerName: string;
  tier: 'A' | 'B' | 'C' | 'D';
  overallScore: number; // 0-100
  healthBand: HealthScoreBand;
  churnRisk: ChurnRiskLevel;
  churnProbabilityPct: number;
  daysSinceLastPurchase: number;
  averageMonthlyPurchases: number;
  ytdRevenue: number;
  realContributionMarginPct: number;
  openTicketsCount: number;
  warrantiesCount: number;
  returnsCount: number;
  npsScore?: number;
  overdueCxcBalance: number;
  breakdown: CustomerHealthFactorBreakdown;
  riskSignals: string[];
  aiActionRecommendation: string;
  honestyLabel: 'REAL_DATA' | 'CALCULATED_DATA' | 'PROJECTED_DATA';
}

// ==================== EXECUTIVE BI & REAL CUSTOMER PROFITABILITY ====================

export interface CustomerProfitabilityDetailed {
  customerId: string;
  customerCode: string;
  customerName: string;
  tier: 'A' | 'B' | 'C' | 'D';
  salesVolume: number;
  cogs: number; // Real Kardex Weighted Average Cost
  grossMargin: number;
  grossMarginPct: number;
  salesCommissions: number; // RH payroll records
  logisticsFreightCost: number; // Real delivery routes & fuel
  returnsCost: number; // Returns & scrap
  warrantiesCost: number; // Warranty claims
  supportCost: number; // Customer service tickets estimated labor
  realContributionMargin: number;
  realContributionMarginPct: number;
  netProfitability: number;
  netProfitabilityPct: number;
}

export interface ExecutiveCustomerServiceKPIs {
  totalTickets?: number;
  totalOpenTickets: number;
  openTickets?: number;
  criticalTicketsCount: number;
  criticalTickets?: number;
  resolvedTickets?: number;
  slaFulfillmentRatePct: number;
  slaCompliancePct?: number;
  averageFirstResponseMinutes: number;
  avgFirstResponseMinutes?: number;
  averageResolutionHours: number;
  avgResolutionHours?: number;
  activeWarrantiesCount: number;
  pendingWarrantyClaimsCount: number;
  warrantyClaimsCount?: number;
  pendingReturnsCount: number;
  returnsTotalValue: number;
  approvedReturnsValue?: number;
  activeQualityIncidentsCount: number;
  qualityIncidentsCount?: number;
  openCAPAsCount: number;
  qualityLossesYTD: number;
  globalNpsScore: number;
  npsScore?: number;
  averageCsatScore: number;
  csatScore?: number;
  averageCesScore: number;
  highRiskChurnCustomersCount: number;
  mediumRiskChurnCustomersCount: number;
  atRiskCustomersCount?: number;
  criticalChurnRiskRevenue?: number;
}

// ==================== CONSCORE AI CUSTOMER ADVISOR (15-POINT FORMAT) ====================

export interface AICustomerAdvisorResponse {
  queryId: string;
  // 1. PREGUNTA
  pregunta: string;
  // 2. PERIODO ANALIZADO
  periodoAnalizado: string;
  // 3. DATOS UTILIZADOS
  datosUtilizados: string[];
  // 4. DATOS REALES
  datosReales: string[];
  // 5. DATOS CALCULADOS
  datosCalculados: string[];
  // 6. DATOS PROYECTADOS
  datosProyectados: string[];
  // 7. DATOS INSUFICIENTES
  datosInsuficientes: string[];
  // 8. HALLAZGOS
  hallazgos: string[];
  // 9. RIESGOS
  riesgos: string[];
  // 10. OPORTUNIDADES
  oportunidades: string[];
  // 11. RECOMENDACIONES
  recomendaciones: string[];
  // 12. NEXT BEST ACTION
  nextBestAction: string;
  // 13. RESPONSABLE PROPUESTO
  responsablePropuesto: string;
  // 14. IMPACTO FINANCIERO ESTIMADO
  impactoFinancieroEstimado: string;
  // 15. NIVEL DE CONFIANZA
  nivelDeConfianza: 'ALTO (95%)' | 'MEDIO (80%)' | 'PRELIMINAR (65%)';
  generatedAt: string;
}

// ==================== MASTER CERTIFICATION PHASE 11 ====================

export interface Phase11CertificationPillar {
  pillarKey: string;
  name: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  scorePct: number;
  testsTotal: number;
  testsPassed: number;
  discrepanciesCount: number;
  details: string;
}

export interface Phase11CertificationResult {
  date: string;
  version: string;
  status: 'PASS' | 'FAIL';
  overallScorePct: number;
  pillars: Phase11CertificationPillar[];
  atomicityTestPassed: boolean;
  idempotencyTestPassed: boolean;
  financialConsistencyPassed: boolean;
  inventoryConsistencyPassed: boolean;
  auditIntegrityPassed: boolean;
  rbacEnforcementPassed: boolean;
  aiGovernanceCompliant: boolean;
  certifiedBy: string;
}
