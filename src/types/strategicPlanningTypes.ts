/**
 * @license
 * CONSCORE ERP IA - Planeación Estratégica, BI Ejecutivo, OKR, Balanced Scorecard & What-If Simulator
 * FASE 12 - Definición de Tipos & Modelos de Datos
 */

export type BSCPerspective =
  | 'FINANCIERA'
  | 'CLIENTES'
  | 'PROCESOS_INTERNOS'
  | 'APRENDIZAJE_CRECIMIENTO';

export type StrategicObjectiveStatus =
  | 'NOT_STARTED'
  | 'ON_TRACK'
  | 'AT_RISK'
  | 'DELAYED'
  | 'COMPLETED'
  | 'CANCELLED';

export type StrategicPriority =
  | 'CRITICAL'
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW';

export type BSCSemaphore =
  | 'GREEN'
  | 'YELLOW'
  | 'ORANGE'
  | 'RED';

export type InitiativeStatus =
  | 'PLANNED'
  | 'ACTIVE'
  | 'BLOCKED'
  | 'COMPLETED'
  | 'CANCELLED';

export type DataHonestyTag =
  | 'REAL'
  | 'CALCULATED'
  | 'PROJECTED'
  | 'INSUFFICIENT_DATA';

export type MatrixClassification =
  | 'QUICK_WINS'
  | 'STRATEGIC'
  | 'LOW_PRIORITY'
  | 'AVOID';

export type SensitivityImpactLevel =
  | 'HIGH_IMPACT'
  | 'MEDIUM_IMPACT'
  | 'LOW_IMPACT';

export type StrategicAlertSeverity =
  | 'CRITICA'
  | 'ALTA'
  | 'MEDIA'
  | 'INFORMATIVA';

export type StrategicAlertType =
  | 'EBITDA_DROP'
  | 'MARGIN_DROP'
  | 'SALES_MISS'
  | 'CASH_RISK'
  | 'DSO_RISK'
  | 'CXP_RISK'
  | 'INVENTORY_OVERSTOCK'
  | 'STOCKOUT_RISK'
  | 'CUSTOMER_CHURN'
  | 'CAC_INCREASE'
  | 'ROAS_DECLINE'
  | 'OTIF_DECLINE'
  | 'HR_PRODUCTIVITY_DROP';

export type ActionHorizon =
  | 'HOY'
  | 'ESTA_SEMANA'
  | 'ESTE_MES';

export type ExecutiveActionStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type SimulationHorizonDays = 30 | 60 | 90 | 180 | 365;

export type PresetScenarioType =
  | 'BASE'
  | 'CONSERVADOR'
  | 'ESPERADO'
  | 'OPTIMISTA'
  | 'ESTRES_LIQUIDEZ'
  | 'EXPANSION_AGRESIVA'
  | 'PERSONALIZADO';

/**
 * 1. Objetivo Estratégico
 */
export interface StrategicObjective {
  objectiveId: string;
  code: string;
  name: string;
  description: string;
  perspective: BSCPerspective;
  ownerId: string;
  ownerName: string;
  departmentId: string;
  departmentName: string;
  startDate: string;
  targetDate: string;
  baseline: number;
  target: number;
  currentValue: number;
  unit: string;
  progress: number; // 0 - 100
  status: StrategicObjectiveStatus;
  priority: StrategicPriority;
  semaphore: BSCSemaphore;
  keyResultIds?: string[];
  initiativeIds?: string[];
  updatedAt: string;
}

/**
 * 2. Balanced Scorecard KPI Indicator
 */
export interface BSCIndicator {
  indicatorId: string;
  perspective: BSCPerspective;
  name: string;
  description: string;
  code: string;
  unit: string;
  baseline: number;
  target: number;
  currentValue: number;
  historicalPrevious: number;
  yoyChangePct: number;
  momChangePct: number;
  semaphore: BSCSemaphore;
  dataHonesty: DataHonestyTag;
  formulaDescription: string;
  owner: string;
  targetToleranceRange: {
    greenMin: number;
    yellowMin: number;
    orangeMin: number;
  };
}

/**
 * 3. OKR Key Result
 */
