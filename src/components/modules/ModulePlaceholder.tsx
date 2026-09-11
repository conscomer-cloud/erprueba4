import React, { useState } from 'react';
import {
  Users,
  Factory,
  Receipt,
  Package,
  Building2,
  ShoppingCart,
  Truck,
  UserCheck,
  DollarSign,
  BarChart3,
  Megaphone,
  Plus,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { ERPModule } from '../../types/erp';
import { WarehouseLiveKardex } from './WarehouseLiveKardex';

interface ModulePlaceholderProps {
  module: ERPModule;
  onNavigate: (module: ERPModule) => void;
  onOpenSimulator?: () => void;
}

export const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({ module, onNavigate, onOpenSimulator }) => {
  const { customers, products, quotes, orders, warehouses, suppliers, movements, convertQuoteToOrder, recordMovement } = useERP();
  const [filterText, setFilterText] = useState('');

  if (module === 'INVENTARIO' || module === 'ALMACENES') {
    return <WarehouseLiveKardex onOpenSimulator={onOpenSimulator} />;
  }

  // Module configuration metadata
  const config = {
    CLIENTES: {
      title: 'Módulo de Clientes 360° (CRM B2B)',
      phase: 'Fase 3 — CRM y Clientes',
      icon: Users,
      description: 'Expedientes de constructoras, instaladores térmicos, contratistas HVAC, condiciones de crédito y precios especiales.',
      countLabel: `${customers.length} Clientes Activos`,
    },
    INVENTARIO: {
      title: 'Módulo de Inventarios & Catálogo Técnico',
      phase: 'Fase 4 — Inventario y Almacenes',
      icon: Factory,
      description: 'Control multialmacén de lana mineral, fibra de vidrio, poliestireno extruido (XPS), preformados y reflectivos.',
      countLabel: `${products.length} Productos en Catálogo`,
    },
    COTIZACIONES: {
      title: 'Módulo de Cotizaciones Comerciales',
      phase: 'Fase 5 — Cotizaciones',
      icon: Receipt,
      description: 'Generación de propuestas comerciales con validación de márgenes, listas de precios y conversión directa a pedidos.',
      countLabel: `${quotes.length} Cotizaciones Registradas`,
    },
    PEDIDOS: {
      title: 'Módulo de Pedidos & Surtido',
      phase: 'Fase 6 — Pedidos y Ventas',
      icon: Package,
      description: 'Reserva automática de inventario, tracking de surtido, órdenes de entrega y trazabilidad en almacén.',
      countLabel: `${orders.length} Pedidos en Proceso`,
    },
    ALMACENES: {
      title: 'Módulo de Almacenes & Ubicaciones',
      phase: 'Fase 4 — Almacenes y Racks',
      icon: Building2,
      description: 'Gestión física de naves, racks, pasillos y niveles para aislamiento térmico de gran volumen.',
      countLabel: `${warehouses.length} Centros de Distribución`,
    },
    COMPRAS: {
      title: 'Módulo de Compras & Proveedores',
      phase: 'Fase 7 — Compras y Proveedores',
      icon: ShoppingCart,
      description: 'Relación con fabricantes líderes (Owens Corning, Saint-Gobain, Rockwool, DOW) y órdenes de reabastecimiento.',
      countLabel: `${suppliers.length} Proveedores Calificados`,
    },
    LOGISTICA: {
      title: 'Módulo de Logística & Rutas de Entrega',
      phase: 'Fase 8 — Logística y Rutas',
      icon: Truck,
      description: 'Cubicaje de unidades pesadas (volumen vs peso de aislantes), optimización de rutas metropolitanas y foráneas.',
      countLabel: 'Flotilla & Rutas de Entrega',
    },
    RH: {
      title: 'Módulo de Recursos Humanos & Vendedores',
      phase: 'Fase 10 — Recursos Humanos y Comisiones',
      icon: UserCheck,
      description: 'Esquemas de comisiones variables por margen de utilidad, expedientes de choferes, almacenistas y fuerza de ventas.',
      countLabel: 'Gestión de Talento y Comisiones',
    },
    FINANZAS: {
      title: 'Módulo de Finanzas & Cobranza',
      phase: 'Fase 11 — Finanzas y Cobranza',
      icon: DollarSign,
      description: 'Antigüedad de saldos, control de líneas de crédito, cobranza preventiva y proyección de flujo de efectivo.',
      countLabel: 'Control de Cartera y Flujo',
    },
    MARKETING: {
      title: 'Módulo de Marketing & Generación de Demanda',
      phase: 'Fase 9 — Marketing y Prospectos',
      icon: Megaphone,
      description: 'Captación de proyectos de construcción industrial, licitaciones de aislamiento y nutrición de prospectos.',
      countLabel: 'Campañas y Prospectos B2B',
    },
    REPORTES: {
      title: 'Módulo de Reportes & Business Intelligence',
      phase: 'Fase 12 — Reportes y BI',
      icon: BarChart3,
      description: 'Tableros analíticos de rotación de inventario, rentabilidad por línea de producto y eficiencia de entrega.',
      countLabel: 'KPIs y Analítica Predictiva',
    },
    VENTAS: {
      title: 'Módulo de Ventas & Pipeline Comercial',
      phase: 'Fase 5 y 6 — Pipeline y Cierres',
      icon: Receipt,
      description: 'Pipeline integral de oportunidades, seguimiento a clientes y cumplimiento de metas por vendedor.',
      countLabel: 'Pipeline Comercial Activo',
    },
    AUDITORIA: {
      title: 'Auditoría',
      phase: 'Fase 0 — Núcleo',
      icon: Building2,
      description: '',
      countLabel: '',
    },
    DASHBOARD: {
      title: 'Dashboard',
      phase: 'Fase 0',
      icon: Building2,
      description: '',
      countLabel: '',
    },
    IA: {
      title: 'IA',
      phase: 'Fase 0',
      icon: Building2,
      description: '',
      countLabel: '',
    },
    CONFIGURACION: {
      title: 'Configuración',
      phase: 'Fase 0',
      icon: Building2,
      description: '',
      countLabel: '',
    },
  }[module];

  const Icon = config.icon;

  return (
    <div className="space-y-5">
      {/* Module Header Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-yellow-400 shadow-xs shrink-0">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-900">{config.title}</h2>
                <span className="rounded bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                  {config.phase}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
                {config.description}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="rounded-lg bg-slate-900 text-yellow-300 border border-slate-800 px-3 py-1.5 text-xs font-bold font-mono">
              {config.countLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Render Domain-Specific Live Data Table */}
      {module === 'CLIENTES' && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Directorio de Clientes B2B & Expedientes</h3>
            <span className="text-xs text-slate-400">Total: {customers.length} empresas registradas</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Código</th>
                  <th className="py-2.5 px-3">Razón Social & RFC</th>
                  <th className="py-2.5 px-3">Tipo / Segmento</th>
                  <th className="py-2.5 px-3">Contacto</th>
                  <th className="py-2.5 px-3">Ubicación</th>
                  <th className="py-2.5 px-3 text-right">Límite Crédito</th>
                  <th className="py-2.5 px-3 text-right">Saldo Actual</th>
                  <th className="py-2.5 px-3">Vendedor Asignado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-900">{c.code}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{c.businessName}</div>
                      <div className="text-[10px] font-mono text-slate-400">RFC: {c.rfc}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                        {c.customerType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="text-slate-800 font-medium">{c.contactName}</div>
                      <div className="text-[11px] text-slate-500">{c.email} · {c.phone}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{c.city}, {c.state}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-700">${(Number(c.creditLimit) || 0).toLocaleString('es-MX')}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">${(Number(c.currentBalance) || 0).toLocaleString('es-MX')}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700">{c.assignedSellerName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Los bloques de INVENTARIO y ALMACENES se eliminaron: la función
          retorna antes para esos dos módulos (ver arriba), así que ese JSX
          nunca llegaba a renderizarse. Eran ~85 líneas de código muerto. */}

      {module === 'COTIZACIONES' && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Historial de Cotizaciones Comerciales</h3>
            <span className="text-xs text-slate-400">Total: {quotes.length} cotizaciones</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Folio</th>
                  <th className="py-2.5 px-3">Cliente</th>
                  <th className="py-2.5 px-3">Vendedor</th>
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3">Estatus</th>
                  <th className="py-2.5 px-3 text-right">Subtotal</th>
                  <th className="py-2.5 px-3 text-right">IVA (16%)</th>
                  <th className="py-2.5 px-3 text-right">Total MXN</th>
                  <th className="py-2.5 px-3 text-center">Acción Transaccional</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quotes.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-900">{q.folio}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{q.customerName}</td>
                    <td className="py-2.5 px-3 text-slate-700">{q.sellerName}</td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">{q.quoteDate}</td>
                    <td className="py-2.5 px-3">
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        q.status === 'ACEPTADA' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {q.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">${(Number(q.subtotal) || 0).toLocaleString('es-MX')}</td>
                    <td className="py-2.5 px-3 text-right font-mono">${(Number(q.tax) || 0).toLocaleString('es-MX')}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">${(Number(q.total) || 0).toLocaleString('es-MX')}</td>
                    <td className="py-2.5 px-3 text-center">
                      {q.convertedToOrderId ? (
                        <span className="text-[11px] font-bold text-emerald-700">
                          Convertido a {q.convertedToOrderId}
                        </span>
                      ) : (
                        <button
                          onClick={() => convertQuoteToOrder(q.id)}
                          className="rounded bg-blue-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-blue-700 shadow-2xs"
                        >
                          Convertir a Pedido
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {module === 'PEDIDOS' && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Control de Pedidos & Embarques</h3>
            <span className="text-xs text-slate-400">Total: {orders.length} pedidos</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Folio Pedido</th>
                  <th className="py-2.5 px-3">Cotización Ref.</th>
                  <th className="py-2.5 px-3">Cliente</th>
                  <th className="py-2.5 px-3">Almacén Origen</th>
                  <th className="py-2.5 px-3">Fecha Pedido</th>
                  <th className="py-2.5 px-3">Prometida</th>
                  <th className="py-2.5 px-3">Estatus</th>
                  <th className="py-2.5 px-3 text-right">Total MXN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-900">{o.folio}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{o.quoteFolio || 'Directo'}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{o.customerName}</td>
                    <td className="py-2.5 px-3 text-slate-700">{o.warehouseName}</td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono">{o.orderDate}</td>
                    <td className="py-2.5 px-3 text-slate-800 font-semibold">{o.promisedDate}</td>
                    <td className="py-2.5 px-3">
                      <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                        {o.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">${(Number(o.total) || 0).toLocaleString('es-MX')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {module === 'COMPRAS' && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Directorio de Fabricantes y Proveedores Estratégicos</h3>
            <span className="text-xs text-slate-400">Total: {suppliers.length} proveedores</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suppliers.map((s) => (
              <div key={s.id} className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{s.name}</h4>
                    <p className="text-xs text-slate-500 font-mono">RFC: {s.rfc} · {s.category}</p>
                  </div>
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    Lead Time: {s.leadTimeDays} días
                  </span>
                </div>
                <div className="mt-3 text-xs text-slate-600 space-y-1">
                  <div>Contacto: <b>{s.contactName}</b> ({s.email})</div>
                  <div>Condiciones de Pago: <b>{s.paymentTerms}</b></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
