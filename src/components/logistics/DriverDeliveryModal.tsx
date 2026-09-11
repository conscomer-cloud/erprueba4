import React, { useState, useRef, useEffect } from 'react';
import { RouteStop, FailureReason, DeliveryEvidence } from '../../types/erp';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  CheckCircle,
  AlertTriangle,
  Camera,
  PenTool,
  Upload,
  User,
  CreditCard,
  FileCheck,
  RotateCcw,
  Clock,
  ShieldCheck,
  AlertOctagon,
  Image as ImageIcon,
  Check,
  Trash2,
  Calendar,
  Hash,
  Truck,
  FileText,
  Printer,
  CheckCircle2,
  Loader2
} from 'lucide-react';

interface DriverDeliveryModalProps {
  stop: RouteStop;
  routeId: string;
  onConfirmDelivery: (
    evidence: DeliveryEvidence,
    deliveredItems: { orderItemId: string; quantityDelivered: number; quantityDifference: number; rejectionReason?: string }[]
  ) => void | Promise<any>;
  onConfirmFailure: (reason: FailureReason, comment: string, rescheduledDate?: string) => void;
  onClose: () => void;
}

// Client-side image compression to safe Base64 Data URL (Max 1000px, 75% quality JPEG)
const compressImageFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height && width > MAX_DIM) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else if (height > MAX_DIM) {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(event.target?.result as string);
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Generates a certified delivery receipt test image canvas as Base64 Data URL
const generateSampleReceiptDataUrl = (orderNumber: string, customer: string, recipient: string): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 420;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 600, 420);

  // Border & Header
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.strokeRect(15, 15, 570, 390);

  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('CONSCORE ERP IA — REMISIÓN DE ENTREGA', 35, 55);

  ctx.fillStyle = '#059669';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('✓ EVIDENCIA DIGITAL POD CERTIFICADA EN SITIO', 35, 80);

  // Divider
  ctx.strokeStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(35, 95);
  ctx.lineTo(565, 95);
  ctx.stroke();

  // Data fields
  ctx.fillStyle = '#475569';
  ctx.font = '12px sans-serif';
  ctx.fillText(`Pedido Folio: ${orderNumber}`, 35, 125);
  ctx.fillText(`Cliente: ${customer}`, 35, 150);
  ctx.fillText(`Receptor: ${recipient || 'Encargado de Almacén'}`, 35, 175);
  ctx.fillText(`Fecha y Hora: ${new Date().toLocaleString('es-MX')}`, 35, 200);
  ctx.fillText(`Ubicación: Descarga en Rampa Principal / Bodega`, 35, 225);

  // Box for stamp
  ctx.strokeStyle = '#059669';
  ctx.lineWidth = 3;
  ctx.strokeRect(360, 130, 200, 95);
  ctx.fillStyle = '#059669';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('MERCANCÍA RECIBIDA', 375, 160);
  ctx.font = '11px sans-serif';
  ctx.fillText('A ENTERA CONFORMIDAD', 385, 180);
  ctx.font = '9px monospace';
  ctx.fillText(`REF: ${Date.now().toString(36).toUpperCase()}`, 395, 205);

  // Mock Barcode
  ctx.fillStyle = '#1e293b';
  for (let x = 35; x < 565; x += 6) {
    const w = (x % 5 === 0 ? 3 : (x % 3 === 0 ? 2 : 1));
    ctx.fillRect(x, 260, w, 40);
  }
  ctx.font = '11px monospace';
  ctx.fillStyle = '#64748b';
  ctx.fillText(`*POD-${orderNumber}-${Date.now().toString(36).toUpperCase()}*`, 200, 320);

  ctx.font = 'italic 11px sans-serif';
  ctx.fillText('Certificación fotográfica de estiba y recepción de aislantes térmicos.', 35, 370);

  return canvas.toDataURL('image/jpeg', 0.8);
};

