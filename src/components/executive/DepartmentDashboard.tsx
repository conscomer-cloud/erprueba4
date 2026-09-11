import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  TrendingUp,
  ShoppingCart,
  Warehouse,
  Truck,
  Users,
  RefreshCw,
  AlertTriangle,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useERP } from '../../context/ERPContext';

type DeptKey = 'sales' | 'purchasing' | 'warehouse' | 'logistics' | 'hr';

interface SalesDepartmentKpis {
  ordersThisMonth: number;
  revenueThisMonth: number;
  quotesPendingAuth: number;
  conversionRatePct: number;
  topSalespeople: { name: string; revenue: number; orderCount: number }[];
}
interface PurchasingDepartmentKpis {
  ordersOpen: number;
  spendThisMonth: number;
  requestsPending: number;
  topSuppliers: { name: string; spend: number; orderCount: number }[];
}
interface WarehouseDepartmentKpis {
  inventoryValue: number;
  skusInStock: number;
  ordersToFulfill: number;
  reorderAlertsCount: number;
}
interface LogisticsDepartmentKpis {
  routesToday: number;
  routesCompleted: number;
  ordersInRoute: number;
  onTimeDeliveryPct: number | null;
}
interface ServerKpisResponse {
  generatedAt: string;
  allowedDepartments: string[];
  sales?: SalesDepartmentKpis;
  purchasing?: PurchasingDepartmentKpis;
  warehouse?: WarehouseDepartmentKpis;
  logistics?: LogisticsDepartmentKpis;
}

