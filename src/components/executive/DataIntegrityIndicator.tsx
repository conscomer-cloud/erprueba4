import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Lock,
  RefreshCw,
  Layers,
  Database,
} from 'lucide-react';
import { DataIntegrityReport } from '../../types/erp';

interface DataIntegrityIndicatorProps {
  integrity: DataIntegrityReport;
  onRefresh?: () => void;
}

export const DataIntegrityIndicator: React.FC<DataIntegrityIndicatorProps> = ({
  integrity,
  onRefresh,
}) => {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border ${
              integrity.isBalanced
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
            }`}
          >
            {integrity.isBalanced ? (
              <ShieldCheck className="h-5 w-5" />
            ) : (
              <AlertTriangle className="h-5 w-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Auditoría Transversal de Integridad
              </span>
              <span className="text-[10px] text-slate-500">|</span>
              <span className="text-[10px] text-slate-400 font-mono">
                Última verificación: {new Date(integrity.lastChecked).toLocaleTimeString('es-MX')}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white mt-0.5">
              {integrity.isBalanced
                ? '100% Cuadre Financiero & Consistencia Transversal Verificada'
                : 'Descuadre Detectado en Verificación Transversal'}
            </h3>
          </div>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-bold text-slate-300 hover:border-slate-700 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reverificar</span>
          </button>
        )}
      </div>

      {/* Checks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {integrity.checks.map((check, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/60">
                <span className="text-[11px] font-bold text-white truncate pr-2">{check.name}</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
                    check.passed
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {check.passed ? 'CORRECTO' : 'DESCUADRE'}
                </span>
              </div>

              <div className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Valor Calculado:</span>
                  <span className="font-mono font-bold text-slate-200">
                    ${(Number(check.calculatedValue) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Valor Esperado:</span>
                  <span className="font-mono font-bold text-slate-200">
                    ${(Number(check.expectedValue) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Diferencia:</span>
                  <span
                    className={`font-mono font-bold ${
                      Math.abs(check.variance) < 0.01 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    ${(Number(check.variance) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-2 pt-1.5 border-t border-slate-800/60 text-[10px] text-slate-400 leading-snug">
              {check.details}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
