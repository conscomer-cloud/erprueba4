import React, { useState, useMemo } from 'react';
import {
  SlidersHorizontal,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  Calendar,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  X,
  RotateCcw,
  Clock,
  Package,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { InventoryAdjustment } from '../../types/erp';

export const InventoryAdjustmentsManager: React.FC = () => {
  const {
    adjustments,
    warehouses,
    products,
    createInventoryAdjustment,
    authorizeInventoryAdjustment,
    rejectInventoryAdjustment,
  } = useERP();
  const { currentUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showNewModal, setShowNewModal] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);

  // Rejection modal state
  const [rejectModalAdj, setRejectModalAdj] = useState<InventoryAdjustment | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');

  // Loading / Idempotency protection state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // New Adjustment Form State
  const [adjWarehouseId, setAdjWarehouseId] = useState(warehouses[0]?.id || 'WH-01');
  const [adjProductId, setAdjProductId] = useState(products[0]?.id || '');
  const [adjType, setAdjType] = useState<'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO'>('AJUSTE_NEGATIVO');
  const [adjQuantity, setAdjQuantity] = useState<number>(1);
  const [adjReason, setAdjReason] = useState('Merma / Daño en maniobra de almacén');
  const [customFolio, setCustomFolio] = useState('');

  const filteredAdjustments = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return adjustments.filter((a) => {
      if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
      if (q) {
        const matchFolio = (a.folio || '').toLowerCase().includes(q);
        const matchProd =
          (a.productName || '').toLowerCase().includes(q) ||
          (a.productCode || '').toLowerCase().includes(q);
        const matchReason = (a.reason || '').toLowerCase().includes(q);
        if (!matchFolio && !matchProd && !matchReason) return false;
      }
      return true;
    });
  }, [adjustments, searchTerm, statusFilter]);

  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === adjProductId || p.code === adjProductId || p.sku === adjProductId) || products[0];
  }, [products, adjProductId]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (adjQuantity <= 0) {
      setFeedback({ text: 'La cantidad debe ser mayor a cero.', ok: false });
      return;
    }
    if (!adjReason.trim()) {
      setFeedback({ text: 'El motivo de la solicitud es obligatorio.', ok: false });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = createInventoryAdjustment({
        warehouseId: adjWarehouseId,
        productId: adjProductId || selectedProduct?.id || 'PROD-TEST-021',
        type: adjType,
        quantity: Number(adjQuantity),
        reason: adjReason.trim(),
        folio: customFolio.trim() ? customFolio.trim() : undefined,
      });

      if (res.success) {
        setFeedback({
          text: `✅ Solicitud ${res.adjustment?.folio || ''} guardada en estado PENDIENTE_AUTORIZACION. Existencias físicas y Kardex intactos.`,
          ok: true,
        });
        setShowNewModal(false);
        setAdjQuantity(1);
        setCustomFolio('');
        setTimeout(() => setFeedback(null), 5000);
      } else {
        setFeedback({ text: `❌ ${res.error}`, ok: false });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAuthorize = async (adjId: string) => {
    setProcessingId(adjId);
    try {
      const res = authorizeInventoryAdjustment(adjId);
      if (res.success) {
        setFeedback({
          text: '✅ Ajuste autorizado con éxito. Existencias físicas modificadas y 1 movimiento registrado en Kardex.',
          ok: true,
        });
        setTimeout(() => setFeedback(null), 5000);
      } else {
        setFeedback({ text: `❌ ${res.error}`, ok: false });
      }
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (adj: InventoryAdjustment) => {
    setRejectModalAdj(adj);
    setRejectReasonInput('');
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalAdj) return;
    if (!rejectReasonInput.trim()) {
      setFeedback({ text: 'El motivo del rechazo es obligatorio.', ok: false });
      return;
    }

    setProcessingId(rejectModalAdj.id);
    try {
      const res = rejectInventoryAdjustment(rejectModalAdj.id, rejectReasonInput.trim());
      if (res.success) {
        setFeedback({
          text: `✅ Solicitud ${rejectModalAdj.folio} rechazada. Estado actualizado a RECHAZADO. Existencias y Kardex intactos.`,
          ok: true,
        });
        setRejectModalAdj(null);
        setTimeout(() => setFeedback(null), 5000);
      } else {
        setFeedback({ text: `❌ ${res.error}`, ok: false });
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleResetTest021 = async () => {
    try {
      const token = localStorage.getItem('conscore_auth_token') || sessionStorage.getItem('conscore_auth_token');
      await fetch('/api/inventory/adjustments/reset-test-021', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      // Sincronizar estado local en el navegador
      const updatedProds = products.map((p) =>
        p.sku === 'SKU-TEST-021' || p.code === 'SKU-TEST-021' || p.id === 'PROD-TEST-021'
          ? { ...p, stock: 20, physicalStock: 20, physical_stock: 20, availableStock: 20, available_stock: 20 }
          : p
      );
      const filteredAdjs = adjustments.filter((a) => !a.folio?.startsWith('AJU-TEST-021'));
      localStorage.setItem('conscore_products', JSON.stringify(updatedProds));
      localStorage.setItem('conscore_adjustments', JSON.stringify(filteredAdjs));

      setFeedback({
        text: '🔄 Caso SKU-TEST-021 restablecido a 20 pzas físicas. Folios de prueba AJU-TEST-021 limpiados.',
        ok: true,
      });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setFeedback({ text: `Error al restablecer: ${err.message}`, ok: false });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
            <SlidersHorizontal className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Ajustes Manuales y Control de Mermas</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Flujo estricto: Solicitud → Pendiente Autorización → Autorización Administrativa → Aplicación a Inventario y Kardex.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetTest021}
            title="Restablece SKU-TEST-021 a 20 pzas físicas y limpia folios de prueba"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restablecer SKU-TEST-021
          </button>

          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Registrar Solicitud de Ajuste
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm font-medium transition flex items-center justify-between shadow-xs ${
            feedback.ok
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-bold px-2 py-1 bg-white rounded border border-slate-200"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Filter bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por Folio (AJU-...), Material o Motivo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(['ALL', 'PENDIENTE_AUTORIZACION', 'APLICADO', 'RECHAZADO'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
                statusFilter === st
                  ? 'bg-amber-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL'
                ? 'Todos los Ajustes'
                : st === 'PENDIENTE_AUTORIZACION'
                ? 'Pendientes de Autorización'
                : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Adjustments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="p-3.5">Folio / Fecha</th>
                <th className="p-3.5">Almacén</th>
                <th className="p-3.5">Material & SKU</th>
                <th className="p-3.5 text-center">Existencia Actual</th>
                <th className="p-3.5">Tipo & Cantidad</th>
                <th className="p-3.5">Motivo / Solicitante</th>
                <th className="p-3.5 text-center">Estado</th>
                <th className="p-3.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAdjustments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No hay solicitudes de ajuste que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredAdjustments.map((adj) => {
                  const currentProd = products.find(
                    (p) => p.id === adj.productId || p.code === adj.productCode || p.sku === adj.productCode
                  );
                  const curStock = currentProd?.stock ?? currentProd?.physicalStock ?? adj.previousStock;

                  return (
                    <tr key={adj.id} className="hover:bg-slate-50/50">
                      <td className="p-3.5">
                        <p className="font-mono font-bold text-slate-900">{adj.folio}</p>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3" /> {adj.createdAt.slice(0, 10)}
                        </span>
                      </td>
                      <td className="p-3.5 font-medium text-slate-800">
                        {adj.warehouseName}
                        {adj.location && <span className="block text-[11px] text-slate-400">{adj.location}</span>}
                      </td>
                      <td className="p-3.5">
                        <p className="font-mono font-bold text-slate-900">{adj.productCode}</p>
                        <p className="text-slate-600 truncate max-w-xs">{adj.productName}</p>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded">
                          {curStock} pzas
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold ${
                            adj.type === 'AJUSTE_POSITIVO'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {adj.type === 'AJUSTE_POSITIVO' ? (
                            <ArrowDownLeft className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          )}
                          {adj.type === 'AJUSTE_POSITIVO' ? '+' : '-'}
                          {Math.abs(adj.differenceQty || adj.quantity || 0)}
                        </span>
                        <span className="block text-[10px] text-slate-400 uppercase font-semibold mt-0.5">
                          {adj.type === 'AJUSTE_POSITIVO' ? 'Sobrante (+)' : 'Merma (-)'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <p className="text-slate-800 font-medium">{adj.reason}</p>
                        <span className="text-[11px] text-slate-400">Por: {adj.createdByName || 'Almacén'}</span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            adj.status === 'APLICADO'
                              ? 'bg-emerald-100 text-emerald-800'
                              : adj.status === 'RECHAZADO'
                              ? 'bg-slate-100 text-slate-500'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {adj.status === 'PENDIENTE_AUTORIZACION' ? (
                            <Clock className="h-3 w-3" />
                          ) : adj.status === 'APLICADO' ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          {adj.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {adj.status === 'PENDIENTE_AUTORIZACION' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              disabled={processingId === adj.id}
                              onClick={() => handleAuthorize(adj.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded text-[11px] font-bold shadow-xs transition"
                            >
                              {processingId === adj.id ? 'Aplicando...' : 'Autorizar'}
                            </button>
                            <button
                              disabled={processingId === adj.id}
                              onClick={() => openRejectModal(adj)}
                              className="px-2 py-1 bg-slate-100 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 text-slate-600 rounded text-[11px] font-semibold transition"
                            >
                              Rechazar
                            </button>
                          </div>
                        ) : adj.status === 'APLICADO' ? (
                          <span className="text-[11px] text-emerald-700 font-medium">
                            {adj.authorizedByName ? `Por ${adj.authorizedByName}` : 'Aplicado'}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            {adj.rejectionReason ? `Motivo: ${adj.rejectionReason}` : 'Rechazado'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Adjustment Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <SlidersHorizontal className="h-5 w-5" />
                </span>
                <h3 className="text-lg font-bold text-slate-900">Registrar Solicitud de Ajuste</h3>
              </div>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Business Rule Warning */}
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Flujo de Control Obligatorio:</strong> La solicitud se guardará exclusivamente en estado{' '}
                <span className="font-bold underline">PENDIENTE_AUTORIZACION</span>. Las existencias físicas y el Kardex{' '}
                <strong>no se modificarán</strong> hasta que un Administrador la autorice formalmente.
              </span>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Folio Opcional / Test</label>
                <input
                  type="text"
                  placeholder="Dejar en blanco para autogenerar (o ej. AJU-TEST-021-A)"
                  value={customFolio}
                  onChange={(e) => setCustomFolio(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Almacén</label>
                <select
                  value={adjWarehouseId}
                  onChange={(e) => setAdjWarehouseId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Material / SKU</label>
                <select
                  value={adjProductId || selectedProduct?.id}
                  onChange={(e) => setAdjProductId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-medium"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code || p.sku} — {p.name} (Stock Actual: {p.stock ?? p.physicalStock ?? 0} pzas)
                    </option>
                  ))}
                </select>
                {selectedProduct && (
                  <p className="mt-1 text-[11px] text-slate-500">
                    Existencia actual: <span className="font-bold text-slate-800">{selectedProduct.stock ?? selectedProduct.physicalStock ?? 0}</span> pzas.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Tipo de Ajuste</label>
                  <select
                    value={adjType}
                    onChange={(e) => setAdjType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-medium"
                  >
                    <option value="AJUSTE_NEGATIVO">MERMA / SALIDA (-)</option>
                    <option value="AJUSTE_POSITIVO">SOBRANTE / ENTRADA (+)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Cantidad</label>
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    value={adjQuantity}
                    onChange={(e) => setAdjQuantity(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-right font-bold text-slate-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Justificación / Motivo</label>
                <input
                  type="text"
                  placeholder="Ej. Merma por daño físico durante maniobra..."
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 font-bold text-white bg-amber-600 hover:bg-amber-500 active:bg-amber-700 disabled:opacity-50 rounded-xl shadow-xs transition"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar Solicitud'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalAdj && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-red-50 text-red-600 rounded-xl">
                  <XCircle className="h-5 w-5" />
                </span>
                <h3 className="text-lg font-bold text-slate-900">Rechazar Solicitud de Ajuste</h3>
              </div>
              <button onClick={() => setRejectModalAdj(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Se rechazará la solicitud <strong className="text-slate-900 font-mono">{rejectModalAdj.folio}</strong> ({rejectModalAdj.productCode} — {rejectModalAdj.quantity} pzas). El estado cambiará a <strong className="text-red-700">RECHAZADO</strong> y el inventario físico permanecerá intacto.
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Motivo del Rechazo <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Ej. Rechazado por auditoría interna: no procede justificación presentada..."
                  value={rejectReasonInput}
                  onChange={(e) => setRejectReasonInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectModalAdj(null)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={processingId === rejectModalAdj.id}
                  className="px-5 py-2 font-bold text-white bg-red-600 hover:bg-red-500 active:bg-red-700 disabled:opacity-50 rounded-xl shadow-xs transition"
                >
                  {processingId === rejectModalAdj.id ? 'Rechazando...' : 'Confirmar Rechazo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
