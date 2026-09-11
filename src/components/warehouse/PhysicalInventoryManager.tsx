import React, { useState, useMemo } from 'react';
import {
  ClipboardCheck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  Save,
  Check,
  X,
  Printer,
  FileSpreadsheet,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { InventoryCountSession, InventoryCountItem } from '../../types/erp';

export const PhysicalInventoryManager: React.FC = () => {
  const {
    countSessions,
    warehouses,
    products,
    createCountSession,
    updateCountItem,
    authorizeAndApplyCountAdjustments,
  } = useERP();
  const { currentUser } = useAuth();

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    countSessions[0]?.id || null
  );
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [isBlindCounting, setIsBlindCounting] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);

  // New Session Form State
  const [newWarehouseId, setNewWarehouseId] = useState(warehouses[0]?.id || 'WH-01');
  const [newCategoryFilter, setNewCategoryFilter] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const currentSession = useMemo(
    () => countSessions.find((s) => s.id === selectedSessionId) || countSessions[0] || null,
    [countSessions, selectedSessionId]
  );

  const categories = useMemo(() => [...new Set(products.map((p) => p.category))], [products]);

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    const res = createCountSession(
      newWarehouseId,
      newCategoryFilter || undefined,
      newNotes || 'Conteo Cíclico Programado'
    );
    if (res.success && res.session) {
      setFeedback({ text: `✅ Sesión de conteo ${res.session.folio} creada.`, ok: true });
      setSelectedSessionId(res.session.id);
      setShowNewSessionModal(false);
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setFeedback({ text: `❌ ${res.error}`, ok: false });
    }
  };

  const handleCountChange = (productId: string, val: string) => {
    if (!currentSession) return;
    const num = parseFloat(val);
    if (isNaN(num) || num < 0) return;
    updateCountItem(currentSession.id, productId, num);
  };

  const handleApplyAdjustments = () => {
    if (!currentSession) return;
    if (
      !confirm(
        `¿Confirmas la autorización y aplicación de los ajustes para el conteo ${currentSession.folio}? Esto modificará los saldos físicos de inventario.`
      )
    )
      return;

    const res = authorizeAndApplyCountAdjustments(currentSession.id);
    if (res.success) {
      setFeedback({
        text: `✅ Conteo ${currentSession.folio} ajustado y cerrado con éxito. Se actualizaron los saldos físicos y se registraron los movimientos de auditoría.`,
        ok: true,
      });
      setTimeout(() => setFeedback(null), 5000);
    } else {
      setFeedback({ text: `❌ Error: ${res.error}`, ok: false });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-purple-50 text-purple-600 rounded-xl">
            <ClipboardCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Inventarios Físicos y Conteos Cíclicos</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Auditoría física de almacén, detección de diferencias por rack y conciliación automática de saldos.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowNewSessionModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
        >
          <Plus className="h-4 w-4" />
          Nueva Sesión de Conteo
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

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Col: Sessions List */}
        <div className="lg:col-span-1 space-y-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
            Sesiones de Conteo ({countSessions.length})
          </div>

          {countSessions.length === 0 ? (
            <div className="bg-white p-6 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
              No hay sesiones registradas. Crea una nueva para comenzar el conteo.
            </div>
          ) : (
            countSessions.map((session) => {
              const isSelected = currentSession?.id === session.id;
              return (
                <div
                  key={session.id}
                  onClick={() => setSelectedSessionId(session.id)}
                  className={`p-4 rounded-xl border transition cursor-pointer text-left ${
                    isSelected
                      ? 'bg-purple-50/50 border-purple-500 ring-1 ring-purple-500 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-slate-900">{session.folio}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        session.status === 'AJUSTADO'
                          ? 'bg-emerald-100 text-emerald-800'
                          : session.status === 'DIFERENCIAS_DETECTADAS'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {session.status.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="font-semibold text-xs text-slate-800 mt-1.5 truncate">
                    {session.warehouseName}
                  </p>

                  <div className="flex items-center justify-between mt-2.5 text-[11px] text-slate-500">
                    <span>{session.createdAt.slice(0, 10)}</span>
                    <span className="font-medium text-slate-700">
                      {session.itemsWithDifferences > 0 ? (
                        <span className="text-amber-700 font-bold">
                          {session.itemsWithDifferences} con dif.
                        </span>
                      ) : (
                        <span className="text-emerald-700">Sin diferencias</span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Col: Active Session Sheet */}
        <div className="lg:col-span-3">
          {currentSession ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
              {/* Session Sheet Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-slate-900">{currentSession.folio}</h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-purple-100 text-purple-800">
                      {currentSession.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {currentSession.warehouseName} · Creado por {currentSession.createdByName || 'Auditoría'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setIsBlindCounting(!isBlindCounting)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                      isBlindCounting
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    {isBlindCounting ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {isBlindCounting ? 'Modo Ciego Activo' : 'Conteo Guiado'}
                  </button>

                  {currentSession.status !== 'AJUSTADO' && (
                    <button
                      onClick={handleApplyAdjustments}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs transition"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Autorizar y Aplicar Ajustes
                    </button>
                  )}
                </div>
              </div>

              {/* Differences Summary Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl text-xs">
                <div>
                  <span className="text-slate-500 block">Total Ítems Auditados</span>
                  <span className="font-bold text-slate-800 text-sm">{currentSession.items.length}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Ítems con Diferencia</span>
                  <span className={`font-bold text-sm ${currentSession.itemsWithDifferences > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {currentSession.itemsWithDifferences}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Impacto Costo Neto</span>
                  <span className={`font-bold text-sm ${(currentSession?.totalCostDifference || 0) < 0 ? 'text-red-700' : 'text-slate-800'}`}>
                    ${(currentSession?.totalCostDifference || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Estado de Auditoría</span>
                  <span className="font-semibold text-purple-700">{currentSession.status}</span>
                </div>
              </div>

              {/* Items Counting Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                      <tr>
                        <th className="p-3">Código</th>
                        <th className="p-3">Descripción</th>
                        <th className="p-3">Ubicación</th>
                        {!isBlindCounting && <th className="p-3 text-right">Stock Sistema</th>}
                        <th className="p-3 text-center">Físico Contado</th>
                        <th className="p-3 text-right">Diferencia</th>
                        <th className="p-3 text-right">Impacto ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentSession.items.map((item) => {
                        const isDiff = item.difference !== 0;
                        return (
                          <tr key={item.productId} className="hover:bg-slate-50/50">
                            <td className="p-3 font-mono font-bold text-slate-900">{item.productCode}</td>
                            <td className="p-3">
                              <p className="font-medium text-slate-800">{item.productName}</p>
                              <span className="text-[10px] text-slate-400">Unidad: {item.unit}</span>
                            </td>
                            <td className="p-3 font-mono text-slate-700 bg-slate-50/50">
                              {item.location}
                            </td>

                            {!isBlindCounting && (
                              <td className="p-3 text-right font-semibold text-slate-700">
                                {(item?.systemStock || 0).toLocaleString('es-MX')}
                              </td>
                            )}

                            <td className="p-3 text-center">
                              {currentSession.status === 'AJUSTADO' ? (
                                <span className="font-bold text-slate-900">{item.countedStock}</span>
                              ) : (
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  defaultValue={item.countedStock}
                                  onBlur={(e) => handleCountChange(item.productId, e.target.value)}
                                  className="w-24 px-2 py-1 text-center font-bold text-slate-900 rounded border border-slate-200 bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                />
                              )}
                            </td>

                            <td className="p-3 text-right font-bold">
                              {isDiff ? (
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-[11px] ${
                                    item.difference < 0 ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {item.difference > 0 ? `+${item.difference}` : item.difference} {item.unit}
                                </span>
                              ) : (
                                <span className="text-slate-400">0</span>
                              )}
                            </td>

                            <td className="p-3 text-right font-mono font-medium">
                              ${(item?.totalDifferenceCost || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
              <ClipboardCheck className="h-10 w-10 text-slate-400 mx-auto mb-3" />
              <h4 className="text-base font-semibold text-slate-700">Selecciona o crea una sesión de conteo</h4>
            </div>
          )}
        </div>
      </div>

      {/* New Session Modal */}
      {showNewSessionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                  <ClipboardCheck className="h-5 w-5" />
                </span>
                <h3 className="text-lg font-bold text-slate-900">Iniciar Conteo Físico</h3>
              </div>
              <button onClick={() => setShowNewSessionModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Almacén / Centro de Distribución
                </label>
                <select
                  value={newWarehouseId}
                  onChange={(e) => setNewWarehouseId(e.target.value)}
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
                  Filtrar por Categoría (Opcional)
                </label>
                <select
                  value={newCategoryFilter}
                  onChange={(e) => setNewCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                >
                  <option value="">Todas las Categorías (Conteo General)</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Observaciones / Responsable
                </label>
                <input
                  type="text"
                  placeholder="Ej. Conteo cíclico mensual de lanas minerales y espumas..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewSessionModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-xs"
                >
                  Generar Lista de Conteo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
