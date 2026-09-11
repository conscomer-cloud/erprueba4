/**
 * @license
 * CONSCORE ERP IA - Human Resources Context Handlers
 * FASE 6: Manejadores de estado para Empleados, Asistencia, Vacaciones,
 * Compensación, Desempeño, Capacitación, Documentos y CONSCORE AI RH.
 */

import React from 'react';
import {
  Employee,
  Department,
  Position,
  Shift,
  EmployeeConfidentialData,
  EmployeeDocument,
  AttendanceRecord,
  AbsenceRequest,
  VacationBalance,
  CommissionRule,
  CommissionRecord,
  PayrollPeriod,
  PerformanceReview,
  EmployeeGoal,
  TrainingCourse,
  EmployeeTraining,
  Skill,
  EmployeeSkill,
  AIHRAdvisorInsight,
  HRKPIs,
  AuditLog,
  NotificationItem,
  UserRole,
  Order,
} from '../types/erp';
import {
  calculateHRKPIs,
  calculateOrderCommission,
  generateAIHRInsights,
} from '../services/hrService';

export interface HRHandlersParams {
  currentUser: { id: string; name: string; role: UserRole } | null;
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  departments: Department[];
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
  positions: Position[];
  setPositions: React.Dispatch<React.SetStateAction<Position[]>>;
  shifts: Shift[];
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
  confidentialData: Record<string, EmployeeConfidentialData>;
  setConfidentialData: React.Dispatch<React.SetStateAction<Record<string, EmployeeConfidentialData>>>;
  employeeDocuments: EmployeeDocument[];
  setEmployeeDocuments: React.Dispatch<React.SetStateAction<EmployeeDocument[]>>;
  attendanceRecords: AttendanceRecord[];
  setAttendanceRecords: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  absenceRequests: AbsenceRequest[];
  setAbsenceRequests: React.Dispatch<React.SetStateAction<AbsenceRequest[]>>;
  vacationBalances: VacationBalance[];
  setVacationBalances: React.Dispatch<React.SetStateAction<VacationBalance[]>>;
  commissionRules: CommissionRule[];
  setCommissionRules: React.Dispatch<React.SetStateAction<CommissionRule[]>>;
  commissionRecords: CommissionRecord[];
  setCommissionRecords: React.Dispatch<React.SetStateAction<CommissionRecord[]>>;
  payrollPeriods: PayrollPeriod[];
  setPayrollPeriods: React.Dispatch<React.SetStateAction<PayrollPeriod[]>>;
  performanceReviews: PerformanceReview[];
  setPerformanceReviews: React.Dispatch<React.SetStateAction<PerformanceReview[]>>;
  employeeGoals: EmployeeGoal[];
  setEmployeeGoals: React.Dispatch<React.SetStateAction<EmployeeGoal[]>>;
  trainingCourses: TrainingCourse[];
  setTrainingCourses: React.Dispatch<React.SetStateAction<TrainingCourse[]>>;
  employeeTrainings: EmployeeTraining[];
  setEmployeeTrainings: React.Dispatch<React.SetStateAction<EmployeeTraining[]>>;
  skills: Skill[];
  setSkills: React.Dispatch<React.SetStateAction<Skill[]>>;
  employeeSkills: EmployeeSkill[];
  setEmployeeSkills: React.Dispatch<React.SetStateAction<EmployeeSkill[]>>;
  aiHRInsights: AIHRAdvisorInsight[];
  setAiHRInsights: React.Dispatch<React.SetStateAction<AIHRAdvisorInsight[]>>;
  orders: Order[];
  auditLogs: AuditLog[];
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
  notifications: NotificationItem[];
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
}

