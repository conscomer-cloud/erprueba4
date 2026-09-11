import React, { Component, useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  Building,
  Shield,
  Eye,
  EyeOff,
  Edit2,
  CheckCircle2,
  XCircle,
  FileText,
  DollarSign,
  UserCheck,
  Calendar,
  Lock,
  Sparkles,
  Award,
  RefreshCw,
  AlertCircle,
  Briefcase,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { Employee, EmployeeConfidentialData } from '../../types/erp';
import { ErrorBoundaryProps, ErrorBoundaryState } from '../../types/errorBoundary';

// Safe Error Boundary for Employee Directory


export class EmployeeDirectoryErrorBoundary extends (React.Component as any)<ErrorBoundaryProps, ErrorBoundaryState> {
  props!: ErrorBoundaryProps;
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorMsg: error?.message || 'Error inesperado renderizando colaboradores.' };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('[EmployeeDirectory] Error capturado:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center shadow-xs">
          <AlertCircle className="mx-auto h-8 w-8 text-red-600 mb-2" />
          <h3 className="text-sm font-black text-red-900">Error al desplegar colaboradores</h3>
          <p className="text-xs text-red-700 mt-1 max-w-md mx-auto">{this.state.errorMsg}</p>
          <button
            onClick={() => this.setState({ hasError: false, errorMsg: '' })}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reintentar Carga
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const EmployeeDirectoryInner: React.FC = () => {
  const {
    employees = [],
    departments = [],
    positions = [],
    shifts = [],
    confidentialData = {},
    createEmployee,
    updateEmployee,
    updateConfidentialData,
    users = [],
  } = useERP();

  const { can, user } = useAuth();
  const isHRUser = user?.role === 'RH';
  const isAdminOrDirector = user?.role === 'ADMINISTRADOR' || user?.role === 'DIRECTOR';
  const canManageHR = isHRUser || isAdminOrDirector || can('RH', 'EDITAR') || can('RH', 'CREAR');
  const canViewConfidential = isHRUser || isAdminOrDirector || can('RH', 'AUTORIZAR') || can('RH', 'EDITAR');
  const canViewModule = isHRUser || isAdminOrDirector || user?.role === 'FINANZAS' || user?.role === 'GERENTE_VENTAS' || can('RH', 'VER') || can('RH', 'VIEW');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [showConfidential, setShowConfidential] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewEmployeeModalOpen, setIsNewEmployeeModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for new/edit employee
  const [formData, setFormData] = useState<Partial<Employee>>({});
  const [confidentialFormData, setConfidentialFormData] = useState<Partial<EmployeeConfidentialData>>({});

  // Memoized safe employees filter
  const filteredEmployees = useMemo(() => {
    return (employees || []).filter((emp) => {
      if (!emp) return false;
      const empName = emp.name || (emp as any).fullName || '';
      const fullName = `${empName} ${emp.firstName || ''} ${emp.lastName || ''} ${emp.employeeNumber || (emp as any).employee_number || emp.id || ''}`.toLowerCase();
      const pos = (emp.position || (emp as any).positionName || '').toLowerCase();
      const email = (emp.email || '').toLowerCase();
      const q = (searchTerm || '').trim().toLowerCase();

      const matchesSearch = !q || fullName.includes(q) || pos.includes(q) || email.includes(q);

      const matchesDept =
        selectedDepartment === 'ALL' ||
        emp.department === selectedDepartment ||
        (emp as any).departmentName === selectedDepartment ||
        emp.departmentId === selectedDepartment;

      const matchesStatus =
        selectedStatus === 'ALL' ||
        emp.status === selectedStatus ||
        emp.employmentStatus === selectedStatus;

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [employees, searchTerm, selectedDepartment, selectedStatus]);

  // Statistics counters
  const totalCount = (employees || []).length;
  const activeCount = (employees || []).filter((e) => e && (e.status === 'ACTIVO' || e.employmentStatus === 'ACTIVE')).length;
  const withUserCount = (employees || []).filter((e) => {
    if (!e) return false;
    return (users || []).some((u) => u && (u.id === e.userId || (u as any).employee_id === e.id || u.employeeId === e.id));
  }).length;

  if (!canViewModule) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center shadow-xs">
        <Shield className="mx-auto h-10 w-10 text-amber-600 mb-3" />
        <h3 className="text-base font-black text-amber-900">Módulo de Colaboradores Restringido</h3>
        <p className="text-xs text-amber-700 mt-1 max-w-lg mx-auto">
          Tu rol actual (<span className="font-bold">{user?.role || 'USUARIO'}</span>) no cuenta con privilegios de lectura para el catálogo de personal de Recursos Humanos. Contacta a la Dirección o al Administrador del sistema para solicitar acceso.
        </p>
      </div>
    );
  }

  const handleOpenEdit = (emp: Employee) => {
    setSelectedEmployee(emp);
    setFormData({ ...emp });
    const conf = (confidentialData && confidentialData[emp.id]) || (emp as any).confidentialData || {
      employeeId: emp.id,
      baseSalary: 20000,
      paymentFrequency: 'QUINCENAL',
      bankName: 'BBVA México',
      bankAccount: '',
      clabe: '',
      rfc: '',
      curp: '',
      nss: '',
    };
    setConfidentialFormData({ ...conf });
    setIsEditModalOpen(true);
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const name = (formData.name || (formData as any).fullName || '').trim();
    if (!name) {
      alert('Por favor especifica el nombre del colaborador.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isNewEmployeeModalOpen) {
        const count = (employees || []).length + 1;
        const newId = `EMP-${String(count).padStart(3, '0')}`;
        const employeeNumber = formData.employeeNumber || (formData as any).employee_number || `CON-${String(count).padStart(3, '0')}`;

        const newEmp: Employee = {
          id: newId,
          employeeNumber,
          employee_number: employeeNumber,
          name,
          fullName: name,
          firstName: formData.firstName || name.split(' ')[0] || 'Colaborador',
          lastName: formData.lastName || name.split(' ').slice(1).join(' ') || '',
          secondLastName: formData.secondLastName || '',
          email: formData.email || `empleado${count}@conscore.com.mx`,
          phone: formData.phone || '+52 55 5872-9400',
          department: formData.department || (departments[0]?.name || 'Operaciones & Producción'),
          departmentId: formData.departmentId || (departments[0]?.id || 'DEP-03'),
          position: formData.position || 'Especialista',
          positionId: formData.positionId || 'POS-004',
          employmentStatus: formData.employmentStatus || 'ACTIVE',
          status: (formData.status as any) || 'ACTIVO',
          hireDate: formData.hireDate || new Date().toISOString().slice(0, 10),
          shiftId: formData.shiftId || 'SHF-001',
          userId: formData.userId || undefined,
          salesExecutiveId: (formData as any).salesExecutiveId || undefined,
        };

        createEmployee(newEmp);

        if (confidentialFormData.baseSalary) {
          updateConfidentialData(newEmp.id, {
            employeeId: newEmp.id,
            rfc: confidentialFormData.rfc || '',
            curp: confidentialFormData.curp || '',
            nss: confidentialFormData.nss || '',
            baseSalary: Number(confidentialFormData.baseSalary) || 20000,
            paymentFrequency: confidentialFormData.paymentFrequency || 'QUINCENAL',
            clabe: (confidentialFormData as any).clabe || (confidentialFormData as any).bankAccountClabe || '',
            bankAccount: (confidentialFormData as any).bankAccount || '',
            bankName: confidentialFormData.bankName || 'BBVA México',
          });
        }

        // Background server persistence attempt
        const token = localStorage.getItem('conscore_auth_token') || localStorage.getItem('conscore_auth_token');
        if (token) {
          fetch('/api/hr/employees', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ ...newEmp, confidentialData: confidentialFormData }),
          }).catch((err) => console.warn('[HR] Sync aviso:', err));
        }

        setIsNewEmployeeModalOpen(false);
      } else if (selectedEmployee) {
        // Safe update retaining primary ID & salesExecutiveId
        const safeUpdates: Partial<Employee> = {
          ...formData,
          id: selectedEmployee.id,
          employeeNumber: selectedEmployee.employeeNumber || (selectedEmployee as any).employee_number,
          salesExecutiveId: (selectedEmployee as any).salesExecutiveId,
          userId: formData.userId !== undefined ? formData.userId : (selectedEmployee as any).userId,
        };

        updateEmployee(selectedEmployee.id, safeUpdates);

        if (canViewConfidential && confidentialFormData.baseSalary !== undefined) {
          updateConfidentialData(selectedEmployee.id, confidentialFormData);
        }

        // Background server persistence attempt
        const token = localStorage.getItem('conscore_auth_token') || localStorage.getItem('conscore_auth_token');
        if (token) {
          fetch(`/api/hr/employees/${selectedEmployee.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ ...safeUpdates, confidentialData: confidentialFormData }),
          }).catch((err) => console.warn('[HR] Sync aviso:', err));
        }

        setIsEditModalOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Plantilla</span>
          <span className="text-xl font-black text-slate-900 mt-1 block">{totalCount} Colaboradores</span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Activos</span>
          <span className="text-xl font-black text-emerald-600 mt-1 block">{activeCount} Operando</span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Departamentos</span>
          <span className="text-xl font-black text-blue-600 mt-1 block">{(departments || []).length} Áreas</span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Acceso ERP</span>
          <span className="text-xl font-black text-indigo-600 mt-1 block">{withUserCount} Usuarios Vinculados</span>
        </div>
      </div>

      {/* Action Header & Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Directorio Maestro de Colaboradores
            </h2>
            <p className="text-xs text-slate-500">
              Expedientes integrales vinculados a roles RBAC, credenciales ERP y registros de asistencia
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canViewConfidential && (
              <button
                type="button"
                onClick={() => setShowConfidential(!showConfidential)}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition border cursor-pointer ${
                  showConfidential
                    ? 'bg-amber-500 border-amber-600 text-white shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {showConfidential ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showConfidential ? 'Ocultar Salarios & Fiscal' : 'Ver Salarios & Datos SAT/IMSS'}
              </button>
            )}

            {canManageHR && (
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    status: 'ACTIVO',
                    employmentStatus: 'ACTIVE',
                    hireDate: new Date().toISOString().slice(0, 10),
                    department: departments[0]?.name || 'Operaciones & Producción',
                    departmentId: departments[0]?.id || 'DEP-03',
                  });
                  setConfidentialFormData({
                    paymentFrequency: 'QUINCENAL',
                    baseSalary: 20000,
                    bankName: 'BBVA México',
                  });
                  setIsNewEmployeeModalOpen(true);
                }}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Nuevo Colaborador
              </button>
            )}
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, código, email o puesto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">Todos los Departamentos ({(departments || []).length})</option>
              {(departments || []).map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="ACTIVO">ACTIVO</option>
              <option value="PRUEBA">PERIODO DE PRUEBA</option>
              <option value="INACTIVO">INACTIVO</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        {filteredEmployees.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-700">No se encontraron colaboradores coincidentes.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Prueba ajustando el término de búsqueda o los filtros de departamento y estado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                <tr>
                  <th className="px-4 py-3">Colaborador</th>
                  <th className="px-4 py-3">Puesto / Área</th>
                  <th className="px-4 py-3">Usuario ERP</th>
                  <th className="px-4 py-3">Contacto</th>
                  <th className="px-4 py-3">Antigüedad</th>
                  {showConfidential && (
                    <>
                      <th className="px-4 py-3 text-right">Salario Base</th>
                      <th className="px-4 py-3">RFC / IMSS</th>
                    </>
                  )}
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredEmployees.map((emp) => {
                  if (!emp) return null;
                  const conf = (confidentialData && confidentialData[emp.id]) || (emp as any).confidentialData;
                  const linkedUser = (users || []).find((u) => {
                    if (!u) return false;
                    return (
                      u.id === emp.userId ||
                      (u as any).employee_id === emp.id ||
                      u.employeeId === emp.id ||
                      ((emp as any).salesExecutiveId &&
                        ((u as any).salesExecutiveId === (emp as any).salesExecutiveId ||
                          (u as any).sales_executive_id === (emp as any).salesExecutiveId))
                    );
                  });

                  const empDisplayName = emp.name || (emp as any).fullName || 'Colaborador';
                  const avatarInitial = (empDisplayName.trim().charAt(0) || 'C').toUpperCase();
                  const empNumberDisplay = emp.employeeNumber || (emp as any).employee_number || emp.id;
                  const positionDisplay = emp.position || (emp as any).positionName || 'Especialista';
                  const departmentDisplay = emp.department || (emp as any).departmentName || 'General';

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-800 font-black text-xs">
                            {avatarInitial}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{empDisplayName}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-500 font-mono">
                                {empNumberDisplay}
                              </span>
                              {(emp as any).salesExecutiveId && (
                                <span className="rounded bg-amber-100 px-1 py-0.2 text-[9px] font-bold text-amber-800">
                                  {(emp as any).salesExecutiveId}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900 block">{positionDisplay}</span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Building className="h-3 w-3 text-slate-400" />
                          {departmentDisplay}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {linkedUser ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                              <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                              {linkedUser.username || linkedUser.email}
                            </span>
                            <span className="block text-[9px] text-slate-400 uppercase font-bold pl-1">
                              {linkedUser.role}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Sin acceso ERP</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-slate-600 text-[11px]">
                        <div className="font-mono text-[10px]">{emp.email || '—'}</div>
                        <div className="text-slate-400">{emp.phone || '—'}</div>
                      </td>

                      <td className="px-4 py-3 text-[11px]">
                        <span>{emp.hireDate || (emp as any).hire_date || '2026-01-01'}</span>
                      </td>

                      {showConfidential && (
                        <>
                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                            {conf && Number(conf.baseSalary) > 0
                              ? `$${Number(conf.baseSalary).toLocaleString('es-MX')} (${conf.paymentFrequency || 'QUINCENAL'})`
                              : '—'}
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                            <div>RFC: {conf?.rfc || '—'}</div>
                            <div className="text-slate-400">NSS: {conf?.nss || '—'}</div>
                          </td>
                        </>
                      )}

                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                            emp.status === 'ACTIVO' || emp.employmentStatus === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : emp.status === 'PRUEBA' || emp.employmentStatus === 'PROBATION'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {emp.status || emp.employmentStatus || 'ACTIVO'}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        {canManageHR && (
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(emp)}
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 hover:text-blue-600 transition cursor-pointer"
                            title="Ver y editar colaborador"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal New / Edit Employee */}
      {(isNewEmployeeModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                {isNewEmployeeModalOpen ? 'Registrar Nuevo Colaborador' : `Editar Colaborador: ${selectedEmployee?.name}`}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsNewEmployeeModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
                    placeholder="Ej. Ing. Mateo Carranza"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. Empleado</label>
                  <input
                    type="text"
                    value={formData.employeeNumber || (formData as any).employee_number || ''}
                    onChange={(e) => setFormData({ ...formData, employeeNumber: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
                    placeholder="Ej. CON-015"
                    disabled={isEditModalOpen} // Primary code locked on edit
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
                    placeholder="correo@conscore.com.mx"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
                    placeholder="+52 55 5872-9400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Departamento</label>
                  <select
                    value={formData.department || ''}
                    onChange={(e) => {
                      const selectedDept = (departments || []).find((d) => d.name === e.target.value);
                      setFormData({
                        ...formData,
                        department: e.target.value,
                        departmentId: selectedDept?.id || formData.departmentId,
                      });
                    }}
                    className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
                  >
                    {(departments || []).map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Puesto</label>
                  <input
                    type="text"
                    value={formData.position || ''}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
                    placeholder="Ej. Ejecutivo de Ventas Senior"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha de Ingreso</label>
                  <input
                    type="date"
                    value={formData.hireDate || ''}
                    onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estado Laboral</label>
                  <select
                    value={formData.status || 'ACTIVO'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="PRUEBA">PERIODO DE PRUEBA</option>
                    <option value="INACTIVO">INACTIVO</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Usuario ERP Vinculado</label>
                  <select
                    value={formData.userId || ''}
                    onChange={(e) => setFormData({ ...formData, userId: e.target.value || undefined })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">(Sin usuario asignado)</option>
                    {(users || []).map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.username} - {u.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Turno de Trabajo</label>
                  <select
                    value={formData.shiftId || 'SHF-001'}
                    onChange={(e) => setFormData({ ...formData, shiftId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
                  >
                    {(shifts || []).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.startTime} - {s.endTime})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sensitive/Confidential Section */}
              {canViewConfidential && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-3 mt-4">
                  <div className="flex items-center gap-2 text-xs font-black text-amber-900">
                    <Lock className="h-4 w-4 text-amber-600" />
                    Información Salarial y Fiscal Confidencial (RH / Dirección)
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Salario Base (MXN)</label>
                      <input
                        type="number"
                        value={confidentialFormData.baseSalary || ''}
                        onChange={(e) =>
                          setConfidentialFormData({
                            ...confidentialFormData,
                            baseSalary: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white p-2.5 focus:border-blue-500 focus:outline-none font-mono"
                        placeholder="Ej. 24000"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Frecuencia de Pago</label>
                      <select
                        value={confidentialFormData.paymentFrequency || 'QUINCENAL'}
                        onChange={(e) =>
                          setConfidentialFormData({
                            ...confidentialFormData,
                            paymentFrequency: e.target.value as any,
                          })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white p-2.5 focus:border-blue-500 focus:outline-none"
                      >
                        <option value="QUINCENAL">Quincenal</option>
                        <option value="MENSUAL">Mensual</option>
                        <option value="SEMANAL">Semanal</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">RFC</label>
                      <input
                        type="text"
                        value={confidentialFormData.rfc || ''}
                        onChange={(e) =>
                          setConfidentialFormData({ ...confidentialFormData, rfc: e.target.value.toUpperCase() })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white p-2.5 focus:border-blue-500 focus:outline-none uppercase font-mono"
                        placeholder="XAXX010101000"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">CURP</label>
                      <input
                        type="text"
                        value={confidentialFormData.curp || ''}
                        onChange={(e) =>
                          setConfidentialFormData({ ...confidentialFormData, curp: e.target.value.toUpperCase() })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white p-2.5 focus:border-blue-500 focus:outline-none uppercase font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">NSS (IMSS)</label>
                      <input
                        type="text"
                        value={confidentialFormData.nss || ''}
                        onChange={(e) =>
                          setConfidentialFormData({ ...confidentialFormData, nss: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white p-2.5 focus:border-blue-500 focus:outline-none font-mono"
                        placeholder="11 dígitos"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">CLABE Bancaria</label>
                      <input
                        type="text"
                        value={(confidentialFormData as any).clabe || (confidentialFormData as any).bankAccountClabe || ''}
                        onChange={(e) =>
                          setConfidentialFormData({
                            ...confidentialFormData,
                            clabe: e.target.value,
                            bankAccountClabe: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white p-2.5 focus:border-blue-500 focus:outline-none font-mono"
                        placeholder="18 dígitos"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewEmployeeModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`rounded-xl bg-blue-600 px-5 py-2 font-bold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar Colaborador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const EmployeeDirectory: React.FC = () => {
  return (
    <EmployeeDirectoryErrorBoundary>
      <EmployeeDirectoryInner />
    </EmployeeDirectoryErrorBoundary>
  );
};

