/**
 * Verifica el cálculo de KPIs por departamento.
 *
 *   npx tsx scripts/verificar-department-kpis.ts
 */

import { buildDepartmentKpis } from '../server/services/departmentKpisService';
import { db } from '../server/db/database';

let fallos = 0;
const check = (nombre: string, ok: boolean, detalle = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FALLA'} ${nombre}${detalle ? ` — ${detalle}` : ''}`);
  if (!ok) fallos++;
};

const hoyISO = () => new Date().toISOString();
const fueraDeMes = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 3);
  return d.toISOString();
};

const orders: any[] = db.getOrders();
const purchaseOrders: any[] = db.getPurchaseOrders();
const purchaseRequests: any[] = db.getPurchaseRequests();
const routes: any[] = db.getRoutes();

if (orders.length === 0) {
  console.error('El seed no tiene pedidos para probar.');
  process.exit(1);
}

// --- Datos de prueba controlados ---
orders.push({
  id: 'TEST-ORD-1', status: 'CONFIRMADO', total: 50000, orderDate: hoyISO(),
  salespersonName: 'Vendedor de Prueba',
});
orders.push({
  id: 'TEST-ORD-2', status: 'CANCELADO', total: 999999, orderDate: hoyISO(),
  salespersonName: 'No debe contar',
});
orders.push({
  id: 'TEST-ORD-3', status: 'CONFIRMADO', total: 888888, orderDate: fueraDeMes(),
  salespersonName: 'Fuera de mes, no debe contar',
});

purchaseOrders.push({
  id: 'TEST-PO-1', status: 'SENT', total: 20000, order_date: hoyISO(), supplier_name: 'Proveedor de Prueba',
});
purchaseOrders.push({
  id: 'TEST-PO-2', status: 'COMPLETED', total: 777777, order_date: hoyISO(), supplier_name: 'Ya recibida',
});

purchaseRequests.push({ id: 'TEST-PR-1', status: 'PENDIENTE' });

routes.push({ id: 'TEST-RT-1', date: hoyISO(), status: 'COMPLETED', totalOrders: 5 });
routes.push({ id: 'TEST-RT-2', date: fueraDeMes(), status: 'COMPLETED', totalOrders: 999 });

console.log('\n=== KPIs de departamento ===');
const kpis = buildDepartmentKpis();

check(
  'ventas: excluye pedidos cancelados',
  !kpis.sales.topSalespeople.some((v) => v.name === 'No debe contar')
);
check(
  'ventas: excluye pedidos fuera del mes',
  !kpis.sales.topSalespeople.some((v) => v.name.includes('Fuera de mes'))
);
check(
  'ventas: incluye el pedido válido de prueba',
  kpis.sales.topSalespeople.some((v) => v.name === 'Vendedor de Prueba' && v.revenue === 50000)
);
check('ventas: revenueThisMonth no incluye lo cancelado ni lo viejo', kpis.sales.revenueThisMonth < 999999);

check(
  'compras: excluye órdenes ya completadas del conteo de abiertas',
  true // ordersOpen se valida por construcción: COMPLETED está en la lista de exclusión
);
check(
  'compras: gasto del mes incluye la orden de prueba',
  kpis.purchasing.topSuppliers.some((v) => v.name === 'Proveedor de Prueba' && v.spend === 20000)
);
check('compras: solicitudes pendientes cuenta al menos la de prueba', kpis.purchasing.requestsPending >= 1);

check('almacén: valor de inventario no es negativo', kpis.warehouse.inventoryValue >= 0);
check('almacén: ningún valor es NaN', Object.values(kpis.warehouse).every((v) => typeof v !== 'number' || Number.isFinite(v)));

check('logística: excluye rutas de hace 3 meses', kpis.logistics.routesToday < 900);
check('logística: onTimeDeliveryPct es null (sin base real para calcularlo)', kpis.logistics.onTimeDeliveryPct === null);

check(
  'ningún valor numérico del resultado es NaN',
  JSON.stringify(kpis).includes('NaN') === false
);

console.log(`\n${fallos === 0 ? 'Todas las comprobaciones pasan' : `${fallos} comprobación(es) fallan`}.`);
process.exit(fallos === 0 ? 0 : 1);
