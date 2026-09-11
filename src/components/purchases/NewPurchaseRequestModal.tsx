import React, { useState, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { PurchaseRequestItem } from '../../types/erp';
import { X, Plus, Trash2, ShoppingBag, AlertCircle, Sparkles } from 'lucide-react';

interface NewPurchaseRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialItems?: Array<{ productId: string; quantity: number; suggestedSupplierId?: string; reason?: string }>;
}

export const NewPurchaseRequestModal: React.FC<NewPurchaseRequestModalProps> = ({
  isOpen,
  onClose,
  initialItems,
}) => {
  const { products, warehouses, suppliers, supplierProducts, createPurchaseRequest } = useERP();
  const { currentUser } = useAuth();

  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || '');
  const [priority, setPriority] = useState<'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE'>('MEDIA');
  const [requiredDate, setRequiredDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [justification, setJustification] = useState('');
  const [items, setItems] = useState<
    Array<{
      product_id: string;
      product_code: string;
      product_name: string;
      unit: string;
      quantity: number;
      estimated_unit_cost: number;
      estimated_total: number;
      notes: string;
      suggested_supplier_id?: string;
      suggested_supplier_name?: string;
    }>
  >([]);

  useEffect(() => {
    if (!warehouseId && warehouses.length > 0) {
      setWarehouseId(warehouses[0].id);
    }
  }, [warehouses, warehouseId]);

  useEffect(() => {
    if (!isOpen) return;

    if (initialItems && initialItems.length > 0) {
      const mapped = initialItems.map((init) => {
        const prod = products.find((p) => p.id === init.productId);
        const suppProd = supplierProducts.find((sp) => sp.product_id === init.productId);
        const supp = suppliers.find((s) => s.id === (init.suggestedSupplierId || suppProd?.supplier_id));
        const cost = suppProd?.cost || prod?.cost_price || 100;
        return {
          product_id: prod?.id || init.productId,
          product_code: prod?.code || 'ITEM',
          product_name: prod?.name || 'Producto Solicitado',
          unit: prod?.unit || 'PZA',
          quantity: init.quantity || 1,
          estimated_unit_cost: cost,
          estimated_total: (init.quantity || 1) * cost,
          notes: init.reason || 'Reabastecimiento sugerido por análisis',
          suggested_supplier_id: supp?.id,
          suggested_supplier_name: supp?.name,
        };
      });
      setItems(mapped);
    } else if (items.length === 0) {
      const defaultProd = products[0];
      setItems([
        {
          product_id: defaultProd?.id || '',
          product_code: defaultProd?.code || '',
          product_name: defaultProd?.name || '',
          unit: defaultProd?.unit || 'PZA',
          quantity: 10,
          estimated_unit_cost: defaultProd?.cost_price || 0,
          estimated_total: (defaultProd?.cost_price || 0) * 10,
          notes: '',
        },
      ]);
    }
  }, [isOpen, initialItems, products, supplierProducts, suppliers]);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleProductChange = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const suppProd = supplierProducts.find((sp) => sp.product_id === productId);
    const supp = suppliers.find((s) => s.id === suppProd?.supplier_id);
    const cost = suppProd?.cost || prod.cost_price || 0;

    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      product_id: prod.id,
      product_code: prod.code,
      product_name: prod.name,
      unit: prod.unit,
      estimated_unit_cost: cost,
      estimated_total: cost * newItems[index].quantity,
      suggested_supplier_id: supp?.id,
      suggested_supplier_name: supp?.name,
    };
    setItems(newItems);
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const newItems = [...items];
    const validQty = Math.max(0.01, qty);
    newItems[index] = {
      ...newItems[index],
      quantity: validQty,
      estimated_total: validQty * newItems[index].estimated_unit_cost,
    };
    setItems(newItems);
  };

  const handleCostChange = (index: number, cost: number) => {
    const newItems = [...items];
    const validCost = Math.max(0, cost);
    newItems[index] = {
      ...newItems[index],
      estimated_unit_cost: validCost,
      estimated_total: newItems[index].quantity * validCost,
    };
    setItems(newItems);
  };

  const handleNotesChange = (index: number, notes: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], notes };
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
        estimated_unit_cost: defaultProd?.cost_price || 0,
        estimated_total: defaultProd?.cost_price || 0,
        notes: '',
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) {
      setError('La solicitud debe contener al menos un producto.');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((sum, item) => sum + item.estimated_total, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!warehouseId) {
      setError('Selecciona el almacén destino.');
      return;
    }

    if (items.some((it) => !it.product_id || it.quantity <= 0)) {
      setError('Verifica que todos los productos y cantidades sean válidos.');
      return;
    }

    try {
      setIsSubmitting(true);
      const wh = warehouses.find((w) => w.id === warehouseId);
      const res = await createPurchaseRequest({
        warehouse_id: warehouseId,
        warehouse_name: wh?.name || 'Almacén Central',
        priority,
        required_date: requiredDate,
        justification: justification.trim() || 'Solicitud de reposición operativa',
        notes: justification.trim(),
        items: items.map((it) => ({
          product_id: it.product_id,
          product_code: it.product_code,
          product_name: it.product_name,
          unit: it.unit,
          quantity: Number(it.quantity) || 1,
          estimated_price: Number(it.estimated_unit_cost) || 0,
          estimated_unit_cost: Number(it.estimated_unit_cost) || 0,
          total_estimated: Number(it.estimated_total) || 0,
          estimated_total: Number(it.estimated_total) || 0,
          notes: it.notes,
          suggested_supplier_id: it.suggested_supplier_id,
          suggested_supplier_name: it.suggested_supplier_name,
        })) as PurchaseRequestItem[],
      });

      if (res && (res.success || (res as any).id || (res as any).request_number)) {
        onClose();
      } else {
        setError(res?.error || 'No se pudo crear la solicitud de compra.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error inesperado al crear solicitud.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Nueva Solicitud de Compra</h2>
              <p className="text-xs text-slate-500">
                Registra la necesidad de abastecimiento para evaluación y aprobación
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
          {/* General info */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Almacén Destino *
              </label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
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
                Prioridad *
              </label>
              <select
                value={priority}
                onChange={(e: any) => setPriority(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                <option value="BAJA">Baja</option>
                <option value="MEDIA">Media</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">Urgente (Reabastecimiento crítico)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Fecha Requerida en Almacén *
              </label>
              <input
                type="date"
                value={requiredDate}
                onChange={(e) => setRequiredDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Justificación de Compra / Orden de Trabajo / Referencia
            </label>
            <input
              type="text"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Ej. Resurtido de aislante térmico para proyecto industrial..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Partidas Solicitadas ({items.length})
              </h3>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar Partida
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5">Producto</th>
                    <th className="px-3 py-2.5 w-24">Cantidad</th>
                    <th className="px-3 py-2.5 w-20">U.M.</th>
                    <th className="px-3 py-2.5 w-32">Costo Est. Unit.</th>
                    <th className="px-3 py-2.5 w-32 text-right">Total Est.</th>
                    <th className="px-3 py-2.5">Proveedor Sugerido</th>
                    <th className="px-2 py-2.5 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="px-3 py-2">
                        <select
                          value={item.product_id}
                          onChange={(e) => handleProductChange(idx, e.target.value)}
                          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 font-medium focus:border-blue-500 focus:outline-hidden"
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
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(idx, parseFloat(e.target.value) || 0)}
                          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-right font-bold text-slate-900 focus:border-blue-500 focus:outline-hidden"
                        />
                      </td>
                      <td className="px-3 py-2 font-medium text-slate-500">{item.unit}</td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.estimated_unit_cost}
                          onChange={(e) => handleCostChange(idx, parseFloat(e.target.value) || 0)}
                          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-right font-medium text-slate-900 focus:border-blue-500 focus:outline-hidden"
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-slate-900">
                        ${(Number(item.estimated_total) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-2 text-slate-600 text-[11px] truncate max-w-[150px]">
                        {item.suggested_supplier_name || 'Sin asignar'}
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="text-slate-400 hover:text-red-600 transition"
                          title="Eliminar partida"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total summary */}
            <div className="mt-3 flex justify-end items-center gap-4 text-sm bg-slate-50 rounded-xl p-3 border border-slate-200">
              <span className="text-slate-600 font-medium">Estimado Total de la Solicitud:</span>
              <span className="text-lg font-black text-slate-900">
                ${(Number(totalAmount) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
              </span>
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-4">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-blue-600" />
              Solicitado por: <b>{currentUser?.name || 'Usuario'}</b> ({currentUser?.role || 'COMPRAS'})
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
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isSubmitting ? 'Guardando...' : 'Crear Solicitud de Compra'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
