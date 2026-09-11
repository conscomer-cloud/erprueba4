import React, { useState, useEffect } from 'react';
import {
  Home,
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
  Settings,
  ShieldAlert,
  Headset,
  Workflow,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Lock,
  Boxes,
  PackageCheck,
  Landmark,
  CreditCard,
  FileSpreadsheet,
  UserPlus,
  Wallet,
} from 'lucide-react';
import { ERPModule, UserRole } from '../../types/erp';
import { useAuth } from '../../context/AuthContext';

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

/**
 * Un destino del menu. `tab` abre el modulo directamente en una de sus
 * pestanas internas, para que el menu pueda ofrecer "Proveedores" u "Ordenes
 * de compra" por separado aunque ambos vivan dentro del modulo de Compras.
 */
export interface NavLeaf {
  label: string;
  module: ERPModule;
  tab?: string;
  icon?: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

interface NavGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  /** Destino al tocar el encabezado. Si falta, el grupo solo abre y cierra. */
  module?: ERPModule;
  children?: NavLeaf[];
}

/**
 * Estructura del menu, agrupada por area funcional.
 *
 * Varias entradas que pidio la operacion no existen todavia como pantalla en
 * el sistema y por eso NO aparecen aqui: un menu que lleva a una pantalla
 * inexistente es peor que no tener la entrada. Lo que falta esta documentado
 * en MENU-PENDIENTES.md.
 */
const NAV_GROUPS: NavGroup[] = [
  {
    id: 'INICIO',
    label: 'Inicio',
    icon: Home,
    module: 'DASHBOARD',
  },
  {
    id: 'GERENCIA',
    label: 'Gerencia',
    icon: LayoutDashboard,
    children: [
      { label: 'Dashboard', module: 'DASHBOARD', icon: LayoutDashboard },
      { label: 'CONSCORE AI', module: 'IA', icon: Bot, badge: 'IA', badgeColor: 'bg-amber-400 text-slate-900' },
      { label: 'Gobierno y Riesgos', module: 'REPORTES', icon: ShieldAlert },
      { label: 'BPM y Automatización', module: 'AUTOMATIZACION', icon: Workflow },
      { label: 'Inteligencia Predictiva', module: 'PREDICTIVO', icon: TrendingUp },
      { label: 'Auditoría', module: 'AUDITORIA', icon: ShieldAlert },
      { label: 'Configuración', module: 'CONFIGURACION', icon: Settings },
    ],
  },
  {
    id: 'COMPRAS',
    label: 'Compras',
    icon: ShoppingCart,
    children: [
      { label: 'Productos', module: 'INVENTARIO', icon: Package },
      { label: 'Proveedores', module: 'COMPRAS', tab: 'SUPPLIERS', icon: Building2 },
      { label: 'Órdenes de Compra', module: 'COMPRAS', tab: 'ORDERS', icon: Receipt },
      { label: 'Solicitudes', module: 'COMPRAS', tab: 'REQUESTS', icon: FileSpreadsheet },
    ],
  },
  {
    id: 'INVENTARIOS',
    label: 'Inventarios',
    icon: Boxes,
    children: [
      { label: 'Inventario', module: 'INVENTARIO', icon: Factory },
      { label: 'Almacenes', module: 'ALMACENES', icon: Building2 },
      { label: 'Recepción de Mercancía', module: 'COMPRAS', tab: 'RECEIPTS', icon: PackageCheck },
      { label: 'Logística y Rutas', module: 'LOGISTICA', icon: Truck },
    ],
  },
  {
    id: 'VENTAS',
    label: 'Ventas',
    icon: Briefcase,
    children: [
      { label: 'CRM', module: 'VENTAS', icon: Briefcase },
      { label: 'Prospectos', module: 'VENTAS', tab: 'LEADS', icon: UserPlus },
      { label: 'Clientes 360°', module: 'CLIENTES', icon: Users },
      { label: 'Cotizaciones', module: 'COTIZACIONES', icon: Receipt },
      { label: 'Pedidos', module: 'PEDIDOS', icon: Package },
      { label: 'Servicio al Cliente', module: 'SERVICIO', icon: Headset },
    ],
  },
  {
    id: 'FINANZAS',
    label: 'Finanzas',
    icon: DollarSign,
    children: [
      { label: 'Bancos y Cajas', module: 'FINANZAS', tab: 'TREASURY', icon: Landmark },
      { label: 'Cuentas por Cobrar', module: 'FINANZAS', tab: 'CXC', icon: CreditCard },
      { label: 'Cuentas por Pagar', module: 'FINANZAS', tab: 'CXP', icon: Wallet },
      { label: 'Gastos y Presupuestos', module: 'FINANZAS', tab: 'BUDGETS_EXPENSES', icon: Receipt },
      { label: 'Cuentas y Centros de Costo', module: 'FINANZAS', tab: 'ACCOUNTS_CC', icon: FileSpreadsheet },
      { label: 'Rentabilidad', module: 'FINANZAS', tab: 'PROFITABILITY', icon: TrendingUp },
    ],
  },
  {
    id: 'RH',
    label: 'Recursos Humanos',
    icon: UserCheck,
    children: [
      { label: 'Empleados', module: 'RH', tab: 'EMPLOYEES', icon: Users },
      { label: 'Nómina y Comisiones', module: 'RH', tab: 'COMMISSIONS', icon: DollarSign },
      { label: 'Reloj / Asistencia', module: 'RH', tab: 'ATTENDANCE', icon: UserCheck },
      { label: 'Vacaciones y Ausencias', module: 'RH', tab: 'VACATIONS', icon: UserCheck },
      { label: 'Expedientes', module: 'RH', tab: 'DOCUMENTS', icon: FileSpreadsheet },
    ],
  },
  {
    id: 'MARKETING',
    label: 'Marketing',
    icon: Megaphone,
    module: 'MARKETING',
  },
];

