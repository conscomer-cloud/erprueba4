import React from 'react';
import {
  User as UserIcon,
  Mail,
  Shield,
  Briefcase,
  MapPin,
  CheckCircle2,
  KeyRound,
  LogOut,
  X,
  BadgeCheck,
  Building,
  Hash,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/erp';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChangePassword: () => void;
}

const ROLE_LABELS: Record<UserRole, string> = {
  ADMINISTRADOR: 'Administrador TI / Sistema',
  DIRECTOR: 'Dirección General',
  GERENTE_VENTAS: 'Gerente de Ventas & CRM',
  VENDEDOR: 'Ejecutivo de Ventas',
  ALMACEN: 'Operador de Almacén & Inventarios',
  JEFE_ALMACEN: 'Jefe de Almacén & Control Físico',
  LOGISTICA: 'Coordinador de Logística & Rutas',
  CHOFER: 'Operador de Transporte / Chofer',
  COMPRAS: 'Jefe de Compras & Proveedores',
  MARKETING: 'Coordinador de Marketing',
  RH: 'Recursos Humanos & Nómina',
  FINANZAS: 'Finanzas, Tesorería & Cobranza',
  SERVICIO_CLIENTE: 'Servicio al Cliente & Garantías',
  CALIDAD: 'Aseguramiento de Calidad & Procesos',
};

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenChangePassword,
}) => {
  const { currentUser, currentRole, logout } = useAuth();

  if (!isOpen || !currentUser) return null;

  const initials = (currentUser.name || 'U')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('');

  const salesCode =
    currentUser.salesExecutiveId ||
    (currentUser as any).sales_executive_id ||
    (currentRole === 'VENDEDOR' ? 'VENDEDOR_01' : null);

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  return (
    <div
      id="user-profile-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="user-profile-modal-card"
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200/80 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Banner */}
        <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 px-6 pt-6 pb-14 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-lg bg-white/10 p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
            title="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-300">
            <BadgeCheck className="h-4 w-4 text-emerald-400" />
            Perfil de Usuario Autenticado
          </div>
          <h2 className="text-xl font-bold mt-1 text-white">Mi Cuenta CONSCORE</h2>
          <p className="text-xs text-slate-300">Detalles de identidad, permisos y seguridad comercial</p>
        </div>

        {/* Avatar + Main Info Floating Card */}
        <div className="px-6 -mt-10">
          <div className="flex items-end justify-between">
            <div className="flex items-end gap-4">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 border-4 border-white shadow-lg flex items-center justify-center text-xl font-black text-white">
                {initials}
              </div>
              <div className="pb-1">
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  {currentUser.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{currentUser.email}</p>
              </div>
            </div>
            <div className="pb-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {currentUser.status || 'ACTIVO'}
              </span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Rol Institucional */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase">
                <Shield className="h-3.5 w-3.5 text-blue-600" />
                Rol Institucional
              </div>
              <p className="text-sm font-bold text-slate-900 mt-1">
                {ROLE_LABELS[currentRole] || currentRole}
              </p>
            </div>

            {/* Código de Vendedor / Identificador */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase">
                <Hash className="h-3.5 w-3.5 text-indigo-600" />
                {salesCode ? 'Código Vendedor (RLS)' : 'ID de Usuario'}
              </div>
              <p className="text-sm font-bold text-slate-900 mt-1 font-mono">
                {salesCode || currentUser.id}
              </p>
            </div>

            {/* Departamento */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase">
                <Building className="h-3.5 w-3.5 text-slate-600" />
                Departamento
              </div>
              <p className="text-sm font-semibold text-slate-800 mt-1">
                {currentUser.department || 'Operaciones & Gestión'}
              </p>
            </div>

            {/* Territorio / Ubicación */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase">
                <MapPin className="h-3.5 w-3.5 text-rose-600" />
                Territorio Asignado
              </div>
              <p className="text-sm font-semibold text-slate-800 mt-1">
                {currentUser.territory || 'Zona Metropolitana Central'}
              </p>
            </div>
          </div>

          {/* Security & RLS Isolation Banner */}
          <div className="rounded-xl bg-blue-50/70 border border-blue-200/80 p-3.5">
            <div className="flex items-start gap-2.5">
              <Shield className="h-4 w-4 text-blue-700 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-900">
                <span className="font-bold block">Segregación Comercial RLS & Sesión Cifrada</span>
                <span>
                  Tus consultas y transacciones están aisladas a nivel de fila y auditadas bajo el identificador único de sesión.
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              id="btn-profile-change-password"
              onClick={() => {
                onClose();
                onOpenChangePassword();
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-700 transition-colors shadow-2xs"
            >
              <KeyRound className="h-4 w-4" />
              <span>Cambiar Contraseña</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cerrar
              </button>
              <button
                type="button"
                id="btn-profile-logout"
                onClick={handleLogout}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-700 transition-colors shadow-xs"
              >
                <LogOut className="h-4 w-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