export function createHRHandlers(params: HRHandlersParams) {
  const {
    currentUser,
    employees,
    setEmployees,
    departments,
    setDepartments,
    positions,
    setPositions,
    shifts,
    setShifts,
    confidentialData,
    setConfidentialData,
    employeeDocuments,
    setEmployeeDocuments,
    attendanceRecords,
    setAttendanceRecords,
    absenceRequests,
    setAbsenceRequests,
    vacationBalances,
    setVacationBalances,
    commissionRules,
    setCommissionRules,
    commissionRecords,
    setCommissionRecords,
    payrollPeriods,
    setPayrollPeriods,
    performanceReviews,
    setPerformanceReviews,
    employeeGoals,
    setEmployeeGoals,
    trainingCourses,
    setTrainingCourses,
    employeeTrainings,
    setEmployeeTrainings,
    skills,
    setSkills,
    employeeSkills,
    setEmployeeSkills,
    aiHRInsights,
    setAiHRInsights,
    orders,
    setAuditLogs,
    setNotifications,
  } = params;

  // Helper de log y notificación
  const logHRAction = (action: string, entityId: string, description: string, changes?: any) => {
    const newLog: AuditLog = {
      id: `AUD-HR-${Date.now()}`,
      userId: currentUser?.id || 'USR-001',
      userName: currentUser?.name || 'Administrador',
      userRole: currentUser?.role || 'ADMINISTRADOR',
      action,
      module: 'RH' as any,
      entityId,
      entityType: 'RH_ENTITY',
      details: description,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const notify = (title: string, message: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    const typeMapped: NotificationItem['type'] =
      type === 'success' ? 'EXITO' : type === 'warn' ? 'ADVERTENCIA' : type === 'error' ? 'CRITICA' : 'INFO';
    const notif: NotificationItem = {
      id: `NOTIF-HR-${Date.now()}`,
      title,
      message,
      type: typeMapped,
      module: 'RH' as any,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  // ==========================================================================
  // EMPLEADOS
  // ==========================================================================
  const addEmployee = (data: Partial<Employee>, confidential?: Partial<EmployeeConfidentialData>) => {
    const count = employees.length + 1;
    const empNum = `EMP-2026-${String(count).padStart(3, '0')}`;
    const newId = `EMP-${String(count).padStart(3, '0')}`;

    const newEmp: Employee = {
      id: newId,
      employeeNumber: empNum,
      employee_number: empNum,
      userId: data.userId,
      user_id: data.userId,
      name: data.name || data.fullName || 'Nuevo Colaborador',
      fullName: data.fullName || data.name || 'Nuevo Colaborador',
      firstName: data.firstName || 'Nuevo',
      lastName: data.lastName || 'Colaborador',
      secondLastName: data.secondLastName || '',
      email: data.email || `empleado${count}@conscore.com.mx`,
      phone: data.phone || '+52 55 5872-9400',
      departmentId: data.departmentId || 'DEP-002',
      departmentName: departments.find((d) => d.id === data.departmentId)?.name || 'Comercial & Ventas Industriales',
      positionId: data.positionId || 'POS-004',
      positionName: positions.find((p) => p.id === data.positionId)?.name || 'Ejecutiva Senior Ventas Industriales',
      position: positions.find((p) => p.id === data.positionId)?.name || 'Ejecutiva Senior Ventas Industriales',
      managerId: data.managerId,
      managerName: data.managerName,
      locationId: data.locationId || 'LOC-01',
      locationName: data.locationName || 'Matriz Tlalnepantla',
      hireDate: data.hireDate || new Date().toISOString().slice(0, 10),
      hire_date: data.hireDate || new Date().toISOString().slice(0, 10),
      employmentStatus: data.employmentStatus || 'ACTIVE',
      employment_status: data.employmentStatus || 'ACTIVE',
      employmentType: data.employmentType || 'FULL_TIME',
      employment_type: data.employmentType || 'FULL_TIME',
      shiftId: data.shiftId || 'SHF-001',
      shiftName: shifts.find((s) => s.id === data.shiftId)?.name || 'Turno Administrativo Corporativo',
      status: 'ACTIVO',
      birthday: data.birthday || '1990-01-01',
      notes: data.notes || '',
    };

    setEmployees((prev) => [...prev, newEmp]);

    if (confidential) {
      const newConf: EmployeeConfidentialData = {
        employeeId: newId,
        baseSalary: confidential.baseSalary || 20000,
        paymentFrequency: confidential.paymentFrequency || 'QUINCENAL',
        bankName: confidential.bankName || 'BBVA México',
        bankAccount: confidential.bankAccount || '',
        clabe: confidential.clabe || '',
        rfc: confidential.rfc || '',
        curp: confidential.curp || '',
        nss: confidential.nss || '',
        taxRegime: confidential.taxRegime || '605 - Sueldos y Salarios',
        benefitsPackage: confidential.benefitsPackage || ['Vales de Despensa', 'Seguro de Vida'],
        confidentialNotes: confidential.confidentialNotes || '',
        lastSalaryRevisionDate: new Date().toISOString().slice(0, 10),
      };
      setConfidentialData((prev) => ({ ...prev, [newId]: newConf }));
    }

    // Inicializar balance de vacaciones
    const newVacBalance: VacationBalance = {
      id: `VAC-${newId}`,
      employeeId: newId,
      employeeName: newEmp.name,
      period: '2026',
      entitledDays: 12,
      usedDays: 0,
      pendingDays: 0,
      remainingDays: 12,
      seniorityYears: 0,
    };
    setVacationBalances((prev) => [...prev, newVacBalance]);

    logHRAction('ALTA_EMPLEADO', newId, `Alta de nuevo colaborador ${newEmp.name} (${empNum})`);
    notify('Alta de Empleado Exitosa', `Se registró al colaborador ${newEmp.name} en el catálogo de RH.`, 'success');
    return newEmp;
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id === id) {
          const updated = { ...emp, ...updates };
          if (updates.departmentId && !updates.departmentName) {
            updated.departmentName = departments.find((d) => d.id === updates.departmentId)?.name || emp.departmentName;
          }
          if (updates.positionId && !updates.positionName) {
            updated.positionName = positions.find((p) => p.id === updates.positionId)?.name || emp.positionName;
            updated.position = updated.positionName;
          }
          return updated;
        }
        return emp;
      })
    );
    logHRAction('EDICION_EMPLEADO', id, `Actualización de datos del colaborador ID ${id}`);
    notify('Empleado Actualizado', `Los datos del colaborador fueron guardados correctamente.`, 'info');
  };

  const updateConfidentialData = (employeeId: string, data: Partial<EmployeeConfidentialData>) => {
    // Verificación de seguridad en capa de servicios
    if (currentUser?.role !== 'ADMINISTRADOR' && currentUser?.role !== 'DIRECTOR' && currentUser?.role !== 'RH') {
      notify('Acceso Denegado', 'No cuenta con permisos de nivel RH para editar datos confidenciales.', 'error');
      return;
    }

    setConfidentialData((prev) => {
      const current = prev[employeeId] || {
        employeeId,
        baseSalary: 20000,
        paymentFrequency: 'QUINCENAL',
        bankName: 'BBVA México',
        bankAccount: '',
        clabe: '',
        rfc: '',
        curp: '',
        nss: '',
        taxRegime: '605 - Sueldos y Salarios',
        benefitsPackage: [],
        lastSalaryRevisionDate: new Date().toISOString().slice(0, 10),
      };
      return {
        ...prev,
        [employeeId]: { ...current, ...data, lastSalaryRevisionDate: new Date().toISOString().slice(0, 10) },
      };
    });

    logHRAction('EDICION_DATOS_CONFIDENCIALES', employeeId, `Actualización de compensación / datos fiscales del colaborador ${employeeId}`);
    notify('Datos Confidenciales Guardados', 'Se actualizó la información salarial y bancaria protegida.', 'success');
  };

  // ==========================================================================
  // ASISTENCIA & CHECADOR
  // ==========================================================================
  const registerCheckIn = (employeeId: string, source: 'RELOJ_VIRTUAL' | 'BIOMETRICO' | 'APP_MOVIL' = 'RELOJ_VIRTUAL') => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const nowTimeStr = new Date().toTimeString().slice(0, 8);
    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) return;

    // Buscar si ya checó hoy
    const existing = attendanceRecords.find((a) => a.employeeId === employeeId && a.date === todayStr);
    if (existing) {
      notify('Registro Existente', `El colaborador ${emp.name} ya registró entrada el día de hoy a las ${existing.checkIn}.`, 'warn');
      return;
    }

    const defaultShift = { id: 'TURNO-DEFAULT', name: 'Turno Matutino', startTime: '08:30', endTime: '18:00', toleranceMinutes: 15 };
    const shift = shifts.find((s) => s.id === emp.shiftId) || shifts[0] || defaultShift;
    const shiftStartTime = shift?.startTime || '08:30';
    const scheduledCheckIn = `${shiftStartTime}:00`;

    // Cálculo de retardo
    const [schedH, schedM] = shiftStartTime.split(':').map(Number);
    const [nowH, nowM] = nowTimeStr.split(':').map(Number);
    const diffMinutes = nowH * 60 + nowM - (schedH * 60 + schedM);

    let status: 'PRESENT' | 'LATE' | 'REMOTE' = 'PRESENT';
    let delayMinutes = 0;

    const tolerance = shift?.toleranceMinutes ?? 15;
    if (diffMinutes > tolerance) {
      status = 'LATE';
      delayMinutes = diffMinutes;
    }

    const newRecord: AttendanceRecord = {
      id: `ATT-${todayStr.replace(/-/g, '')}-${employeeId}`,
      employeeId,
      employeeName: emp.name,
      employeeNumber: emp.employeeNumber || emp.id,
      date: todayStr,
      checkIn: nowTimeStr,
      scheduledCheckIn,
      delayMinutes: delayMinutes > 0 ? delayMinutes : undefined,
      shiftId: shift.id,
      shiftName: shift.name,
      status,
      source,
      notes: status === 'LATE' ? `Entrada con ${delayMinutes} min de retardo sobre tolerancia (${shift.toleranceMinutes} min)` : undefined,
    };

    setAttendanceRecords((prev) => [newRecord, ...prev]);
    logHRAction('CHECK_IN', employeeId, `Registro de entrada de ${emp.name} a las ${nowTimeStr} (${status})`);
    notify('Checada Exitosa', `Entrada registrada para ${emp.name} (${nowTimeStr}) - ${status === 'LATE' ? 'Con Retardo' : 'Puntual'}.`, status === 'LATE' ? 'warn' : 'success');
  };

  const registerCheckOut = (employeeId: string) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const nowTimeStr = new Date().toTimeString().slice(0, 8);
    const emp = employees.find((e) => e.id === employeeId);

    setAttendanceRecords((prev) =>
      prev.map((rec) => {
        if (rec.employeeId === employeeId && rec.date === todayStr) {
          return { ...rec, checkOut: nowTimeStr };
        }
        return rec;
      })
    );

    logHRAction('CHECK_OUT', employeeId, `Registro de salida de ${emp?.name || employeeId} a las ${nowTimeStr}`);
    notify('Salida Registrada', `Salida registrada para ${emp?.name || employeeId} (${nowTimeStr}).`, 'info');
  };

  // ==========================================================================
  // VACACIONES & PERMISOS
  // ==========================================================================
  const requestAbsence = (data: {
    employeeId: string;
    type: 'VACACIONES' | 'INCAPACIDAD' | 'PERMISO' | 'FALTA_JUSTIFICADA';
    startDate: string;
    endDate: string;
    reason: string;
  }) => {
    const emp = employees.find((e) => e.id === data.employeeId);
    if (!emp) return;

    // Calcular días
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const count = absenceRequests.length + 1;
    const folio = `AUS-2026-${String(count).padStart(3, '0')}`;

    const newReq: AbsenceRequest = {
      id: `AUS-${Date.now()}`,
      folio,
      employeeId: data.employeeId,
      employeeName: emp.name,
      departmentId: emp.departmentId,
      departmentName: emp.departmentName,
      type: data.type,
      startDate: data.startDate,
      endDate: data.endDate,
      totalDays,
      reason: data.reason,
      status: 'PENDING',
      requestedAt: new Date().toISOString(),
      managerId: emp.managerId,
      managerName: emp.managerName,
    };

    setAbsenceRequests((prev) => [newReq, ...prev]);

    // Actualizar pendingDays en VacationBalance
    if (data.type === 'VACACIONES') {
      setVacationBalances((prev) =>
        prev.map((b) => {
          if (b.employeeId === data.employeeId) {
            return {
              ...b,
              pendingDays: b.pendingDays + totalDays,
              remainingDays: Math.max(0, b.remainingDays - totalDays),
            };
          }
          return b;
        })
      );
    }

    logHRAction('SOLICITUD_AUSENCIA', newReq.id, `Nueva solicitud de ${data.type} por ${totalDays} días para ${emp.name}`);
    notify('Solicitud Registrada', `Se registró la solicitud de ${data.type} de ${emp.name} (${totalDays} días).`, 'info');
  };

  const reviewAbsenceRequest = (id: string, status: 'APPROVED' | 'REJECTED', comment?: string) => {
    const req = absenceRequests.find((r) => r.id === id);
    if (!req) return;

    setAbsenceRequests((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          return {
            ...r,
            status,
            reviewedBy: currentUser?.id,
            reviewedByName: currentUser?.name,
            reviewDate: new Date().toISOString().slice(0, 10),
            reviewComment: comment,
          };
        }
        return r;
      })
    );

    // Ajustar VacationBalance si fue aprobada o rechazada
    if (req.type === 'VACACIONES') {
      setVacationBalances((prev) =>
        prev.map((b) => {
          if (b.employeeId === req.employeeId) {
            if (status === 'APPROVED') {
              return {
                ...b,
                usedDays: b.usedDays + req.totalDays,
                pendingDays: Math.max(0, b.pendingDays - req.totalDays),
              };
            } else {
              return {
                ...b,
                pendingDays: Math.max(0, b.pendingDays - req.totalDays),
                remainingDays: b.remainingDays + req.totalDays,
              };
            }
          }
          return b;
        })
      );
    }

    logHRAction('REVISION_AUSENCIA', id, `Solicitud ${req.folio} ${status === 'APPROVED' ? 'Aprobada' : 'Rechazada'} por ${currentUser?.name}`);
    notify(`Solicitud ${status === 'APPROVED' ? 'Aprobada' : 'Rechazada'}`, `La solicitud de ${req.employeeName} fue procesada con éxito.`, status === 'APPROVED' ? 'success' : 'warn');
  };

  // ==========================================================================
  // DOCUMENTOS & EXPEDIENTES
  // ==========================================================================
  const addEmployeeDocument = (doc: {
    employeeId: string;
    documentType: EmployeeDocument['documentType'];
    title: string;
    fileReference: string;
    issueDate: string;
    expirationDate?: string;
    confidentialLevel?: EmployeeDocument['confidentialLevel'];
  }) => {
    const emp = employees.find((e) => e.id === doc.employeeId);
    const newDoc: EmployeeDocument = {
      id: `DOC-${Date.now()}`,
      employeeId: doc.employeeId,
      employeeName: emp?.name || 'Colaborador',
      documentType: doc.documentType,
      title: doc.title,
      fileReference: doc.fileReference,
      issueDate: doc.issueDate,
      expirationDate: doc.expirationDate,
      status: 'VIGENTE',
      uploadedBy: currentUser?.id,
      uploadedByName: currentUser?.name,
      confidentialLevel: doc.confidentialLevel || 'CONFIDENCIAL_RH',
      createdAt: new Date().toISOString(),
    };

    setEmployeeDocuments((prev) => [newDoc, ...prev]);
    logHRAction('SUBIDA_DOCUMENTO', newDoc.id, `Documento ${doc.title} anexado al expediente de ${emp?.name}`);
    notify('Documento Agregado', `El documento ${doc.title} fue registrado en el expediente digital.`, 'success');
  };

  // ==========================================================================
  // COMISIONES & VENTAS
  // ==========================================================================
  const calculateCommissionForOrderAction = (orderId: string, ruleId?: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    // Buscar vendedor correspondiente al pedido
    const sellerUser = employees.find((e) => e.userId === order.sellerId || e.name === order.sellerName || e.id === order.sellerId);
    if (!sellerUser) {
      notify('Vendedor no encontrado', 'El pedido no tiene asignado un colaborador registrado en RH.', 'warn');
      return;
    }

    const rule = commissionRules.find((r) => r.id === ruleId) || commissionRules[0];
    const calcResult = calculateOrderCommission(order, sellerUser, rule, 100);

    const count = commissionRecords.length + 1;
    const folio = `COM-2026-${String(count).padStart(3, '0')}`;

    const newRecord: CommissionRecord = {
      id: `COM-${Date.now()}`,
      folio,
      employeeId: sellerUser.id,
      employeeName: sellerUser.name,
      userId: sellerUser.userId,
      salespersonName: sellerUser.name,
      saleId: order.id,
      orderFolio: order.folio || order.id,
      customerName: order.customerName,
      baseAmount: calcResult.saleAmount,
      grossMarginAmount: calcResult.grossMarginAmount,
      grossMarginPct: calcResult.grossMarginPct,
      commissionRuleId: rule.id,
      commissionRuleName: rule.name,
      commissionRate: calcResult.appliedRate,
      commissionAmount: calcResult.totalCommission,
      status: 'CALCULATED',
      period: new Date().toISOString().slice(0, 7),
      calculatedAt: new Date().toISOString(),
      notes: calcResult.notes,
    };

    setCommissionRecords((prev) => [newRecord, ...prev]);
    logHRAction('CALCULO_COMISION', newRecord.id, `Cálculo de comisión $${newRecord.commissionAmount} para ${sellerUser.name} sobre pedido ${order.folio}`);
    notify('Comisión Calculada', `Comisión generada para ${sellerUser.name}: $${(Number(newRecord.commissionAmount) || 0).toLocaleString('es-MX')} MXN.`, 'success');
  };

  const approveCommissionRecord = (id: string) => {
    setCommissionRecords((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          return {
            ...c,
            status: 'APPROVED',
            approvedBy: currentUser?.id,
            approvedByName: currentUser?.name,
            approvedAt: new Date().toISOString(),
          };
        }
        return c;
      })
    );
    logHRAction('APROBACION_COMISION', id, `Comisión ID ${id} aprobada por ${currentUser?.name}`);
    notify('Comisión Aprobada', 'La comisión quedó autorizada para su dispersión en pre-nómina.', 'success');
  };

  // ==========================================================================
  // CAPACITACIÓN & SKILLS
  // ==========================================================================
  const assignTrainingCourse = (employeeId: string, courseId: string) => {
    const emp = employees.find((e) => e.id === employeeId);
    const course = trainingCourses.find((c) => c.id === courseId);
    if (!emp || !course) return;

    const newTrn: EmployeeTraining = {
      id: `TRN-${Date.now()}`,
      employeeId,
      employeeName: emp.name,
      courseId,
      courseName: course.name,
      category: course.category,
      assignedDate: new Date().toISOString().slice(0, 10),
      status: 'ASSIGNED',
    };

    setEmployeeTrainings((prev) => [newTrn, ...prev]);
    logHRAction('ASIGNACION_CAPACITACION', newTrn.id, `Curso ${course.name} asignado a ${emp.name}`);
    notify('Curso Asignado', `Se programó la capacitación ${course.name} para ${emp.name}.`, 'info');
  };

  const completeTrainingCourse = (trainingId: string, score: number, certificateRef?: string) => {
    setEmployeeTrainings((prev) =>
      prev.map((t) => {
        if (t.id === trainingId) {
          return {
            ...t,
            score,
            status: 'COMPLETED',
            completionDate: new Date().toISOString().slice(0, 10),
            certificateReference: certificateRef || `CERT-AUTO-${Date.now().toString().slice(-6)}`,
          };
        }
        return t;
      })
    );
    logHRAction('COMPLETADO_CAPACITACION', trainingId, `Capacitación ID ${trainingId} completada con calificación ${score}/100`);
    notify('Capacitación Acreditada', `Curso concluido satisfactoriamente con calificación de ${score} puntos.`, 'success');
  };

  // ==========================================================================
  // DESEMPEÑO & METAS
  // ==========================================================================
  const updateGoalProgress = (goalId: string, actualValue: number) => {
    setEmployeeGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          const progressPct = g.targetValue > 0 ? (actualValue / g.targetValue) * 100 : 100;
          return {
            ...g,
            actualValue,
            progressPct: Number(progressPct.toFixed(1)),
            status: progressPct >= 100 ? 'COMPLETED' : 'IN_PROGRESS',
          };
        }
        return g;
      })
    );
    logHRAction('ACTUALIZACION_META', goalId, `Actualización de progreso de objetivo a valor ${actualValue}`);
  };

  // ==========================================================================
  // CONSCORE AI RH — INSIGHTS & RECOMENDACIONES
  // ==========================================================================
  const refreshAIHRInsights = () => {
    const newInsights = generateAIHRInsights({
      topic: 'ALL',
      employees,
      attendance: attendanceRecords,
      goals: employeeGoals,
      documents: employeeDocuments,
      trainings: employeeTrainings,
      skills: employeeSkills,
      commissions: commissionRecords,
    });
    setAiHRInsights(newInsights);
    notify('CONSCORE AI RH Actualizado', `Se generaron ${newInsights.length} recomendaciones y alertas operativas de talento.`, 'info');
  };

  const approveAIInsight = (id: string) => {
    setAiHRInsights((prev) =>
      prev.map((ins) => {
        if (ins.id === id) {
          return {
            ...ins,
            status: 'APLICADO',
            appliedBy: currentUser?.id,
            appliedByName: currentUser?.name,
            appliedAt: new Date().toISOString(),
          };
        }
        return ins;
      })
    );
    logHRAction('APROBACION_AI_INSIGHT', id, `Recomendación de IA ${id} aprobada por ${currentUser?.name}`);
    notify('Acción de IA Autorizada', 'La recomendación fue aplicada y documentada en el sistema.', 'success');
  };

  const dismissAIInsight = (id: string) => {
    setAiHRInsights((prev) =>
      prev.map((ins) => (ins.id === id ? { ...ins, status: 'DESCARTADO' } : ins))
    );
    notify('Insight Descartado', 'La recomendación fue archivada.', 'info');
  };

  return {
    addEmployee,
    updateEmployee,
    updateConfidentialData,
    registerCheckIn,
    registerCheckOut,
    requestAbsence,
    reviewAbsenceRequest,
    addEmployeeDocument,
    calculateCommissionForOrderAction,
    approveCommissionRecord,
    assignTrainingCourse,
    completeTrainingCourse,
    updateGoalProgress,
    refreshAIHRInsights,
    approveAIInsight,
    dismissAIInsight,
  };
}
