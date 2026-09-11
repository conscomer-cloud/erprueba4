import test from 'node:test';
import assert from 'node:assert/strict';
import type { Response } from 'express';
import * as XLSX from 'xlsx';
import { EventBus } from '../../server/services/eventBus';
import { CommercialRLSService } from '../services/commercialRLSService';
import { calculateHRKPIs } from '../services/hrService';
import { createHRHandlers, HRHandlersParams } from '../context/HRContextMethods';
import { INITIAL_EMPLOYEES_20, INITIAL_ATTENDANCE_RECORDS, INITIAL_TRAINING_COURSES, INITIAL_EMPLOYEE_TRAININGS } from '../data/initialHRData';

function client(id: string, role = 'VENDEDOR') {
  const output: string[] = [];
  const state = { active: true, ended: false };
  return { output, state, value: { id, userId: id, role,
    res: { write: (data: string) => { output.push(data); return true; }, end: () => { state.ended = true; } } as unknown as Response,
    isAuthorized: () => state.active,
  } };
}

test('SSE no divulga registros y deja de enviar al revocar la sesión', () => {
  const bus = new EventBus();
  const seller = client('seller');
  bus.addClient(seller.value);
  bus.broadcast('customer_created', { id: 'secret-id', rfc: 'secret-rfc', creditLimit: 120000 });
  assert.match(seller.output[1], /"changed":true/);
  assert.doesNotMatch(seller.output.join(''), /secret|120000/);
  seller.state.active = false;
  bus.broadcast('customer_updated', { secret: true });
  assert.equal(seller.output.length, 2);
  assert.equal(seller.state.ended, true);
});

test('SSE rechaza clientes sin identidad y respeta el filtro de rol', () => {
  const bus = new EventBus();
  const anonymous = client('', '');
  const seller = client('seller');
  const finance = client('finance', 'FINANZAS');
  bus.addClient(anonymous.value);
  bus.addClient(seller.value);
  bus.addClient(finance.value);
  bus.notifyRole('FINANZAS', 'finance_updated', { bank: 'private' });
  assert.equal(anonymous.output.length, 0);
  assert.equal(anonymous.state.ended, true);
  assert.equal(seller.output.length, 1);
  assert.equal(finance.output.length, 2);
  assert.doesNotMatch(finance.output.join(''), /private/);
});

test('La alerta de duplicado ajeno no devuelve identificadores ni campos privados', () => {
  const masked = CommercialRLSService.maskCrossVendorDuplicate();
  assert.equal(masked.isCrossVendor, true);
  assert.equal(masked.id, 'PROTECTED-CROSS');
  for (const key of ['tax_id', 'rfc', 'address', 'billingAddress', 'sellerId', 'phone2', 'bankAccount']) {
    assert.equal(Object.hasOwn(masked, key), false, key);
  }
  assert.equal(masked.email, '');
});

test('RH sin registros conserva ceros y ausencia de indicadores, sin datos demo', () => {
  const kpis = calculateHRKPIs([], [], [], [], [], [], {}, [], []);
  assert.equal(kpis.todayPresent, 0);
  assert.equal(kpis.todayLate, 0);
  assert.equal(kpis.todayAbsent, 0);
  assert.equal(kpis.pendingReviewsCount, 0);
  assert.equal(kpis.totalMonthlyLaborCost, 0);
  assert.equal(kpis.topSkillsGapArea, undefined);
  assert.equal(kpis.topSalesCommissionLeader, undefined);
  assert.equal(kpis.avgAttendanceRatePct, undefined);
});

test('Asistencia diaria excluye otros días del mes', () => {
  const today = new Date().toISOString().slice(0, 10);
  const otherDay = today.slice(0, 8) + (today.endsWith('01') ? '02' : '01');
  const records = [
    { ...INITIAL_ATTENDANCE_RECORDS[0], id: 'today', date: today, status: 'PRESENT' as const },
    { ...INITIAL_ATTENDANCE_RECORDS[0], id: 'other', date: otherDay, status: 'PRESENT' as const },
  ];
  const before = structuredClone(records);
  const kpis = calculateHRKPIs([], records, [], [], [], [], {}, [], []);
  assert.equal(kpis.todayPresent, 1);
  assert.deepEqual(records, before);
});

