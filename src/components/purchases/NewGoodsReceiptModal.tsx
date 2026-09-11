import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { GoodsReceiptItemQuality } from '../../types/erp';
import { X, PackageCheck, AlertCircle, CheckCircle2, XCircle, Clock, MapPin, Truck } from 'lucide-react';

interface NewGoodsReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrderId?: string;
}

export const NewGoodsReceiptModal: React.FC<NewGoodsReceiptModalProps> = ({
  isOpen,
  onClose,
  purchaseOrderId,
}) => {
  const { purchaseOrders, warehouses, products, createGoodsReceipt } = useERP();
  const { currentUser } = useAuth();

  // Eligible POs for receipt (SENT, CONFIRMED, PARTIAL_RECEIVED)
  const openOrders = purchaseOrders.filter((po) =>
    ['SENT', 'CONFIRMED', 'PARTIAL_RECEIVED', 'APPROVED'].includes(po.status)
  );

  const [selectedPoId, setSelectedPoId] = useState(
    purchaseOrderId || openOrders[0]?.id || ''
  );

  const po = purchaseOrders.find((p) => p.id === selectedPoId);

  const [supplierDocument, setSupplierDocument] = useState('');
  const [supplierCarrier, setSupplierCarrier] = useState('');
  const [carrierName, setCarrierName] = useState('');
  const [driverName, setDriverName] = useState('');
  const [vehiclePlates, setVehiclePlates] = useState('');
  const [notes, setNotes] = useState('');

  const [receiptItems, setReceiptItems] = useState<
    Array<{
      purchase_order_item_id: string;
      product_id: string;
      product_code: string;
      product_name: string;
      unit: string;
      quantity_ordered: number;
      quantity_previously_received: number;
      quantity_pending: number;
      quantity_received: number;
      quantity_accepted: number;
      quantity_rejected: number;
      quality_status: GoodsReceiptItemQuality;
      rejection_reason: string;
      unit_price: number;
      destination_location: string;
    }>
  >([]);

  // Update receipt items whenever selected PO changes
  React.useEffect(() => {
    if (po) {
      const items = po.items.map((it) => {
        const prod = products.find((p) => p.id === it.product_id);
        const previouslyReceived = it.quantity_received || 0;
        const pending = Math.max(0, it.quantity_ordered - previouslyReceived);
        const defaultLoc = (typeof prod?.warehouseLocation === 'string' ? prod.warehouseLocation : prod?.warehouseLocation?.locationCode) || '';

        return {
          purchase_order_item_id: it.id,
          product_id: it.product_id,
          product_code: it.product_code,
          product_name: it.product_name,
          unit: it.unit,
          quantity_ordered: it.quantity_ordered,
          quantity_previously_received: previouslyReceived,
          quantity_pending: pending,
          quantity_received: pending, // default full pending receipt
          quantity_accepted: pending,
          quantity_rejected: 0,
          quality_status: 'ACEPTADA' as GoodsReceiptItemQuality,
          rejection_reason: '',
          unit_price: it.unit_cost,
          destination_location: defaultLoc,
        };
      });
      setReceiptItems(items);
    }
  }, [po, products]);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleItemFieldChange = (
    index: number,
    field: string,
    value: any
  ) => {
    const newItems = [...receiptItems];
    const item = { ...newItems[index], [field]: value };

    if (field === 'quantity_received') {
      const rec = Math.max(0, parseFloat(value) || 0);
      item.quantity_received = rec;
      item.quantity_accepted = Math.max(0, rec - item.quantity_rejected);
    } else if (field === 'quantity_rejected') {
      const rej = Math.max(0, parseFloat(value) || 0);
      item.quantity_rejected = rej;
      item.quantity_accepted = Math.max(0, item.quantity_received - rej);
      if (rej > 0 && item.quality_status === 'ACEPTADA') {
        item.quality_status = 'RECHAZADA';
      }
    }

    newItems[index] = item;
    setReceiptItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!po) {
      setError('Selecciona una orden de compra válida para recibir.');
      return;
    }

    if (!supplierDocument.trim()) {
      setError('Ingresa el número de remisión o factura del proveedor.');
      return;
    }

    const hasAnyQuantity = receiptItems.some((it) => it.quantity_received > 0);
    if (!hasAnyQuantity) {
      setError('Debes ingresar al menos una cantidad recibida mayor a cero.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await createGoodsReceipt({
        purchase_order_id: po.id,
        supplier_document: supplierDocument.trim(),
        supplier_remission_invoice_number: supplierDocument.trim(),
        supplier_carrier: supplierCarrier || carrierName || 'Flete Propio / Proveedor',
        carrier_name: carrierName,
        driver_name: driverName,
        vehicle_plates: vehiclePlates,
        notes: notes.trim(),
        quality_inspection_status: receiptItems.some((it) => it.quantity_rejected > 0)
          ? 'PARCIAL'
          : 'ACEPTADO',
        items: receiptItems
          .filter((it) => it.quantity_received > 0)
          .map((it) => ({
            purchase_order_item_id: it.purchase_order_item_id,
            product_id: it.product_id,
            product_code: it.product_code,
            product_name: it.product_name,
            unit: it.unit,
            quantity_ordered: it.quantity_ordered,
            quantity_previously_received: it.quantity_previously_received,
            quantity_received: it.quantity_received,
            quantity_accepted: it.quantity_accepted,
            quantity_rejected: it.quantity_rejected,
            quality_status: it.quality_status,
            rejection_reason: it.rejection_reason,
            unit_price: it.unit_price,
            destination_location: it.destination_location,
            warehouse_location: it.destination_location,
          })),
      });

      if (res.success) {
        onClose();
      } else {
        setError(res.error || 'No se pudo procesar la recepción de mercancía.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error inesperado al recibir mercancía.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <PackageCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Recepción Física en Almacén</h2>
              <p className="text-xs text-slate-500">
                Inspección de calidad, registro en andén y entrada de stock al Kardex
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Top selection bar */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Orden de Compra a Recibir *
              </label>
              <select
                value={selectedPoId}
                onChange={(e) => setSelectedPoId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                required
              >
                {openOrders.length === 0 && (
                  <option value="">No hay órdenes de compra pendientes</option>
                )}
                {openOrders.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.purchase_order_number} - {p.supplier_name} (${(Number(p.total) || 0).toLocaleString()} MXN)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Factura / Remisión / Guía Proveedor *
              </label>
              <input
                type="text"
                value={supplierDocument}
                onChange={(e) => setSupplierDocument(e.target.value)}
                placeholder="Ej. FAC-98432 / REM-4412"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Línea de Transporte / Chofer
              </label>
              <input
                type="text"
                value={carrierName}
                onChange={(e) => setCarrierName(e.target.value)}
                placeholder="Ej. Castores / Juan Pérez"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {po && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-950">Proveedor:</span>
                <span className="font-medium text-emerald-900">{po.supplier_name}</span>
                <span className="text-emerald-400">•</span>
                <span className="font-bold text-emerald-950">Almacén Destino:</span>
                <span className="font-medium text-emerald-900">{po.warehouse_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-950">Fecha de Promesa:</span>
                <span className="font-medium text-emerald-900">{po.expected_date || po.order_date}</span>
                <span className="text-emerald-400">•</span>
                <span className="font-bold text-emerald-950">Estatus Actual:</span>
                <span className="rounded-md bg-emerald-200 px-2 py-0.5 font-bold text-emerald-900">
                  {po.status}
                </span>
              </div>
            </div>
          )}

          {/* Items Receipt Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Inspección por Partida & Ubicación en Almacén ({receiptItems.length})
              </h3>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5">Producto</th>
                    <th className="px-3 py-2.5 w-16 text-right">Ordenado</th>
                    <th className="px-3 py-2.5 w-16 text-right">Pend.</th>
                    <th className="px-3 py-2.5 w-24 text-right">Recibido</th>
                    <th className="px-3 py-2.5 w-24 text-right">Aceptado</th>
                    <th className="px-3 py-2.5 w-20 text-right">Rechazado</th>
                    <th className="px-3 py-2.5 w-32">Calidad</th>
                    <th className="px-3 py-2.5 w-48">Ubicación Asignada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {receiptItems.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="px-3 py-2">
                        <div className="font-bold text-slate-900">[{it.product_code}] {it.product_name}</div>
                        <div className="text-[11px] text-slate-400">U.M.: {it.unit}</div>
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-slate-500">
                        {it.quantity_ordered}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-amber-700">
                        {it.quantity_pending}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          max={it.quantity_pending * 1.5}
                          step="any"
                          value={it.quantity_received}
                          onChange={(e) =>
                            handleItemFieldChange(idx, 'quantity_received', e.target.value)
                          }
                          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-right font-bold text-emerald-800 focus:border-emerald-500 focus:outline-hidden"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={it.quantity_accepted}
                          onChange={(e) =>
                            handleItemFieldChange(idx, 'quantity_accepted', e.target.value)
                          }
                          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-right font-bold text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={it.quantity_rejected}
                          onChange={(e) =>
                            handleItemFieldChange(idx, 'quantity_rejected', e.target.value)
                          }
                          className="w-full rounded-md border border-red-200 bg-red-50/50 px-2 py-1.5 text-xs text-right font-bold text-red-700 focus:border-red-500 focus:outline-hidden"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={it.quality_status}
                          onChange={(e) =>
                            handleItemFieldChange(idx, 'quality_status', e.target.value)
                          }
                          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                        >
                          <option value="ACEPTADA">Aceptada (100% OK)</option>
                          <option value="RECHAZADA">Rechazada (Defecto)</option>
                          <option value="EN_REVISION">En Cuarentena / Revisión</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <input
                            type="text"
                            value={it.destination_location}
                            onChange={(e) =>
                              handleItemFieldChange(idx, 'destination_location', e.target.value)
                            }
                            placeholder="N1 / R-01 / P-01..."
                            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs font-mono text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Observaciones de Inspección y Calidad
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Estado de los empaques, sello de origen, estibas..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-4">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Truck className="h-4 w-4 text-emerald-600" />
              Recibe: <b>{currentUser?.name || 'Almacenista'}</b> ({currentUser?.role || 'ALMACEN'})
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !po}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {isSubmitting ? 'Registrando...' : 'Confirmar Recepción & Afectar Inventario'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
