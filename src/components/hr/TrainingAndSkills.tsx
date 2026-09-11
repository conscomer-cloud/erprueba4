import React, { useState } from 'react';
import {
  GraduationCap,
  Award,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  BarChart3,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { TrainingCourse, EmployeeTraining, EmployeeSkill } from '../../types/erp';

export const TrainingAndSkills: React.FC = () => {
  const {
    trainingCourses,
    employeeTrainings,
    employeeSkills,
    employees,
    assignCourseToEmployee,
    recordSkillEvaluation,
    updateTrainingStatus,
  } = useERP();

  const { can, user } = useAuth();
  const canManageHR = can('RH', 'EDITAR') || can('RH', 'CREAR') || user?.role === 'ADMINISTRADOR';

  const [activeTab, setActiveTab] = useState<'COURSES' | 'ASSIGNMENTS' | 'SKILLS_MATRIX'>('COURSES');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal assign course
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState(trainingCourses[0]?.id || '');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(employees[0]?.id || '');

  const filteredCourses = trainingCourses.filter(
    (c) =>
      (c.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.code || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTrainings = employeeTrainings.filter(
    (t) =>
      (t.employeeName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.courseName || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAssignCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !selectedEmployeeId) return;

    assignCourseToEmployee(selectedEmployeeId, selectedCourseId);
    setIsAssignModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Subtabs */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              Capacitación, Planes de Carrera & Matriz de Habilidades
            </h2>
            <p className="text-xs text-slate-500">
              Catálogo de cursos técnicos, normativos y comerciales, constancias DC-3 y detección de brechas de talento
            </p>
          </div>

          <div className="flex items-center gap-2">
            {canManageHR && (
              <button
                onClick={() => setIsAssignModalOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
              >
                <Plus className="h-4 w-4" />
                Asignar Curso a Colaborador
              </button>
            )}
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex gap-2 border-b border-slate-100 pb-2">
          <button
            onClick={() => setActiveTab('COURSES')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'COURSES'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Catálogo de Cursos ({trainingCourses.length})
          </button>

          <button
            onClick={() => setActiveTab('ASSIGNMENTS')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'ASSIGNMENTS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Capacitaciones Asignadas ({employeeTrainings.length})
          </button>

          <button
            onClick={() => setActiveTab('SKILLS_MATRIX')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'SKILLS_MATRIX'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Matriz de Brechas de Competencias
          </button>
        </div>
      </div>

      {/* TAB 1: COURSES CATALOG */}
      {activeTab === 'COURSES' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <div key={course.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded bg-blue-100 px-2 py-0.5 font-mono text-[10px] font-black text-blue-900">
                    {course.code}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">{course.durationHours} hrs</span>
                </div>

                <h3 className="text-base font-black text-slate-900 mt-2">{course.name}</h3>
                <p className="text-xs text-slate-600 mt-1">{course.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Modalidad: <b className="text-slate-800">{course.modality}</b></span>
                  <span>Aprobación: <b className="text-slate-800">{course.passingScore}%</b></span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Instructor: {course.instructor}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: ASSIGNMENTS */}
      {activeTab === 'ASSIGNMENTS' && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                <tr>
                  <th className="px-4 py-3">Colaborador</th>
                  <th className="px-4 py-3">Curso Asignado</th>
                  <th className="px-4 py-3">Fecha de Asignación</th>
                  <th className="px-4 py-3 text-center">Calificación</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredTrainings.map((train) => (
                  <tr key={train.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-900 block">{train.employeeName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{train.employeeId}</span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-900 block">{train.courseName}</span>
                      <span className="text-[10px] text-slate-500">{train.category}</span>
                    </td>

                    <td className="px-4 py-3 font-mono text-[11px]">
                      {train.assignedDate}
                    </td>

                    <td className="px-4 py-3 text-center font-mono font-bold text-slate-900">
                      {train.score !== undefined ? `${train.score}%` : '—'}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                          train.status === 'COMPLETED' || train.status === 'COMPLETADO'
                            ? 'bg-emerald-100 text-emerald-800'
                            : train.status === 'IN_PROGRESS' || train.status === 'EN_CURSO'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {train.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      {train.status !== 'COMPLETED' && canManageHR && (
                        <button
                          onClick={() => updateTrainingStatus(train.id, 'COMPLETED', 95)}
                          className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 transition"
                        >
                          Acreditar (95%)
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SKILLS MATRIX & GAPS */}
      {activeTab === 'SKILLS_MATRIX' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-black text-slate-900 mb-3">
              Matriz de Competencias: Nivel Requerido vs Nivel Actual
            </h3>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {employeeSkills.map((sk) => (
                <div key={sk.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-500">{sk.employeeName}</span>
                      <h4 className="text-sm font-black text-slate-900">{sk.skillName}</h4>
                    </div>

                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase ${
                        sk.gap > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {sk.gap > 0 ? `Brecha: ${sk.gap} nivel(es)` : 'Competente'}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Nivel Actual: <b>{sk.currentLevel}/5</b></span>
                      <span>Nivel Requerido: <b>{sk.requiredLevel}/5</b></span>
                    </div>

                    <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden flex">
                      <div
                        className="bg-blue-600 h-full"
                        style={{ width: `${(sk.currentLevel / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Assign Course */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-blue-600" />
                Asignar Curso de Capacitación
              </h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-slate-400 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignCourse} className="mt-4 space-y-4 text-xs">
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
                      {e.name} ({e.position || 'Colaborador'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Curso a Impartir *</label>
                <select
                  required
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
                >
                  {trainingCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.name} ({c.durationHours} hrs)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white shadow-xs hover:bg-blue-700"
                >
                  Confirmar Asignación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
