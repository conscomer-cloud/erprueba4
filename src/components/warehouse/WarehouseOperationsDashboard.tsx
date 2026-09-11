import React, { useMemo, useState } from 'react';
import {
  Boxes,
  PackageCheck,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingDown,
  Sparkles,
  ShieldCheck,
  Building2,
  Clock,
  CheckCircle2,
  Layers,
  FileSpreadsheet,
  Shuffle,
  ClipboardList,
  RotateCcw,
  RefreshCw
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { downloadInventoryExcelBackup } from '../../services/inventoryBackupService';
import { ReorderAlertPanel } from './ReorderAlertPanel';

interface WarehouseOperationsDashboardProps {
  onNavigateTab: (tab: 'STOCK' | 'MOVIMIENTOS' | 'PEDIDOS_SURTIR' | 'TRASPASOS' | 'CONTEOS_FISICOS' | 'AJUSTES' | 'KARDEX' | 'SOLICITUDES_REABASTECIMIENTO' | 'DEVOLUCIONES') => void;
  onOpenImportModal: () => void;
  onOpenReplenishModal?: () => void;
}

export const WarehouseOperationsDashboard: React.FC<WarehouseOperationsDashboardProps> = ({
  onNavigateTab,
  onOpenImportModal,
  onOpenReplenishModal,
}) => {
  const {
    products,
    warehouses,
    orders,
    movements,
    reservations,
    transfers,
    countSessions,
    adjustments,
    logisticsReturns,
    analyzeInventoryWithAI,
    logAudit,
  } = useERP();
  const { currentUser } = useAuth();
  const [isExporting, setIsExporting] = useState(false);

  const handleQuickDownloadBackup = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await downloadInventoryExcelBackup({
        products,
        warehouses,
        currentUser: {
          id: currentUser?.id || 'USR-ANON',
          name: currentUser?.name || 'Operador de Inventario',
          role: currentUser?.role || 'ALMACEN',
        },
        scopeWarehouseId: 'TODOS',
        scopeWarehouseName: 'Todos los Almacenes y CEDIS',
        onAuditLog: (entry) => {
          if (logAudit) {
            logAudit(
              entry.action,
              entry.module,
              entry.entityType,
              entry.entityId,
              undefined,
              JSON.stringify(entry.details)
            );
          }
        },
      });
    } catch (err) {
      console.error('[WarehouseOperationsDashboard] Error al descargar respaldo:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Inventory computations
  const totalSKUs = products.length;
  const totalPhysicalUnits = useMemo(() => products.reduce((sum, p) => sum + (p.stock || p.physicalStock || 0), 0), [products]);
  const totalReservedUnits = useMemo(() => products.reduce((sum, p) => sum + (p.reservedStock || 0), 0), [products]);
  const totalAvailableUnits = useMemo(() => products.reduce((sum, p) => sum + (p.availableStock || 0), 0), [products]);
  const totalValuation = useMemo(() => products.reduce((sum, p) => sum + (p.stock || p.physicalStock || 0) * (p.cost || 0), 0), [products]);

  const zeroStockCount = useMemo(() => products.filter((p) => (p.availableStock || 0) <= 0).length, [products]);
  const criticalStockCount = useMemo(() => products.filter((p) => (p.availableStock || 0) > 0 && (p.availableStock || 0) <= (p.minStock || 5)).length, [products]);
  const overstockCount = useMemo(() => products.filter((p) => (p.availableStock || 0) > (p.maxStock || 100)).length, [products]);

  // Operational metrics
  const pendingFulfillments = useMemo(() => orders.filter((o) => ['PENDIENTE', 'CONFIRMADO', 'RESERVADO', 'EN SURTIDO'].includes(o.status)), [orders]);
  const activeReservations = useMemo(() => reservations.filter((r) => r.status === 'ACTIVE'), [reservations]);
  const inTransitTransfers = useMemo(() => transfers.filter((t) => t.status === 'EN_TRANSITO'), [transfers]);
  const pendingTransferAuth = useMemo(() => transfers.filter((t) => t.status === 'SOLICITADA'), [transfers]);
  const activeCounts = useMemo(() => countSessions.filter((c) => c.status === 'EN_CONTEO' || c.status === 'DIFERENCIAS_DETECTADAS'), [countSessions]);
  const pendingAdjustments = useMemo(() => adjustments.filter((a) => a.status === 'PENDIENTE_AUTORIZACION'), [adjustments]);

  // AI Diagnostic
  const aiDiag = useMemo(() => analyzeInventoryWithAI(), [analyzeInventoryWithAI]);

  return (
    <div className="space-y-6">
      {/* Alertas de punto de reorden. Se coloca arriba de todo porque es lo
          único de este tablero que exige una decisión inmediata. */}
      <ReorderAlertPanel onNavigateToPurchases={() => onNavigateTab('SOLICITUDES_REABASTECIMIENTO')} />

      {/* Top Welcome / Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 rounded-2xl text-white shadow-md border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Operación Logística en Tiempo Real
            </span>
            <span className="text-xs text-slate-400">
              {warehouses.length} Almacenes Activos
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Centro de Control de Almacén y Surtido</h2>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Control físico, reservas atómicas, surtido de pedidos, traspasos inter-sucursal y conteos cíclicos sincronizados al instante.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => onNavigateTab('DEVOLUCIONES')}
            id="btn-nav-devoluciones-header"
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white text-sm font-semibold rounded-xl transition shadow-xs"
          >
            <RotateCcw className="h-4 w-4" />
            Devoluciones ({logisticsReturns.length})
          </button>
          <button
            onClick={() => onNavigateTab('PEDIDOS_SURTIR')}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-semibold rounded-xl transition shadow-xs"
          >
            <ClipboardList className="h-4 w-4" />
            Surtir Pedidos ({pendingFulfillments.length})
          </button>
          <button
            onClick={() => onNavigateTab('MOVIMIENTOS')}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-sm font-medium rounded-xl transition"
          >
            <ArrowDownLeft className="h-4 w-4 text-emerald-400" />
            Entrada / Salida
          </button>
          <button
            id="btn-dashboard-descargar-respaldo"
            aria-label="Descargar respaldo"
            onClick={handleQuickDownloadBackup}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 disabled:bg-slate-800 text-white border border-emerald-600/80 text-sm font-medium rounded-xl transition shadow-xs cursor-pointer disabled:cursor-not-allowed"
            title="Descargar respaldo oficial de inventario en Excel (.xlsx)"
          >
            {isExporting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin text-white" />
                <span>Generando archivo Excel...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="h-4 w-4 text-emerald-200" />
                <span>Descargar respaldo</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Catálogo Total</span>
            <Boxes className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{(totalSKUs || 0).toLocaleString('es-MX')}</p>
          <p className="text-xs text-slate-500 mt-1">Materiales y SKUs</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Físico en Bodega</span>
            <Building2 className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{(totalPhysicalUnits || 0).toLocaleString('es-MX')}</p>
          <p className="text-xs text-slate-500 mt-1">Piezas / Unidades</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200/80 bg-amber-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Apartados / Reservas</span>
            <PackageCheck className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-900 mt-2">{(totalReservedUnits || 0).toLocaleString('es-MX')}</p>
          <p className="text-xs text-amber-700/80 mt-1">{activeReservations.length} pedidos activos</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Stock Disponible</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-900 mt-2">{(totalAvailableUnits || 0).toLocaleString('es-MX')}</p>
          <p className="text-xs text-emerald-700/80 mt-1">Libre para venta inmediata</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-red-200/80 bg-red-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-700 uppercase tracking-wider">Stock Crítico / Cero</span>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-900 mt-2">
            {((criticalStockCount || 0) + (zeroStockCount || 0)).toLocaleString('es-MX')}
          </p>
          <p className="text-xs text-red-700/80 mt-1">{zeroStockCount} en cero absoluto</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Valuación Total</span>
            <Layers className="h-4 w-4 text-slate-600" />
          </div>
          <p className="text-xl font-bold text-slate-900 mt-2">
            ${((totalValuation || 0) / 1000000).toFixed(2)}M
          </p>
          <p className="text-xs text-slate-500 mt-1">${(totalValuation || 0).toLocaleString('es-MX')} MXN</p>
        </div>
      </div>

      {/* Operations Quick Ticker & AI Diagnostic Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Operations Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                Flujo Operativo Pendiente de Ejecución
              </h3>
              <span className="text-xs text-slate-500">Actualización automática</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-4">
              {/* Pedidos por Surtir */}
              <div
                onClick={() => onNavigateTab('PEDIDOS_SURTIR')}
                className="cursor-pointer group p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition flex items-start gap-3.5"
              >
                <div className="h-10 w-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base shrink-0 group-hover:scale-105 transition">
                  {pendingFulfillments.length}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm text-slate-900 group-hover:text-blue-600 transition">
                      Pedidos por Surtir
                    </p>
                    <span className="text-xs text-blue-600 font-medium">Ver ➔</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {pendingFulfillments.length > 0
                      ? `${pendingFulfillments[0].folio} - ${pendingFulfillments[0].customerName}`
                      : 'Sin pedidos pendientes de entrega'}
                  </p>
                </div>
              </div>

              {/* Traspasos en Tránsito / Pendientes */}
              <div
                onClick={() => onNavigateTab('TRASPASOS')}
                className="cursor-pointer group p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition flex items-start gap-3.5"
              >
                <div className="h-10 w-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-base shrink-0 group-hover:scale-105 transition">
                  {inTransitTransfers.length + pendingTransferAuth.length}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm text-slate-900 group-hover:text-indigo-600 transition">
                      Traspasos Inter-Almacén
                    </p>
                    <span className="text-xs text-indigo-600 font-medium">Gestionar ➔</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {inTransitTransfers.length} en tránsito · {pendingTransferAuth.length} por autorizar
                  </p>
                </div>
              </div>

              {/* Inventarios Físicos / Auditoría */}
              <div
                onClick={() => onNavigateTab('CONTEOS_FISICOS')}
                className="cursor-pointer group p-4 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/30 transition flex items-start gap-3.5"
              >
                <div className="h-10 w-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-base shrink-0 group-hover:scale-105 transition">
                  {activeCounts.length}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm text-slate-900 group-hover:text-purple-600 transition">
                      Conteos Físicos Activos
                    </p>
                    <span className="text-xs text-purple-600 font-medium">Auditar ➔</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {activeCounts.length > 0 ? `${activeCounts[0].folio} en ${activeCounts[0].warehouseName}` : 'Sin sesiones abiertas'}
                  </p>
                </div>
              </div>

              {/* Ajustes y Mermas */}
              <div
                onClick={() => onNavigateTab('AJUSTES')}
                className="cursor-pointer group p-4 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/30 transition flex items-start gap-3.5"
              >
                <div className="h-10 w-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-base shrink-0 group-hover:scale-105 transition">
                  {pendingAdjustments.length}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm text-slate-900 group-hover:text-amber-600 transition">
                      Ajustes de Merma / Sobrante
                    </p>
                    <span className="text-xs text-amber-600 font-medium">Revisar ➔</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {pendingAdjustments.length > 0 ? `${pendingAdjustments.length} autorizaciones pendientes` : 'Todo al corriente'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Warehouses Capacity Cards */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-900 text-base mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-slate-700" />
              Ocupación y Capacidad por Centro de Distribución
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {warehouses.map((wh) => {
                const whProds = products.filter((p) => p.warehouseId === wh.id);
                const whStock = whProds.reduce((sum, p) => sum + (p.stock || p.physicalStock || 0), 0);
                const whValuation = whProds.reduce((sum, p) => sum + (p.stock || p.physicalStock || 0) * (p.cost || 0), 0);
                const occupancy = wh.current_occupancy_pct || wh.currentOccupancyPct || 68;

                return (
                  <div key={wh.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 truncate">{wh.name}</span>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-200 rounded text-slate-700">
                        {wh.code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 truncate">{wh.address || wh.location || 'Zona Industrial'}</p>
                    
                    <div className="mt-3">
                      <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                        <span>Ocupación</span>
                        <span>{occupancy}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            occupancy > 85 ? 'bg-red-500' : occupancy > 70 ? 'bg-amber-500' : 'bg-blue-600'
                          }`}
                          style={{ width: `${occupancy}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs">
                      <span className="text-slate-500">{(whStock || 0).toLocaleString('es-MX')} piezas</span>
                      <span className="font-bold text-slate-900">${((whValuation || 0) / 1000).toFixed(0)}k MXN</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: ConsCore AI Inventory Intelligence */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-5 rounded-2xl text-white shadow-md border border-indigo-900/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-500/20 rounded-lg border border-indigo-400/30">
                  <Sparkles className="h-4 w-4 text-indigo-400" />
                </div>
                <h3 className="font-bold text-white text-base">ConsCore AI Diagnostics</h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                Score {aiDiag.healthScore}/100
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Análisis predictivo de existencias, rotación de aislamientos térmicos y sugerencias de reabastecimiento.
            </p>

            <div className="space-y-2.5">
              {aiDiag.suggestions.map((sug, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-indigo-200 truncate">{sug.title}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        sug.priority === 'ALTA'
                          ? 'bg-red-500/30 text-red-200'
                          : 'bg-amber-500/30 text-amber-200'
                      }`}
                    >
                      {sug.priority}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 leading-normal line-clamp-2">
                    {sug.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-white/10">
              <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mb-2">
                Recomendaciones Clave
              </p>
              <ul className="space-y-1.5 text-xs text-slate-200">
                {aiDiag.topRecommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-indigo-400 mt-0.5">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <h4 className="font-bold text-slate-900 text-sm mb-2.5">Accesos Rápidos</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onNavigateTab('STOCK')}
                className="p-2.5 rounded-lg border border-slate-200 text-left hover:bg-slate-50 transition"
              >
                <p className="text-xs font-bold text-slate-900">Ubicaciones</p>
                <p className="text-[11px] text-slate-500">Nave / Rack / Nivel</p>
              </button>
              <button
                onClick={() => onNavigateTab('KARDEX')}
                className="p-2.5 rounded-lg border border-slate-200 text-left hover:bg-slate-50 transition"
              >
                <p className="text-xs font-bold text-slate-900">Kardex Histórico</p>
                <p className="text-[11px] text-slate-500">Trazabilidad auditada</p>
              </button>
              <button
                onClick={() => onNavigateTab('DEVOLUCIONES')}
                id="btn-nav-devoluciones-shortcut"
                className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/50 text-left hover:bg-amber-100/70 transition col-span-2"
              >
                <p className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <RotateCcw className="h-3.5 w-3.5 text-amber-700" />
                  Devoluciones de Producto (Reingreso WMS)
                </p>
                <p className="text-[11px] text-amber-800">
                  Flujo SoD: Solicitud ➔ Autorización ➔ Inspección ➔ Ubicación ➔ Kardex
                </p>
              </button>
              {onOpenReplenishModal && (
                <button
                  onClick={onOpenReplenishModal}
                  className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/60 text-left hover:bg-emerald-100/80 transition col-span-2"
                >
                  <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <PackageCheck className="h-3.5 w-3.5 text-emerald-700" />
                    Solicitar Reabastecimiento a Compras
                  </p>
                  <p className="text-[11px] text-emerald-700">Emitir requerimiento operativo sin precios (SoD)</p>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
