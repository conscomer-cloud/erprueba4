/**
 * @license
 * CONSCORE ERP IA - Human Resources & Talent Analytics Service
 * FASE 6: Servicios de cálculo de KPIs de RH, comisiones vinculadas a ventas,
 * pre-nómina, detección de brechas de competencias y motor CONSCORE AI RH.
 */

import {
  Employee,
  Department,
  Position,
  AttendanceRecord,
  AbsenceRequest,
  VacationBalance,
  EmployeeDocument,
  CommissionRule,
  CommissionRecord,
  PayrollPeriod,
  PerformanceReview,
  EmployeeGoal,
  TrainingCourse,
  EmployeeTraining,
  EmployeeSkill,
  AIHRAdvisorInsight,
  HRKPIs,
  Order,
  EmployeeConfidentialData,
} from '../types/erp';

// ============================================================================
// 1. CÁLCULO DE KPIS GLOBALES DE RECURSOS HUMANOS
// ============================================================================
export function calculateHRKPIs(
  employees: Employee[],
  attendance: AttendanceRecord[],
  documents: EmployeeDocument[],
  vacationRequests: AbsenceRequest[],
  performanceReviews: PerformanceReview[],
  trainings: EmployeeTraining[],
  confidentialData: Record<string, EmployeeConfidentialData>,
  commissions: CommissionRecord[],
  skills: EmployeeSkill[]
): HRKPIs {
  const todayStr = new Date().toISOString().slice(0, 10);
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.employmentStatus === 'ACTIVE' || e.status === 'ACTIVO').length;
  const probationEmployees = employees.filter((e) => e.employmentStatus === 'PROBATION' || e.status === 'PRUEBA').length;

  // Asistencia del día
  const todayAttendance = attendance.filter((a) => a.date === todayStr);
  const todayPresent = todayAttendance.filter((a) => a.status === 'PRESENT' || a.status === 'REMOTE').length;
  const todayLate = todayAttendance.filter((a) => a.status === 'LATE').length;
  const todayAbsent = todayAttendance.filter((a) => a.status === 'ABSENT' || a.status === 'JUSTIFIED').length;
  const todayVacations = vacationRequests.filter(
    (r) => r.status === 'APPROVED' && r.type === 'VACACIONES' && r.startDate <= todayStr && r.endDate >= todayStr
  ).length;

  // Solicitudes pendientes
  const pendingVacationRequests = vacationRequests.filter((r) => r.status === 'PENDING').length;
  const pendingReviewsCount = performanceReviews.filter((p) => p.status === 'IN_REVIEW' || p.status === 'EN_REVISION' || p.status === 'DRAFT' || p.status === 'BORRADOR').length;
  const pendingTrainingsCount = trainings.filter((t) => t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS').length;

  // Documentos por vencer o vencidos (en menos de 30 días)
  const now = new Date();
  const thirtyDaysAhead = new Date();
  thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30);

  const expiringDocumentsCount = documents.filter((d) => {
    if (!d.expirationDate) return false;
    const exp = new Date(d.expirationDate);
    return exp <= thirtyDaysAhead || d.status === 'POR_VENCER' || d.status === 'VENCIDO';
  }).length;

  // Costo laboral mensual estimado
  let totalMonthlyLaborCost = 0;
  Object.values(confidentialData).forEach((c) => {
    // Si la frecuencia es quincenal, multiplicamos por 2 para el mes
    const monthly = c.paymentFrequency === 'QUINCENAL' ? c.baseSalary * 2 : c.baseSalary;
    totalMonthlyLaborCost += monthly;
  });

  // Comisiones devengadas
  const totalCommissionsAccrued = commissions.reduce((acc, c) => acc + (c.commissionAmount || 0), 0);

  // Brecha de habilidad más pronunciada
  let topSkillsGapArea: { skillName: string; gapScore: number; department: string } | undefined = undefined;
  const gapSkills = skills.filter((s) => s.gap > 0).sort((a, b) => b.gap - a.gap);
  if (gapSkills.length > 0) {
    const topGap = gapSkills[0];
    const emp = employees.find((e) => e.id === topGap.employeeId);
    topSkillsGapArea = {
      skillName: topGap.skillName,
      gapScore: topGap.gap,
      department: emp?.departmentName || 'Sin departamento registrado',
    };
  }

  // Líder de comisiones
  const commissionsByEmp: Record<string, { total: number; sales: number; name: string }> = {};
  commissions.forEach((c) => {
    if (!commissionsByEmp[c.employeeId]) {
      commissionsByEmp[c.employeeId] = { total: 0, sales: 0, name: c.employeeName };
    }
    commissionsByEmp[c.employeeId].total += c.commissionAmount;
    commissionsByEmp[c.employeeId].sales += c.baseAmount;
  });

  const topLeaderEntry = Object.values(commissionsByEmp).sort((a, b) => b.total - a.total)[0];
  const topSalesCommissionLeader = topLeaderEntry
    ? {
        name: topLeaderEntry.name,
        totalCommission: topLeaderEntry.total,
        salesAmount: topLeaderEntry.sales,
      }
    : undefined;

  return {
    totalEmployees,
    activeEmployees,
    probationEmployees,
    todayPresent,
    todayLate,
    todayAbsent,
    todayVacations,
    pendingVacationRequests,
    pendingReviewsCount,
    pendingTrainingsCount,
    expiringDocumentsCount,
    totalMonthlyLaborCost,
    totalCommissionsAccrued,
    // No histórico de bajas ni población programada: no inventar porcentajes.
    avgTurnoverRatePct: undefined,
    avgAttendanceRatePct: undefined,
    topSkillsGapArea,
    topSalesCommissionLeader,
  };
}

