import { QuoteAvailabilityService } from '../../services/quoteAvailabilityService';
import React, { useState } from 'react';
import {
  ShoppingBag,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  Box,
  Building2,
  Calendar,
  DollarSign,
  AlertTriangle,
  Receipt,
  X,
  Printer,
  Download,
  Trash2,
  FileText,
  Warehouse,
  Check,
  ChevronRight,
  Loader2,
  ShieldCheck,
  PackageCheck,
  MapPin,
  UserCheck,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { Order, OrderStatus, OrderItem, Product, Customer } from '../../types/erp';
import { CommercialRLSService } from '../../services/commercialRLSService';
import { downloadOrderPDF } from '../../utils/pdfGenerator';
import { OrderPrintPreviewModal } from './OrderPrintPreviewModal';

export const OrdersModule: React.FC = () => {
  const {
    orders,
    customers,
    products,
    createOrder,
    updateOrderStatus,
    deliverOrder,
    companyConfig,
    warehouses,
  } = useERP();

  const { can, currentUser, currentRole } = useAuth();

  const isSalesExecutive = currentUser?.role === 'VENDEDOR';
  const isOperationsOrPrivileged =
    CommercialRLSService.isPrivilegedRole(currentUser?.role) ||
    currentUser?.role === 'ALMACEN' ||
    currentUser?.role === 'LOGISTICA' ||
    currentUser?.role === 'CHOFER' ||
    currentUser?.role === 'FINANZAS';

  const scopedOrders = isOperationsOrPrivileged ? orders : CommercialRLSService.scopeOrders(orders, currentUser);
  const scopedCustomers = isOperationsOrPrivileged ? customers : CommercialRLSService.scopeCustomers(customers, currentUser);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [previewPrintOrder, setPreviewPrintOrder] = useState<Order | null>(null);
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Delivery & Processing States
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  const [deliveryModalOrder, setDeliveryModalOrder] = useState<Order | null>(null);
  const [deliveryRecipient, setDeliveryRecipient] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [deliveryDateInput, setDeliveryDateInput] = useState(() => new Date().toISOString().split('T')[0]);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    orderFolio?: string;
  } | null>(null);

  // New Order Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState(scopedCustomers[0]?.id || '');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(warehouses[0]?.id || '');
  const [shippingAddress, setShippingAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [orderNotes, setOrderNotes] = useState('');
  const [items, setItems] = useState<
    Array<{
      productId: string;
      productCode: string;
      description: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }>
  >(() => {
    const p = products[0];
    return p
      ? [
          {
            productId: p.id,
            productCode: p.code,
            description: p.name,
            quantity: 10,
            unitPrice: p.price,
            subtotal: 10 * p.price,
          },
        ]
      : [];
  });

  const selectedCustomer = scopedCustomers.find((c) => c.id === selectedCustomerId) || scopedCustomers[0];

  const handleProductChange = (idx: number, prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;
    const newItems = [...items];
    newItems[idx] = {
      ...newItems[idx],
      productId: prod.id,
      productCode: prod.code,
      description: prod.name,
      unitPrice: prod.price,
      subtotal: newItems[idx].quantity * prod.price,
    };
    setItems(newItems);
  };

  const handleQuantityChange = (idx: number, qty: number) => {
    const validQty = Math.max(1, qty || 1);
    const newItems = [...items];
    newItems[idx] = {
      ...newItems[idx],
      quantity: validQty,
      subtotal: validQty * newItems[idx].unitPrice,
    };
    setItems(newItems);
  };

  const handlePriceChange = (idx: number, price: number) => {
    const validPrice = Math.max(0, price || 0);
    const newItems = [...items];
    newItems[idx] = {
      ...newItems[idx],
      unitPrice: validPrice,
      subtotal: newItems[idx].quantity * validPrice,
    };
    setItems(newItems);
  };

  const handleAddItem = () => {
    const p = products[0];
    if (!p) return;
    setItems([
      ...items,
      {
        productId: p.id,
        productCode: p.code,
        description: p.name,
        quantity: 5,
        unitPrice: p.price,
        subtotal: 5 * p.price,
      },
    ]);
  };

  const handleRemoveItem = (idx: number) => {
    if (items.length <= 1) {
      alert('El pedido debe tener al menos una partida.');
      return;
    }
    setItems(items.filter((_, i) => i !== idx));
  };

  const subtotal = items.reduce((acc, it) => acc + (it.subtotal || 0), 0);
  const tax = subtotal * 0.16;
  const total = subtotal + tax;

  const handleCreateOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      alert('Seleccione un cliente para registrar el pedido.');
      return;
    }
    if (items.length === 0) {
      alert('Debe agregar al menos una partida.');
      return;
    }

    try {
      const orderItems: OrderItem[] = items.map((it) => ({
        productId: it.productId,
        productCode: it.productCode,
        description: it.description,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        subtotal: it.subtotal,
      }));

      const newOrder = createOrder({
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        warehouseId: selectedWarehouseId,
        items: orderItems,
        subtotal,
        tax,
        total,
        shippingAddress: shippingAddress.trim() || selectedCustomer.address || 'Domicilio Fiscal',
        deliveryDate,
        notes: orderNotes,
      });

      alert(`¡Pedido ${newOrder.folio} creado y reservado en almacén exitosamente!`);
      setIsNewOrderOpen(false);
    } catch (err: any) {
      alert(`Error al crear pedido: ${err.message || err}`);
    }
  };

  const filteredOrders = scopedOrders.filter((ord) => {
    const matchSearch =
      searchTerm.trim() === '' ||
      (ord.folio || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ord.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ord.quoteFolio && (ord.quoteFolio || '').toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ord.masterTransactionId && (ord.masterTransactionId || '').toLowerCase().includes(searchTerm.toLowerCase()));
    const matchStatus = statusFilter === 'TODOS' || ord.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDIENTE':
        return <span className="rounded-full bg-amber-900/60 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-700">PENDIENTE</span>;
      case 'EN_SURTIDO':
        return <span className="rounded-full bg-blue-900/60 px-2.5 py-0.5 text-[10px] font-bold text-blue-300 border border-blue-700">EN SURTIDO</span>;
      case 'SURTIDO':
        return <span className="rounded-full bg-purple-900/60 px-2.5 py-0.5 text-[10px] font-bold text-purple-300 border border-purple-700">SURTIDO</span>;
      case 'ENTREGADO':
        return <span className="rounded-full bg-emerald-900/60 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-700">ENTREGADO</span>;
      case 'CANCELADO':
        return <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold text-slate-400 border border-slate-700">CANCELADO</span>;
      default:
        return <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">{status}</span>;
    }
  };

  const handleViewOrder = (order: Order) => {
    if (!order || (!order.id && !order.folio)) return;
    const freshOrder = orders.find((o) => o.id === order.id || o.folio === order.folio) || order;
    const access = CommercialRLSService.validateAccess(currentUser, 'ORDER', freshOrder, 'READ');
    if (!access.allowed) {
      setFeedback({
        type: 'error',
        message: `403 ACCESS_DENIED: No tienes autorización para consultar el pedido ${freshOrder.folio} perteneciente a otro ejecutivo comercial.`,
        orderFolio: freshOrder.folio,
      });
      return;
    }
    setViewingOrder(freshOrder);
  };

  const handleOpenDeliveryModal = (order: Order) => {
    if (isSalesExecutive) {
      setFeedback({
        type: 'error',
        message: '403 ACCESS DENIED: El rol EJECUTIVO_VENTAS no cuenta con facultades operativas para procesar entregas o movimientos físicos de almacén.',
        orderFolio: order.folio,
      });
      CommercialRLSService.validateAccess(currentUser, 'ORDER', order, 'UPDATE');
      return;
    }

    if (order.status === 'CANCELADO') {
      setFeedback({
        type: 'error',
        message: 'No es posible procesar la entrega de un pedido cancelado.',
        orderFolio: order.folio,
      });
      return;
    }
    if (order.status === 'ENTREGADO') {
      setFeedback({
        type: 'info',
        message: `El pedido ${order.folio} ya fue entregado previamente.`,
        orderFolio: order.folio,
      });
      return;
    }

    // RBAC validation
    const hasPermission = can('LOGISTICA', 'EDITAR') || can('ALMACENES', 'EDITAR') || CommercialRLSService.isPrivilegedRole(currentUser?.role);
    if (!hasPermission) {
      setFeedback({
        type: 'error',
        message: 'ACCESS DENIED: Tu rol actual no cuenta con permisos suficientes para procesar entregas de pedidos.',
        orderFolio: order.folio,
      });
      return;
    }

    setDeliveryModalOrder(order);
    setDeliveryRecipient(order.customerName || '');
    setDeliveryNotes(order.notes ? `Entrega en sitio: ${order.notes}` : '');
    setDeliveryDateInput(new Date().toISOString().split('T')[0]);
  };

  const handleConfirmDeliverySubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!deliveryModalOrder) return;
    if (processingOrderId === deliveryModalOrder.id) return; // Idempotency protection

    if (isSalesExecutive) {
      setFeedback({
        type: 'error',
        message: '403 ACCESS DENIED: El rol EJECUTIVO_VENTAS no cuenta con facultades operativas para confirmar entregas físicas.',
        orderFolio: deliveryModalOrder.folio,
      });
      return;
    }

    setProcessingOrderId(deliveryModalOrder.id);
    setFeedback({
      type: 'info',
      message: `Procesando entrega del pedido ${deliveryModalOrder.folio}...`,
      orderFolio: deliveryModalOrder.folio,
    });

    try {
      const res = deliverOrder(deliveryModalOrder.id, {
        recipientName: deliveryRecipient.trim() || deliveryModalOrder.customerName || 'Receptor Autorizado',
        notes: deliveryNotes.trim() || 'Despacho y entrega confirmada en almacén / destino.',
        deliveryDate: deliveryDateInput,
        shippingAddress: deliveryModalOrder.shippingAddress,
      });

      if (res && res.success) {
        setFeedback({
          type: 'success',
          message: `Entrega preparada correctamente. Saldo y remisión actualizados para el pedido ${deliveryModalOrder.folio}.`,
          orderFolio: deliveryModalOrder.folio,
        });
        if (viewingOrder && (viewingOrder.id === deliveryModalOrder.id || viewingOrder.folio === deliveryModalOrder.folio)) {
          setViewingOrder({
            ...viewingOrder,
            status: 'ENTREGADO',
            fulfillmentStatus: 'SURTIDO_TOTAL',
          });
        }
        setDeliveryModalOrder(null);
      } else {
        setFeedback({
          type: 'error',
          message: res?.error || 'No fue posible procesar la entrega. La operación no modificó información.',
          orderFolio: deliveryModalOrder.folio,
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: `Error al procesar entrega: ${err?.message || err}`,
        orderFolio: deliveryModalOrder.folio,
      });
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleAdvanceStatus = (order: Order) => {
    if (processingOrderId === order.id) return; // Idempotency protection

    if (isSalesExecutive) {
      setFeedback({
        type: 'error',
        message: '403 ACCESS DENIED: El rol EJECUTIVO_VENTAS no cuenta con facultades operativas para avanzar el estatus físico de pedidos en almacén.',
        orderFolio: order.folio,
      });
      CommercialRLSService.validateAccess(currentUser, 'ORDER', order, 'UPDATE');
      return;
    }

    if (order.status === 'CANCELADO') {
      setFeedback({
        type: 'error',
        message: 'No es posible modificar un pedido cancelado.',
        orderFolio: order.folio,
      });
      return;
    }
    if (order.status === 'ENTREGADO') {
      setFeedback({
        type: 'info',
        message: `El pedido ${order.folio} ya se encuentra completado y entregado.`,
        orderFolio: order.folio,
      });
      return;
    }

    // RBAC validation
    const hasPermission = can('LOGISTICA', 'EDITAR') || can('ALMACENES', 'EDITAR') || CommercialRLSService.isPrivilegedRole(currentUser?.role);
    if (!hasPermission) {
      setFeedback({
        type: 'error',
        message: 'ACCESS DENIED: Tu rol actual no cuenta con permisos suficientes para avanzar pedidos.',
        orderFolio: order.folio,
      });
      return;
    }

    if (order.status === 'PENDIENTE') {
      setProcessingOrderId(order.id);
      try {
        const res = updateOrderStatus(order.id, 'EN_SURTIDO');
        if (res.success) {
          setFeedback({
            type: 'success',
            message: `Pedido ${order.folio} marcado en preparación / surtido.`,
            orderFolio: order.folio,
          });
          if (viewingOrder && viewingOrder.id === order.id) {
            setViewingOrder({ ...viewingOrder, status: 'EN_SURTIDO' });
          }
        } else {
          setFeedback({
            type: 'error',
            message: res.error || 'No fue posible actualizar el estatus del pedido.',
            orderFolio: order.folio,
          });
        }
      } finally {
        setProcessingOrderId(null);
      }
    } else if (order.status === 'EN_SURTIDO') {
      setProcessingOrderId(order.id);
      try {
        const res = updateOrderStatus(order.id, 'SURTIDO');
        if (res.success) {
          setFeedback({
            type: 'success',
            message: `Pedido ${order.folio} surtido y listo para entrega / despacho.`,
            orderFolio: order.folio,
          });
          if (viewingOrder && viewingOrder.id === order.id) {
            setViewingOrder({ ...viewingOrder, status: 'SURTIDO' });
          }
        } else {
          setFeedback({
            type: 'error',
            message: res.error || 'No fue posible actualizar el estatus del pedido.',
            orderFolio: order.folio,
          });
        }
      } finally {
        setProcessingOrderId(null);
      }
    } else {
      // Order is SURTIDO or ready: trigger full delivery flow modal
      handleOpenDeliveryModal(order);
    }
  };

  // Generate printable Remisión / Delivery note HTML
  const generateOrderHTML = (order: Order) => {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Remisión de Pedido ${order.folio} - CONSCORE</title>
  <style>
    @page { size: letter; margin: 12mm; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #0f172a; margin: 0; padding: 24px; font-size: 12px; line-height: 1.4; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px; }
    .brand-title { font-size: 24px; font-weight: 900; letter-spacing: -0.5px; color: #0f172a; margin: 0; }
    .brand-sub { font-size: 11px; font-weight: 700; color: #059669; text-transform: uppercase; margin-top: 2px; }
    .brand-info { font-size: 11px; color: #64748b; margin-top: 4px; }
    .order-badge { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; }
    .order-number { font-size: 22px; font-weight: 900; font-family: monospace; color: #0f172a; margin: 2px 0; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 20px; }
    .info-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 2px; }
    .info-val-strong { font-size: 13px; font-weight: 700; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #f1f5f9; border-bottom: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #475569; }
    td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-mono { font-family: monospace; }
    .font-bold { font-weight: 700; }
    .totals-wrap { display: flex; justify-content: flex-end; margin-bottom: 20px; }
    .totals-box { width: 280px; font-size: 12px; }
    .total-row { display: flex; justify-content: space-between; padding: 4px 0; color: #475569; }
    .total-row strong { color: #0f172a; }
    .total-final { border-top: 2px solid #0f172a; margin-top: 6px; padding-top: 6px; font-size: 16px; font-weight: 900; color: #0f172a; }
    .signatures-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 40px; padding-top: 20px; text-align: center; }
    .sig-line { border-top: 1px solid #0f172a; padding-top: 6px; font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase; }
    .footer { text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 20px; }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand-title">CONSCORE LOGÍSTICA</div>
      <div class="brand-sub">Remisión de Embarque & Suministro de Materiales</div>
      <div class="brand-info">Planta Querétaro · Av. Industrial 450 · Tel: (442) 290-8800</div>
    </div>
    <div style="text-align: right;">
      <div class="order-badge">ORDEN DE PEDIDO / REMISIÓN</div>
      <div class="order-number">${order.folio}</div>
      <div class="brand-info">Fecha Pedido: <strong>${order.date || (order as any).orderDate || ''}</strong></div>
      <div class="brand-info">Ref. Cotización: <strong>${order.quoteFolio || 'Venta Directa'}</strong></div>
    </div>
  </div>

  <div class="info-grid">
    <div>
      <div class="info-label">Cliente / Receptor de Mercancía</div>
      <div class="info-val-strong">${order.customerName}</div>
      <div>Destino de Entrega: <strong>${order.shippingAddress || (order as any).deliveryAddress || 'Domicilio Fiscal'}</strong></div>
      <div>Fecha Promesa: <strong>${order.deliveryDate || (order as any).promisedDate || '3 días'}</strong></div>
    </div>
    <div>
      <div class="info-label">Control Logístico</div>
      <div>Estatus de Surtido: <strong>${order.status}</strong></div>
      <div>Almacén Despachador: <strong>${order.warehouseId || 'ALM-01 (Planta Principal)'}</strong></div>
      <div>Condición: <strong>Mercancía en Tránsito / Asegurada</strong></div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 15%;">Código SKU</th>
        <th style="width: 45%;">Descripción de Material</th>
        <th class="text-right" style="width: 10%;">Cant.</th>
        <th class="text-right" style="width: 15%;">P. Unitario</th>
        <th class="text-right" style="width: 15%;">Importe</th>
      </tr>
    </thead>
    <tbody>
      ${order.items.map((it) => `
        <tr>
          <td class="font-mono font-bold">${it.productCode || (it as any).sku || 'SKU'}</td>
          <td>${it.description || (it as any).productName || 'Material'}</td>
          <td class="text-right font-bold">${it.quantity ?? (it as any).quantityOrdered ?? (it as any).quantityFulfilled ?? 1}</td>
          <td class="text-right">$${(Number(it.unitPrice || (it as any).price) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
          <td class="text-right font-bold">$${(Number(it.subtotal || (Number(it.unitPrice || (it as any).price || 0) * Number(it.quantity ?? (it as any).quantityOrdered ?? 1))) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals-wrap">
    <div class="totals-box">
      <div class="total-row"><span>Subtotal:</span> <strong>$${(Number(order.subtotal || order.total / 1.16) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</strong></div>
      <div class="total-row"><span>IVA (16%):</span> <strong>$${(Number(order.tax || order.total - (order.total / 1.16)) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</strong></div>
      <div class="total-row total-final"><span>Total Pedido:</span> <span>$${(Number(order.total) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span></div>
    </div>
  </div>

  <div class="signatures-grid">
    <div>
      <div style="height: 40px;"></div>
      <div class="sig-line">Almacén y Embarques (Entrega)</div>
    </div>
    <div>
      <div style="height: 40px;"></div>
      <div class="sig-line">Operador / Transporte</div>
    </div>
    <div>
      <div style="height: 40px;"></div>
      <div class="sig-line">Recibe Cliente (Nombre, Firma y Sello)</div>
    </div>
  </div>

  <div class="footer">
    Documento oficial de entrega y remisión de materiales CONSCORE ERP · Sujeto a inspección en destino.
  </div>
</body>
</html>`;
  };

  const isSandboxedIframe = (): boolean => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  };

  /**
   * Primary handler triggered by clicking the Printer icon in the Orders table "Acciones" column.
   * 1. Identifies the order for that exact row.
   * 2. Resolves fresh order from state to prevent stale data.
   * 3. Validates RLS permissions.
   * 4. Opens the Order Preview modal (reusing the existing preview document structure).
   * 5. The user can then print/download the remission from inside the preview modal.
   */
  const handlePrintOrder = (order: Order) => {
    handleViewOrder(order);
  };

  /**
   * Opens the full printable document preview from within the Order Details modal.
   * Strictly READ-ONLY: does not download PDF automatically and does not open print dialog automatically.
   * Allows the user to inspect the full document and then choose whether to Print or optionally Download PDF.
   */
  const handleOpenPrintPreview = (order: Order) => {
    if (!order || (!order.id && !order.folio)) return;
    const freshOrder = orders.find((o) => o.id === order.id || o.folio === order.folio) || order;
    const access = CommercialRLSService.validateAccess(currentUser, 'ORDER', freshOrder, 'READ');
    if (!access.allowed) {
      setFeedback({
        type: 'error',
        message: `403 ACCESS_DENIED: No tienes autorización para visualizar o imprimir documentos de pedidos asignados a otro ejecutivo comercial.`,
        orderFolio: freshOrder.folio,
      });
      return;
    }
    setPreviewPrintOrder(freshOrder);
  };

  /**
   * Executes printing from inside the Order Preview modal.
   * Strictly READ-ONLY: does not modify status, inventory, Kardex, or reservations.
   * Generates and downloads official Remisión PDF and triggers print dialog where supported.
   */
  const handleExecutePrintRemission = async (order: Order) => {
    if (!order) return;
    const access = CommercialRLSService.validateAccess(currentUser, 'ORDER', order, 'READ');
    if (!access.allowed) {
      setFeedback({
        type: 'error',
        message: `403 ACCESS_DENIED: No tienes autorización para imprimir documentos de pedidos asignados a otro ejecutivo comercial.`,
        orderFolio: order.folio,
      });
      return;
    }

    setIsPrinting(true);
    try {
      const matchedCustomer = customers.find(
        (c) => c.id === order.customerId || c.company_name === order.customerName || c.name === order.customerName
      );

      // 1. Generate & download official Remisión PDF
      await downloadOrderPDF(order, matchedCustomer, { companyConfig });

      setFeedback({
        type: 'success',
        message: `Remisión del pedido ${order.folio} generada exitosamente en formato PDF oficial.`,
        orderFolio: order.folio,
      });

      // 2. Also trigger print if not in sandboxed iframe
      if (!isSandboxedIframe()) {
        try {
          const html = generateOrderHTML(order);
          const printIframe = document.createElement('iframe');
          printIframe.setAttribute('style', 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;');
          document.body.appendChild(printIframe);

          const frameDoc = printIframe.contentWindow?.document || printIframe.contentDocument;
          if (frameDoc) {
            frameDoc.open();
            frameDoc.write(html);
            frameDoc.close();

            setTimeout(() => {
              try {
                printIframe.contentWindow?.focus();
                printIframe.contentWindow?.print();
              } catch (err) {
                console.warn('Iframe print ignored or blocked', err);
              } finally {
                setTimeout(() => {
                  try {
                    document.body.removeChild(printIframe);
                  } catch (e) {}
                }, 1000);
              }
            }, 300);
          }
        } catch (e) {
          console.warn('Silent print attempt failed', e);
        }
      }
    } catch (err) {
      console.error('Error al generar remisión:', err);
      setFeedback({
        type: 'error',
        message: `No fue posible generar la remisión del pedido ${order.folio}.`,
        orderFolio: order.folio,
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownloadOrderHTML = (order: Order) => {
    const access = CommercialRLSService.validateAccess(currentUser, 'ORDER', order, 'READ');
    if (!access.allowed) {
      setFeedback({
        type: 'error',
        message: `403 ACCESS_DENIED: No tienes autorización para descargar documentos de pedidos asignados a otro ejecutivo comercial.`,
        orderFolio: order.folio,
      });
      return;
    }

    const html = generateOrderHTML(order);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Remision-Pedido-${order.folio}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Pedidos & Suministros en Firme</h2>
            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-300 border border-emerald-500/30">
              OPERACIÓN LOGÍSTICA
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Seguimiento de pedidos autorizados, reserva de inventario en tiempo real, despacho y remisiones de entrega
          </p>
        </div>

        {!isSalesExecutive && (can('PEDIDOS', 'CREAR') || CommercialRLSService.isPrivilegedRole(currentUser?.role)) && (
          <button
            onClick={() => setIsNewOrderOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-900/30 hover:bg-emerald-500 transition-all"
          >
            <Plus className="h-4 w-4" />
            Nuevo Pedido Directo
          </button>
        )}
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between gap-3 rounded-xl border p-4 text-xs font-medium transition-all ${
            feedback.type === 'success'
              ? 'border-emerald-500/40 bg-emerald-950/60 text-emerald-200'
              : feedback.type === 'error'
              ? 'border-rose-500/40 bg-rose-950/60 text-rose-200'
              : feedback.type === 'warning'
              ? 'border-amber-500/40 bg-amber-950/60 text-amber-200'
              : 'border-blue-500/40 bg-blue-950/60 text-blue-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            ) : feedback.type === 'error' ? (
              <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
            ) : (
              <ShieldCheck className="h-5 w-5 text-blue-400 shrink-0" />
            )}
            <div>
              {feedback.orderFolio && (
                <span className="font-mono font-bold uppercase mr-1.5 underline">
                  [{feedback.orderFolio}]
                </span>
              )}
              <span>{feedback.message}</span>
            </div>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="rounded p-1 text-slate-400 hover:text-white hover:bg-slate-800/60"
            title="Cerrar notificación"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por folio, cliente o cotización..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-yellow-400 focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-200 focus:border-yellow-400 focus:outline-none"
          >
            <option value="TODOS">Todos los Estatus ({scopedOrders.length})</option>
            <option value="PENDIENTE">Pendientes de Surtido</option>
            <option value="EN_SURTIDO">En Surtido</option>
            <option value="SURTIDO">Surtidos</option>
            <option value="ENTREGADO">Entregados</option>
            <option value="CANCELADO">Cancelados</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3">Folio Pedido</th>
                <th className="px-4 py-3">Cliente Comercial</th>
                <th className="px-4 py-3">Ref. Cotización</th>
                <th className="px-4 py-3">Fecha & Entrega</th>
                <th className="px-4 py-3 text-right">Total (+IVA)</th>
                <th className="px-4 py-3 text-center">Estatus</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-xs text-slate-500">
                    No se encontraron pedidos registrados.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-emerald-400 text-sm">
                      {order.folio}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-bold text-white block">{order.customerName}</span>
                      <span className="text-[11px] text-slate-400">Entrega: {order.shippingAddress || (order as any).deliveryAddress || 'Planta Principal'}</span>
                    </td>

                    <td className="px-4 py-3.5">
                      {order.quoteFolio ? (
                        <span className="font-mono text-blue-400 font-bold">{order.quoteFolio}</span>
                      ) : (
                        <span className="text-slate-500">Venta Directa</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="text-slate-200 block">{order.date || (order as any).orderDate || 'N/A'}</span>
                      <span className="text-[11px] text-slate-500">Promesa: {order.deliveryDate || (order as any).promisedDate || '3 días'}</span>
                    </td>

                    <td className="px-4 py-3.5 text-right font-bold text-white text-sm">
                      ${(Number(order.total) || 0).toLocaleString('es-MX')}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      {getStatusBadge(order.status)}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          id={`btn-order-action-printer-${order.folio}`}
                          onClick={() => handleViewOrder(order)}
                          title="Abrir Detalle del Pedido"
                          className="rounded p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                        >
                          <Printer className="h-4 w-4" />
                        </button>

                        {/* Operational buttons: strictly hidden for sales executives */}
                        {!isSalesExecutive && (
                          <>
                            {order.status !== 'ENTREGADO' && order.status !== 'CANCELADO' ? (
                              <div className="flex items-center gap-1">
                                {order.status === 'SURTIDO' ? (
                                  <button
                                    onClick={() => handleOpenDeliveryModal(order)}
                                    disabled={processingOrderId === order.id}
                                    title="Registrar Entrega y Despacho Físico"
                                    className="flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow hover:bg-emerald-500 transition-all disabled:opacity-50"
                                  >
                                    {processingOrderId === order.id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Truck className="h-3.5 w-3.5" />
                                    )}
                                    ENTREGA
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleAdvanceStatus(order)}
                                    disabled={processingOrderId === order.id}
                                    title={`Avanzar a ${order.status === 'PENDIENTE' ? 'En Surtido' : 'Surtido'}`}
                                    className="flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[11px] font-bold text-yellow-400 hover:bg-slate-700 transition-colors disabled:opacity-50"
                                  >
                                    {processingOrderId === order.id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Truck className="h-3.5 w-3.5" />
                                    )}
                                    {order.status === 'PENDIENTE' ? 'Surtir' : 'Terminar'}
                                  </button>
                                )}

                                {/* Secondary direct Entrega button for fast bypass when authorized */}
                                {order.status !== 'SURTIDO' && (
                                  <button
                                    onClick={() => handleOpenDeliveryModal(order)}
                                    disabled={processingOrderId === order.id}
                                    title="Despacho directo / Registrar Entrega"
                                    className="rounded bg-slate-800 p-1 text-[10px] text-slate-400 hover:text-emerald-400 hover:bg-slate-700"
                                  >
                                    <PackageCheck className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            ) : order.status === 'ENTREGADO' ? (
                              <span className="inline-flex items-center gap-1 rounded bg-emerald-950/80 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-800/60">
                                <Check className="h-3 w-3" />
                                Entregado
                              </span>
                            ) : null}
                          </>
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

      {/* New Order Modal */}
      {isNewOrderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs">
          <div className="flex w-full max-w-4xl flex-col rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 text-slate-950 font-bold">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Nuevo Pedido en Firme</h3>
                  <p className="text-xs text-slate-400">
                    Apartado y reserva directa de inventario en tiempo real
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewOrderOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrderSubmit} className="flex-1 p-6 space-y-5 overflow-y-auto">
              {/* Customer & Logistics Config */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/60 p-4 rounded-lg border border-slate-800">
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                    Cliente Comercial *
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-white focus:border-yellow-400 focus:outline-none"
                  >
                    {scopedCustomers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name || c.businessName} ({c.rfc || 'Sin RFC'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                    Almacén de Surtido *
                  </label>
                  <select
                    value={selectedWarehouseId}
                    onChange={(e) => setSelectedWarehouseId(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-white focus:border-yellow-400 focus:outline-none"
                  >
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>
                        {wh.name} ({wh.address || '—'})
                      </option>
                    )) || (
                      <>
                        <option value="ALM-01">Almacén Central (Planta QRO)</option>
                        <option value="ALM-02">CEDIS Norte (Monterrey)</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                    Fecha Promesa de Entrega *
                  </label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-yellow-400 focus:outline-none"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                    Dirección de Entrega / Destino de Suministro
                  </label>
                  <input
                    type="text"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder={selectedCustomer?.address || 'Domicilio fiscal del cliente'}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-yellow-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                    Instrucciones / Notas
                  </label>
                  <input
                    type="text"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Ej. Entregar en rampa 4 con cita"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-yellow-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Partidas del Pedido (Reserva Inmediata de Stock)
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-yellow-400 hover:bg-slate-700 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" /> Agregar Partida
                  </button>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-950 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-3 w-[45%]">Producto / Material</th>
                        <th className="p-3 w-[15%] text-right">Cantidad</th>
                        <th className="p-3 w-[18%] text-right">Precio Unit. (MXN)</th>
                        <th className="p-3 w-[17%] text-right">Subtotal</th>
                        <th className="p-3 w-[5%] text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {items.map((it, idx) => {
                        const prod = products.find((p) => p.id === it.productId);
                        const availableStock = QuoteAvailabilityService.getAvailableStock(prod);
                        return (
                          <tr key={idx}>
                            <td className="p-3">
                              <select
                                value={it.productId}
                                onChange={(e) => handleProductChange(idx, e.target.value)}
                                className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white focus:border-yellow-400 focus:outline-none"
                              >
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.code} - {p.name} (Disp: {QuoteAvailabilityService.getAvailableStock(p)})
                                  </option>
                                ))}
                              </select>
                              <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                                <span>Stock Físico: {prod?.stock || 0}</span>
                                <span>·</span>
                                <span className={availableStock >= it.quantity ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                                  Disponible Real: {availableStock}
                                </span>
                              </div>
                            </td>

                            <td className="p-3 text-right">
                              <input
                                type="number"
                                min="1"
                                value={it.quantity}
                                onChange={(e) => handleQuantityChange(idx, parseInt(e.target.value, 10))}
                                className="w-20 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-right text-xs font-bold text-white focus:border-yellow-400 focus:outline-none"
                              />
                            </td>

                            <td className="p-3 text-right">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={it.unitPrice}
                                onChange={(e) => handlePriceChange(idx, parseFloat(e.target.value))}
                                className="w-24 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-right text-xs text-white focus:border-yellow-400 focus:outline-none"
                              />
                            </td>

                            <td className="p-3 text-right font-mono font-bold text-emerald-400">
                              ${(Number(it.subtotal) || 0).toLocaleString('es-MX')}
                            </td>

                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="text-slate-500 hover:text-red-400 p-1"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals Box */}
              <div className="flex justify-end pt-2">
                <div className="w-72 space-y-2 rounded-lg border border-slate-800 bg-slate-950 p-4 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal Partidas:</span>
                    <span className="font-bold text-white">${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>IVA Trasladado (16%):</span>
                    <span className="font-bold text-white">${tax.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-2 text-sm font-black text-emerald-400">
                    <span>Total del Pedido:</span>
                    <span>${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setIsNewOrderOpen(false)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-900/30 hover:bg-emerald-500 transition-all"
                >
                  <Check className="h-4 w-4" />
                  Confirmar y Generar Pedido
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs">
          <div className="flex w-full max-w-3xl flex-col rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 text-slate-950 font-bold">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Pedido {viewingOrder.folio}</h3>
                  <p className="text-xs text-slate-400">Cliente: {viewingOrder.customerName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-order-modal-download-html"
                  onClick={() => handleDownloadOrderHTML(viewingOrder)}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700 shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" /> HTML
                </button>
                <button
                  type="button"
                  id="btn-order-modal-close-x"
                  onClick={() => setViewingOrder(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="Cerrar pedido"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
                <div>
                  <span className="text-slate-400">Cotización Origen:</span>
                  <p className="font-mono font-bold text-blue-400">{viewingOrder.quoteFolio || 'Venta Directa'}</p>
                </div>
                <div>
                  <span className="text-slate-400">Estatus de Suministro:</span>
                  <div className="mt-1">{getStatusBadge(viewingOrder.status)}</div>
                </div>
                <div>
                  <span className="text-slate-400">Dirección de Envío:</span>
                  <p className="font-semibold text-slate-200">{viewingOrder.shippingAddress || (viewingOrder as any).deliveryAddress || 'Domicilio Fiscal'}</p>
                </div>
                <div>
                  <span className="text-slate-400">Fecha de Registro:</span>
                  <p className="font-semibold text-slate-200">{viewingOrder.date || (viewingOrder as any).orderDate || 'N/A'} (Promesa: {viewingOrder.deliveryDate || (viewingOrder as any).promisedDate || '3 días'})</p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Partidas Surtidas / Reservadas en Almacén
                </h4>
                <div className="rounded-lg border border-slate-800 bg-slate-950 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 border-b border-slate-800 text-slate-400">
                      <tr>
                        <th className="p-2.5">Código</th>
                        <th className="p-2.5">Descripción</th>
                        <th className="p-2.5 text-right">Cant.</th>
                        <th className="p-2.5 text-right">P. Unitario</th>
                        <th className="p-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {viewingOrder.items.map((it, idx) => {
                        const itemSku = it.productCode || (it as any).sku || (it as any).productId || 'SKU';
                        const itemDesc = it.description || (it as any).productName || 'Material';
                        const itemQty = Number(it.quantity ?? (it as any).quantityOrdered ?? (it as any).quantityFulfilled ?? 1);
                        const itemPrice = Number(it.unitPrice || (it as any).price || 0);
                        const itemSubtotal = Number(it.subtotal || itemQty * itemPrice);

                        return (
                          <tr key={idx}>
                            <td className="p-2.5 font-mono font-bold text-yellow-400">{itemSku}</td>
                            <td className="p-2.5 text-slate-300">{itemDesc}</td>
                            <td className="p-2.5 text-right font-bold text-white">{itemQty.toLocaleString('es-MX')}</td>
                            <td className="p-2.5 text-right">${itemPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                            <td className="p-2.5 text-right font-bold text-emerald-400">${itemSubtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals Breakdown */}
              <div className="flex flex-col items-end gap-1 border-t border-slate-800 pt-3 text-xs">
                <div className="flex justify-between w-64 text-slate-400">
                  <span>Subtotal:</span>
                  <span className="font-mono text-slate-200">
                    ${(Number(viewingOrder.subtotal || viewingOrder.total / 1.16) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                  </span>
                </div>
                <div className="flex justify-between w-64 text-slate-400">
                  <span>IVA (16%):</span>
                  <span className="font-mono text-slate-200">
                    ${(Number(viewingOrder.tax || viewingOrder.total - (viewingOrder.total / 1.16)) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                  </span>
                </div>
                <div className="flex justify-between w-64 pt-1 border-t border-slate-800 text-sm">
                  <span className="font-bold text-white">Total Facturado (+IVA):</span>
                  <span className="font-mono font-black text-emerald-400">
                    ${(Number(viewingOrder.total) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-between items-center gap-3 border-t border-slate-800 bg-slate-950 px-6 py-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-order-modal-imprimir-remision"
                  onClick={() => handleOpenPrintPreview(viewingOrder)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Imprimir Remisión
                </button>

                {!isSalesExecutive && viewingOrder.status !== 'ENTREGADO' && viewingOrder.status !== 'CANCELADO' && (
                  <>
                    <button
                      onClick={() => handleAdvanceStatus(viewingOrder)}
                      disabled={processingOrderId === viewingOrder.id}
                      className="flex items-center gap-1.5 rounded-lg bg-yellow-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-yellow-400 disabled:opacity-50"
                    >
                      {processingOrderId === viewingOrder.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Truck className="h-3.5 w-3.5" />
                      )}
                      Avanzar Estatus (
                      {viewingOrder.status === 'PENDIENTE'
                        ? 'A Surtido'
                        : viewingOrder.status === 'EN_SURTIDO'
                        ? 'A Surtido Final'
                        : 'Entregar'}
                      )
                    </button>

                    <button
                      onClick={() => handleOpenDeliveryModal(viewingOrder)}
                      disabled={processingOrderId === viewingOrder.id}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-lg shadow-emerald-900/30 hover:bg-emerald-500 disabled:opacity-50"
                    >
                      <PackageCheck className="h-3.5 w-3.5" />
                      ENTREGA Y DESPACHO
                    </button>
                  </>
                )}
              </div>
              <button
                onClick={() => setViewingOrder(null)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Remisión Document Preview Modal (Read-Only Preview & Print Dialog) */}
      {previewPrintOrder && (
        <OrderPrintPreviewModal
          order={previewPrintOrder}
          customer={customers.find(
            (c) =>
              c.id === previewPrintOrder.customerId ||
              c.company_name === previewPrintOrder.customerName ||
              c.name === previewPrintOrder.customerName
          )}
          companyConfig={companyConfig}
          onClose={() => setPreviewPrintOrder(null)}
          onDownloadPDF={async () => {
            const matchedCustomer = customers.find(
              (c) =>
                c.id === previewPrintOrder.customerId ||
                c.company_name === previewPrintOrder.customerName ||
                c.name === previewPrintOrder.customerName
            );
            await downloadOrderPDF(previewPrintOrder, matchedCustomer, { companyConfig });
          }}
        />
      )}

      {/* Modal de Despacho y Entrega Físico */}
      {deliveryModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs">
          <div className="flex w-full max-w-2xl flex-col rounded-xl border border-emerald-500/40 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-800 bg-emerald-950/40 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 text-slate-950 font-bold">
                  <Truck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Confirmar Entrega y Despacho
                    <span className="font-mono text-emerald-400">[{deliveryModalOrder.folio}]</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Descarga automática de stock en almacén, liberación de reservas y actualización de Kardex
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDeliveryModalOrder(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmDeliverySubmit} className="overflow-y-auto p-6 space-y-4">
              {/* Order Info Banner */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Cliente Destino</span>
                  <span className="font-bold text-white">{deliveryModalOrder.customerName}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Dirección de Entrega</span>
                  <span className="text-slate-300">{deliveryModalOrder.shippingAddress || 'Planta Principal'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Total del Pedido</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    ${(Number(deliveryModalOrder.total) || 0).toLocaleString('es-MX')} MXN
                  </span>
                </div>
              </div>

              {/* Items Overview */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                  Partidas a Entregar ({deliveryModalOrder.items.length})
                </label>
                <div className="rounded-lg border border-slate-800 bg-slate-950 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/80 border-b border-slate-800 text-[10px] font-bold uppercase text-slate-400">
                      <tr>
                        <th className="p-2.5">Código</th>
                        <th className="p-2.5">Descripción</th>
                        <th className="p-2.5 text-right">Cant. Pedida</th>
                        <th className="p-2.5 text-center">Estado Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {deliveryModalOrder.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-mono font-bold text-yellow-400">{it.productCode}</td>
                          <td className="p-2.5">{it.description}</td>
                          <td className="p-2.5 text-right font-bold text-white">{it.quantity}</td>
                          <td className="p-2.5 text-center">
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-950 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-800/40">
                              <Check className="h-3 w-3" />
                              Disponible
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Form inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                    Nombre de Quien Recibe / Responsable *
                  </label>
                  <div className="relative">
                    <UserCheck className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={deliveryRecipient}
                      onChange={(e) => setDeliveryRecipient(e.target.value)}
                      placeholder="Ej. Ing. Carlos Mendoza / Almacén Central"
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                    Fecha de Entrega / Despacho
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="date"
                      value={deliveryDateInput}
                      onChange={(e) => setDeliveryDateInput(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                  Observaciones / Sello / No. Guía o Chofer
                </label>
                <textarea
                  rows={2}
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Detalles de entrega, placas de unidad, sello de recibido o condiciones de entrega..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Master Transaction ID audit notification */}
              {deliveryModalOrder.masterTransactionId && (
                <div className="rounded-lg bg-slate-950/90 border border-slate-800 p-2.5 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>ID Auditoría Master Transaction:</span>
                  <span className="font-mono text-emerald-400 font-bold">{deliveryModalOrder.masterTransactionId}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setDeliveryModalOrder(null)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={processingOrderId === deliveryModalOrder.id}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-900/30 hover:bg-emerald-500 disabled:opacity-50"
                >
                  {processingOrderId === deliveryModalOrder.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <PackageCheck className="h-4 w-4" />
                  )}
                  Confirmar Entrega y Despacho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
