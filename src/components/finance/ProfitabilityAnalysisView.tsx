/**
 * @license
 * CONSCORE ERP IA - Profitability Analysis View (Hotfix Observación 28)
 * FASE 7: Análisis Multidimensional de Rentabilidad Real
 * (Productos, Clientes, Vendedores, Campañas, Pedidos)
 */

import React, { useState, useMemo, Component } from 'react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import {
  TrendingUp,
  Award,
  Users,
  Package,
  Megaphone,
  ShoppingBag,
  Percent,
  DollarSign,
  Filter,
  Search,
  AlertCircle,
  RefreshCw,
  ShieldAlert,
  HelpCircle,
  X,
} from 'lucide-react';
import { ProfitabilityAnalysis } from '../../types/erp';
import { ErrorBoundaryProps, ErrorBoundaryState } from '../../types/errorBoundary';

// Safe numeric formatters
const safeNumber = (val: any, fallback = 0): number => {
  if (typeof val === 'number' && !Number.isNaN(val) && Number.isFinite(val)) {
    return val;
  }
  if (typeof val === 'string') {
    const parsed = parseFloat(val);
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
};

const formatCurrency = (val: any): string => {
  const num = safeNumber(val, 0);
  return `$${num.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatPercent = (val: any): string => {
  const num = safeNumber(val, 0);
  return `${num.toFixed(1)}%`;
};



class ProfitabilityErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  props!: ErrorBoundaryProps;
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[RentabilidadReal] Error caught by Error Boundary:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white rounded-xl border border-rose-200 p-8 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              No fue posible cargar Rentabilidad Real.
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Se produjo un error inesperado al procesar la información analítica.
              Puedes intentar recargar la vista.
            </p>
          </div>
          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            REINTENTAR
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const ProfitabilityAnalysisContent: React.FC = () => {
  const { getProfitabilityBreakdown, getProfitability } = useERP();
  const { currentUser, can } = useAuth();

  const [viewDimension, setViewDimension] = useState<'PRODUCTS' | 'CUSTOMERS' | 'SALES_REPS' | 'CAMPAIGNS' | 'ORDERS'>('PRODUCTS');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Role validation: ensure non-authorized users do not access financial margins without permission
  const hasFinancePermission = useMemo(() => {
    if (!currentUser) return true; // Default fallback for dev environment
    const role = (currentUser.role || '').toUpperCase();
    if (role === 'ADMIN' || role === 'ADMINISTRADOR' || role === 'DIRECTOR' || role === 'FINANZAS' || role === 'GERENTE') {
      return true;
    }
    if (can && can('FINANZAS', 'VIEW')) {
      return true;
    }
    return false;
  }, [currentUser, can]);

  // Safely retrieve breakdown data
  const breakdown: ProfitabilityAnalysis = useMemo(() => {
    try {
      if (typeof getProfitabilityBreakdown === 'function') {
        return getProfitabilityBreakdown();
      }
      if (typeof getProfitability === 'function') {
        return getProfitability();
      }
      return {
        byProduct: [],
        byCustomer: [],
        bySalesperson: [],
        byCampaign: [],
        byOrder: [],
        products: [],
        customers: [],
        salesReps: [],
        campaigns: [],
        orders: [],
      };
    } catch (err: any) {
      console.error('[RentabilidadReal] Error retrieving breakdown data:', err);
      setHasError(true);
      setErrorMessage(err?.message || 'Error al obtener datos de rentabilidad');
      return {
        byProduct: [],
        byCustomer: [],
        bySalesperson: [],
        byCampaign: [],
        byOrder: [],
        products: [],
        customers: [],
        salesReps: [],
        campaigns: [],
        orders: [],
      };
    }
  }, [getProfitabilityBreakdown, getProfitability]);

  // Arrays with safe fallbacks
  const products = useMemo(() => {
    return Array.isArray(breakdown.products)
      ? breakdown.products
      : Array.isArray(breakdown.byProduct)
      ? breakdown.byProduct
      : [];
  }, [breakdown]);

  const customers = useMemo(() => {
    return Array.isArray(breakdown.customers)
      ? breakdown.customers
      : Array.isArray(breakdown.byCustomer)
      ? breakdown.byCustomer
      : [];
  }, [breakdown]);

  const salesReps = useMemo(() => {
    return Array.isArray(breakdown.salesReps)
      ? breakdown.salesReps
      : Array.isArray(breakdown.bySalesperson)
      ? breakdown.bySalesperson
      : [];
  }, [breakdown]);

  const campaigns = useMemo(() => {
    return Array.isArray(breakdown.campaigns)
      ? breakdown.campaigns
      : Array.isArray(breakdown.byCampaign)
      ? breakdown.byCampaign
      : [];
  }, [breakdown]);

  const orders = useMemo(() => {
    return Array.isArray(breakdown.orders)
      ? breakdown.orders
      : Array.isArray(breakdown.byOrder)
      ? breakdown.byOrder
      : [];
  }, [breakdown]);

  // Calculate Overall Summary Metrics safely (Formula: Utilidad = Ventas - Costo, Margen % = Utilidad / Ventas * 100)
  const summary = useMemo(() => {
    const rawRev = breakdown.totalRevenue ?? orders.reduce((acc, o) => acc + safeNumber(o.revenue), 0);
    const rawCogs = breakdown.totalCogs ?? orders.reduce((acc, o) => acc + safeNumber(o.cost ?? o.cogs), 0);
    const totalRev = safeNumber(rawRev > 0 ? rawRev : products.reduce((acc, p) => acc + safeNumber(p.revenue), 0));
    const totalCogs = safeNumber(rawCogs > 0 ? rawCogs : products.reduce((acc, p) => acc + safeNumber(p.cost ?? p.cogs), 0));
    const grossProfit = totalRev - totalCogs;
    const grossMarginPct = totalRev > 0 ? (grossProfit / totalRev) * 100 : 0;

    return {
      totalRevenue: totalRev,
      totalCogs: totalCogs,
      grossProfit: grossProfit,
      grossMarginPct: grossMarginPct,
    };
  }, [breakdown, orders, products]);

  // Filtered lists based on search
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredProducts = useMemo(() => {
    if (!normalizedSearch) return products;
    return products.filter((p) => {
      const sku = (p.sku || '').toLowerCase();
      const name = (p.name || p.productName || '').toLowerCase();
      return sku.includes(normalizedSearch) || name.includes(normalizedSearch);
    });
  }, [products, normalizedSearch]);

  const filteredCustomers = useMemo(() => {
    if (!normalizedSearch) return customers;
    return customers.filter((c) => {
      const name = (c.name || c.customerName || '').toLowerCase();
      return name.includes(normalizedSearch);
    });
  }, [customers, normalizedSearch]);

  const filteredSalesReps = useMemo(() => {
    if (!normalizedSearch) return salesReps;
    return salesReps.filter((r) => {
      const name = (r.name || r.sellerName || '').toLowerCase();
      return name.includes(normalizedSearch);
    });
  }, [salesReps, normalizedSearch]);

  const filteredCampaigns = useMemo(() => {
    if (!normalizedSearch) return campaigns;
    return campaigns.filter((c) => {
      const name = (c.name || c.campaignName || '').toLowerCase();
      const channel = (c.channel || '').toLowerCase();
      return name.includes(normalizedSearch) || channel.includes(normalizedSearch);
    });
  }, [campaigns, normalizedSearch]);

  const filteredOrders = useMemo(() => {
    if (!normalizedSearch) return orders;
    return orders.filter((o) => {
      const folio = (o.folio || o.orderFolio || '').toLowerCase();
      const customer = (o.customerName || '').toLowerCase();
      return folio.includes(normalizedSearch) || customer.includes(normalizedSearch);
    });
  }, [orders, normalizedSearch]);

  const handleRetry = () => {
    setIsLoading(true);
    setHasError(false);
    setErrorMessage('');
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  };

  // 1. RBAC Restricted View
  if (!hasFinancePermission) {
    return (
      <div className="bg-white rounded-xl border border-amber-200 p-8 text-center space-y-4 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900">
            Acceso Restringido: Rentabilidad y Costos
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Tu perfil de usuario ({currentUser?.role || 'Consulta'}) no cuenta con privilegios para visualizar costos de adquisición y márgenes financieros consolidados. Contacta al Administrador de Finanzas si requieres autorización.
          </p>
        </div>
      </div>
    );
  }

  // 2. Loading State
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
        <p className="text-sm font-medium text-slate-600">
          Cargando análisis de rentabilidad real...
        </p>
      </div>
    );
  }

  // 3. Error State
  if (hasError) {
    return (
      <div className="bg-white rounded-xl border border-rose-200 p-8 text-center space-y-4 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900">
            No fue posible cargar Rentabilidad Real.
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {errorMessage || 'Ocurrió un error al procesar el estado de rentabilidad.'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          REINTENTAR
        </button>
      </div>
    );
  }

  // 4. Empty State
  const isGlobalEmpty =
    products.length === 0 &&
    customers.length === 0 &&
    salesReps.length === 0 &&
    campaigns.length === 0 &&
    orders.length === 0;

  if (isGlobalEmpty) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900">
            No hay información suficiente para calcular rentabilidad.
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Registra pedidos y operaciones de venta en el sistema para visualizar el desglose multidimensional de utilidad bruta y margen de contribución real.
          </p>
        </div>
      </div>
    );
  }

  // 5. Success State
  return (
    <div className="space-y-6">
      {/* Top Global Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ventas Netas */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Ventas Netas Totales</p>
            <h4 className="text-xl font-bold text-slate-900 mt-1 font-mono">
              {formatCurrency(summary.totalRevenue)}
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Ingresos reconocidos netos</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Costo de Venta */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Costo de Venta (COGS)</p>
            <h4 className="text-xl font-bold text-slate-900 mt-1 font-mono">
              {formatCurrency(summary.totalCogs)}
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Costo directo de mercancía</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* Utilidad Bruta */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Utilidad Bruta</p>
            <h4 className={`text-xl font-bold mt-1 font-mono ${summary.grossProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {formatCurrency(summary.grossProfit)}
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Venta neta menos costo directo</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Margen Bruto % */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Margen Bruto General</p>
            <h4 className="text-xl font-bold text-slate-900 mt-1 font-mono">
              {formatPercent(summary.grossMarginPct)}
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Rentabilidad sobre ingresos</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Percent className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Dimension Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        {/* Dimensional Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setViewDimension('PRODUCTS')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              viewDimension === 'PRODUCTS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            Por Producto ({products.length})
          </button>

          <button
            type="button"
            onClick={() => setViewDimension('CUSTOMERS')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              viewDimension === 'CUSTOMERS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Por Cliente ({customers.length})
          </button>

          <button
            type="button"
            onClick={() => setViewDimension('SALES_REPS')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              viewDimension === 'SALES_REPS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Por Vendedor ({salesReps.length})
          </button>

          <button
            type="button"
            onClick={() => setViewDimension('CAMPAIGNS')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              viewDimension === 'CAMPAIGNS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            Por Campaña ({campaigns.length})
          </button>

          <button
            type="button"
            onClick={() => setViewDimension('ORDERS')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              viewDimension === 'ORDERS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Por Pedido ({orders.length})
          </button>
        </div>

        {/* Real-time search */}
        <div className="relative w-full md:w-64 shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por código, nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* PRODUCTS DIMENSION */}
      {viewDimension === 'PRODUCTS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Rentabilidad por Producto / SKU</h3>
              <p className="text-xs text-slate-500">
                Cálculo basado en precio de venta real vs costo de adquisición promedio (CPP)
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {filteredProducts.length} registro{filteredProducts.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                  <th className="py-3 px-4">SKU / Código</th>
                  <th className="py-3 px-4">Descripción del Producto</th>
                  <th className="py-3 px-4 text-right">Precio Venta</th>
                  <th className="py-3 px-4 text-right">Costo Directo</th>
                  <th className="py-3 px-4 text-right">Utilidad Unit.</th>
                  <th className="py-3 px-4 text-right">Margen Bruto</th>
                  <th className="py-3 px-4 text-right">Ingresos Totales</th>
                  <th className="py-3 px-4 text-right">Utilidad Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      {searchTerm ? 'No se encontraron productos coincidentes.' : 'No hay productos disponibles.'}
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const price = safeNumber(p.price, 0);
                    const cost = safeNumber(p.cost ?? p.cogs, 0);
                    const unitProfit = price - cost;
                    const margin = safeNumber(p.marginPct ?? p.grossMarginPct, 0);
                    const revenue = safeNumber(p.revenue, 0);
                    const profit = safeNumber(p.profit ?? p.grossProfit, 0);

                    const isHigh = margin >= 35;
                    const isLow = margin < 20;

                    return (
                      <tr key={p.id || p.productId || p.sku} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{p.sku || 'N/A'}</td>
                        <td className="py-2.5 px-4 font-medium text-slate-800">{p.name || p.productName || 'Sin descripción'}</td>
                        <td className="py-2.5 px-4 text-right font-medium text-slate-700">{formatCurrency(price)}</td>
                        <td className="py-2.5 px-4 text-right font-medium text-slate-600">{formatCurrency(cost)}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-emerald-700">
                          +{formatCurrency(unitProfit)}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              isHigh ? 'bg-emerald-100 text-emerald-800' : isLow ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {formatPercent(margin)}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right font-medium text-slate-900">{formatCurrency(revenue)}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-emerald-800 text-sm">
                          {formatCurrency(profit)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CUSTOMERS DIMENSION */}
      {viewDimension === 'CUSTOMERS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Rentabilidad por Cliente</h3>
              <p className="text-xs text-slate-500">
                Ventas acumuladas, costo de mercancía vendida y margen bruto generado por cuenta
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {filteredCustomers.length} cliente{filteredCustomers.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4 text-center">Pedidos</th>
                  <th className="py-3 px-4 text-right">Venta Total</th>
                  <th className="py-3 px-4 text-right">Costo Total</th>
                  <th className="py-3 px-4 text-right">Utilidad Bruta</th>
                  <th className="py-3 px-4 text-right">Margen (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      {searchTerm ? 'No se encontraron clientes coincidentes.' : 'No hay clientes registrados.'}
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => {
                    const revenue = safeNumber(c.revenue, 0);
                    const cost = safeNumber(c.cost ?? c.cogs, 0);
                    const profit = safeNumber(c.profit ?? c.grossProfit, 0);
                    const margin = safeNumber(c.marginPct ?? c.grossMarginPct, 0);

                    return (
                      <tr key={c.id || c.customerId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-4 font-bold text-slate-900">{c.name || c.customerName || 'Cliente'}</td>
                        <td className="py-2.5 px-4 text-center font-medium text-slate-600">{safeNumber(c.orderCount, 0)}</td>
                        <td className="py-2.5 px-4 text-right font-medium text-slate-800">{formatCurrency(revenue)}</td>
                        <td className="py-2.5 px-4 text-right font-medium text-slate-600">{formatCurrency(cost)}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-emerald-800 text-sm">
                          {formatCurrency(profit)}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                            {formatPercent(margin)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SALES REPS DIMENSION */}
      {viewDimension === 'SALES_REPS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Rentabilidad por Ejecutivo de Ventas</h3>
              <p className="text-xs text-slate-500">
                Ventas cerradas, margen de contribución generado y comisiones estimadas
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {filteredSalesReps.length} ejecutivo{filteredSalesReps.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                  <th className="py-3 px-4">Ejecutivo de Ventas</th>
                  <th className="py-3 px-4 text-center">Pedidos Cerrados</th>
                  <th className="py-3 px-4 text-right">Venta Total</th>
                  <th className="py-3 px-4 text-right">Costo Mercancía</th>
                  <th className="py-3 px-4 text-right">Margen Bruto</th>
                  <th className="py-3 px-4 text-right">% Margen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSalesReps.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      {searchTerm ? 'No se encontraron ejecutivos coincidentes.' : 'No hay ejecutivos registrados.'}
                    </td>
                  </tr>
                ) : (
                  filteredSalesReps.map((r) => {
                    const revenue = safeNumber(r.revenue ?? r.totalRevenue, 0);
                    const cost = safeNumber(r.cost ?? r.cogs, 0);
                    const profit = safeNumber(r.profit ?? r.grossProfit, 0);
                    const margin = safeNumber(r.marginPct ?? r.grossMarginPct, 0);

                    return (
                      <tr key={r.id || r.sellerId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-4 font-bold text-slate-900">{r.name || r.sellerName || 'Ejecutivo'}</td>
                        <td className="py-2.5 px-4 text-center font-medium text-slate-600">{safeNumber(r.orderCount, 0)}</td>
                        <td className="py-2.5 px-4 text-right font-medium text-slate-800">{formatCurrency(revenue)}</td>
                        <td className="py-2.5 px-4 text-right font-medium text-slate-600">{formatCurrency(cost)}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-emerald-800 text-sm">
                          {formatCurrency(profit)}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {formatPercent(margin)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CAMPAIGNS DIMENSION */}
      {viewDimension === 'CAMPAIGNS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Rentabilidad por Campaña de Marketing (ROAS / ROI)</h3>
              <p className="text-xs text-slate-500">
                Gasto publicitario invertido vs ingresos y utilidad neta atribuida
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {filteredCampaigns.length} campaña{filteredCampaigns.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                  <th className="py-3 px-4">Campaña</th>
                  <th className="py-3 px-4 text-right">Inversión Gasto</th>
                  <th className="py-3 px-4 text-right">Ventas Atribuidas</th>
                  <th className="py-3 px-4 text-right">Utilidad Neta</th>
                  <th className="py-3 px-4 text-right">ROAS / Retorno</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      {searchTerm ? 'No se encontraron campañas coincidentes.' : 'No hay campañas registradas.'}
                    </td>
                  </tr>
                ) : (
                  filteredCampaigns.map((c) => {
                    const spend = safeNumber(c.spend ?? c.campaignCost, 0);
                    const revenue = safeNumber(c.revenue ?? c.attributedRevenue, 0);
                    const profit = safeNumber(c.profit ?? c.netProfit ?? c.grossProfit, 0);
                    const roi = safeNumber(c.roiPct, 0);

                    return (
                      <tr key={c.id || c.campaignId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-4 font-bold text-slate-900">{c.name || c.campaignName || 'Campaña'}</td>
                        <td className="py-2.5 px-4 text-right font-medium text-rose-700">{formatCurrency(spend)}</td>
                        <td className="py-2.5 px-4 text-right font-medium text-slate-900">{formatCurrency(revenue)}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-emerald-800 text-sm">
                          {formatCurrency(profit)}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                            {formatPercent(roi)} ROI
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ORDERS DIMENSION */}
      {viewDimension === 'ORDERS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Rentabilidad por Pedido Individual</h3>
              <p className="text-xs text-slate-500">
                Desglose a nivel pedido con margen neto por transacción
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {filteredOrders.length} pedido{filteredOrders.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                  <th className="py-3 px-4">Pedido / Folio</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4 text-right">Venta Total</th>
                  <th className="py-3 px-4 text-right">Costo Estimado</th>
                  <th className="py-3 px-4 text-right">Utilidad Bruta</th>
                  <th className="py-3 px-4 text-right">% Margen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      {searchTerm ? 'No se encontraron pedidos coincidentes.' : 'No hay pedidos registrados.'}
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => {
                    const revenue = safeNumber(o.revenue, 0);
                    const cost = safeNumber(o.cost ?? o.cogs, 0);
                    const profit = safeNumber(o.profit ?? o.grossProfit, 0);
                    const margin = safeNumber(o.marginPct ?? o.grossMarginPct, 0);

                    return (
                      <tr key={o.id || o.orderId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-4 font-bold font-mono text-slate-900">{o.folio || o.orderFolio || 'Folio'}</td>
                        <td className="py-2.5 px-4 font-medium text-slate-800">{o.customerName || 'Cliente'}</td>
                        <td className="py-2.5 px-4 text-right font-medium text-slate-900">{formatCurrency(revenue)}</td>
                        <td className="py-2.5 px-4 text-right font-medium text-slate-600">{formatCurrency(cost)}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-emerald-800 text-sm">
                          {formatCurrency(profit)}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                            {formatPercent(margin)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export const ProfitabilityAnalysisView: React.FC = () => {
  return (
    <ProfitabilityErrorBoundary>
      <ProfitabilityAnalysisContent />
    </ProfitabilityErrorBoundary>
  );
};
