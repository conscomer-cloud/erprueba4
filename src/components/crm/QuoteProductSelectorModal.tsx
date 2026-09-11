/**
 * CONSCORE ERP IA — Quote Product Selector Modal
 * OBSERVACIÓN 09: Buscador de productos con referencia clara de Stock Disponible y Estado de Entrega
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Package,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building2,
  ChevronDown,
  ChevronUp,
  Plus,
  Info,
} from 'lucide-react';
import { Product } from '../../types/erp';
import {
  QuoteAvailabilityService,
  ProductAvailabilityResult,
} from '../../services/quoteAvailabilityService';

interface QuoteProductSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (product: Product, quantity: number) => void;
}

export const QuoteProductSelectorModal: React.FC<QuoteProductSelectorModalProps> = ({
  isOpen,
  onClose,
  products,
  onSelectProduct,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'IN_STOCK' | 'NO_STOCK'>('ALL');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [expandedWarehouses, setExpandedWarehouses] = useState<Record<string, boolean>>({});

  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const term = searchTerm.toLowerCase().trim();
      const code = (prod.code || '').toLowerCase();
      const sku = (prod.sku || '').toLowerCase();
      const name = (prod.name || '').toLowerCase();
      const desc = (prod.description || '').toLowerCase();
      const cat = (prod.category || (prod as any).category_name || '').toLowerCase();

      const matchesSearch =
        term === '' ||
        code.includes(term) ||
        sku.includes(term) ||
        name.includes(term) ||
        desc.includes(term) ||
        cat.includes(term);

      if (!matchesSearch) return false;

      const avail = QuoteAvailabilityService.getAvailableStock(prod);
      if (filterMode === 'IN_STOCK') return avail > 0;
      if (filterMode === 'NO_STOCK') return avail <= 0;
      return true;
    });
  }, [products, searchTerm, filterMode]);

  if (!isOpen) return null;

  const handleQuantityChange = (productId: string, val: number) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(1, val),
    }));
  };

  const toggleWarehouse = (productId: string) => {
    setExpandedWarehouses((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  return (
    <div
      id="quote-product-selector-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4"
    >
      <div className="relative flex flex-col w-full max-w-4xl h-[90vh] rounded-xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900">
          <div>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-yellow-400" />
              <h3 className="text-base font-bold text-white tracking-wide">
                Catálogo Comercial — Disponibilidad de Stock
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Consulta de existencias libres para venta y estado de entrega previa cotización
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Disclaimer Bar (Observación 09 - Sección 16) */}
        <div className="flex items-center gap-2 px-6 py-2.5 bg-blue-950/30 border-b border-blue-900/30 text-[11px] text-blue-300">
          <Info className="h-4 w-4 shrink-0 text-blue-400" />
          <span>
            <b>Regla Comercial:</b> Disponibilidad sujeta a confirmación al generar pedido. Una cotización <b>NO</b> reserva ni aparta inventario físico en almacén.
          </span>
        </div>

        {/* Search and Filters Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              id="quote-product-search-input"
              type="text"
              placeholder="Buscar por SKU, código, nombre de material o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-yellow-400 focus:outline-none"
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                filterMode === 'ALL'
                  ? 'bg-yellow-400 text-slate-950 shadow-xs'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Todos ({products.length})
            </button>
            <button
              onClick={() => setFilterMode('IN_STOCK')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                filterMode === 'IN_STOCK'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              En Existencia
            </button>
            <button
              onClick={() => setFilterMode('NO_STOCK')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                filterMode === 'NO_STOCK'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Sin Existencia
            </button>
          </div>
        </div>

        {/* Product Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500 text-center">
              <Package className="h-10 w-10 text-slate-600 mb-2" />
              <p className="text-sm font-semibold">No se encontraron productos coincidentes</p>
              <p className="text-xs text-slate-600 mt-1">Prueba modificando los términos de búsqueda</p>
            </div>
          ) : (
            filteredProducts.map((prod) => {
              const qtyRequested = quantities[prod.id] || 1;
              const avail: ProductAvailabilityResult = QuoteAvailabilityService.calculateAvailability(
                prod,
                qtyRequested
              );

              const isExpanded = expandedWarehouses[prod.id] || false;
              const hasWarehouses = avail.warehouses && avail.warehouses.length > 0;

              return (
                <div
                  key={prod.id}
                  id={`product-card-${prod.id}`}
                  className={`rounded-lg border transition-all p-4 ${
                    avail.isImmediateDelivery
                      ? 'border-slate-700 bg-slate-950/70 hover:border-emerald-600/50'
                      : avail.isPartialDelivery
                      ? 'border-amber-900/40 bg-amber-950/10 hover:border-amber-600/50'
                      : 'border-slate-800 bg-slate-950/40 hover:border-red-900/50'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Info Básica: SKU, Nombre, Precio de Lista */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-800 text-yellow-400 font-mono text-[11px] font-bold">
                          {avail.code}
                        </span>
                        {avail.sku !== avail.code && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            SKU: {avail.sku}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500 uppercase">
                          {prod.category || (prod as any).category_name || 'Aislamiento'}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white truncate" title={avail.name}>
                        {avail.name}
                      </h4>
                      {prod.description && (
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                          {prod.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 mt-2 text-xs">
                        <span className="text-slate-300">
                          Precio Lista:{' '}
                          <b className="text-emerald-400 font-semibold">
                            ${avail.listPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                          </b>{' '}
                          / {avail.unit}
                        </span>
                      </div>
                    </div>

                    {/* Stock Metrics (Físico, Reservado, Disponible) */}
                    <div className="flex flex-wrap md:flex-nowrap items-center gap-3 bg-slate-900/80 px-3.5 py-2 rounded-lg border border-slate-800">
                      <div className="text-center px-2">
                        <span className="text-[10px] text-slate-400 block uppercase">Físico</span>
                        <span className="text-xs font-semibold text-slate-300">
                          {avail.physicalStock} {avail.unit}
                        </span>
                      </div>
                      <div className="text-center px-2 border-l border-slate-800">
                        <span className="text-[10px] text-slate-400 block uppercase">Reservado</span>
                        <span className="text-xs font-semibold text-amber-400/80">
                          {avail.reservedStock} {avail.unit}
                        </span>
                      </div>
                      <div className="text-center px-2 border-l border-slate-800">
                        <span className="text-[10px] text-yellow-400 block uppercase font-bold">
                          Disponible
                        </span>
                        <span
                          className={`text-sm font-black ${
                            avail.availableStock > 0 ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {avail.availableStock} {avail.unit}
                        </span>
                      </div>
                    </div>

                    {/* Estado Comercial y Adición rápida */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                      {/* Control de cantidad para evaluar entrega */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400">Cant:</span>
                        <input
                          type="number"
                          min="1"
                          value={qtyRequested}
                          onChange={(e) => handleQuantityChange(prod.id, parseFloat(e.target.value) || 1)}
                          className="w-16 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-center font-bold text-white focus:border-yellow-400 focus:outline-none"
                        />
                      </div>

                      {/* Botón Agregar */}
                      <button
                        id={`btn-add-product-${prod.id}`}
                        onClick={() => {
                          onSelectProduct(prod, qtyRequested);
                          onClose();
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-400 text-slate-950 font-bold text-xs hover:bg-yellow-300 transition-colors shadow-xs"
                      >
                        <Plus className="h-3.5 w-3.5" /> Cotizar
                      </button>
                    </div>
                  </div>

                  {/* Estado de Entrega según cantidad solicitada */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {avail.isImmediateDelivery ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/50">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          ENTREGA INMEDIATA
                        </span>
                      ) : avail.isPartialDelivery ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-950 text-amber-300 border border-amber-800/50">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                          DISPONIBILIDAD PARCIAL
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-950 text-red-300 border border-red-800/50">
                          <Clock className="h-3.5 w-3.5 text-red-400" />
                          SIN STOCK DISPONIBLE
                        </span>
                      )}

                      <span className="text-[11px] text-slate-300">
                        {avail.isImmediateDelivery && (
                          <span>Surtido completo de {qtyRequested} {avail.unit} desde almacén.</span>
                        )}
                        {avail.isPartialDelivery && (
                          <span>
                            Disponible inmediato: <strong className="text-emerald-400">{avail.immediateAvailableQty}</strong> {avail.unit} | Pendiente por abastecer:{' '}
                            <strong className="text-amber-400">{avail.pendingQty}</strong> {avail.unit} (Validar tiempo de entrega)
                          </span>
                        )}
                        {avail.isNoStock && (
                          <span className="text-red-300">
                            Validar tiempo de entrega / Reabastecimiento bajo pedido con compras.
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Desglose Almacenes toggle */}
                    {hasWarehouses && (
                      <button
                        onClick={() => toggleWarehouse(prod.id)}
                        className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-yellow-400 transition-colors"
                      >
                        <Building2 className="h-3 w-3" />
                        {isExpanded ? 'Ocultar almacenes' : 'Ver stock por almacén'}
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>
                    )}
                  </div>

                  {/* Detalle por Almacén Expandible */}
                  {isExpanded && hasWarehouses && (
                    <div className="mt-2.5 rounded bg-slate-900 p-2.5 border border-slate-800 space-y-1.5 text-xs">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                        Disponibilidad por Ubicación de Almacén:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {avail.warehouses?.map((wh, wIdx) => (
                          <div key={wIdx} className="rounded bg-slate-950 p-2 border border-slate-800">
                            <span className="font-semibold text-white block truncate">{wh.warehouseName}</span>
                            {wh.locationCode && (
                              <span className="text-[10px] text-slate-500 block">Ubicación: {wh.locationCode}</span>
                            )}
                            <div className="flex justify-between items-center text-[11px] mt-1 pt-1 border-t border-slate-800/60">
                              <span className="text-slate-400">Disponible:</span>
                              <span className="font-bold text-emerald-400">
                                {wh.availableStock} {avail.unit}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-900 text-xs text-slate-400">
          <span>
            Mostrando <b>{filteredProducts.length}</b> de <b>{products.length}</b> materiales catalogados
          </span>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
          >
            Cerrar Selector
          </button>
        </div>
      </div>
    </div>
  );
};