function hrHarness(allowed = true) {
  const collections: Record<string, unknown> = {
    employees: structuredClone(INITIAL_EMPLOYEES_20), departments: [], positions: [], shifts: [],
    confidentialData: {}, employeeDocuments: [], attendanceRecords: [], absenceRequests: [], vacationBalances: [],
    commissionRules: [], commissionRecords: [], payrollPeriods: [], performanceReviews: [], employeeGoals: [],
    trainingCourses: structuredClone(INITIAL_TRAINING_COURSES), employeeTrainings: structuredClone(INITIAL_EMPLOYEE_TRAININGS),
    skills: [], employeeSkills: [], aiHRInsights: [], orders: [], auditLogs: [], notifications: [],
  };
  const params: Record<string, unknown> = { ...collections, currentUser: { id: 'test-rh', name: 'Fixture RH', role: 'RH' }, can: () => allowed };
  for (const key of Object.keys(collections)) {
    params['set' + key[0].toUpperCase() + key.slice(1)] = (value: unknown) => {
      collections[key] = typeof value === 'function' ? value(collections[key]) : value;
    };
  }
  return { collections, handlers: createHRHandlers(params as unknown as HRHandlersParams) };
}

test('Capacitación usa el mínimo del catálogo y rechaza calificaciones inválidas', () => {
  const { handlers, collections } = hrHarness();
  const training = INITIAL_EMPLOYEE_TRAININGS[0];
  const course = INITIAL_TRAINING_COURSES.find(c => c.id === training.courseId)!;
  handlers.completeTrainingCourse(training.id, course.passingScore - 1, 'must-not-certify');
  let records = collections.employeeTrainings as typeof INITIAL_EMPLOYEE_TRAININGS;
  assert.equal(records.find(t => t.id === training.id)?.status, 'FAILED');
  assert.equal(records.find(t => t.id === training.id)?.certificateReference, undefined);
  handlers.completeTrainingCourse(training.id, course.passingScore);
  records = collections.employeeTrainings as typeof INITIAL_EMPLOYEE_TRAININGS;
  assert.equal(records.find(t => t.id === training.id)?.status, 'COMPLETED');
  assert.throws(() => handlers.completeTrainingCourse(training.id, NaN), /inválida/);
  assert.throws(() => handlers.completeTrainingCourse(training.id, 101), /inválida/);
});

test('Manejadores RH niegan cambios sin permiso y no inventan nómina faltante', () => {
  const denied = hrHarness(false);
  const before = structuredClone(denied.collections);
  assert.throws(() => denied.handlers.completeTrainingCourse(INITIAL_EMPLOYEE_TRAININGS[0].id, 90), /denegado/);
  assert.throws(() => denied.handlers.calculatePayrollRun('missing'), /denegado/);
  assert.throws(() => denied.handlers.updateGoalProgress('missing', 10), /denegado/);
  assert.deepEqual(denied.collections, before);
  const allowed = hrHarness();
  allowed.handlers.calculatePayrollRun('missing');
  allowed.handlers.approvePayrollPeriod('missing');
  assert.deepEqual(allowed.collections.payrollPeriods, []);
});

test('Excel actualizado conserva números, texto y folios en lectura/escritura', () => {
  assert.equal(XLSX.version, '0.20.3');
  const rows = [{ Folio: 'TEST-0001', Descripción: 'Prueba ñ', Cantidad: 0, Precio: 12.75 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Prueba');
  const bytes = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  const result = XLSX.read(bytes, { type: 'buffer' });
  assert.deepEqual(XLSX.utils.sheet_to_json(result.Sheets.Prueba), rows);
});
