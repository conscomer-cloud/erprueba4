/**
 * @license
 * CONSCORE ERP IA - Purchases, Suppliers & Intelligent Replenishment Context Handlers
 * FASE 4: Operaciones transaccionales de compras, órdenes, recepciones e integración con almacén
 */

import React from 'react';
import {
  Supplier,
  SupplierContact,
  SupplierProduct,
  PurchasePriceHistory,
  PurchaseRequest,
  PurchaseRequestItem,
  PurchaseOrder,
  PurchaseOrderItem,
  GoodsReceipt,
  GoodsReceiptItem,
  SupplierReturn,
  SupplierReturnItem,
  ReorderConfig,
  PurchaseApprovalLimit,
  Product,
  Warehouse,
  InventoryMovement,
  AuditLog,
  NotificationItem,
  UserRole,
} from '../types/erp';

export interface PurchasesHandlersParams {
  currentUser: { id: string; name: string; role: UserRole } | null;
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  supplierContacts: SupplierContact[];
  setSupplierContacts: React.Dispatch<React.SetStateAction<SupplierContact[]>>;
  supplierProducts: SupplierProduct[];
  setSupplierProducts: React.Dispatch<React.SetStateAction<SupplierProduct[]>>;
  purchasePriceHistory: PurchasePriceHistory[];
  setPurchasePriceHistory: React.Dispatch<React.SetStateAction<PurchasePriceHistory[]>>;
  purchaseRequests: PurchaseRequest[];
  setPurchaseRequests: React.Dispatch<React.SetStateAction<PurchaseRequest[]>>;
  purchaseOrders: PurchaseOrder[];
  setPurchaseOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
  goodsReceipts: GoodsReceipt[];
  setGoodsReceipts: React.Dispatch<React.SetStateAction<GoodsReceipt[]>>;
  supplierReturns: SupplierReturn[];
  setSupplierReturns: React.Dispatch<React.SetStateAction<SupplierReturn[]>>;
  reorderConfigs: ReorderConfig[];
  setReorderConfigs: React.Dispatch<React.SetStateAction<ReorderConfig[]>>;
  purchaseApprovalLimits: PurchaseApprovalLimit[];
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  warehouses: Warehouse[];
  movements: InventoryMovement[];
  setMovements: React.Dispatch<React.SetStateAction<InventoryMovement[]>>;
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
  addAuditLog: (entry: { action: string; module: any; recordId?: string; details: string; customUser?: any }) => void;
  addNotification: (notif: { title: string; message: string; type: NotificationItem['type']; module: any }) => void;
  broadcastDataUpdate: (type: string, details: any) => void;
}

