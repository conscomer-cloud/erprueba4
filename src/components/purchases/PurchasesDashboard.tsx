import React, { useState, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { PurchaseRequestsTab } from './PurchaseRequestsTab';
import { PurchaseOrdersTab } from './PurchaseOrdersTab';
import { SuppliersTab } from './SuppliersTab';
import { GoodsReceiptsTab } from './GoodsReceiptsTab';
import { SupplierReturnsTab } from './SupplierReturnsTab';
import { IntelligentReplenishmentTab } from './IntelligentReplenishmentTab';
import { NewPurchaseRequestModal } from './NewPurchaseRequestModal';
import { NewPurchaseOrderModal } from './NewPurchaseOrderModal';
import { NewGoodsReceiptModal } from './NewGoodsReceiptModal';
import { NewSupplierModal } from './NewSupplierModal';
import { NewSupplierReturnModal } from './NewSupplierReturnModal';
import { Supplier, ReplenishmentSuggestion } from '../../types/erp';
import {
  ShoppingCart,
  FileCheck,
  Building2,
  PackageCheck,
  Undo2,
  Sparkles,
  Layers,
  ArrowUpRight,
  TrendingUp,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';

type PurchasesTab = 'REQUESTS' | 'ORDERS' | 'SUPPLIERS' | 'RECEIPTS' | 'RETURNS' | 'REPLENISHMENT';

interface PurchasesDashboardProps {
  /** Pestaña de arranque, para que el menú lateral pueda entrar directo. */
  initialTab?: PurchasesTab;
}

export const PurchasesDashboard: React.FC<PurchasesDashboardProps> = ({ initialTab }) => {
  const { purchaseRequests, purchaseOrders, suppliers, goodsReceipts, supplierReturns } = useERP();
  const { can } = useAuth();

  const [activeTab, setActiveTab] = useState<PurchasesTab>(initialTab || 'REQUESTS');

  // Al cambiar el destino desde el menú se reposiciona la pestaña.
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  // Modal States
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

  // Modal Contextual State
  const [selectedSupplierForEdit, setSelectedSupplierForEdit] = useState<Supplier | null>(null);
  const [prefilledPurchaseRequestId, setPrefilledPurchaseRequestId] = useState<string | undefined>();
  const [prefilledSupplierId, setPrefilledSupplierId] = useState<string | undefined>();
  const [prefilledPoForReceipt, setPrefilledPoForReceipt] = useState<string | undefined>();
  const [prefilledRequestItems, setPrefilledRequestItems] = useState<any[] | undefined>();

  // KPIs
  const pendingRequestsCount = purchaseRequests.filter(
    (pr) => pr.status === 'PENDIENTE_APROBACION' || pr.status === 'PENDIENTE'
  ).length;

  const openOrdersCount = purchaseOrders.filter((po) =>
    ['SENT', 'CONFIRMED', 'PARTIAL_RECEIVED', 'APPROVED'].includes(po.status)
  ).length;

  const totalCommittedPurchases = purchaseOrders
    .filter((po) => po.status !== 'CANCELLED')
    .reduce((sum, po) => sum + po.total, 0);

  const pendingReceiptsCount = purchaseOrders.filter((po) =>
    ['SENT', 'CONFIRMED', 'PARTIAL_RECEIVED'].includes(po.status)
  ).length;

  // Handlers
  const handleConvertToOrder = (requestId: string) => {
    setPrefilledPurchaseRequestId(requestId);
    setPrefilledSupplierId(undefined);
    setIsOrderModalOpen(true);
  };

  const handleReceiveOrder = (orderId: string) => {
    setPrefilledPoForReceipt(orderId);
    setIsReceiptModalOpen(true);
  };

  const handleNewOrderForSupplier = (supplierId: string) => {
    setPrefilledSupplierId(supplierId);
    setPrefilledPurchaseRequestId(undefined);
    setIsOrderModalOpen(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setSelectedSupplierForEdit(supplier);
    setIsSupplierModalOpen(true);
  };

  const handleNewSupplier = () => {
    setSelectedSupplierForEdit(null);
    setIsSupplierModalOpen(true);
  };

  const handleCreateRequestFromAi = (suggestion: any) => {
    const prodId = suggestion.productId || suggestion.product_id;
    const qty = suggestion.suggestedQuantity ?? suggestion.suggested_quantity ?? 1;
    setPrefilledRequestItems([
      {
        productId: prodId,
        quantity: qty,
        suggestedSupplierId: suggestion.recommendedSupplierId || suggestion.suggested_supplier_id,
        reason: suggestion.rationale || suggestion.reason,
      },
    ]);
    setIsRequestModalOpen(true);
  };

  const handleCreateOrderFromAi = (suggestion: ReplenishmentSuggestion) => {
    setPrefilledSupplierId(suggestion.suggested_supplier_id);
    setIsOrderModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header with Title & High-level Metrics */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Gestión de Compras, Proveedores & Reabastecimiento
              </h1>
              <p className="text-xs text-slate-500">
                Flujo integral de compras: Requisiciones, Órdenes PO, Landed Cost, Recepción en Andén, RMA y Reorden Predictivo IA
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setPrefilledPurchaseRequestId(undefined);
              setPrefilledSupplierId(undefined);
              setIsOrderModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Nueva Orden PO</span>
          </button>
        </div>
      </div>

      {/* Top Level Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase">Solicitudes Pendientes</span>
            <FileCheck className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{pendingRequestsCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Por autorizar</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase">Órdenes Activas</span>
            <ShoppingCart className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-indigo-600">{openOrdersCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">En tránsito / confirmadas</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase">Recepciones en Espera</span>
            <PackageCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600">{pendingReceiptsCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Andén de descarga</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase">Volumen Compras (Total)</span>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2 text-xl font-black text-slate-900">
            ${(Number(totalCommittedPurchases) || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">MXN facturado</div>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-200 bg-white p-2 rounded-2xl shadow-xs">
        <button
          onClick={() => setActiveTab('REQUESTS')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
            activeTab === 'REQUESTS'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileCheck className="h-4 w-4" />
          <span>Solicitudes de Compra</span>
          {pendingRequestsCount > 0 && (
            <span
              className={`rounded-full px-2 py-0.2 text-[10px] font-black ${
                activeTab === 'REQUESTS' ? 'bg-white text-blue-700' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {pendingRequestsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('ORDERS')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
            activeTab === 'ORDERS'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShoppingCart className="h-4 w-4" />
          <span>Órdenes de Compra (PO)</span>
          {openOrdersCount > 0 && (
            <span
              className={`rounded-full px-2 py-0.2 text-[10px] font-black ${
                activeTab === 'ORDERS' ? 'bg-white text-indigo-700' : 'bg-indigo-100 text-indigo-800'
              }`}
            >
              {openOrdersCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('SUPPLIERS')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
            activeTab === 'SUPPLIERS'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Catálogo de Proveedores ({suppliers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('RECEIPTS')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
            activeTab === 'RECEIPTS'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <PackageCheck className="h-4 w-4" />
          <span>Recepciones en Almacén ({goodsReceipts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('RETURNS')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
            activeTab === 'RETURNS'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Undo2 className="h-4 w-4" />
          <span>Devoluciones RMA ({supplierReturns.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('REPLENISHMENT')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
            activeTab === 'REPLENISHMENT'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-indigo-600 hover:bg-indigo-50 font-black'
          }`}
        >
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span>Reabastecimiento IA</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div>
        {activeTab === 'REQUESTS' && (
          <PurchaseRequestsTab
            onNewRequest={() => setIsRequestModalOpen(true)}
            onConvertToOrder={handleConvertToOrder}
          />
        )}

        {activeTab === 'ORDERS' && (
          <PurchaseOrdersTab
            onNewOrder={() => {
              setPrefilledPurchaseRequestId(undefined);
              setPrefilledSupplierId(undefined);
              setIsOrderModalOpen(true);
            }}
            onReceiveOrder={handleReceiveOrder}
          />
        )}

        {activeTab === 'SUPPLIERS' && (
          <SuppliersTab
            onNewSupplier={handleNewSupplier}
            onEditSupplier={handleEditSupplier}
            onNewOrderForSupplier={handleNewOrderForSupplier}
          />
        )}

        {activeTab === 'RECEIPTS' && (
          <GoodsReceiptsTab onNewReceipt={() => setIsReceiptModalOpen(true)} />
        )}

        {activeTab === 'RETURNS' && (
          <SupplierReturnsTab onNewReturn={() => setIsReturnModalOpen(true)} />
        )}

        {activeTab === 'REPLENISHMENT' && (
          <IntelligentReplenishmentTab
            onCreatePurchaseRequestFromAi={handleCreateRequestFromAi}
            onCreatePurchaseOrderFromAi={handleCreateOrderFromAi}
          />
        )}
      </div>

      {/* Modals */}
      <NewPurchaseRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => {
          setIsRequestModalOpen(false);
          setPrefilledRequestItems(undefined);
        }}
        initialItems={prefilledRequestItems}
      />

      <NewPurchaseOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => {
          setIsOrderModalOpen(false);
          setPrefilledPurchaseRequestId(undefined);
          setPrefilledSupplierId(undefined);
        }}
        prefilledPurchaseRequestId={prefilledPurchaseRequestId}
        prefilledSupplierId={prefilledSupplierId}
      />

      <NewGoodsReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setPrefilledPoForReceipt(undefined);
        }}
        purchaseOrderId={prefilledPoForReceipt}
      />

      <NewSupplierModal
        isOpen={isSupplierModalOpen}
        onClose={() => {
          setIsSupplierModalOpen(false);
          setSelectedSupplierForEdit(null);
        }}
        supplierToEdit={selectedSupplierForEdit}
      />

      <NewSupplierReturnModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
      />
    </div>
  );
};
