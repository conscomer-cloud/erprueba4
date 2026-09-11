/**
 * @license
 * CONSCORE ERP IA - Quote & Order Transactional Service (Fase 0.1)
 * 
 * Flujo Transaccional Obligatorio:
 * COTIZACIÓN ACEPTADA
 * ↓
 * CREAR PEDIDO
 * ↓
 * VALIDAR PRODUCTOS
 * ↓
 * VALIDAR INVENTARIO
 * ↓
 * RESERVAR INVENTARIO
 * ↓
 * CREAR PEDIDO
 * ↓
 * REGISTRAR AUDITORÍA
 */

import { db } from '../db/database';
import {
  Quote,
  Order,
  OrderItem,
  User,
  InventoryMovement,
  Product,
} from '../../src/types/erp';
import { eventBus } from './eventBus';
import { QuotePricingService } from '../../src/services/quotePricingService';
import { normalizePaymentTerms, DEFAULT_PAYMENT_TERMS } from '../../src/services/quotePaymentTermsService';
import { QuoteFinancialApprovalService } from '../../src/services/quoteFinancialApprovalService';

export interface ConvertQuoteToOrderResult {
  success: boolean;
  order?: Order;
  quote?: Quote;
  error?: string;
  code?: string;
  stockErrors?: {
    productName: string;
    productCode: string;
    requested: number;
    available: number;
    missing: number;
  }[];
}

