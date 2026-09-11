import React, { useState, useMemo } from 'react';
import {
  Shuffle,
  Building2,
  ArrowRight,
  Plus,
  CheckCircle2,
  Truck,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  X,
  Package,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
  Ban
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { TransferItem, WarehouseTransfer } from '../../types/erp';

export const WarehouseTransfersManager: React.FC = () => {
  const {
    transfers,
    warehouses,
    products,
    createWarehouseTransfer,
    authorizeWarehouseTransfer,
    shipWarehouseTransfer,
    receiveWarehouseTransfer,
    cancelWarehouseTransfer,
  } = useERP();
  const { currentUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showNewTransferModal, setShowNewTransferModal] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);

  // New Transfer Form State
  const [originWarehouseId, setOriginWarehouseId] = useState(warehouses[0]?.id || 'WH-01');
  const [destWarehouseId, setDestWarehouseId] = useState(warehouses[1]?.id || 'WH-02');
  const [transferNotes, setTransferNotes] = useState('');
  const [carrierName, setCarrierName] = useState('');
  const [selectedItems, setSelectedItems] = useState<{ productId: string; quantity: number }[]>([
    { productId: products[0]?.id || '', quantity: 10 },
  ]);

  const filteredTransfers = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return transfers.filter((t) => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (q) {
        const matchFolio = (t.folio || "").toLowerCase().includes(q);
        const matchOrigin = (t.originWarehouseName || "").toLowerCase().includes(q);
        const matchDest = (t.destinationWarehouseName || "").toLowerCase().includes(q);
        if (!matchFolio && !matchOrigin && !matchDest) return false;
      }
      return true;
    });
  }, [transfers, searchTerm, statusFilter]);

  const handleAddItemRow = () => {
    setSelectedItems((prev) => [...prev, { productId: products[0]?.id || '', quantity: 1 }]);
  };

  const handleRemoveItemRow = (idx: number) => {
    setSelectedItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: 'productId' | 'quantity', val: any) => {
    setSelectedItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: val } : item))
    );
  };

  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (originWarehouseId === destWarehouseId) {
      setFeedback({ text: 'El almacén de origen y destino deben ser diferentes.', ok: false });
      return;
    }

    if (selectedItems.length === 0) {
      setFeedback({ text: 'Debes agregar al menos un material al traspaso.', ok: false });
      return;
    }

    const items: TransferItem[] = [];
    for (const item of selectedItems) {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) continue;
      if (item.quantity <= 0) {
        setFeedback({ text: `La cantidad de ${prod.name} debe ser mayor a cero.`, ok: false });
        return;
      }
      items.push({
        productId: prod.id,
        productCode: prod.code,
        productName: prod.name,
        unit: prod.unit,
        quantity: Number(item.quantity),
      });
    }

    const res = createWarehouseTransfer({
      originWarehouseId,
      destinationWarehouseId: destWarehouseId,
      items,
      carrier: carrierName || undefined,
      notes: transferNotes || undefined,
    });

    if (res.success) {
      setFeedback({ text: '✅ Traspaso creado exitosamente en estado SOLICITADA.', ok: true });
      setShowNewTransferModal(false);
      setTransferNotes('');
      setCarrierName('');
      setSelectedItems([{ productId: products[0]?.id || '', quantity: 10 }]);
      setTimeout(() => setFeedback(null), 5000);
    } else {
      setFeedback({ text: `❌ Error: ${res.error}`, ok: false });
    }
  };

  const handleAuthorize = (trfId: string) => {
    const res = authorizeWarehouseTransfer(trfId);
    if (res.success) {
      setFeedback({ text: '✅ Traspaso autorizado para despacho.', ok: true });
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setFeedback({ text: `❌ ${res.error}`, ok: false });
    }
  };

  const handleShip = (trfId: string) => {
    const res = shipWarehouseTransfer(trfId);
    if (res.success) {
      setFeedback({ text: '🚚 Traspaso marcado EN TRÁNSITO y descontado de almacén origen.', ok: true });
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setFeedback({ text: `❌ ${res.error}`, ok: false });
    }
  };

  const handleReceive = (trfId: string) => {
    const res = receiveWarehouseTransfer(trfId);
    if (res.success) {
      setFeedback({ text: '📦 Traspaso RECIBIDO e ingresado al stock de almacén destino.', ok: true });
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setFeedback({ text: `❌ ${res.error}`, ok: false });
    }
  };

  const handleCancel = (trfId: string) => {
    if (!confirm('¿Deseas cancelar este traspaso?')) return;
    const res = cancelWarehouseTransfer(trfId, 'Cancelado por usuario');
    if (res.success) {
      setFeedback({ text: 'Traspaso cancelado.', ok: true });
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setFeedback({ text: `❌ ${res.error}`, ok: false });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <Shuffle className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Control de Traspasos Inter-Almacén</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Movimientos de stock entre sucursales con autorización, control en tránsito y recepción confirmada.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowNewTransferModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
        >
          <Plus className="h-4 w-4" />
          Solicitar Nuevo Traspaso
        </button>
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
            placeholder="Buscar por Folio (TRF-...), Origen o Destino..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(['ALL', 'SOLICITADA', 'AUTORIZADA', 'EN_TRANSITO', 'RECIBIDA', 'CANCELADA'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'Todos' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Transfers List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="p-3.5">Folio / Fecha</th>
                <th className="p-3.5">Origen ➔ Destino</th>
                <th className="p-3.5">Materiales / Cantidad</th>
                <th className="p-3.5">Solicitante</th>
                <th className="p-3.5 text-center">Estado</th>
                <th className="p-3.5 text-right">Acciones Operativas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No se encontraron traspasos registrados con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredTransfers.map((trf) => (
                  <tr key={trf.id} className="hover:bg-slate-50/50">
                    <td className="p-3.5">
                      <p className="font-mono font-bold text-slate-900">{trf.folio}</p>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3" /> {trf.requestedAt.slice(0, 10)}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <span className="text-slate-900 font-semibold">{trf.originWarehouseName}</span>
                        <ArrowRight className="h-3 w-3 text-slate-400" />
                        <span className="text-indigo-700 font-semibold">{trf.destinationWarehouseName}</span>
                      </div>
                      {trf.carrier && (
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          Transporte: {trf.carrier}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <div className="space-y-1">
                        {trf.items.map((it, i) => (
                          <div key={i} className="text-slate-700 font-medium">
                            <span className="font-mono font-bold text-slate-900">{it.productCode}</span>: {(it?.quantity || 0).toLocaleString('es-MX')} {it.unit}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-600">
                      <p className="font-medium text-slate-800">{trf.requestedByName || 'Almacén'}</p>
                      {trf.notes && <p className="text-[11px] text-slate-400 italic">"{trf.notes}"</p>}
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          trf.status === 'RECIBIDA'
                            ? 'bg-emerald-100 text-emerald-800'
                            : trf.status === 'EN_TRANSITO'
                            ? 'bg-blue-100 text-blue-800'
                            : trf.status === 'AUTORIZADA'
                            ? 'bg-indigo-100 text-indigo-800'
                            : trf.status === 'CANCELADA'
                            ? 'bg-slate-100 text-slate-500'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {trf.status === 'EN_TRANSITO' && <Truck className="h-3 w-3 animate-pulse" />}
                        {trf.status === 'RECIBIDA' && <CheckCircle2 className="h-3 w-3" />}
                        {trf.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {trf.status === 'SOLICITADA' && (
                          <>
                            <button
                              onClick={() => handleAuthorize(trf.id)}
                              className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded text-[11px] font-bold"
                            >
                              Autorizar
                            </button>
                            <button
                              onClick={() => handleCancel(trf.id)}
                              className="px-2 py-1 text-slate-400 hover:text-red-600 rounded text-[11px]"
                            >
                              <Ban className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}

                        {trf.status === 'AUTORIZADA' && (
                          <button
                            onClick={() => handleShip(trf.id)}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white hover:bg-blue-500 rounded-lg text-[11px] font-bold shadow-xs"
                          >
                            <Truck className="h-3 w-3" />
                            Despachar en Tránsito
                          </button>
                        )}

                        {trf.status === 'EN_TRANSITO' && (
                          <button
                            onClick={() => handleReceive(trf.id)}
                            className="flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white hover:bg-emerald-500 rounded-lg text-[11px] font-bold shadow-xs"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Confirmar Recepción Destino
                          </button>
                        )}

                        {trf.status === 'RECIBIDA' && (
                          <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 justify-end">
                            <CheckCircle2 className="h-3 w-3" /> Completado
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Transfer Modal */}
      {showNewTransferModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Shuffle className="h-5 w-5" />
                </span>
                <h3 className="text-lg font-bold text-slate-900">Solicitar Traspaso entre Almacenes</h3>
              </div>
              <button
                onClick={() => setShowNewTransferModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTransfer} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Almacén Origen (Salida de Stock)
                  </label>
                  <select
                    value={originWarehouseId}
                    onChange={(e) => setOriginWarehouseId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Almacén Destino (Entrada de Stock)
                  </label>
                  <select
                    value={destWarehouseId}
                    onChange={(e) => setDestWarehouseId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items list */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Materiales a Traspasar
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Agregar Partida
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto p-1 border border-slate-200 rounded-xl">
                  {selectedItems.map((item, idx) => {
                    const prod = products.find((p) => p.id === item.productId);
                    return (
                      <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg text-xs">
                        <select
                          value={item.productId}
                          onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                          className="flex-1 px-2 py-1.5 rounded border border-slate-200 bg-white"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.code} - {p.name} (Disp: {p.availableStock} {p.unit})
                            </option>
                          ))}
                        </select>

                        <input
                          type="number"
                          min="0.1"
                          step="any"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', parseFloat(e.target.value))}
                          placeholder="Cant."
                          className="w-24 px-2 py-1.5 rounded border border-slate-200 bg-white text-right font-bold"
                        />

                        <span className="text-slate-400 font-mono w-10 text-center">{prod?.unit || 'PZA'}</span>

                        {selectedItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
                            className="text-slate-400 hover:text-red-600 p-1"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Transportista / Vehículo (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Camión Isuzu Placas QRO-442, Chofer Carlos"
                    value={carrierName}
                    onChange={(e) => setCarrierName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Motivo / Observaciones
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Rebalanceo de inventario por alta demanda..."
                    value={transferNotes}
                    onChange={(e) => setTransferNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewTransferModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs"
                >
                  Crear Solicitud de Traspaso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
