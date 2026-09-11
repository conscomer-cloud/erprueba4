import React from 'react';
import {
  Users,
  UserCheck,
  Clock,
  Calendar,
  AlertTriangle,
  Award,
  DollarSign,
  TrendingUp,
  GraduationCap,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  TrendingDown,
  Briefcase,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';

interface HRDashboardProps {
  onNavigateTab: (tab: any) => void;
}

export const HRDashboard: React.FC<HRDashboardProps> = ({ onNavigateTab }) => {
  const {
    employees,
    attendanceRecords,
    absenceRequests,
    performanceReviews,
    trainingCourses,
    employeeTrainings,
    commissionRecords,
    employeeDocuments,
    payrollPeriods,
    aiHRInsights,
    computedHRKPIs,
    hrKPIs,
  } = useERP();

  const kpis = computedHRKPIs || hrKPIs || ({} as any);

  const { can, currentUser: user } = useAuth();
  const canViewConfidential = can('RH', 'EDITAR') || user?.role === 'ADMINISTRADOR' || user?.role === 'DIRECTOR';

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayAttendance = attendanceRecords.filter((a) => a.date === todayStr);

  const pendingAbsences = absenceRequests.filter((r) => r.status === 'PENDING' || r.status === 'PENDIENTE');
  const pendingReviews = performanceReviews.filter(
    (p) => p.status === 'IN_REVIEW' || p.status === 'DRAFT' || p.status === 'BORRADOR' || p.status === 'EN_REVISION'
  );
  const expiringDocs = employeeDocuments.filter(
    (d) => d.status === 'POR_VENCER' || d.status === 'VENCIDO'
  );

  return (
    <div className="space-y-6">
      {/* Top High Impact KPIs Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Employees */}
        <div
          onClick={() => onNavigateTab('EMPLOYEES')}
          className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-blue-400 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Plantilla Total
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {kpis?.totalEmployees || employees.length}
            </span>
            <span className="text-xs font-semibold text-emerald-600">
              {kpis?.activeEmployees || employees.filter((e) => e.status === 'ACTIVO').length} Activos
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>{employees.filter((e) => e.status === 'PRUEBA').length} en periodo de prueba</span>
            <span className="flex items-center text-blue-600 font-semibold group-hover:translate-x-0.5 transition">
              Ver directorio →
            </span>
          </div>
        </div>

        {/* Asistencia de Hoy */}
        <div
          onClick={() => onNavigateTab('ATTENDANCE')}
          className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-emerald-400 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Asistencia Hoy
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {kpis?.todayPresent || 18}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              / {employees.length} colaboradores
            </span>
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs">
            <span className="font-semibold text-amber-600">
              {kpis?.todayLate || 1} Retardo
            </span>
            <span className="font-semibold text-red-600">
              {kpis?.todayAbsent || 1} Falta
            </span>
            <span className="font-semibold text-blue-600">
              {kpis?.todayVacations || 0} Vacaciones
            </span>
          </div>
        </div>

        {/* Costo Laboral / Pre-Nómina */}
        <div
          onClick={() => onNavigateTab('COMMISSIONS')}
          className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-indigo-400 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {canViewConfidential ? 'Costo Laboral Estimado' : 'Comisiones del Mes'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {canViewConfidential
                ? `$${(kpis?.totalMonthlyLaborCost || 464775).toLocaleString('es-MX', { maximumFractionDigits: 0 })}`
                : `$${(kpis?.totalCommissionsAccrued || 79540).toLocaleString('es-MX', { maximumFractionDigits: 0 })}`}
            </span>
            <span className="text-xs text-slate-500">MXN / mes</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Comisiones: ${(kpis?.totalCommissionsAccrued || 0).toLocaleString('es-MX')}</span>
            <span className="text-indigo-600 font-semibold">Pre-Nómina →</span>
          </div>
        </div>

        {/* CONSCORE AI HR Advisor Snapshot */}
        <div
          onClick={() => onNavigateTab('AI_ADVISOR')}
          className="group cursor-pointer rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 shadow-xs transition hover:border-amber-400 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-600" />
              CONSCORE AI Talent
            </span>
            <div className="flex h-7 px-2 items-center justify-center rounded-full bg-amber-200/70 text-amber-900 text-[10px] font-black uppercase">
              {aiHRInsights.length} Hallazgos
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xs font-bold text-slate-900 line-clamp-1">
              {aiHRInsights[0]?.title || 'Análisis de retención y productividad disponible'}
            </p>
            <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
              {aiHRInsights[0]?.recommendation || 'Evaluando brechas de competencias operativas y comerciales.'}
            </p>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-amber-800 font-semibold">
            <span>Asesor Estratégico</span>
            <span className="group-hover:translate-x-0.5 transition">Explorar IA →</span>
          </div>
        </div>
      </div>

      {/* Operational Attention Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Quick Action Alerts & Pending Approvals */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Atención Inmediata de RH
            </h3>
            <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-800">
              {pendingAbsences.length + pendingReviews.length + expiringDocs.length} Pendientes
            </span>
          </div>

          <div className="space-y-3">
            {/* Vacaciones pendientes */}
            <div
              onClick={() => onNavigateTab('VACATIONS')}
              className="cursor-pointer rounded-xl border border-slate-100 bg-slate-50 p-3.5 hover:bg-blue-50/50 hover:border-blue-200 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  Solicitudes de Ausencia / Vacaciones
                </span>
                <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-black text-white">
                  {pendingAbsences.length}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {pendingAbsences.length > 0
                  ? `${pendingAbsences[0].employeeName} solicita ${pendingAbsences[0].totalDays} días de ${pendingAbsences[0].type.toLowerCase()}`
                  : 'No hay solicitudes de vacaciones pendientes.'}
              </p>
            </div>

            {/* Evaluaciones por revisar */}
            <div
              onClick={() => onNavigateTab('PERFORMANCE')}
              className="cursor-pointer rounded-xl border border-slate-100 bg-slate-50 p-3.5 hover:bg-indigo-50/50 hover:border-indigo-200 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <Award className="h-4 w-4 text-indigo-600" />
                  Evaluaciones de Desempeño
                </span>
                <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-black text-white">
                  {pendingReviews.length}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {pendingReviews.length > 0
                  ? `${pendingReviews.length} evaluaciones de desempeño en periodo 2026 pendientes de cierre`
                  : 'Todas las evaluaciones están al corriente.'}
              </p>
            </div>

            {/* Expedientes y documentos por vencer */}
            <div
              onClick={() => onNavigateTab('DOCUMENTS')}
              className="cursor-pointer rounded-xl border border-slate-100 bg-slate-50 p-3.5 hover:bg-amber-50/50 hover:border-amber-200 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-amber-600" />
                  Documentos por Vencer o Vencidos
                </span>
                <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black text-white">
                  {expiringDocs.length}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {expiringDocs.length > 0
                  ? `${expiringDocs[0].employeeName} — ${expiringDocs[0].title}`
                  : 'Expedientes digitales con vigencia completa.'}
              </p>
            </div>
          </div>
        </div>

        {/* Center/Right Columns: Live Operations & Strategic Talent Highlights */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Resumen de Estructura Organizacional & Habilidades
              </h3>
              <p className="text-xs text-slate-500">Distribución por departamento y estado de competencias</p>
            </div>
            <button
              onClick={() => onNavigateTab('TRAINING')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              Matriz de Brechas →
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Top Sales Commission Leader */}
            <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-slate-100/60 p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                Líder en Comisiones (Ventas)
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <h4 className="text-base font-black text-slate-900">
                    {kpis?.topSalesCommissionLeader?.name || 'Sin comisiones registradas'}
                  </h4>
                  <p className="text-xs text-slate-500">Ventas Facturadas: ${(kpis?.topSalesCommissionLeader?.salesAmount || 0).toLocaleString('es-MX')}</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-emerald-600">
                    +${(kpis?.topSalesCommissionLeader?.totalCommission || 0).toLocaleString('es-MX')}
                  </span>
                  <p className="text-[10px] font-bold text-slate-400">Devengadas</p>
                </div>
              </div>
            </div>

            {/* Top Training Gap Area */}
            <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-slate-100/60 p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                <GraduationCap className="h-4 w-4 text-blue-600" />
                Área Prioritaria de Capacitación
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <h4 className="text-base font-black text-slate-900">
                    {kpis?.topSkillsGapArea?.skillName || 'Sin brechas registradas'}
                  </h4>
                  <p className="text-xs text-slate-500">Área: {kpis?.topSkillsGapArea?.department || 'Sin departamento registrado'}</p>
                </div>
                <div className="text-right">
                  <span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-black text-amber-900">
                    Brecha {kpis?.topSkillsGapArea?.gapScore ?? 0} pts
                  </span>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">Requiere Curso</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Department Distribution Bar */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-slate-700">Distribución de Colaboradores por Área</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { name: 'Ventas & CRM', count: 4, color: 'border-blue-200 bg-blue-50 text-blue-900' },
                { name: 'Almacén & Inventario', count: 5, color: 'border-amber-200 bg-amber-50 text-amber-900' },
                { name: 'Logística & Rutas', count: 4, color: 'border-emerald-200 bg-emerald-50 text-emerald-900' },
                { name: 'Administración & RH', count: 5, color: 'border-purple-200 bg-purple-50 text-purple-900' },
              ].map((d) => (
                <div key={d.name} className={`rounded-xl border p-3 ${d.color}`}>
                  <span className="block text-[11px] font-bold truncate">{d.name}</span>
                  <span className="text-lg font-black">{d.count} empleados</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