export function createPurchasesHandlers(params: PurchasesHandlersParams) {
  const {
    currentUser,
    suppliers,
    setSuppliers,
    supplierContacts,
    setSupplierContacts,
    supplierProducts,
    setSupplierProducts,
    purchasePriceHistory,
    setPurchasePriceHistory,
    purchaseRequests,
    setPurchaseRequests,
    purchaseOrders,
    setPurchaseOrders,
    goodsReceipts,
    setGoodsReceipts,
    supplierReturns,
    setSupplierReturns,
    reorderConfigs,
    setReorderConfigs,
    purchaseApprovalLimits,
    products,
    setProducts,
    warehouses,
    movements,
    setMovements,
    setAuditLogs,
    addAuditLog,
    addNotification,
    broadcastDataUpdate,
  } = params;

  const now = () => new Date().toISOString();
  const todayDate = () => new Date().toISOString().slice(0, 10);
  const user = currentUser || { id: 'USR-006', name: 'Jefe de Compras', role: 'COMPRAS' as UserRole };

  // ==========================================
  // 1. GESTIÓN DE PROVEEDORES & CONTACTOS
  // ==========================================
  const addSupplier = (supplierData: Omit<Supplier, 'id'>): Supplier => {
    const id = `SUP-${String(suppliers.length + 1).padStart(2, '0')}`;
    const newSupplier: Supplier = {
      ...supplierData,
      id,
      rating: supplierData.rating || 5,
      otif_score: supplierData.otif_score || 95,
      quality_score: supplierData.quality_score || 98,
      status: supplierData.status || 'ACTIVO',
      created_at: now(),
    };

    setSuppliers((prev) => [newSupplier, ...prev]);

    addAuditLog({
      action: 'CREAR_PROVEEDOR',
      module: 'COMPRAS',
      recordId: id,
      details: `Alta de proveedor: ${newSupplier.name} (RFC: ${newSupplier.rfc || newSupplier.tax_id || 'N/A'}).`,
    });

    addNotification({
      title: 'Nuevo Proveedor Registrado',
      message: `${newSupplier.name} ha sido dado de alta en el catálogo de compras.`,
      type: 'EXITO',
      module: 'COMPRAS',
    });

    return newSupplier;
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates, updated_at: now() } : s))
    );

    addAuditLog({
      action: 'ACTUALIZAR_PROVEEDOR',
      module: 'COMPRAS',
      recordId: id,
      details: `Proveedor ${id} actualizado.`,
    });
  };

  const deleteSupplier = (id: string): { success: boolean; error?: string } => {
    const hasActiveOrders = purchaseOrders.some(
      (po) => po.supplier_id === id && !['RECEIVED', 'CANCELLED'].includes(po.status)
    );
    if (hasActiveOrders) {
      return {
        success: false,
        error: 'No se puede eliminar el proveedor porque tiene órdenes de compra activas en proceso.',
      };
    }

    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    addAuditLog({
      action: 'ELIMINAR_PROVEEDOR',
      module: 'COMPRAS',
      recordId: id,
      details: `Proveedor ${id} eliminado del catálogo.`,
    });
    return { success: true };
  };

  const addSupplierContact = (contactData: Omit<SupplierContact, 'id'>): SupplierContact => {
    const id = `CNT-${Date.now().toString(36).toUpperCase()}`;
    const newContact: SupplierContact = {
      ...contactData,
      id,
      supplier_id: contactData.supplier_id || contactData.supplierId,
      status: contactData.status || 'ACTIVO',
    };

    setSupplierContacts((prev) => [...prev, newContact]);
    return newContact;
  };

  const updateSupplierContact = (id: string, updates: Partial<SupplierContact>) => {
    setSupplierContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const deleteSupplierContact = (id: string) => {
    setSupplierContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const addSupplierProduct = (spData: Omit<SupplierProduct, 'id'>): SupplierProduct => {
    const id = `SP-${Date.now().toString(36).toUpperCase()}`;
    const newSP: SupplierProduct = {
      ...spData,
      id,
      supplier_id: spData.supplier_id || spData.supplierId,
      product_id: spData.product_id || spData.productId,
      status: spData.status || 'ACTIVO',
    };

    setSupplierProducts((prev) => [...prev, newSP]);
    return newSP;
  };

  const updateSupplierProduct = (id: string, updates: Partial<SupplierProduct>) => {
    setSupplierProducts((prev) =>
      prev.map((sp) => (sp.id === id ? { ...sp, ...updates } : sp))
    );
  };

  const deleteSupplierProduct = (id: string) => {
    setSupplierProducts((prev) => prev.filter((sp) => sp.id !== id));
  };

  // ==========================================
  // 2. SOLICITUDES DE COMPRA (PURCHASE REQUESTS)
  // ==========================================
  const createPurchaseRequest = (
    data: Omit<PurchaseRequest, 'id' | 'request_number' | 'created_at' | 'total_estimated_amount'> & {
      items: (Omit<PurchaseRequestItem, 'id'> & { id?: string })[];
    }
  ): { success: boolean; request: PurchaseRequest; error?: string } & PurchaseRequest => {
    try {
      const nextNum = purchaseRequests.length + 1;
      const request_number = `SC-2026-${String(nextNum).padStart(3, '0')}`;
      const id = `REQ-${Date.now().toString(36).toUpperCase()}`;

      const warehouse = warehouses.find((w) => w.id === data.warehouse_id);
      const warehouse_name = data.warehouse_name || warehouse?.name || 'Almacén Central';

      let total_estimated_amount = 0;
      const items: PurchaseRequestItem[] = (data.items || []).map((item, idx) => {
        const prod = products.find((p) => p.id === (item.product_id || (item as any).productId));
        const estimated_price =
          item.estimated_price !== undefined && !isNaN(Number(item.estimated_price))
            ? Number(item.estimated_price)
            : item.estimatedPrice !== undefined && !isNaN(Number(item.estimatedPrice))
            ? Number(item.estimatedPrice)
            : (item as any).estimated_unit_cost !== undefined && !isNaN(Number((item as any).estimated_unit_cost))
            ? Number((item as any).estimated_unit_cost)
            : (item as any).estimatedUnitCost !== undefined && !isNaN(Number((item as any).estimatedUnitCost))
            ? Number((item as any).estimatedUnitCost)
            : prod?.cost_price || prod?.cost || 0;

        const qty = Number(item.quantity) || 1;
        const total = qty * estimated_price;
        total_estimated_amount += total;

        return {
          ...item,
          id: item.id || `RQI-${id}-${idx + 1}`,
          request_id: id,
          product_id: item.product_id || (item as any).productId || prod?.id || '',
          product_code: item.product_code || (item as any).productCode || prod?.code || 'PRD',
          product_name: item.product_name || (item as any).productName || prod?.name || 'Producto',
          unit: item.unit || prod?.unit || 'PZA',
          quantity: qty,
          estimated_price,
          estimatedPrice: estimated_price,
          estimated_unit_cost: estimated_price,
          estimatedUnitCost: estimated_price,
          total_estimated: total,
          estimated_total: total,
        };
      });

      const requested_by = data.requested_by || (data as any).requester_id || user.id;
      const requested_by_name = data.requested_by_name || (data as any).requester_name || user.name;

      const newRequest: PurchaseRequest = {
        ...data,
        id,
        request_number,
        requested_by,
        requested_by_name,
        requester_id: requested_by,
        requester_name: requested_by_name,
        department: data.department || 'Operaciones / Almacén',
        warehouse_id: data.warehouse_id || warehouses[0]?.id || 'ALM-01',
        warehouse_name,
        priority: data.priority || 'MEDIA',
        justification: data.justification || 'Solicitud de reposición operativa',
        status: data.status || 'PENDIENTE_APROBACION',
        required_date: data.required_date || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        notes: data.notes || '',
        total_estimated_amount,
        estimated_total: total_estimated_amount,
        items,
        created_at: now(),
        submitted_at: now(),
      };

      setPurchaseRequests((prev) => [newRequest, ...prev]);

      addAuditLog({
        action: 'CREAR_SOLICITUD_COMPRA',
        module: 'COMPRAS',
        recordId: request_number,
        details: `Solicitud de compra ${request_number} creada por ${requested_by_name} (${items.length} partidas, total estimado: $${(Number(total_estimated_amount) || 0).toLocaleString('es-MX')} MXN). Justificación: ${newRequest.justification}`,
      });

      addNotification({
        title: 'Nueva Solicitud de Compra',
        message: `${request_number} generada para ${warehouse_name} ($${(Number(total_estimated_amount) || 0).toLocaleString('es-MX')} MXN).`,
        type: 'INFO',
        module: 'COMPRAS',
      });

      broadcastDataUpdate('PURCHASE_REQUEST_CREATED', {
        requestNumber: request_number,
        userName: user.name,
        summary: `Solicitud de compra ${request_number} registrada`,
      });

      return {
        ...newRequest,
        success: true,
        request: newRequest,
      };
    } catch (err: any) {
      console.error('Error in createPurchaseRequest:', err);
      return {
        success: false,
        error: err?.message || 'Error al crear la solicitud de compra',
      } as any;
    }
  };

  const updatePurchaseRequest = (id: string, updates: Partial<PurchaseRequest>) => {
    setPurchaseRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  const submitPurchaseRequest = (id: string) => {
    setPurchaseRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: 'SUBMITTED', submitted_at: now() } : r
      )
    );
  };

  const approvePurchaseRequest = (
    id: string,
    options?: { approverId?: string; approverName?: string; notes?: string }
  ): { success: boolean; error?: string } => {
    const req = purchaseRequests.find((r) => r.id === id);
    if (!req) return { success: false, error: 'Solicitud no encontrada' };

    const approverId = options?.approverId || user.id;
    const approverName = options?.approverName || user.name;

    setPurchaseRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'APPROVED',
              approved_by: approverId,
              approved_by_name: approverName,
              approved_at: now(),
              notes: options?.notes ? `${r.notes || ''}\n[Aprobación]: ${options.notes}` : r.notes,
            }
          : r
      )
    );

    addAuditLog({
      action: 'APROBACION_SOLICITUD_COMPRA',
      module: 'COMPRAS',
      recordId: req.request_number,
      details: `Solicitud ${req.request_number} aprobada por ${approverName}. Lista para cotización o generación de Orden de Compra.`,
    });

    addNotification({
      title: 'Solicitud de Compra Aprobada',
      message: `${req.request_number} aprobada por ${approverName}.`,
      type: 'EXITO',
      module: 'COMPRAS',
    });

    return { success: true };
  };

  const rejectPurchaseRequest = (id: string, reason: string): { success: boolean; error?: string } => {
    const req = purchaseRequests.find((r) => r.id === id);
    if (!req) return { success: false, error: 'Solicitud no encontrada' };

    setPurchaseRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'REJECTED',
              rejection_reason: reason,
              reviewed_by: user.id,
              reviewed_by_name: user.name,
              reviewed_at: now(),
            }
          : r
      )
    );

    addAuditLog({
      action: 'RECHAZO_SOLICITUD_COMPRA',
      module: 'COMPRAS',
      recordId: req.request_number,
      details: `Solicitud ${req.request_number} rechazada por ${user.name}. Motivo: ${reason}`,
    });

    return { success: true };
  };

  const convertRequestToPurchaseOrder = (
    requestId: string,
    options: {
      supplierId: string;
      supplierName?: string;
      customPrices?: Record<string, number>;
      paymentTerms?: string;
      expectedDeliveryDate?: string;
      warehouseId?: string;
    }
  ): { success: boolean; purchaseOrder?: PurchaseOrder; error?: string } => {
    const req = purchaseRequests.find((r) => r.id === requestId);
    if (!req) return { success: false, error: 'Solicitud no encontrada' };

    const supplier = suppliers.find((s) => s.id === options.supplierId);
    const supplierName = options.supplierName || supplier?.name || 'Proveedor Homologado';

    const nextPoNum = purchaseOrders.length + 1;
    const purchase_order_number = `OC-2026-${String(nextPoNum).padStart(3, '0')}`;
    const poId = `PO-${Date.now().toString(36).toUpperCase()}`;

    let subtotal = 0;
    const poItems: PurchaseOrderItem[] = req.items.map((item, idx) => {
      const unit_price =
        options.customPrices?.[item.product_id] !== undefined
          ? options.customPrices[item.product_id]
          : item.estimated_price;
      const itemSubtotal = item.quantity * unit_price;
      const itemTax = itemSubtotal * 0.16;
      subtotal += itemSubtotal;

      return {
        id: `POI-${poId}-${idx + 1}`,
        purchase_order_id: poId,
        product_id: item.product_id,
        product_code: item.product_code,
        product_name: item.product_name,
        unit: item.unit || 'Tramo',
        quantity_ordered: item.quantity,
        quantity_received: 0,
        quantity_pending: item.quantity,
        unit_price,
        discount: 0,
        tax_rate: 0.16,
        tax: itemTax,
        subtotal: itemSubtotal,
        total: itemSubtotal + itemTax,
        expected_date: options.expectedDeliveryDate || req.required_date,
      };
    });

    const tax = subtotal * 0.16;
    const total = subtotal + tax;

    const newPO: PurchaseOrder = {
      id: poId,
      purchase_order_number,
      supplier_id: options.supplierId,
      supplier_name: supplierName,
      purchase_request_id: req.id,
      purchase_request_number: req.request_number,
      order_date: todayDate(),
      expected_delivery_date: options.expectedDeliveryDate || req.required_date,
      warehouse_id: options.warehouseId || req.warehouse_id || 'WH-01',
      warehouse_name: req.warehouse_name || 'Almacén Central Tlalnepantla',
      buyer_id: user.id,
      buyer_name: user.name,
      payment_terms: options.paymentTerms || supplier?.payment_terms || 'Crédito 30 días',
      currency: 'MXN',
      exchange_rate: 1.0,
      subtotal,
      discount_total: 0,
      tax,
      shipping_cost: 0,
      other_costs: 0,
      landed_cost_total: total,
      total,
      status: 'APPROVED',
      approved_by: user.id,
      approved_by_name: user.name,
      approved_at: now(),
      items: poItems,
      created_at: now(),
      origin: 'SOLICITUD',
    };

    setPurchaseOrders((prev) => [newPO, ...prev]);

    // Marcar solicitud como CONVERTED
    setPurchaseRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'CONVERTED',
              converted_purchase_order_id: poId,
              converted_purchase_order_number: purchase_order_number,
              converted_at: now(),
            }
          : r
      )
    );

    addAuditLog({
      action: 'CONVERSION_SOLICITUD_A_OC',
      module: 'COMPRAS',
      recordId: purchase_order_number,
      details: `Solicitud ${req.request_number} convertida a Orden de Compra ${purchase_order_number} asignada a ${supplierName} ($${(Number(total) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN).`,
    });

    addNotification({
      title: 'Orden de Compra Generada',
      message: `${purchase_order_number} creada a partir de ${req.request_number} para ${supplierName}.`,
      type: 'EXITO',
      module: 'COMPRAS',
    });

    return { success: true, purchaseOrder: newPO };
  };

  // ==========================================
  // 3. ÓRDENES DE COMPRA (PURCHASE ORDERS)
  // ==========================================
  const createPurchaseOrder = (
    data: Omit<PurchaseOrder, 'id' | 'purchase_order_number' | 'created_at'> & {
      items: (Omit<PurchaseOrderItem, 'id' | 'quantity_received' | 'quantity_pending'> & {
        id?: string;
        quantity_received?: number;
        quantity_pending?: number;
        unit_cost?: number;
        discount_percentage?: number;
        tax_percentage?: number;
      })[];
    }
  ): { success: boolean; purchaseOrder: PurchaseOrder; error?: string } & PurchaseOrder => {
    try {
      const nextNum = purchaseOrders.length + 1;
      const purchase_order_number = `OC-2026-${String(nextNum).padStart(3, '0')}`;
      const id = `PO-${Date.now().toString(36).toUpperCase()}`;

      const supplier = suppliers.find((s) => s.id === (data.supplier_id || (data as any).supplierId));
      const supplier_name = data.supplier_name || (data as any).supplierName || supplier?.name || 'Proveedor';

      let subtotal = 0;
      let tax = 0;
      const items: PurchaseOrderItem[] = (data.items || []).map((item, idx) => {
        const prod = products.find((p) => p.id === (item.product_id || (item as any).productId));
        const unit_price =
          item.unit_price !== undefined
            ? Number(item.unit_price)
            : item.unit_cost !== undefined
            ? Number(item.unit_cost)
            : (item as any).unitPrice !== undefined
            ? Number((item as any).unitPrice)
            : prod?.cost_price || prod?.cost || 0;

        const qtyOrdered = Number(item.quantity_ordered) || (item as any).quantity || 1;
        const discount = item.discount !== undefined ? Number(item.discount) : 0;
        const itemSubtotal = qtyOrdered * unit_price - discount;
        const itemTaxRate = item.tax_rate !== undefined ? Number(item.tax_rate) : 0.16;
        const itemTax = item.tax !== undefined ? Number(item.tax) : itemSubtotal * itemTaxRate;

        subtotal += itemSubtotal;
        tax += itemTax;

        return {
          ...item,
          id: item.id || `POI-${id}-${idx + 1}`,
          purchase_order_id: id,
          product_id: item.product_id || (item as any).productId || prod?.id || '',
          product_code: item.product_code || (item as any).productCode || prod?.code || 'PRD',
          product_name: item.product_name || (item as any).productName || prod?.name || 'Producto',
          unit: item.unit || prod?.unit || 'PZA',
          quantity_ordered: qtyOrdered,
          quantity_received: item.quantity_received || 0,
          quantity_pending: item.quantity_pending !== undefined ? item.quantity_pending : qtyOrdered,
          unit_price,
          discount,
          tax_rate: itemTaxRate,
          tax: itemTax,
          subtotal: itemSubtotal,
          total: itemSubtotal + itemTax,
        };
      });

      const shipping = Number(data.shipping_cost || (data as any).freight_cost || 0);
      const otherCosts = Number(data.other_costs || (data as any).insurance_cost || 0) + Number((data as any).customs_cost || 0);
      const total = subtotal + tax + shipping + otherCosts;
      const landed_cost_total = total;

      const newPO: PurchaseOrder = {
        ...data,
        id,
        purchase_order_number,
        supplier_id: data.supplier_id || (data as any).supplierId || supplier?.id || '',
        supplier_name,
        buyer_id: data.buyer_id || user.id,
        buyer_name: data.buyer_name || user.name,
        warehouse_id: data.warehouse_id || warehouses[0]?.id || 'ALM-01',
        warehouse_name: data.warehouse_name || warehouses.find((w) => w.id === data.warehouse_id)?.name || 'Almacén Principal',
        status: data.status || 'PENDING_APPROVAL',
        currency: data.currency || 'MXN',
        subtotal,
        tax,
        shipping_cost: shipping,
        other_costs: otherCosts,
        total,
        landed_cost_total,
        items,
        created_at: now(),
      };

      setPurchaseOrders((prev) => [newPO, ...prev]);

      // Link and update associated purchase request if applicable
      const linkedReqId = data.purchase_request_id || (data as any).fromRequestId || (data as any).prefilledPurchaseRequestId;
      if (linkedReqId) {
        setPurchaseRequests((prev) =>
          prev.map((pr) =>
            pr.id === linkedReqId
              ? {
                  ...pr,
                  status: 'CONVERTIDA_A_ORDEN' as any,
                  converted_purchase_order_id: id,
                  converted_purchase_order_number: purchase_order_number,
                  convertedPurchaseOrderId: id,
                  convertedPurchaseOrderNumber: purchase_order_number,
                }
              : pr
          )
        );
      }

      addAuditLog({
        action: 'CREAR_ORDEN_COMPRA',
        module: 'COMPRAS',
        recordId: purchase_order_number,
        details: `Orden de compra ${purchase_order_number} creada para ${newPO.supplier_name} por $${(Number(total) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN (${items.length} partidas).`,
      });

      addNotification({
        title: 'Orden de Compra Creada',
        message: `${purchase_order_number} para ${newPO.supplier_name} ($${(Number(total) || 0).toLocaleString('es-MX')} MXN) pendiente de autorización.`,
        type: 'INFO',
        module: 'COMPRAS',
      });

      return {
        ...newPO,
        success: true,
        purchaseOrder: newPO,
      };
    } catch (err: any) {
      console.error('Error in createPurchaseOrder:', err);
      return {
        success: false,
        error: err?.message || 'Error al crear la orden de compra',
      } as any;
    }
  };

  const updatePurchaseOrder = (id: string, updates: Partial<PurchaseOrder>) => {
    setPurchaseOrders((prev) =>
      prev.map((po) => (po.id === id ? { ...po, ...updates, updated_at: now() } : po))
    );
  };

  const submitPurchaseOrderForApproval = (id: string) => {
    setPurchaseOrders((prev) =>
      prev.map((po) => (po.id === id ? { ...po, status: 'PENDING_APPROVAL' } : po))
    );
  };

  const approvePurchaseOrder = (
    id: string,
    options?: { notes?: string }
  ): { success: boolean; error?: string } => {
    const po = purchaseOrders.find((p) => p.id === id);
    if (!po) return { success: false, error: 'Orden de compra no encontrada' };

    // Validar límite de autorización según rol
    const userRole = user.role;
    const limit = purchaseApprovalLimits.find((l) => l.role === userRole)?.max_amount_mxn || 0;

    if (userRole !== 'ADMINISTRADOR' && userRole !== 'DIRECTOR' && po.total > limit) {
      return {
        success: false,
        error: `El monto de la OC ($${(Number(po.total) || 0).toLocaleString('es-MX')} MXN) excede su límite de autorización ($${(Number(limit) || 0).toLocaleString('es-MX')} MXN). Se requiere autorización de Dirección General o Administración.`,
      };
    }

    setPurchaseOrders((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status: 'APPROVED',
              approved_by: user.id,
              approved_by_name: user.name,
              approved_at: now(),
              notes: options?.notes ? `${p.notes || ''}\n[Autorización]: ${options.notes}` : p.notes,
            }
          : p
      )
    );

    addAuditLog({
      action: 'AUTORIZACION_ORDEN_COMPRA',
      module: 'COMPRAS',
      recordId: po.purchase_order_number,
      details: `Orden de compra ${po.purchase_order_number} autorizada por ${user.name} (${user.role}) por un importe de $${(Number(po.total) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN.`,
    });

    addNotification({
      title: 'Orden de Compra Autorizada',
      message: `${po.purchase_order_number} aprobada. Lista para ser transmitida al proveedor.`,
      type: 'EXITO',
      module: 'COMPRAS',
    });

    return { success: true };
  };

  const rejectPurchaseOrder = (id: string, reason: string): { success: boolean; error?: string } => {
    const po = purchaseOrders.find((p) => p.id === id);
    if (!po) return { success: false, error: 'Orden de compra no encontrada' };

    setPurchaseOrders((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status: 'CANCELLED',
              cancellation_reason: reason,
              cancelled_at: now(),
            }
          : p
      )
    );

    addAuditLog({
      action: 'RECHAZO_ORDEN_COMPRA',
      module: 'COMPRAS',
      recordId: po.purchase_order_number,
      details: `Orden de compra ${po.purchase_order_number} cancelada/rechazada por ${user.name}. Motivo: ${reason}`,
    });

    return { success: true };
  };

  const sendPurchaseOrderToSupplier = (
    id: string,
    details: {
      sendMethod: 'EMAIL' | 'PORTAL' | 'WHATSAPP' | 'TELEFONO';
      contactName?: string;
      contactEmail?: string;
      supplierConfirmationFolio?: string;
      notes?: string;
    }
  ): { success: boolean; error?: string } => {
    const po = purchaseOrders.find((p) => p.id === id);
    if (!po) return { success: false, error: 'Orden de compra no encontrada' };

    setPurchaseOrders((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status: 'SENT_TO_SUPPLIER',
              sent_to_supplier_at: now(),
              supplier_confirmation_number: details.supplierConfirmationFolio || p.supplier_confirmation_number,
              notes: details.notes ? `${p.notes || ''}\n[Envío ${details.sendMethod}]: ${details.notes}` : p.notes,
            }
          : p
      )
    );

    addAuditLog({
      action: 'ENVIO_ORDEN_COMPRA_PROVEEDOR',
      module: 'COMPRAS',
      recordId: po.purchase_order_number,
      details: `OC ${po.purchase_order_number} enviada a ${po.supplier_name} vía ${details.sendMethod} a ${details.contactEmail || details.contactName || 'contacto asignado'}. Ref/Confirmación: ${details.supplierConfirmationFolio || 'Pendiente'}.`,
    });

    addNotification({
      title: 'OC Enviada al Proveedor',
      message: `${po.purchase_order_number} transmitida a ${po.supplier_name}.`,
      type: 'INFO',
      module: 'COMPRAS',
    });

    return { success: true };
  };

  const cancelPurchaseOrder = (id: string, reason: string): { success: boolean; error?: string } => {
    const po = purchaseOrders.find((p) => p.id === id);
    if (!po) return { success: false, error: 'Orden de compra no encontrada' };

    if (po.status === 'RECEIVED') {
      return { success: false, error: 'No se puede cancelar una orden que ya fue recibida en su totalidad.' };
    }

    setPurchaseOrders((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status: 'CANCELLED',
              cancellation_reason: reason,
              cancelled_at: now(),
            }
          : p
      )
    );

    addAuditLog({
      action: 'CANCELAR_ORDEN_COMPRA',
      module: 'COMPRAS',
      recordId: po.purchase_order_number,
      details: `Orden de compra ${po.purchase_order_number} cancelada. Motivo: ${reason}`,
    });

    return { success: true };
  };

  // =========================================================================
  // 4. RECEPCIÓN DE MERCANCÍA E INTEGRACIÓN CON ALMACÉN (GOODS RECEIPTS)
  // Cierra el ciclo: VENTA -> INVENTARIO -> DESABASTO -> COMPRA -> RECEPCIÓN
  // =========================================================================
  const receiveGoodsReceipt = (data: {
    purchaseOrderId?: string;
    purchase_order_id?: string;
    supplierRemissionInvoiceNumber?: string;
    supplier_remission_invoice_number?: string;
    supplier_document?: string;
    warehouseId?: string;
    warehouse_id?: string;
    targetLocation?: string;
    items: {
      productId?: string;
      product_id?: string;
      quantityReceived?: number;
      quantity_received?: number;
      quantityRejected?: number;
      quantity_rejected?: number;
      qualityApproved?: boolean;
      rejectionReason?: string;
      unitPrice?: number;
      unit_price?: number;
      targetLocation?: string;
      destination_location?: string;
    }[];
    driverName?: string;
    driver_name?: string;
    carrierName?: string;
    carrier_name?: string;
    supplier_carrier?: string;
    vehiclePlates?: string;
    vehicle_plates?: string;
    notes?: string;
  }): { success: boolean; receipt?: GoodsReceipt; error?: string } => {
    const poId = data.purchaseOrderId || data.purchase_order_id;
    const po = purchaseOrders.find((p) => p.id === poId);
    if (!po) return { success: false, error: 'Orden de compra no encontrada' };

    const whId = data.warehouseId || data.warehouse_id || po.warehouse_id;
    const warehouse = warehouses.find((w) => w.id === whId) || warehouses[0];
    const remissionNumber = data.supplierRemissionInvoiceNumber || data.supplier_remission_invoice_number || data.supplier_document || 'REM-S/N';
    const nextReceiptNum = goodsReceipts.length + 1;
    const receipt_number = `REC-2026-${String(nextReceiptNum).padStart(3, '0')}`;
    const receiptId = `GR-${Date.now().toString(36).toUpperCase()}`;

    let totalUnitsReceived = 0;
    let totalUnitsRejected = 0;

    const receiptItems: GoodsReceiptItem[] = [];
    const newMovements: InventoryMovement[] = [];
    let updatedProducts = [...products];

    // Iterar partidas de la recepción
    data.items.forEach((itemInput, idx) => {
      const prodId = itemInput.productId || itemInput.product_id;
      const product = updatedProducts.find((p) => p.id === prodId || p.code === prodId);
      if (!product) return;

      const qtyRec = Number(itemInput.quantityReceived !== undefined ? itemInput.quantityReceived : itemInput.quantity_received) || 0;
      const qtyRej = Number(itemInput.quantityRejected !== undefined ? itemInput.quantityRejected : itemInput.quantity_rejected) || 0;
      if (qtyRec <= 0 && qtyRej <= 0) return;

      totalUnitsReceived += qtyRec;
      totalUnitsRejected += qtyRej;

      const poItem = po.items.find((i) => i.product_id === product.id || i.product_code === product.code);
      const unitPrice = itemInput.unitPrice !== undefined ? Number(itemInput.unitPrice) : itemInput.unit_price !== undefined ? Number(itemInput.unit_price) : (poItem?.unit_price || product.cost || 100);
      const location = itemInput.targetLocation || itemInput.destination_location || data.targetLocation || (typeof product.warehouseLocation === 'string' ? product.warehouseLocation : 'N1 / R-01 / P-01 / Niv-1');

      receiptItems.push({
        id: `GRI-${receiptId}-${idx + 1}`,
        receipt_id: receiptId,
        purchase_order_item_id: poItem?.id || '',
        product_id: product.id,
        product_code: product.code,
        product_name: product.name,
        unit: product.unit,
        quantity_ordered: poItem?.quantity_ordered || qtyRec,
        quantity_received: qtyRec,
        quantity_rejected: qtyRej,
        quality_approved: itemInput.qualityApproved ?? (qtyRej === 0),
        rejection_reason: itemInput.rejectionReason,
        warehouse_location: location,
        unit_price: unitPrice,
        total_cost: qtyRec * unitPrice,
      });

      // Solo mercancía recibida y aprobada ingresa al inventario disponible
      if (qtyRec > 0) {
        const prevStock = product.stock || product.physicalStock || 0;
        const newStock = prevStock + qtyRec;
        const newAvailable = (product.availableStock || 0) + qtyRec;

        // Costo promedio ponderado
        const oldValuation = prevStock * (product.cost || unitPrice);
        const newValuation = oldValuation + qtyRec * unitPrice;
        const newCost = newStock > 0 ? Number((newValuation / newStock).toFixed(2)) : unitPrice;

        updatedProducts = updatedProducts.map((p) =>
          p.id === product.id
            ? {
                ...p,
                stock: newStock,
                physicalStock: newStock,
                availableStock: newAvailable,
                cost: newCost,
                updatedAt: now(),
              }
            : p
        );

        // Registrar movimiento de inventario oficial ENTRADA
        const movId = `MOV-REC-${Date.now().toString(36).toUpperCase()}-${idx}`;
        newMovements.push({
          id: movId,
          timestamp: new Date().toLocaleString('es-MX', { hour12: false }),
          type: 'ENTRADA',
          productId: product.id,
          productCode: product.code,
          productName: product.name,
          warehouseId: warehouse.id,
          warehouseName: warehouse.name,
          location,
          quantity: qtyRec,
          previousBalance: prevStock,
          newBalance: newStock,
          reason: `Recepción de compra ${po.purchase_order_number} (Remisión/Factura: ${data.supplierRemissionInvoiceNumber})`,
          relatedDocFolio: `${po.purchase_order_number} / ${data.supplierRemissionInvoiceNumber}`,
          userId: user.id,
          userName: user.name,
          createdAt: now(),
        });

        // Registrar en historial de precios de compra
        setPurchasePriceHistory((prev) => [
          {
            id: `PPH-${Date.now().toString(36).toUpperCase()}-${idx}`,
            supplier_id: po.supplier_id,
            supplier_name: po.supplier_name,
            product_id: product.id,
            product_code: product.code,
            product_name: product.name,
            purchase_order_id: po.id,
            purchase_order_number: po.purchase_order_number,
            unit_price: unitPrice,
            quantity: qtyRec,
            currency: po.currency || 'MXN',
            purchase_date: todayDate(),
          },
          ...prev,
        ]);

        // Actualizar último precio y fecha en catálogo proveedor-producto
        setSupplierProducts((prev) =>
          prev.map((sp) =>
            (sp.supplier_id === po.supplier_id || sp.supplierId === po.supplier_id) &&
            (sp.product_id === product.id || sp.productId === product.id)
              ? {
                  ...sp,
                  last_purchase_date: todayDate(),
                  last_purchase_price: unitPrice,
                }
              : sp
          )
        );
      }
    });

    // Actualizar cantidades recibidas en la orden de compra
    const updatedPoItems = po.items.map((poItem) => {
      const rItem = receiptItems.find((ri) => ri.product_id === poItem.product_id || ri.product_code === poItem.product_code);
      if (!rItem) return poItem;

      const newQtyReceived = (poItem.quantity_received || 0) + rItem.quantity_received;
      const newQtyPending = Math.max(0, poItem.quantity_ordered - newQtyReceived);
      return {
        ...poItem,
        quantity_received: newQtyReceived,
        quantity_pending: newQtyPending,
      };
    });

    const isFullyReceived = updatedPoItems.every((i) => (i.quantity_pending || 0) <= 0);
    const newPoStatus = isFullyReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED';

    setPurchaseOrders((prev) =>
      prev.map((p) =>
        p.id === po.id
          ? {
              ...p,
              status: newPoStatus,
              items: updatedPoItems,
              updated_at: now(),
            }
          : p
      )
    );

    // Guardar productos y movimientos actualizados
    setProducts(updatedProducts);
    setMovements((prev) => [...newMovements, ...prev]);

    // Crear registro de Recepción de Mercancía
    const newReceipt: GoodsReceipt = {
      id: receiptId,
      receipt_number,
      purchase_order_id: po.id,
      purchase_order_number: po.purchase_order_number,
      supplier_id: po.supplier_id,
      supplier_name: po.supplier_name,
      warehouse_id: warehouse.id,
      warehouse_name: warehouse.name,
      received_by: user.id,
      received_by_name: user.name,
      receipt_date: todayDate(),
      supplier_remission_invoice_number: data.supplierRemissionInvoiceNumber,
      carrier_name: data.carrierName,
      driver_name: data.driverName,
      vehicle_plates: data.vehiclePlates,
      quality_inspection_status: totalUnitsRejected > 0 ? 'CON_RECHAZOS' : 'APROBADO',
      quality_inspector_name: user.name,
      status: 'CONFIRMED',
      items: receiptItems,
      notes: data.notes,
      created_at: now(),
    };

    setGoodsReceipts((prev) => [newReceipt, ...prev]);

    // Registro de Auditoría
    addAuditLog({
      action: 'RECEPCION_MERCANCIA_COMPRA',
      module: 'COMPRAS',
      recordId: receipt_number,
      details: `Recepción ${receipt_number} confirmada en ${warehouse.name}. ${totalUnitsReceived} unidades ingresadas a inventario de ${po.purchase_order_number} (Remisión: ${data.supplierRemissionInvoiceNumber}). Estado OC: ${newPoStatus}. Rechazos calidad: ${totalUnitsRejected}.`,
    });

    addNotification({
      title: 'Mercancía Recibida en Almacén',
      message: `${receipt_number} ingresó ${totalUnitsReceived} unidades a ${warehouse.name} de ${po.supplier_name}.`,
      type: 'EXITO',
      module: 'COMPRAS',
    });

    broadcastDataUpdate('GOODS_RECEIVED', {
      receiptNumber: receipt_number,
      purchaseOrderNumber: po.purchase_order_number,
      unitsReceived: totalUnitsReceived,
      warehouseName: warehouse.name,
      summary: `Recepción ${receipt_number} de ${po.supplier_name}`,
      products: updatedProducts,
    });

    return { success: true, receipt: newReceipt };
  };

  // ==========================================
  // 5. DEVOLUCIONES A PROVEEDOR (SUPPLIER RETURNS)
  // ==========================================
  const createSupplierReturn = (data: {
    supplierId: string;
    goodsReceiptId?: string;
    goodsReceiptNumber?: string;
    purchaseOrderId?: string;
    purchaseOrderNumber?: string;
    warehouseId: string;
    reasonSummary: string;
    items: {
      productId: string;
      quantity: number;
      unitPrice?: number;
      reason: string;
      lotNumber?: string;
    }[];
    notes?: string;
  }): { success: boolean; supplierReturn?: SupplierReturn; error?: string } => {
    const supplier = suppliers.find((s) => s.id === data.supplierId);
    const supplierName = supplier?.name || 'Proveedor';
    const warehouse = warehouses.find((w) => w.id === data.warehouseId) || warehouses[0];

    const nextRetNum = supplierReturns.length + 1;
    const return_number = `DEV-PRV-2026-${String(nextRetNum).padStart(3, '0')}`;
    const id = `RET-${Date.now().toString(36).toUpperCase()}`;

    let total_amount = 0;
    const items: SupplierReturnItem[] = data.items.map((item, idx) => {
      const product = products.find((p) => p.id === item.productId || p.code === item.productId);
      const unitPrice = item.unitPrice || product?.cost || 100;
      const subtotal = item.quantity * unitPrice;
      total_amount += subtotal;

      return {
        id: `RETI-${id}-${idx + 1}`,
        return_id: id,
        product_id: product?.id || item.productId,
        product_code: product?.code || item.productId,
        product_name: product?.name || 'Material',
        unit: product?.unit || 'Pza',
        quantity: item.quantity,
        unit_price: unitPrice,
        total_amount: subtotal,
        reason: item.reason,
        lot_number: item.lotNumber,
      };
    });

    const newReturn: SupplierReturn = {
      id,
      return_number,
      supplier_id: data.supplierId,
      supplier_name: supplierName,
      goods_receipt_id: data.goodsReceiptId,
      goods_receipt_number: data.goodsReceiptNumber,
      purchase_order_id: data.purchaseOrderId,
      purchase_order_number: data.purchaseOrderNumber,
      warehouse_id: warehouse.id,
      warehouse_name: warehouse.name,
      status: 'BORRADOR',
      reason_summary: data.reasonSummary,
      requested_by: user.id,
      requested_by_name: user.name,
      items,
      total_amount,
      notes: data.notes,
      created_at: now(),
    };

    setSupplierReturns((prev) => [newReturn, ...prev]);

    addAuditLog({
      action: 'CREAR_DEVOLUCION_PROVEEDOR',
      module: 'COMPRAS',
      recordId: return_number,
      details: `Devolución ${return_number} generada para ${supplierName} ($${(Number(total_amount) || 0).toLocaleString('es-MX')} MXN). Motivo: ${data.reasonSummary}`,
    });

    return { success: true, supplierReturn: newReturn };
  };

  const authorizeSupplierReturn = (id: string): { success: boolean; error?: string } => {
    const ret = supplierReturns.find((r) => r.id === id);
    if (!ret) return { success: false, error: 'Devolución no encontrada' };

    setSupplierReturns((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'AUTORIZADA',
              authorized_by: user.id,
              authorized_by_name: user.name,
              authorized_at: now(),
            }
          : r
      )
    );

    addAuditLog({
      action: 'AUTORIZAR_DEVOLUCION_PROVEEDOR',
      module: 'COMPRAS',
      recordId: ret.return_number,
      details: `Devolución a proveedor ${ret.return_number} autorizada por ${user.name}.`,
    });

    return { success: true };
  };

  const applySupplierReturnInventoryExit = (
    id: string,
    options?: { creditNoteFolio?: string; notes?: string }
  ): { success: boolean; error?: string } => {
    const ret = supplierReturns.find((r) => r.id === id);
    if (!ret) return { success: false, error: 'Devolución no encontrada' };

    let updatedProducts = [...products];
    const newMovements: InventoryMovement[] = [];

    // Descontar inventario por cada partida devuelta
    ret.items.forEach((item, idx) => {
      const product = updatedProducts.find((p) => p.id === item.product_id || p.code === item.product_code);
      if (!product) return;

      const prevStock = product.stock || product.physicalStock || 0;
      const newStock = Math.max(0, prevStock - item.quantity);
      const newAvailable = Math.max(0, (product.availableStock || 0) - item.quantity);

      updatedProducts = updatedProducts.map((p) =>
        p.id === product.id
          ? {
              ...p,
              stock: newStock,
              physicalStock: newStock,
              availableStock: newAvailable,
              updatedAt: now(),
            }
          : p
      );

      newMovements.push({
        id: `MOV-DEV-${Date.now().toString(36).toUpperCase()}-${idx}`,
        timestamp: new Date().toLocaleString('es-MX', { hour12: false }),
        type: 'SALIDA',
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        warehouseId: ret.warehouse_id,
        warehouseName: ret.warehouse_name || 'Almacén Central',
        location: typeof product.warehouseLocation === 'string' ? product.warehouseLocation : 'N1 / R-01 / P-01 / Niv-1',
        quantity: item.quantity,
        previousBalance: prevStock,
        newBalance: newStock,
        reason: `Salida por devolución a proveedor ${ret.supplier_name} (${ret.return_number})`,
        relatedDocFolio: ret.return_number,
        userId: user.id,
        userName: user.name,
        createdAt: now(),
      });
    });

    setProducts(updatedProducts);
    setMovements((prev) => [...newMovements, ...prev]);

    setSupplierReturns((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'APLICADA',
              credit_note_folio: options?.creditNoteFolio || r.credit_note_folio,
              notes: options?.notes ? `${r.notes || ''}\n[Aplicación]: ${options.notes}` : r.notes,
            }
          : r
      )
    );

    addAuditLog({
      action: 'APLICAR_SALIDA_DEVOLUCION_PROVEEDOR',
      module: 'COMPRAS',
      recordId: ret.return_number,
      details: `Salida de inventario aplicada por devolución ${ret.return_number}. Total partidas: ${ret.items.length}, Nota de crédito: ${options?.creditNoteFolio || 'Pendiente'}.`,
    });

    return { success: true };
  };

  // ==========================================
  // 6. CONFIGURACIÓN DE REORDEN
  // ==========================================
  const updateReorderConfig = (productId: string, updates: Partial<ReorderConfig>) => {
    setReorderConfigs((prev) => {
      const exists = prev.some((rc) => rc.product_id === productId || rc.productId === productId);
      if (exists) {
        return prev.map((rc) =>
          rc.product_id === productId || rc.productId === productId
            ? { ...rc, ...updates, updated_at: now() }
            : rc
        );
      } else {
        const prod = products.find((p) => p.id === productId || p.code === productId);
        const newConfig: ReorderConfig = {
          id: `RC-${Date.now().toString(36).toUpperCase()}`,
          product_id: productId,
          product_code: prod?.code || productId,
          product_name: prod?.name || 'Material',
          safety_stock: updates.safety_stock ?? 30,
          lead_time_days: updates.lead_time_days ?? 7,
          minimum_stock: updates.minimum_stock ?? 20,
          maximum_stock: updates.maximum_stock ?? 200,
          average_daily_consumption: updates.average_daily_consumption ?? 5,
          reorder_point: updates.reorder_point ?? 65,
          moq: updates.moq ?? 1,
          auto_generate_suggestions: updates.auto_generate_suggestions ?? true,
          ...updates,
          updated_at: now(),
        };
        return [...prev, newConfig];
      }
    });

    addAuditLog({
      action: 'CONFIGURAR_PUNTO_REORDEN',
      module: 'COMPRAS',
      recordId: productId,
      details: `Parámetros de reorden actualizados para producto ${productId}.`,
    });
  };

  return {
    addSupplier,
    createSupplier: addSupplier,
    updateSupplier,
    deleteSupplier,
    addSupplierContact,
    updateSupplierContact,
    deleteSupplierContact,
    addSupplierProduct,
    updateSupplierProduct,
    deleteSupplierProduct,
    createPurchaseRequest,
    updatePurchaseRequest,
    submitPurchaseRequest,
    approvePurchaseRequest,
    rejectPurchaseRequest,
    convertRequestToPurchaseOrder,
    createPurchaseOrder,
    updatePurchaseOrder,
    submitPurchaseOrderForApproval,
    approvePurchaseOrder,
    rejectPurchaseOrder,
    sendPurchaseOrderToSupplier,
    cancelPurchaseOrder,
    receiveGoodsReceipt,
    createGoodsReceipt: receiveGoodsReceipt,
    createSupplierReturn,
    authorizeSupplierReturn,
    applySupplierReturnInventoryExit,
    updateReorderConfig,
  };
}
