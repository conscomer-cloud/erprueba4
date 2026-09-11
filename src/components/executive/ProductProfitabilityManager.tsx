import React, { useState } from 'react';
import {
  Package,
  Search,
  Star,
  DollarSign,
  AlertTriangle,
  Clock,
  Archive,
  TrendingUp,
  Sparkles,
  Layers,
} from 'lucide-react';
import { ProductProfitabilityRecord, ProductClassificationCategory } from '../../types/erp';

interface ProductProfitabilityManagerProps {
  products: ProductProfitabilityRecord[];
  onSelectProduct?: (productId: string) => void;
}

export const ProductProfitabilityManager: React.FC<ProductProfitabilityManagerProps> = ({
  products,
  onSelectProduct,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | ProductClassificationCategory>('ALL');

  const filtered = products.filter((p) => {
    const matchesSearch =
      (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.category || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedFilter === 'ALL' || p.classification === selectedFilter;
    return matchesSearch && matchesCategory;
  });

  const getClassificationBadge = (cat: ProductClassificationCategory) => {
    switch (cat) {
      case 'STAR':
        return {
          label: '⭐ ESTRELLA (STAR)',
          style: 'bg-amber-400 text-slate-950 font-black',
        };
      case 'CASH_GENERATOR':
        return {
          label: '💰 GENERADOR DE FLUJO',
          style: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
        };
      case 'LOW_MARGIN':
        return {
          label: '📉 MARGEN BAJO',
          style: 'bg-orange-500/20 text-orange-300 border border-orange-500/40',
        };
      case 'SLOW_MOVING':
        return {
          label: '🐢 MOVIMIENTO LENTO',
          style: 'bg-blue-500/20 text-blue-300 border border-blue-500/40',
        };
      case 'DEAD_STOCK':
        return {
          label: '📦 STOCK INMOVILIZADO',
          style: 'bg-slate-800 text-slate-400 border border-slate-700',
        };
      case 'CRITICAL_STOCK':
        return {
          label: '🚨 STOCK CRÍTICO',
          style: 'bg-rose-500/20 text-rose-300 border border-rose-500/50 animate-pulse',
        };
      default:
        return { label: cat, style: 'bg-slate-800 text-slate-300' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl backdrop-blur-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2 flex items-center gap-1">
              <Layers className="h-3.5 w-3.5 text-amber-400" />
              Matriz BCG / Clasificación:
            </span>
            {(['ALL', 'STAR', 'CASH_GENERATOR', 'CRITICAL_STOCK', 'LOW_MARGIN', 'SLOW_MOVING', 'DEAD_STOCK'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedFilter(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  selectedFilter === cat
                    ? 'bg-amber-400 text-slate-950 font-black'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                {cat === 'ALL' && 'Todos'}
                {cat === 'STAR' && '⭐ Estrella'}
                {cat === 'CASH_GENERATOR' && '💰 Generador'}
                {cat === 'CRITICAL_STOCK' && '🚨 Crítico'}
                {cat === 'LOW_MARGIN' && '📉 Bajo Margen'}
                {cat === 'SLOW_MOVING' && '🐢 Lento'}
                {cat === 'DEAD_STOCK' && '📦 Inmovilizado'}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar SKU, producto o familia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-hidden min-w-[240px]"
            />
          </div>
        </div>
      </div>

      {/* Grid of Products */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((prod) => {
          const badge = getClassificationBadge(prod.classification);
          return (
            <div
              key={prod.productId}
              onClick={() => onSelectProduct && onSelectProduct(prod.productId)}
              className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-md hover:border-amber-400/50 hover:bg-slate-900 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800/80">
                  <div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md ${badge.style}`}>
                      {badge.label}
                    </span>
                    <h4 className="text-sm font-bold text-white mt-2 leading-snug">{prod.name}</h4>
                    <div className="text-[11px] font-mono text-amber-400/80 mt-0.5">
                      {prod.sku} · {prod.category}
                    </div>
                  </div>
                </div>

                {/* Performance & Inventory Metrics */}
                <div className="grid grid-cols-2 gap-2 my-3.5 text-xs">
                  <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800/60">
                    <div className="text-[10px] text-slate-400">Ventas Facturadas</div>
                    <div className="font-mono font-bold text-white mt-0.5">
                      ${(prod?.salesRevenue || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{prod.unitsSold} u. vendidas</div>
                  </div>

                  <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800/60">
                    <div className="text-[10px] text-slate-400">Margen Bruto</div>
                    <div className="font-mono font-bold text-emerald-400 mt-0.5">
                      ${(prod?.grossMargin || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] font-bold text-emerald-400 mt-0.5">{prod.grossMarginPct}% margen</div>
                  </div>

                  <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800/60">
                    <div className="text-[10px] text-slate-400">Stock en Almacén</div>
                    <div className="font-mono font-bold text-amber-300 mt-0.5">
                      {prod.inventoryUnits} u. disponibles
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      ${(prod?.inventoryValuation || 0).toLocaleString('es-MX')} valuación
                    </div>
                  </div>

                  <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800/60">
                    <div className="text-[10px] text-slate-400">Días de Inventario</div>
                    <div className="font-mono font-bold text-slate-200 mt-0.5">
                      {prod.daysOfInventory} días
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Rotación: {prod.turnover}x</div>
                  </div>
                </div>
              </div>

              {/* AI Strategic Action */}
              <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-300 flex items-start gap-1.5">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-400 mt-0.5" />
                <span className="leading-tight">{prod.aiInsight}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
