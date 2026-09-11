import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { SupplierReturnItem } from '../../types/erp';
import { X, Undo2, AlertCircle, Plus, Trash2, ShieldAlert } from 'lucide-react';

interface NewSupplierReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPoId?: string;
}

export const NewSupplierReturnModal: React.FC<NewSupplierReturnModalProps> = ({
  isOpen,
  onClose,
  initialPoId,
}) => {
  const { suppliers, warehouses, products, purchaseOrders, goodsReceipts, createSupplierReturn } =
    useERP();
  const { currentUser } = useAuth();

  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || '');
  const [purchaseOrderId, setPurchaseOrderId] = useState(initialPoId || '');
  const [reason, setReason] = useState('');
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<
    Array<{
      product_id: string;
      product_code: string;
      product_name: string;
      unit: string;
      quantity: number;
      unit_cost: number;
      total_amount: number;
      reason: string;
      condition: string;
      lot_number?: string;
    }>
  >([
    {
      product_id: products[0]?.id || '',
      product_code: products[0]?.code || '',
      product_name: products[0]?.name || '',
      unit: products[0]?.unit || 'PZA',
      quantity: 1,
      unit_cost: products[0]?.cost_price || 0,
      total_amount: products[0]?.cost_price || 0,
      reason: 'Mercancía dañada en transporte',
      condition: 'DEFECTUOSO',
    },
  ]);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleProductChange = (index: number, prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      product_id: prod.id,
      product_code: prod.code,
      product_name: prod.name,
      unit: prod.unit,
      unit_cost: prod.cost_price,
      total_amount: newItems[index].quantity * prod.cost_price,
    };
    setItems(newItems);
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const newItems = [...items];
    const validQty = Math.max(0.01, qty);
    newItems[index] = {
      ...newItems[index],
      quantity: validQty,
      total_amount: validQty * newItems[index].unit_cost,
    };
    setItems(newItems);
  };

  const handleCostChange = (index: number, cost: number) => {
    const newItems = [...items];
    const validCost = Math.max(0, cost);
    newItems[index] = {
      ...newItems[index],
      unit_cost: validCost,
      total_amount: newItems[index].quantity * validCost,
    };
    setItems(newItems);
  };

  const handleFieldChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addItem = () => {
    const defaultProd = products[0];
    setItems([
      ...items,
      {
        product_id: defaultProd?.id || '',
        product_code: defaultProd?.code || '',
        product_name: defaultProd?.name || '',
        unit: defaultProd?.unit || 'PZA',
        quantity: 1,
        unit_cost: defaultProd?.cost_price || 0,
        total_amount: defaultProd?.cost_price || 0,
        reason: 'Defecto de fabricación',
        condition: 'DEFECTUOSO',
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) {
      setError('La devolución debe incluir al menos un producto.');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((sum, it) => sum + it.total_amount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!supplierId) {
      setError('Selecciona el proveedor.');
      return;
    }
    if (!warehouseId) {
      setError('Selecciona el almacén de donde saldrá la mercancía devuelta.');
      return;
    }
    if (!reason.trim()) {
      setError('Ingresa el motivo general de la devolución.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await createSupplierReturn({
        supplierId,
        warehouseId,
        purchaseOrderId: purchaseOrderId || undefined,
        reasonSummary: reason.trim(),
        carrier: carrier.trim() || undefined,
        trackingNumber: trackingNumber.trim() || undefined,
        notes: notes.trim(),
        items: items.map((it) => ({
          productId: it.product_id,
          quantity: it.quantity,
          unitPrice: it.unit_cost,
          reason: it.reason || reason.trim(),
          lotNumber: it.lot_number,
          condition: it.condition,
        })),
      });

      if (res.success) {
        onClose();
      } else {
        setError(res.error || 'No se pudo crear la devolución.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error inesperado al generar devolución.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white shadow-xs">
              <Undo2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Nueva Devolución a Proveedor (RMA)</h2>
              <p className="text-xs text-slate-500">
                Retorno de mercancía defectuosa, no conforme o excedente con afectación de salida
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Proveedor *
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-hidden"
                required
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.supplier_number})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Almacén Origen del Retorno *
              </label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-hidden"
                required
              >
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Orden de Compra / Recepción (Opcional)
              </label>
              <select
                value={purchaseOrderId}
                onChange={(e) => setPurchaseOrderId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-hidden"
              >
                <option value="">Sin orden específica</option>
                {purchaseOrders.map((po) => (
                  <option key={po.id} value={po.id}>
                    {po.purchase_order_number} - {po.supplier_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Motivo General de Devolución *
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej. Espesor fuera de especificación técnica..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-hidden"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Paquetería / Guía
                </label>
                <input
                  type="text"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  placeholder="Transportes Tresguerras"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  No. Rastreo
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="TRK-884920"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Productos a Devolver ({items.length})
              </h3>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar Producto
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5">Producto</th>
                    <th className="px-3 py-2.5 w-24 text-right">Cant.</th>
                    <th className="px-3 py-2.5 w-16">U.M.</th>
                    <th className="px-3 py-2.5 w-28 text-right">Costo Unit.</th>
                    <th className="px-3 py-2.5 w-32">Condición</th>
                    <th className="px-3 py-2.5">Motivo de Partida</th>
                    <th className="px-3 py-2.5 w-28 text-right">Total</th>
                    <th className="px-2 py-2.5 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="px-3 py-2">
                        <select
                          value={it.product_id}
                          onChange={(e) => handleProductChange(idx, e.target.value)}
                          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-900 focus:border-red-500 focus:outline-hidden"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              [{p.code}] {p.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          value={it.quantity}
                          onChange={(e) => handleQuantityChange(idx, parseFloat(e.target.value) || 0)}
                          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-right font-bold text-red-800 focus:border-red-500 focus:outline-hidden"
                        />
                      </td>
                      <td className="px-3 py-2 font-medium text-slate-500">{it.unit}</td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={it.unit_cost}
                          onChange={(e) => handleCostChange(idx, parseFloat(e.target.value) || 0)}
                          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-right font-medium text-slate-900 focus:border-red-500 focus:outline-hidden"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={it.condition}
                          onChange={(e) => handleFieldChange(idx, 'condition', e.target.value)}
                          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800"
                        >
                          <option value="DEFECTUOSO">Defectuoso</option>
                          <option value="DANADO">Dañado en Flete</option>
                          <option value="NO_CORRESPONDE">No Corresponde a OC</option>
                          <option value="EXCEDENTE">Excedente sin Orden</option>
                          <option value="CADUCADO">Caducado / Vencido</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={it.reason}
                          onChange={(e) => handleFieldChange(idx, 'reason', e.target.value)}
                          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800"
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-slate-900">
                        ${(Number(it.total_amount) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="text-slate-400 hover:text-red-600 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex justify-end items-center gap-4 text-sm bg-red-50/50 rounded-xl p-3 border border-red-200">
              <span className="text-slate-700 font-medium">Valor Total del Reclamo / Devolución:</span>
              <span className="text-lg font-black text-red-700">
                ${(Number(totalAmount) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
              </span>
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-4">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-red-600" />
              Solicitante: <b>{currentUser?.name || 'Usuario'}</b>
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
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-red-700 transition disabled:opacity-50"
              >
                {isSubmitting ? 'Registrando...' : 'Registrar Devolución a Proveedor'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