export const DriverDeliveryModal: React.FC<DriverDeliveryModalProps> = ({
  stop,
  routeId,
  onConfirmDelivery,
  onConfirmFailure,
  onClose,
}) => {
  const { orders } = useERP();
  const { currentUser } = useAuth();
  const isVendedor = currentUser?.role === 'VENDEDOR';

  // Existing evidence check: if stop is already delivered, open directly in VIEW POD mode!
  const existingEvidence: DeliveryEvidence | undefined = stop.evidence || (stop as any).deliveryEvidence;
  const isAlreadyDelivered = stop.status === 'DELIVERED' || stop.status === 'PARTIAL' || !!existingEvidence;

  const [activeMode, setActiveMode] = useState<'SUCCESS' | 'FAILURE'>(
    isAlreadyDelivered ? 'SUCCESS' : 'SUCCESS'
  );

  // Success Evidence Form State
  const [recipientName, setRecipientName] = useState(
    existingEvidence?.recipientName || existingEvidence?.receivedByName || stop.contactName || ''
  );
  const [recipientIdNumber, setRecipientIdNumber] = useState(
    existingEvidence?.recipientIdNumber || existingEvidence?.receivedByRole || ''
  );
  
  const now = new Date();
  const defaultDate = now.toISOString().slice(0, 10);
  const defaultTime = now.toTimeString().slice(0, 5);

  const [deliveryDate, setDeliveryDate] = useState(existingEvidence?.deliveryDate || defaultDate);
  const [deliveryTime, setDeliveryTime] = useState(existingEvidence?.deliveryTime || defaultTime);
  const [hasDigitalSignature, setHasDigitalSignature] = useState(
    !!(existingEvidence?.signature || existingEvidence?.signatureUrl)
  );
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(
    existingEvidence?.photoEvidence || existingEvidence?.photoEvidenceUrl || existingEvidence?.photoUrl || null
  );
  const [deliveryNotes, setDeliveryNotes] = useState(
    existingEvidence?.observations || existingEvidence?.notes || ''
  );

  // Submission / Loading feedback states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Item counts for partial or complete delivery
  // OBSERVACIÓN 01 — PRECARGA AUTOMÁTICA DE CANTIDADES
  // Fuente de verdad: Cantidad surtida físicamente / embarcada (NO debe iniciar en cero ni vacía)
  const [itemDeliveries, setItemDeliveries] = useState(() => {
    // 1. Si existe evidencia guardada previamente con partidas (modo consulta o re-inspección)
    if (existingEvidence?.items && existingEvidence.items.length > 0) {
      return existingEvidence.items.map((evItm) => {
        const matchingStopItm = stop.items?.find(
          (si) => si.orderItemId === evItm.orderItemId || si.productId === evItm.productId || si.productCode === evItm.sku
        );
        const shipped = evItm.qtyExpected !== undefined 
          ? evItm.qtyExpected 
          : (matchingStopItm?.quantityShipped || 0);
        const delivered = evItm.qtyReceived !== undefined 
          ? evItm.qtyReceived 
          : shipped;
        return {
          orderItemId: evItm.orderItemId || matchingStopItm?.orderItemId || evItm.productId || '',
          productId: evItm.productId || matchingStopItm?.productId,
          productCode: evItm.sku || matchingStopItm?.productCode || '',
          productName: evItm.description || matchingStopItm?.productName || '',
          unit: evItm.unit || matchingStopItm?.unit || 'PZA',
          quantityShipped: shipped,
          quantityDelivered: delivered,
          quantityDifference: evItm.difference !== undefined ? evItm.difference : Math.max(0, shipped - delivered),
          rejectionReason: evItm.rejectionReason || '',
        };
      });
    }

    // 2. Flujo operativo de entrega: Precargar automáticamente desde las partidas de la parada
    let baseItems = stop.items || [];
    if (baseItems.length === 0) {
      const order = orders?.find((o) => o.id === stop.orderId || o.folio === stop.orderNumber || o.order_number === stop.orderNumber);
      if (order && order.items) {
        baseItems = order.items.map((ordItm, idx) => {
          const qty = ordItm.quantityFulfilled > 0 ? ordItm.quantityFulfilled : (ordItm.quantityOrdered || 0);
          return {
            orderItemId: ordItm.id || `ITM-${idx}`,
            productId: ordItm.productId,
            productCode: ordItm.sku,
            productName: ordItm.productName,
            unit: ordItm.unit || 'PZA',
            quantityOrdered: ordItm.quantityOrdered || 0,
            quantityShipped: qty,
            quantityDelivered: qty,
            quantityDifference: 0,
          };
        });
      }
    }

    return baseItems.map((itm) => {
      // Regla de Oro: La fuente de verdad es la cantidad surtida físicamente / embarcada
      const shippedQty = itm.quantityShipped !== undefined && itm.quantityShipped > 0
        ? itm.quantityShipped
        : (itm.quantityOrdered || 0);

      // Si ya fue entregado previamente, conservamos lo entregado
      // Si es un registro NUEVO de POD, PRECARGAMOS con la cantidad embarcada/surtida
      // para que el usuario NO tenga que volver a capturar las cantidades autorizadas
      const deliveredQty = isAlreadyDelivered && itm.quantityDelivered !== undefined
        ? itm.quantityDelivered
        : shippedQty;

      const diff = Math.max(0, shippedQty - deliveredQty);

      return {
        orderItemId: itm.orderItemId,
        productId: itm.productId,
        productCode: itm.productCode,
        productName: itm.productName,
        unit: itm.unit || 'PZA',
        quantityShipped: shippedQty,
        quantityDelivered: deliveredQty,
        quantityDifference: diff,
        rejectionReason: itm.rejectionReason || '',
      };
    });
  });

  // Failure Form State
  const [failureReason, setFailureReason] = useState<FailureReason>('CLIENTE_AUSENTE');
  const [failureComment, setFailureComment] = useState('');
  const [rescheduledDate, setRescheduledDate] = useState('');

  // Signature canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load existing signature onto canvas if editing / viewing
  useEffect(() => {
    if (existingEvidence?.signature || existingEvidence?.signatureUrl) {
      const sig = existingEvidence.signature || existingEvidence.signatureUrl;
      if (sig && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            setHasDigitalSignature(true);
          };
          img.src = sig;
        }
      }
    }
  }, [existingEvidence]);

  // Coordinate conversion helper for mouse and touch
  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (isAlreadyDelivered) return;
    const coords = getCoordinates(e);
    if (!coords) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
    setErrorMessage(null);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing || isAlreadyDelivered) return;
    const coords = getCoordinates(e);
    if (!coords) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    setHasDigitalSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDigitalSignature(false);
  };

  // Real File selection / Camera capture handler
  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedDataUrl = await compressImageFile(file);
      setPhotoDataUrl(compressedDataUrl);
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage('No se pudo procesar la fotografía: ' + (err.message || 'Error desconocido'));
    }
  };

  // Quick sample photo button for instantaneous and deterministic verification
  const handleSimulatePhoto = () => {
    const sampleDataUrl = generateSampleReceiptDataUrl(
      stop.orderNumber,
      stop.customerName,
      recipientName
    );
    setPhotoDataUrl(sampleDataUrl);
    setErrorMessage(null);
  };

  const handleItemQuantityChange = (orderItemId: string, deliveredQty: number) => {
    setItemDeliveries((prev) =>
      prev.map((itm) => {
        if (itm.orderItemId !== orderItemId) return itm;
        const validDelivered = Math.max(0, Math.min(itm.quantityShipped, deliveredQty));
        const diff = itm.quantityShipped - validDelivered;
        return {
          ...itm,
          quantityDelivered: validDelivered,
          quantityDifference: diff,
          rejectionReason: diff > 0 ? (itm.rejectionReason || 'Diferencia / Rechazo en sitio') : '',
        };
      })
    );
  };

  const handleItemReasonChange = (orderItemId: string, reason: string) => {
    setItemDeliveries((prev) =>
      prev.map((itm) => (itm.orderItemId === orderItemId ? { ...itm, rejectionReason: reason } : itm))
    );
  };

  const isAnyPartial = itemDeliveries.some((itm) => itm.quantityDifference > 0);

  // Submit Handler with atomic validation and idempotency protection
  const handleSubmitSuccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent double click / submit

    const cleanRecipient = recipientName.trim();
    if (!cleanRecipient) {
      setErrorMessage('Por favor indica el nombre de la persona que recibe la mercancía.');
      return;
    }

    // Extract signature from canvas as clean PNG Base64
    const canvas = canvasRef.current;
    let signatureBase64 = '';
    if (canvas && hasDigitalSignature) {
      signatureBase64 = canvas.toDataURL('image/png');
    } else if (existingEvidence?.signature) {
      signatureBase64 = existingEvidence.signature;
    }

    if (!signatureBase64 || signatureBase64.length < 50) {
      setErrorMessage('La firma digital del receptor es obligatoria para certificar el POD.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const nowIso = new Date().toISOString();
    const timestampFormatted = `${deliveryDate} ${deliveryTime}`;

    const canonicalEvidence: DeliveryEvidence = {
      id: existingEvidence?.id || `POD-${stop.orderNumber}-${Date.now().toString(36).toUpperCase()}`,
      podId: existingEvidence?.podId || existingEvidence?.id || `POD-${stop.orderNumber}-${Date.now().toString(36).toUpperCase()}`,
      routeStopId: stop.id,
      deliveryId: stop.id,
      routeId: routeId,
      orderId: stop.orderId,
      orderNumber: stop.orderNumber,
      masterTransactionId: (stop as any).masterTransactionId || existingEvidence?.masterTransactionId,
      customerId: stop.customerId,
      customerName: stop.customerName,
      registeredByUserId: currentUser?.id || 'DRV-001',
      registeredByName: currentUser?.name || 'Operador de Entrega',
      recipientName: cleanRecipient,
      receivedByName: cleanRecipient,
      recipientIdNumber: recipientIdNumber.trim() || undefined,
      receivedByRole: recipientIdNumber.trim() || undefined,
      deliveryDate: deliveryDate,
      deliveryTime: deliveryTime,
      timestamp: timestampFormatted,
      signature: signatureBase64,
      signatureUrl: signatureBase64,
      photoEvidence: photoDataUrl || undefined,
      photoEvidenceUrl: photoDataUrl || undefined,
      photoUrl: photoDataUrl || undefined,
      observations: deliveryNotes.trim() || undefined,
      notes: deliveryNotes.trim() || undefined,
      comments: deliveryNotes.trim() || undefined,
      status: isAnyPartial ? 'PARTIAL' : 'ENTREGADO',
      items: itemDeliveries.map((it) => ({
        orderItemId: it.orderItemId,
        productId: it.productId || it.orderItemId,
        sku: it.productCode,
        description: it.productName,
        unit: it.unit || 'PZA',
        qtyExpected: it.quantityShipped,
        qtyReceived: it.quantityDelivered,
        difference: it.quantityDifference,
        rejectionReason: it.rejectionReason,
      })),
      createdAt: existingEvidence?.createdAt || nowIso,
      updatedAt: nowIso,
    };

    try {
      await onConfirmDelivery(canonicalEvidence, itemDeliveries);
      setSubmitSuccessMsg('Entrega registrada y certificada correctamente.');
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage('Error al persistir evidencia POD: ' + (err?.message || 'Error en guardado'));
    }
  };

  const handleSubmitFailure = (e: React.FormEvent) => {
    e.preventDefault();
    if (!failureComment.trim()) {
      setErrorMessage('Por favor especifica el motivo o descripción del fallo de entrega.');
      return;
    }
    onConfirmFailure(failureReason, failureComment.trim(), rescheduledDate || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 my-6 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${
              isAlreadyDelivered ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {isAlreadyDelivered ? <ShieldCheck className="h-6 w-6" /> : <FileCheck className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  {isAlreadyDelivered ? 'Evidencia de Entrega (POD) Certificada' : 'Registro de Entrega en Sitio (POD)'} · {stop.orderNumber}
                </h2>
                {isAlreadyDelivered && (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-300">
                    CERTIFICADO Y PERSISTIDO
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Cliente: <b>{stop.customerName}</b> | Parada #{stop.orderIndex} | {stop.deliveryAddress}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error / Success Banners */}
        {isVendedor && (
          <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold flex items-center gap-2 shrink-0">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>Acceso en modo solo lectura: El perfil comercial (Vendedor) no cuenta con facultades operativas para registrar o certificar entregas físicas POD.</span>
          </div>
        )}

        {errorMessage && (
          <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 shrink-0">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {submitSuccessMsg && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2 shrink-0 animate-fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{submitSuccessMsg}</span>
          </div>
        )}

        {/* Mode Selector Tabs (only shown if not delivered yet) */}
        {!isAlreadyDelivered && (
          <div className="grid grid-cols-2 gap-2 mt-4 p-1 bg-slate-100 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => { setActiveMode('SUCCESS'); setErrorMessage(null); }}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                activeMode === 'SUCCESS'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              Entrega Realizada / Parcial (POD)
            </button>
            <button
              type="button"
              onClick={() => { setActiveMode('FAILURE'); setErrorMessage(null); }}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                activeMode === 'FAILURE'
                  ? 'bg-white text-red-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertOctagon className="h-4 w-4 text-red-600" />
              Reportar Fallo / No Entregado
            </button>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto pr-1 py-4 space-y-4 text-xs">
          {activeMode === 'SUCCESS' ? (
            <form id="delivery-success-form" onSubmit={handleSubmitSuccess} className="space-y-4">
              {/* Recipient & Date info */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-blue-600" />
                    Datos de Entrega y Receptor
                  </span>
                  {existingEvidence?.masterTransactionId && (
                    <span className="font-mono text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      MTX: {existingEvidence.masterTransactionId}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                      Persona que Recibe <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        disabled={isAlreadyDelivered}
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="Nombre completo de quien recibe"
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900 focus:border-blue-500 focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-700"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                      Identificación / Puesto (INE, Gafete)
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        disabled={isAlreadyDelivered}
                        value={recipientIdNumber}
                        onChange={(e) => setRecipientIdNumber(e.target.value)}
                        placeholder="Ej. INE-84920 / Jefe de Patio"
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-700"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                      Fecha de Entrega
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="date"
                        disabled={isAlreadyDelivered}
                        value={deliveryDate}
                        onChange={(e) => setDeliveryDate(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white disabled:bg-slate-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                      Hora de Entrega
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="time"
                        disabled={isAlreadyDelivered}
                        value={deliveryTime}
                        onChange={(e) => setDeliveryTime(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white disabled:bg-slate-100"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Verification / Acceptance */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold uppercase text-slate-700 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-blue-600" />
                    Verificación de Materiales Recibidos
                  </span>
                  {isAnyPartial && (
                    <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-bold">
                      Entrega Parcial Detectada
                    </span>
                  )}
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {itemDeliveries.map((itm) => (
                    <div key={itm.orderItemId} className="p-3 bg-white hover:bg-slate-50 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900">{itm.productName}</p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {itm.productCode} · Enviados: <b>{itm.quantityShipped} {itm.unit}</b>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500">Recibidos:</span>
                          <input
                            type="number"
                            min="0"
                            disabled={isAlreadyDelivered}
                            max={itm.quantityShipped}
                            step="any"
                            value={itm.quantityDelivered}
                            onChange={(e) =>
                              handleItemQuantityChange(itm.orderItemId, parseFloat(e.target.value) || 0)
                            }
                            className={`w-20 px-2 py-1 text-center font-bold font-mono rounded-lg border text-xs ${
                              itm.quantityDifference > 0
                                ? 'border-amber-400 bg-amber-50 text-amber-900'
                                : 'border-slate-300 text-slate-900'
                            } disabled:bg-slate-100`}
                          />
                          <span className="text-[11px] font-semibold text-slate-600">{itm.unit}</span>
                        </div>
                      </div>

                      {itm.quantityDifference > 0 && (
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[10px] text-red-600 font-bold">
                            Faltan {itm.quantityDifference} {itm.unit}:
                          </span>
                          <input
                            type="text"
                            disabled={isAlreadyDelivered}
                            placeholder="Motivo del faltante o daño reportado por cliente..."
                            value={itm.rejectionReason}
                            onChange={(e) => handleItemReasonChange(itm.orderItemId, e.target.value)}
                            className="flex-1 px-2.5 py-1 text-[11px] rounded-lg border border-amber-300 bg-amber-50 text-slate-900 disabled:opacity-75"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Digital Signature Canvas & Display */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold uppercase text-slate-700 flex items-center gap-1.5">
                    <PenTool className="h-3.5 w-3.5 text-blue-600" />
                    Firma Digital de Recepción <span className="text-red-500">*</span>
                  </span>
                  {!isAlreadyDelivered && hasDigitalSignature && (
                    <button
                      type="button"
                      onClick={clearSignature}
                      className="text-[10px] text-red-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <RotateCcw className="h-3 w-3" /> Limpiar y Re-firmar
                    </button>
                  )}
                </div>

                {isAlreadyDelivered && (existingEvidence?.signature || existingEvidence?.signatureUrl) ? (
                  <div className="border border-emerald-300 rounded-xl p-3 bg-emerald-50/40 flex flex-col items-center justify-center">
                    <img
                      src={existingEvidence.signature || existingEvidence.signatureUrl}
                      alt="Firma Digital Guardada"
                      className="max-h-28 object-contain bg-white rounded-lg border border-emerald-200 p-2 shadow-2xs w-full"
                    />
                    <div className="mt-2 text-[10px] font-bold text-emerald-800 flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      Firma autógrafa verificada y persistida en sistema
                    </div>
                  </div>
                ) : (
                  <div className="border border-slate-300 rounded-xl p-1 bg-slate-50 relative">
                    <canvas
                      ref={canvasRef}
                      width={600}
                      height={150}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full h-32 bg-white rounded-lg border border-dashed border-slate-300 cursor-crosshair touch-none"
                    />
                    {!hasDigitalSignature && (
                      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400 text-xs">
                        <PenTool className="h-5 w-5 mb-1 text-slate-300" />
                        <span>Traza la firma del cliente aquí con el dedo o mouse</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Photo Evidence with real upload & sample generator */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold uppercase text-slate-700 flex items-center gap-1.5">
                    <Camera className="h-3.5 w-3.5 text-blue-600" />
                    Fotografía de Entrega / Manifiesto Sellado
                  </span>
                  {photoDataUrl && !isAlreadyDelivered && (
                    <button
                      type="button"
                      onClick={() => setPhotoDataUrl(null)}
                      className="text-[10px] text-red-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Trash2 className="h-3 w-3" /> Quitar Foto
                    </button>
                  )}
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
                  {photoDataUrl ? (
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <img
                        src={photoDataUrl}
                        alt="Evidencia fotográfica"
                        className="h-16 w-24 object-cover rounded-lg border border-slate-300 shadow-2xs bg-white"
                      />
                      <div>
                        <p className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> Fotografía Capturada y Persistida
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          evidencia_remision_{stop.orderNumber}.jpg
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-500 text-xs">
                      No se ha adjuntado fotografía de la descarga o remisión sellada.
                    </div>
                  )}

                  {!isAlreadyDelivered && (
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        capture="environment"
                        onChange={handlePhotoFileChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs"
                      >
                        <Upload className="h-3.5 w-3.5 text-slate-600" />
                        Subir Archivo / Cámara
                      </button>
                      <button
                        type="button"
                        onClick={handleSimulatePhoto}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 shadow-2xs"
                      >
                        <Camera className="h-3.5 w-3.5 text-blue-600" />
                        Capturar Muestra
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery Notes */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  Observaciones de Entrega
                </label>
                <textarea
                  rows={2}
                  disabled={isAlreadyDelivered}
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Ej. Material recibido en patio 2 por montacarguista Ramón. Todo en orden y sin daño."
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-700"
                />
              </div>
            </form>
          ) : (
            <form id="delivery-failure-form" onSubmit={handleSubmitFailure} className="space-y-4">
              <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-red-800">
                <p className="font-bold flex items-center gap-1.5 text-xs">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  Reporte de Incidencia de No Entrega
                </p>
                <p className="text-[11px] text-red-700 mt-1">
                  Al registrar un fallo, el pedido <b>{stop.orderNumber}</b> pasará a estatus de <b>INCIDENCIA / REPROGRAMADO</b> y se creará una incidencia operativa para seguimiento inmediato.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  Causa Principal del Fallo <span className="text-red-500">*</span>
                </label>
                <select
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value as FailureReason)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white"
                >
                  <option value="CLIENTE_AUSENTE">Cliente o Encargado Ausente / Cerrado</option>
                  <option value="ACCESO_DENEGADO">Acceso Denegado (Falta de pase EPP / Permiso)</option>
                  <option value="DIRECCION_ERRONEA">Dirección Errónea o Inaccesible</option>
                  <option value="RECHAZO_TOTAL">Rechazo Total por el Cliente</option>
                  <option value="FALLA_MECANICA">Falla Mecánica de la Unidad</option>
                  <option value="TIEMPO_EXCEDIDO">Tiempo Excedido / Fuera de Horario</option>
                  <option value="OTRO">Otro Motivo</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  Descripción Detallada del Incidente <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={failureComment}
                  onChange={(e) => setFailureComment(e.target.value)}
                  placeholder="Explica qué sucedió en sitio, con quién se tuvo contacto y detalles para el área de tráfico..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:border-red-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  Fecha de Reprogramación Sugerida (Opcional)
                </label>
                <input
                  type="date"
                  value={rescheduledDate}
                  onChange={(e) => setRescheduledDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white"
                />
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            {isAlreadyDelivered ? 'Cerrar' : 'Cancelar'}
          </button>
          
          {!isAlreadyDelivered && (
            <>
              {activeMode === 'SUCCESS' ? (
                <button
                  type="submit"
                  form="delivery-success-form"
                  disabled={isSubmitting || isVendedor}
                  className={`inline-flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold text-white shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isAnyPartial
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Guardando evidencia de entrega...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      {isAnyPartial ? 'Registrar Entrega Parcial (POD)' : 'Registrar Entrega (POD)'}
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="submit"
                  form="delivery-failure-form"
                  disabled={isSubmitting || isVendedor}
                  className="rounded-xl bg-red-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Registrar Fallo de Entrega
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
