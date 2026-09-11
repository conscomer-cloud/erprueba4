import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Filter,
  Layers,
  ArrowUpDown,
  Search,
  AlertTriangle,
  Sparkles,
  PieChart,
  ShieldAlert,
} from 'lucide-react';
import {
  ProductProfitabilityRecord,
  CustomerProfitabilityRecord,
  SalesPerformanceRecord,
} from '../../types/erp';

interface ProfitabilityMatrixProps {
  products: ProductProfitabilityRecord[];
  customers: CustomerProfitabilityRecord[];
  sellers: SalesPerformanceRecord[];
}

export type ProfitabilityDimension = 'PRODUCTO' | 'CLIENTE' | 'VENDEDOR' | 'FAMILIA' | 'ZONA';

export const ProfitabilityMatrix: React.FC<ProfitabilityMatrixProps> = ({
  products,
  customers,
  sellers,
}) => {
  const [activeDimension, setActiveDimension] = useState<ProfitabilityDimension>('PRODUCTO');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'revenue' | 'margin' | 'marginPct'>('margin');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterLowMarginOnly, setFilterLowMarginOnly] = useState(false);

  // Normalización de datos para la matriz según dimensión
  const matrixData = useMemo(() => {
    if (activeDimension === 'PRODUCTO') {
      return products.map((p) => ({
        id: p.productId,
        name: p.name,
        code: p.sku,
        category: p.category,
        revenue: p.salesRevenue,
        cogs: p.cogs,
        grossMargin: p.grossMargin,
        grossMarginPct: p.grossMarginPct,
        commissions: p.salesRevenue * 0.03,
        logistics: p.salesRevenue * 0.02,
        contributionMargin: p.grossMargin - p.salesRevenue * 0.05,
        contributionMarginPct: p.salesRevenue > 0 ? ((p.grossMargin - p.salesRevenue * 0.05) / p.salesRevenue) * 100 : 0,
        risk: p.grossMarginPct < 25 ? 'ALTO' : p.grossMarginPct < 30 ? 'MEDIO' : 'BAJO',
        notes: p.aiInsight,
      }));
    }

    if (activeDimension === 'CLIENTE') {
      return customers.map((c) => ({
        id: c.customerId,
        name: c.name,
        code: c.code,
        category: c.segment,
        revenue: c.salesAccumulated,
        cogs: c.cogs,
        grossMargin: c.grossMargin,
        grossMarginPct: c.grossMarginPct,
        commissions: c.commissionsCost,
        logistics: c.logisticsCost,
        contributionMargin: c.netProfit,
        contributionMarginPct: c.netMarginPct,
        risk: c.creditRiskLevel === 'ALTO' ? 'ALTO' : c.grossMarginPct < 22 ? 'MEDIO' : 'BAJO',
        notes: c.aiRecommendation,
      }));
    }

    if (activeDimension === 'VENDEDOR') {
      return sellers.map((s) => ({
        id: s.sellerId,
        name: s.name,
        code: `VEND-${s.sellerId.slice(-2)}`,
        category: 'Comercial B2B',
        revenue: s.salesActual,
        cogs: s.salesActual - s.grossMarginGenerated,
        grossMargin: s.grossMarginGenerated,
        grossMarginPct: s.grossMarginPct,
        commissions: s.commissionsEarned,
        logistics: s.salesActual * 0.02,
        contributionMargin: s.grossMarginGenerated - s.commissionsEarned - s.salesActual * 0.02,
        contributionMarginPct: s.salesActual > 0 ? ((s.grossMarginGenerated - s.commissionsEarned - s.salesActual * 0.02) / s.salesActual) * 100 : 0,
        risk: s.grossMarginPct < 28 ? 'ALTO' : 'BAJO',
        notes: `Eficiencia: ${s.efficiencyScore}/100 · Conversión: ${s.conversionRatePct}%`,
      }));
    }

    if (activeDimension === 'FAMILIA') {
      // Agrupación por familia
      const map = new Map<string, any>();
      products.forEach((p) => {
        const cat = p.category || 'Otros';
        const existing = map.get(cat) || {
          id: cat,
          name: cat,
          code: cat.substring(0, 4).toUpperCase(),
          category: 'Familia Técnica',
          revenue: 0,
          cogs: 0,
          grossMargin: 0,
          commissions: 0,
          logistics: 0,
        };
        existing.revenue += p.salesRevenue;
        existing.cogs += p.cogs;
        existing.grossMargin += p.grossMargin;
        existing.commissions += p.salesRevenue * 0.03;
        existing.logistics += p.salesRevenue * 0.022;
        map.set(cat, existing);
      });

      return Array.from(map.values()).map((fam) => {
        const grossMarginPct = fam.revenue > 0 ? (fam.grossMargin / fam.revenue) * 100 : 0;
        const contributionMargin = fam.grossMargin - fam.commissions - fam.logistics;
        const contributionMarginPct = fam.revenue > 0 ? (contributionMargin / fam.revenue) * 100 : 0;
        return {
          ...fam,
          grossMarginPct: Number(grossMarginPct.toFixed(1)),
          contributionMargin: Number(contributionMargin.toFixed(2)),
          contributionMarginPct: Number(contributionMarginPct.toFixed(1)),
          risk: grossMarginPct < 28 ? 'MEDIO' : 'BAJO',
          notes: `Margen de familia técnica evaluado sobre ${products.filter((p) => p.category === fam.name).length} SKUs.`,
        };
      });
    }

    // ZONA
    return [
      {
        id: 'ZON-01',
        name: 'Zona Metropolitana Monterrey (NL)',
        code: 'MTY-METRO',
        category: 'Zona Industrial',
        revenue: 2450000,
        cogs: 1640000,
        grossMargin: 810000,
        grossMarginPct: 33.1,
        commissions: 73500,
        logistics: 38000,
        contributionMargin: 698500,
        contributionMarginPct: 28.5,
        risk: 'BAJO',
        notes: 'Zona de mayor margen gracias a rutas optimizadas y proximidad a CEDIS.',
      },
      {
        id: 'ZON-02',
        name: 'Corredor Saltillo - Ramos Arizpe (COAH)',
        code: 'SLT-RAMOS',
        category: 'Zona Automotriz',
        revenue: 1120000,
        cogs: 772800,
        grossMargin: 347200,
        grossMarginPct: 31.0,
        commissions: 33600,
        logistics: 28000,
        contributionMargin: 285600,
        contributionMarginPct: 25.5,
        risk: 'MEDIO',
        notes: 'Costo logístico de flete foráneo impacta 2.5 puntos de margen de contribución.',
      },
      {
        id: 'ZON-03',
        name: 'Zona Frontera Reynosa / Matamoros (TAM)',
        code: 'TAM-FRONTERA',
        category: 'Zona Maquiladora',
        revenue: 275000,
        cogs: 198000,
        grossMargin: 77000,
        grossMarginPct: 28.0,
        commissions: 8250,
        logistics: 14500,
        contributionMargin: 54250,
        contributionMarginPct: 19.7,
        risk: 'ALTO',
        notes: 'Margen de contribución bajo por costos de casetas y flete consolidado pequeño.',
      },
    ];
  }, [activeDimension, products, customers, sellers]);

  // Filtrado y ordenamiento
  const filteredData = useMemo(() => {
    return matrixData
      .filter((item) => {
        const matchesSearch =
          (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.code || "").toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLowMargin = !filterLowMarginOnly || item.grossMarginPct < 28;
        return matchesSearch && matchesLowMargin;
      })
      .sort((a, b) => {
        let valA = a.grossMargin;
        let valB = b.grossMargin;
        if (sortBy === 'revenue') {
          valA = a.revenue;
          valB = b.revenue;
        } else if (sortBy === 'marginPct') {
          valA = a.grossMarginPct;
          valB = b.grossMarginPct;
        }
        return sortOrder === 'desc' ? valB - valA : valA - valB;
      });
  }, [matrixData, searchTerm, sortBy, sortOrder, filterLowMarginOnly]);

  const top10MostProfitable = useMemo(() => {
    return [...matrixData].sort((a, b) => b.grossMargin - a.grossMargin).slice(0, 5);
  }, [matrixData]);

  const topMarginRisks = useMemo(() => {
    return [...matrixData].filter((item) => item.grossMarginPct < 26).slice(0, 4);
  }, [matrixData]);

  return (
    <div className="space-y-6">
      {/* Dimension Switcher & Controls */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl backdrop-blur-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-amber-400" />
              Dimensión:
            </span>
            {(['PRODUCTO', 'CLIENTE', 'VENDEDOR', 'FAMILIA', 'ZONA'] as ProfitabilityDimension[]).map((dim) => (
              <button
                key={dim}
                onClick={() => setActiveDimension(dim)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  activeDimension === dim
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                    : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                {dim === 'PRODUCTO' && '📦 Por Producto'}
                {dim === 'CLIENTE' && '🏢 Por Cliente'}
                {dim === 'VENDEDOR' && '👤 Por Vendedor'}
                {dim === 'FAMILIA' && '🏷️ Por Familia'}
                {dim === 'ZONA' && '📍 Por Zona'}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar entidad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-lg border border-slate-800 bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-hidden"
              />
            </div>

            <button
              onClick={() => setFilterLowMarginOnly(!filterLowMarginOnly)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                filterLowMarginOnly
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Solo Margen en Riesgo (&lt;28%)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Highlights Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top 5 más rentables */}
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-4">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                Top 5 Mayor Aporte de Margen Bruto
              </h3>
            </div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
              Alta Contribución
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {top10MostProfitable.map((item, idx) => (
              <div key={item.id} className="flex items-center justify-between text-xs py-1 px-2 rounded-md hover:bg-emerald-500/5">
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="font-mono text-emerald-400 font-bold w-4">{idx + 1}.</span>
                  <span className="text-slate-200 font-medium truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono font-bold text-white">${(item?.grossMargin || 0).toLocaleString('es-MX')} MXN</span>
                  <span className="text-[11px] font-bold text-emerald-400 w-12 text-right">{(item?.grossMarginPct || 0).toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Riesgo de Margen / Margen Diluido */}
        <div className="rounded-xl border border-rose-500/20 bg-rose-950/10 p-4">
          <div className="flex items-center justify-between pb-3 border-b border-rose-500/20">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-300">
                Detección de Riesgo de Margen Diluido
              </h3>
            </div>
            <span className="text-[10px] font-bold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded-full">
              Margen &lt; 26%
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {topMarginRisks.length > 0 ? (
              topMarginRisks.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs py-1 px-2 rounded-md hover:bg-rose-500/5">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="text-rose-400 font-bold">⚠️</span>
                    <span className="text-slate-200 font-medium truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-slate-300">${(item?.revenue || 0).toLocaleString('es-MX')}</span>
                    <span className="text-[11px] font-bold text-rose-400 w-12 text-right">{(item?.grossMarginPct || 0).toFixed(1)}%</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-4 text-center text-xs text-slate-400">
                No se detectaron entidades con margen inferior al umbral del 26%.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Código & Nombre</th>
                <th className="py-3 px-3">Categoría / Tipo</th>
                <th
                  onClick={() => { setSortBy('revenue'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
                  className="py-3 px-3 text-right cursor-pointer hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Venta Neta</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3 px-3 text-right">COGS (Kardex)</th>
                <th
                  onClick={() => { setSortBy('margin'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
                  className="py-3 px-3 text-right cursor-pointer hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Margen Bruto</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => { setSortBy('marginPct'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
                  className="py-3 px-3 text-right cursor-pointer hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>% Bruto</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3 px-3 text-right">Comisiones</th>
                <th className="py-3 px-3 text-right">Logística</th>
                <th className="py-3 px-3 text-right">Margen Contribución</th>
                <th className="py-3 px-4 text-center">Diagnóstico IA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredData.map((row) => (
                <tr key={row.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-white">{row.name}</div>
                    <div className="text-[10px] font-mono text-amber-400/80">{row.code}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-300">{row.category}</td>
                  <td className="py-3 px-3 text-right font-mono font-semibold text-white">
                    ${(row?.revenue || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-400">
                    ${(row?.cogs || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                    ${(row?.grossMargin || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold">
                    <span
                      className={`px-2 py-0.5 rounded-sm text-[11px] ${
                        (row?.grossMarginPct || 0) >= 32
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : (row?.grossMarginPct || 0) >= 26
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {(row?.grossMarginPct || 0).toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-400">
                    -${(row?.commissions || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-400">
                    -${(row?.logistics || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-amber-300">
                    ${(row?.contributionMargin || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    <div className="text-[10px] font-normal text-slate-400">{(row?.contributionMarginPct || 0).toFixed(1)}% neto</div>
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <div className="text-[11px] text-slate-300 leading-snug line-clamp-2" title={row.notes}>
                      {row.notes}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
