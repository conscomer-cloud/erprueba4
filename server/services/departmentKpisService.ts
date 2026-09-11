/**
 * KPIs por departamento para el dashboard departamental.
 *
 * Cubre Ventas, Compras, Almacén y Logística con datos que sí viven en el
 * servidor. RH tiene aquí solo la nómina activa: asistencia, ausencias y
 * comisiones no están en el esquema del servidor —viven en localStorage del
 * navegador, dentro de ERPContext— así que esos tres se calculan en el
 * cliente y no aquí. Mezclar ambas fuentes en un solo endpoint habría hecho
 * parecer que todo viene de un origen confiable cuando una parte no lo es.
 */

import { db } from '../db/database';

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const inicioMes = (): Date => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

const enMesActual = (fechaISO: string | undefined): boolean => {
  if (!fechaISO) return false;
  const t = Date.parse(fechaISO);
  return Number.isFinite(t) && t >= inicioMes().getTime();
};

// ---------------------------------------------------------------------------
// Ventas
// ---------------------------------------------------------------------------

export interface SalesDepartmentKpis {
  ordersThisMonth: number;
  revenueThisMonth: number;
  quotesPendingAuth: number;
  conversionRatePct: number;
  topSalespeople: { name: string; revenue: number; orderCount: number }[];
}

function buildSalesKpis(): SalesDepartmentKpis {
  const orders: any[] = db.getOrders() || [];
  const quotes: any[] = db.getQuotes() || [];

  const ordersDelMes = orders.filter(
    (o) => String(o.status || '').toUpperCase() !== 'CANCELADO' && enMesActual(o.orderDate || o.date || o.created_at)
  );
  const revenueThisMonth = ordersDelMes.reduce((s, o) => s + num(o.total), 0);

  const quotesPendingAuth = quotes.filter((q) =>
    ['PENDIENTE_AUTORIZACION', 'ENVIADA'].includes(String(q.status || '').toUpperCase())
  ).length;

  const quotesDelMes = quotes.filter((q) => enMesActual(q.created_at || q.createdAt));
  const convertidas = quotesDelMes.filter((q) =>
    ['CONVERTIDA', 'CONVERTIDA_A_PEDIDO'].includes(String(q.status || '').toUpperCase())
  ).length;
  const conversionRatePct = quotesDelMes.length > 0 ? Math.round((convertidas / quotesDelMes.length) * 100) : 0;

  const porVendedor = new Map<string, { revenue: number; orderCount: number }>();
  ordersDelMes.forEach((o) => {
    const nombre =
      o.salespersonName || o.salesperson_name || o.sellerName || 'Sin asignar';
    const reg = porVendedor.get(nombre) || { revenue: 0, orderCount: 0 };
    reg.revenue += num(o.total);
    reg.orderCount += 1;
    porVendedor.set(nombre, reg);
  });

  const topSalespeople = Array.from(porVendedor.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    ordersThisMonth: ordersDelMes.length,
    revenueThisMonth,
    quotesPendingAuth,
    conversionRatePct,
    topSalespeople,
  };
}

// ---------------------------------------------------------------------------
// Compras
// ---------------------------------------------------------------------------

export interface PurchasingDepartmentKpis {
  ordersOpen: number;
  spendThisMonth: number;
  requestsPending: number;
  topSuppliers: { name: string; spend: number; orderCount: number }[];
}

