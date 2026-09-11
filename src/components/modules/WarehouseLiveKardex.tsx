import React, { useState, useMemo } from 'react';
import {
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  Building2,
  Boxes,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Trash2,
  ExternalLink,
  Users,
  Zap,
  LayoutDashboard,
  ClipboardList,
  Shuffle,
  ClipboardCheck,
  SlidersHorizontal,
  History,
  ShieldCheck,
  Clock,
  Sparkles,
  Layers,
  RotateCcw,
  FileText,
  FileDown,
  TrendingUp
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { MovementType, Product } from '../../types/erp';
import { WarehouseOperationsDashboard } from '../warehouse/WarehouseOperationsDashboard';
import { OrderFulfillmentManager } from '../warehouse/OrderFulfillmentManager';
import { WarehouseTransfersManager } from '../warehouse/WarehouseTransfersManager';
import { PhysicalInventoryManager } from '../warehouse/PhysicalInventoryManager';
import { InventoryAdjustmentsManager } from '../warehouse/InventoryAdjustmentsManager';
import { CatalogImportExportModal } from '../warehouse/CatalogImportExportModal';
import { WarehouseReplenishmentRequestModal } from '../warehouse/WarehouseReplenishmentRequestModal';
import { WarehouseReplenishmentRequestsList } from '../warehouse/WarehouseReplenishmentRequestsList';
import { WarehouseReturnsTab } from '../warehouse/WarehouseReturnsTab';
import { downloadInventoryExcelBackup } from '../../services/inventoryBackupService';
import {
  calculateRotation,
  exportInventoryCSV,
  exportInventoryPDF,
} from '../../services/inventoryExportService';

export const WarehouseLiveKardex: React.FC<{ onOpenSimulator?: () => void }> = ({ onOpenSimulator }) => {
  const {
    products,
    movements,
    warehouses,
    orders,
    reservations,
    transfers,
    countSessions,
    adjustments,
    purchaseRequests,
    logisticsReturns,
    recordMovement,
    deleteMovement,
    wipeMovements,
    lastSyncTimestamp,
    logAudit,
  } = useERP();
  const { currentUser } = useAuth();
  const [isQuickExporting, setIsQuickExporting] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [rotationPeriod, setRotationPeriod] = useState(90);

  const handleQuickDownloadBackup = async () => {
    if (isQuickExporting) return;
    setIsQuickExporting(true);
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
      console.error('[WarehouseLiveKardex] Error al descargar respaldo:', err);
    } finally {
      setIsQuickExporting(false);
    }
  };

  const [activeTab, setActiveTab] = useState<
    'DASHBOARD' | 'STOCK' | 'MOVIMIENTOS' | 'PEDIDOS_SURTIR' | 'TRASPASOS' | 'CONTEOS_FISICOS' | 'AJUSTES' | 'KARDEX' | 'SOLICITUDES_REABASTECIMIENTO' | 'DEVOLUCIONES'
  >('DASHBOARD');

  const [showImportModal, setShowImportModal] = useState(false);
  const [isReplenishModalOpen, setIsReplenishModalOpen] = useState(false);
  const [selectedProductForReplenish, setSelectedProductForReplenish] = useState<Product | null>(null);

  // Filters for Tab 1 (Stock & Ubicaciones)
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('');
  const [filterNave, setFilterNave] = useState('');
  const [filterRack, setFilterRack] = useState('');
  const [filterStockStatus, setFilterStockStatus] = useState<'TODAS' | 'CON_STOCK' | 'EN_CERO' | 'SIN_UBICACION'>('TODAS');

  // Movement Form State
  const [selectedProductCode, setSelectedProductCode] = useState(products[0]?.code || '');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(warehouses[0]?.id || 'WH-01');
  const [warehouseLocation, setWarehouseLocation] = useState('N1 / R-04 / P-02 / Niv-01');
  const [movementType, setMovementType] = useState<MovementType>('ENTRADA');
  const [movementQty, setMovementQty] = useState<number>(10);
  const [reference, setReference] = useState('');
  const [responsibleName, setResponsibleName] = useState(currentUser?.name || 'Operador Almacén');
  const [movementFeedback, setMovementFeedback] = useState<{ text: string; ok: boolean } | null>(null);

  // Filters for Kardex (Tab 3)
  const [kardexSearch, setKardexSearch] = useState('');
  const [kardexTypeFilter, setKardexTypeFilter] = useState('');
  const [kardexDateFrom, setKardexDateFrom] = useState('');
  const [kardexDateTo, setKardexDateTo] = useState('');

  // Extract unique categories, naves, racks
  const categories = useMemo(() => [...new Set(products.map((p) => p.category))], [products]);
  const naves = ['N1', 'N2', 'N3'];
  const racks = ['R-01', 'R-02', 'R-03', 'R-04', 'R-05'];

  // Filtered Products for Stock view
  const filteredProducts = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return products.filter((p) => {
      if (q && !((p.name || "").toLowerCase().includes(q) || (p.code || "").toLowerCase().includes(q) || (p.sku && (p.sku || "").toLowerCase().includes(q)))) {
        return false;
      }
      if (filterCategory && p.category !== filterCategory) return false;
      if (filterWarehouse && p.warehouseId !== filterWarehouse) return false;

      const locStr = typeof p.warehouseLocation === 'string' ? p.warehouseLocation : '';
      if (filterNave && !locStr.includes(filterNave)) return false;
      if (filterRack && !locStr.includes(filterRack)) return false;

      const avail = p.availableStock ?? 0;
      if (filterStockStatus === 'CON_STOCK' && avail <= 0) return false;
      if (filterStockStatus === 'EN_CERO' && avail > 0) return false;
      if (filterStockStatus === 'SIN_UBICACION' && locStr && !locStr.includes('SIN')) return false;

      return true;
    });
  }, [products, searchTerm, filterCategory, filterWarehouse, filterNave, filterRack, filterStockStatus]);

  // Rotación de inventario: salidas del periodo contra existencia disponible.
  const rotationRows = useMemo(
    () => calculateRotation(filteredProducts, movements, warehouses, rotationPeriod),
    [filteredProducts, movements, warehouses, rotationPeriod]
  );

  // Solo se grafican los materiales con salidas: los que no se movieron
  // producirían diez barras en cero sin decir nada.
  const rotationChartRows = useMemo(
    () => rotationRows.filter((r) => r.exits > 0).slice(0, 10),
    [rotationRows]
  );

  const exportContext = () => ({
    products: filteredProducts,
    rotation: rotationRows,
    warehouses,
    periodDays: rotationPeriod,
    userName: currentUser?.name || 'Operador de Inventario',
    userRole: currentUser?.role || 'ALMACEN',
    filterSummary: [
      filterWarehouse ? `Almacén: ${warehouses.find((w) => w.id === filterWarehouse)?.name || filterWarehouse}` : 'Todos los almacenes',
      filterCategory ? `Categoría: ${filterCategory}` : 'Todas las categorías',
      filterNave ? `Nave: ${filterNave}` : null,
      filterRack ? `Rack: ${filterRack}` : null,
      searchTerm ? `Búsqueda: "${searchTerm}"` : null,
    ].filter(Boolean).join('  ·  '),
  });

  const handleExportCsv = () => {
    // El servicio registra la exportación en la bitácora del servidor.
    exportInventoryCSV(exportContext());
  };

  const handleExportPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      await exportInventoryPDF(exportContext());
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Filtered Movements for Kardex
  const filteredKardex = useMemo(() => {
    const q = kardexSearch.toLowerCase().trim();
    return movements.filter((m) => {
      if (kardexTypeFilter && m.type !== kardexTypeFilter) return false;
      if (q && !(
        (m.productCode || "").toLowerCase().includes(q) ||
        (m.productName || "").toLowerCase().includes(q) ||
        (m.relatedDocFolio && (m.relatedDocFolio || "").toLowerCase().includes(q)) ||
        (m.userName || "").toLowerCase().includes(q) ||
        (m.reason || "").toLowerCase().includes(q)
      )) {
        return false;
      }
      if (kardexDateFrom && (m.timestamp || '').slice(0, 10) < kardexDateFrom) return false;
      if (kardexDateTo && (m.timestamp || '').slice(0, 10) > kardexDateTo) return false;
      return true;
    });
  }, [movements, kardexSearch, kardexTypeFilter, kardexDateFrom, kardexDateTo]);

  // Selected product details for form
  const currentProduct = useMemo(
    () => products.find((p) => p.code === selectedProductCode || p.id === selectedProductCode) || products[0],
    [products, selectedProductCode]
  );

  const handleRegisterMovement = () => {
    if (!currentProduct) {
      setMovementFeedback({ text: 'Selecciona un material válido.', ok: false });
      return;
    }
    if (movementQty <= 0 || isNaN(movementQty)) {
      setMovementFeedback({ text: 'La cantidad debe ser mayor a cero.', ok: false });
      return;
    }

    const res = recordMovement({
      productId: currentProduct.id,
      warehouseId: selectedWarehouseId,
      type: movementType,
      quantity: movementQty,
      reason: reference ? `Referencia: ${reference}` : 'Movimiento operativo de almacén',
      relatedDocFolio: reference || undefined,
      location: warehouseLocation,
      customUser: {
        id: currentUser?.id || 'USR-005',
        name: responsibleName || currentUser?.name || 'Operador Almacén',
        role: currentUser?.role || 'ALMACEN',
      },
    });

    if (res.success) {
      setMovementFeedback({
        text: `✅ ${movementType} registrada con éxito. Saldo nuevo disponible: ${
          movementType === 'ENTRADA' ? currentProduct.availableStock + movementQty : currentProduct.availableStock - movementQty
        } ${currentProduct.unit}. Sincronizado en tiempo real a todos los usuarios.`,
        ok: true,
      });
      setMovementQty(10);
      setReference('');
      setTimeout(() => setMovementFeedback(null), 5000);
    } else {
      setMovementFeedback({ text: `❌ Error: ${res.error}`, ok: false });
    }
  };

  const handleExportCSV = () => {
    const headers = ['Fecha / Hora', 'Tipo', 'Código', 'Producto', 'Ubicación', 'Cantidad', 'Saldo', 'Referencia', 'Responsable'];
    const rows = filteredKardex.map((m) => [
      `"${m.timestamp}"`,
      `"${m.type}"`,
      `"${m.productCode}"`,
      `"${m.productName.replace(/"/g, '""')}"`,
      `"${m.location || 'General'}"`,
      `"${m.type === 'SALIDA' ? '-' : '+'}${m.quantity}"`,
      `"${m.newBalance}"`,
      `"${m.relatedDocFolio || ''}"`,
      `"${m.userName}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `kardex_conscore_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteMovementRow = (id: string) => {
    if (!confirm('¿Eliminar este movimiento? El saldo físico se recalculará automáticamente.')) return;
    deleteMovement(id);
  };

  const handleWipeHistory = () => {
    if (!confirm('ATENCIÓN: Esto borrará TODO el historial de movimientos del Kardex. ¿Continuar?')) return;
    wipeMovements();
  };

  // Pending counts for badges
  const pendingOrdersCount = useMemo(() => orders.filter((o) => ['CONFIRMADO', 'RESERVADO', 'EN SURTIDO'].includes(o.status)).length, [orders]);
  const activeTransfersCount = useMemo(() => transfers.filter((t) => t.status === 'EN_TRANSITO' || t.status === 'SOLICITADA').length, [transfers]);
  const activeCountsCount = useMemo(() => countSessions.filter((c) => c.status === 'EN_CONTEO' || c.status === 'DIFERENCIAS_DETECTADAS').length, [countSessions]);
  const pendingAdjustmentsCount = useMemo(() => adjustments.filter((a) => a.status === 'PENDIENTE_AUTORIZACION').length, [adjustments]);
  const pendingReplenishmentsCount = useMemo(
    () =>
      (purchaseRequests || []).filter(
        (pr) =>
          pr.status === 'PENDIENTE' ||
          pr.status === 'PENDIENTE_APROBACION' ||
          pr.status === 'EN_COTIZACION' ||
          pr.status === 'EN_REVISION'
      ).length,
    [purchaseRequests]
  );
  const pendingReturnsCount = useMemo(
    () =>
      (logisticsReturns || []).filter(
        (r) =>
          r.status === 'PENDIENTE_AUTORIZACION' ||
          r.status === 'SOLICITADA' ||
          r.status === 'AUTORIZADA' ||
          r.status === 'PENDIENTE_RECEPCION'
      ).length,
    [logisticsReturns]
  );

  return (
    <div className="space-y-5">
      {/* Top Banner with Real-time synchronization indicator */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 p-4 text-white shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs shrink-0">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold">Control de Inventario & Almacén FASE 2</h2>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Sincronización en Vivo ({lastSyncTimestamp})
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Trazabilidad transaccional, stock físico vs disponible, surtido de pedidos, traspasos y auditoría cíclica.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => {
              setSelectedProductForReplenish(null);
              setIsReplenishModalOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 text-xs font-bold transition shadow-xs shrink-0"
            title="Solicitar compra o reabastecimiento de producto al área de Compras (SoD)"
          >
            <Package className="h-4 w-4" />
            <span>Solicitar Reabastecimiento</span>
          </button>

          {onOpenSimulator && (
            <button
              onClick={onOpenSimulator}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-yellow-400 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-yellow-300 transition shadow-xs shrink-0"
            >
              <Users className="h-4 w-4" />
              <span>Simulador 2 Usuarios ⚡</span>
            </button>
          )}

          <button
            id="btn-kardex-descargar-respaldo"
            aria-label="Descargar respaldo"
            onClick={handleQuickDownloadBackup}
            disabled={isQuickExporting}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 disabled:bg-slate-800 text-white border border-emerald-600/80 px-3 py-2 text-xs font-semibold transition shrink-0 shadow-xs cursor-pointer disabled:cursor-not-allowed"
            title="Descargar respaldo oficial de inventario en Excel (.xlsx)"
          >
            {isQuickExporting ? (
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

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 bg-white p-2 rounded-2xl shadow-2xs">
        <button
          onClick={() => setActiveTab('DASHBOARD')}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition shrink-0 ${
            activeTab === 'DASHBOARD'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <LayoutDashboard className="h-3.5 w-3.5" />
          Dashboard
        </button>

        <button
          onClick={() => setActiveTab('STOCK')}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition shrink-0 ${
            activeTab === 'STOCK'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Boxes className="h-3.5 w-3.5" />
          Ubicaciones y Stock ({products.length})
        </button>

        <button
          onClick={() => setActiveTab('SOLICITUDES_REABASTECIMIENTO')}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition shrink-0 ${
            activeTab === 'SOLICITUDES_REABASTECIMIENTO'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Package className="h-3.5 w-3.5 text-emerald-500" />
          Solicitudes Reabastecimiento
          {pendingReplenishmentsCount > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'SOLICITUDES_REABASTECIMIENTO' ? 'bg-white text-emerald-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {pendingReplenishmentsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('PEDIDOS_SURTIR')}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition shrink-0 ${
            activeTab === 'PEDIDOS_SURTIR'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ClipboardList className="h-3.5 w-3.5" />
          Pedidos por Surtir
          {pendingOrdersCount > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'PEDIDOS_SURTIR' ? 'bg-white text-blue-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {pendingOrdersCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('MOVIMIENTOS')}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition shrink-0 ${
            activeTab === 'MOVIMIENTOS'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-400" />
          Entrada / Salida Directa
        </button>

        <button
          onClick={() => setActiveTab('TRASPASOS')}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition shrink-0 ${
            activeTab === 'TRASPASOS'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Shuffle className="h-3.5 w-3.5" />
          Traspasos
          {activeTransfersCount > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'TRASPASOS' ? 'bg-white text-indigo-700' : 'bg-indigo-100 text-indigo-700'
            }`}>
              {activeTransfersCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('CONTEOS_FISICOS')}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition shrink-0 ${
            activeTab === 'CONTEOS_FISICOS'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ClipboardCheck className="h-3.5 w-3.5" />
          Conteos Físicos
          {activeCountsCount > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'CONTEOS_FISICOS' ? 'bg-white text-purple-700' : 'bg-purple-100 text-purple-700'
            }`}>
              {activeCountsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('AJUSTES')}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition shrink-0 ${
            activeTab === 'AJUSTES'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Ajustes / Merma
          {pendingAdjustmentsCount > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'AJUSTES' ? 'bg-white text-amber-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {pendingAdjustmentsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('DEVOLUCIONES')}
          id="tab-devoluciones-almacen"
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition shrink-0 ${
            activeTab === 'DEVOLUCIONES'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <RotateCcw className="h-3.5 w-3.5 text-amber-500" />
          Devoluciones
          {pendingReturnsCount > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'DEVOLUCIONES' ? 'bg-white text-amber-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {pendingReturnsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('KARDEX')}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition shrink-0 ${
            activeTab === 'KARDEX'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <History className="h-3.5 w-3.5" />
          Kardex Trazable ({movements.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB: DASHBOARD */}
      {/* ========================================================================= */}
      {activeTab === 'DASHBOARD' && (
        <WarehouseOperationsDashboard
          onNavigateTab={setActiveTab}
          onOpenImportModal={() => setShowImportModal(true)}
          onOpenReplenishModal={() => {
            setSelectedProductForReplenish(null);
            setIsReplenishModalOpen(true);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB: SOLICITUDES DE REABASTECIMIENTO A COMPRAS (SoD) */}
      {/* ========================================================================= */}
      {activeTab === 'SOLICITUDES_REABASTECIMIENTO' && (
        <WarehouseReplenishmentRequestsList
          onOpenNewRequestModal={() => {
            setSelectedProductForReplenish(null);
            setIsReplenishModalOpen(true);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB: PEDIDOS POR SURTIR */}
      {/* ========================================================================= */}
      {activeTab === 'PEDIDOS_SURTIR' && <OrderFulfillmentManager />}

      {/* ========================================================================= */}
      {/* TAB: TRASPASOS INTER-ALMACEN */}
      {/* ========================================================================= */}
      {activeTab === 'TRASPASOS' && <WarehouseTransfersManager />}

      {/* ========================================================================= */}
      {/* TAB: CONTEOS FISICOS */}
      {/* ========================================================================= */}
      {activeTab === 'CONTEOS_FISICOS' && <PhysicalInventoryManager />}

      {/* ========================================================================= */}
      {/* TAB: AJUSTES MANUALES */}
      {/* ========================================================================= */}
      {activeTab === 'AJUSTES' && <InventoryAdjustmentsManager />}

      {/* ========================================================================= */}
      {/* TAB: DEVOLUCIONES DE PRODUCTO (OBSERVACIÓN 15) */}
      {/* ========================================================================= */}
      {activeTab === 'DEVOLUCIONES' && (
        <WarehouseReturnsTab
          onNavigateKardex={() => setActiveTab('KARDEX')}
          onNavigateStock={() => setActiveTab('STOCK')}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB: STOCK & UBICACIONES */}
      {/* ========================================================================= */}
      {activeTab === 'STOCK' && (
        <div className="space-y-4">

          {/* Barra de exportación. Lleva no-print porque son controles de
              interfaz: si alguien manda imprimir la pantalla, no deben salir
              en el papel. El PDF del botón no depende de esto: se arma con
              jsPDF como documento propio, no como captura. */}
          <div className="no-print flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
            <div className="flex items-center gap-2 text-slate-700">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-bold">Rotación de inventario</span>
            </div>

            <select
              value={rotationPeriod}
              onChange={(e) => setRotationPeriod(Number(e.target.value))}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 cursor-pointer"
              aria-label="Periodo de análisis de rotación"
            >
              <option value={30}>Últimos 30 días</option>
              <option value={90}>Últimos 90 días</option>
              <option value={180}>Últimos 180 días</option>
              <option value={365}>Último año</option>
            </select>

            <span className="text-[11px] text-slate-500">
              {filteredProducts.length} material(es) según los filtros activos
            </span>

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                title="Descarga la tabla y los datos de rotación en CSV"
              >
                <FileDown className="h-3.5 w-3.5" />
                Exportar CSV
              </button>

              <button
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                title="Genera un PDF con la tabla y el gráfico de rotación"
              >
                <FileText className="h-3.5 w-3.5" />
                {isExportingPdf ? 'Generando...' : 'Exportar PDF'}
              </button>
            </div>
          </div>

          {/* Gráfico de rotación */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="mb-3 flex items-baseline justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Rotación por material · 10 más activos
              </h3>
              <span className="text-[10px] text-slate-500">
                salidas del periodo entre existencia disponible
              </span>
            </div>

            {rotationChartRows.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500">
                No hay salidas registradas en los últimos {rotationPeriod} días con los filtros actuales.
              </p>
            ) : (
              <>
                <div className="flex h-44 items-end gap-2">
                  {rotationChartRows.map((row) => {
                    const max = Math.max(...rotationChartRows.map((r) => r.turnover), 0.01);
                    const alturaPct = Math.max((row.turnover / max) * 100, 2);
                    const color =
                      row.classification === 'ALTA' ? 'bg-blue-600'
                      : row.classification === 'MEDIA' ? 'bg-yellow-400'
                      : 'bg-slate-300';
                    return (
                      <div key={row.code} className="flex flex-1 flex-col items-center justify-end gap-1" title={`${row.name} — ${row.exits} salidas, ${row.coverageDays} días de cobertura`}>
                        <span className="text-[10px] font-bold font-mono text-slate-700">
                          {row.turnover.toFixed(2)}
                        </span>
                        <div className={`w-full rounded-t ${color}`} style={{ height: `${alturaPct}%` }} />
                        <span className="w-full truncate text-center text-[9px] text-slate-500">
                          {row.code}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 flex flex-wrap gap-3 border-t border-slate-100 pt-2.5 text-[10px] text-slate-600">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-xs bg-blue-600" /> Alta (1.0 o más)</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-xs bg-yellow-400" /> Media (0.3 a 1.0)</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-xs bg-slate-300" /> Baja (menos de 0.3)</span>
                </div>
              </>
            )}
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-500">Materiales Distintos</span>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">{products.length}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-500">Ubicaciones Naves/Racks</span>
              <div className="text-xl font-bold font-mono text-blue-900 mt-1">{products.length}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-emerald-700">Con Stock Disponible</span>
              <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
                {products.filter((p) => p.availableStock > 0).length}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-red-700">Stock Crítico / En Cero</span>
              <div className="text-xl font-bold font-mono text-red-700 mt-1">
                {products.filter((p) => p.availableStock <= p.minStock).length}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-amber-700">Inventario Reservado</span>
              <div className="text-xl font-bold font-mono text-amber-700 mt-1">
                {products.reduce((sum, p) => sum + (p.reservedStock || 0), 0)} Pzas
              </div>
            </div>
          </div>

          {/* Filters Row */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Buscar por nombre, código o SKU
                </label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Ej. preformado, lana mineral, PRE-1080..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Almacén
                </label>
                <select
                  value={filterWarehouse}
                  onChange={(e) => setFilterWarehouse(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                >
                  <option value="">Todos los Almacenes</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Categoría
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                >
                  <option value="">Todas</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Existencia
                </label>
                <select
                  value={filterStockStatus}
                  onChange={(e) => setFilterStockStatus(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                >
                  <option value="TODAS">Todas</option>
                  <option value="CON_STOCK">Con Stock</option>
                  <option value="EN_CERO">En Cero</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterCategory('');
                    setFilterWarehouse('');
                    setFilterNave('');
                    setFilterRack('');
                    setFilterStockStatus('TODAS');
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>

            <div className="mt-3 text-xs text-slate-500 font-mono flex items-center justify-between border-t border-slate-100 pt-2">
              <span>
                Mostrando <b>{filteredProducts.length}</b> de <b>{products.length}</b> registros de ubicación
              </span>
              <span className="text-emerald-700 font-bold">
                ⚡ Sincronizado en Vivo
              </span>
            </div>

            {/* Products Table */}
            <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">Descripción de Material</th>
                    <th className="py-2.5 px-3">U.M.</th>
                    <th className="py-2.5 px-3">Categoría</th>
                    <th className="py-2.5 px-3">Ubicación (Nave/Rack/Pasillo/Nivel)</th>
                    <th className="py-2.5 px-3 text-right">Físico</th>
                    <th className="py-2.5 px-3 text-right text-amber-700">Reservado</th>
                    <th className="py-2.5 px-3 text-right text-emerald-700">Disponible</th>
                    <th className="py-2.5 px-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => {
                    const isLow = (p.availableStock || 0) <= (p.minStock || 5);
                    const loc = typeof p.warehouseLocation === 'string' ? p.warehouseLocation : 'N1 / R-01 / P-01 / Niv-01';
                    return (
                      <tr key={p.id} className={`hover:bg-slate-50/80 ${isLow ? 'bg-red-50/30' : ''}`}>
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-900">{p.code}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 max-w-xs">{p.name}</td>
                        <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">{p.unit}</td>
                        <td className="py-2.5 px-3">
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700 text-[11px]">
                          {loc}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium">{p.stock || p.physicalStock || 0}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-700">{p.reservedStock || 0}</td>
                        <td className={`py-2.5 px-3 text-right font-mono font-black ${isLow ? 'text-red-600' : 'text-emerald-700'}`}>
                          {p.availableStock || 0} {isLow && '⚠️'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <button
                              onClick={() => {
                                setSelectedProductCode(p.code);
                                setWarehouseLocation(loc);
                                setActiveTab('MOVIMIENTOS');
                              }}
                              className="rounded bg-blue-50 border border-blue-200 px-2 py-1 text-[11px] font-bold text-blue-800 hover:bg-blue-100 transition-colors shadow-2xs"
                              title="Registrar entrada o salida directa"
                            >
                              Movimiento
                            </button>
                            <button
                              onClick={() => {
                                setSelectedProductForReplenish(p);
                                setIsReplenishModalOpen(true);
                              }}
                              className="rounded bg-emerald-50 border border-emerald-200 px-2 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs inline-flex items-center gap-1"
                              title="Solicitar Reabastecimiento a Compras (SoD)"
                            >
                              <Package className="h-3 w-3 text-emerald-600" />
                              Solicitar Compra
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: REGISTRO DIRECTO DE ENTRADAS Y SALIDAS */}
      {/* ========================================================================= */}
      {activeTab === 'MOVIMIENTOS' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2 flex items-center justify-between">
              <span>Registrar Entrada / Salida de Inventario</span>
              <span className="text-xs text-slate-400 font-normal">Sincroniza en tiempo real con todos los usuarios</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Material (Código o Nombre)
                </label>
                <select
                  value={selectedProductCode}
                  onChange={(e) => setSelectedProductCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2 text-xs font-bold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.code}>
                      [{p.code}] {p.name} — Disp: {p.availableStock} {p.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Almacén
                </label>
                <select
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Tipo Movimiento
                </label>
                <select
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value as MovementType)}
                  className={`w-full rounded-lg border p-2 text-xs font-bold focus:outline-none ${
                    movementType === 'ENTRADA'
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      : movementType === 'SALIDA'
                      ? 'border-red-300 bg-red-50 text-red-800'
                      : 'border-blue-300 bg-blue-50 text-blue-800'
                  }`}
                >
                  <option value="ENTRADA">🟢 ENTRADA (+)</option>
                  <option value="SALIDA">🔴 SALIDA (-)</option>
                  <option value="INICIAL">📦 INVENTARIO INICIAL</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Cantidad ({currentProduct?.unit || 'Pza'})
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  value={movementQty}
                  onChange={(e) => setMovementQty(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-mono font-bold text-slate-900 focus:border-blue-500 focus:outline-none text-right"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Ubicación Rack
                </label>
                <input
                  type="text"
                  value={warehouseLocation}
                  onChange={(e) => setWarehouseLocation(e.target.value)}
                  placeholder="Ej. N1 / R-04 / P-02 / Niv-01"
                  className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-mono text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Referencia / Doc
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Vale / OC / Remisión"
                  className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Responsable
                </label>
                <input
                  type="text"
                  value={responsibleName}
                  onChange={(e) => setResponsibleName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <button
                  onClick={handleRegisterMovement}
                  className="w-full rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 py-2.5 text-xs font-bold text-white shadow-xs transition"
                >
                  Registrar {movementType} en Tiempo Real
                </button>
              </div>
            </div>

            {/* Current Selected Material Specs Banner */}
            {currentProduct && (
              <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-mono font-bold text-blue-900">{currentProduct.code}</span> ·{' '}
                  <span className="font-semibold text-slate-800">{currentProduct.name}</span>
                </div>
                <div className="flex items-center gap-4 text-[11px] font-mono">
                  <span>Físico: <b>{currentProduct.stock}</b> {currentProduct.unit}</span>
                  <span className="text-amber-700">Reservado: <b>{currentProduct.reservedStock}</b></span>
                  <span className="text-emerald-700 font-bold">Disponible: <b>{currentProduct.availableStock}</b> {currentProduct.unit}</span>
                  <span>Costo: <b>${(currentProduct.cost || 0).toFixed(2)}</b></span>
                </div>
              </div>
            )}

            {movementFeedback && (
              <div
                className={`mt-3 rounded-lg p-3 text-xs font-medium ${
                  movementFeedback.ok
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {movementFeedback.text}
              </div>
            )}
          </div>

          {/* Recent 15 Movements */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
              <span>Últimos Movimientos Transaccionales</span>
              <span className="text-xs text-slate-400 font-normal">Mostrando los 15 más recientes</span>
            </h3>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Fecha / Hora</th>
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">Material</th>
                    <th className="py-2.5 px-3">Ubicación</th>
                    <th className="py-2.5 px-3 text-right">Cantidad</th>
                    <th className="py-2.5 px-3 text-right">Saldo Físico</th>
                    <th className="py-2.5 px-3">Referencia</th>
                    <th className="py-2.5 px-3">Responsable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movements.slice(0, 15).map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono text-slate-500 text-[11px]">{m.timestamp}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                            m.type === 'ENTRADA'
                              ? 'bg-emerald-100 text-emerald-800'
                              : m.type === 'SALIDA'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {m.type}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-900">{m.productCode}</td>
                      <td className="py-2 px-3 text-slate-800 max-w-xs truncate">{m.productName}</td>
                      <td className="py-2 px-3 font-mono text-slate-500 text-[11px]">{m.location || 'N1 / R-01'}</td>
                      <td
                        className={`py-2 px-3 text-right font-mono font-bold ${
                          m.type === 'SALIDA' ? 'text-red-600' : 'text-emerald-600'
                        }`}
                      >
                        {m.type === 'SALIDA' ? '-' : '+'}
                        {m.quantity}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{m.newBalance}</td>
                      <td className="py-2 px-3 text-slate-600 text-[11px]">{m.relatedDocFolio || m.reason || '—'}</td>
                      <td className="py-2 px-3 text-slate-600 text-[11px]">{m.userName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: KARDEX TRAZABLE HISTORICO */}
      {/* ========================================================================= */}
      {activeTab === 'KARDEX' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Filtrar Kardex
                </label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={kardexSearch}
                    onChange={(e) => setKardexSearch(e.target.value)}
                    placeholder="Código, título, referencia, responsable..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Tipo
                </label>
                <select
                  value={kardexTypeFilter}
                  onChange={(e) => setKardexTypeFilter(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                >
                  <option value="">Todos</option>
                  <option value="ENTRADA">ENTRADA</option>
                  <option value="SALIDA">SALIDA</option>
                  <option value="INICIAL">INICIAL</option>
                  <option value="AJUSTE">AJUSTE</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Desde
                </label>
                <input
                  type="date"
                  value={kardexDateFrom}
                  onChange={(e) => setKardexDateFrom(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Hasta
                </label>
                <input
                  type="date"
                  value={kardexDateTo}
                  onChange={(e) => setKardexDateTo(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-end gap-2">
                <button
                  onClick={handleExportCSV}
                  className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 py-2 text-xs font-bold text-white shadow-xs flex items-center justify-center gap-1"
                >
                  <Download className="h-3.5 w-3.5" />
                  CSV
                </button>
                <button
                  onClick={handleWipeHistory}
                  title="Borrar historial"
                  className="rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 p-2 text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-3 text-xs text-slate-500 font-mono flex items-center justify-between border-t border-slate-100 pt-2">
              <span>
                Mostrando <b>{filteredKardex.length}</b> movimientos registrados
              </span>
              <span className="text-blue-600 font-bold">
                Trazabilidad 100% Auditada
              </span>
            </div>

            {/* Kardex Full Table */}
            <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Fecha / Hora</th>
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">Material</th>
                    <th className="py-2.5 px-3">Ubicación</th>
                    <th className="py-2.5 px-3 text-right">Cant.</th>
                    <th className="py-2.5 px-3 text-right">Saldo</th>
                    <th className="py-2.5 px-3">Referencia / Motivo</th>
                    <th className="py-2.5 px-3">Responsable</th>
                    <th className="py-2.5 px-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredKardex.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono text-slate-500 text-[11px]">{m.timestamp}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                            m.type === 'ENTRADA'
                              ? 'bg-emerald-100 text-emerald-800'
                              : m.type === 'SALIDA'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {m.type}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-900">{m.productCode}</td>
                      <td className="py-2 px-3 text-slate-800 max-w-xs truncate">{m.productName}</td>
                      <td className="py-2 px-3 font-mono text-slate-500 text-[11px]">{m.location || 'General'}</td>
                      <td
                        className={`py-2 px-3 text-right font-mono font-bold ${
                          m.type === 'SALIDA' ? 'text-red-600' : 'text-emerald-600'
                        }`}
                      >
                        {m.type === 'SALIDA' ? '-' : '+'}
                        {m.quantity}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{m.newBalance}</td>
                      <td className="py-2 px-3 text-slate-600 text-[11px]">{m.relatedDocFolio || m.reason || '—'}</td>
                      <td className="py-2 px-3 text-slate-600 text-[11px]">{m.userName}</td>
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={() => handleDeleteMovementRow(m.id)}
                          className="text-slate-400 hover:text-red-600 p-1"
                          title="Eliminar movimiento"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Catalog & Excel Import/Export Modal */}
      <CatalogImportExportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />

      {/* Warehouse Replenishment Request Modal (SoD - No financial data) */}
      <WarehouseReplenishmentRequestModal
        isOpen={isReplenishModalOpen}
        onClose={() => {
          setIsReplenishModalOpen(false);
          setSelectedProductForReplenish(null);
        }}
        preselectedProduct={selectedProductForReplenish}
        onSuccess={() => {
          setActiveTab('SOLICITUDES_REABASTECIMIENTO');
        }}
      />
    </div>
  );
};