export class QuoteOrderService {
  /**
   * Conversión Atómica y Transaccional de Cotización a Pedido con Reserva de Inventario
   */
  public static convertQuoteToOrder(
    quoteId: string,
    warehouseId: string,
    user: User,
    options?: {
      deliveryDate?: string;
      deliveryAddress?: string;
      notes?: string;
    }
  ): ConvertQuoteToOrderResult {
    const quotes = db.getQuotes();
    const quote = quotes.find(q => q.id === quoteId || q.quote_number === quoteId || (q as any).folio === quoteId);

    if (!quote) {
      return {
        success: false,
        error: 'La cotización requiere autorización de Finanzas antes de generar el pedido.',
        code: 'FINANCIAL_APPROVAL_REQUIRED',
      };
    }

    if (quote.converted_to_order_id) {
      return {
        success: false,
        error: `Operación cancelada: Esta cotización ya fue convertida previamente al Pedido ${quote.converted_to_order_number || quote.converted_to_order_id}.`,
        code: 'ALREADY_CONVERTED',
      };
    }

    if (quote.status === 'CANCELADA' || quote.status === 'RECHAZADA' || quote.status === 'VENCIDA') {
      return {
        success: false,
        error: `No es posible convertir una cotización con estado "${quote.status}". Debe encontrarse en estado Válido o Aceptado.`,
        code: 'INVALID_STATUS',
      };
    }

    // HOTFIX 07: Validar que no tenga descuentos pendientes de autorización
    const orderConversionPricingCheck = QuotePricingService.validateQuoteForOrderConversion(quote);
    if (!orderConversionPricingCheck.allowed) {
      return {
        success: false,
        error: orderConversionPricingCheck.error || 'DISCOUNT_APPROVAL_REQUIRED: Descuento pendiente de autorización.',
        code: orderConversionPricingCheck.code || 'DISCOUNT_APPROVAL_REQUIRED',
      };
    }

    // OBSERVACIÓN 16: Control Obligatorio de Finanzas antes de Cotización -> Pedido
    const financialCheck = QuoteFinancialApprovalService.validateForOrderConversion(quote);
    if (!financialCheck.allowed) {
      db.logAudit({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        module: 'COTIZACIONES',
        action: 'QUOTE_TO_ORDER_BLOCKED_NO_FINANCIAL_APPROVAL',
        entity_type: 'QUOTE',
        entity_id: quote.quote_number || (quote as any).folio || quote.id,
        new_value: `Conversión bloqueada: ${financialCheck.error}`,
        master_transaction_id: quote.masterTransactionId || quote.master_transaction_id,
      });
      return {
        success: false,
        error: financialCheck.error || 'La cotización requiere autorización de Finanzas antes de generar el pedido.',
        code: financialCheck.code || 'FINANCIAL_APPROVAL_REQUIRED',
      };
    }

    if (!quote.items || quote.items.length === 0) {
      return {
        success: false,
        error: 'La cotización no contiene partidas de productos para procesar.',
      };
    }

    const warehouse = db.getWarehouses().find(w => w.id === warehouseId) || db.getWarehouses()[0];
    const products = db.getProducts();

    // 1. VALIDACIÓN DE EXISTENCIA Y STOCK DISPONIBLE (FASE PRE-TRANSACCIONAL)
    const stockErrors: {
      productName: string;
      productCode: string;
      requested: number;
      available: number;
      missing: number;
    }[] = [];

    const productsToUpdate: { product: Product; requestedQty: number }[] = [];

    for (const item of quote.items) {
      const product = products.find(p => p.id === item.product_id);
      if (!product) {
        return {
          success: false,
          error: `Error de catálogo: El producto "${item.product_name}" (ID: ${item.product_id}) no existe en la base de datos.`,
        };
      }

      const available = product.available_stock;
      if (item.quantity > available) {
        stockErrors.push({
          productName: product.name,
          productCode: product.code,
          requested: item.quantity,
          available,
          missing: item.quantity - available,
        });
      } else {
        productsToUpdate.push({ product, requestedQty: item.quantity });
      }
    }

    // SI HAY INVENTARIO INSUFICIENTE: ABORTAR TRANSACCIÓN Y REGISTRAR EN AUDITORÍA
    if (stockErrors.length > 0) {
      const errorMsgLines = stockErrors.map(
        e => `• ${e.productName} (${e.productCode}): Solicitado ${e.requested}, Disponible ${e.available}, Faltante ${e.missing}`
      );

      const combinedError = `Inventario insuficiente para completar el pedido:\n${errorMsgLines.join('\n')}`;

      db.logAudit({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        module: 'PEDIDOS',
        action: 'CONVERSION_FALLIDA_STOCK_INSUFICIENTE',
        entity_type: 'QUOTE',
        entity_id: quote.quote_number,
        new_value: combinedError,
      });

      return {
        success: false,
        error: combinedError,
        stockErrors,
      };
    }

    // 2. EJECUCIÓN TRANSACCIONAL ATÓMICA

    // A) Generar nuevo folio de Pedido
    const orderNumber = db.nextOrderNumber();
    const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;

    // Snapshot para Rollback de seguridad
    const rollbackSnapshots = productsToUpdate.map(p => ({
      product: p.product,
      prevReserved: p.product.reserved_stock,
      prevAvailable: p.product.available_stock,
    }));

    try {
      // B) Reservar inventario y registrar movimientos
      const movementsRegistered: InventoryMovement[] = [];

      for (const entry of productsToUpdate) {
        const { product, requestedQty } = entry;
        const prevAvailable = product.available_stock;
        
        product.reserved_stock += requestedQty;
        product.available_stock = product.physical_stock - product.reserved_stock;
        product.updated_at = new Date().toISOString();

        // Register Movement entity
        const movId = db.nextMovementNumber();
        const movement: InventoryMovement = {
          id: movId,
          product_id: product.id,
          product_code: product.code,
          product_name: product.name,
          warehouse_id: warehouse.id,
          warehouse_name: warehouse.name,
          type: 'RESERVA',
          quantity: requestedQty,
          previous_balance: prevAvailable,
          new_balance: product.available_stock,
          reason: `Reserva automática por confirmación de Pedido ${orderNumber} (desde ${quote.quote_number})`,
          reference_type: 'PEDIDO',
          reference_id: orderId,
          reference_folio: orderNumber,
          created_by: user.id,
          created_by_name: user.name,
          created_at: new Date().toISOString(),
        };

        db.getMovements().unshift(movement);
        movementsRegistered.push(movement);
      }

      // C) Crear entidad Order
      const deliveryDate = options?.deliveryDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const deliveryAddress = options?.deliveryAddress || 'Dirección fiscal / Entrega en planta del cliente';

      const orderItems: OrderItem[] = quote.items.map(item => ({
        id: `OIT-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        order_id: orderId,
        product_id: item.product_id,
        product_code: item.product_code,
        product_name: item.product_name,
        unit: item.unit,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
      }));

      const newOrder: Order = {
        id: orderId,
        order_number: orderNumber,
        quote_id: quote.id,
        quote_number: quote.quote_number,
        customer_id: quote.customer_id,
        customer_name: quote.customer_name,
        salesperson_id: quote.salesperson_id,
        salesperson_name: quote.salesperson_name,
        warehouse_id: warehouse.id,
        warehouse_name: warehouse.name,
        status: 'RESERVADO',
        subtotal: quote.subtotal,
        discount: quote.discount || 0,
        tax: quote.tax,
        total: quote.total,
        delivery_date: deliveryDate,
        delivery_address: deliveryAddress,
        payment_terms: normalizePaymentTerms(quote.paymentTerms || (quote as any).payment_terms),
        paymentTerms: normalizePaymentTerms(quote.paymentTerms || (quote as any).payment_terms),
        notes: `Generado automáticamente desde ${quote.quote_number}. ${options?.notes || quote.notes || ''}`,
        items: orderItems,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      db.getOrders().unshift(newOrder);

      // D) Actualizar estado de la Cotización
      quote.status = 'ACEPTADA';
      quote.converted_to_order_id = orderId;
      quote.converted_to_order_number = orderNumber;
      quote.updated_at = new Date().toISOString();

      // E) Registrar Auditoría
      db.logAudit({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        module: 'PEDIDOS',
        action: 'CONVERSION_COTIZACION_A_PEDIDO',
        entity_type: 'ORDER',
        entity_id: orderNumber,
        previous_value: `Cotización ${quote.quote_number} (${quote.status})`,
        new_value: `Pedido ${orderNumber} por $${quote.total.toLocaleString('es-MX')} MXN creado con éxito. Stock reservado en ${warehouse.name}.`,
      });

      // F) Crear Notificación para el equipo
      db.getNotifications().unshift({
        id: `NOT-${Date.now().toString(36)}`,
        title: `Nuevo Pedido Confirmado: ${orderNumber}`,
        message: `Cotización ${quote.quote_number} convertida a Pedido ${orderNumber} ($${quote.total.toLocaleString('es-MX')} MXN) para ${quote.customer_name}. Inventario reservado.`,
        type: 'EXITO',
        module: 'PEDIDOS',
        read: false,
        created_at: new Date().toISOString(),
      });

      // Persistir todo en disco atómicamente
      db.persist();

      // Emitir eventos en tiempo real a clientes conectados
      eventBus.broadcast('order_created', {
        order: newOrder,
        quote,
        timestamp: new Date().toISOString(),
      });

      eventBus.broadcast('inventory_reserved', {
        orderNumber,
        products: productsToUpdate.map(p => ({
          code: p.product.code,
          name: p.product.name,
          reserved: p.requestedQty,
          availableNow: p.product.available_stock,
        })),
      });

      return {
        success: true,
        order: newOrder,
        quote,
      };
    } catch (transactionError: any) {
      // ROLLBACK EN CASO DE ERROR NO CONTROLADO
      console.error('[TRANSACTION ROLLBACK] Error procesando conversión de pedido:', transactionError);

      for (const snap of rollbackSnapshots) {
        snap.product.reserved_stock = snap.prevReserved;
        snap.product.available_stock = snap.prevAvailable;
      }

      db.logAudit({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        module: 'PEDIDOS',
        action: 'ROLLBACK_CONVERSION_PEDIDO',
        entity_type: 'QUOTE',
        entity_id: quote.quote_number,
        new_value: `Transacción abortada y revertida: ${transactionError?.message || 'Error desconocido'}`,
      });

      return {
        success: false,
        error: `Error interno al procesar transacción: ${transactionError?.message || 'Transacción revertida'}.`,
      };
    }
  }
}
