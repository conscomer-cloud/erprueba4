import React, { useState } from 'react';
import {
  Award,
  Target,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Star,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { PerformanceReview, EmployeeGoal, ReviewStatus, GoalStatus } from '../../types/erp';

export const PerformanceAndGoals: React.FC = () => {
  const {
    performanceReviews,
    employeeGoals,
    employees,
    savePerformanceReview,
    createEmployeeGoal,
    updateGoalProgress,
  } = useERP();

  const { can, user } = useAuth();
  const canManageHR = can('RH', 'EDITAR') || can('RH', 'CREAR') || user?.role === 'ADMINISTRADOR' || user?.role === 'DIRECTOR';

  const [activeTab, setActiveTab] = useState<'REVIEWS' | 'GOALS'>('REVIEWS');
  const [selectedPeriod, setSelectedPeriod] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal new review
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(employees[0]?.id || '');
  const [overallScore, setOverallScore] = useState(88);
  const [reviewComments, setReviewComments] = useState('');
  const [actionPlan, setActionPlan] = useState('');

  // Modal new goal
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState(100);
  const [goalUnit, setGoalUnit] = useState<'MXN' | 'UNIDADES' | 'PCT' | 'HORAS' | 'RUTAS'>('PCT');

  const filteredReviews = performanceReviews.filter((rev) => {
    const matchesPeriod = selectedPeriod === 'ALL' || rev.period === selectedPeriod;
    const matchesSearch =
      (rev.employeeName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rev.folio || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesPeriod && matchesSearch;
  });

  const filteredGoals = employeeGoals.filter((g) => {
    return (
      (g.employeeName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.title || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((e) => e.id === selectedEmployeeId);
    if (!emp) return;

    savePerformanceReview({
      folio: `EVAL-${new Date().getFullYear()}-${(performanceReviews.length + 1).toString().padStart(3, '0')}`,
      employeeId: emp.id,
      employeeName: emp.name,
      positionName: emp.position || 'Especialista',
      departmentName: emp.department || 'Operaciones',
      reviewerId: user?.id || 'USR-001',
      reviewerName: user?.name || 'Dirección General',
      period: '2026-S1',
      reviewDate: new Date().toISOString().slice(0, 10),
      overallScore: Number(overallScore),
      categoryScores: {
        kpiAchievement: overallScore,
        competencies: overallScore - 2,
        leadership: overallScore + 1,
        values: 95,
      },
      strengths: ['Orientación a resultados', 'Compromiso con el equipo', 'Atención a clientes'],
      improvementAreas: ['Documentación de procesos', 'Uso intensivo de módulos ERP'],
      comments: reviewComments,
      actionPlan: actionPlan || 'Seguimiento mensual de objetivos y cursos de especialización.',
      status: 'COMPLETED',
    });

    setIsReviewModalOpen(false);
    setReviewComments('');
    setActionPlan('');
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((e) => e.id === selectedEmployeeId);
    if (!emp || !goalTitle) return;

    createEmployeeGoal({
      employeeId: emp.id,
      employeeName: emp.name,
      departmentName: emp.department || 'Ventas',
      title: goalTitle,
      description: `Meta estratégica establecida para el periodo 2026.`,
      metricType: 'VENTAS_TOTALES',
      metricLabel: 'Cumplimiento',
      targetValue: Number(goalTarget),
      actualValue: 0,
      unit: goalUnit,
      progressPct: 0,
      startDate: new Date().toISOString().slice(0, 10),
      dueDate: '2026-12-31',
      status: 'IN_PROGRESS',
      autoCalculated: false,
    });

    setIsGoalModalOpen(false);
    setGoalTitle('');
  };

  return (
    <div className="space-y-6">
      {/* Header & Subtabs */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-600" />
              Evaluaciones de Desempeño & Objetivos (KPIs)
            </h2>
            <p className="text-xs text-slate-500">
              Evaluación 360°, matriz de competencias y metas vinculadas a los módulos de Ventas, Almacén y Logística
            </p>
          </div>

          <div className="flex items-center gap-2">
            {canManageHR && (
              <button
                onClick={() => {
                  if (activeTab === 'REVIEWS') setIsReviewModalOpen(true);
                  else setIsGoalModalOpen(true);
                }}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
              >
                <Plus className="h-4 w-4" />
                {activeTab === 'REVIEWS' ? 'Nueva Evaluación' : 'Nuevo Objetivo'}
              </button>
            )}
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex gap-2 border-b border-slate-100 pb-2">
          <button
            onClick={() => setActiveTab('REVIEWS')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'REVIEWS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Evaluaciones de Desempeño ({performanceReviews.length})
          </button>

          <button
            onClick={() => setActiveTab('GOALS')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'GOALS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Objetivos y Metas ({employeeGoals.length})
          </button>
        </div>
      </div>

      {/* TAB 1: REVIEWS */}
      {activeTab === 'REVIEWS' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredReviews.map((rev) => (
            <div key={rev.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    {rev.folio}
                  </span>
                  <h3 className="text-base font-black text-slate-900 mt-1">{rev.employeeName}</h3>
                  <span className="text-xs text-slate-500">{rev.positionName} — {rev.departmentName}</span>
                </div>

                <div className="text-right">
                  <div className="flex items-center justify-end gap-1 text-amber-500 font-black text-lg">
                    <Star className="h-5 w-5 fill-amber-400" />
                    <span>{rev.overallScore}/100</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{rev.period}</span>
                </div>
              </div>

              {/* Subscores */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Cumplimiento KPIs</span>
                  <span className="font-black text-slate-900">{rev.categoryScores.kpiAchievement}%</span>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Competencias</span>
                  <span className="font-black text-slate-900">{rev.categoryScores.competencies}%</span>
                </div>
              </div>

              {/* Comments & Strengths */}
              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-bold text-slate-700 block">Fortalezas:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {rev.strengths.map((s, idx) => (
                      <span key={idx} className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-100">
                        ✓ {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="font-bold text-slate-700 block">Áreas de Oportunidad & Plan de Acción:</span>
                  <p className="text-slate-600 mt-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {rev.actionPlan}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: GOALS */}
      {activeTab === 'GOALS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {filteredGoals.map((goal) => (
              <div key={goal.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-xs font-bold text-slate-500">{goal.employeeName} ({goal.departmentName})</span>
                    <h3 className="text-base font-black text-slate-900 mt-0.5">{goal.title}</h3>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                      goal.status === 'COMPLETED' || goal.status === 'CUMPLIDO'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {goal.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600">{goal.description}</p>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700">
                      Avance: {(Number(goal.actualValue) || 0).toLocaleString('es-MX')} / {(Number(goal.targetValue) || 0).toLocaleString('es-MX')} {goal.unit}
                    </span>
                    <span className="text-blue-600 font-mono font-black">{goal.progressPct}%</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        goal.progressPct >= 100 ? 'bg-emerald-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${Math.min(goal.progressPct, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  <span>Vence: {goal.dueDate}</span>
                  {canManageHR && (
                    <button
                      onClick={() => {
                        const newPct = Math.min(goal.progressPct + 15, 100);
                        const newVal = (goal.targetValue * newPct) / 100;
                        updateGoalProgress(goal.id, newVal, newPct);
                      }}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700"
                    >
                      + Actualizar Avance (+15%)
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal New Review */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Award className="h-4 w-4 text-blue-600" />
                Registrar Evaluación de Desempeño 360°
              </h3>
              <button onClick={() => setIsReviewModalOpen(false)} className="text-slate-400 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveReview} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Colaborador Evaluado *</label>
                <select
                  required
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.position || 'Colaborador'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Calificación Global (0 - 100)</label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  required
                  value={overallScore}
                  onChange={(e) => setOverallScore(parseFloat(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Comentarios del Evaluador</label>
                <textarea
                  rows={2}
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  placeholder="Excelente apego a políticas y proactividad..."
                  className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Plan de Acción / Compromisos</label>
                <textarea
                  rows={2}
                  value={actionPlan}
                  onChange={(e) => setActionPlan(e.target.value)}
                  placeholder="Capacitación en técnicas de negociación y reducción de mermas..."
                  className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white shadow-xs hover:bg-blue-700"
                >
                  Guardar Evaluación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal New Goal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-600" />
                Asignar Nuevo Objetivo Estratégico
              </h3>
              <button onClick={() => setIsGoalModalOpen(false)} className="text-slate-400 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Colaborador *</label>
                <select
                  required
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.department || 'General'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Título del Objetivo *</label>
                <input
                  type="text"
                  required
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="Ej. Cumplir 100% de entregas a tiempo (OTIF)"
                  className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Meta Cuantitativa</label>
                  <input
                    type="number"
                    required
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(parseFloat(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unidad</label>
                  <select
                    value={goalUnit}
                    onChange={(e) => setGoalUnit(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="PCT">Porcentaje (%)</option>
                    <option value="MXN">Monto MXN ($)</option>
                    <option value="UNIDADES">Unidades</option>
                    <option value="RUTAS">Rutas</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white shadow-xs hover:bg-blue-700"
                >
                  Crear Objetivo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
