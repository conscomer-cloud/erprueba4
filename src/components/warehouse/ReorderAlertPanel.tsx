import React, { useMemo, useState } from 'react';
import { AlertTriangle, PackageX, ShoppingCart, ArrowRight, Check, Clock } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { calculateProductReorderStatus } from '../../services/purchasesService';
import { ProductReorderAnalysis } from '../../types/erp';

interface ReorderAlertPanelProps {
  /** Limita el análisis a un almacén. 'TODOS' o vacío analiza el catálogo completo. */
  warehouseId?: string;
  onNavigateToPurchases?: () => void;
}

const fmt = (n: number) => (Number(n) || 0).toLocaleString('es-MX');

/**
 * Alertas de punto de reorden.
 *
 * Se apoya en `calculateProductReorderStatus`, que ya implementa la política de
 * inventario del sistema: consumo diario promedio, tiempo de entrega, stock de
 * seguridad y stock en tránsito. No se recalcula aquí una fórmula paralela,
 * porque dos definiciones distintas de "punto de reorden" en la misma
 * aplicación terminan dando cifras que no cuadran entre módulos.
 *
 * La lista se recalcula con cada cambio de productos, movimientos u órdenes de
 * compra, así que refleja el estado del momento sin necesidad de recargar.
 */
export const ReorderAlertPanel: React.FC<ReorderAlertPanelProps> = ({
  warehouseId,
  onNavigateToPurchases,
}) => {
  const {
    products,
    purchaseOrders,
    reorderConfigs,
    supplierProducts,
    suppliers,
    purchaseRequests,
    createPurchaseRequest,
    addNotification,
    lastSyncTimestamp,
  } = useERP();
  const { currentUser, can } = useAuth();

  const [enviando, setEnviando] = useState<string | null>(null);
  const [enviados, setEnviados] = useState<Record<string, string>>({});

  const alertas: ProductReorderAnalysis[] = useMemo(() => {
    const universo =
      warehouseId && warehouseId !== 'TODOS'
        ? products.filter((p) => (p as any).warehouseId === warehouseId)
        : products;

    return universo
      .map((p) =>
        calculateProductReorderStatus(
          p,
          purchaseOrders || [],
          (reorderConfigs || []).find((c) => c.productId === p.id),
          supplierProducts || [],
          suppliers || []
        )
      )
      .filter((a) => a.isRiskOfStockout)
      .sort((a, b) => {
        // Primero lo que ya está en cero, luego por días de inventario restante.
        if (a.availableStock === 0 && b.availableStock !== 0) return -1;
        if (b.availableStock === 0 && a.availableStock !== 0) return 1;
        return a.daysOfInventoryLeft - b.daysOfInventoryLeft;
      });
  }, [products, purchaseOrders, reorderConfigs, supplierProducts, suppliers, warehouseId, lastSyncTimestamp]);

  /** Solicitudes de compra ya abiertas, para no duplicar el aviso. */
  const solicitudAbierta = (productId: string): string | null => {
    const abierta = (purchaseRequests || []).find(
      (pr: any) =>
        ['BORRADOR', 'PENDIENTE', 'PENDIENTE_AUTORIZACION', 'ENVIADA', 'APROBADA'].includes(pr.status) &&
        (pr.items || []).some((it: any) => it.productId === productId)
    );
    return abierta ? abierta.request_number || abierta.id : null;
  };

  const puedeSolicitar = can ? can('COMPRAS', 'CREATE') || can('INVENTARIO', 'CREATE') : true;

  const handleSolicitar = async (a: ProductReorderAnalysis) => {
    if (enviando) return;
    setEnviando(a.productId);
    try {
      const solicitud = await createPurchaseRequest({
        warehouseId: warehouseId && warehouseId !== 'TODOS' ? warehouseId : undefined,
        priority: a.availableStock === 0 ? 'URGENTE' : a.urgency === 'CRITICA' ? 'ALTA' : 'NORMAL',
        justification:
          `Generada desde la alerta de punto de reorden de Inventario. ` +
          `Existencia disponible ${a.availableStock} ${a.unit} contra punto de reorden ${a.reorderPoint} ${a.unit}. ` +
          `Cobertura estimada: ${a.daysOfInventoryLeft} día(s).`,
        items: [
          {
            productId: a.productId,
            productCode: a.productCode,
            productName: a.productName,
            unit: a.unit,
            quantity: a.suggestedPurchaseQuantity,
            estimatedUnitCost: a.unitCost,
            notes: a.explanation,
          },
        ],
        requestedBy: currentUser?.id,
        requestedByName: currentUser?.name,
      });

      const folio = (solicitud as any)?.folio || (solicitud as any)?.requestNumber || (solicitud as any)?.id || 'generada';
      setEnviados((prev) => ({ ...prev, [a.productId]: folio }));

      addNotification?.({
        title: 'Solicitud de compra generada',
        message: `${a.productCode}: ${fmt(a.suggestedPurchaseQuantity)} ${a.unit} solicitados a Compras (${folio}).`,
        type: 'EXITO',
        module: 'COMPRAS',
      });
    } catch (err: any) {
      addNotification?.({
        title: 'No se pudo generar la solicitud',
        message: err?.message || 'Revisa los permisos del módulo de Compras.',
        type: 'CRITICA',
        module: 'COMPRAS',
      });
    } finally {
      setEnviando(null);
    }
  };

  const enCero = alertas.filter((a) => a.availableStock === 0).length;
  const inversion = alertas.reduce((s, a) => s + (a.estimatedInvestment || 0), 0);

  if (alertas.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center gap-2.5">
          <Check className="h-5 w-5 text-emerald-600" />
          <div>
            <h3 className="text-xs font-bold text-emerald-900">Sin alertas de reorden</h3>
            <p className="text-[11px] text-emerald-700">
              Ningún material está por debajo de su punto de reorden con los filtros actuales.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-red-200 bg-white shadow-2xs overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-red-100 bg-red-50 px-4 py-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
        <div className="min-w-0">
          <h3 className="text-xs font-bold uppercase tracking-wider text-red-900">
            {alertas.length} material(es) bajo el punto de reorden
          </h3>
          <p className="text-[11px] text-red-700">
            {enCero > 0 && <span className="font-bold">{enCero} en cero · </span>}
            Reposición estimada: ${fmt(Math.round(inversion))} MXN
          </p>
        </div>

        {onNavigateToPurchases && (
          <button
            onClick={onNavigateToPurchases}
            className="no-print ml-auto flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-[11px] font-bold text-red-700 hover:bg-red-50 cursor-pointer"
          >
            Abrir Compras
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
        {alertas.map((a) => {
          const folioAbierto = solicitudAbierta(a.productId);
          const yaEnviado = enviados[a.productId];
          const cobertura = a.daysOfInventoryLeft;

          return (
            <div key={a.productId} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-slate-50">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {a.availableStock === 0 ? (
                    <PackageX className="h-3.5 w-3.5 shrink-0 text-red-600" />
                  ) : (
                    <Clock className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                  )}
                  <span className="truncate text-xs font-bold text-slate-900">{a.productName}</span>
                  <span className="shrink-0 rounded-sm bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">
                    {a.productCode}
                  </span>
                </div>

                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-slate-600">
                  <span>
                    Disponible <b className={a.availableStock === 0 ? 'text-red-600' : 'text-slate-900'}>{fmt(a.availableStock)}</b> {a.unit}
                  </span>
                  <span>
                    Punto de reorden <b className="text-slate-900">{fmt(a.reorderPoint)}</b>
                  </span>
                  {a.inTransitStock > 0 && (
                    <span className="text-blue-700">En tránsito <b>{fmt(a.inTransitStock)}</b></span>
                  )}
                  <span>
                    Cobertura{' '}
                    <b className={cobertura <= a.leadTimeDays ? 'text-red-600' : 'text-slate-900'}>
                      {cobertura} d
                    </b>{' '}
                    <span className="text-slate-400">(entrega {a.leadTimeDays} d)</span>
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Sugerido</div>
                  <div className="font-mono text-sm font-bold text-slate-900">
                    {fmt(a.suggestedPurchaseQuantity)} <span className="text-[10px] font-normal">{a.unit}</span>
                  </div>
                </div>

                {yaEnviado ? (
                  <span className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700">
                    <Check className="h-3.5 w-3.5" />
                    {yaEnviado}
                  </span>
                ) : folioAbierto ? (
                  <span
                    className="rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-500"
                    title="Ya existe una solicitud abierta para este material"
                  >
                    En trámite · {folioAbierto}
                  </span>
                ) : (
                  <button
                    onClick={() => handleSolicitar(a)}
                    disabled={!puedeSolicitar || enviando === a.productId}
                    title={
                      puedeSolicitar
                        ? 'Genera una solicitud de compra con la cantidad sugerida'
                        : 'Tu rol no tiene permiso para generar solicitudes de compra'
                    }
                    className="no-print flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    {enviando === a.productId ? 'Enviando...' : 'Solicitar'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-slate-100 bg-slate-50 px-4 py-2">
        <p className="text-[10px] leading-relaxed text-slate-500">
          El punto de reorden considera consumo diario promedio, tiempo de entrega del
          proveedor, stock de seguridad y mercancía en tránsito. La solicitud queda
          pendiente de autorización en Compras; no genera orden ni compromete presupuesto.
        </p>
      </div>
    </div>
  );
};
