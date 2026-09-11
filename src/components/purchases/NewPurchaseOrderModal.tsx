import React, { useState, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { PurchaseOrderItem } from '../../types/erp';
import { X, Plus, Trash2, FileText, AlertCircle, DollarSign, Truck, ShieldCheck } from 'lucide-react';

interface NewPurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  fromRequestId?: string;
  prefilledPurchaseRequestId?: string;
  prefilledSupplierId?: string;
}

export const NewPurchaseOrderModal: React.FC<NewPurchaseOrderModalProps> = ({
  isOpen,
  onClose,
  fromRequestId,
  prefilledPurchaseRequestId,
  prefilledSupplierId,
}) => {
  const {
    suppliers,
    warehouses,
    products,
    supplierProducts,
    purchaseRequests,
    createPurchaseOrder,
  } = useERP();
  const { currentUser } = useAuth();

  const effectiveRequestId = fromRequestId || prefilledPurchaseRequestId;
  const selectedRequest = effectiveRequestId
    ? purchaseRequests.find((pr) => pr.id === effectiveRequestId)
    : null;

  const [supplierId, setSupplierId] = useState(() => {
    if (prefilledSupplierId) return prefilledSupplierId;
    if (selectedRequest?.items?.[0]?.suggested_supplier_id) {
      return selectedRequest.items[0].suggested_supplier_id;
    }
    return suppliers[0]?.id || '';
  });

  const [warehouseId, setWarehouseId] = useState(
    selectedRequest?.warehouse_id || (selectedRequest as any)?.warehouseId || warehouses[0]?.id || ''
  );
  const [expectedDate, setExpectedDate] = useState(
    selectedRequest?.required_date ||
      new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0]
  );
  const [paymentTerms, setPaymentTerms] = useState(
    suppliers.find((s) => s.id === supplierId)?.payment_terms || 'Crédito 30 días'
  );
  const [currency, setCurrency] = useState('MXN');
  const [notes, setNotes] = useState(
    selectedRequest ? `Originada de Solicitud ${selectedRequest.request_number}` : ''
  );

  // Landed Cost inputs
  const [freightCost, setFreightCost] = useState<number>(0);
  const [insuranceCost, setInsuranceCost] = useState<number>(0);
  const [customsCost, setCustomsCost] = useState<number>(0);
  const [otherCosts, setOtherCosts] = useState<number>(0);

  const [items, setItems] = useState<
    Array<{
      product_id: string;
      product_code: string;
      product_name: string;
      unit: string;
      quantity_ordered: number;
      unit_cost: number;
      discount_percentage: number;
      tax_percentage: number;
      subtotal: number;
      tax: number;
      total: number;
      notes: string;
    }>
  >(() => {
    if (selectedRequest && selectedRequest.items && selectedRequest.items.length > 0) {
      return selectedRequest.items.map((it) => {
        const prod = products.find((p) => p.id === it.product_id || p.code === it.product_code);
        const suppProd = supplierProducts.find(
          (sp) => sp.supplier_id === supplierId && sp.product_id === it.product_id
        );
        const cost = suppProd?.cost || it.estimated_unit_cost || prod?.cost_price || 100;
        const qty = it.quantity || (selectedRequest as any).requestedQty || 1;
        const sub = qty * cost;
        const tax = sub * 0.16;
        return {
          product_id: it.product_id || prod?.id || '',
          product_code: it.product_code || (it as any).productCode || prod?.code || selectedRequest.sku || '',
          product_name: it.product_name || (it as any).productName || prod?.name || 'Material',
          unit: it.unit || prod?.unit || 'PZA',
          quantity_ordered: qty,
          unit_cost: cost,
          discount_percentage: 0,
          tax_percentage: 16,
          subtotal: sub,
          tax: tax,
          total: sub + tax,
          notes: it.notes || '',
        };
      });
    }

    const defaultProd = products[0];
    const defaultSuppProd = supplierProducts.find(
      (sp) => sp.supplier_id === supplierId && sp.product_id === defaultProd?.id
    );
    const cost = defaultSuppProd?.cost || defaultProd?.cost_price || 100;
    const sub = 10 * cost;
    const tax = sub * 0.16;
    return [
      {
        product_id: defaultProd?.id || '',
        product_code: defaultProd?.code || '',
        product_name: defaultProd?.name || '',
        unit: defaultProd?.unit || 'PZA',
        quantity_ordered: 10,
        unit_cost: cost,
        discount_percentage: 0,
        tax_percentage: 16,
        subtotal: sub,
        tax: tax,
        total: sub + tax,
        notes: '',
      },
    ];
  });

  // Re-synchronize state whenever modal opens or props change
  useEffect(() => {
    if (!isOpen) return;

    if (prefilledSupplierId) {
      setSupplierId(prefilledSupplierId);
      const supp = suppliers.find((s) => s.id === prefilledSupplierId);
      if (supp?.payment_terms) setPaymentTerms(supp.payment_terms);
    } else if (selectedRequest?.items?.[0]?.suggested_supplier_id) {
      setSupplierId(selectedRequest.items[0].suggested_supplier_id);
    }

    if (selectedRequest) {
      if (selectedRequest.warehouse_id || (selectedRequest as any).warehouseId) {
        setWarehouseId(selectedRequest.warehouse_id || (selectedRequest as any).warehouseId || warehouses[0]?.id || '');
      }
      if (selectedRequest.required_date) {
        setExpectedDate(selectedRequest.required_date);
      }
      setNotes(`Originada de Solicitud ${selectedRequest.request_number}`);

      if (selectedRequest.items && selectedRequest.items.length > 0) {
        setItems(
          selectedRequest.items.map((it) => {
            const prod = products.find((p) => p.id === it.product_id || p.code === it.product_code);
            const cost = it.estimated_unit_cost && it.estimated_unit_cost > 0
              ? it.estimated_unit_cost
              : prod?.cost_price || 100;
            const qty = it.quantity || (selectedRequest as any).requestedQty || 1;
            const sub = qty * cost;
            const tax = sub * 0.16;
            return {
              product_id: it.product_id || prod?.id || '',
              product_code: it.product_code || (it as any).productCode || prod?.code || selectedRequest.sku || '',
              product_name: it.product_name || (it as any).productName || prod?.name || 'Material',
              unit: it.unit || prod?.unit || 'PZA',
              quantity_ordered: qty,
              unit_cost: cost,
              discount_percentage: 0,
              tax_percentage: 16,
              subtotal: sub,
              tax: tax,
              total: sub + tax,
              notes: it.notes || '',
            };
          })
        );
      }
    }
  }, [isOpen, effectiveRequestId, prefilledSupplierId]);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSupplierChange = (newSuppId: string) => {
    setSupplierId(newSuppId);
    const supp = suppliers.find((s) => s.id === newSuppId);
    if (supp?.payment_terms) {
      setPaymentTerms(supp.payment_terms);
    }
    // Update product costs from new supplier price catalog if available
    const updated = items.map((it) => {
      const sp = supplierProducts.find(
        (p) => p.supplier_id === newSuppId && p.product_id === it.product_id
      );
      const cost = sp?.cost ?? it.unit_cost;
      const sub = it.quantity_ordered * cost * (1 - it.discount_percentage / 100);
      const tax = sub * (it.tax_percentage / 100);
      return {
        ...it,
        unit_cost: cost,
        subtotal: sub,
        tax,
        total: sub + tax,
      };
    });
    setItems(updated);
  };

  const handleProductChange = (index: number, prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;
    const sp = supplierProducts.find(
      (p) => p.supplier_id === supplierId && p.product_id === prodId
    );
    const cost = sp?.cost || prod.cost_price || 0;
    const newItems = [...items];
    const qty = newItems[index].quantity_ordered;
    const disc = newItems[index].discount_percentage;
    const taxRate = newItems[index].tax_percentage;
    const sub = qty * cost * (1 - disc / 100);
    const tax = sub * (taxRate / 100);

    newItems[index] = {
      ...newItems[index],
      product_id: prod.id,
      product_code: prod.code,
      product_name: prod.name,
      unit: prod.unit,
      unit_cost: cost,
      subtotal: sub,
      tax: tax,
      total: sub + tax,
    };
    setItems(newItems);
  };

  const handleItemFieldChange = (
    index: number,
    field: 'quantity_ordered' | 'unit_cost' | 'discount_percentage' | 'tax_percentage',
    val: number
  ) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: Math.max(0, val) };
    const sub = item.quantity_ordered * item.unit_cost * (1 - item.discount_percentage / 100);
    const tax = sub * (item.tax_percentage / 100);
    item.subtotal = sub;
    item.tax = tax;
    item.total = sub + tax;
    newItems[index] = item;
    setItems(newItems);
  };

  const addItem = () => {
    const defaultProd = products[0];
    const sp = supplierProducts.find(
      (p) => p.supplier_id === supplierId && p.product_id === defaultProd?.id
    );
    const cost = sp?.cost || defaultProd?.cost_price || 0;
    const sub = cost;
    const tax = sub * 0.16;
    setItems([
      ...items,
      {
        product_id: defaultProd?.id || '',
        product_code: defaultProd?.code || '',
        product_name: defaultProd?.name || '',
        unit: defaultProd?.unit || 'PZA',
        quantity_ordered: 1,
        unit_cost: cost,
        discount_percentage: 0,
        tax_percentage: 16,
        subtotal: sub,
        tax: tax,
        total: sub + tax,
        notes: '',
      },
    ]);
  };

  const removeItem = (idx: number) => {
    if (items.length <= 1) {
      setError('La orden debe incluir al menos una partida.');
      return;
    }
    setItems(items.filter((_, i) => i !== idx));
  };

  const subtotal = items.reduce((sum, it) => sum + it.subtotal, 0);
  const taxTotal = items.reduce((sum, it) => sum + it.tax, 0);
  const total = subtotal + taxTotal;
  const landedCostTotal = total + freightCost + insuranceCost + customsCost + otherCosts;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!supplierId) {
      setError('Selecciona el proveedor.');
      return;
    }
    if (!warehouseId) {
      setError('Selecciona el almacén destino.');
      return;
    }
    if (items.some((it) => !it.product_id || it.quantity_ordered <= 0 || it.unit_cost <= 0)) {
      setError('Verifica que todos los productos, cantidades y costos sean mayores a cero.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await createPurchaseOrder({
        supplier_id: supplierId,
        warehouse_id: warehouseId,
        purchase_request_id: selectedRequest?.id || effectiveRequestId,
        expected_date: expectedDate,
        payment_terms: paymentTerms,
        currency,
        notes,
        freight_cost: freightCost,
        insurance_cost: insuranceCost,
        customs_cost: customsCost,
        other_costs: otherCosts,
        items: items.map((it) => ({
          product_id: it.product_id,
          product_code: it.product_code,
          product_name: it.product_name,
          unit: it.unit,
          quantity_ordered: it.quantity_ordered,
          quantity_received: 0,
          quantity_pending: it.quantity_ordered,
          unit_cost: it.unit_cost,
          discount_percentage: it.discount_percentage,
          tax_percentage: it.tax_percentage,
          subtotal: it.subtotal,
          tax: it.tax,
          total: it.total,
          notes: it.notes,
        })) as PurchaseOrderItem[],
      });

      if (res.success) {
        onClose();
      } else {
        setError(res.error || 'No se pudo generar la orden de compra.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error inesperado al generar orden de compra.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedSupplier = suppliers.find((s) => s.id === supplierId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {selectedRequest
                  ? `Convertir Solicitud ${selectedRequest.request_number} a Orden de Compra`
                  : 'Nueva Orden de Compra (PO)'}
              </h2>
              <p className="text-xs text-slate-500">
                Emisión de orden mercantil con cálculo de Landed Cost y condiciones comerciales
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
          {/* General Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Proveedor *
              </label>
              <select
                value={supplierId}
                onChange={(e) => handleSupplierChange(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                required
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code}) - RFC: {s.rfc || 'N/D'}
                  </option>
                ))}
              </select>
              {selectedSupplier && (
                <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                  <span>Rating: ⭐ {((selectedSupplier.rating ?? 5.0)).toFixed(1)}</span>
                  <span>•</span>
                  <span>Lead Time: {selectedSupplier.lead_time_days} días</span>
                  <span>•</span>
                  <span>Términos: {selectedSupplier.payment_terms}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Almacén Destino *
              </label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
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
                Fecha Promesa Entrega *
              </label>
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Condiciones de Pago
              </label>
              <input
                type="text"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="Ej. Crédito 30 días, Contado, 50% anticipo"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Moneda
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden"
              >
                <option value="MXN">MXN - Peso Mexicano</option>
                <option value="USD">USD - Dólar Estadounidense</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Notas / Instrucciones de Entrega
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Horario de recepción, rampa, factura..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Items Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Partidas de la Orden ({items.length})
              </h3>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition"
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
                    <th className="px-3 py-2.5 w-24 text-right">Cant.</th>
                    <th className="px-3 py-2.5 w-16">U.M.</th>
                    <th className="px-3 py-2.5 w-28 text-right">Costo Unit.</th>
                    <th className="px-3 py-2.5 w-20 text-right">% Desc.</th>
                    <th className="px-3 py-2.5 w-28 text-right">Subtotal</th>
                    <th className="px-3 py-2.5 w-28 text-right">Total IVA</th>
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
                          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-hidden"
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
                          value={it.quantity_ordered}
                          onChange={(e) =>
                            handleItemFieldChange(
                              idx,
                              'quantity_ordered',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-right font-bold text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                        />
                      </td>
                      <td className="px-3 py-2 font-medium text-slate-500">{it.unit}</td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          value={it.unit_cost}
                          onChange={(e) =>
                            handleItemFieldChange(idx, 'unit_cost', parseFloat(e.target.value) || 0)
                          }
                          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-right font-medium text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="any"
                          value={it.discount_percentage}
                          onChange={(e) =>
                            handleItemFieldChange(
                              idx,
                              'discount_percentage',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-right text-slate-700 focus:border-indigo-500 focus:outline-hidden"
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-slate-800">
                        ${(Number(it.subtotal) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-slate-900">
                        ${(Number(it.total) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
          </div>

          {/* Landed Cost (Costo puesto en almacén) & Totals Bar */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Landed Cost Inputs */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                <Truck className="h-4 w-4 text-indigo-600" />
                <span>Costos Adicionales de Importación / Flete (Landed Cost)</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-600">Flete / Transporte:</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={freightCost}
                    onChange={(e) => setFreightCost(parseFloat(e.target.value) || 0)}
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-right font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-slate-600">Seguro de Carga:</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={insuranceCost}
                    onChange={(e) => setInsuranceCost(parseFloat(e.target.value) || 0)}
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-right font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-slate-600">Gastos Aduanales / DTA:</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={customsCost}
                    onChange={(e) => setCustomsCost(parseFloat(e.target.value) || 0)}
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-right font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-slate-600">Otros Costos / Maniobras:</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={otherCosts}
                    onChange={(e) => setOtherCosts(parseFloat(e.target.value) || 0)}
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-right font-medium text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Totals Summary */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col justify-between space-y-2 text-xs">
              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Mercancía:</span>
                  <span className="font-semibold text-slate-800">
                    ${(Number(subtotal) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>IVA Trasladado (16%):</span>
                  <span className="font-semibold text-slate-800">
                    ${(Number(taxTotal) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-200 pt-1.5">
                  <span>Total Factura Proveedor:</span>
                  <span className="text-indigo-600 font-extrabold">
                    ${(Number(total) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-slate-700">Costo Puesto en Almacén (Landed Total):</span>
                  <p className="text-[10px] text-slate-500">Incluye fletes e impuestos prorrateables</p>
                </div>
                <span className="text-base font-black text-emerald-700">
                  ${(Number(landedCostTotal) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                </span>
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-4">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Comprador: <b>{currentUser?.name || 'Usuario'}</b> ({currentUser?.role || 'COMPRAS'})
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
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {isSubmitting ? 'Generando...' : 'Emitir Orden de Compra'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