const money = (n: number) => `$${(Number(n) || 0).toLocaleString('es-MX')}`;
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('conscore_auth_token') || ''}` });

const DEPT_LABEL: Record<DeptKey, string> = {
  sales: 'Ventas',
  purchasing: 'Compras',
  warehouse: 'Almacén',
  logistics: 'Logística',
  hr: 'Recursos Humanos',
};
const DEPT_ICON: Record<DeptKey, React.ElementType> = {
  sales: TrendingUp,
  purchasing: ShoppingCart,
  warehouse: Warehouse,
  logistics: Truck,
  hr: Users,
};

/**
 * Decide qué departamentos puede ver un rol, del lado del cliente.
 *
 * Esto es solo para armar el selector de pestañas; la autorización real vive
 * en el servidor, que recorta la respuesta según el rol y responde 403 si no
 * hay ninguno permitido. Aunque alguien manipule este arreglo desde la
 * consola, el servidor no entrega datos que su rol no autoriza.
 */
function departamentosVisibles(role: string | undefined): DeptKey[] {
  switch (role) {
    case 'GERENTE_VENTAS':
    case 'VENDEDOR':
      return ['sales'];
    case 'COMPRAS':
      return ['purchasing'];
    case 'JEFE_ALMACEN':
    case 'ALMACEN':
      return ['warehouse'];
    case 'LOGISTICA':
      return ['logistics'];
    case 'RH':
      return ['hr'];
    case 'DIRECTOR':
    case 'ADMINISTRADOR':
      return ['sales', 'purchasing', 'warehouse', 'logistics', 'hr'];
    default:
      return [];
  }
}

/**
 * Dashboard por departamento.
 *
 * Ventas, Compras, Almacén y Logística salen de un endpoint del servidor,
 * porque esas colecciones sí se persisten ahí. Recursos Humanos se calcula en
 * este componente a partir del contexto: la asistencia, las ausencias y las
 * comisiones nunca se guardaron en el servidor, viven en localStorage. Un
 * dashboard de RH contra el servidor habría mostrado ceros permanentes.
 */
export const DepartmentDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { employees, departments, attendanceRecords, absenceRequests } = useERP();

  const visibles = useMemo(() => departamentosVisibles(currentUser?.role), [currentUser?.role]);
  const [activeDept, setActiveDept] = useState<DeptKey | null>(visibles[0] || null);
  const [data, setData] = useState<ServerKpisResponse | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const necesitaServidor = visibles.some((d) => d !== 'hr');

  const cargar = async () => {
    if (!necesitaServidor) return;
    setCargando(true);
    setError(null);
    try {
      const res = await fetch('/api/reports/department-kpis', { headers: auth() });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || `El servidor respondió ${res.status}.`);
        return;
      }
      setData(body);
    } catch (err: any) {
      setError(err?.message || 'No se pudo conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.role]);

  // --- KPIs de RH, calculados en el cliente ---
  const hrKpis = useMemo(() => {
    if (!visibles.includes('hr')) return null;

    const activos = (employees || []).filter(
      (e: any) => String(e.employment_status || e.employmentStatus || 'ACTIVO').toUpperCase() !== 'BAJA'
    );

    const hoy = new Date().toISOString().slice(0, 10);
    const asistenciaHoy = (attendanceRecords || []).filter((a: any) => String(a.date || '').slice(0, 10) === hoy);
    const presentesHoy = asistenciaHoy.filter((a: any) =>
      ['PRESENTE', 'PRESENT', 'RETARDO', 'LATE', 'REMOTE'].includes(String(a.status || '').toUpperCase())
    ).length;

    const ausenciasPendientes = (absenceRequests || []).filter((a: any) =>
      ['PENDIENTE', 'PENDING'].includes(String(a.status || '').toUpperCase())
    ).length;

    const porDepartamento = new Map<string, number>();
    activos.forEach((e: any) => {
      const nombre = e.department_name || e.departmentName || e.department || 'Sin departamento';
      porDepartamento.set(nombre, (porDepartamento.get(nombre) || 0) + 1);
    });

    return {
      headcountActive: activos.length,
      presentToday: presentesHoy,
      attendanceRecordedToday: asistenciaHoy.length,
      absencesPending: ausenciasPendientes,
      byDepartment: Array.from(porDepartamento.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
    };
  }, [visibles, employees, attendanceRecords, absenceRequests]);

  if (visibles.length === 0) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div>
          <h3 className="text-sm font-bold text-amber-900">Sin dashboard asignado</h3>
          <p className="mt-1 text-xs leading-relaxed text-amber-800">
            Este dashboard muestra indicadores por departamento a jefes de área y
            Dirección. Tu rol ({currentUser?.role}) no tiene uno de los cinco
            departamentos cubiertos (Ventas, Compras, Almacén, Logística, RH).
          </p>
        </div>
      </div>
    );
  }

  if (!activeDept) return null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Building2 className="h-5 w-5 text-blue-600" />
        <h2 className="text-sm font-bold text-slate-900">Dashboard por Departamento</h2>

        {visibles.length > 1 && (
          <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
            Vista de {currentUser?.role === 'DIRECTOR' ? 'Dirección' : 'Administración'} · {visibles.length} departamentos
          </span>
        )}

        <button
          onClick={cargar}
          disabled={cargando}
          className="no-print ml-auto flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${cargando ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {visibles.length > 1 && (
        <div className="no-print flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          {visibles.map((d) => {
            const Icono = DEPT_ICON[d];
            const activo = activeDept === d;
            return (
              <button
                key={d}
                onClick={() => setActiveDept(d)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer ${
                  activo ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icono className="h-3.5 w-3.5" />
                {DEPT_LABEL[d]}
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <p className="text-xs text-red-800">{error}</p>
        </div>
      )}

      {activeDept === 'sales' && <SalesPanel kpis={data?.sales} cargando={cargando} />}
      {activeDept === 'purchasing' && <PurchasingPanel kpis={data?.purchasing} cargando={cargando} />}
      {activeDept === 'warehouse' && <WarehousePanel kpis={data?.warehouse} cargando={cargando} />}
      {activeDept === 'logistics' && <LogisticsPanel kpis={data?.logistics} cargando={cargando} />}
      {activeDept === 'hr' && <HRPanel kpis={hrKpis} totalDepartamentos={(departments || []).length} />}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Componentes de KPI reutilizables
// ---------------------------------------------------------------------------

const KpiCard: React.FC<{ titulo: string; valor: string; tono?: string }> = ({ titulo, valor, tono }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4">
    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{titulo}</div>
    <div className={`mt-1 text-xl font-black ${tono || 'text-slate-900'}`}>{valor}</div>
  </div>
);

const Ranking: React.FC<{ titulo: string; filas: { name: string; value: string; sub?: string }[] }> = ({
  titulo,
  filas,
}) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4">
    <h4 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-slate-700">{titulo}</h4>
    {filas.length === 0 ? (
      <p className="text-xs text-slate-400">Sin movimientos este mes.</p>
    ) : (
      <div className="space-y-1.5">
        {filas.map((f, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="truncate text-slate-700">{f.name}</span>
            <div className="flex shrink-0 items-center gap-2">
              {f.sub && <span className="text-[10px] text-slate-400">{f.sub}</span>}
              <span className="font-bold text-slate-900">{f.value}</span>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

const SalesPanel: React.FC<{ kpis?: SalesDepartmentKpis; cargando: boolean }> = ({ kpis, cargando }) => {
  if (!kpis) return <p className="text-xs text-slate-500">{cargando ? 'Cargando…' : 'Sin datos.'}</p>;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <KpiCard titulo="Ventas del mes" valor={money(kpis.revenueThisMonth)} tono="text-blue-700" />
        <KpiCard titulo="Pedidos del mes" valor={String(kpis.ordersThisMonth)} />
        <KpiCard titulo="Cotizaciones por autorizar" valor={String(kpis.quotesPendingAuth)} tono="text-amber-600" />
        <KpiCard titulo="Conversión de cotizaciones" valor={`${kpis.conversionRatePct}%`} />
      </div>
      <Ranking
        titulo="Vendedores del mes"
        filas={kpis.topSalespeople.map((v) => ({ name: v.name, value: money(v.revenue), sub: `${v.orderCount} pedidos` }))}
      />
    </div>
  );
};

const PurchasingPanel: React.FC<{ kpis?: PurchasingDepartmentKpis; cargando: boolean }> = ({ kpis, cargando }) => {
  if (!kpis) return <p className="text-xs text-slate-500">{cargando ? 'Cargando…' : 'Sin datos.'}</p>;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard titulo="Órdenes de compra abiertas" valor={String(kpis.ordersOpen)} />
        <KpiCard titulo="Gasto del mes" valor={money(kpis.spendThisMonth)} tono="text-blue-700" />
        <KpiCard titulo="Solicitudes pendientes" valor={String(kpis.requestsPending)} tono="text-amber-600" />
      </div>
      <Ranking
        titulo="Proveedores del mes"
        filas={kpis.topSuppliers.map((v) => ({ name: v.name, value: money(v.spend), sub: `${v.orderCount} órdenes` }))}
      />
    </div>
  );
};

const WarehousePanel: React.FC<{ kpis?: WarehouseDepartmentKpis; cargando: boolean }> = ({ kpis, cargando }) => {
  if (!kpis) return <p className="text-xs text-slate-500">{cargando ? 'Cargando…' : 'Sin datos.'}</p>;
  return (
    <div className="grid gap-3 sm:grid-cols-4">
      <KpiCard titulo="Valor de inventario" valor={money(kpis.inventoryValue)} tono="text-blue-700" />
      <KpiCard titulo="Materiales con existencia" valor={String(kpis.skusInStock)} />
      <KpiCard titulo="Pedidos por surtir" valor={String(kpis.ordersToFulfill)} />
      <KpiCard
        titulo="Bajo su mínimo"
        valor={String(kpis.reorderAlertsCount)}
        tono={kpis.reorderAlertsCount > 0 ? 'text-red-600' : 'text-emerald-600'}
      />
    </div>
  );
};

const LogisticsPanel: React.FC<{ kpis?: LogisticsDepartmentKpis; cargando: boolean }> = ({ kpis, cargando }) => {
  if (!kpis) return <p className="text-xs text-slate-500">{cargando ? 'Cargando…' : 'Sin datos.'}</p>;
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard titulo="Rutas de hoy" valor={String(kpis.routesToday)} />
        <KpiCard titulo="Rutas completadas" valor={String(kpis.routesCompleted)} tono="text-emerald-600" />
        <KpiCard titulo="Pedidos en ruta" valor={String(kpis.ordersInRoute)} />
      </div>
      <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-500">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          La puntualidad de entrega no se muestra: el modelo actual no guarda una hora
          prometida por parada, así que no hay base real para calcular ese porcentaje.
        </span>
      </div>
    </div>
  );
};

const HRPanel: React.FC<{
  kpis: {
    headcountActive: number;
    presentToday: number;
    attendanceRecordedToday: number;
    absencesPending: number;
    byDepartment: { name: string; count: number }[];
  } | null;
  totalDepartamentos: number;
}> = ({ kpis, totalDepartamentos }) => {
  if (!kpis) return <p className="text-xs text-slate-500">Sin datos.</p>;
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-[11px] text-blue-800">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          Estos indicadores se calculan en tu navegador a partir de la asistencia y las
          ausencias capturadas en esta sesión: el servidor todavía no guarda esos
          registros de forma persistente.
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <KpiCard titulo="Plantilla activa" valor={String(kpis.headcountActive)} />
        <KpiCard
          titulo="Asistencia registrada hoy"
          valor={`${kpis.presentToday} / ${kpis.attendanceRecordedToday}`}
        />
        <KpiCard titulo="Departamentos" valor={String(totalDepartamentos)} />
        <KpiCard
          titulo="Ausencias por autorizar"
          valor={String(kpis.absencesPending)}
          tono={kpis.absencesPending > 0 ? 'text-amber-600' : 'text-emerald-600'}
        />
      </div>

      <Ranking
        titulo="Plantilla por departamento"
        filas={kpis.byDepartment.map((d) => ({ name: d.name, value: String(d.count) }))}
      />
    </div>
  );
};
