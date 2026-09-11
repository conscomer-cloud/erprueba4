/**
 * @license
 * CONSCORE ERP IA - AI Inventory Forecast View
 * Preventive Stockout Detection, Reorder Optimization & Deadstock Analytics
 */

import React, { useState } from 'react';
import { InventoryForecastItem } from '../../types/predictiveOperationsTypes';
import { PredictiveOperationsService } from '../../services/predictiveOperationsService';
import { DataClassificationBadge } from './DataClassificationBadge';
import {
  Boxes,
  AlertTriangle,
  AlertOctagon,
  CheckCircle,
  Archive,
  RefreshCw,
  Search,
  Filter,
  ArrowDownRight,
  TrendingDown,
  TrendingUp,
  PackageCheck,
} from 'lucide-react';

export const InventoryForecastView: React.FC = () => {
  const [items] = useState<InventoryForecastItem[]>(
    PredictiveOperationsService.getInventoryForecasts()
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      (item.productName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.sku || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.category || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatMoney = (n: number) =>
    `$${(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;

  const getStatusBadge = (status: InventoryForecastItem['status']) => {
    switch (status) {
      case 'RUPTURA_CRITICA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" /> RUPTURA CRÍTICA
          </span>
        );
      case 'REORDEN_INMEDIATO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> REORDEN INMEDIATO
          </span>
        );
      case 'SOBREINVENTARIO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Boxes className="w-3.5 h-3.5 text-blue-600" /> SOBREINVENTARIO
          </span>
        );
      case 'BAJA_ROTACION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <TrendingDown className="w-3.5 h-3.5 text-slate-500" /> BAJA ROTACIÓN
          </span>
        );
      case 'INMOVILIZADO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-stone-100 text-stone-800 border border-stone-300">
            <Archive className="w-3.5 h-3.5 text-stone-600" /> INMOVILIZADO
          </span>
        );
      case 'OPTIMO':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> ÓPTIMO
          </span>
        );
    }
  };

  const criticalCount = items.filter((i) => i.status === 'RUPTURA_CRITICA').length;
  const reorderCount = items.filter((i) => i.status === 'REORDEN_INMEDIATO').length;
  const totalImpact = items.reduce((acc, curr) => acc + curr.impactoEconomico, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner with KPIs */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">AI Inventory Forecast</h2>
            <DataClassificationBadge classification="PROJECTED" />
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Detección predictiva de rupturas de stock, puntos de reorden y análisis de inventario ocioso.
          </p>
        </div>

        {/* Quick KPI pills */}
        <div className="flex items-center gap-3">
          <div className="bg-rose-50 border border-rose-200 px-3.5 py-2 rounded-lg text-center">
            <div className="text-xs font-semibold text-rose-700 uppercase">Rupturas Críticas</div>
            <div className="text-lg font-bold text-rose-900">{criticalCount} SKUs</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 px-3.5 py-2 rounded-lg text-center">
            <div className="text-xs font-semibold text-amber-700 uppercase">Reorden Urgente</div>
            <div className="text-lg font-bold text-amber-900">{reorderCount} SKUs</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 px-3.5 py-2 rounded-lg text-center">
            <div className="text-xs font-semibold text-purple-700 uppercase">Monto en Riesgo</div>
            <div className="text-lg font-bold text-purple-900">{formatMoney(totalImpact)}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por SKU, producto o categoría técnica..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="RUPTURA_CRITICA">Ruptura Crítica</option>
            <option value="REORDEN_INMEDIATO">Reorden Inmediato</option>
            <option value="SOBREINVENTARIO">Sobreinventario</option>
            <option value="BAJA_ROTACION">Baja Rotación</option>
            <option value="INMOVILIZADO">Inmovilizado</option>
            <option value="OPTIMO">Óptimo</option>
          </select>
        </div>
      </div>

      {/* Table of Inventory Predictions */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">SKU & Producto</th>
                <th className="px-3 py-3 text-right">Stock Disp.</th>
                <th className="px-3 py-3 text-right">Demanda 30D</th>
                <th className="px-3 py-3 text-center">Cobertura</th>
                <th className="px-3 py-3 text-center">Riesgo Ruptura</th>
                <th className="px-3 py-3 text-right">Impacto Económico</th>
                <th className="px-4 py-3">Estado Predictivo</th>
                <th className="px-4 py-3">Recomendación IA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => (
                <tr key={item.productId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-slate-900">{item.productName}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                        {item.sku}
                      </span>
                      <span>{item.category}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-right font-mono font-medium text-slate-900">
                    <div>{item.stockDisponible} u.</div>
                    <div className="text-xs text-slate-400">Total: {item.stockActual}</div>
                  </td>
                  <td className="px-3 py-3.5 text-right font-mono font-medium text-slate-700">
                    {item.demandaProyectada30D} u.
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-xs ${
                        item.diasEstimadosCobertura <= 7
                          ? 'bg-rose-100 text-rose-800'
                          : item.diasEstimadosCobertura <= 15
                          ? 'bg-amber-100 text-amber-800'
                          : item.diasEstimadosCobertura > 120
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {((item.diasEstimadosCobertura ?? 0)).toFixed(1)} días
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            item.probabilidadRuptura > 70
                              ? 'bg-rose-500'
                              : item.probabilidadRuptura > 30
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${item.probabilidadRuptura}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-700">
                        {item.probabilidadRuptura}%
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-right font-mono font-bold text-slate-900">
                    {formatMoney(item.impactoEconomico)}
                  </td>
                  <td className="px-4 py-3.5">{getStatusBadge(item.status)}</td>
                  <td className="px-4 py-3.5 max-w-xs">
                    <div className="text-xs text-slate-600 line-clamp-2" title={item.recomendacion}>
                      {item.recomendacion}
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
