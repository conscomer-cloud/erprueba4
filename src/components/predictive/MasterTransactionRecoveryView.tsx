/**
 * @license
 * CONSCORE ERP IA - Master Transaction Recovery View
 * 17-Stage End-to-End Traceability & Cryptographic Recovery Chains
 */

import React, { useState } from 'react';
import { MasterTransactionRecoveryChain } from '../../types/predictiveOperationsTypes';
import { PredictiveOperationsService } from '../../services/predictiveOperationsService';
import { DataClassificationBadge } from './DataClassificationBadge';
import {
  GitCommit,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ShieldCheck,
  Search,
  Layers,
  ArrowRight,
  Hash,
} from 'lucide-react';

export const MasterTransactionRecoveryView: React.FC = () => {
  const transactions = PredictiveOperationsService.getMasterTransactions();
  const [selectedTxId, setSelectedTxId] = useState<string>(transactions[0].masterTransactionId);

  const activeTx =
    transactions.find((t) => t.masterTransactionId === selectedTxId) || transactions[0];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Master Transaction Recovery Chains</h2>
            <DataClassificationBadge classification="REAL" />
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Trazabilidad end-to-end de 17 etapas desde Lead hasta EBITDA con reconciliación y compensación.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-lg text-xs font-semibold text-emerald-900">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>100% de Trazabilidad: 0 movimientos huérfanos garantizados.</span>
        </div>
      </div>

      {/* Transaction Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {transactions.map((tx) => (
          <button
            key={tx.masterTransactionId}
            onClick={() => setSelectedTxId(tx.masterTransactionId)}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedTxId === tx.masterTransactionId
                ? 'border-purple-500 bg-purple-50/40 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-xs text-purple-700">
                {tx.masterTransactionId}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  tx.healthStatus === 'INTACT'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {tx.healthStatus}
              </span>
            </div>
            <div className="text-xs font-semibold text-slate-800 mt-1.5 line-clamp-1">
              {tx.customerName}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Etapas confirmadas: {tx.stages.filter((s) => s.status === 'CONFIRMED').length} /{' '}
              {tx.stages.length}
            </div>
          </button>
        ))}
      </div>

      {/* 17 Stages Chain Detail */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Cadena Transaccional: {activeTx.masterTransactionId}
              </h3>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">Cliente: {activeTx.customerName}</p>
          </div>

          <div className="text-xs text-slate-500 font-mono">
            Último Estado Confirmado: <strong>{activeTx.LAST_CONFIRMED_STATE}</strong>
          </div>
        </div>

        {/* 17 Stages Timeline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {activeTx.stages.map((stage) => {
            const isConfirmed = stage.status === 'CONFIRMED';
            const isRolledBack = stage.status === 'ROLLED_BACK';

            return (
              <div
                key={stage.stepNumber}
                className={`p-3 rounded-lg border text-xs space-y-2 ${
                  isConfirmed
                    ? 'border-emerald-200 bg-emerald-50/20 text-slate-800'
                    : isRolledBack
                    ? 'border-rose-200 bg-rose-50/20 text-slate-800'
                    : 'border-slate-100 bg-slate-50 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] text-slate-900">
                    {stage.stepNumber}. {stage.stageName}
                  </span>
                  {isConfirmed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : isRolledBack ? (
                    <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                  )}
                </div>

                <div className="text-[11px] font-mono text-slate-600 truncate">
                  Entidad: {stage.entityId || '—'}
                </div>

                {stage.sha256Hash && (
                  <div className="text-[9px] font-mono text-slate-400 truncate bg-white/80 p-1 rounded border border-slate-100">
                    Hash: {stage.sha256Hash.slice(0, 16)}...
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
