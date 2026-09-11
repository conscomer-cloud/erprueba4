/**
 * @license
 * CONSCORE ERP IA - Strategic Command Center View (BI Ejecutivo)
 * FASE 12 - 7 Pilares Estratégicos & Análisis Multidimensional
 */

import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Factory,
  Users,
  UserCheck,
  Megaphone,
  ArrowUpRight,
  ArrowDownRight,
  Sliders,
  Bot,
  AlertTriangle,
  CheckCircle,
  Clock,
  Layers,
  ChevronRight,
  Activity,
  ShieldCheck,
  PieChart,
} from 'lucide-react';
import {
  StrategicExecutiveKPIs,
  MultiDimensionalProfitabilityDimension,
} from '../../types/strategicPlanningTypes';

interface StrategicCommandCenterViewProps {
  kpis: StrategicExecutiveKPIs;
  multiDimBreakdown: MultiDimensionalProfitabilityDimension[];
  onOpenWhatIf: () => void;
  onOpenAIAdvisor: () => void;
  onOpenAlerts: () => void;
  onOpenActions: () => void;
}

export const StrategicCommandCenterView: React.FC<StrategicCommandCenterViewProps> = ({
  kpis,
  multiDimBreakdown,
  onOpenWhatIf,
  onOpenAIAdvisor,
  onOpenAlerts,
  onOpenActions,
}) => {
  const [selectedDimension, setSelectedDimension] = useState<'CLIENTE' | 'PRODUCTO' | 'VENDEDOR'>('CLIENTE');

  const filteredDimensions = multiDimBreakdown.filter((d) => d.dimensionType === selectedDimension);

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-950/90 via-slate-900 to-slate-950 p-6 border border-indigo-900/40 shadow-xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-black uppercase tracking-wider text-indigo-400">
              Executive Intelligence Dashboard
            </span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Tablero de Mando Integral & BI Estratégico
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            Monitoreo en tiempo real de los 7 pilares corporativos con datos oficiales certificados de Kardex, Facturación, Tesorería y Calidad.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={onOpenWhatIf}
            className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-950/50 transition-all flex items-center gap-2"
          >
            <Sliders className="h-4 w-4" />
            Simulador What-If
          </button>

          <button
            onClick={onOpenAIAdvisor}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-950/50 transition-all flex items-center gap-2"
          >
            <Bot className="h-4 w-4" />
            CONSCORE AI Advisor
          </button>
        </div>
      </div>

      {/* 7 Pilares Estratégicos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* PILAR 1: VENTAS */}
        <div className="rounded-xl bg-slate-800/80 border border-slate-700/80 p-4 shadow-sm hover:border-indigo-500/50 transition-all">
          <div className="flex items-center justify-between pb-2 border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                <DollarSign className="h-4 w-4" />
              </div>
              <span className="text-xs font-black text-white">1. VENTAS</span>
            </div>
            <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-bold">
              +{kpis?.salesGrowthYoYPct || 0}% YoY
            </span>
          </div>
          <div className="mt-3 space-y-2">
            <div>
              <p className="text-[11px] text-slate-400">Ventas Reales YTD</p>
              <p className="text-lg font-black text-white font-mono">
                ${(kpis?.actualSalesYTD || 0).toLocaleString('es-MX')} <span className="text-xs font-normal text-slate-400">MXN</span>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] border-t border-slate-700/40">
              <div>
                <span className="text-slate-400 block">Meta YTD:</span>
                <span className="font-mono text-slate-200">${(kpis?.salesTargetYTD || 0).toLocaleString('es-MX')}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Cumplimiento:</span>
                <span className="font-mono text-emerald-400 font-bold">{(kpis?.salesFulfillmentPct || 0).toFixed(1)}%</span>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 flex justify-between pt-1">
              <span>Ticket Promedio:</span>
              <span className="font-mono text-slate-200">${(kpis?.averageOrderTicket || 0).toLocaleString('es-MX')}</span>
            </div>
          </div>
        </div>

        {/* PILAR 2: RENTABILIDAD */}
        <div className="rounded-xl bg-slate-800/80 border border-slate-700/80 p-4 shadow-sm hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between pb-2 border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <TrendingUp className="h-4 w-4" />
              </div>
              <span className="text-xs font-black text-white">2. RENTABILIDAD</span>
            </div>
            <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-bold">
              EBITDA {kpis?.ebitdaMarginPct || 0}%
            </span>
          </div>
          <div className="mt-3 space-y-2">
            <div>
              <p className="text-[11px] text-slate-400">EBITDA Total YTD</p>
              <p className="text-lg font-black text-emerald-400 font-mono">
                ${(kpis?.ebitdaMXN || 0).toLocaleString('es-MX')} <span className="text-xs font-normal text-slate-400">MXN</span>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] border-t border-slate-700/40">
              <div>
                <span className="text-slate-400 block">Margen Bruto:</span>
                <span className="font-mono text-slate-200">{kpis?.grossMarginPct || 0}% (${(((kpis?.grossMarginMXN || 0)) / 1000000).toFixed(2)}M)</span>
              </div>
              <div>
                <span className="text-slate-400 block">Contribución:</span>
                <span className="font-mono text-cyan-400 font-bold">{kpis?.contributionMarginPct || 0}%</span>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 flex justify-between pt-1">
              <span>Top Cliente:</span>
              <span className="font-medium text-slate-200 truncate max-w-[130px]" title={kpis.topProfitableCustomer}>
                Ternium (44.2%)
              </span>
            </div>
          </div>
        </div>

        {/* PILAR 3: LIQUIDEZ */}
        <div className="rounded-xl bg-slate-800/80 border border-slate-700/80 p-4 shadow-sm hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between pb-2 border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <CreditCard className="h-4 w-4" />
              </div>
              <span className="text-xs font-black text-white">3. LIQUIDEZ</span>
            </div>
            <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded font-bold">
              DSO {kpis?.dsoDays || 0}d
            </span>
          </div>
          <div className="mt-3 space-y-2">
            <div>
              <p className="text-[11px] text-slate-400">Cash Disponible en Bancos</p>
              <p className="text-lg font-black text-cyan-400 font-mono">
                ${(kpis?.cashAvailableMXN || 0).toLocaleString('es-MX')} <span className="text-xs font-normal text-slate-400">MXN</span>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] border-t border-slate-700/40">
              <div>
                <span className="text-slate-400 block">CXC Cartera:</span>
                <span className="font-mono text-slate-200">${((kpis?.totalAR_CXC || 0) / 1000000).toFixed(2)}M</span>
              </div>
              <div>
                <span className="text-slate-400 block">CXP Proveed.:</span>
                <span className="font-mono text-slate-200">${((kpis?.totalAP_CXP || 0) / 1000000).toFixed(2)}M</span>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 flex justify-between pt-1">
              <span>Flujo Proyectado 30D:</span>
              <span className="font-mono text-emerald-400 font-bold">+${((kpis?.projectedCashFlow30D || 0) / 1000000).toFixed(2)}M</span>
            </div>
          </div>
        </div>

        {/* PILAR 4: OPERACIÓN */}
        <div className="rounded-xl bg-slate-800/80 border border-slate-700/80 p-4 shadow-sm hover:border-purple-500/50 transition-all">
          <div className="flex items-center justify-between pb-2 border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                <Factory className="h-4 w-4" />
              </div>
              <span className="text-xs font-black text-white">4. OPERACIÓN</span>
            </div>
            <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded font-bold">
              OTIF {kpis?.otifRatePct || 0}%
            </span>
          </div>
          <div className="mt-3 space-y-2">
            <div>
              <p className="text-[11px] text-slate-400">Rotación de Inventario</p>
              <p className="text-lg font-black text-white font-mono">
                {kpis?.inventoryTurnoverAnnual || 0} <span className="text-xs font-normal text-slate-400">veces/año</span>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] border-t border-slate-700/40">
              <div>
                <span className="text-slate-400 block">Capac. Almacén:</span>
                <span className="font-mono text-slate-200">{kpis?.warehouseCapacityUtilizedPct || 0}%</span>
              </div>
              <div>
                <span className="text-slate-400 block">Stock Crítico:</span>
                <span className="font-mono text-amber-400 font-bold">{kpis?.criticalStockSkusCount || 0} SKUs</span>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 flex justify-between pt-1">
              <span>Backorders:</span>
              <span className="font-mono text-slate-200">${(kpis?.backordersMXN || 0).toLocaleString('es-MX')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row of Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* PILAR 5: CLIENTES */}
        <div className="rounded-xl bg-slate-800/80 border border-slate-700/80 p-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Users className="h-4 w-4" />
              </div>
              <span className="text-xs font-black text-white">5. CLIENTES & CALIDAD</span>
            </div>
            <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-bold">
              NPS +{kpis?.npsScore || 0}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Clientes Activos:</span>
              <span className="font-mono font-bold text-white text-base">{kpis?.activeCustomersCount || 0} empresas</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Tasa de Retención:</span>
              <span className="font-mono font-bold text-emerald-400 text-base">{kpis?.customerRetentionRatePct || 0}%</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Health Score Promedio:</span>
              <span className="font-mono font-bold text-cyan-400">{kpis?.averageCustomerHealthScore || 0} pts</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">En Riesgo (Churn):</span>
              <span className="font-mono font-bold text-rose-400">{kpis?.churnRiskCustomersCount || 0} cuentas</span>
            </div>
          </div>
        </div>

        {/* PILAR 6: RECURSOS HUMANOS */}
        <div className="rounded-xl bg-slate-800/80 border border-slate-700/80 p-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-400">
                <UserCheck className="h-4 w-4" />
              </div>
              <span className="text-xs font-black text-white">6. RECURSOS HUMANOS</span>
            </div>
            <span className="text-[10px] font-mono bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-bold">
              {kpis?.totalHeadcount || 0} Colab.
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Rev / Empleado:</span>
              <span className="font-mono font-bold text-white text-base">${((kpis?.revenuePerEmployee || 0) / 1000000).toFixed(2)}M</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Capacitación:</span>
              <span className="font-mono font-bold text-emerald-400 text-base">{kpis?.trainingCompliancePct || 0}%</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Desempeño Promedio:</span>
              <span className="font-mono font-bold text-slate-200">{kpis?.averagePerformanceScore || 0}%</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Rotación Anual:</span>
              <span className="font-mono font-bold text-slate-200">{kpis?.annualTurnoverRatePct || 0}%</span>
            </div>
          </div>
        </div>

        {/* PILAR 7: MARKETING */}
        <div className="rounded-xl bg-slate-800/80 border border-slate-700/80 p-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400">
                <Megaphone className="h-4 w-4" />
              </div>
              <span className="text-xs font-black text-white">7. MARKETING & LEADS</span>
            </div>
            <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-bold">
              ROAS {kpis?.roasAverage || 0}x
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Leads Totales:</span>
              <span className="font-mono font-bold text-white text-base">{kpis?.totalLeadsCount || 0} ({kpis?.sqlCount || 0} SQL)</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">CAC Promedio:</span>
              <span className="font-mono font-bold text-slate-200 text-base">${(kpis?.customerAcquisitionCostCAC || 0).toLocaleString('es-MX')}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Revenue Atribuido:</span>
              <span className="font-mono font-bold text-cyan-400">${((kpis?.marketingAttributedRevenueMXN || 0) / 1000000).toFixed(2)}M</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">ROI Marketing:</span>
              <span className="font-mono font-bold text-emerald-400">+{kpis?.marketingRoiPct || 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Dimensional Profitability Breakdown Section */}
      <div className="rounded-2xl bg-slate-800/90 border border-slate-700/80 p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-700/60 gap-4">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <PieChart className="h-5 w-5 text-indigo-400" />
              Análisis Multidimensional de Rentabilidad Industrial
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Margen Bruto, Contribución y EBITDA desglosado por dimensión operativa (fuente Kardex & Facturación).
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setSelectedDimension('CLIENTE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedDimension === 'CLIENTE'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Por Cliente Tier
            </button>
            <button
              onClick={() => setSelectedDimension('PRODUCTO')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedDimension === 'PRODUCTO'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Por Producto
            </button>
            <button
              onClick={() => setSelectedDimension('VENDEDOR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedDimension === 'VENDEDOR'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Por Vendedor
            </button>
          </div>
        </div>

        {/* Breakdown Table */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 font-semibold bg-slate-900/40">
                <th className="py-3 px-4">Nombre / Entidad</th>
                <th className="py-3 px-3 text-right">Ventas Netas</th>
                <th className="py-3 px-3 text-right">Costo (COGS)</th>
                <th className="py-3 px-3 text-right">Margen Bruto</th>
                <th className="py-3 px-3 text-right">Margen Contribución</th>
                <th className="py-3 px-3 text-right">EBITDA</th>
                <th className="py-3 px-3 text-center">Pedidos</th>
                <th className="py-3 px-3 text-center">Data Tag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredDimensions.map((item) => (
                <tr key={item.id} className="hover:bg-slate-700/30 transition-colors font-mono text-[11px]">
                  <td className="py-3 px-4 font-sans font-bold text-slate-200 text-xs">
                    {item.name}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-200 font-medium">
                    ${(Number(item.revenueMXN) || 0).toLocaleString('es-MX')}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-400">
                    ${(Number(item.cogsMXN) || 0).toLocaleString('es-MX')}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-cyan-400">
                    ${(Number(item.grossMarginMXN) || 0).toLocaleString('es-MX')} ({item.grossMarginPct}%)
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-400">
                    ${(Number(item.contributionMarginMXN) || 0).toLocaleString('es-MX')} ({item.contributionMarginPct}%)
                  </td>
                  <td className="py-3 px-3 text-right font-black text-white">
                    ${(Number(item.ebitdaMXN) || 0).toLocaleString('es-MX')} ({item.ebitdaPct}%)
                  </td>
                  <td className="py-3 px-3 text-center text-slate-300">
                    {item.orderVolume}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                      {item.dataHonesty}
                    </span>
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
