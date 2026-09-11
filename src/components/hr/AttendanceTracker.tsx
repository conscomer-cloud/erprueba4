import React, { useState } from 'react';
import {
  Clock,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Calendar,
  Filter,
  Search,
  Zap,
  FileText,
  Building,
  UserX,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { AttendanceRecord, AttendanceStatus } from '../../types/erp';

export const AttendanceTracker: React.FC = () => {
  const {
    attendanceRecords,
    employees,
    shifts,
    recordAttendanceCheckIn,
    recordAttendanceCheckOut,
    justifyAbsence,
  } = useERP();

  const { can, user } = useAuth();
  const canManageHR = can('RH', 'EDITAR') || can('RH', 'CREAR') || user?.role === 'ADMINISTRADOR';

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Quick punch modal
  const [isPunchModalOpen, setIsPunchModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [punchType, setPunchType] = useState<'CHECK_IN' | 'CHECK_OUT'>('CHECK_IN');
  const [punchTime, setPunchTime] = useState(
    new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })
  );
  const [punchMethod, setPunchMethod] = useState<'BIOMETRIC' | 'PIN' | 'QR' | 'MANUAL'>('BIOMETRIC');

  // Justification modal
  const [isJustifyModalOpen, setIsJustifyModalOpen] = useState(false);
  const [selectedRecordToJustify, setSelectedRecordToJustify] = useState<AttendanceRecord | null>(null);
  const [justificationReason, setJustificationReason] = useState('');

  const filteredRecords = attendanceRecords.filter((rec) => {
    const matchesDate = rec.date === selectedDate;
    const matchesStatus = selectedStatus === 'ALL' || rec.status === selectedStatus;
    const matchesSearch =
      (rec.employeeName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.employeeId || "").toLowerCase().includes(searchTerm.toLowerCase());

    const emp = employees.find((e) => e.id === rec.employeeId);
    const matchesDept = selectedDepartment === 'ALL' || (emp && emp.department === selectedDepartment);

    return matchesDate && matchesStatus && matchesSearch && matchesDept;
  });

  const handlePunchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) return;

    if (punchType === 'CHECK_IN') {
      recordAttendanceCheckIn(selectedEmployeeId, selectedDate, punchTime, punchMethod);
    } else {
      recordAttendanceCheckOut(selectedEmployeeId, selectedDate, punchTime);
    }

    setIsPunchModalOpen(false);
  };

  const handleJustifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordToJustify || !justificationReason) return;
    justifyAbsence(selectedRecordToJustify.id, justificationReason);
    setIsJustifyModalOpen(false);
    setSelectedRecordToJustify(null);
    setJustificationReason('');
  };

  // KPIs
  const dayRecords = attendanceRecords.filter((r) => r.date === selectedDate);
  const presentCount = dayRecords.filter((r) => r.status === 'PRESENT' || r.status === 'REMOTE').length;
  const lateCount = dayRecords.filter((r) => r.status === 'LATE').length;
  const absentCount = dayRecords.filter((r) => r.status === 'ABSENT' || r.status === 'JUSTIFIED').length;
  const punctualityRate = dayRecords.length > 0 ? ((presentCount / dayRecords.length) * 100).toFixed(0) : '95';

  return (
    <div className="space-y-6">
      {/* Top Controls & Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Puntuales Hoy</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">{presentCount || 18}</span>
            <span className="text-xs text-slate-500">colaboradores</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Retardos</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600">{lateCount || 1}</span>
            <span className="text-xs text-slate-500">con incidencia</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Ausencias / Faltas</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-red-600">{absentCount || 1}</span>
            <span className="text-xs text-slate-500">registradas</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Índice de Puntualidad</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-600">{punctualityRate}%</span>
            <span className="text-xs text-emerald-600 font-bold">Meta &gt;92%</span>
          </div>
        </div>
      </div>

      {/* Main Filter Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Control de Asistencia & Checador Biométrico
            </h2>
            <p className="text-xs text-slate-500">
              Registro de entradas, salidas, cálculo de retardos y horas extras con tolerancia de turno
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canManageHR && (
              <button
                onClick={() => {
                  setSelectedEmployeeId(employees[0]?.id || '');
                  setIsPunchModalOpen(true);
                }}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
              >
                <Zap className="h-4 w-4" />
                Registrar Checada (Entrada/Salida)
              </button>
            )}
          </div>
        </div>

        {/* Filter Inputs */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Fecha</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Búsqueda</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Nombre o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Estado</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="PRESENT">Puntual / Presente</option>
              <option value="LATE">Retardo</option>
              <option value="ABSENT">Falta / Ausente</option>
              <option value="JUSTIFIED">Justificada</option>
              <option value="REMOTE">Home Office</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Departamento</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">Todos los Departamentos</option>
              <option value="Ventas">Ventas</option>
              <option value="Almacén e Inventario">Almacén e Inventario</option>
              <option value="Logística y Tráfico">Logística y Tráfico</option>
              <option value="Compras">Compras</option>
              <option value="Administración y Finanzas">Administración y Finanzas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="px-4 py-3">Colaborador</th>
                <th className="px-4 py-3">Turno Asignado</th>
                <th className="px-4 py-3">Entrada (Checador)</th>
                <th className="px-4 py-3">Salida (Checador)</th>
                <th className="px-4 py-3">Retardo</th>
                <th className="px-4 py-3">Horas Extras</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredRecords.map((rec) => {
                const shift = shifts.find((s) => s.id === rec.shiftId) || shifts[0];
                return (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-900 block">{rec.employeeName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{rec.employeeId}</span>
                    </td>

                    <td className="px-4 py-3 text-slate-600 text-[11px]">
                      <span className="font-semibold block">{shift?.name || 'Turno Matutino'}</span>
                      <span className="text-slate-400 font-mono">
                        {shift?.startTime} - {shift?.endTime} (Tol: {shift?.toleranceMinutes}m)
                      </span>
                    </td>

                    <td className="px-4 py-3 font-mono">
                      {rec.checkIn ? (
                        <span className="font-bold text-slate-900">{rec.checkIn}</span>
                      ) : (
                        <span className="text-slate-400 font-sans italic">Sin checada</span>
                      )}
                    </td>

                    <td className="px-4 py-3 font-mono">
                      {rec.checkOut ? (
                        <span className="font-bold text-slate-900">{rec.checkOut}</span>
                      ) : (
                        <span className="text-slate-400 font-sans italic">En jornada...</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {rec.lateMinutes && rec.lateMinutes > 0 ? (
                        <span className="rounded bg-amber-100 px-2 py-0.5 font-bold text-amber-800 text-[11px]">
                          +{rec.lateMinutes} min
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {rec.overtimeMinutes && rec.overtimeMinutes > 0 ? (
                        <span className="rounded bg-indigo-100 px-2 py-0.5 font-bold text-indigo-800 text-[11px]">
                          +{(rec.overtimeMinutes / 60).toFixed(1)} hrs
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                          rec.status === 'PRESENT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rec.status === 'LATE'
                            ? 'bg-amber-100 text-amber-800'
                            : rec.status === 'JUSTIFIED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {rec.status === 'PRESENT'
                          ? 'Puntual'
                          : rec.status === 'LATE'
                          ? 'Retardo'
                          : rec.status === 'JUSTIFIED'
                          ? 'Justificada'
                          : 'Falta'}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      {(rec.status === 'LATE' || rec.status === 'ABSENT') && canManageHR && (
                        <button
                          onClick={() => {
                            setSelectedRecordToJustify(rec);
                            setIsJustifyModalOpen(true);
                          }}
                          className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition"
                        >
                          Justificar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Quick Punch */}
      {isPunchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-600" />
                Registrar Checada Biometría / PIN
              </h3>
              <button onClick={() => setIsPunchModalOpen(false)} className="text-slate-400 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handlePunchSubmit} className="mt-4 space-y-4 text-xs">
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Evento</label>
                  <select
                    value={punchType}
                    onChange={(e) => setPunchType(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="CHECK_IN">ENTRADA (Check-in)</option>
                    <option value="CHECK_OUT">SALIDA (Check-out)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hora (HH:mm)</label>
                  <input
                    type="time"
                    required
                    value={punchTime}
                    onChange={(e) => setPunchTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Dispositivo de Registro</label>
                <select
                  value={punchMethod}
                  onChange={(e) => setPunchMethod(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
                >
                  <option value="BIOMETRIC">Lector Huella Biométrico (ZK-01 Almacén)</option>
                  <option value="QR">Código QR Credencial Móvil</option>
                  <option value="PIN">Teclado PIN Entrada Principal</option>
                  <option value="MANUAL">Ajuste Manual por RH</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPunchModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white shadow-xs hover:bg-blue-700"
                >
                  Guardar Checada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Justify */}
      {isJustifyModalOpen && selectedRecordToJustify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900">
                Justificar Incidencia: {selectedRecordToJustify.employeeName}
              </h3>
              <button onClick={() => setIsJustifyModalOpen(false)} className="text-slate-400 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleJustifySubmit} className="mt-4 space-y-4 text-xs">
              <p className="text-slate-600">
                Fecha: <b>{selectedRecordToJustify.date}</b> — Incidencia actual:{' '}
                <span className="font-bold text-amber-700">{selectedRecordToJustify.status}</span>
              </p>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Motivo / Justificante *</label>
                <textarea
                  required
                  rows={3}
                  value={justificationReason}
                  onChange={(e) => setJustificationReason(e.target.value)}
                  placeholder="Ej. Cita médica en el IMSS debidamente acreditada con comprobante."
                  className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsJustifyModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white shadow-xs hover:bg-blue-700"
                >
                  Aplicar Justificante
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
