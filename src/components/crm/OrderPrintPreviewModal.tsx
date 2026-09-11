import React, { useEffect, useState, useRef } from 'react';
import { Order, Customer, CompanyConfig } from '../../types/erp';
import { X, Printer, Download, ArrowLeft, FileText, CheckCircle2 } from 'lucide-react';
import { generateOrderPDF } from '../../utils/pdfGenerator';

interface OrderPrintPreviewModalProps {
  order: Order;
  customer?: Customer;
  companyConfig?: CompanyConfig;
  onClose: () => void;
  onDownloadPDF?: () => void;
}

export const OrderPrintPreviewModal: React.FC<OrderPrintPreviewModalProps> = ({
  order,
  customer,
  companyConfig,
  onClose,
  onDownloadPDF,
}) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'info' | 'success' | 'error';
    text: string;
  } | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  // ESC key listener with proper cleanup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Lock body scroll while preview is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const subtotal = Number(order.subtotal || order.total / 1.16) || 0;
  const tax = Number(order.tax || order.total - order.total / 1.16) || 0;
  const total = Number(order.total) || 0;

  const companyName =
    companyConfig?.tradeName ||
    companyConfig?.businessName ||
    'CONSCORE INDUSTRIAL S.A. DE C.V.';
  const companyRfc = companyConfig?.rfc || 'CIN180425AB9';
  const companyAddress =
    companyConfig?.address ||
    'Parque Industrial Querétaro, Av. Industrial 450, Qro.';
  const companyPhone = companyConfig?.phone || '(442) 290-8800';

  const customerName = order.customerName || customer?.company_name || customer?.name || 'Cliente General';
  const customerRfc = (customer as any)?.rfc || (customer as any)?.tax_id || 'XAXX010101000';
  const deliveryAddress =
    order.shippingAddress || (order as any).deliveryAddress || 'Domicilio Fiscal';
  const orderDate = order.date || (order as any).orderDate || new Date().toISOString().split('T')[0];
  const promisedDate = order.deliveryDate || (order as any).promisedDate || '3 días hábiles';
  const quoteRef = order.quoteFolio || 'Venta Directa';

  const isSandboxedIframe = (): boolean => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  };

  /**
   * Safe, robust Print Execution Handler
   * Reuses the official order document generator (single source of truth).
   * Supports:
   * 1. Sandboxed environments (e.g. AI Studio iframe): Opens Blob PDF with native autoPrint in a new un-sandboxed tab.
   * 2. Standalone environments: Prints exclusively the isolated white remission document via dedicated print frame & @media print.
   * 3. Fallback: Controlled PDF download if browser blocks window popups.
   */
  const handlePrint = async () => {
    if (isPrinting) return;
    setIsPrinting(true);
    setFeedbackMessage(null);

    const sandboxed = isSandboxedIframe();

    try {
      if (sandboxed) {
        // PRIORIDAD 2: Entorno sandbox (e.g. AI Studio) donde window.print() es bloqueado por allow-modals
        const doc = await generateOrderPDF(order, customer, { companyConfig });
        doc.autoPrint();

        const pdfBlob = doc.output('blob');
        const blobUrl = URL.createObjectURL(pdfBlob);

        let printWindow: Window | null = null;
        try {
          printWindow = window.open(blobUrl, '_blank');
        } catch (err) {
          console.warn('Bloqueo al abrir ventana emergente de impresión:', err);
        }

        if (printWindow) {
          try {
            printWindow.focus();
          } catch {}
          setFeedbackMessage({
            type: 'success',
            text: 'Remisión abierta en ventana de impresión. Selecciona tu impresora en el diálogo.',
          });
          setTimeout(() => {
            URL.revokeObjectURL(blobUrl);
          }, 60000);
        } else {
          // Ventana emergente bloqueada por el navegador
          console.warn('Ventana emergente bloqueada por navegador, activando descarga directa del PDF oficial');
          const fileName = `Remision_${order.folio || 'Pedido'}_${new Date().toISOString().slice(0, 10)}.pdf`;
          doc.save(fileName);
          setFeedbackMessage({
            type: 'info',
            text: 'Ventana emergente bloqueada por el navegador. Se descargó el PDF oficial de la remisión para su impresión manual.',
          });
          setTimeout(() => {
            URL.revokeObjectURL(blobUrl);
          }, 5000);
        }
      } else {
        // PRIORIDAD 1: Entorno fuera de sandbox (pestaña independiente)
        // Se aísla exclusivamente el documento blanco de remisión sin elementos del ERP
        const printContent = printRef.current?.innerHTML || document.getElementById('printable-order-document')?.innerHTML;
        if (!printContent) {
          throw new Error('No se encontró el contenedor del documento imprimible.');
        }

        const printIframe = document.createElement('iframe');
        printIframe.setAttribute('style', 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;');
        document.body.appendChild(printIframe);

        const frameDoc = printIframe.contentWindow?.document || printIframe.contentDocument;
        if (frameDoc) {
          frameDoc.open();
          frameDoc.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Remisión ${order.folio} - CONSCORE</title>
  <style>
    @page { size: letter portrait; margin: 10mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #0f172a;
      margin: 0;
      padding: 15px;
      font-size: 11px;
      line-height: 1.4;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: #f1f5f9; border-bottom: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; font-size: 9px; font-weight: 700; text-transform: uppercase; color: #475569; }
    td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 10px; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-mono { font-family: monospace; }
    .font-bold { font-weight: 700; }
  </style>
</head>
<body>
  ${printContent}
</body>
</html>`);
          frameDoc.close();

          setTimeout(() => {
            try {
              printIframe.contentWindow?.focus();
              printIframe.contentWindow?.print();
            } catch (iframeErr) {
              console.warn('Iframe print bloqueado, utilizando PDF oficial:', iframeErr);
              window.print();
            } finally {
              setIsPrinting(false);
              setTimeout(() => {
                try {
                  document.body.removeChild(printIframe);
                } catch {}
              }, 2000);
            }
          }, 350);
          return;
        } else {
          window.print();
        }
      }
    } catch (err) {
      console.error('Error durante el proceso de impresión de la remisión:', err);
      setFeedbackMessage({
        type: 'error',
        text: 'No fue posible iniciar la impresión de la remisión.',
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownload = () => {
    if (onDownloadPDF) {
      onDownloadPDF();
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    }
  };

  return (
    <div
      id="order-print-preview-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Vista Previa de Remisión"
    >
      <div
        id="order-print-preview-modal"
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col w-full max-w-4xl max-h-[92vh] rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden my-6"
      >
        {/* Top Action Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-3.5 print:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Vista Previa de Impresión</h3>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50">
                  {order.folio}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Revisa el documento antes de imprimir. Las acciones son de consulta (Read-Only).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-preview-print-action"
              onClick={handlePrint}
              disabled={isPrinting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-500 shadow-md shadow-blue-950/40 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Printer className="h-3.5 w-3.5" />
              {isPrinting ? 'Preparando...' : 'Imprimir'}
            </button>

            {onDownloadPDF && (
              <button
                type="button"
                id="btn-preview-download-action"
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
              >
                {downloadSuccess ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400">PDF Generado</span>
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    <span>Descargar PDF</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              id="btn-preview-close-action"
              onClick={onClose}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer ml-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Cerrar</span>
            </button>

            <button
              type="button"
              id="btn-preview-close-x"
              onClick={onClose}
              aria-label="Cerrar vista previa"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* User Feedback Banner */}
        {feedbackMessage && (
          <div
            id="order-print-feedback-banner"
            className={`flex items-center justify-between px-6 py-2 text-xs font-medium border-b print:hidden ${
              feedbackMessage.type === 'error'
                ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                : feedbackMessage.type === 'info'
                ? 'bg-amber-950/60 border-amber-800 text-amber-300'
                : 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
            }`}
          >
            <span>{feedbackMessage.text}</span>
            <button
              type="button"
              onClick={() => setFeedbackMessage(null)}
              className="text-slate-400 hover:text-white ml-2 text-xs cursor-pointer p-0.5"
            >
              ✕
            </button>
          </div>
        )}

        {/* Paper Container Body */}
        <div className="flex-1 overflow-y-auto bg-slate-950/60 p-6 flex justify-center">
          <div
            id="printable-order-document"
            ref={printRef}
            className="w-full max-w-[780px] bg-white text-slate-900 rounded-lg p-8 shadow-xl border border-slate-200 font-sans text-xs leading-relaxed"
          >
            {/* Header */}
            <div className="header flex justify-between border-b-2 border-slate-900 pb-3 mb-4">
              <div>
                <h1 className="brand-title text-xl font-black tracking-tight text-slate-900 uppercase">
                  {companyName}
                </h1>
                <div className="brand-sub text-[10px] font-bold text-emerald-700 uppercase mt-0.5">
                  Remisión Oficial de Embarque & Suministro de Materiales
                </div>
                <div className="brand-info text-[10px] text-slate-500 mt-1">
                  RFC: {companyRfc} · {companyAddress} · Tel: {companyPhone}
                </div>
              </div>

              <div className="text-right">
                <div className="order-badge text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  ORDEN DE PEDIDO / REMISIÓN
                </div>
                <div className="order-number text-xl font-black font-mono text-slate-950 my-0.5">
                  {order.folio}
                </div>
                <div className="brand-info text-[10px] text-slate-600">
                  Fecha Registro: <strong className="text-slate-900">{orderDate}</strong>
                </div>
                <div className="brand-info text-[10px] text-slate-600">
                  Ref. Cotización: <strong className="text-blue-700">{quoteRef}</strong>
                </div>
              </div>
            </div>

            {/* Info Grid */}
            <div className="info-grid grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-md p-3 mb-4 text-[11px]">
              <div className="space-y-1">
                <div className="info-label text-[9px] font-bold uppercase text-slate-500 tracking-wider">
                  Cliente / Receptor de Mercancía
                </div>
                <div className="info-val-strong font-bold text-slate-900 text-xs">{customerName}</div>
                <div className="text-slate-600">RFC: <span className="font-mono">{customerRfc}</span></div>
                <div className="text-slate-600">
                  Destino Entrega: <strong className="text-slate-800">{deliveryAddress}</strong>
                </div>
                <div className="text-slate-600">
                  Fecha Promesa: <strong className="text-slate-800">{promisedDate}</strong>
                </div>
              </div>

              <div className="space-y-1">
                <div className="info-label text-[9px] font-bold uppercase text-slate-500 tracking-wider">
                  Control Logístico & Almacén
                </div>
                <div className="text-slate-600">
                  Estatus Suministro: <strong className="text-slate-900 uppercase font-mono">{order.status}</strong>
                </div>
                <div className="text-slate-600">
                  Almacén Despachador: <strong className="text-slate-800">{order.warehouseId || 'ALM-01 (Planta Principal)'}</strong>
                </div>
                <div className="text-slate-600">
                  Condición de Entrega: <strong className="text-emerald-700">Mercancía en Tránsito / Asegurada</strong>
                </div>
                <div className="text-slate-600">
                  Moneda: <strong className="text-slate-800">MXN (Pesos Mexicanos)</strong>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Partidas Surtidas / Reservadas en Almacén
              </div>
              <table className="w-full border-collapse border border-slate-200 text-left text-[10px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                    <th className="p-2 font-bold uppercase text-[9px]">Código SKU</th>
                    <th className="p-2 font-bold uppercase text-[9px]">Descripción de Material</th>
                    <th className="p-2 font-bold uppercase text-[9px] text-right">Cant.</th>
                    <th className="p-2 font-bold uppercase text-[9px] text-right">P. Unitario</th>
                    <th className="p-2 font-bold uppercase text-[9px] text-right">Importe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {order.items.map((it, idx) => {
                    const itemSku = it.productCode || (it as any).sku || (it as any).productId || 'SKU';
                    const itemDesc = it.description || (it as any).productName || 'Material';
                    const itemQty = Number(it.quantity ?? (it as any).quantityOrdered ?? (it as any).quantityFulfilled ?? 1);
                    const itemPrice = Number(it.unitPrice || (it as any).price || 0);
                    const itemSubtotal = Number(it.subtotal || itemQty * itemPrice);

                    return (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="p-2 font-mono font-bold text-slate-900">{itemSku}</td>
                        <td className="p-2 text-slate-700">{itemDesc}</td>
                        <td className="p-2 text-right font-bold text-slate-900">{itemQty.toLocaleString('es-MX')}</td>
                        <td className="p-2 text-right text-slate-700">${itemPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                        <td className="p-2 text-right font-bold text-slate-900">${itemSubtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals Box */}
            <div className="totals-wrap flex justify-end mb-6">
              <div className="totals-box w-64 text-xs space-y-1 bg-slate-50 border border-slate-200 rounded p-2.5">
                <div className="total-row flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <strong className="font-mono text-slate-900">
                    ${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                  </strong>
                </div>
                <div className="total-row flex justify-between text-slate-600">
                  <span>IVA (16%):</span>
                  <strong className="font-mono text-slate-900">
                    ${tax.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                  </strong>
                </div>
                <div className="total-final flex justify-between border-t-2 border-slate-900 pt-1.5 mt-1 font-bold text-sm text-slate-950">
                  <span>Total Facturado (+IVA):</span>
                  <span className="font-mono font-black text-emerald-800">
                    ${total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                  </span>
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div className="signatures-grid grid grid-cols-3 gap-6 pt-6 mt-4 border-t border-slate-200 text-center text-[10px]">
              <div>
                <div className="h-10"></div>
                <div className="sig-line border-t border-slate-900 pt-1 font-bold text-slate-700 uppercase text-[9px]">
                  Almacén y Embarques (Entrega)
                </div>
              </div>
              <div>
                <div className="h-10"></div>
                <div className="sig-line border-t border-slate-900 pt-1 font-bold text-slate-700 uppercase text-[9px]">
                  Operador / Transporte
                </div>
              </div>
              <div>
                <div className="h-10"></div>
                <div className="sig-line border-t border-slate-900 pt-1 font-bold text-slate-700 uppercase text-[9px]">
                  Recibe Cliente (Nombre, Firma y Sello)
                </div>
              </div>
            </div>

            {/* Document Footer */}
            <div className="footer text-center text-[9px] text-slate-400 border-t border-slate-200 pt-3 mt-6">
              Documento oficial de entrega y remisión de materiales CONSCORE ERP · Sujeto a inspección en destino.
            </div>
          </div>
        </div>

        {/* Bottom Footer Bar */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950 px-6 py-3 print:hidden">
          <span className="text-xs text-slate-400 font-mono">
            Documento {order.folio} · {order.items.length} partidas
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-preview-print-bottom"
              onClick={handlePrint}
              disabled={isPrinting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Printer className="h-3.5 w-3.5" />
              {isPrinting ? 'Preparando...' : 'Imprimir'}
            </button>
            <button
              type="button"
              id="btn-preview-close-bottom"
              onClick={onClose}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Print Specific CSS to isolate exclusively the white remission document */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-order-document,
          #printable-order-document * {
            visibility: visible !important;
          }
          #printable-order-document {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 10mm !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #0f172a !important;
            z-index: 99999 !important;
          }
          @page {
            size: letter portrait;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
};
