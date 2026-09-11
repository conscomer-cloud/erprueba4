import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Plus,
  Clock,
  UserCheck,
  AlertCircle,
  FileText,
  Search,
  Filter,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { AbsenceRequest, AbsenceType, AbsenceStatus } from '../../types/erp';

export const VacationsAndAbsences: React.FC = () => {
  const {
    absenceRequests,
    vacationBalances,
    employees,
    requestAbsence,
    approveAbsence,
    rejectAbsence,
  } = useERP();

  const { can, user } = useAuth();
  const canApprove = can('RH', 'AUTORIZAR') || can('RH', 'EDITAR') || user?.role === 'ADMINISTRADOR' || user?.role === 'DIRECTOR';

  const [activeSubTab, setActiveSubTab] = useState<'REQUESTS' | 'BALANCES'>('REQUESTS');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal new request
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(employees[0]?.id || '');
  const [absenceType, setAbsenceType] = useState<AbsenceType>('VACACIONES');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [daysRequested, setDaysRequested] = useState(1);
  const [reason, setReason] = useState('');

  const filteredRequests = absenceRequests.filter((req) => {
    const matchesStatus = selectedStatus === 'ALL' || req.status === selectedStatus;
    const matchesSearch =
      (req.employeeName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.id || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId || !startDate || !endDate) return;

    requestAbsence({
      employeeId: selectedEmployeeId,
      type: absenceType,
      startDate,
      endDate,
      daysRequested: Number(daysRequested) || 1,
      reason,
      status: 'PENDING',
    });

    setIsModalOpen(false);
    setReason('');
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Subtabs */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Gestión de Vacaciones, Permisos & Incapacidades
            </h2>
            <p className="text-xs text-slate-500">
              Saldos de vacaciones conforme a la Ley Federal del Trabajo (LFT) y flujo de autorizaciones
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
            >
              <Plus className="h-4 w-4" />
              Nueva Solicitud
            </button>
          </div>
        </div>

        {/* Subtab Toggle */}
        <div className="flex gap-2 border-b border-slate-100 pb-2">
          <button
            onClick={() => setActiveSubTab('REQUESTS')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeSubTab === 'REQUESTS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Solicitudes de Ausencia ({absenceRequests.filter((r) => r.status === 'PENDING').length} Pendientes)
          </button>

          <button
            onClick={() => setActiveSubTab('BALANCES')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeSubTab === 'BALANCES'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Saldos de Vacaciones (LFT)
          </button>
        </div>
      </div>

      {activeSubTab === 'REQUESTS' ? (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-900 focus:outline-none"
              >
                <option value="ALL">Todos los Estados</option>
                <option value="PENDING">Pendientes de Autorización</option>
                <option value="APPROVED">Aprobadas</option>
                <option value="REJECTED">Rechazadas</option>
              </select>
            </div>

            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Buscar por colaborador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                <tr>
                  <th className="px-4 py-3">Folio</th>
                  <th className="px-4 py-3">Colaborador</th>
                  <th className="px-4 py-3">Tipo de Ausencia</th>
                  <th className="px-4 py-3">Periodo</th>
                  <th className="px-4 py-3 text-center">Días</th>
                  <th className="px-4 py-3">Motivo</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{req.id}</td>

                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-900 block">{req.employeeName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{req.employeeId}</span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-black text-blue-800 border border-blue-100">
                        {req.type}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-mono text-[11px]">
                      {req.startDate} al {req.endDate}
                    </td>

                    <td className="px-4 py-3 text-center font-bold text-slate-900">
                      {req.daysRequested}
                    </td>

                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={req.reason}>
                      {req.reason || '—'}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                          req.status === 'APPROVED' || req.status === 'APROBADA'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'REJECTED' || req.status === 'RECHAZADA'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      {(req.status === 'PENDING' || req.status === 'PENDIENTE') && canApprove && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => approveAbsence(req.id)}
                            className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 transition"
                          >
                            Aprobar
                          </button>
                          <button
                            onClick={() => rejectAbsence(req.id, 'No coincide con cobertura operativa.')}
                            className="rounded-lg border border-red-200 px-2 py-1 text-[11px] font-bold text-red-600 hover:bg-red-50 transition"
                          >
                            Rechazar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* BALANCES VIEW */
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
              Saldos de Vacaciones por Colaborador (LFT)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                <tr>
                  <th className="px-4 py-3">Colaborador</th>
                  <th className="px-4 py-3">Antigüedad</th>
                  <th className="px-4 py-3 text-center">Derecho LFT</th>
                  <th className="px-4 py-3 text-center">Gozados</th>
                  <th className="px-4 py-3 text-center">En Trámite</th>
                  <th className="px-4 py-3 text-center">Saldo Disponible</th>
                  <th className="px-4 py-3">Vigencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {vacationBalances.map((vb) => (
                  <tr key={vb.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-900 block">{vb.employeeName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{vb.employeeId}</span>
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {vb.seniorityYears || 1} {vb.seniorityYears === 1 ? 'año' : 'años'}
                    </td>

                    <td className="px-4 py-3 text-center font-bold text-slate-900">
                      {vb.entitledDays} días
                    </td>

                    <td className="px-4 py-3 text-center text-slate-500 font-semibold">
                      {vb.usedDays} días
                    </td>

                    <td className="px-4 py-3 text-center text-amber-600 font-semibold">
                      {vb.pendingDays} días
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 font-black text-emerald-800">
                        {vb.remainingDays} días
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                      {vb.expirationDate || '2026-12-31'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal New Absence Request */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                Registrar Solicitud de Ausencia / Vacaciones
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="mt-4 space-y-4 text-xs">
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
                <label className="block font-bold text-slate-700 mb-1">Tipo de Ausencia</label>
                <select
                  value={absenceType}
                  onChange={(e) => setAbsenceType(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
                >
                  <option value="VACACIONES">Vacaciones Ordinarias (LFT)</option>
                  <option value="INCAPACIDAD_IMSS">Incapacidad Médica IMSS</option>
                  <option value="PERMISO_CON_GOCE">Permiso con Goce de Sueldo</option>
                  <option value="PERMISO_SIN_GOCE">Permiso sin Goce de Sueldo</option>
                  <option value="MATERNIDAD_PATERNIDAD">Maternidad / Paternidad</option>
                  <option value="DEFUNCION">Duelo / Defunción</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha Inicio</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha Fin</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Días Hábiles Solicitados</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  required
                  value={daysRequested}
                  onChange={(e) => setDaysRequested(parseFloat(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Motivo / Observaciones</label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Detalles de la solicitud..."
                  className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white shadow-xs hover:bg-blue-700"
                >
                  Enviar Solicitud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
