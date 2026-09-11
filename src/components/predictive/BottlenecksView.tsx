/**
 * @license
 * CONSCORE ERP IA - Operations Bottleneck Detector View
 * Algorithmic Friction Detection with Financial Impact Quantification
 */

import React from 'react';
import { OperationsBottleneck } from '../../types/predictiveOperationsTypes';
import { PredictiveOperationsService } from '../../services/predictiveOperationsService';
import { DataClassificationBadge } from './DataClassificationBadge';
import {
  Hourglass,
  AlertTriangle,
  Clock,
  User,
  ArrowRight,
  TrendingDown,
  Layers,
  Sparkles,
} from 'lucide-react';

export const BottlenecksView: React.FC = () => {
  const bottlenecks = PredictiveOperationsService.getBottlenecks();

  const formatMoney = (n: number) =>
    `$${(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;

  const totalLoss = bottlenecks.reduce((acc, curr) => acc + curr.impactoFinanciero, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Operations Bottleneck Detector</h2>
            <DataClassificationBadge classification="CALCULATED" />
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Detección automática de demoras operativas, pedidos retenidos, saturación WMS y fricción de compras.
          </p>
        </div>

        <div className="bg-purple-50 border border-purple-200 px-4 py-2 rounded-lg text-center">
          <div className="text-xs font-semibold text-purple-700 uppercase">Impacto Total de Ineficiencias</div>
          <div className="text-lg font-bold text-purple-900">{formatMoney(totalLoss)}</div>
        </div>
      </div>

      {/* Bottlenecks Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {bottlenecks.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-purple-300 transition-colors"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    {item.id}
                  </span>
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded uppercase">
                    {item.modulo}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base mt-1.5">{item.problema}</h3>
              </div>

              <span
                className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                  item.prioridad === 'CRITICAL'
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                {item.prioridad}
              </span>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
              <div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase">Demora Media</div>
                <div className="font-mono font-bold text-slate-900 mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {item.tiempoAfectado}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase">Volumen en Cola</div>
                <div className="font-mono font-bold text-slate-900 mt-0.5">
                  {item.volumenAfectado}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase">Impacto Financiero</div>
                <div className="font-mono font-bold text-rose-700 mt-0.5">
                  {formatMoney(item.impactoFinanciero)}
                </div>
              </div>
            </div>

            {/* Cause & AI Resolution */}
            <div className="space-y-2 text-xs">
              <div>
                <span className="font-bold text-slate-700">Causa Raíz Detectada:</span>
                <p className="text-slate-600 mt-0.5">{item.causaProbable}</p>
              </div>

              <div className="bg-purple-50/60 p-2.5 rounded-lg border border-purple-100">
                <span className="font-bold text-purple-900 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  Acción de Desbloqueo Recomendada:
                </span>
                <p className="text-purple-800 mt-0.5">{item.recomendacion}</p>
              </div>
            </div>

            {/* Footer Owner */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                Dueño del Proceso: <strong>{item.responsable}</strong> ({item.responsibleRole})
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
