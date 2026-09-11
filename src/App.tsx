import React, { useState, useEffect, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ERPProvider, useERP } from './context/ERPContext';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { ActivityTimelineDrawer } from './components/common/ActivityTimelineDrawer';
import { ChangePasswordModal } from './components/common/ChangePasswordModal';
import { UserProfileModal } from './components/common/UserProfileModal';
import { AppErrorBoundary } from './components/common/AppErrorBoundary';
import { LoginView } from './components/auth/LoginView';
import { ERPModule } from './types/erp';
import { DEV_TOOLS_ENABLED } from './config/environment';
import { Lock, Zap, X, Loader2 } from 'lucide-react';

/**
 * Los modulos se cargan bajo demanda.
 *
 * Todo el ERP se empaquetaba en un unico archivo de 4.2 MB que el navegador
 * tenia que descargar y evaluar antes de pintar la pantalla de acceso, aunque
 * el usuario solo fuera a entrar a Cotizaciones. Con import() dinamico cada
 * modulo viaja en su propio fragmento y solo llega cuando se abre.
 */
const ExecutiveDashboard = lazy(() => import('./components/dashboard/ExecutiveDashboard').then(m => ({ default: m.ExecutiveDashboard })));
const ConsCoreAICenter = lazy(() => import('./components/ai/ConsCoreAICenter').then(m => ({ default: m.ConsCoreAICenter })));
const CompanySettings = lazy(() => import('./components/config/CompanySettings').then(m => ({ default: m.CompanySettings })));
const AuditLogViewer = lazy(() => import('./components/audit/AuditLogViewer').then(m => ({ default: m.AuditLogViewer })));
const CRMModule = lazy(() => import('./components/crm/CRMModule').then(m => ({ default: m.CRMModule })));
const Client360View = lazy(() => import('./components/crm/Client360View').then(m => ({ default: m.Client360View })));
const QuotesModule = lazy(() => import('./components/crm/QuotesModule').then(m => ({ default: m.QuotesModule })));
const OrdersModule = lazy(() => import('./components/crm/OrdersModule').then(m => ({ default: m.OrdersModule })));
const WarehouseLiveKardex = lazy(() => import('./components/modules/WarehouseLiveKardex').then(m => ({ default: m.WarehouseLiveKardex })));
const LogisticsModule = lazy(() => import('./components/logistics/LogisticsModule').then(m => ({ default: m.LogisticsModule })));
const PurchasesDashboard = lazy(() => import('./components/purchases/PurchasesDashboard').then(m => ({ default: m.PurchasesDashboard })));
const MarketingModule = lazy(() => import('./components/marketing/MarketingModule').then(m => ({ default: m.MarketingModule })));
const HRModule = lazy(() => import('./components/hr/HRModule').then(m => ({ default: m.HRModule })));
const FinancialDashboard = lazy(() => import('./components/finance/FinancialDashboard').then(m => ({ default: m.FinancialDashboard })));
const CustomerServiceCenter = lazy(() => import('./components/service/CustomerServiceCenter').then(m => ({ default: m.CustomerServiceCenter })));
const GovernanceRiskComplianceModule = lazy(() => import('./components/governance/GovernanceRiskComplianceModule').then(m => ({ default: m.GovernanceRiskComplianceModule })));
const AutomationBpmModule = lazy(() => import('./components/automation/AutomationBpmModule').then(m => ({ default: m.AutomationBpmModule })));
// ModulePlaceholder importa WarehouseLiveKardex de forma estatica, y este a su
// vez arrastra xlsx y jsPDF (~850 kB). Al cargarse de forma diferida, esas
// librerias dejan de viajar en el paquete inicial.
const ModulePlaceholder = lazy(() => import('./components/modules/ModulePlaceholder').then(m => ({ default: m.ModulePlaceholder })));
const PredictiveDashboard = lazy(() => import('./components/predictive/PredictiveDashboard').then(m => ({ default: m.PredictiveDashboard })));

// Herramientas de prueba: solo se cargan si el entorno las habilita.
const MultiUserLiveSimulatorModal = lazy(() => import('./components/common/MultiUserLiveSimulatorModal').then(m => ({ default: m.MultiUserLiveSimulatorModal })));
const MasterE2ETestModal = lazy(() => import('./components/executive/MasterE2ETestModal').then(m => ({ default: m.MasterE2ETestModal })));

const ModuleFallback: React.FC = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <div className="flex flex-col items-center gap-3 text-slate-500">
      <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
      <span className="text-xs font-semibold">Cargando módulo...</span>
    </div>
  </div>
);

