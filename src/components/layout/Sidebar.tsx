import React from 'react';
import {
  LayoutDashboard,
  Bot,
  Megaphone,
  Briefcase,
  Users,
  Receipt,
  Package,
  Factory,
  Building2,
  ShoppingCart,
  Truck,
  UserCheck,
  DollarSign,
  BarChart3,
  Settings,
  ShieldAlert,
  Headset,
  Workflow,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Flame,
  Lock,
} from 'lucide-react';
import { ERPModule, UserRole } from '../../types/erp';

const ROLE_LABELS: Partial<Record<UserRole, string>> = {
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
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  activeModule: ERPModule;
  onSelectModule: (module: ERPModule) => void;
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  id: ERPModule;
  label: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'IA', label: 'CONSCORE AI', icon: Bot, badge: 'IA Core', badgeColor: 'bg-amber-400 text-slate-900' },
  { id: 'MARKETING', label: 'Marketing', icon: Megaphone },
  { id: 'VENTAS', label: 'Ventas & CRM', icon: Briefcase },
  { id: 'CLIENTES', label: 'Clientes 360°', icon: Users },
  { id: 'COTIZACIONES', label: 'Cotizaciones', icon: Receipt },
  { id: 'PEDIDOS', label: 'Pedidos', icon: Package },
  { id: 'INVENTARIO', label: 'Inventario', icon: Factory },
  { id: 'ALMACENES', label: 'Almacenes', icon: Building2 },
  { id: 'COMPRAS', label: 'Compras & Prov.', icon: ShoppingCart },
  { id: 'LOGISTICA', label: 'Logística & Rutas', icon: Truck },
  { id: 'RH', label: 'Recursos Humanos', icon: UserCheck },
  { id: 'FINANZAS', label: 'Finanzas & Cobro', icon: DollarSign },
  { id: 'SERVICIO', label: 'Servicio al Cliente', icon: Headset },
  { id: 'REPORTES', label: 'Gobierno & Riesgos', icon: BarChart3 },
  { id: 'AUTOMATIZACION', label: 'BPM & Automatización', icon: Workflow },
  { id: 'PREDICTIVO', label: 'Inteligencia Predictiva', icon: TrendingUp },
  { id: 'CONFIGURACION', label: 'Configuración', icon: Settings },
  { id: 'AUDITORIA', label: 'Auditoría', icon: ShieldAlert },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onSelectModule,
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { can, currentUser } = useAuth();
  const currentRole = currentUser?.role;

  // El pie mostraba "Juan Delgado / Director General" escrito a mano, sin
  // relacion con quien habia iniciado sesion.
  const initials = (currentUser?.name || '?')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const roleLabel = ROLE_LABELS[currentRole as UserRole] || currentRole || '';

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-slate-900 text-slate-200 border-r border-slate-800 transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-400 font-black text-slate-900 text-xl shadow-md">
              C
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate leading-none">
                <span className="block text-white font-bold text-base tracking-tight">
                  CONSCORE
                </span>
                <span className="text-yellow-400 text-[10px] font-bold tracking-widest uppercase mt-0.5">
                  ERP IA
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            title={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
          <div className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 ${isCollapsed ? 'hidden' : 'block'}`}>
            Módulos Operativos
          </div>

          {NAV_ITEMS.map((item) => {
            // Strict Segregation of Duties (SoD): Warehouse cannot see Compras tab
            if ((currentRole === 'ALMACEN' || (currentRole as string) === 'JEFE_ALMACEN') && item.id === 'COMPRAS') {
              return null;
            }

            const Icon = item.icon;
            const isActive = activeModule === item.id;
            const hasAccess = can(item.id, 'VER');

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (hasAccess) {
                    onSelectModule(item.id);
                    onClose();
                  }
                }}
                disabled={!hasAccess}
                title={!hasAccess ? `Sin permisos para ver ${item.label}` : item.label}
                className={`group relative flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold'
                    : hasAccess
                    ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    : 'text-slate-600 opacity-60 cursor-not-allowed'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                <Icon className={`h-4 w-4 shrink-0 transition-transform ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />

                {!isCollapsed && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}

                {!isCollapsed && item.badge && hasAccess && (
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${item.badgeColor || 'bg-blue-800 text-white'}`}>
                    {item.badge}
                  </span>
                )}

                {!isCollapsed && !hasAccess && (
                  <Lock className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                )}

                {/* Tooltip for collapsed view */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 hidden rounded-md bg-slate-900 px-2 py-1 text-xs text-white shadow-lg group-hover:block z-50 whitespace-nowrap border border-slate-700">
                    {item.label} {!hasAccess && '(Bloqueado)'}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Pie: usuario autenticado */}
        <div className="border-t border-slate-800 p-4 bg-slate-900">
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {initials}
              </div>
              <div className="truncate">
                <p className="text-white text-xs font-semibold truncate leading-tight">
                  {currentUser?.name || 'Sin sesión'}
                </p>
                <p className="text-slate-400 text-[10px] truncate">
                  {roleLabel}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center" title={currentUser?.name || ''}>
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                {initials}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
