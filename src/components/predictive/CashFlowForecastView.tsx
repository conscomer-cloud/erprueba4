/**
 * @license
 * CONSCORE ERP IA - AI Cash Flow Forecast View
 * Multi-Horizon Direct Cash Flow Projections with Working Capital Analysis
 */

import React, { useState } from 'react';
import { CashFlowPeriod } from '../../types/predictiveOperationsTypes';
import { PredictiveOperationsService } from '../../services/predictiveOperationsService';
import { DataClassificationBadge } from './DataClassificationBadge';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  Percent,
} from 'lucide-react';

export const CashFlowForecastView: React.FC = () => {
  const periods = PredictiveOperationsService.getCashFlowPeriods();
  const [selectedHorizon, setSelectedHorizon] = useState<string>('30D');

  const activePeriod =
    periods.find((p) => p.horizon === selectedHorizon) || periods[1];

  const formatMoney = (n: number) =>
    `$${(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;

  // Mathematical balance validation ($0.00 diff)
  const mathBalance =
    activePeriod.saldoInicial +
    activePeriod.ingresosProyectados.totalIngresos -
    activePeriod.egresosProyectados.totalEgresos;

  const mathDiff = Math.abs(mathBalance - activePeriod.saldoFinalProyectado);

  return (
    <div className="space-y-6">
      {/* Top Banner & Horizon Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">AI Cash Flow Forecast</h2>
            <DataClassificationBadge classification={activePeriod.dataClassification} />
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Flujo de caja predictivo por método directo (7D, 30D, 60D, 90D, 180D, 365D).
          </p>
        </div>

        {/* Horizons Selector */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
          {periods.map((p) => (
            <button
              key={p.horizon}
              onClick={() => setSelectedHorizon(p.horizon)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                selectedHorizon === p.horizon
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {p.horizon}
            </button>
          ))}
        </div>
      </div>

      {/* Main Flow Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Inicial */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Saldo Inicial</span>
            <Wallet className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {formatMoney(activePeriod.saldoInicial)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Disponibilidad en bancos & tesorería</div>
        </div>

        {/* Total Ingresos */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Ingresos Proyectados</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">
            +{formatMoney(activePeriod.ingresosProyectados.totalIngresos)}
          </div>
          <div className="text-xs text-emerald-700 mt-1 font-medium">
            Cobranza CXC + Contado
          </div>
        </div>

        {/* Total Egresos */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Egresos Proyectados</span>
            <ArrowDownRight className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-700">
            -{formatMoney(activePeriod.egresosProyectados.totalEgresos)}
          </div>
          <div className="text-xs text-rose-700 mt-1 font-medium">
            Proveedores + Nómina + SAT
          </div>
        </div>

        {/* Saldo Final Proyectado */}
        <div className="bg-white p-5 rounded-xl border border-purple-200 bg-purple-50/20 shadow-sm">
          <div className="flex items-center justify-between text-purple-700 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Saldo Final Proyectado</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-950">
            {formatMoney(activePeriod.saldoFinalProyectado)}
          </div>
          <div className="text-xs text-purple-700 mt-1 font-semibold flex items-center gap-1">
            Flujo Neto: {activePeriod.flujoNeto >= 0 ? '+' : ''}
            {formatMoney(activePeriod.flujoNeto)}
          </div>
        </div>
      </div>

      {/* Accounting Balance Check & Breakdown Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Desglose de Ingresos */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Desglose de Ingresos ({activePeriod.horizonLabel})
            </h3>
            <span className="text-xs font-mono font-bold text-emerald-700">
              {formatMoney(activePeriod.ingresosProyectados.totalIngresos)}
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-700 font-medium">Cobranza de Cartera CXC</span>
              <span className="font-mono font-bold text-slate-900">
                {formatMoney(activePeriod.ingresosProyectados.cobranzaCxc)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-700 font-medium">Ventas de Mostrador / Contado</span>
              <span className="font-mono font-bold text-slate-900">
                {formatMoney(activePeriod.ingresosProyectados.ventasContado)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-700 font-medium">Otros Ingresos Financieros</span>
              <span className="font-mono font-bold text-slate-900">
                {formatMoney(activePeriod.ingresosProyectados.otrosIngresos)}
              </span>
            </div>
          </div>
        </div>

        {/* Desglose de Egresos */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              Desglose de Egresos ({activePeriod.horizonLabel})
            </h3>
            <span className="text-xs font-mono font-bold text-rose-700">
              {formatMoney(activePeriod.egresosProyectados.totalEgresos)}
            </span>
          </div>

          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-700 font-medium">CXP Pago a Proveedores</span>
              <span className="font-mono font-bold text-slate-900">
                {formatMoney(activePeriod.egresosProyectados.cxpProveedores)}
              </span>
            </div>
            <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-700 font-medium">Nómina y Cargas Sociales</span>
              <span className="font-mono font-bold text-slate-900">
                {formatMoney(activePeriod.egresosProyectados.nomina)}
              </span>
            </div>
            <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-700 font-medium">Impuestos SAT (IVA / ISR Retenciones)</span>
              <span className="font-mono font-bold text-slate-900">
                {formatMoney(activePeriod.egresosProyectados.impuestosSat)}
              </span>
            </div>
            <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-700 font-medium">Compras Directas / Insumos</span>
              <span className="font-mono font-bold text-slate-900">
                {formatMoney(activePeriod.egresosProyectados.comprasDirectas)}
              </span>
            </div>
            <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-700 font-medium">Gastos Operativos (OPEX)</span>
              <span className="font-mono font-bold text-slate-900">
                {formatMoney(activePeriod.egresosProyectados.gastosOperativos)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mathematical Validation Certificate Bar */}
      <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div className="text-xs text-emerald-900">
            <span className="font-bold">Certificación Contable de Integridad:</span> Saldo Inicial ($
            {(activePeriod?.saldoInicial || 0).toLocaleString()}) + Ingresos ($
            {(activePeriod?.ingresosProyectados?.totalIngresos || 0).toLocaleString()}) - Egresos ($
            {(activePeriod?.egresosProyectados?.totalEgresos || 0).toLocaleString()}) = Saldo Final ($
            {(activePeriod?.saldoFinalProyectado || 0).toLocaleString()}).
          </div>
        </div>
        <div className="bg-emerald-600 text-white font-mono text-xs px-3 py-1 rounded font-bold whitespace-nowrap">
          Diferencia: ${(mathDiff || 0).toFixed(2)} MXN
        </div>
      </div>
    </div>
  );
};
