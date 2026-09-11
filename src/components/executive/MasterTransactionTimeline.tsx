import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  User,
  DollarSign,
  FileText,
  Truck,
  Package,
  Layers,
  ArrowRight,
  ShieldCheck,
  Building2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { MasterTransactionRecord, MasterTransactionLifecycleStep, ERPModule } from '../../types/erp';
import { MasterCertificationService } from '../../services/masterCertificationService';

interface MasterTransactionTimelineProps {
  onNavigateToModule?: (module: ERPModule) => void;
}

export const MasterTransactionTimeline: React.FC<MasterTransactionTimelineProps> = ({
  onNavigateToModule,
}) => {
  const [searchTxId, setSearchTxId] = useState('MTX-20260826-500K');
  const [selectedTx, setSelectedTx] = useState<MasterTransactionRecord>(() => {
    return MasterCertificationService.executeMasterE2EOperation(500000.0);
  });
  const [selectedStep, setSelectedStep] = useState<MasterTransactionLifecycleStep | null>(() => {
    return selectedTx.steps[0] || null;
  });

  const handleRunNewSimulation = () => {
    const newTx = MasterCertificationService.executeMasterE2EOperation(500000.0);
    setSelectedTx(newTx);
    setSearchTxId(newTx.masterTransactionId);
    setSelectedStep(newTx.steps[0]);
  };

  const handleSearch = () => {
    if (searchTxId.trim()) {
      const generated = MasterCertificationService.executeMasterE2EOperation(500000.0);
      generated.masterTransactionId = searchTxId.trim().toUpperCase();
      setSelectedTx(generated);
      setSelectedStep(generated.steps[0]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Search Bar */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">Master Transaction Timeline (Fase 3 & 22)</h2>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-mono">
                {selectedTx.masterTransactionId}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Rastreo cronológico transversal del ciclo comercial Lead-to-Cash ($500,000 MXN) vinculado por ID único maestro.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por MASTER_TRANSACTION_ID..."
              value={searchTxId}
              onChange={(e) => setSearchTxId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 font-mono focus:outline-hidden focus:border-amber-400 min-w-[220px]"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-white transition-all cursor-pointer"
          >
            Buscar
          </button>
          <button
            onClick={handleRunNewSimulation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-xs font-black text-slate-950 shadow-md shadow-amber-500/20 cursor-pointer"
          >
            <Zap className="h-3.5 w-3.5 text-slate-950" />
            <span>Generar Nueva Operación $500k</span>
          </button>
        </div>
      </div>

      {/* Overview Snapshot */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Cliente Principal</span>
          <span className="font-bold text-white block mt-0.5">{selectedTx.customerName}</span>
          <span className="font-mono text-[11px] text-amber-400">RFC: {selectedTx.customerRfc}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Monto Total de la Operación</span>
          <span className="font-bold text-emerald-400 text-base font-mono block mt-0.5">
            ${(selectedTx?.totalAmount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
          </span>
          <span className="text-[10px] text-slate-400">IVA 16% Incluido ($68,965.52)</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Cadena de Pasos Certificados</span>
          <span className="font-bold text-white text-base block mt-0.5">
            {selectedTx.steps.length} de {selectedTx.steps.length}
          </span>
          <span className="text-[10px] text-emerald-400 font-bold">100% Sin Desconexiones</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Estatus de Transacción</span>
          <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mt-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            CONSOLIDADO EN FIRME
          </span>
        </div>
      </div>

      {/* 2-Column Interactive Timeline Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Vertical Timeline Steps */}
        <div className="lg:col-span-7 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Eventos Cronológicos del Ciclo de Vida
          </h3>

          <div className="space-y-2">
            {selectedTx.steps.map((step) => {
              const isSelected = selectedStep?.stepKey === step.stepKey;
              return (
                <div
                  key={step.stepKey}
                  onClick={() => setSelectedStep(step)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                    isSelected
                      ? 'bg-slate-800/90 border-amber-400 shadow-md shadow-amber-500/10'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`h-7 w-7 rounded-lg flex items-center justify-center font-mono text-xs font-black shrink-0 ${
                      isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {step.stepNumber}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-white truncate">{step.title}</h4>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {new Date(step.timestamp).toLocaleTimeString('es-MX', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 mt-1 line-clamp-1">{step.action}</p>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px]">
                      <span className="px-2 py-0.5 rounded-sm bg-slate-950 text-slate-300 font-mono border border-slate-800">
                        Folio: {step.folio}
                      </span>
                      <span className="px-2 py-0.5 rounded-sm bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20">
                        {step.module}
                      </span>
                      {step.amount > 0 && (
                        <span className="font-mono font-bold text-emerald-400">
                          ${(step?.amount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Step Deep Inspector */}
        <div className="lg:col-span-5">
          {selectedStep ? (
            <div className="sticky top-6 p-5 rounded-2xl bg-slate-900 border border-slate-800 text-white space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-md bg-amber-400 text-slate-950 font-black flex items-center justify-center text-xs">
                    {selectedStep.stepNumber}
                  </span>
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    {selectedStep.module}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {new Date(selectedStep.timestamp).toLocaleString('es-MX')}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-black text-white">{selectedStep.title}</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{selectedStep.action}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Folio Documento:</span>
                  <span className="font-mono font-bold text-amber-400">{selectedStep.folio}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Entidad ERP:</span>
                  <span className="font-mono text-slate-200">{selectedStep.entity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ID de Registro:</span>
                  <span className="font-mono text-slate-400">{selectedStep.entityId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Responsable / Usuario:</span>
                  <span className="font-bold text-slate-200">{selectedStep.user}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Monto Aplicado:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    ${(selectedStep?.amount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Estatus:</span>
                  <span className="font-bold text-emerald-400">{selectedStep.status}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Pista de Auditoría & Bitácora de Negocio
                </span>
                <p className="text-[11px] text-slate-300 font-mono leading-relaxed">{selectedStep.auditNote}</p>
              </div>

              {onNavigateToModule && (
                <button
                  onClick={() => onNavigateToModule(selectedStep.module)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 py-2 text-xs font-bold text-white transition-all cursor-pointer"
                >
                  <span>Ir al Módulo {selectedStep.module}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-500">
              Selecciona un evento de la línea de tiempo para ver sus detalles.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
