import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import { AIPurchaseRecommendation } from '../../types/erp';
import {
  BrainCircuit,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  TrendingDown,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Package,
  Layers,
  FileCheck2,
} from 'lucide-react';

interface IntelligentReplenishmentTabProps {
  onCreatePurchaseRequestFromAi: (suggestion: any) => void;
  onCreatePurchaseOrderFromAi?: (suggestion: any) => void;
}

export const IntelligentReplenishmentTab: React.FC<IntelligentReplenishmentTabProps> = ({
  onCreatePurchaseRequestFromAi,
}) => {
  const {
    products,
    warehouses,
    suppliers,
    purchaseOrders,
    purchaseRequests,
    reorderConfigs,
    getReplenishmentSuggestions,
  } = useERP();

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('TODAS');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState<Date>(new Date());

  // Generate real-time calculation using the ERP engine
  const suggestions: AIPurchaseRecommendation[] = useMemo(() => {
    if (getReplenishmentSuggestions) {
      return getReplenishmentSuggestions(selectedWarehouseId || undefined);
    }
    return [];
  }, [
    getReplenishmentSuggestions,
    selectedWarehouseId,
    products,
    purchaseOrders,
    purchaseRequests,
    reorderConfigs,
    lastAnalyzedAt,
  ]);

  const handleAnalyzeInventory = () => {
    setIsAnalyzing(true);
    // Simular un escaneo de motor IA ultrarrápido y limpio sin spinner infinito
    setTimeout(() => {
      setLastAnalyzedAt(new Date());
      setIsAnalyzing(false);
    }, 250);
  };

  const filteredSuggestions = suggestions.filter((sug) => {
    if (selectedUrgency === 'TODAS') return true;
    const urgencyCode = sug.urgency === 'CRITICA' ? 'CRITICAL' : sug.urgency === 'ALTA' ? 'HIGH' : 'MEDIUM';
    return urgencyCode === selectedUrgency || sug.urgency === selectedUrgency;
  });

  const criticalCount = suggestions.filter((s) => s.urgency === 'CRITICA').length;
  const highCount = suggestions.filter((s) => s.urgency === 'ALTA').length;
  const totalSuggestedBudget = suggestions.reduce((sum, s) => sum + (s.estimatedCost || 0), 0);

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'CRITICA':
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-black text-red-800 border border-red-200 animate-pulse">
            <AlertTriangle className="h-3 w-3" /> CRÍTICO (Agotamiento Inminente)
          </span>
        );
      case 'ALTA':
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-200">
            <TrendingDown className="h-3 w-3" /> ALTA (Bajo Punto de Reorden)
          </span>
        );
      case 'MEDIA':
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 border border-blue-200">
            <Clock className="h-3 w-3" /> MEDIA (Preventiva)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
            ÓPTIMO
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* AI Header Banner */}
      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-950 p-6 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <BrainCircuit className="h-7 w-7 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">CONSCORE AI — Reabastecimiento Predictivo</h2>
                <span className="rounded-md bg-indigo-500/30 px-2 py-0.5 text-[10px] font-bold text-indigo-200 border border-indigo-400/30">
                  MOTOR ROP + EOQ DINÁMICO
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                Cálculo de punto de reorden por consumo promedio, lead time y stock de seguridad.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/40 p-3 text-xs text-indigo-200 max-w-xs">
              <div className="flex items-center gap-2 font-bold text-white mb-0.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Gobernanza Humana (HITL)</span>
              </div>
              <p className="text-[11px] text-indigo-300 leading-tight">
                Propone solicitudes para revisión humana. No emite órdenes de compra sin autorización.
              </p>
            </div>

            <button
              id="btn-analizar-inventario"
              onClick={handleAnalyzeInventory}
              disabled={isAnalyzing}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-lg hover:bg-indigo-500 active:scale-95 transition disabled:opacity-75"
            >
              <RefreshCw className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'ANALIZANDO...' : 'ANALIZAR INVENTARIO'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-4">
          <span className="text-xs font-bold uppercase text-red-700 block">Riesgo Crítico de Quiebre</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-red-800">{criticalCount}</span>
            <span className="text-xs text-red-600 font-medium">SKUs &lt; Stock Seg.</span>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
          <span className="text-xs font-bold uppercase text-amber-700 block">Punto de Reorden (ROP)</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-800">{highCount}</span>
            <span className="text-xs text-amber-600 font-medium">Reorden requerido</span>
          </div>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4">
          <span className="text-xs font-bold uppercase text-blue-700 block">Reabastecimiento Sugerido</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-blue-800">{suggestions.length}</span>
            <span className="text-xs text-blue-600 font-medium">Propuestas activas</span>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
          <span className="text-xs font-bold uppercase text-emerald-700 block">Presupuesto Sugerido</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-black text-emerald-800">
              ${(Number(totalSuggestedBudget) || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}
            </span>
            <span className="text-xs text-emerald-600 font-medium">MXN</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Filtrar por Almacén:</span>
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-hidden"
            >
              <option value="">Todos los Almacenes</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name} ({wh.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Nivel de Urgencia:</span>
            <select
              value={selectedUrgency}
              onChange={(e) => setSelectedUrgency(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-hidden"
            >
              <option value="TODAS">Todas las urgencias</option>
              <option value="CRITICAL">Solo Crítico</option>
              <option value="HIGH">Alta (Bajo ROP)</option>
              <option value="MEDIUM">Media (Preventivo)</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Mostrando <b>{filteredSuggestions.length}</b> sugerencias inteligentes • Actualizado:{' '}
          {lastAnalyzedAt.toLocaleTimeString('es-MX')}
        </div>
      </div>

      {/* Suggestions List */}
      <div className="space-y-3">
        {filteredSuggestions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
            <h3 className="mt-3 text-base font-bold text-slate-800">
              Inventario en Niveles Óptimos de Seguridad
            </h3>
            <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
              No hay productos con necesidad inmediata de compra. Las existencias actuales y órdenes en tránsito cubren los parámetros de demanda.
            </p>
          </div>
        ) : (
          filteredSuggestions.map((sug) => {
            const prod = products.find((p) => p.id === sug.productId || p.code === sug.productCode);
            const wh = warehouses.find((w) => w.id === prod?.warehouseId);
            const unit = prod?.unit || 'PZA';

            const physicalStock = sug.physicalStock ?? prod?.physicalStock ?? prod?.stock ?? 0;
            const reservedStock = sug.reservedStock ?? prod?.reservedStock ?? 0;
            const availableStock = sug.currentAvailableStock ?? prod?.availableStock ?? 0;
            const inTransitStock = sug.inTransitStock ?? 0;
            const projectedStock = sug.projectedStock ?? availableStock + inTransitStock;
            const targetStock = sug.targetStock ?? prod?.maxStock ?? 30;

            return (
              <div
                key={sug.id}
                id={`card-sug-${sug.productCode}`}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-indigo-300 hover:shadow-md"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Left Column: Product, reason and full inventory breakdown */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold text-indigo-700">
                        [{sug.productCode}]
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm">{sug.productName}</h3>
                      {getUrgencyBadge(sug.urgency)}
                      {sug.existingRequestDetected && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-800 border border-blue-200">
                          <FileCheck2 className="h-3 w-3" />
                          SOLICITUD ACTIVA ({sug.existingRequestNumber})
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                      <span>
                        Almacén: <b>{wh?.name || 'General (Principal)'}</b>
                      </span>
                      <span>•</span>
                      <span>
                        Proveedor Sugerido: <b>{sug.recommendedSupplierName || 'Proveedor Registrado'}</b>
                      </span>
                      <span>•</span>
                      <span>
                        Lead Time: <b>{sug.leadTimeDays} días</b>
                      </span>
                      <span>•</span>
                      <span>
                        Consumo Diario: <b>{sug.averageDailyConsumption} {unit}/día</b>
                      </span>
                    </div>

                    {/* Parametric metrics box */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-1">
                      <div className="rounded-lg bg-slate-50 border border-slate-200 p-2 text-center">
                        <span className="text-[10px] text-slate-500 uppercase block font-semibold">Físico</span>
                        <span className="font-bold text-slate-900 text-xs">{physicalStock} {unit}</span>
                      </div>
                      <div className="rounded-lg bg-slate-50 border border-slate-200 p-2 text-center">
                        <span className="text-[10px] text-slate-500 uppercase block font-semibold">Reservado</span>
                        <span className="font-bold text-amber-700 text-xs">{reservedStock} {unit}</span>
                      </div>
                      <div className="rounded-lg bg-blue-50 border border-blue-200 p-2 text-center">
                        <span className="text-[10px] text-blue-700 uppercase block font-bold">Disponible</span>
                        <span className="font-bold text-blue-950 text-xs">{availableStock} {unit}</span>
                      </div>
                      <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-2 text-center">
                        <span className="text-[10px] text-indigo-700 uppercase block font-bold">En Tránsito</span>
                        <span className="font-bold text-indigo-950 text-xs">{inTransitStock} {unit}</span>
                      </div>
                      <div className="rounded-lg bg-violet-50 border border-violet-200 p-2 text-center">
                        <span className="text-[10px] text-violet-700 uppercase block font-bold">Proyectado</span>
                        <span className="font-bold text-violet-950 text-xs">{projectedStock} {unit}</span>
                      </div>
                      <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2 text-center">
                        <span className="text-[10px] text-emerald-700 uppercase block font-bold">Objetivo</span>
                        <span className="font-bold text-emerald-950 text-xs">{targetStock} {unit}</span>
                      </div>
                    </div>

                    {/* AI Reasoning explanation */}
                    <p className="text-xs bg-slate-50 p-2.5 rounded-xl text-slate-700 italic border border-slate-200/70">
                      💡 <b>Análisis CONSCORE AI:</b> {sug.rationale}
                    </p>
                  </div>

                  {/* Right Column: Recommended Quantity and Human-In-The-Loop Action */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-end justify-between lg:justify-center gap-3 lg:border-l lg:border-slate-100 lg:pl-6 shrink-0">
                    <div className="text-right">
                      <span className="text-[11px] font-bold text-slate-500 uppercase block">
                        Cantidad Propuesta
                      </span>
                      <div className="text-2xl font-black text-slate-900">
                        {sug.suggestedQuantity}{' '}
                        <span className="text-xs font-bold text-slate-500">{unit}</span>
                      </div>
                      <div className="text-xs font-bold text-emerald-700 mt-0.5">
                        ${(Number(sug.estimatedCost) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                      </div>
                    </div>

                    <div className="w-full lg:w-auto">
                      {sug.existingRequestDetected ? (
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-500 block">
                            Solicitud previa en trámite
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Duplicación prevenida
                          </span>
                        </div>
                      ) : (
                        <button
                          id={`btn-crear-solicitud-${sug.productCode}`}
                          onClick={() => onCreatePurchaseRequestFromAi(sug)}
                          className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition active:scale-95"
                        >
                          <span>Crear Solicitud</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