// ============================================================================
// 2. MOTOR DE CÁLCULO DE COMISIONES BASADO EN VENTAS Y PEDIDOS REALES
// ============================================================================
export interface CalculatedCommissionResult {
  employeeId: string;
  employeeName: string;
  orderId: string;
  orderFolio: string;
  customerName: string;
  saleAmount: number;
  grossMarginAmount: number;
  grossMarginPct: number;
  appliedRule: CommissionRule;
  appliedRate: number;
  bonusAmount: number;
  totalCommission: number;
  isCompliant: boolean;
  notes: string;
}

export function calculateOrderCommission(
  order: Order,
  employee: Employee,
  rule: CommissionRule,
  salesGoalProgressPct: number = 100
): CalculatedCommissionResult {
  const saleAmount = order.total || 0;
  const grossMarginAmount = (order as any).grossMargin || saleAmount * 0.24;
  const grossMarginPct = saleAmount > 0 ? (grossMarginAmount / saleAmount) * 100 : 0;

  let appliedRate = 0;
  let bonusAmount = 0;
  let notes = '';

  const meetsMargin = !rule.minMarginRequiredPct || grossMarginPct >= rule.minMarginRequiredPct;

  if (rule.tiers && rule.tiers.length > 0) {
    // Buscar tier correspondiente
    const tier = rule.tiers.find(
      (t) => salesGoalProgressPct >= t.minPercent && salesGoalProgressPct <= t.maxPercent
    ) || rule.tiers[0];

    appliedRate = tier.rate;
    bonusAmount = tier.bonusFixed || 0;
    notes = tier.description || `Aplicado escalón ${appliedRate}%`;
  } else {
    appliedRate = 2.0;
    notes = 'Tasa estándar del 2.0%';
  }

  const isCompliant = meetsMargin;
  const totalCommission = isCompliant ? (saleAmount * appliedRate) / 100 + bonusAmount : 0;

  if (!meetsMargin) {
    notes = `Comisión bloqueada: Margen obtenido (${grossMarginPct.toFixed(1)}%) menor al mínimo requerido (${rule.minMarginRequiredPct}%).`;
  }

  return {
    employeeId: employee.id,
    employeeName: employee.name || employee.fullName || 'Vendedor',
    orderId: order.id,
    orderFolio: order.folio || order.id,
    customerName: order.customerName || 'Cliente Industrial',
    saleAmount,
    grossMarginAmount,
    grossMarginPct,
    appliedRule: rule,
    appliedRate,
    bonusAmount,
    totalCommission,
    isCompliant,
    notes,
  };
}

// ============================================================================
// 3. MOTOR CONSCORE AI PARA RECURSOS HUMANOS (ESTRICTA ESTRUCTURA OBSERVADA)
// ============================================================================
export interface AIHRAdvisorQueryRequest {
  topic: 'ALL' | 'PERFORMANCE' | 'TRAINING' | 'DOCUMENTS' | 'ATTENDANCE' | 'COMMISSIONS';
  employees: Employee[];
  attendance: AttendanceRecord[];
  goals: EmployeeGoal[];
  documents: EmployeeDocument[];
  trainings: EmployeeTraining[];
  skills: EmployeeSkill[];
  commissions: CommissionRecord[];
}