export interface OKRKeyResult {
  krId: string;
  objectiveId: string;
  code: string;
  title: string;
  metricName: string;
  baseline: number;
  target: number;
  currentValue: number;
  unit: string;
  progressPct: number;
  confidenceScore: number; // 0.0 to 1.0 (e.g., 0.85 = 85% confidence)
  ownerId: string;
  ownerName: string;
  deadline: string;
  status: StrategicObjectiveStatus;
  initiativesCount: number;
}

/**
 * 4. OKR Master Node
 */
export interface OKRNode {
  objective: StrategicObjective;
  keyResults: OKRKeyResult[];
  initiatives: StrategicInitiative[];
  overallProgressPct: number;
  confidenceAverage: number;
}

/**
 * 5. Plan de Acción / Iniciativa Estratégica
 */
export interface StrategicInitiative {
  initiativeId: string;
  objectiveId: string;
  objectiveName?: string;
  krId?: string;
  name: string;
  description: string;
  ownerId: string;
  ownerName: string;
  department: string;
  budget: number;
  spentBudget: number;
  expectedFinancialImpact: number;
  actualFinancialImpact: number;
  expectedImpactSummary: string;
  impactScore: number; // 1 to 10
  effortScore: number; // 1 to 10
  matrixClassification: MatrixClassification;
  startDate: string;
  targetDate: string;
  status: InitiativeStatus;
  priority: StrategicPriority;
  notes?: string;
}

/**
 * 6. Strategic Variance Record
 */
export interface StrategicVarianceItem {
  varianceId: string;
  metricCode: string;
  metricName: string;
  category: 'VENTAS' | 'RENTABILIDAD' | 'LIQUIDEZ' | 'OPERACION' | 'CLIENTES' | 'RH' | 'MARKETING';
  unit: string;
  targetValue: number;
  realValue: number;
  forecastValue: number;
  varianceVsTarget: number;
  varianceVsTargetPct: number;
  varianceVsForecast: number;
  isNegativeDeviation: boolean;
  financialImpactMXN: number;
  severity: StrategicAlertSeverity;
  responsibleOwner: string;
  suggestedCorrectionAction: string;
  detectedAt: string;
}

/**
 * 7. What-If Simulation Parameters (Variables)
 */
export interface WhatIfSimulationParameters {
  scenarioName: string;
  scenarioType: PresetScenarioType;
  horizonDays: SimulationHorizonDays;
  // Commercial & Pricing
  priceChangePct: number; // e.g. +4% = 4
  volumeChangePct: number; // e.g. +10% = 10
  // Costs & Margins
  cogsChangePct: number; // e.g. +3% = 3
  salesCommissionRateChangePct: number; // e.g. -0.5% = -0.5
  // Logistics & Operations
  logisticsCostChangePct: number; // e.g. -5% = -5
  inventoryStockIncreasePct: number; // e.g. +15% = 15
  // Marketing & Commercial Expansion
  marketingBudgetChangePct: number; // e.g. +20% = 20
  newSellersHiredCount: number; // e.g. +2 vendedores
  averageSellerQuotaMonthly: number; // e.g. 250,000 MXN
  // HR & Overhead
  salariesIncreasePct: number; // e.g. +5% = 5
  operatingExpensesChangePct: number; // e.g. +2% = 2
  // Treasury & Working Capital
  dsoDaysChange: number; // e.g. -8 days or +10 days
  dpoDaysChange: number; // e.g. +12 days or -5 days
  // Notes & Assumptions
  assumptions: string[];
  risksIdentified: string[];
}

/**
 * 8. Financial Simulation Output (SCENARIO_DATA ONLY)
 */
export interface WhatIfSimulationResult {
  simulationId: string;
  createdAt: string;
  parameters: WhatIfSimulationParameters;
  horizonDays: SimulationHorizonDays;
  dataClassification: 'SCENARIO_DATA';
  
  // Financial P&L
  simulatedRevenue: number;
  baselineRevenue: number;
  revenueDelta: number;
  revenueDeltaPct: number;

  simulatedCogs: number;
  baselineCogs: number;
  cogsDelta: number;

  simulatedGrossProfit: number;
  baselineGrossProfit: number;
  grossMarginPct: number;
  baselineGrossMarginPct: number;

  simulatedCommissions: number;
  simulatedLogisticsCost: number;
  simulatedMarketingCost: number;
  simulatedOperatingExpenses: number;

  simulatedEbitda: number;
  baselineEbitda: number;
  ebitdaDelta: number;
  ebitdaDeltaPct: number;
  ebitdaMarginPct: number;
  baselineEbitdaMarginPct: number;

