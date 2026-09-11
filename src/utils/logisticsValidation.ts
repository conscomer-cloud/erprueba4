import { Order, Picking } from '../types/erp';

export type LogisticsReadinessStatus =
  | 'PENDIENTE_PICKING'
  | 'PICKING_EN_PROCESO'
  | 'PENDIENTE_VERIFICACION'
  | 'PENDIENTE_SURTIDO_FISICO'
  | 'LISTO_PARA_LOGISTICA'
  | 'EN_TRANSITO'
  | 'ENTREGADO'
  | 'CANCELADO';

export interface LogisticsReadinessResult {
  isReady: boolean;
  status: LogisticsReadinessStatus;
  badgeLabel: string;
  badgeColor: string; // Tailwind classes
  reason: string;
  errorCode?: string;
  shippableItems: Array<{
    orderItemId: string;
    productId: string;
    productName: string;
    sku: string;
    orderedQty: number;
    fulfilledQty: number;
    shippableQty: number;
    pendingQty: number;
  }>;
  totalShippableQty: number;
}

/**
 * Validador Canónico del Bloqueo Operativo de Logística
 * Regla: LOGÍSTICA NO PUEDE actuar si el pedido no cuenta con:
 * 1. Picking persistido
 * 2. Picking COMPLETADO o VERIFICADO
 * 3. Surtido físico confirmado en Almacén (inventario afectado y fulfilledAt)
 */