export function generateAIHRInsights(req: AIHRAdvisorQueryRequest): AIHRAdvisorInsight[] {
  const insights: AIHRAdvisorInsight[] = [];
  const nowStr = new Date().toISOString();

  // 1. Detección de brechas en capacitación vs metas comerciales
  req.skills.forEach((sk) => {
    if (sk.gap >= 1) {
      const emp = req.employees.find((e) => e.id === sk.employeeId);
      const empGoals = req.goals.filter((g) => g.employeeId === sk.employeeId);
      const isUnderperforming = empGoals.some((g) => g.progressPct < 90);

      if (emp) {
        insights.push({
          id: `AI-HR-GAP-${sk.id}`,
          code: `AI-GAP-${emp.employeeNumber || emp.id}`,
          type: 'CAPACITACION',
          title: `Oportunidad de Capacitación: ${sk.skillName} (${emp.name})`,
          dataObservation: `El colaborador ${emp.name} (${emp.positionName || 'Colaborador'}) presenta un nivel evaluado de ${sk.currentLevel}/5 frente al estándar requerido de ${sk.requiredLevel}/5 (brecha de ${sk.gap} punto/s).`,
          patternAnalysis: isUnderperforming
            ? 'Se observa correlación entre la brecha técnica y un avance comercial por debajo de la meta mensual establecida.'
            : 'El colaborador mantiene buen esfuerzo operativo pero la brecha técnica limita el escalamiento a proyectos de mayor complejidad.',
          possibleExplanation: 'Falta de refuerzo en certificaciones técnicas recientes de producto o metodología de negociación.',
          recommendation: `Asignar curso especializado de ${sk.skillName} y programar una sesión de retroalimentación 1 a 1 con su supervisor directo (${emp.managerName || 'Jefatura'}).`,
          departmentId: emp.departmentId,
          departmentName: emp.departmentName,
          employeeId: emp.id,
          employeeName: emp.name,
          impactLevel: isUnderperforming ? 'ALTO' : 'MEDIO',
          actionSuggested: `Inscribir en plan de desarrollo de competencias para ${sk.skillName}.`,
          status: 'NUEVO',
          requiresHumanApproval: true,
          createdAt: nowStr,
        });
      }
    }
  });

  // 2. Alertas de documentos legales / licencias por vencer
  const thirtyDaysAhead = new Date();
  thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30);

  req.documents.forEach((doc) => {
    if (doc.expirationDate) {
      const expDate = new Date(doc.expirationDate);
      if (expDate <= thirtyDaysAhead || doc.status === 'POR_VENCER' || doc.status === 'VENCIDO') {
        const emp = req.employees.find((e) => e.id === doc.employeeId);
        insights.push({
          id: `AI-HR-DOC-${doc.id}`,
          code: `AI-DOC-EXP-${doc.id}`,
          type: 'ALERTAS_DOCUMENTOS',
          title: `Vencimiento de Documento Obligatorio: ${doc.title}`,
          dataObservation: `El documento "${doc.title}" correspondiente al colaborador ${doc.employeeName} (${emp?.positionName || 'Personal'}) tiene fecha de vencimiento el ${doc.expirationDate}.`,
          patternAnalysis: 'El cumplimiento legal y normativo (SCT / STPS) requiere renovación anticipada para evitar suspensión de actividades o multas.',
          possibleExplanation: 'Vencimiento natural del periodo de vigencia del trámite oficial.',
          recommendation: `Notificar al colaborador y a la Jefatura de RH para iniciar de inmediato el expediente de renovación de ${doc.documentType}.`,
          departmentId: emp?.departmentId,
          departmentName: emp?.departmentName,
          employeeId: doc.employeeId,
          employeeName: doc.employeeName,
          impactLevel: 'ALTO',
          actionSuggested: 'Emitir orden de renovación y trámite administrativo ante la autoridad correspondiente.',
          status: 'NUEVO',
          requiresHumanApproval: true,
          createdAt: nowStr,
        });
      }
    }
  });

  // 3. Reconocimiento de alto rendimiento y comisiones
  req.commissions.forEach((comm) => {
    if (comm.commissionRate >= 3.5 && comm.grossMarginPct >= 24) {
      insights.push({
        id: `AI-HR-COM-${comm.id}`,
        code: `AI-COM-PERF-${comm.id}`,
        type: 'COMISIONES',
        title: `Desempeño Comercial Sobresaliente: ${comm.employeeName}`,
        dataObservation: `El vendedor ${comm.employeeName} generó la venta ${comm.orderFolio} por $${(Number(comm.baseAmount) || 0).toLocaleString('es-MX')} MXN con un margen bruto de ${comm.grossMarginPct.toFixed(1)}%, acumulando una comisión aprobada de $${(Number(comm.commissionAmount) || 0).toLocaleString('es-MX')} MXN.`,
        patternAnalysis: 'Colocación efectiva de productos de alto margen con excelente rentabilidad operativa para la empresa.',
        possibleExplanation: 'Estrategia de especificación técnica acertada con contratistas industriales.',
        recommendation: `Proceder con el pago oportuno de la comisión y registrar el caso de éxito en la bitácora de mejores prácticas comerciales.`,
        employeeId: comm.employeeId,
        employeeName: comm.employeeName,
        impactLevel: 'MEDIO',
        actionSuggested: 'Validar para inclusión en pre-nómina de la quincena correspondiente.',
        status: 'NUEVO',
        requiresHumanApproval: true,
        createdAt: nowStr,
      });
    }
  });

  // Si se solicita un filtro específico
  if (req.topic !== 'ALL') {
    return insights.filter((i) => {
      if (req.topic === 'TRAINING') return i.type === 'CAPACITACION';
      if (req.topic === 'DOCUMENTS') return i.type === 'ALERTAS_DOCUMENTOS';
      if (req.topic === 'PERFORMANCE') return i.type === 'DESEMPENO';
      if (req.topic === 'COMMISSIONS') return i.type === 'COMISIONES';
      if (req.topic === 'ATTENDANCE') return i.type === 'ASISTENCIA';
      return true;
    });
  }

  return insights;
}