  // Treasury & Working Capital
  simulatedOperatingCashFlow: number;
  baselineOperatingCashFlow: number;
  cashFlowDelta: number;

  simulatedARBalance: number;
  simulatedAPBalance: number;
  simulatedWorkingCapital: number;
  baselineWorkingCapital: number;
  workingCapitalDelta: number;
  externalFinancingRequirement: number;

  // Operational metrics
  projectedOrdersCount: number;
  projectedHeadcount: number;
  projectedInventoryValue: number;

  // Sensitivity tags
  primaryDriver: string;
  financialConvenienceScore: number; // 0 to 100
  recommendationNote: string;
}

/**
 * 9. Sensitivity Analysis Matrix
 */
export interface SensitivityVariableEffect {
  variableName: string;
  testShift: string;
  ebitdaImpactMXN: number;
  cashFlowImpactMXN: number;
  grossMarginImpactPct: number;
  workingCapitalImpactMXN: number;
  impactLevel: SensitivityImpactLevel;
  leverageRank: number;
  commentary: string;
}

/**
 * 10. Strategic Priority Matrix Item (Impact vs Effort)
 */
export interface PriorityMatrixItem {
  id: string;
  title: string;
  category: string;
  impactScore: number; // 1-10
  effortScore: number; // 1-10
  quadrant: MatrixClassification;
  estimatedReturnMXN: number;
  estimatedCostMXN: number;
  roiRatio: number;
  recommendedOwner: string;
  suggestedTimeframe: string;
}

/**
 * 11. Strategic Alert
 */
export interface StrategicAlert {
  alertId: string;
  type: StrategicAlertType;
  severity: StrategicAlertSeverity;
  metric: string;
  threshold: string;
  actual: string;
  variation: string;
  financialImpactMXN: number;
  owner: string;
  department: string;
  recommendedAction: string;
  createdAt: string;
  status: 'ACTIVA' | 'EN_REVISION' | 'MITIGADA' | 'DESCARTADA';
}

/**
 * 12. Executive Action Item
 */
export interface ExecutiveActionItem {
  actionId: string;
  horizon: ActionHorizon;
  source: 'DESVIACION_BSC' | 'ALERTA_ESTRATEGICA' | 'RECOMENDACION_IA' | 'DECISION_DIRECTOR';
  title: string;
  description: string;
  ownerId: string;
  ownerName: string;
  department: string;
  priority: StrategicPriority;
  expectedImpact: string;
  expectedFinancialImpactMXN: number;
  deadline: string;
  status: ExecutiveActionStatus;
  requiresHumanApproval: boolean;
  isHumanApproved: boolean;
  approvedBy?: string;
  approvedAt?: string;
}

/**
 * 13. Strategic Forecast Point
 */
export interface StrategicForecastPoint {
  periodLabel: string;
  actualValue?: number;
  targetValue: number;
  forecastConservative: number;
  forecastExpected: number;
  forecastOptimistic: number;
  unit: string;
  dataHonesty: DataHonestyTag;
}

export interface MultiMetricStrategicForecast {
  metricName: string;
  metricCode: string;
  unit: string;
  points: StrategicForecastPoint[];
}

/**
 * 14. Multi-Dimensional Profitability Breakdown
 */
export interface MultiDimensionalProfitabilityDimension {
  dimensionType: 'CLIENTE' | 'PRODUCTO' | 'VENDEDOR' | 'CAMPANA' | 'REGION' | 'ALMACEN' | 'CANAL';
  id: string;
  name: string;
  revenueMXN: number;
  cogsMXN: number;
  grossMarginMXN: number;
  grossMarginPct: number;
  directExpensesMXN: number; // Logistics, commissions, marketing
  contributionMarginMXN: number;
  contributionMarginPct: number;
  ebitdaMXN: number;
  ebitdaPct: number;
  orderVolume: number;
  dataHonesty: DataHonestyTag;
}

/**
 * 15. AI Strategy Advisor Protocol (18 Structured Points)
 */