export function validateLogisticsReadiness(
  order: Order | null | undefined,
  picking: Picking | null | undefined
): LogisticsReadinessResult {
  if (!order) {
    return {
      isReady: false,
      status: 'CANCELADO',
      badgeLabel: 'NO ENCONTRADO',
      badgeColor: 'bg-slate-100 text-slate-600',
      reason: 'El pedido no fue encontrado.',
      errorCode: 'ORDER_NOT_FOUND',
      shippableItems: [],
      totalShippableQty: 0,
    };
  }

  if (order.status === 'CANCELADO' || (order as any).status === 'RECHAZADO') {
    return {
      isReady: false,
      status: 'CANCELADO',
      badgeLabel: 'CANCELADO',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
      reason: 'El pedido se encuentra cancelado. Operación de logística bloqueada.',
      errorCode: 'ORDER_CANCELLED',
      shippableItems: [],
      totalShippableQty: 0,
    };
  }

  // Verificar si ya está en ruta o entregado
  if (order.status === 'EN RUTA' || (order as any).status === 'EN_RUTA') {
    return {
      isReady: true,
      status: 'EN_TRANSITO',
      badgeLabel: 'EN TRÁNSITO',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      reason: 'El pedido ya se encuentra en tránsito en una ruta activa.',
      shippableItems: [],
      totalShippableQty: 0,
    };
  }

  if (order.status === 'ENTREGADO') {
    return {
      isReady: true,
      status: 'ENTREGADO',
      badgeLabel: 'ENTREGADO',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      reason: 'El pedido ya ha sido entregado en destino con POD.',
      shippableItems: [],
      totalShippableQty: 0,
    };
  }

  // 1. Bloqueo: Sin Picking
  if (!picking) {
    return {
      isReady: false,
      status: 'PENDIENTE_PICKING',
      badgeLabel: 'PENDIENTE DE PICKING',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
      reason: 'Pedido bloqueado para Logística. No existe una Hoja de Picking generada en Almacén.',
      errorCode: 'LOGISTICS_BLOCKED_NO_PICKING',
      shippableItems: [],
      totalShippableQty: 0,
    };
  }

  // 2. Bloqueo: Picking PENDIENTE o EN_PROCESO
  if (picking.status === 'PENDIENTE') {
    return {
      isReady: false,
      status: 'PENDIENTE_PICKING',
      badgeLabel: 'PENDIENTE DE PICKING',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      reason: 'Pedido bloqueado para Logística. La recolección de mercancía (Picking) aún no ha iniciado.',
      errorCode: 'LOGISTICS_BLOCKED_PICKING_PENDING',
      shippableItems: [],
      totalShippableQty: 0,
    };
  }

  if (picking.status === 'EN_PROCESO') {
    return {
      isReady: false,
      status: 'PICKING_EN_PROCESO',
      badgeLabel: 'PICKING EN PROCESO',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
      reason: 'Pedido bloqueado para Logística. El proceso de Picking se encuentra actualmente en recolección en Almacén.',
      errorCode: 'LOGISTICS_BLOCKED_PICKING_IN_PROGRESS',
      shippableItems: [],
      totalShippableQty: 0,
    };
  }

  // 3. Bloqueo: Picking COMPLETADO o VERIFICADO pero Surtido Físico NO Confirmado
  const isPhysicalFulfillmentConfirmed = Boolean(
    order.fulfilledAt ||
    order.fulfilled_at ||
    (order as any).physicalFulfillmentConfirmed === true ||
    picking.status === 'SURTIDO_FISICO_CONFIRMADO' ||
    (picking as any).physicalFulfillmentConfirmed === true ||
    ((order.status === 'SURTIDO' || (order.status as any) === 'SURTIDO_PARCIAL' || (order.status as any) === 'EN SURTIDO' || (order.status as any) === 'EN_SURTIDO') && (
      order.fulfillmentStatus === 'SURTIDO' ||
      (order.fulfillmentStatus as any) === 'SURTIDO_TOTAL' ||
      (order.fulfillmentStatus as any) === 'SURTIDO_PARCIAL' ||
      order.fulfillmentStatus === 'PARCIAL'
    ))
  );

  if (!isPhysicalFulfillmentConfirmed) {
    if (picking.status === 'COMPLETADO' && !picking.verifiedAt && !picking.verificationSignature) {
      return {
        isReady: false,
        status: 'PENDIENTE_VERIFICACION',
        badgeLabel: 'PENDIENTE DE VERIFICACIÓN',
        badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
        reason: 'Pedido bloqueado para Logística. El picking fue registrado pero está pendiente de verificación y firma por el Jefe de Almacén.',
        errorCode: 'LOGISTICS_BLOCKED_PENDING_VERIFICATION',
        shippableItems: [],
        totalShippableQty: 0,
      };
    }

    return {
      isReady: false,
      status: 'PENDIENTE_SURTIDO_FISICO',
      badgeLabel: 'PENDIENTE DE SURTIDO FÍSICO',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      reason: 'Pedido bloqueado para Logística. El surtido físico aún no ha sido confirmado por Almacén.',
      errorCode: 'LOGISTICS_BLOCKED_PENDING_FULFILLMENT',
      shippableItems: [],
      totalShippableQty: 0,
    };
  }

  // 4. Calcular cantidades autorizadas para embarque (Política de Surtido Parcial)
  const shippableItems = (order.items || []).map((item) => {
    const orderedQty = item.quantityOrdered || item.quantity || 0;
    
    // Buscar en picking el pickedQty
    const pickingItem = picking.items?.find(
      (pi) => pi.orderItemId === item.id || pi.productId === item.productId || (pi.productCode && pi.productCode === item.sku)
    );

    const pickedQty = (pickingItem?.pickedQty !== undefined && pickingItem?.pickedQty !== null)
      ? pickingItem.pickedQty
      : (pickingItem?.qtyPicked !== undefined ? pickingItem.qtyPicked : 0);

    // Cantidad surtida físicamente registrada en el pedido o en picking
    const itemFulfilled = item.quantityFulfilled !== undefined && item.quantityFulfilled !== null
      ? item.quantityFulfilled
      : pickedQty;

    // Regla estricta: Máximo disponible para carga = cantidad surtida físicamente confirmada
    const shippableQty = Math.min(orderedQty, Math.max(0, itemFulfilled));
    const pendingQty = Math.max(0, orderedQty - shippableQty);

    return {
      orderItemId: item.id,
      productId: item.productId,
      productName: item.productName,
      sku: item.sku || (item as any).productCode || '',
      orderedQty,
      fulfilledQty: itemFulfilled,
      shippableQty,
      pendingQty,
    };
  });

  const totalShippableQty = shippableItems.reduce((acc, itm) => acc + itm.shippableQty, 0);

  if (totalShippableQty <= 0) {
    return {
      isReady: false,
      status: 'PENDIENTE_SURTIDO_FISICO',
      badgeLabel: 'PENDIENTE DE SURTIDO FÍSICO',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      reason: 'Pedido bloqueado para Logística. La cantidad surtida física confirmada es 0 piezas.',
      errorCode: 'LOGISTICS_BLOCKED_ZERO_FULFILLED',
      shippableItems,
      totalShippableQty: 0,
    };
  }

  const isPartial = shippableItems.some((itm) => itm.pendingQty > 0);

  return {
    isReady: true,
    status: 'LISTO_PARA_LOGISTICA',
    badgeLabel: isPartial ? 'LISTO (SURTIDO PARCIAL)' : 'LISTO PARA LOGÍSTICA',
    badgeColor: isPartial
      ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
      : 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold',
    reason: isPartial
      ? `Surtido parcial confirmado (${totalShippableQty} pzas). Habilitado para embarcar exclusivamente las unidades confirmadas.`
      : 'Surtido físico confirmado en Almacén. Habilitado para programación de ruta y despacho.',
    shippableItems,
    totalShippableQty,
  };
}