function buildPurchasingKpis(): PurchasingDepartmentKpis {
  const purchaseOrders: any[] = db.getPurchaseOrders() || [];
  const purchaseRequests: any[] = db.getPurchaseRequests() || [];

  const ordersOpen = purchaseOrders.filter((po) =>
    !['CANCELLED', 'COMPLETED', 'RECEIVED'].includes(String(po.status || '').toUpperCase())
  ).length;

  const ordersDelMes = purchaseOrders.filter((po) => enMesActual(po.order_date || po.orderDate));
  const spendThisMonth = ordersDelMes.reduce((s, po) => s + num(po.total), 0);

  const requestsPending = purchaseRequests.filter((pr) =>
    ['PENDIENTE', 'PENDIENTE_AUTORIZACION', 'BORRADOR'].includes(String(pr.status || '').toUpperCase())
  ).length;

  const porProveedor = new Map<string, { spend: number; orderCount: number }>();
  ordersDelMes.forEach((po) => {
    const nombre = po.supplier_name || po.supplierName || 'Sin proveedor';
    const reg = porProveedor.get(nombre) || { spend: 0, orderCount: 0 };
    reg.spend += num(po.total);
    reg.orderCount += 1;
    porProveedor.set(nombre, reg);
  });

  const topSuppliers = Array.from(porProveedor.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 5);

  return { ordersOpen, spendThisMonth, requestsPending, topSuppliers };
}

// ---------------------------------------------------------------------------
// Almacén
// ---------------------------------------------------------------------------

export interface WarehouseDepartmentKpis {
  inventoryValue: number;
  skusInStock: number;
  ordersToFulfill: number;
  reorderAlertsCount: number;
}

function buildWarehouseKpis(): WarehouseDepartmentKpis {
  const products: any[] = db.getProducts() || [];
  const orders: any[] = db.getOrders() || [];

  const inventoryValue = products.reduce(
    (s, p) => s + num(p.available_stock ?? p.availableStock) * num(p.cost ?? p.unitCost),
    0
  );
  const skusInStock = products.filter((p) => num(p.available_stock ?? p.availableStock) > 0).length;

  const ordersToFulfill = orders.filter((o) =>
    ['CONFIRMADO', 'RESERVADO', 'EN_SURTIDO'].includes(String(o.status || '').toUpperCase())
  ).length;

  // El punto de reorden completo ya lo calcula purchasesService en el
  // cliente con el detalle de proveedor y tiempo de entrega. Aquí solo se
  // cuenta cuántos materiales están por debajo de su mínimo, como aviso
  // rápido sin duplicar esa lógica.
  const reorderAlertsCount = products.filter((p) => {
    const stock = num(p.available_stock ?? p.availableStock);
    const minimo = num(p.minimum_stock ?? p.minStock);
    return minimo > 0 && stock < minimo;
  }).length;

  return { inventoryValue, skusInStock, ordersToFulfill, reorderAlertsCount };
}

// ---------------------------------------------------------------------------
// Logística
// ---------------------------------------------------------------------------

export interface LogisticsDepartmentKpis {
  routesToday: number;
  routesCompleted: number;
  ordersInRoute: number;
  onTimeDeliveryPct: number | null;
}

function buildLogisticsKpis(): LogisticsDepartmentKpis {
  const routes: any[] = db.getRoutes() || [];
  const hoy = new Date().toISOString().slice(0, 10);

  const routesHoy = routes.filter((r) => String(r.date || '').slice(0, 10) === hoy);
  const routesCompleted = routesHoy.filter((r) => String(r.status || '').toUpperCase() === 'COMPLETED').length;
  const ordersInRoute = routesHoy
    .filter((r) => String(r.status || '').toUpperCase() === 'IN_ROUTE')
    .reduce((s, r) => s + num(r.totalOrders ?? r.total_orders), 0);

  // Sin fecha prometida por parada en el modelo actual, no hay base para
  // calcular puntualidad real: se reporta null en vez de inventar un
  // porcentaje.
  const onTimeDeliveryPct = null;

  return { routesToday: routesHoy.length, routesCompleted, ordersInRoute, onTimeDeliveryPct };
}

// ---------------------------------------------------------------------------

export interface DepartmentKpisResult {
  generatedAt: string;
  sales: SalesDepartmentKpis;
  purchasing: PurchasingDepartmentKpis;
  warehouse: WarehouseDepartmentKpis;
  logistics: LogisticsDepartmentKpis;
}

export function buildDepartmentKpis(): DepartmentKpisResult {
  return {
    generatedAt: new Date().toISOString(),
    sales: buildSalesKpis(),
    purchasing: buildPurchasingKpis(),
    warehouse: buildWarehouseKpis(),
    logistics: buildLogisticsKpis(),
  };
}
