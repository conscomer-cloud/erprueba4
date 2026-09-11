/**
 * @license
 * CONSCORE ERP IA - Phase 16 Types
 * Inteligencia Predictiva, Operación Preventiva y Business Continuity
 */

import { UserRole } from './erp';

export type DataClassification =
  | 'REAL'
  | 'CALCULATED'
  | 'PROJECTED'
  | 'SIMULATED'
  | 'INSUFFICIENT_DATA';

export type TimeHorizon =
  | '7D'
  | '30D'
  | '60D'
  | '90D'
  | '180D'
  | '365D'
  | 'MONTH_END'
  | 'QUARTER_END';

export type PredictiveRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type PredictionType =
  | 'SALES_FORECAST'
  | 'INVENTORY_RUNOUT'
  | 'CXC_COLLECTION'
  | 'CASH_FLOW'
  | 'BOTTLENECK'
  | 'CHURN_RISK'
  | 'DISASTER_RECOVERY'
  | 'HEALTH_SCORE'
  | 'EARLY_WARNING';

export interface PredictionRecord {
  predictionId: string;
  masterTransactionId: string;
  entityType: string;
  entityId: string;
  predictionType: PredictionType;
  dataClassification: DataClassification;
  prediction: string;
  probability: number; // 0 to 100
  financialImpact: number; // in MXN
  timeHorizon: TimeHorizon;
  riskLevel: PredictiveRiskLevel;
  recommendedAction: string;
  responsibleRole: UserRole;
  targetDate: string;
  humanValidationRequired: boolean;
  createdAt: string;
  modelVersion: string;
  correlationId: string;
  dataSources: string[];
  calculationMethod: string;
  auditHash: string;
  user: string;
}

export interface SalesForecastFactor {
  name: string;
  weight: number; // percentage
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  description: string;
}

export interface SalesForecastPeriod {
  period: '7D' | '30D' | '60D' | '90D' | 'MONTH_END' | 'QUARTER_END';
  periodLabel: string;
  meta: number;
  real: number;
  forecast: number;
  variacion: number;
  cumplimientoProyectado: number; // percentage
  nivelConfianza: number; // percentage
  factors: SalesForecastFactor[];
  dataClassification: DataClassification; // always PROJECTED
  historicalTrend: Array<{ label: string; real: number; projected: number }>;
}

export interface InventoryForecastItem {
  productId: string;
  productName: string;
  sku: string;
  category: string;
  stockActual: number;
  stockComprometido: number;
  stockDisponible: number;
  demandaProyectada30D: number;
  diasEstimadosCobertura: number;
  probabilidadRuptura: number; // 0 to 100
  impactoEconomico: number;
  recomendacion: string;
  stockSeguridad: number;
  puntoReorden: number;
  tendencia: 'CRECIENTE' | 'DECRECIENTE' | 'ESTABLE';
  status:
    | 'RUPTURA_CRITICA'
    | 'REORDEN_INMEDIATO'
    | 'SOBREINVENTARIO'
    | 'BAJA_ROTACION'
    | 'INMOVILIZADO'
    | 'OPTIMO';
  dataClassification: DataClassification;
}

export interface CollectionPromise {
  id: string;
  fechaPromesa: string;
  monto: number;
  cumplida: boolean;
}

export interface CollectionForecastItem {
  customerId: string;
  customerName: string;
  taxId: string;
  saldoPendiente: number;
  dso: number; // Days Sales Outstanding
  antiguedadPromedioDias: number;
  limiteCredito: number;
  creditoUtilizadoPct: number;
  probabilidadAtraso: number; // 0 to 100
  exposicionFinanciera: number;
  nivelRiesgo: PredictiveRiskLevel;
  promesasPago: CollectionPromise[];
  incumplimientosHistoricos: number;
  comportamientoScore: number; // 0 to 100
  recomendacion: string;
  responsable: string;
  responsibleRole: UserRole;
  requiresHumanValidation: boolean;
  dataClassification: DataClassification;
}

export interface CashFlowPeriod {
  horizon: '7D' | '30D' | '60D' | '90D' | '180D' | '365D';
  horizonLabel: string;
  saldoInicial: number;
  ingresosProyectados: {
    cobranzaCxc: number;
    ventasContado: number;
    otrosIngresos: number;
    totalIngresos: number;
  };
  egresosProyectados: {
    cxpProveedores: number;
    nomina: number;
    impuestosSat: number;
    comprasDirectas: number;
    gastosOperativos: number;
    totalEgresos: number;
  };
  flujoNeto: number;
  saldoFinalProyectado: number;
  capitalTrabajo: number;
  nivelLiquidez: 'CRITICAL' | 'TIGHT' | 'ADEQUATE' | 'ROBUST';
  dataClassification: DataClassification;
}

export interface EarlyWarningAlert {
  ALERT_ID: string;
  SEVERITY: PredictiveRiskLevel;
  MODULE: 'VENTAS' | 'FINANZAS' | 'INVENTARIO' | 'OPERACION' | 'CLIENTES';
  ENTITY: string;
  CAUSE: string;
  IMPACT: string;
  FINANCIAL_IMPACT: number;
  RECOMMENDATION: string;
  OWNER: string;
  TARGET_DATE: string;
  STATUS: 'OPEN' | 'IN_REVIEW' | 'MITIGATED' | 'ESCALATED';
  DATA_CLASSIFICATION: DataClassification;
  CONFIDENCE: number;
  masterTransactionId?: string;
}