interface SidebarProps {
  activeModule: ERPModule;
  onSelectModule: (module: ERPModule, tab?: string) => void;
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

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

  // Se abre el grupo que contiene el modulo activo, para que al entrar por
  // otra via (un enlace del dashboard) el menu refleje donde esta el usuario.
  const grupoDelModulo = (mod: ERPModule): string | null => {
    const g = NAV_GROUPS.find(
      (grp) => grp.module === mod || (grp.children || []).some((c) => c.module === mod)
    );
    return g ? g.id : null;
  };

  const [abierto, setAbierto] = useState<string | null>(() => grupoDelModulo(activeModule));

  useEffect(() => {
    const g = grupoDelModulo(activeModule);
    if (g) setAbierto(g);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModule]);

  const initials = (currentUser?.name || '?')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const roleLabel = ROLE_LABELS[currentRole as UserRole] || currentRole || '';

  /** Segregacion de funciones: almacen nunca ve Compras. */
  const bloqueadoPorSoD = (mod: ERPModule) =>
    (currentRole === 'ALMACEN' || (currentRole as string) === 'JEFE_ALMACEN') && mod === 'COMPRAS';

  const puedeVer = (mod: ERPModule) => can(mod, 'VER') && !bloqueadoPorSoD(mod);

  /** Un grupo se oculta cuando el rol no puede ver ninguno de sus destinos. */
  const grupoVisible = (g: NavGroup): boolean => {
    if (g.module) return puedeVer(g.module);
    return (g.children || []).some((c) => puedeVer(c.module));
  };

  const ir = (mod: ERPModule, tab?: string) => {
    if (!puedeVer(mod)) return;
    onSelectModule(mod, tab);
    onClose();
  };

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-slate-900 text-slate-200 border-r border-slate-800 transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Marca */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-400 font-black text-slate-900 text-xl shadow-md">
              C
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate leading-none">
                <span className="block text-white font-bold text-base tracking-tight">CONSCORE</span>
                <span className="text-yellow-400 text-[10px] font-bold tracking-widest uppercase mt-0.5">
                  ERP IA
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            title={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {NAV_GROUPS.filter(grupoVisible).map((grupo) => {
            const Icono = grupo.icon;
            const esHoja = !grupo.children;
            const activo = esHoja
              ? activeModule === grupo.module
              : (grupo.children || []).some((c) => c.module === activeModule);
            const expandido = abierto === grupo.id && !isCollapsed;

            return (
              <div key={grupo.id}>
                <button
                  onClick={() => {
                    if (esHoja && grupo.module) {
                      ir(grupo.module);
                    } else if (isCollapsed) {
                      // Colapsado no hay espacio para desplegar: se entra al
                      // primer destino permitido del grupo.
                      const primero = (grupo.children || []).find((c) => puedeVer(c.module));
                      if (primero) ir(primero.module, primero.tab);
                    } else {
                      setAbierto(expandido ? null : grupo.id);
                    }
                  }}
                  title={grupo.label}
                  className={`group relative flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                    activo
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <Icono className="h-4 w-4 shrink-0" />
                  {!isCollapsed && <span className="truncate flex-1 text-left">{grupo.label}</span>}
                  {!isCollapsed && !esHoja && (
                    <ChevronDown
                      className={`h-3.5 w-3.5 shrink-0 transition-transform ${expandido ? 'rotate-180' : ''}`}
                    />
                  )}

                  {isCollapsed && (
                    <div className="absolute left-full ml-2 hidden rounded-md bg-slate-900 px-2 py-1 text-xs text-white shadow-lg group-hover:block z-50 whitespace-nowrap border border-slate-700">
                      {grupo.label}
                    </div>
                  )}
                </button>

                {expandido && grupo.children && (
                  <div className="mt-0.5 mb-1 space-y-0.5 border-l border-slate-800 ml-5 pl-2">
                    {grupo.children.map((hijo) => {
                      const acceso = puedeVer(hijo.module);
                      const HijoIcono = hijo.icon;
                      // Sin pestana, el resaltado depende solo del modulo. Con
                      // pestana no se puede saber desde aqui cual esta abierta,
                      // asi que no se marca ninguna como activa para no mentir.
                      const hijoActivo = !hijo.tab && activeModule === hijo.module;

                      return (
                        <button
                          key={`${hijo.module}-${hijo.tab || ''}`}
                          onClick={() => ir(hijo.module, hijo.tab)}
                          disabled={!acceso}
                          title={acceso ? hijo.label : `Sin permisos para ver ${hijo.label}`}
                          className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                            hijoActivo
                              ? 'bg-slate-800 text-white font-semibold'
                              : acceso
                              ? 'text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer'
                              : 'text-slate-600 opacity-60 cursor-not-allowed'
                          }`}
                        >
                          {HijoIcono && <HijoIcono className="h-3.5 w-3.5 shrink-0" />}
                          <span className="truncate flex-1 text-left">{hijo.label}</span>
                          {hijo.badge && acceso && (
                            <span
                              className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                                hijo.badgeColor || 'bg-blue-800 text-white'
                              }`}
                            >
                              {hijo.badge}
                            </span>
                          )}
                          {!acceso && <Lock className="h-3 w-3 text-slate-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
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
                <p className="text-slate-400 text-[10px] truncate">{roleLabel}</p>
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
