import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ShieldCheck,
  UserCheck,
  MapPin,
  Box,
  Clock,
  Warehouse as WarehouseIcon,
  CheckSquare,
  Square,
  Save,
  Lock,
  ArrowRight,
  RotateCcw,
  PenTool,
  Check,
  Layers,
} from 'lucide-react';
import { Order, Picking, PickingItem } from '../../types/erp';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { generatePickingSheetPDF, sanitizePickingFileName, buildOperationalRows } from '../../utils/pickingPDFGenerator';
import { PickingSheetService } from '../../services/pickingSheetService';

interface PickingSheetModalProps {
  order: Order;
  onClose: () => void;
  onFulfillSuccess?: () => void;
}

export const PickingSheetModal: React.FC<PickingSheetModalProps> = ({
  order,
  onClose,
  onFulfillSuccess,
}) => {
  const { currentUser } = useAuth();
  const {
    products,
    warehouses,

    getOrCreatePicking,
    savePickingDraft,
    completePicking,
    updatePicking,
    verifyPicking,
    confirmPhysicalFulfillment,
  } = useERP();

  // Active view tab: 'DOCUMENT' (Clean operational sheet) | 'COUNTING' (Rack items entry) | 'VERIFICATION' (Manager signature)
  const [activeTab, setActiveTab] = useState<'DOCUMENT' | 'COUNTING' | 'VERIFICATION'>('DOCUMENT');

  // Load or create persistent picking
  const initialPicking = useMemo(() => {
    return getOrCreatePicking(order.id);
  }, [getOrCreatePicking, order.id]);

  const [currentPicking, setCurrentPicking] = useState<Picking>(initialPicking);

  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    initialPicking.items.forEach((item) => {
      const pQty = item.pickedQty !== undefined ? item.pickedQty : (item.qtyPicked !== undefined ? item.qtyPicked : 0);
      init[item.orderItemId] = pQty;
    });
    return init;
  });

  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    initialPicking.items.forEach((item) => {
      init[item.orderItemId] = item.status === 'SURTIDO' || order.status === 'SURTIDO';
    });
    return init;
  });

  const [warehouseNotes, setWarehouseNotes] = useState(initialPicking.notes || '');

  // Verification state
  const isJefeAlmacenOrAdmin = useMemo(() => {
    const role = currentUser?.role || '';
    return ['JEFE_ALMACEN', 'ADMINISTRADOR', 'DIRECTOR'].includes(role);
  }, [currentUser]);

  const [managerSignatureName, setManagerSignatureName] = useState(
    initialPicking.verifiedByName ||
    (isJefeAlmacenOrAdmin && currentUser?.name ? currentUser.name : 'Ing. Carlos Mendoza (Jefe de Almacén)')
  );
  const [signatureObservation, setSignatureObservation] = useState(
    initialPicking.verificationObservations || initialPicking.verificationNotes || 'Verificación física en rack completada conforme y certificada.'
  );

  // Digital Signature Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawnSignature, setHasDrawnSignature] = useState(
    Boolean(initialPicking.verificationSignature || initialPicking.managerSignature)
  );
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>(
    initialPicking.verificationSignature || initialPicking.managerSignature || ''
  );

  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isFulfilling, setIsFulfilling] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);

  const isVendedor = currentUser?.role === 'VENDEDOR';
  const isAlmacenOperativo = currentUser?.role === 'ALMACEN';
  const isFulfilled =
    order.status === 'SURTIDO' ||
    (order.status as any) === 'SURTIDO_PARCIAL' ||
    (order as any).fulfillmentStatus === 'SURTIDO' ||
    (order as any).fulfillmentStatus === 'SURTIDO_TOTAL' ||
    (order as any).fulfillmentStatus === 'SURTIDO_PARCIAL' ||
    currentPicking.status === 'SURTIDO_FISICO_CONFIRMADO' ||
    (currentPicking as any).physicalFulfillmentConfirmed === true;
  const isVerified = currentPicking.status === 'VERIFICADO';
  const isCompleted = currentPicking.status === 'COMPLETADO' || isVerified || isFulfilled;

  // Target warehouse
  const warehouse = useMemo(() => {
    return (
      warehouses.find((w) => w.id === order.warehouseId || w.id === currentPicking.warehouseId) ||
      warehouses[0] || {
        id: 'WH-01',
        name: 'Almacén Central Tultitlán',
        address: 'Parque Industrial Tultitlán, Nave 4',
      }
    );
  }, [warehouses, order.warehouseId, currentPicking.warehouseId]);

  // Operational rows for clean document table (with multi-location expansion)
  const operationalRows = useMemo(() => {
    return buildOperationalRows(currentPicking.items);
  }, [currentPicking.items]);

  // Initialize canvas drawing context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // If there is an existing signature and canvas is blank, draw placeholder or load image
    if (signatureDataUrl && signatureDataUrl.startsWith('data:image')) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = signatureDataUrl;
    }
  }, [activeTab, signatureDataUrl]);

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isVerified || !isJefeAlmacenOrAdmin) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawnSignature(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || isVerified || !isJefeAlmacenOrAdmin) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      setSignatureDataUrl(dataUrl);
    }
  };

  const clearSignature = () => {
    if (isVerified) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnSignature(false);
    setSignatureDataUrl('');
  };

  // Handle quantity change
  const handleQuantityChange = (orderItemId: string, rawVal: number, maxAvail: number, orderQty: number) => {
    if (isVendedor || isFulfilled) return;

    const ceiling = Math.min(orderQty, maxAvail > 0 ? maxAvail : orderQty);
    const sanitized = Math.max(0, Math.min(rawVal, ceiling));

    setQuantities((prev) => ({ ...prev, [orderItemId]: sanitized }));

    const updatedItems = currentPicking.items.map((pi) => {
      if (pi.orderItemId === orderItemId) {
        return {
          ...pi,
          qtyPicked: sanitized,
          pickedQty: sanitized,
          status: (sanitized >= pi.qtyRequested ? 'SURTIDO' : sanitized > 0 ? 'PARCIAL' : 'PENDIENTE') as any,
        };
      }
      return pi;
    });

    const updatedPicking: Picking = {
      ...currentPicking,
      items: updatedItems,
      notes: warehouseNotes,
      updatedAt: new Date().toISOString(),
    };

    setCurrentPicking(updatedPicking);
    updatePicking(updatedPicking);
  };

  const toggleCheck = (orderItemId: string) => {
    setCheckedItems((prev) => ({ ...prev, [orderItemId]: !prev[orderItemId] }));
  };

  // 1. ACCIÓN: GUARDAR BORRADOR
  const handleSaveDraft = async () => {
    if (isVendedor) {
      setFeedback({ text: '403 FORBIDDEN: El rol VENDEDOR no puede editar el picking.', ok: false });
      return;
    }

    setIsSavingDraft(true);
    setFeedback(null);
    try {
      const itemsToSave = currentPicking.items.map((pi) => {
        const pQty = quantities[pi.orderItemId] !== undefined ? quantities[pi.orderItemId] : (pi.pickedQty ?? pi.qtyPicked ?? 0);
        return {
          ...pi,
          qtyPicked: pQty,
          pickedQty: pQty,
          status: (pQty >= pi.qtyRequested ? 'SURTIDO' : pQty > 0 ? 'PARCIAL' : 'PENDIENTE') as any,
        };
      });

      const draftPicking: Picking = {
        ...currentPicking,
        status: currentPicking.status === 'VERIFICADO' || currentPicking.status === 'COMPLETADO' ? currentPicking.status : 'EN_PROCESO',
        items: itemsToSave,
        notes: warehouseNotes,
        updatedAt: new Date().toISOString(),
      };

      const res = await savePickingDraft(draftPicking);
      if (res.success && res.picking) {
        setCurrentPicking(res.picking);
        setFeedback({
          text: `✅ Borrador de picking guardado. Estado: ${res.picking.status}. Sin afectación a inventario físico ni Kardex.`,
          ok: true,
        });
      } else {
        setFeedback({ text: `❌ ${res.error || 'Error guardando borrador'}`, ok: false });
      }
    } catch (err: any) {
      setFeedback({ text: `❌ Error: ${err.message}`, ok: false });
    } finally {
      setIsSavingDraft(false);
    }
  };

  // 2. ACCIÓN: COMPLETAR PICKING
  const handleCompletePicking = async () => {
    if (isVendedor) {
      setFeedback({ text: '403 FORBIDDEN: El rol VENDEDOR no puede completar picking.', ok: false });
      return;
    }

    setIsCompleting(true);
    setFeedback(null);
    try {
      const itemsToSave = currentPicking.items.map((pi) => {
        const pQty = quantities[pi.orderItemId] !== undefined ? quantities[pi.orderItemId] : (pi.pickedQty ?? pi.qtyPicked ?? 0);
        return {
          ...pi,
          qtyPicked: pQty,
          pickedQty: pQty,
        };
      });

      const pickingWithQuantities: Picking = {
        ...currentPicking,
        items: itemsToSave,
        notes: warehouseNotes,
      };
      await savePickingDraft(pickingWithQuantities);

      const res = await completePicking(currentPicking.id, warehouseNotes);
      if (res.success && res.picking) {
        setCurrentPicking(res.picking);
        setFeedback({
          text: `✅ Picking completado con éxito (${res.fulfillmentType}). Listo para verificación y firma del Jefe de Almacén.`,
          ok: true,
        });
      } else {
        setFeedback({ text: `❌ ${res.error || 'Error al completar picking'}`, ok: false });
      }
    } catch (err: any) {
      setFeedback({ text: `❌ Error: ${err.message}`, ok: false });
    } finally {
      setIsCompleting(false);
    }
  };

  // 3. ACCIÓN: VERIFICACIÓN Y FIRMA (Jefe de Almacén)
  const handleVerify = async () => {
    // Validación de SoD (Segregación de Funciones)
    if (!isJefeAlmacenOrAdmin) {
      setFeedback({
        text: '❌ 403 FORBIDDEN: Segregación de Funciones (SoD). Únicamente el JEFE DE ALMACÉN o ADMINISTRADOR cuenta con autorización para verificar y certificar la Hoja de Picking.',
        ok: false,
      });
      return;
    }

    let sigToSend = signatureDataUrl;
    if (!sigToSend || sigToSend.length < 50) {
      sigToSend = `CERTIFIED_DIGITAL_${currentUser?.id || 'JEFE'}_${Date.now()}`;
    }

    setIsVerifying(true);
    setFeedback(null);
    try {
      const res = await verifyPicking(
        currentPicking.id,
        sigToSend,
        signatureObservation || 'Verificación física en rack completada conforme y certificada.'
      );
      if (res.success && res.picking) {
        setCurrentPicking(res.picking);
        setSignatureDataUrl(res.picking.verificationSignature || res.picking.managerSignature || sigToSend);
        setFeedback({
          text: `✅ Hoja de Picking verificada y firmada exitosamente por ${managerSignatureName}. Estado: VERIFICADO. (Inventario físico y Kardex inmutables hasta confirmación de salida).`,
          ok: true,
        });
        setActiveTab('DOCUMENT');
      } else {
        setFeedback({ text: `❌ ${res.error}`, ok: false });
      }
    } catch (err: any) {
      setFeedback({ text: `❌ Error verificando: ${err.message}`, ok: false });
    } finally {
      setIsVerifying(false);
    }
  };

  // 4. ACCIÓN: DESCARGAR PDF ESTRUCTURADO (jspdf nativo)
  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const doc = await generatePickingSheetPDF(currentPicking, order, {
        companyName: 'CONSCORE INDUSTRIAL S.A. DE C.V.',
      });
      const fileName = sanitizePickingFileName(order.folio || (order as any).order_number, currentPicking.pickingId);
      doc.save(fileName);
      setFeedback({
        text: `✅ Documento oficial generado y descargado: ${fileName}`,
        ok: true,
      });
    } catch (err: any) {
      setFeedback({
        text: `❌ Error al generar PDF: ${err.message}`,
        ok: false,
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // 5. ACCIÓN: IMPRIMIR HOJA LIMPIA (Sin UI del ERP)
  const handlePrintCleanSheet = () => {
    const cleanPrintWindow = window.open('', '_blank', 'width=850,height=1100');
    if (!cleanPrintWindow) {
      setFeedback({
        text: 'Por favor autorice ventanas emergentes para imprimir la Hoja de Picking.',
        ok: false,
      });
      return;
    }

    const rowsHtml = operationalRows
      .map(
        (r) => `
        <tr>
          <td style="font-weight: bold; font-family: monospace;">${r.sku}</td>
          <td>${r.productName}</td>
          <td style="text-align: right;">${r.qtyRequested > 0 ? r.qtyRequested.toLocaleString('es-MX') : '—'}</td>
          <td style="text-align: right; font-weight: bold;">${r.qtyToPick.toLocaleString('es-MX')}</td>
          <td style="font-family: monospace;">${r.location}</td>
          <td style="text-align: right;">${r.existence.toLocaleString('es-MX')}</td>
          <td style="text-align: center; font-weight: bold; font-size: 13pt;">[  ]</td>
        </tr>
      `
      )
      .join('');

    const isDocVerified = currentPicking.status === 'VERIFICADO';
    const rawSig = currentPicking.verificationSignature || currentPicking.managerSignature;
    const vDate = currentPicking.verifiedAt
      ? new Date(currentPicking.verifiedAt).toLocaleDateString('es-MX')
      : '____/____/________';
    const vTime = currentPicking.verifiedAt
      ? new Date(currentPicking.verifiedAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
      : '____:____';
    const vObs = currentPicking.verificationObservations || currentPicking.verificationNotes || 'Verificación en rack completada.';

    let signatureHtml = '';
    if (isDocVerified && rawSig) {
      if (rawSig.startsWith('data:image')) {
        signatureHtml = `<img src="${rawSig}" style="max-height: 48px; max-width: 160px; object-fit: contain;" />`;
      } else {
        signatureHtml = `<div style="border: 1px dashed #10b981; padding: 4px; font-family: monospace; font-size: 8pt; color: #065f46; background: #ecfdf5;">✓ FIRMADO DIGITALMENTE<br/>ID: ${rawSig.substring(0, 20)}</div>`;
      }
    } else {
      signatureHtml = `<div style="border-bottom: 1px solid #64748b; height: 36px; width: 180px;"></div><div style="font-size: 8pt; color: #64748b; margin-top: 3px;">Firma manual Jefe de Almacén</div>`;
    }

    cleanPrintWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${sanitizePickingFileName(order.folio || (order as any).order_number, currentPicking.pickingId).replace('.pdf', '')}</title>
          <style>
            @page { size: letter portrait; margin: 14mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; margin: 0; padding: 0; font-size: 9pt; }
            .header-bar { border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 8px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 12px; border-radius: 4px; margin-bottom: 12px; font-size: 8.5pt; }
            .meta-label { font-size: 7pt; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 2px; }
            .meta-value { font-weight: bold; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 8.5pt; }
            th, td { border: 1px solid #cbd5e1; padding: 5px 7px; }
            th { background: #f1f5f9; font-weight: bold; text-align: center; font-size: 7.5pt; text-transform: uppercase; }
            .verification-box { margin-top: 18px; border-top: 2px solid #0f172a; padding-top: 10px; }
            .cert-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 16px; background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px 14px; border-radius: 4px; margin-top: 6px; }
          </style>
        </head>
        <body>
          <div class="header-bar">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <div style="font-size: 8pt; font-weight: bold; color: #64748b;">CONSCORE INDUSTRIAL · OPERACIÓN DE ALMACÉN</div>
                <h1 style="font-size: 15pt; font-weight: bold; margin: 2px 0;">HOJA DE PICKING OPERATIVO</h1>
                <div style="font-size: 8pt; color: #475569;">Cliente: <strong>${(order.customerName || (order as any).customer_name || 'Cliente B2B').slice(0, 45)}</strong></div>
              </div>
              <div style="text-align: right; background: #f1f5f9; border: 1px solid #cbd5e1; padding: 6px 12px; border-radius: 4px;">
                <div style="font-size: 7pt; font-weight: bold; color: #64748b;">PICKING ID: <strong>${currentPicking.pickingId}</strong></div>
                <div style="font-size: 9pt; font-weight: bold; color: #1d4ed8;">PEDIDO: ${order.folio || (order as any).order_number}</div>
              </div>
            </div>
          </div>

          <div class="meta-grid">
            <div>
              <div class="meta-label">Almacén</div>
              <div class="meta-value">${warehouse.name}</div>
            </div>
            <div>
              <div class="meta-label">Fecha Emisión</div>
              <div class="meta-value">${currentPicking.createdAt ? new Date(currentPicking.createdAt).toLocaleDateString('es-MX') : new Date().toLocaleDateString('es-MX')}</div>
            </div>
            <div>
              <div class="meta-label">Responsable Surtido</div>
              <div class="meta-value">${currentPicking.createdByName || 'Operador de Almacén'}</div>
            </div>
            <div>
              <div class="meta-label">Estado de Picking</div>
              <div class="meta-value" style="color: ${isDocVerified ? '#10b981' : isFulfilled ? '#2563eb' : '#d97706'}">
                ${isDocVerified ? 'VERIFICADO' : isFulfilled ? 'SURTIDO FÍSICO' : isCompleted ? 'COMPLETADO' : 'EN PROCESO'}
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 80px; text-align: left;">SKU</th>
                <th style="text-align: left;">PRODUCTO</th>
                <th style="width: 75px; text-align: right;">SOLICITADA</th>
                <th style="width: 75px; text-align: right;">A SURTIR</th>
                <th style="width: 140px; text-align: left;">UBICACIÓN</th>
                <th style="width: 75px; text-align: right;">EXISTENCIA</th>
                <th style="width: 50px; text-align: center;">CHECK</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="verification-box">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <strong style="font-size: 9.5pt; text-transform: uppercase;">VERIFICACIÓN JEFE DE ALMACÉN</strong>
              <span style="font-size: 8pt; font-weight: bold; color: ${isDocVerified ? '#10b981' : '#d97706'};">
                ${isDocVerified ? '● CERTIFICADO Y VERIFICADO' : '○ PENDIENTE DE VERIFICACIÓN'}
              </span>
            </div>

            <div class="cert-grid">
              <div>
                <div style="margin-bottom: 4px;"><strong>Nombre:</strong> ${isDocVerified ? (currentPicking.verifiedByName || managerSignatureName) : '____________________________________'}</div>
                <div style="margin-bottom: 4px;"><strong>Fecha:</strong> ${vDate} &nbsp;&nbsp;&nbsp; <strong>Hora:</strong> ${vTime}</div>
                <div style="font-size: 8pt; color: #475569; margin-top: 6px;">
                  <strong>Observaciones:</strong> ${isDocVerified ? vObs : '__________________________________________________'}
                </div>
              </div>
              <div style="text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <div style="font-size: 7.5pt; font-weight: bold; color: #64748b; margin-bottom: 4px;">FIRMA DE VERIFICACIÓN</div>
                ${signatureHtml}
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    cleanPrintWindow.document.close();
    cleanPrintWindow.focus();
    setTimeout(() => {
      cleanPrintWindow.print();
    }, 400);
  };

  // 6. ACCIÓN: CONFIRMAR SURTIDO FÍSICO
  const handleConfirmFulfillment = async () => {
    if (isVendedor) {
      setFeedback({ text: '403 FORBIDDEN: El rol VENDEDOR no cuenta con autorización para confirmar surtido físico.', ok: false });
      return;
    }

    if (currentPicking.status !== 'COMPLETADO' && currentPicking.status !== 'VERIFICADO') {
      setFeedback({
        text: 'El picking debe estar completado antes de confirmar surtido físico.',
        ok: false,
      });
      return;
    }

    setIsFulfilling(true);
    setFeedback(null);
    try {
      const res = await confirmPhysicalFulfillment(
        order.id,
        currentPicking.id,
        warehouseNotes || currentPicking.notes || 'Surtido físico verificado en rack.'
      );

      if (res.success && res.picking) {
        setCurrentPicking(res.picking);
        const summary = res.summary;
        const msg = res.isIdempotent
          ? 'Este pedido ya tiene el surtido físico confirmado.'
          : (res.message || `Surtido físico confirmado.\nPartidas surtidas: ${summary?.itemsCount || res.picking.items.length}\nUnidades surtidas: ${summary?.unitsFulfilled || 0}\nEstado: ${res.order?.status || 'SURTIDO'}`);

        setFeedback({
          text: `✅ ${msg}`,
          ok: true,
        });
        if (onFulfillSuccess) onFulfillSuccess();
      } else {
        setFeedback({ text: `❌ ${res.error || 'Error al confirmar surtido físico'}`, ok: false });
      }
    } catch (err: any) {
      setFeedback({ text: `❌ Error al confirmar surtido: ${err.message}`, ok: false });
    } finally {
      setIsFulfilling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl my-auto overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <FileText className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Hoja de Picking Operativo · {currentPicking.pickingId}
                </h3>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isVerified
                      ? 'bg-emerald-100 text-emerald-800'
                      : isFulfilled
                      ? 'bg-blue-100 text-blue-800'
                      : isCompleted
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isVerified ? 'VERIFICADO' : isFulfilled ? 'SURTIDO FÍSICO' : isCompleted ? 'COMPLETADO' : 'EN PROCESO'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Pedido: <strong className="font-mono text-slate-700">{order.folio || (order as any).order_number}</strong> · Cliente: {order.customerName || (order as any).customer_name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick action buttons */}
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition shadow-2xs disabled:opacity-50"
              title="Descargar documento PDF estructurado"
            >
              <Download className="h-3.5 w-3.5 text-blue-600" />
              <span>{isGeneratingPDF ? 'Generando...' : 'Descargar PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrintCleanSheet}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition shadow-2xs"
              title="Imprimir Hoja de Picking limpia"
            >
              <Printer className="h-3.5 w-3.5 text-slate-600" />
              <span>Imprimir</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 bg-white border-b border-slate-200">
          <button
            onClick={() => setActiveTab('DOCUMENT')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'DOCUMENT'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Hoja de Picking (Documento Oficial)</span>
          </button>

          <button
            onClick={() => setActiveTab('COUNTING')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'COUNTING'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Box className="h-4 w-4" />
            <span>Captura y Conteo en Rack ({currentPicking.items.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('VERIFICATION')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'VERIFICATION'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Firma y Verificación (Jefe Almacén)</span>
            {isVerified && <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />}
          </button>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`mx-6 mt-4 p-3.5 rounded-xl text-xs font-medium flex items-center justify-between shadow-2xs ${
              feedback.ok
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-red-50 text-red-900 border border-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.ok ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs font-bold px-2 py-0.5 bg-white rounded border border-slate-200 hover:bg-slate-50"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: CLEAN OPERATIONAL DOCUMENT */}
          {activeTab === 'DOCUMENT' && (
            <div className="bg-white border border-slate-300 rounded-xl p-6 sm:p-8 shadow-xs text-slate-900 font-sans">
              {/* Encabezado Simplificado */}
              <div className="border-b-2 border-slate-900 pb-4 mb-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      CONSCORE INDUSTRIAL · ALMACÉN CENTRAL
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                      HOJA DE PICKING OPERATIVO
                    </h1>
                    <div className="text-xs text-slate-600 mt-1">
                      Cliente: <strong className="text-slate-900">{(order.customerName || (order as any).customer_name || 'Cliente B2B').slice(0, 50)}</strong>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-300 rounded-lg p-3 text-right text-xs">
                    <div className="text-[10px] font-bold uppercase text-slate-500">PICKING ID</div>
                    <div className="font-mono font-black text-slate-900 text-sm">{currentPicking.pickingId}</div>
                    <div className="text-[10px] font-bold uppercase text-slate-500 mt-1">PEDIDO</div>
                    <div className="font-mono font-bold text-blue-700 text-sm">{order.folio || (order as any).order_number}</div>
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-200 text-xs bg-slate-50/50 p-2.5 rounded-lg border">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">Almacén</span>
                    <span className="font-semibold text-slate-900">{warehouse.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">Fecha Emisión</span>
                    <span className="font-semibold text-slate-900">
                      {currentPicking.createdAt ? new Date(currentPicking.createdAt).toLocaleDateString('es-MX') : new Date().toLocaleDateString('es-MX')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">Responsable de Surtido</span>
                    <span className="font-semibold text-slate-900">{currentPicking.createdByName || 'Operador de Almacén'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">Estado del Picking</span>
                    <span
                      className={`font-bold ${
                        isVerified ? 'text-emerald-700' : isFulfilled ? 'text-blue-700' : 'text-amber-700'
                      }`}
                    >
                      {isVerified ? 'VERIFICADO' : isFulfilled ? 'SURTIDO FÍSICO' : isCompleted ? 'COMPLETADO' : 'EN PROCESO'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tabla Principal Operativa (Sin precios, sin costos, sin datos financieros) */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Box className="h-4 w-4 text-slate-600" />
                    Partidas a Surtir ({operationalRows.length} Líneas Operativas)
                  </h4>
                  <span className="text-[11px] text-slate-500 font-mono">
                    MTX: {currentPicking.masterTransactionId}
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-300 rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5 w-28">SKU</th>
                        <th className="p-2.5">PRODUCTO</th>
                        <th className="p-2.5 text-right w-24">SOLICITADA</th>
                        <th className="p-2.5 text-right w-24">A SURTIR</th>
                        <th className="p-2.5 w-36">UBICACIÓN</th>
                        <th className="p-2.5 text-right w-24">EXISTENCIA</th>
                        <th className="p-2.5 w-16 text-center">CHECK</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {operationalRows.map((row, idx) => (
                        <tr key={idx} className={row.isSubLocation ? 'bg-slate-50/70' : 'hover:bg-slate-50'}>
                          <td className="p-2.5 font-mono font-bold text-slate-900">{row.sku}</td>
                          <td className="p-2.5 font-medium text-slate-800">{row.productName}</td>
                          <td className="p-2.5 text-right text-slate-600 font-medium">
                            {row.qtyRequested > 0 ? row.qtyRequested.toLocaleString('es-MX') : '—'}
                          </td>
                          <td className="p-2.5 text-right font-black text-slate-900">
                            {row.qtyToPick.toLocaleString('es-MX')}
                          </td>
                          <td className="p-2.5 font-mono text-slate-700">
                            <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                              <MapPin className="h-3 w-3 text-slate-500" />
                              {row.location}
                            </span>
                          </td>
                          <td className="p-2.5 text-right font-semibold text-slate-700">
                            {row.existence.toLocaleString('es-MX')}
                          </td>
                          <td className="p-2.5 text-center font-bold text-slate-400 text-sm">
                            [ &nbsp; ]
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sección de Verificación: JEFE DE ALMACÉN */}
              <div className="border-t-2 border-slate-900 pt-4 mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    VERIFICACIÓN JEFE DE ALMACÉN
                  </h4>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                      isVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isVerified ? '● CERTIFICADO Y VERIFICADO' : '○ PENDIENTE DE VERIFICACIÓN'}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-300 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Datos de certificación */}
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-bold text-slate-500 text-[10px] uppercase block">Nombre del Jefe de Almacén</span>
                      <span className="font-semibold text-slate-900 text-sm">
                        {isVerified ? currentPicking.verifiedByName || managerSignatureName : 'Pendiente de verificación en rack'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="font-bold text-slate-500 text-[10px] uppercase block">Fecha</span>
                        <span className="font-medium text-slate-800">
                          {currentPicking.verifiedAt ? new Date(currentPicking.verifiedAt).toLocaleDateString('es-MX') : '____/____/________'}
                        </span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-500 text-[10px] uppercase block">Hora</span>
                        <span className="font-medium text-slate-800">
                          {currentPicking.verifiedAt ? new Date(currentPicking.verifiedAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '____:____'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="font-bold text-slate-500 text-[10px] uppercase block">Observaciones</span>
                      <p className="text-slate-700 italic text-[11px]">
                        {isVerified ? (currentPicking.verificationObservations || currentPicking.verificationNotes) : 'Sin observaciones registradas.'}
                      </p>
                    </div>
                  </div>

                  {/* Firma */}
                  <div className="flex flex-col items-center justify-center border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-6 text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">
                      Firma de Verificación
                    </span>

                    {isVerified && (currentPicking.verificationSignature || currentPicking.managerSignature) ? (
                      <div className="bg-white p-2 rounded border border-slate-200 max-w-[220px]">
                        {(currentPicking.verificationSignature || currentPicking.managerSignature)?.startsWith('data:image') ? (
                          <img
                            src={currentPicking.verificationSignature || currentPicking.managerSignature}
                            alt="Firma Jefe Almacén"
                            className="max-h-16 max-w-full object-contain mx-auto"
                          />
                        ) : (
                          <div className="bg-emerald-50 text-emerald-800 text-[10px] font-mono p-2 rounded border border-emerald-200">
                            ✓ FIRMADO DIGITALMENTE
                            <div className="text-[9px] text-emerald-600 truncate">
                              {(currentPicking.verificationSignature || currentPicking.managerSignature)?.slice(0, 24)}
                            </div>
                          </div>
                        )}
                        <span className="text-[9px] text-slate-400 block mt-1">Firma digital certificada</span>
                      </div>
                    ) : (
                      <div className="w-48 border-b-2 border-slate-400 pb-1 mt-4 text-center">
                        <span className="text-[10px] text-slate-400">Espacio para firma física manual</span>
                      </div>
                    )}

                    {!isVerified && isJefeAlmacenOrAdmin && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('VERIFICATION')}
                        className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-800 underline"
                      >
                        Ir a pestaña de Firma y Verificación →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COUNTING & RACK QUANTITY ADJUSTMENT */}
          {activeTab === 'COUNTING' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-xs text-blue-900">
                <p className="font-bold">Instrucciones de Conteo y Extracción:</p>
                <p className="text-blue-700 mt-0.5">
                  Ingrese las cantidades físicas recolectadas de cada material en rack. El picking permite surtido parcial en caso de falta de existencia. La Hoja de Picking reflejará fielmente la cantidad a surtir (pickedQty).
                </p>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10.5px]">
                    <tr>
                      <th className="p-3 w-10 text-center">#</th>
                      <th className="p-3 w-28">SKU</th>
                      <th className="p-3">Material</th>
                      <th className="p-3 w-36">Ubicación Rack</th>
                      <th className="p-3 text-right w-24">Disponible</th>
                      <th className="p-3 text-right w-24">Pedido</th>
                      <th className="p-3 text-right w-36">Surtido Real</th>
                      <th className="p-3 text-center w-24">Estatus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {currentPicking.items.map((item, idx) => {
                      const prod = products.find(
                        (p) => p.id === item.productId || p.code === item.productCode || p.sku === item.productCode
                      );
                      const maxAvail = prod?.stock ?? prod?.physicalStock ?? item.qtyAvailable ?? 0;
                      const req = item.orderQty !== undefined ? item.orderQty : item.qtyRequested;
                      const currentPickedVal = quantities[item.orderItemId] ?? item.pickedQty ?? item.qtyPicked ?? req;

                      return (
                        <tr key={item.id || idx} className="hover:bg-slate-50">
                          <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="p-3 font-mono font-bold text-slate-900">{item.sku || item.productCode}</td>
                          <td className="p-3">
                            <p className="font-semibold text-slate-900">{item.description || item.productName}</p>
                            <span className="text-[10px] text-slate-400 uppercase">Unidad: {item.unit}</span>
                          </td>
                          <td className="p-3 font-mono text-slate-700">
                            <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-1 rounded border border-slate-200 text-[11px]">
                              <MapPin className="h-3 w-3 text-slate-500" />
                              {item.location || 'Rack General / N1'}
                            </span>
                          </td>
                          <td className="p-3 text-right font-medium text-slate-600">{maxAvail.toLocaleString('es-MX')}</td>
                          <td className="p-3 text-right font-bold text-slate-700">{req.toLocaleString('es-MX')}</td>
                          <td className="p-3 text-right">
                            <input
                              type="number"
                              min={0}
                              max={Math.min(req, maxAvail > 0 ? maxAvail : req)}
                              disabled={isVendedor || isFulfilled || isVerified}
                              value={currentPickedVal}
                              onChange={(e) =>
                                handleQuantityChange(
                                  item.orderItemId,
                                  parseFloat(e.target.value) || 0,
                                  maxAvail,
                                  req
                                )
                              }
                              className="w-24 text-right font-mono font-bold px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 text-xs disabled:bg-slate-100"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                currentPickedVal >= req
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : currentPickedVal > 0
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {currentPickedVal >= req ? 'SURTIDO' : currentPickedVal > 0 ? 'PARCIAL' : 'PENDIENTE'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Botones de acción del Almacenista */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={isSavingDraft || isVendedor || isVerified}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    <span>{isSavingDraft ? 'Guardando...' : 'Guardar Borrador'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCompletePicking}
                    disabled={isCompleting || isVendedor || isVerified}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
                  >
                    <Check className="h-4 w-4" />
                    <span>{isCompleting ? 'Completando...' : 'Completar Picking'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('VERIFICATION')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <span>Avanzar a Verificación</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: VERIFICATION & DIGITAL SIGNATURE CANVAS */}
          {activeTab === 'VERIFICATION' && (
            <div className="space-y-6">
              {/* SoD Warning / Role Badge */}
              {!isJefeAlmacenOrAdmin && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold">Segregación de Funciones (SoD)</h5>
                    <p className="mt-0.5 text-amber-800">
                      Usted ha iniciado sesión como <strong>{currentUser?.name || 'Usuario'}</strong> ({currentUser?.role}).
                      Por normativa de auditoría, el almacenista operativo que realiza la recolección física no puede autocertificar el documento. La firma de verificación está reservada para el <strong>Jefe de Almacén</strong> o <strong>Administrador</strong>.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Formulario de Certificación */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                      <UserCheck className="h-4 w-4 text-blue-600" />
                      Datos del Verificador Autorizado
                    </span>
                    {isVerified && (
                      <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> VERIFICADO
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                        Nombre del Jefe de Almacén
                      </label>
                      <input
                        type="text"
                        disabled={isVerified || !isJefeAlmacenOrAdmin}
                        value={managerSignatureName}
                        onChange={(e) => setManagerSignatureName(e.target.value)}
                        placeholder="Ing. Carlos Mendoza / Jefe Almacén"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 text-slate-800 font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                        Observaciones de Verificación Física
                      </label>
                      <textarea
                        rows={3}
                        disabled={isVerified || !isJefeAlmacenOrAdmin}
                        value={signatureObservation}
                        onChange={(e) => setSignatureObservation(e.target.value)}
                        placeholder="Verificación física en rack completada conforme..."
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 text-slate-800"
                      />
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                      <div className="flex justify-between text-slate-500">
                        <span>Folio Pedido:</span>
                        <strong className="text-slate-800 font-mono">{order.folio || (order as any).order_number}</strong>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Picking ID:</span>
                        <strong className="text-slate-800 font-mono">{currentPicking.pickingId}</strong>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Master Tx ID:</span>
                        <strong className="text-slate-600 font-mono text-[10.5px]">{currentPicking.masterTransactionId}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Canvas de Firma Digital */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <span className="text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                        <PenTool className="h-4 w-4 text-emerald-600" />
                        Firma Digital Manuscrita en Pantalla
                      </span>
                      {!isVerified && hasDrawnSignature && isJefeAlmacenOrAdmin && (
                        <button
                          type="button"
                          onClick={clearSignature}
                          className="text-[11px] font-semibold text-slate-500 hover:text-red-600 flex items-center gap-1 transition"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Limpiar
                        </button>
                      )}
                    </div>

                    <div className="mt-3">
                      <p className="text-[11px] text-slate-500 mb-2">
                        Trace su firma en el recuadro inferior con cursor o pantalla táctil. La firma se guardará de forma persistente y recuperable en el picking.
                      </p>

                      <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 overflow-hidden relative">
                        <canvas
                          ref={canvasRef}
                          width={420}
                          height={140}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                          className={`w-full h-36 touch-none bg-white ${
                            isVerified || !isJefeAlmacenOrAdmin ? 'cursor-not-allowed opacity-90' : 'cursor-crosshair'
                          }`}
                        />
                        {!hasDrawnSignature && !isVerified && (
                          <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-300 text-xs font-semibold">
                            Firme aquí con el cursor o dedo
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Botón de Firma */}
                  <div className="pt-3">
                    {!isVerified ? (
                      <button
                        type="button"
                        onClick={handleVerify}
                        disabled={isVerifying || !isJefeAlmacenOrAdmin}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        <span>{isVerifying ? 'Certificando...' : 'Certificar y Firmar Picking'}</span>
                      </button>
                    ) : (
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs text-center font-semibold flex items-center justify-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>Picking verificado y firmado por {currentPicking.verifiedByName}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Botón final para confirmar surtido físico (Kardex & Stock) */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <h5 className="text-xs font-bold text-slate-800">Confirmación Final de Salida Física en Kardex</h5>
                  <p className="text-[11px] text-slate-500">
                    Al confirmar surtido físico, se descontarán las existencias físicas en almacén y se generarán los movimientos de SALIDA en Kardex.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleConfirmFulfillment}
                  disabled={isFulfilling || isVendedor || (!isCompleted && !isVerified) || isFulfilled}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2 ${
                    isFulfilled
                      ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50'
                  }`}
                >
                  <Box className="h-4 w-4" />
                  <span>{isFulfilled ? 'Surtido Físico Ya Confirmado' : isFulfilling ? 'Procesando...' : 'Confirmar Surtido Físico'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