export type ContinuityStatus =
  | 'HEALTHY'
  | 'DEGRADED'
  | 'INCIDENT'
  | 'RECOVERING'
  | 'RESTORED';

export interface BusinessContinuityComponent {
  componentId: string;
  name:
    | 'Database'
    | 'API'
    | 'Authentication'
    | 'Authorization'
    | 'Realtime'
    | 'Storage'
    | 'Audit'
    | 'Integrations'
    | 'AI'
    | 'Backups'
    | 'Banking'
    | 'SAT/PAC';
  status: ContinuityStatus;
  rpo: string;
  rto: string;
  lastBackupTimestamp: string;
  sha256Integrity: string;
  replicationStatus: 'SYNCED' | 'REPLICATING' | 'DESYNC';
  affectedServices: string[];
  lastIncidentTimestamp: string | null;
  recoveryTimeActual: string;
  uptimePct: number;
}

export interface DisasterRecoveryStep {
  phase: 'DETECT' | 'ISOLATE' | 'PROTECT' | 'RECOVER' | 'RECONCILE' | 'AUDIT';
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  details: string;
  timestamp?: string;
}

export interface DisasterRecoveryScenario {
  scenarioId: string;
  name: string;
  description: string;
  targetComponent: string;
  steps: DisasterRecoveryStep[];
  status: 'IDLE' | 'SIMULATING' | 'RECOVERED' | 'FAILED';
  durationMs: number;
  isNonDestructiveSandbox: boolean;
  auditTrailId: string;
}

export type MasterTxStageName =
  | 'Lead'
  | 'Opportunity'
  | 'Quote'
  | 'Approval'
  | 'Order'
  | 'Inventory Reservation'
  | 'WMS'
  | 'Picking'
  | 'Shipment'
  | 'Invoice'
  | 'CXC'
  | 'Payment'
  | 'Bank'
  | 'Commission'
  | 'Payroll'
  | 'Profitability'
  | 'EBITDA';

export interface MasterTxStage {
  stepNumber: number;
  stageName: MasterTxStageName;
  status:
    | 'CONFIRMED'
    | 'PENDING'
    | 'FAILED'
    | 'ROLLED_BACK'
    | 'COMPENSATED'
    | 'INSUFFICIENT_DATA';
  entityId: string;
  amount: number;
  timestamp: string;
  sha256Hash: string;
  details: string;
}

export interface MasterTransactionRecoveryChain {
  masterTransactionId: string;
  customerName: string;
  stages: MasterTxStage[];
  LAST_CONFIRMED_STATE: string;
  PENDING_EVENTS: number;
  FAILED_EVENTS: number;
  ROLLED_BACK_EVENTS: number;
  COMPENSATING_EVENTS: number;
  AUDIT_EVENTS: number;
  isComplete: boolean;
  healthStatus: 'INTACT' | 'RECOVERABLE' | 'DEGRADED';
}

export interface OperationsBottleneck {
  id: string;
  problema: string;
  causaProbable: string;
  volumenAfectado: string;
  tiempoAfectado: string;
  impactoFinanciero: number;
  prioridad: PredictiveRiskLevel;
  recomendacion: string;
  modulo:
    | 'PEDIDOS'
    | 'WMS'
    | 'DESPACHO'
    | 'COMPRAS'
    | 'AUTORIZACIONES'
    | 'COBRANZA'
    | 'SOPORTE';
  responsable: string;
  responsibleRole: UserRole;
  dataClassification: DataClassification;
}

export interface HealthDimension {
  name: string;
  weight: number;
  score: number; // 0 to 100
  contribution: number;
  status: 'EXCELLENT' | 'HEALTHY' | 'RISK' | 'CRITICAL';
  kpi: string;
  trend: 'UP' | 'DOWN' | 'STABLE';
}

export interface BusinessHealthScoreBreakdown {
  overallScore: number; // 0 to 100
  rating: 'CRITICAL' | 'RISK' | 'HEALTHY' | 'EXCELLENT';
  dimensions: {
    ventas: HealthDimension;
    rentabilidad: HealthDimension;
    liquidez: HealthDimension;
    cxc: HealthDimension;
    inventarios: HealthDimension;
    operaciones: HealthDimension;
    clientes: HealthDimension;
    rh: HealthDimension;
    marketing: HealthDimension;
    riesgos: HealthDimension;
    compliance: HealthDimension;
  };
  lastUpdated: string;
}

export interface CooAdvisorAdvice {
  id: string;
  situacionActual: string;
  datosUtilizados: string[];
  datosFaltantes: string[];
  problemaDetectado: string;
  causaProbable: string;
  impactoOperativo: string;
  impactoFinanciero: number;
  riesgo: string;
  prioridad: PredictiveRiskLevel;
  oportunidad: string;
  alternativas: string[];
  recomendacion: string;
  nextBestAction: string;
  responsable: string;
  responsibleRole: UserRole;
  fechaObjetivo: string;
  kpiAfectado: string;
  impactoEsperado: string;
  nivelConfianza: number; // percentage
  clasificacionDatos: DataClassification;
  directivaHitl: string;
  auditHash: string;
}

export interface Phase16TestResult {
  testId: number;
  name: string;
  category: string;
  passed: boolean;
  details: string;
  executionMs: number;
}