export interface AIStrategyAdvisorResponse {
  queryId: string;
  // 1. PREGUNTA
  pregunta: string;
  // 2. PERIODO
  periodo: string;
  // 3. DATOS UTILIZADOS
  datosUtilizados: string[];
  // 4. DATOS REALES
  datosReales: {
    label: string;
    value: string;
    source: string;
  }[];
  // 5. DATOS CALCULADOS
  datosCalculados: {
    label: string;
    value: string;
    formula: string;
  }[];
  // 6. DATOS PROYECTADOS
  datosProyectados: {
    label: string;
    value: string;
    assumptions: string;
  }[];
  // 7. DATOS INSUFICIENTES
  datosInsuficientes: string[];
  // 8. DIAGNÓSTICO
  diagnostico: string;
  // 9. HALLAZGOS
  hallazgos: string[];
  // 10. RIESGOS
  riesgos: string[];
  // 11. OPORTUNIDADES
  oportunidades: string[];
  // 12. ESCENARIOS
  escenarios: {
    name: string;
    summary: string;
    financialOutcome: string;
  }[];
  // 13. RECOMENDACIÓN
  recomendacion: string;
  // 14. NEXT BEST ACTION
  nextBestAction: string;
  // 15. RESPONSABLE
  responsable: string;
  // 16. FECHA OBJETIVO
  fechaObjetivo: string;
  // 17. IMPACTO FINANCIERO
  impactoFinanciero: string;
  // 18. NIVEL DE CONFIANZA
  nivelDeConfianza: 'ALTA (95%)' | 'MEDIA-ALTA (85%)' | 'MEDIA (70%)' | 'PRELIMINAR (50%)';
  confidenceScoreNum: number;
}

/**
 * 16. Strategic Audit Log
 */
export interface StrategicAuditLog {
  auditId: string;
  userId: string;
  userName: string;
  userRole: string;
  timestamp: string;
  module: 'PLANEACION_ESTRATEGICA' | 'BALANCED_SCORECARD' | 'OKR' | 'WHAT_IF' | 'ACTION_CENTER';
  entityId: string;
  action: string;
  previousValue: string;
  newValue: string;
  ipAddress?: string;
}

/**
 * 17. Strategic Master Executive KPIs
 */
export interface StrategicExecutiveKPIs {
  // Ventas
  actualSalesYTD: number;
  salesTargetYTD: number;
  salesFulfillmentPct: number;
  salesForecastEOY: number;
  salesPipelineWeighted: number;
  averageOrderTicket: number;
  salesGrowthYoYPct: number;
  salesGrowthMoMPct: number;

  // Rentabilidad
  grossMarginMXN: number;
  grossMarginPct: number;
  contributionMarginMXN: number;
  contributionMarginPct: number;
  ebitdaMXN: number;
  ebitdaMarginPct: number;
  topProfitableCustomer: string;
  topProfitableProduct: string;

  // Liquidez
  cashAvailableMXN: number;
  totalAR_CXC: number;
  totalAP_CXP: number;
  dsoDays: number;
  dpoDays: number;
  projectedCashFlow30D: number;

  // Operación
  otifRatePct: number;
  inventoryTurnoverAnnual: number;
  criticalStockSkusCount: number;
  backordersMXN: number;
  warehouseCapacityUtilizedPct: number;

  // Clientes
  activeCustomersCount: number;
  newCustomersCount: number;
  customerRetentionRatePct: number;
  churnRiskCustomersCount: number;
  npsScore: number;
  averageCustomerHealthScore: number;

  // RH
  totalHeadcount: number;
  revenuePerEmployee: number;
  trainingCompliancePct: number;
  averagePerformanceScore: number;
  annualTurnoverRatePct: number;

  // Marketing
  totalLeadsCount: number;
  mqlCount: number;
  sqlCount: number;
  customerAcquisitionCostCAC: number;
  roasAverage: number;
  marketingRoiPct: number;
  marketingAttributedRevenueMXN: number;
}

/**
 * 18. Phase 12 Certification Master Result
 */
export interface Phase12CertificationItem {
  id: string;
  testName: string;
  category: string;
  expected: string;
  actual: string;
  difference: string;
  status: 'PASS' | 'FAIL' | 'WARNING' | 'INSUFFICIENT_DATA';
  details: string;
}

export interface Phase12CertificationSuiteResult {
  suiteName: string;
  executedAt: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  warningTests: number;
  dataDiscrepancies: number;
  scenarioIsolationViolations: number;
  securityViolations: number;
  aiUnauthorizedActions: number;
  overallStatus: 'PASS' | 'FAIL' | 'WARNING';
  items: Phase12CertificationItem[];
}
