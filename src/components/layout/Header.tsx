import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  Activity,
  ShieldCheck,
  Building2,
  Menu,
  Sparkles,
  Users,
  Radio,
  KeyRound,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Shield,
  Briefcase,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useERP } from '../../context/ERPContext';
import { UserRole } from '../../types/erp';
import { DEV_TOOLS_ENABLED } from '../../config/environment';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onOpenTimeline: () => void;
  onToggleSidebar: () => void;
  onOpenSimulator?: () => void;
  onOpenMasterTest?: () => void;
  onOpenChangePassword?: () => void;
  onOpenProfile?: () => void;
  activeModuleTitle: string;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenNotifications,
  onOpenTimeline,
  onToggleSidebar,
  onOpenSimulator,
  onOpenMasterTest,
  onOpenChangePassword,
  onOpenProfile,
  activeModuleTitle,
  theme = 'light',
  onToggleTheme,
}) => {
  const { currentUser, currentRole, users, switchUser, switchRole, logout } = useAuth();
  const { unreadNotificationsCount, companyConfig, lastSyncTimestamp } = useERP();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isUserMenuOpen]);

  const roleLabels: Record<UserRole, string> = {
    ADMINISTRADOR: 'Administrador TI',
    DIRECTOR: 'Dirección General',
    GERENTE_VENTAS: 'Gerencia Ventas',
    VENDEDOR: 'Ejecutivo Ventas',
    ALMACEN: 'Operador Almacén',
    JEFE_ALMACEN: 'Jefe Almacén',
    LOGISTICA: 'Coord. Logística',
    CHOFER: 'Operador / Chofer',
    COMPRAS: 'Jefe Compras',
    MARKETING: 'Marketing',
    RH: 'Recursos Humanos',
    FINANZAS: 'Finanzas & Cobranza',
    SERVICIO_CLIENTE: 'Servicio al Cliente',
    CALIDAD: 'Aseguramiento Calidad',
  };

  const initials = (currentUser?.name || 'Admin')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('');

  const salesCode =
    currentUser?.salesExecutiveId ||
    (currentUser as any)?.sales_executive_id ||
    (currentRole === 'VENDEDOR' ? 'VENDEDOR_01' : null);

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    await logout();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-8 flex-shrink-0">
      {/* Left side: Mobile menu toggle + Active Module Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 lg:hidden"
          title="Menú"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 sm:text-lg">
                {activeModuleTitle}
              </h1>

            </div>
            <p className="hidden text-xs text-slate-500 md:block truncate max-w-xs">
              {companyConfig.tradeName}
            </p>
          </div>
        </div>
      </div>

      {/* Middle: Global Search Trigger */}
      <div className="flex flex-1 max-w-lg mx-6">
        <button
          onClick={onOpenSearch}
          className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-600 hover:border-slate-300 hover:bg-white transition-all group"
        >
          <div className="flex items-center gap-3 w-full">
            <Search className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
            <span className="text-xs text-slate-500 truncate">Búsqueda global (Prospectos, SKU, Pedidos, Folios...)</span>
          </div>
          <kbd className="hidden rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 sm:inline-block ml-2">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right side: Multi-User Simulator Button + Live Status + Role Switcher + Notifications */}
      <div className="flex items-center gap-3 lg:gap-5">
        {/* Multi-User 2-Screen Live Simulator Trigger */}
        {onOpenSimulator && (
          <button
            onClick={onOpenSimulator}
            className="flex items-center gap-2 rounded-lg bg-yellow-400 px-3 py-1.5 text-xs font-black text-slate-950 hover:bg-yellow-300 transition-all shadow-xs shrink-0 animate-in fade-in"
            title="Probar 2 usuarios interactuando simultáneamente en tiempo real"
          >
            <Users className="h-3.5 w-3.5" />
            <span className="hidden md:inline">2 Usuarios ⚡</span>
            <span className="md:hidden">2 Users</span>
          </button>
        )}

        {/* Master E2E Lead-to-Cash Test Trigger */}
        {onOpenMasterTest && (
          <button
            onClick={onOpenMasterTest}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 px-3.5 py-1.5 text-xs font-black text-slate-950 hover:from-amber-300 hover:to-amber-400 transition-all shadow-md shadow-amber-500/20 shrink-0 cursor-pointer animate-in fade-in"
            title="Ejecutar Prueba Maestra E2E: Del Lead al Banco y Rentabilidad"
          >
            <Sparkles className="h-3.5 w-3.5 text-slate-950" />
            <span className="hidden lg:inline">Prueba Maestra E2E 🚀</span>
            <span className="lg:hidden">E2E Test</span>
          </button>
        )}

        {/* System Online & Realtime Status */}
        <div className="hidden items-center gap-2 xl:flex">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-bold text-slate-500 tracking-tight">
            EN VIVO ({lastSyncTimestamp})
          </span>
        </div>

        {/* Selector de rol: herramienta de prueba de la matriz RBAC.
            Se muestra solo en desarrollo; en produccion permitia a cualquier
            usuario asignarse otro rol desde el navegador. */}
        {DEV_TOOLS_ENABLED && (
          <div className="hidden items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 xl:flex">
            <ShieldCheck className="h-4 w-4 text-amber-700" />
            <span className="text-xs font-medium text-amber-700">Rol (pruebas):</span>
            <select
              value={currentRole}
              onChange={(e) => switchRole(e.target.value as UserRole)}
              className="bg-transparent text-xs font-bold text-amber-900 outline-none cursor-pointer"
            >
              {Object.entries(roleLabels).map(([roleKey, label]) => (
                <option key={roleKey} value={roleKey}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Activity Timeline Drawer Trigger */}
        <button
          onClick={onOpenTimeline}
          className="relative text-slate-400 hover:text-slate-700 transition-colors p-1"
          title="Centro de Actividad en Tiempo Real"
        >
          <Activity className="h-5 w-5" />
        </button>

        {/* Notifications Trigger with Badge */}
        <button
          onClick={onOpenNotifications}
          className="relative text-slate-400 hover:text-slate-700 transition-colors p-1"
          title="Notificaciones del Sistema"
        >
          <Bell className="h-5 w-5" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          )}
        </button>

        {/* Theme Toggle (Light / Dark) */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            id="theme-toggle-button"
            className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg hover:bg-slate-100"
            title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 text-amber-400" />
            ) : (
              <Moon className="h-5 w-5 text-slate-500" />
            )}
          </button>
        )}

        {/* User Profile Dropdown Button & Menu */}
        <div className="relative pl-2 border-l border-slate-200" ref={userMenuRef}>
          <button
            type="button"
            id="btn-user-profile-menu"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2.5 rounded-xl p-1.5 hover:bg-slate-100/80 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer group"
            aria-expanded={isUserMenuOpen}
            aria-haspopup="true"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center text-xs font-bold text-white shadow-xs group-hover:scale-105 transition-transform">
              {initials}
            </div>
            <div className="hidden text-left lg:block">
              <div className="text-xs font-semibold text-slate-900 leading-tight">
                {currentUser?.name || 'Administrador'}
              </div>
              <div className="text-[10px] text-slate-500 leading-tight">
                {roleLabels[currentRole] || currentRole}
              </div>
            </div>
            <ChevronDown className={`hidden lg:block h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180 text-blue-600' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {isUserMenuOpen && (
            <div
              id="user-profile-dropdown"
              className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-white shadow-2xl border border-slate-200/90 py-2 z-50 animate-in fade-in zoom-in-95 duration-150 origin-top-right divide-y divide-slate-100"
            >
              {/* User Header Summary */}
              <div className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow-xs shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {currentUser?.name || 'Administrador'}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate font-mono">
                      {currentUser?.email || 'admin@conscore.com.mx'}
                    </p>
                  </div>
                </div>

                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200/60">
                    <Shield className="h-3 w-3" />
                    {roleLabels[currentRole] || currentRole}
                  </span>
                  {salesCode && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
                      <Briefcase className="h-3 w-3" />
                      {salesCode}
                    </span>
                  )}
                </div>
              </div>

              {/* Menu Actions */}
              <div className="p-1.5 space-y-0.5">
                <button
                  type="button"
                  id="menu-item-profile"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    if (onOpenProfile) onOpenProfile();
                  }}
                  className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-700 transition-colors text-left cursor-pointer"
                >
                  <UserIcon className="h-4 w-4 text-slate-400" />
                  <span>Mi Perfil</span>
                </button>

                <button
                  type="button"
                  id="menu-item-change-password"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    if (onOpenChangePassword) onOpenChangePassword();
                  }}
                  className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-700 transition-colors text-left cursor-pointer"
                >
                  <KeyRound className="h-4 w-4 text-slate-400" />
                  <span>Cambiar contraseña</span>
                </button>
              </div>

              {/* Logout Option */}
              <div className="p-1.5">
                <button
                  type="button"
                  id="menu-item-logout"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer group"
                >
                  <LogOut className="h-4 w-4 text-rose-500 group-hover:text-rose-600" />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
