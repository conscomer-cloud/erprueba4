import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  X,
  Users,
  Package,
  Receipt,
  Building2,
  ShoppingCart,
  Factory,
  ArrowRight,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { CommercialRLSService } from '../../services/commercialRLSService';
import { ERPModule } from '../../types/erp';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (module: ERPModule) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const { currentUser } = useAuth();
  const { customers, products, orders, quotes, suppliers, warehouses } = useERP();

  const isPrivileged = CommercialRLSService.isPrivilegedRole(currentUser?.role);
  const scopedCustomers = useMemo(() => {
    return isPrivileged ? customers : CommercialRLSService.scopeCustomers(customers, currentUser);
  }, [customers, currentUser, isPrivileged]);

  const scopedQuotes = useMemo(() => {
    return isPrivileged ? quotes : CommercialRLSService.scopeQuotes(quotes, currentUser);
  }, [quotes, currentUser, isPrivileged]);

  const scopedOrders = useMemo(() => {
    return isPrivileged ? orders : CommercialRLSService.scopeOrders(orders, currentUser);
  }, [orders, currentUser, isPrivileged]);

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;

    const matchedCustomers = scopedCustomers.filter(
      (c) =>
        (c.businessName || "").toLowerCase().includes(q) ||
        (c.code || "").toLowerCase().includes(q) ||
        (c.rfc || "").toLowerCase().includes(q) ||
        (c.contactName || "").toLowerCase().includes(q)
    );

    const matchedProducts = products.filter(
      (p) =>
        (p.name || "").toLowerCase().includes(q) ||
        (p.code || "").toLowerCase().includes(q) ||
        (p.sku || "").toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q)
    );

    const matchedQuotes = scopedQuotes.filter(
      (qt) =>
        (qt.folio || "").toLowerCase().includes(q) ||
        (qt.customerName || "").toLowerCase().includes(q) ||
        (qt.sellerName || "").toLowerCase().includes(q)
    );

    const matchedOrders = scopedOrders.filter(
      (o) =>
        (o.folio || "").toLowerCase().includes(q) ||
        (o.customerName || "").toLowerCase().includes(q) ||
        (o.quoteFolio && (o.quoteFolio || "").toLowerCase().includes(q))
    );

    const matchedSuppliers = suppliers.filter(
      (s) =>
        (s.name || "").toLowerCase().includes(q) ||
        (s.rfc || "").toLowerCase().includes(q) ||
        (s.category || "").toLowerCase().includes(q)
    );

    const matchedWarehouses = warehouses.filter(
      (w) =>
        (w.name || "").toLowerCase().includes(q) ||
        (w.code || "").toLowerCase().includes(q) ||
        (w.address || "").toLowerCase().includes(q)
    );

    const totalMatches =
      matchedCustomers.length +
      matchedProducts.length +
      matchedQuotes.length +
      matchedOrders.length +
      matchedSuppliers.length +
      matchedWarehouses.length;

    return {
      customers: matchedCustomers,
      products: matchedProducts,
      quotes: matchedQuotes,
      orders: matchedOrders,
      suppliers: matchedSuppliers,
      warehouses: matchedWarehouses,
      total: totalMatches,
    };
  }, [query, scopedCustomers, products, scopedOrders, scopedQuotes, suppliers, warehouses]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-slate-800 px-4 py-3 bg-slate-950">
          <Search className="h-5 w-5 text-amber-400 mr-3 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por cliente, producto, SKU, folio de pedido, cotización o proveedor..."
            autoFocus
            className="w-full bg-transparent text-sm text-white placeholder-slate-400 outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-white mr-2"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-400 hover:text-white"
          >
            Esc
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!query && (
            <div className="py-8 text-center text-slate-400 text-sm">
              <p className="font-semibold text-slate-300">Búsqueda Global Empresarial</p>
              <p className="text-xs text-slate-400 mt-1">
                Escribe al menos 2 caracteres para buscar en clientes, catálogo de aislamiento, pedidos y cotizaciones.
              </p>
            </div>
          )}

          {query && results && results.total === 0 && (
            <div className="py-8 text-center text-slate-400 text-sm">
              No se encontraron coincidencias para &quot;<span className="text-white">{query}</span>&quot;.
            </div>
          )}

          {/* Products Results */}
          {results && results.products.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                <Factory className="h-3.5 w-3.5" /> Catálogo de Productos ({results.products.length})
              </div>
              <div className="space-y-1.5">
                {results.products.slice(0, 4).map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => {
                      onNavigate('INVENTARIO');
                      onClose();
                    }}
                    className="group flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/40 p-2.5 hover:border-blue-500 hover:bg-slate-800 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-amber-300 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                        {prod.code}
                      </span>
                      <div>
                        <div className="text-sm font-medium text-slate-200 group-hover:text-white">
                          {prod.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          Stock disp: <b className="text-white">{prod.availableStock} {prod.unit}</b> · Precio: ${prod.price} MXN
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customers Results */}
          {results && results.customers.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-400 mb-2">
                <Users className="h-3.5 w-3.5" /> Clientes y Prospectos ({results.customers.length})
              </div>
              <div className="space-y-1.5">
                {results.customers.slice(0, 4).map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      onNavigate('CLIENTES');
                      onClose();
                    }}
                    className="group flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/40 p-2.5 hover:border-blue-500 hover:bg-slate-800 cursor-pointer transition-all"
                  >
                    <div>
                      <div className="text-sm font-medium text-slate-200 group-hover:text-white">
                        {c.businessName}
                      </div>
                      <div className="text-xs text-slate-400">
                        RFC: <span className="text-slate-300 font-mono">{c.rfc}</span> · Contacto: {c.contactName} · {c.city}, {c.state}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Orders Results */}
          {results && results.orders.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
                <Package className="h-3.5 w-3.5" /> Pedidos ({results.orders.length})
              </div>
              <div className="space-y-1.5">
                {results.orders.slice(0, 3).map((o) => (
                  <div
                    key={o.id}
                    onClick={() => {
                      onNavigate('PEDIDOS');
                      onClose();
                    }}
                    className="group flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/40 p-2.5 hover:border-blue-500 hover:bg-slate-800 cursor-pointer transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-300">
                          {o.folio}
                        </span>
                        <span className="text-xs rounded bg-slate-700 px-1.5 py-0.2 text-slate-300">
                          {o.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 mt-0.5">
                        {o.customerName} · Total: ${(Number(o.total) || 0).toLocaleString('es-MX')} MXN
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quotes Results */}
          {results && results.quotes.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-400 mb-2">
                <Receipt className="h-3.5 w-3.5" /> Cotizaciones ({results.quotes.length})
              </div>
              <div className="space-y-1.5">
                {results.quotes.slice(0, 3).map((q) => (
                  <div
                    key={q.id}
                    onClick={() => {
                      onNavigate('COTIZACIONES');
                      onClose();
                    }}
                    className="group flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/40 p-2.5 hover:border-blue-500 hover:bg-slate-800 cursor-pointer transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-purple-300">
                          {q.folio}
                        </span>
                        <span className="text-xs rounded bg-slate-700 px-1.5 py-0.2 text-slate-300">
                          {q.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 mt-0.5">
                        {q.customerName} · Total: ${(Number(q.total) || 0).toLocaleString('es-MX')} MXN
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 bg-slate-950 px-4 py-2 text-right text-[11px] text-slate-400">
          Usa las teclas de navegación o haz clic en cualquier resultado para abrir el módulo correspondiente.
        </div>
      </div>
    </div>
  );
};