const MODULE_TITLES: Record<ERPModule, string> = {
  DASHBOARD: 'Dashboard Ejecutivo',
  IA: 'CONSCORE AI Core',
  PREDICTIVO: 'Inteligencia Predictiva & Continuidad Operativa',
  MARKETING: 'Marketing & Prospectación',
  VENTAS: 'Ventas & CRM',
  CLIENTES: 'Clientes 360°',
  COTIZACIONES: 'Cotizaciones Comerciales',
  PEDIDOS: 'Pedidos & Surtido',
  INVENTARIO: 'Inventario & Catálogo Técnico',
  ALMACENES: 'Almacenes & Racks',
  COMPRAS: 'Compras & Proveedores',
  LOGISTICA: 'Logística & Rutas',
  RH: 'Recursos Humanos & Comisiones',
  FINANZAS: 'Finanzas & Cobranza',
  SERVICIO: 'Servicio al Cliente, Calidad & Garantías',
  REPORTES: 'Gobierno Corporativo, Riesgos & Cumplimiento',
  AUTOMATIZACION: 'Automatización, BPM & Flujos de Trabajo',
  CONFIGURACION: 'Configuración Central',
  AUDITORIA: 'Bitácora de Auditoría',
};

const MainLayout: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ERPModule>('DASHBOARD');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isMasterTestOpen, setIsMasterTestOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const { currentUser, can, currentRole, isAuthenticated, isLoading } = useAuth();
  const { realtimeToast, clearRealtimeToast } = useERP();
  const hasAccess = can(activeModule, 'VER');

  const mustChangePass = Boolean(currentUser?.mustChangePassword || (currentUser as any)?.must_change_password);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('conscore_theme_preference', 'light');

  // Load and synchronize theme preference with DOM
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('theme-transition');
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    const timer = window.setTimeout(() => root.classList.remove('theme-transition'), 220);
    return () => window.clearTimeout(timer);
  }, [theme]);

  // Automatic role-based routing on login or role switch
  useEffect(() => {
    if (currentRole === 'VENDEDOR' && activeModule === 'DASHBOARD') {
      setActiveModule('VENTAS');
    }
  }, [currentRole]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
        <p className="text-sm font-semibold text-slate-300">Inicializando CONSCORE ERP IA...</p>
      </div>
    );
  }

  if (!isAuthenticated || !currentUser) {
    return <LoginView />;
  }

  const renderModuleContent = () => {
    if (!hasAccess) {
      const isAlmacenInCompras = (currentRole === 'ALMACEN' || (currentRole as string) === 'JEFE_ALMACEN') && activeModule === 'COMPRAS';
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-8 text-center shadow-xs">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600 mb-4">
            <Lock className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            {isAlmacenInCompras
              ? 'Acceso Bloqueado por Segregación de Funciones (SoD)'
              : 'Acceso Restringido (RBAC)'}
          </h2>
          <p className="mt-2 max-w-md text-sm text-slate-600 leading-relaxed">
            {isAlmacenInCompras
              ? 'El rol ALMACÉN tiene estrictamente segregadas las funciones de compras, negociación de costos, listas de precios y emisión de órdenes de compra para garantizar el control interno. El personal de Almacén debe generar Solicitudes de Reabastecimiento por cantidad desde el módulo de Inventario.'
              : <>Tu rol actual (<b>{currentRole}</b>) no cuenta con el permiso <b>VER</b> para el módulo <b>{MODULE_TITLES[activeModule]}</b> según el principio de <i>Denegar por Defecto</i>.</>}
          </p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            {isAlmacenInCompras ? (
              <button
                onClick={() => setActiveModule('INVENTARIO')}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-xs"
              >
                Ir a Inventario (Solicitar Reabastecimiento)
              </button>
            ) : (
              <button
                onClick={() => setActiveModule('DASHBOARD')}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-xs"
              >
                Volver al Dashboard
              </button>
            )}
            {can('CONFIGURACION', 'VER') && (
              <button
                onClick={() => setActiveModule('CONFIGURACION')}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Ajustar Matriz RBAC
              </button>
            )}
          </div>
        </div>
      );
    }

    switch (activeModule) {
      case 'DASHBOARD':
        return <ExecutiveDashboard onNavigate={setActiveModule} />;
      case 'MARKETING':
        return <MarketingModule onNavigateModule={setActiveModule} />;
      case 'VENTAS':
        return (
          <CRMModule
            onNavigate={setActiveModule}
            onSelectCustomer={(cId) => {
              setSelectedCustomerId(cId);
              setActiveModule('CLIENTES');
            }}
          />
        );
      case 'CLIENTES':
        return (
          <Client360View
            initialCustomerId={selectedCustomerId}
            onNavigate={setActiveModule}
          />
        );
      case 'COTIZACIONES':
        return (
          <QuotesModule
            onNavigateToOrders={() => setActiveModule('PEDIDOS')}
          />
        );
      case 'PEDIDOS':
        return <OrdersModule />;
      case 'COMPRAS':
        return <PurchasesDashboard />;
      case 'LOGISTICA':
        return <LogisticsModule />;
      case 'RH':
        return <HRModule />;
      case 'FINANZAS':
        return <FinancialDashboard />;
      case 'SERVICIO':
        return <CustomerServiceCenter />;
      case 'INVENTARIO':
      case 'ALMACENES':
        return <WarehouseLiveKardex onOpenSimulator={() => setIsSimulatorOpen(true)} />;
      case 'IA':
        return <ConsCoreAICenter />;
      case 'REPORTES':
        return <GovernanceRiskComplianceModule />;
      case 'AUTOMATIZACION':
        return <AutomationBpmModule />;
      case 'PREDICTIVO':
        return <PredictiveDashboard />;
      case 'CONFIGURACION':
        return <CompanySettings />;
      case 'AUDITORIA':
        return <AuditLogViewer />;
      default:
        return (
          <ModulePlaceholder
            module={activeModule}
            onNavigate={setActiveModule}
            onOpenSimulator={() => setIsSimulatorOpen(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 antialiased flex">
      {/* Sidebar navigation */}
      <Sidebar
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <Header
          activeModuleTitle={MODULE_TITLES[activeModule]}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenTimeline={() => setIsTimelineOpen(true)}
          onToggleSidebar={() => setIsSidebarOpen(true)}
          onOpenSimulator={DEV_TOOLS_ENABLED ? () => setIsSimulatorOpen(true) : undefined}
          onOpenMasterTest={DEV_TOOLS_ENABLED ? () => setIsMasterTestOpen(true) : undefined}
          onOpenChangePassword={() => setIsChangePasswordOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          theme={theme}
          onToggleTheme={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
        />

        <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto">
          <AppErrorBoundary
            resetKey={activeModule}
            onGoHome={() => setActiveModule('DASHBOARD')}
          >
            <Suspense fallback={<ModuleFallback />}>
              {renderModuleContent()}
            </Suspense>
          </AppErrorBoundary>
        </main>
      </div>

      {/* Floating Realtime Live Toast for Cross-Tab Sync Events */}
      {realtimeToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in slide-in-from-bottom-5 fade-in">
          <div className="rounded-xl border border-emerald-300 bg-slate-950 p-4 text-white shadow-2xl flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-slate-950 shrink-0 font-bold">
              <Zap className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400">{realtimeToast.title}</span>
                <span className="text-[10px] text-slate-400 font-mono">{realtimeToast.timestamp}</span>
              </div>
              <p className="text-xs text-slate-200 mt-0.5 leading-snug">{realtimeToast.message}</p>
            </div>
            <button
              onClick={clearRealtimeToast}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Forced or Voluntary Password Change Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen || mustChangePass}
        isForced={mustChangePass}
        onClose={() => setIsChangePasswordOpen(false)}
        onSuccess={() => {
          setIsChangePasswordOpen(false);
          if (currentRole === 'VENDEDOR') {
            setActiveModule('VENTAS');
          } else {
            setActiveModule('DASHBOARD');
          }
        }}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
      />

      {/* Herramientas de prueba (solo en desarrollo o con VITE_ENABLE_DEV_TOOLS) */}
      {DEV_TOOLS_ENABLED && (
        <Suspense fallback={null}>
          <MasterE2ETestModal
            isOpen={isMasterTestOpen}
            onClose={() => setIsMasterTestOpen(false)}
            onNavigateToModule={setActiveModule}
          />
          <MultiUserLiveSimulatorModal
            isOpen={isSimulatorOpen}
            onClose={() => setIsSimulatorOpen(false)}
          />
        </Suspense>
      )}

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={setActiveModule}
      />

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNavigate={setActiveModule}
      />

      <ActivityTimelineDrawer
        isOpen={isTimelineOpen}
        onClose={() => setIsTimelineOpen(false)}
        onNavigate={setActiveModule}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <ERPProvider>
        <MainLayout />
      </ERPProvider>
    </AuthProvider>
  );
}

export default App;
