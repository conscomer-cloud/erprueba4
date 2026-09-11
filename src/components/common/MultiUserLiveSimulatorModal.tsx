import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Radio,
  ArrowRight,
  Package,
  CheckCircle2,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Building2,
  Sparkles,
  Zap,
  Clock,
  Layers,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { MovementType } from '../../types/erp';

interface MultiUserLiveSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MultiUserLiveSimulatorModal: React.FC<MultiUserLiveSimulatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { products, movements, recordMovement, lastSyncTimestamp } = useERP();
  const { users, currentUser } = useAuth();

  const fallbackUser1 = users.find((u) => u.role === 'ALMACEN' || u.role === 'LOGISTICA') || users[0] || currentUser;
  const fallbackUser2 = users.find((u) => u.role === 'VENDEDOR' || u.role === 'GERENTE_VENTAS' || u.role === 'DIRECTOR') || users[1] || users[0] || currentUser;

  // User 1 State (Left Panel - Operator / Warehouse)
  const warehouseUsers = users.filter((u) => u.role === 'ALMACEN' || u.role === 'LOGISTICA' || u.role === 'ADMINISTRADOR');
  const [user1Id, setUser1Id] = useState<string>(warehouseUsers[0]?.id || users[0]?.id || 'USR-005');
  const user1 = users.find((u) => u.id === user1Id) || warehouseUsers[0] || fallbackUser1;

  // User 2 State (Right Panel - Sales / Director / Audit)
  const salesUsers = users.filter((u) => u.role === 'VENDEDOR' || u.role === 'GERENTE_VENTAS' || u.role === 'DIRECTOR');
  const [user2Id, setUser2Id] = useState<string>(salesUsers[0]?.id || users[1]?.id || 'USR-004');
  const user2 = users.find((u) => u.id === user2Id) || salesUsers[0] || fallbackUser2;

  // Form State for User 1
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [movementType, setMovementType] = useState<MovementType>('SALIDA');
  const [quantity, setQuantity] = useState<number>(10);
  const [reason, setReason] = useState<string>('Surtido para entrega en obra Plaza Carso');
  const [referenceFolio, setReferenceFolio] = useState<string>('VALE-8842');
  const [nave, setNave] = useState<string>('N1');
  const [rack, setRack] = useState<string>('R-04');
  const [pasillo, setPasillo] = useState<string>('P-02');
  const [nivel, setNivel] = useState<string>('Niv-01');

  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);
  const [user2Flash, setUser2Flash] = useState(false);
  const [activeTabUser2, setActiveTabUser2] = useState<'KARDEX' | 'STOCK'>('KARDEX');

  // Trigger visual highlight on user 2 when movements change
  useEffect(() => {
    setUser2Flash(true);
    const t = setTimeout(() => setUser2Flash(false), 2000);
    return () => clearTimeout(t);
  }, [movements.length, lastSyncTimestamp]);

  if (!isOpen) return null;

  const currentProduct = products.find((p) => p.id === selectedProductId) || products[0];

  const handleExecuteMovement = (customQty?: number, customType?: MovementType, customReason?: string) => {
    const qtyToUse = customQty !== undefined ? customQty : Number(quantity);
    const typeToUse = customType || movementType;
    const reasonToUse = customReason || reason || 'Movimiento de prueba multiusuario';

    if (!selectedProductId) {
      setFeedback({ text: 'Selecciona un material del catálogo.', ok: false });
      return;
    }

    if (qtyToUse <= 0 || isNaN(qtyToUse)) {
      setFeedback({ text: 'Ingresa una cantidad válida mayor a cero.', ok: false });
      return;
    }

    const locString = `N${nave} / R${rack} / P${pasillo} / ${nivel}`;

    const res = recordMovement({
      productId: currentProduct.id,
      warehouseId: 'WH-01',
      type: typeToUse,
      quantity: qtyToUse,
      reason: reasonToUse,
      relatedDocFolio: referenceFolio || 'SIM-TEST',
      location: locString,
      customUser: {
        id: user1?.id || 'USR-005',
        name: user1?.name || 'Operador Almacén',
        role: user1?.role || 'ALMACEN',
      },
    });

    if (res.success) {
      setFeedback({
        text: `✅ ${typeToUse} registrada: ${qtyToUse} ${currentProduct.unit} de ${currentProduct.code} por ${user1?.name || 'Operador'}. Saldo disponible actualizado instantáneamente.`,
        ok: true,
      });
      setTimeout(() => setFeedback(null), 5000);
    } else {
      setFeedback({
        text: `⚠️ Error: ${res.error || 'No se pudo completar el movimiento'}`,
        ok: false,
      });
    }
  };

  const handleOpenSecondWindow = () => {
    window.open(window.location.href, '_blank', 'width=1100,height=800');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-3 sm:p-6 backdrop-blur-xs animate-in fade-in">
      <div className="flex h-[92vh] w-full max-w-7xl flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Top Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-950 px-6 py-3.5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-400 text-slate-950 shadow-xs">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold sm:text-base">
                  Simulador de 2 Usuarios Simultáneos en Vivo
                </h2>
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                  <Radio className="h-3 w-3 animate-pulse text-emerald-400" />
                  Sincronización en Tiempo Real (0s Delay)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Prueba cómo las entradas y salidas registradas por una persona se reflejan instantáneamente en la pantalla de otra sin recargar la página.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenSecondWindow}
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-all shadow-xs"
              title="Abrir una segunda ventana física de navegador para probar con dos ventanas lado a lado"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Abrir 2ª Ventana Real
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Split Screen Body */}
        <div className="grid flex-1 grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 overflow-hidden">
          {/* ========================================================================= */}
          {/* PANEL IZQUIERDO: USUARIO 1 (ALMACÉN / SURTIDO / OPERADOR) */}
          {/* ========================================================================= */}
          <div className="flex flex-col h-full bg-slate-50/50 p-5 overflow-y-auto">
            {/* User 1 Header */}
            <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/80 p-3.5 shadow-2xs mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-700 font-bold text-white shadow-xs text-sm">
                  U1
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
                      Usuario 1 (Emisor - Almacén)
                    </span>
                    <span className="rounded bg-blue-200/70 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                      {user1?.role || 'ALMACEN'}
                    </span>
                  </div>
                  <select
                    value={user1Id}
                    onChange={(e) => setUser1Id(e.target.value)}
                    className="mt-0.5 text-xs font-bold text-slate-900 bg-white border border-blue-300 rounded px-2 py-1 outline-none shadow-2xs"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u?.role || 'USUARIO'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-flex items-center gap-1 rounded bg-blue-100 text-blue-900 border border-blue-200 px-2 py-0.5 text-[11px] font-semibold">
                  <Building2 className="h-3 w-3" />
                  Almacén Central Tultitlán
                </span>
              </div>
            </div>

            {/* Quick 1-Click Simulation Triggers */}
            <div className="mb-4">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                ⚡ Pruebas Rápidas de 1 Clic (Registrar y ver efecto en vivo):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    setSelectedProductId(products[0]?.id);
                    handleExecuteMovement(25, 'ENTRADA', 'Recepción de embarque desde planta Owens Corning');
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors text-left"
                >
                  <ArrowDownLeft className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>+25 Ent. Lana Min.</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedProductId(products[0]?.id);
                    handleExecuteMovement(10, 'SALIDA', 'Surtido de vale urgente para obra Hospital Sur');
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-red-300 bg-red-50 px-2.5 py-2 text-xs font-bold text-red-800 hover:bg-red-100 transition-colors text-left"
                >
                  <ArrowUpRight className="h-4 w-4 text-red-600 shrink-0" />
                  <span>-10 Sal. Lana Min.</span>
                </button>
                <button
                  onClick={() => {
                    const fib = products.find((p) => p.code.includes('FIB')) || products[1] || products[0];
                    setSelectedProductId(fib.id);
                    handleExecuteMovement(50, 'ENTRADA', 'Arribo de rollos fibra de vidrio R-11');
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-blue-300 bg-blue-50 px-2.5 py-2 text-xs font-bold text-blue-800 hover:bg-blue-100 transition-colors text-left"
                >
                  <ArrowDownLeft className="h-4 w-4 text-blue-600 shrink-0" />
                  <span>+50 Fibra Vidrio</span>
                </button>
              </div>
            </div>

            {/* Custom Movement Form */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3.5 flex-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2 flex items-center justify-between">
                <span>Registrar Movimiento Específico</span>
                <span className="text-[10px] text-slate-400 font-normal">Sincroniza en tiempo real</span>
              </h3>

              {/* Product Picker */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Material de Aislamiento Térmico
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2 text-xs font-semibold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.code}] {p.name} — Disp: {p.availableStock} {p.unit} (Fís: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              {/* Current Stock Preview Card */}
              {currentProduct && (
                <div className="grid grid-cols-3 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Físico</span>
                    <div className="font-mono font-bold text-slate-900 text-sm">{currentProduct.stock} {currentProduct.unit}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-700 uppercase font-bold">Reservado</span>
                    <div className="font-mono font-bold text-amber-700 text-sm">{currentProduct.reservedStock} {currentProduct.unit}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-700 uppercase font-bold">Disponible</span>
                    <div className="font-mono font-extrabold text-emerald-700 text-sm">{currentProduct.availableStock} {currentProduct.unit}</div>
                  </div>
                </div>
              )}

              {/* Type & Quantity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Tipo de Movimiento
                  </label>
                  <select
                    value={movementType}
                    onChange={(e) => setMovementType(e.target.value as MovementType)}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-bold text-slate-800 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="ENTRADA">🟢 ENTRADA (Recepción)</option>
                    <option value="SALIDA">🔴 SALIDA (Despacho / Obra)</option>
                    <option value="AJUSTE">🔵 AJUSTE FÍSICO</option>
                    <option value="DEVOLUCION">🟡 DEVOLUCIÓN DE OBRA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Cantidad ({currentProduct?.unit || 'PZA'})
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-mono font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Location Selector (Nave / Rack / Pasillo / Nivel) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Ubicación Física en Almacén
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block">NAVE</span>
                    <input
                      value={nave}
                      onChange={(e) => setNave(e.target.value)}
                      placeholder="N1"
                      className="w-full rounded border border-slate-200 p-1 text-center font-mono text-xs font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block">RACK</span>
                    <input
                      value={rack}
                      onChange={(e) => setRack(e.target.value)}
                      placeholder="R-04"
                      className="w-full rounded border border-slate-200 p-1 text-center font-mono text-xs font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block">PASILLO</span>
                    <input
                      value={pasillo}
                      onChange={(e) => setPasillo(e.target.value)}
                      placeholder="P-02"
                      className="w-full rounded border border-slate-200 p-1 text-center font-mono text-xs font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block">NIVEL</span>
                    <input
                      value={nivel}
                      onChange={(e) => setNivel(e.target.value)}
                      placeholder="Niv-01"
                      className="w-full rounded border border-slate-200 p-1 text-center font-mono text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Reference & Reason */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Referencia / Folio / Vale
                  </label>
                  <input
                    type="text"
                    value={referenceFolio}
                    onChange={(e) => setReferenceFolio(e.target.value)}
                    placeholder="Vale 9021 / OC-330"
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Motivo / Destino
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Surtido urgente..."
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={() => handleExecuteMovement()}
                className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 shadow-md transition-all flex items-center justify-center gap-2 group"
              >
                <span>Registrar como {user1.name}</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform text-yellow-400" />
              </button>

              {/* Feedback toast inside left panel */}
              {feedback && (
                <div
                  className={`rounded-lg p-2.5 text-xs font-medium ${
                    feedback.ok
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : 'bg-red-50 text-red-900 border border-red-200'
                  }`}
                >
                  {feedback.text}
                </div>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PANEL DERECHO: USUARIO 2 (VENTAS / DIRECCIÓN / MONITOR EN VIVO) */}
          {/* ========================================================================= */}
          <div
            className={`flex flex-col h-full bg-white p-5 overflow-y-auto transition-colors duration-500 ${
              user2Flash ? 'bg-emerald-50/40 ring-4 ring-inset ring-emerald-400/50' : ''
            }`}
          >
            {/* User 2 Header */}
            <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 shadow-2xs mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-700 font-bold text-white shadow-xs text-sm">
                  U2
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                      Usuario 2 (Receptor - Ventas / Dirección)
                    </span>
                    <span className="rounded bg-emerald-200/70 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      {user2?.role || 'VENDEDOR'}
                    </span>
                  </div>
                  <select
                    value={user2Id}
                    onChange={(e) => setUser2Id(e.target.value)}
                    className="mt-0.5 text-xs font-bold text-slate-900 bg-white border border-emerald-300 rounded px-2 py-1 outline-none shadow-2xs"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u?.role || 'USUARIO'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-right flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-bold text-emerald-800">
                  Escuchando en Vivo ({lastSyncTimestamp})
                </span>
              </div>
            </div>

            {/* User 2 View Switcher (Kardex vs Catalogo Stock) */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTabUser2('KARDEX')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                    activeTabUser2 === 'KARDEX'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Kardex en Vivo ({movements.length} movs)
                </button>
                <button
                  onClick={() => setActiveTabUser2('STOCK')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                    activeTabUser2 === 'STOCK'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Saldos de Inventario
                </button>
              </div>

              <span className="text-[10px] text-slate-500 font-mono">
                {user2Flash ? '⚡ ¡NUEVA ACTUALIZACIÓN DETECTADA!' : 'Sin necesidad de pulsar F5'}
              </span>
            </div>

            {/* TAB CONTENT FOR USER 2 */}
            {activeTabUser2 === 'KARDEX' ? (
              <div className="flex-1 overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px] sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Hora</th>
                      <th className="py-2 px-3">Tipo</th>
                      <th className="py-2 px-3">Código</th>
                      <th className="py-2 px-3 text-right">Cant.</th>
                      <th className="py-2 px-3 text-right">Saldo</th>
                      <th className="py-2 px-3">Ubicación</th>
                      <th className="py-2 px-3">Registrado por</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {movements.slice(0, 12).map((m, idx) => {
                      const isEntry = m.type === 'ENTRADA' || m.type === 'DEVOLUCION';
                      const isExit = m.type === 'SALIDA';
                      const isJustNow = idx === 0;

                      return (
                        <tr
                          key={m.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isJustNow && user2Flash ? 'bg-yellow-50/90 font-bold text-slate-900' : ''
                          }`}
                        >
                          <td className="py-2 px-3 text-slate-500 font-normal">
                            {m.timestamp.split(' ')[1] || m.timestamp}
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                isEntry
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isExit
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {m.type}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-900">
                            {m.productCode}
                          </td>
                          <td className="py-2 px-3 text-right font-bold">
                            <span className={isEntry ? 'text-emerald-700' : isExit ? 'text-red-700' : 'text-blue-700'}>
                              {isEntry ? '+' : isExit ? '-' : ''}{m.quantity}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-extrabold text-slate-900">
                            {m.newBalance}
                          </td>
                          <td className="py-2 px-3 text-slate-600 text-[10px]">
                            {m.location || 'General'}
                          </td>
                          <td className="py-2 px-3 text-slate-700 font-sans text-[11px]">
                            {m.userName}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex-1 overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2 px-3">Código</th>
                      <th className="py-2 px-3">Material</th>
                      <th className="py-2 px-3 text-right">Físico</th>
                      <th className="py-2 px-3 text-right">Reservado</th>
                      <th className="py-2 px-3 text-right">Disponible</th>
                      <th className="py-2 px-3">Ubicación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map((p) => {
                      const isSelected = p.id === selectedProductId;
                      return (
                        <tr
                          key={p.id}
                          className={`hover:bg-slate-50 ${
                            isSelected ? 'bg-blue-50/50 font-semibold' : ''
                          }`}
                        >
                          <td className="py-2 px-3 font-mono font-bold text-blue-900">{p.code}</td>
                          <td className="py-2 px-3 text-slate-800 max-w-[160px] truncate">{p.name}</td>
                          <td className="py-2 px-3 text-right font-mono">{p.stock}</td>
                          <td className="py-2 px-3 text-right font-mono text-amber-700">{p.reservedStock}</td>
                          <td className="py-2 px-3 text-right font-mono font-black text-emerald-700">
                            {p.availableStock}
                          </td>
                          <td className="py-2 px-3 text-slate-500 font-mono text-[10px]">
                            {p.warehouseLocation}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Bottom Real-time sync guarantee badge */}
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500 shrink-0" />
                <span>
                  <b>Garantía Multi-Usuario:</b> Cambios procesados con <i>BroadcastChannel + Server-Sent Events</i>.
                </span>
              </div>
              <button
                onClick={handleOpenSecondWindow}
                className="text-blue-700 hover:text-blue-900 font-bold underline text-[11px] shrink-0"
              >
                Abrir en 2da Pestaña ↗
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 flex items-center justify-between text-xs text-slate-500">
          <div>
            <b>CONSCORE ERP IA</b> — Motor de Inventarios & Almacén en Tiempo Real para Aislamiento Térmico.
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-200 px-4 py-1.5 font-bold text-slate-800 hover:bg-slate-300 transition-colors"
          >
            Cerrar Simulador
          </button>
        </div>
      </div>
    </div>
  );
};
