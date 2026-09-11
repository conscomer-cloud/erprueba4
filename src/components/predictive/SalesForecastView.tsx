/**
 * @license
 * CONSCORE ERP IA - AI Sales Forecast View
 * Multi-Horizon Revenue Projections with Factor Explainability
 */

import React, { useState } from 'react';
import { SalesForecastPeriod } from '../../types/predictiveOperationsTypes';
import { PredictiveOperationsService } from '../../services/predictiveOperationsService';
import { DataClassificationBadge } from './DataClassificationBadge';
import {
  TrendingUp,
  Target,
  DollarSign,
  Percent,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Calendar,
  Layers,
} from 'lucide-react';

export const SalesForecastView: React.FC = () => {
  const forecasts = PredictiveOperationsService.getSalesForecasts();
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30D');

  const activeForecast =
    forecasts.find((f) => f.period === selectedPeriod) || forecasts[1];

  const formatMoney = (n: number) =>
    `$${(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;

  return (
    <div className="space-y-6">
      {/* Top Header & Horizon Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">AI Sales Forecast</h2>
            <DataClassificationBadge classification={activeForecast.dataClassification} />
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Pronósticos de ventas ponderados por pipeline CRM, histórico de conversión y estacionalidad.
          </p>
        </div>

        {/* Horizons Selector */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
          {forecasts.map((f) => (
            <button
              key={f.period}
              onClick={() => setSelectedPeriod(f.period)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                selectedPeriod === f.period
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {f.period === 'MONTH_END'
                ? 'Cierre Mes'
                : f.period === 'QUARTER_END'
                ? 'Cierre Trimestre'
                : f.period}
            </button>
          ))}
        </div>
      </div>

      {/* Main KPI Grid for Selected Horizon */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Meta */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Meta Comercial</span>
            <Target className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{formatMoney(activeForecast.meta)}</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {activeForecast.periodLabel}
          </div>
        </div>

        {/* Real Facturado / Avance */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Real Facturado</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">{formatMoney(activeForecast?.real || 0)}</div>
          <div className="text-xs text-emerald-700 mt-1 flex items-center gap-1 font-medium">
            Avance: {activeForecast?.meta ? (((activeForecast.real || 0) / activeForecast.meta) * 100).toFixed(1) : '0.0'}% de meta
          </div>
        </div>

        {/* Pronóstico IA */}
        <div className="bg-white p-5 rounded-xl border border-purple-200 bg-purple-50/20 shadow-sm">
          <div className="flex items-center justify-between text-purple-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Forecast IA</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-900">{formatMoney(activeForecast.forecast)}</div>
          <div className="text-xs text-purple-700 mt-1 flex items-center gap-1 font-semibold">
            {activeForecast.variacion >= 0 ? (
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
            )}
            Superávit Proyectado: +{formatMoney(activeForecast.variacion)}
          </div>
        </div>

        {/* Cumplimiento & Confianza */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Cumplimiento & Confianza</span>
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {activeForecast.cumplimientoProyectado}%
            </span>
            <span className="text-xs font-medium text-slate-500">esperado</span>
          </div>
          <div className="text-xs text-indigo-700 mt-1 font-medium flex items-center gap-1">
            <Percent className="w-3 h-3" /> Nivel de Confianza: {activeForecast.nivelConfianza}%
          </div>
        </div>
      </div>

      {/* Factors & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Factors Breakdown */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-slate-900 text-base">
                Factores Ponderados del Pronóstico ({activeForecast.periodLabel})
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">Algoritmo Bayesiano Multivariable</span>
          </div>

          <div className="space-y-3">
            {activeForecast.factors.map((factor, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        factor.impact === 'POSITIVE'
                          ? 'bg-emerald-500'
                          : factor.impact === 'NEGATIVE'
                          ? 'bg-rose-500'
                          : 'bg-amber-500'
                      }`}
                    />
                    <span className="font-semibold text-sm text-slate-900">{factor.name}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                    Peso: {factor.weight}%
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{factor.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Trend Bar Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-slate-900 text-base">Evolución de Períodos</h3>
              <Info className="w-4 h-4 text-slate-400" />
            </div>

            <div className="space-y-4">
              {activeForecast.historicalTrend.map((t, idx) => {
                const maxVal = Math.max(t.real, t.projected, 1);
                const realPct = Math.min(100, (t.real / maxVal) * 100);
                const projPct = Math.min(100, (t.projected / maxVal) * 100);

                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>{t.label}</span>
                      <span className="font-mono text-slate-600">
                        {(t.real || 0) > 0 ? `$${(((t.real || 0) / 1000)).toFixed(0)}k` : '—'} / $
                        {(((t.projected || 0) / 1000)).toFixed(0)}k
                      </span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex gap-0.5">
                      {t.real > 0 && (
                        <div
                          className="bg-emerald-500 h-full rounded-l-full"
                          style={{ width: `${realPct}%` }}
                          title={`Real: $${(Number(t.real) || 0).toLocaleString()}`}
                        />
                      )}
                      <div
                        className="bg-purple-500 h-full rounded-r-full opacity-80"
                        style={{ width: `${projPct}%` }}
                        title={`Proyectado: $${(Number(t.projected) || 0).toLocaleString()}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Real
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-purple-500 inline-block" /> Proyectado IA
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
