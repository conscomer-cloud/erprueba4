import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Package,
  Layers,
  Clock,
  Send,
  AlertCircle,
  FileText
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { Product, PurchaseRequestPriority } from '../../types/erp';

interface WarehouseReplenishmentRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedProduct?: Product | null;
  onSuccess?: (requestFolio: string) => void;
}

export const WarehouseReplenishmentRequestModal: React.FC<WarehouseReplenishmentRequestModalProps> = ({
  isOpen,
  onClose,
  preselectedProduct,
  onSuccess,
}) => {
  const { products, warehouses, purchaseRequests, addPurchaseRequest } = useERP();
  const { currentUser } = useAuth();

  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('WAR-01');
  const [requestedQty, setRequestedQty] = useState<number>(10);
  const [priority, setPriority] = useState<PurchaseRequestPriority>('MEDIA');
  const [reason, setReason] = useState<string>('STOCK_MINIMO');
  const [observations, setObservations] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [ignoreDuplicateWarning, setIgnoreDuplicateWarning] = useState<boolean>(false);

  // Initialize or reset when opened or preselected product changes
  useEffect(() => {
    if (isOpen) {
      if (preselectedProduct) {
        setSelectedProductId(preselectedProduct.id);
      } else if (products.length > 0 && !selectedProductId) {
        setSelectedProductId(products[0].id);
      }
      if (warehouses.length > 0 && !selectedWarehouseId) {
        setSelectedWarehouseId(warehouses[0].id);
      }
      setRequestedQty(10);
      setPriority('MEDIA');
      setReason('STOCK_MINIMO');
      setObservations('');
      setErrorMessage(null);
      setSuccessMessage(null);
      setIgnoreDuplicateWarning(false);
    }
  }, [isOpen, preselectedProduct, products, warehouses]);

  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  const selectedWarehouse = useMemo(() => {
    return warehouses.find((w) => w.id === selectedWarehouseId) || warehouses[0] || null;
  }, [warehouses, selectedWarehouseId]);

  // DUPLICATE CHECK: Verify if there is already an active pending request for this SKU & warehouse
  const existingActiveRequest = useMemo(() => {
    if (!selectedProduct) return null;
    const targetSku = selectedProduct.sku || selectedProduct.code;
    return purchaseRequests.find((pr) => {
      const isSameSku =
        pr.sku === targetSku ||
        pr.items?.some((i) => i.product_code === targetSku || i.product_id === selectedProduct.id);
      const isSameWarehouse =
        (pr.warehouse_id === selectedWarehouseId || pr.warehouseId === selectedWarehouseId);
      const isActive =
        pr.status === 'PENDIENTE' ||
        pr.status === 'PENDIENTE_APROBACION' ||
        pr.status === 'EN_COTIZACION' ||
        pr.status === 'EN_REVISION' ||
        pr.status === 'APROBADA';
      return isSameSku && isSameWarehouse && isActive;
    });
  }, [purchaseRequests, selectedProduct, selectedWarehouseId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedProduct) {
      setErrorMessage('Por favor selecciona un producto válido.');
      return;
    }

    if (!requestedQty || requestedQty <= 0) {
      setErrorMessage('La cantidad solicitada debe ser un número entero mayor a 0.');
      return;
    }

    if (existingActiveRequest && !ignoreDuplicateWarning) {
      setErrorMessage(
        `Aviso de Duplicidad: Ya existe una solicitud activa (${existingActiveRequest.request_number}) para este SKU en el almacén seleccionado. Marca la casilla de confirmación si deseas registrar una solicitud adicional.`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || '';
      const payload = {
        sku: selectedProduct.sku || selectedProduct.code,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        warehouseId: selectedWarehouseId,
        warehouseName: selectedWarehouse?.name || 'Almacén Central Tlalnepantla',
        requestedQty: Number(requestedQty),
        priority,
        reason,
        observations: observations.trim(),
        allowDuplicate: ignoreDuplicateWarning,
      };

      const res = await fetch('/api/purchase-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setErrorMessage(data.error || 'Ya existe una solicitud activa para este producto.');
          setIsSubmitting(false);
          return;
        }
        throw new Error(data.error || 'Error al registrar solicitud de compra');
      }

      const generatedFolio = data.request?.request_number || 'SC-NUEVA';

      // Update local ERP context state
      if (data.request) {
        addPurchaseRequest(data.request);
      }

      setSuccessMessage(
        `Solicitud ${generatedFolio} enviada con éxito al departamento de Compras. En espera de cotización y emisión de OC.`
      );

      setTimeout(() => {
        if (onSuccess) {
          onSuccess(generatedFolio);
        }
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error de comunicación con el servidor');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 font-bold shadow-xs">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Solicitud de Reabastecimiento de Inventario
                <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-400/30">
                  Almacén
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Petición operativa de reabastecimiento por cantidad dirigida a Compras
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* SoD Protection Notice */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex items-start gap-2.5 text-xs text-slate-600">
          <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-800">Segregación de Funciones (SoD) Activa: </span>
            Como personal operativo de Almacén, este formulario captura estrictamente requerimientos físicos de material.
            El departamento de Compras cotizará con proveedores autorizados, determinará precios y emitirá la Orden de Compra oficial.
          </div>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Banner */}
          {errorMessage && (
            <div className="flex items-start gap-2.5 rounded-xl bg-red-50 p-3.5 text-xs text-red-800 border border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 p-3.5 text-xs text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <div className="font-semibold">{successMessage}</div>
            </div>
          )}

          {/* Duplicate Active Request Warning */}
          {existingActiveRequest && (
            <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-3.5 text-xs text-amber-900 border border-amber-200">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1.5 flex-1">
                <div className="font-bold text-amber-950">
                  Solicitud Previa Detectada ({existingActiveRequest.request_number})
                </div>
                <p className="text-amber-800">
                  Ya existe una solicitud activa para este producto en{' '}
                  <span className="font-semibold">{selectedWarehouse?.name}</span> con estatus{' '}
                  <span className="font-bold underline">{existingActiveRequest.status}</span>.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="ignoreDup"
                    checked={ignoreDuplicateWarning}
                    onChange={(e) => setIgnoreDuplicateWarning(e.target.checked)}
                    className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                  />
                  <label htmlFor="ignoreDup" className="font-medium text-amber-900 cursor-pointer">
                    Entendido. Requiero registrar una partida adicional justificable.
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Product Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Producto / Material a Reabastecer *
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                setIgnoreDuplicateWarning(false);
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 focus:border-blue-600 focus:outline-hidden"
              required
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.sku || p.code}] - {p.name} (Stock físico: {p.stock} {p.unit || 'pzas'} | Mín: {p.minStock || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Product Quick Info Card */}
          {selectedProduct && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div>
                <span className="text-slate-500">SKU / Clave:</span>{' '}
                <span className="font-mono font-bold text-slate-800">{selectedProduct.sku || selectedProduct.code}</span>
              </div>
              <div>
                <span className="text-slate-500">Existencia Actual:</span>{' '}
                <span
                  className={`font-bold ${
                    selectedProduct.stock <= (selectedProduct.minStock || 0)
                      ? 'text-red-600'
                      : 'text-emerald-700'
                  }`}
                >
                  {selectedProduct.stock} {selectedProduct.unit || 'PZA'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Nivel Mínimo:</span>{' '}
                <span className="font-semibold text-slate-700">{selectedProduct.minStock || 0} {selectedProduct.unit || 'PZA'}</span>
              </div>
              <div>
                <span className="text-slate-500">Categoría:</span>{' '}
                <span className="font-semibold text-slate-700">{selectedProduct.category || 'Aislamientos'}</span>
              </div>
            </div>
          )}

          {/* Quantity & Destination Warehouse */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cantidad Requerida (Física) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={requestedQty}
                  onChange={(e) => setRequestedQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-900 focus:border-blue-600 focus:outline-hidden"
                  required
                />
                <span className="absolute right-3.5 top-2 text-xs text-slate-400 font-semibold">
                  {selectedProduct?.unit || 'PZA'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Almacén Destino *
              </label>
              <select
                value={selectedWarehouseId}
                onChange={(e) => {
                  setSelectedWarehouseId(e.target.value);
                  setIgnoreDuplicateWarning(false);
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 focus:border-blue-600 focus:outline-hidden"
                required
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority & Reason */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Prioridad Operativa *
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PurchaseRequestPriority)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 focus:border-blue-600 focus:outline-hidden"
                required
              >
                <option value="BAJA">Baja - Planificación estándar</option>
                <option value="MEDIA">Media - Consumo habitual</option>
                <option value="ALTA">Alta - Stock en punto crítico</option>
                <option value="URGENTE">Urgente - Quiebre de stock inminente / Pedido detenido</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Motivo / Justificación *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 focus:border-blue-600 focus:outline-hidden"
                required
              >
                <option value="STOCK_MINIMO">Stock por debajo del mínimo de seguridad</option>
                <option value="FALTANTE_PEDIDO">Faltante para pedido de cliente en proceso</option>
                <option value="PROXIMO_AGOTARSE">Alta rotación / Próximo a agotarse</option>
                <option value="PROYECTO_ESPECIAL">Proyecto especial de instalación</option>
                <option value="OTRO">Otro requerimiento operativo</option>
              </select>
            </div>
          </div>

          {/* Observations */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Observaciones y Detalles Físicos para Compras
            </label>
            <textarea
              rows={3}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Ejemplo: Se detectó merma en tarima N1-R04 o material comprometido para pedido de obra. Se solicita abastecimiento para la semana entrante."
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-normal text-slate-800 focus:border-blue-600 focus:outline-hidden"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (!!existingActiveRequest && !ignoreDuplicateWarning)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  <span>Registrando...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Enviar Solicitud a Compras</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
