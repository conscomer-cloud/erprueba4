/**
 * @license
 * CONSCORE ERP IA - AI Collection & Credit Risk Forecast View
 * Preventive CXC Management, Overdue Scoring & Credit Limit Guardrails
 */

import React from 'react';
import { CollectionForecastItem } from '../../types/predictiveOperationsTypes';
import { PredictiveOperationsService } from '../../services/predictiveOperationsService';
import { DataClassificationBadge } from './DataClassificationBadge';
import {
  CreditCard,
  AlertTriangle,
  AlertCircle,
  Calendar,
  UserCheck,
  ShieldAlert,
  Lock,
  ArrowRight,
  TrendingDown,
  Building,
} from 'lucide-react';

export const CollectionForecastView: React.FC = () => {
  const customers = PredictiveOperationsService.getCollectionForecasts();

  const formatMoney = (n: number) =>
    `$${(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;

  const totalExposure = customers.reduce((acc, curr) => acc + curr.exposicionFinanciera, 0);
  const avgDSO = Math.round(
    customers.reduce((acc, curr) => acc + curr.dso, 0) / customers.length
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">AI Collection & Credit Risk Forecast</h2>
            <DataClassificationBadge classification="PROJECTED" />
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Pronósticos de cobranza, scoring de riesgo crediticio y control preventivo de días de cartera (DSO).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-purple-50 border border-purple-200 px-4 py-2 rounded-lg text-center">
            <div className="text-xs font-semibold text-purple-700 uppercase">Exposición Total CXC</div>
            <div className="text-lg font-bold text-purple-900">{formatMoney(totalExposure)}</div>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 px-4 py-2 rounded-lg text-center">
            <div className="text-xs font-semibold text-indigo-700 uppercase">DSO Promedio</div>
            <div className="text-lg font-bold text-indigo-900">{avgDSO} Días</div>
          </div>
        </div>
      </div>

      {/* Customer Risk Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {customers.map((cust) => {
          const isCritical = cust.nivelRiesgo === 'CRITICAL';
          const isHigh = cust.nivelRiesgo === 'HIGH';

          return (
            <div
              key={cust.customerId}
              className={`bg-white rounded-xl border p-5 shadow-sm space-y-4 ${
                isCritical
                  ? 'border-rose-300 bg-rose-50/10'
                  : isHigh
                  ? 'border-amber-300 bg-amber-50/10'
                  : 'border-slate-200'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-slate-500" />
                    <h3 className="font-bold text-slate-900 text-base">{cust.customerName}</h3>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    RFC: <span className="font-mono">{cust.taxId}</span> · ID:{' '}
                    <span className="font-mono">{cust.customerId}</span>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                    isCritical
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : isHigh
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  RIESGO {cust.nivelRiesgo}
                </span>
              </div>

              {/* Financial Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">Saldo Pendiente</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {formatMoney(cust.saldoPendiente)}
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">Límite Crédito</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {formatMoney(cust.limiteCredito)}
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">DSO / Antigüedad</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5 font-mono">
                    {cust.dso}d / {cust.antiguedadPromedioDias}d
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">Score / Atraso</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5 font-mono">
                    {cust.comportamientoScore} pts / {cust.probabilidadAtraso}%
                  </div>
                </div>
              </div>

              {/* Credit Limit Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600">Utilización de Línea de Crédito</span>
                  <span
                    className={
                      cust.creditoUtilizadoPct > 100
                        ? 'text-rose-600 font-bold'
                        : cust.creditoUtilizadoPct > 80
                        ? 'text-amber-600 font-bold'
                        : 'text-emerald-600 font-bold'
                    }
                  >
                    {cust.creditoUtilizadoPct}% Utilizado
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      cust.creditoUtilizadoPct > 100
                        ? 'bg-rose-600'
                        : cust.creditoUtilizadoPct > 80
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, cust.creditoUtilizadoPct)}%` }}
                  />
                </div>
              </div>

              {/* Promises & Recommendation */}
              <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-700 font-semibold">
                  <span>Recomendación IA:</span>
                  <span className="text-slate-500">Resp: {cust.responsable}</span>
                </div>
                <p className="text-slate-600 leading-relaxed">{cust.recomendacion}</p>

                {cust.requiresHumanValidation && (
                  <div className="pt-2 border-t border-slate-200/60 flex items-center gap-1.5 text-indigo-700 font-semibold">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Human-in-the-Loop: Requiere autorización de Gerencia de Finanzas</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
