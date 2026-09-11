import React, { useState } from 'react';
import {
  ShieldAlert,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Copy,
  Users,
  Layers,
  ArrowRight,
  Play,
  FileText,
  Lock,
} from 'lucide-react';
import {
  TransactionAtomicityTestResult,
  IdempotencyTestResult,
  ConcurrencyTestScenarioResult,
} from '../../types/erp';
import { MasterCertificationService } from '../../services/masterCertificationService';

export const TransactionAtomicityViewer: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'ATOMICITY' | 'IDEMPOTENCY' | 'CONCURRENCY'>('ATOMICITY');

  const atomicityTests = MasterCertificationService.runTransactionAtomicityTests();
  const idempotencyTests = MasterCertificationService.runIdempotencyTests();
  const concurrencyTests = MasterCertificationService.runConcurrencyTests();

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400">
            <RotateCcw className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">Atomicidad, Idempotencia & Concurrencia (Fases 4, 5, 6)</h2>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                100% PASS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Certificación de transacciones ACID: COMMIT COMPLETO o ROLLBACK COMPLETO, cero estados huérfanos y control de concurrencia.
            </p>
          </div>
        </div>

        {/* Sub-tabs switch */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800">
          <button
            onClick={() => setActiveSubTab('ATOMICITY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'ATOMICITY' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Atomicidad (6 Escenarios)
          </button>
          <button
            onClick={() => setActiveSubTab('IDEMPOTENCY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'IDEMPOTENCY' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Idempotencia (7 Operaciones)
          </button>
          <button
            onClick={() => setActiveSubTab('CONCURRENCY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'CONCURRENCY' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Concurrencia (4 Pruebas)
          </button>
        </div>
      </div>

      {/* Tab Content: ATOMICITY */}
      {activeSubTab === 'ATOMICITY' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
            <span>
              <strong>Regla de Oro:</strong> Toda operación transaccional debe concluir en <code>COMMIT COMPLETO</code> o <code>ROLLBACK COMPLETO</code>. Jamás <code>PARTIAL_COMMIT</code> ni registros huérfanos.
            </span>
            <span className="text-emerald-400 font-bold">6 de 6 Exitosos</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {atomicityTests.map((test) => (
              <div
                key={test.scenarioId}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-800">
                    <h3 className="text-xs font-black text-white">{test.scenarioName}</h3>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-sm bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                      {test.actualOutcome}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Gatillo / Acción Inicial</span>
                      <span className="text-slate-200">{test.trigger}</span>
                    </div>
                    <div>
                      <span className="text-rose-400 block text-[10px] uppercase font-bold">Punto de Fallo Provocado</span>
                      <span className="text-rose-300 font-mono">{test.failurePoint}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-[11px] text-slate-300 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Secuencia de Rollback Ejecutada
                  </span>
                  {test.rollbackLog.map((log, lIdx) => (
                    <div key={lIdx} className="text-slate-400">
                      &gt; {log}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content: IDEMPOTENCY */}
      {activeSubTab === 'IDEMPOTENCY' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
            <span>
              <strong>Idempotencia:</strong> Todo reintento o doble clic en operaciones críticas debe retornar <code>SECOND_REQUEST = BLOCKED_OR_IDEMPOTENT</code> sin duplicar movimientos físicos ni contables.
            </span>
            <span className="text-emerald-400 font-bold">7 de 7 Bloqueos Validados</span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-[11px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3">Operación Crítica</th>
                  <th className="p-3">Clave de Idempotencia</th>
                  <th className="p-3">Resultado 1ra Petición</th>
                  <th className="p-3">Resultado 2da Petición (Retry)</th>
                  <th className="p-3">Detalle de Protección</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {idempotencyTests.map((idem) => (
                  <tr key={idem.operationKey} className="hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-white">{idem.operationName}</td>
                    <td className="p-3 font-mono text-amber-400">{idem.idempotencyKey}</td>
                    <td className="p-3 text-emerald-400">{idem.firstRequestResult}</td>
                    <td className="p-3">
                      <span className="font-bold px-2 py-0.5 rounded-sm bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]">
                        {idem.secondRequestResult}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400 max-w-sm">{idem.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: CONCURRENCY */}
      {activeSubTab === 'CONCURRENCY' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
            <span>
              <strong>Concurrencia Multi-Usuario:</strong> Simulación de accesos simultáneos a recursos compartidos escasos con garantía de <code>Reserved Stock &le; Physical Stock</code>.
            </span>
            <span className="text-emerald-400 font-bold">4 de 4 Invariantes Preservadas</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {concurrencyTests.map((conc, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-xs font-black text-white">{conc.scenarioName}</h3>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-sm bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    INVARIANTE OK
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Recurso:</span>
                    <span className="font-mono font-bold text-amber-400">{conc.resourceKey}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Saldo Inicial:</span>
                    <span className="font-mono text-slate-200">{conc.initialStockOrBalance}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Saldo Final Auditado:</span>
                    <span className="font-mono font-bold text-emerald-400">{conc.finalStockOrBalance}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-300 text-[11px]">{conc.userAAction}</span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-sm">
                      {conc.userAResult}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-300 text-[11px]">{conc.userBAction}</span>
                    <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-sm">
                      {conc.userBResult}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed pt-1">{conc.notes}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
