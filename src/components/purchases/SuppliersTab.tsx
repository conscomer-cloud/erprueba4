import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Supplier, SupplierProduct } from '../../types/erp';
import {
  Search,
  Plus,
  Building2,
  Phone,
  Mail,
  MapPin,
  Star,
  Clock,
  DollarSign,
  Package,
  Award,
  Edit2,
  TrendingUp,
  CreditCard,
  CheckCircle,
} from 'lucide-react';

interface SuppliersTabProps {
  onNewSupplier: () => void;
  onEditSupplier: (supplier: Supplier) => void;
  onNewOrderForSupplier: (supplierId: string) => void;
}

export const SuppliersTab: React.FC<SuppliersTabProps> = ({
  onNewSupplier,
  onEditSupplier,
  onNewOrderForSupplier,
}) => {
  const { suppliers, supplierProducts, supplierContacts, products, purchaseOrders } = useERP();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('TODAS');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const categories = ['TODAS', ...Array.from(new Set(suppliers.map((s) => s.category)))];

  const filteredSuppliers = suppliers.filter((s) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      (s.name || "").toLowerCase().includes(term) ||
      (s.legal_name && (s.legal_name || "").toLowerCase().includes(term)) ||
      (s.rfc && (s.rfc || "").toLowerCase().includes(term)) ||
      (s.category || "").toLowerCase().includes(term);

    const matchesCategory = categoryFilter === 'TODAS' || s.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4">
      {/* Top Filter & Actions Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar proveedor por nombre, RFC, categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-slate-50/50 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Categoría:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-hidden"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={onNewSupplier}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition shrink-0"
        >
          <Plus className="h-4 w-4" />
          Registrar Proveedor
        </button>
      </div>

      {/* Main Grid: Suppliers list + Detail 360 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Left Card Grid / Table */}
        <div className={`space-y-3 ${selectedSupplier ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {filteredSuppliers.map((sup) => {
              const assignedProds = supplierProducts.filter((sp) => sp.supplier_id === sup.id);
              const ordersCount = purchaseOrders.filter((po) => po.supplier_id === sup.id).length;
              const isSelected = selectedSupplier?.id === sup.id;

              return (
                <div
                  key={sup.id}
                  onClick={() => setSelectedSupplier(sup)}
                  className={`cursor-pointer rounded-2xl border bg-white p-4.5 shadow-xs transition hover:shadow-md ${
                    isSelected ? 'border-blue-600 ring-2 ring-blue-500/20' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">{sup.name}</h3>
                        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                          {sup.supplier_number}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{sup.legal_name}</p>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500 font-black text-xs bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <span>{sup.rating?.toFixed(1) ?? 'Sin datos'}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-600">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium">
                      {sup.category}
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium">
                      ⏱ {sup.lead_time_days} días entrega
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium">
                      💳 {sup.payment_terms}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                    <div className="text-slate-500">
                      <b>{assignedProds.length}</b> productos • <b>{ordersCount}</b> órdenes
                    </div>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onEditSupplier(sup)}
                        className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                        title="Editar proveedor"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onNewOrderForSupplier(sup.id)}
                        className="rounded-lg bg-indigo-50 px-2.5 py-1 font-bold text-indigo-700 hover:bg-indigo-100 text-[11px]"
                      >
                        + Orden
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Supplier 360° View */}
        {selectedSupplier && (
          <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-slate-900">{selectedSupplier.name}</h3>
                  <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                    ACTIVO
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  RFC: <b>{selectedSupplier.rfc || 'Sin RFC'}</b> • {selectedSupplier.category}
                </p>
              </div>
              <button
                onClick={() => setSelectedSupplier(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Performance Scorecard */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Scorecard de Desempeño & Cumplimiento OTIF
              </span>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-white p-2 border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase block">Calificación</span>
                  <span className="text-base font-black text-amber-600">
                    ⭐ {selectedSupplier.rating?.toFixed(1) ?? 'Sin datos'} / 5.0
                  </span>
                </div>
                <div className="rounded-lg bg-white p-2 border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase block">A Tiempo (OTD)</span>
                  <span className="text-base font-black text-emerald-600">
                    {selectedSupplier.otif_score == null ? 'Sin datos' : selectedSupplier.otif_score + '%'}
                  </span>
                </div>
                <div className="rounded-lg bg-white p-2 border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase block">Calidad (QC)</span>
                  <span className="text-base font-black text-blue-600">
                    {selectedSupplier.quality_score == null ? 'Sin datos' : selectedSupplier.quality_score + '%'}
                  </span>
                </div>
              </div>
            </div>

            {/* Commercial Details */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-700 block">Condiciones Comerciales:</span>
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 block">Plazo de Pago:</span>
                  <span className="font-bold text-slate-800">{selectedSupplier.payment_terms}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Límite de Crédito:</span>
                  <span className="font-bold text-slate-800">
                    ${(selectedSupplier?.credit_limit || 0).toLocaleString()} MXN
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Lead Time Promesa:</span>
                  <span className="font-bold text-slate-800">{selectedSupplier.lead_time_days} días</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Moneda:</span>
                  <span className="font-bold text-slate-800">{selectedSupplier.currency}</span>
                </div>
              </div>
            </div>

            {/* Bank Info */}
            {selectedSupplier.bankName && (
              <div className="space-y-1 text-xs">
                <span className="font-bold text-slate-700 block">Datos Bancarios para Pago:</span>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-700">
                  <div>Banco: <b>{selectedSupplier.bankName}</b></div>
                  <div>Cuenta: <b>{selectedSupplier.bankAccount || 'N/D'}</b></div>
                  <div>CLABE: <b>{selectedSupplier.bankClabe || 'N/D'}</b></div>
                </div>
              </div>
            )}

            {/* Products Supplied Table */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                Catálogo de Productos Suministrados
              </span>
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden text-xs max-h-48 overflow-y-auto">
                {supplierProducts
                  .filter((sp) => sp.supplier_id === selectedSupplier.id)
                  .map((sp) => {
                    const prod = products.find((p) => p.id === sp.product_id);
                    return (
                      <div key={sp.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                        <div>
                          <div className="font-bold text-slate-900">
                            [{prod?.code || 'SKU'}] {prod?.name || 'Producto'}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Cód. Proveedor: {sp.supplier_sku || 'N/A'} • Min: {sp.minimum_order_quantity} {prod?.unit || 'PZA'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-slate-900">
                            ${(sp?.purchase_price || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} {sp.currency}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Lead Time: {sp.lead_time_days || selectedSupplier.lead_time_days}d
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => onEditSupplier(selectedSupplier)}
                className="flex-1 rounded-lg border border-slate-300 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Editar Ficha
              </button>
              <button
                onClick={() => onNewOrderForSupplier(selectedSupplier.id)}
                className="flex-1 rounded-lg bg-indigo-600 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
              >
                + Emitir Orden PO
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
