import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Printer,
  Download,
  Sparkles,
  MessageSquare,
  AlertTriangle,
  Building2,
  Calendar,
  Percent,
  DollarSign,
  Trash2,
  X,
  FileText,
  Loader2,
  ShieldAlert,
  FileCheck,
  Pencil,
  Copy,
  Share2,
  Mail,
  History,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { Quote, QuoteItem, Customer, Product, Order, UserRole } from '../../types/erp';
import { AIDraftModal } from './AIDraftModal';
import { CommercialRLSService } from '../../services/commercialRLSService';
import { exportQuoteToPDF } from '../../services/quotePdfService';
import { downloadQuotePDF } from '../../utils/pdfGenerator';
import { exportToExcel, exportToCSV } from '../../utils/exportUtils';
import { normalizePaymentTerms, DEFAULT_PAYMENT_TERMS, PAYMENT_TERMS_CATALOG } from '../../services/quotePaymentTermsService';
import { QuoteProductSelectorModal } from './QuoteProductSelectorModal';
import { QuoteAvailabilityService } from '../../services/quoteAvailabilityService';
import { QuoteFinancialApprovalService } from '../../services/quoteFinancialApprovalService';

interface QuotesModuleProps {
  onNavigateToOrders?: () => void;
}

export const QuotesModule: React.FC<QuotesModuleProps> = ({ onNavigateToOrders }) => {
  const {
    quotes,
    orders,
    customers,
    products,
    addQuote,
    updateQuote,
    duplicateQuote,
    updateQuoteStatus,
    convertQuoteToOrder,
    requestFinancialApproval,
    approveFinancialQuote,
    rejectFinancialQuote,
    calculateQuoteMarginAndDiscount,
    companyConfig,
  } = useERP();
  const { currentUser } = useAuth();

  // Scoping RLS de cotizaciones y clientes
  const isPrivileged =
    currentUser?.role &&
    ['ADMIN', 'ADMINISTRADOR', 'GERENTE_VENTAS', 'DIRECTOR_COMERCIAL', 'DIRECTOR', 'DIRECTOR_GENERAL', 'SUPER_ADMIN'].includes(
      currentUser.role
    );
  const scopedQuotes = isPrivileged ? quotes : CommercialRLSService.scopeQuotes(quotes, currentUser);
  const scopedCustomers = isPrivileged ? customers : CommercialRLSService.scopeCustomers(customers, currentUser);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [isNewQuoteOpen, setIsNewQuoteOpen] = useState(false);
  const [viewingQuote, setViewingQuote] = useState<Quote | null>(null);
  const [aiDraftTarget, setAiDraftTarget] = useState<any | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  // Modal de confirmación para conversión a pedido
  const [confirmingQuote, setConfirmingQuote] = useState<Quote | null>(null);
  const [isConvertingOrder, setIsConvertingOrder] = useState(false);

  // OBSERVACIÓN 16: Estados para Gestión y Dictamen de Autorización Financiera
  const [rejectingQuote, setRejectingQuote] = useState<Quote | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalNotesModal, setApprovalNotesModal] = useState<Quote | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [requestNotesModal, setRequestNotesModal] = useState<Quote | null>(null);
  const [requestNotes, setRequestNotes] = useState('');
  const [financialBlockNotice, setFinancialBlockNotice] = useState<{ quote: Quote; message: string } | null>(null);

  // Toast feedback visible
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ text, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Generate printable HTML content
  const generateQuoteHTML = (quote: Quote) => {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Cotización ${quote.folio} - CONSCORE</title>
  <style>
    @page { size: letter; margin: 12mm; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #0f172a; margin: 0; padding: 24px; font-size: 12px; line-height: 1.4; background: #ffffff; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px; }
    .brand-title { font-size: 24px; font-weight: 900; letter-spacing: -0.5px; color: #0f172a; margin: 0; }
    .brand-sub { font-size: 11px; font-weight: 700; color: #d97706; text-transform: uppercase; margin-top: 2px; }
    .brand-info { font-size: 11px; color: #64748b; margin-top: 4px; }
    .quote-badge { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; }
    .quote-number { font-size: 22px; font-weight: 900; font-family: monospace; color: #0f172a; margin: 2px 0; }
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
    .notes-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; font-size: 11px; color: #475569; margin-bottom: 20px; }
    .footer { text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand-title">CONSCORE</div>
      <div class="brand-sub">Aislamiento Térmico & Acústico de Alto Rendimiento</div>
      <div class="brand-info">RFC: CON190408K89 · Av. Industrial 450, Parque Industrial Querétaro</div>
      <div class="brand-info">Tel: (442) 290-8800 · contacto@conscore.com.mx</div>
    </div>
    <div style="text-align: right;">
      <div class="quote-badge">COTIZACIÓN FORMAL</div>
      <div class="quote-number">${quote.folio}</div>
      <div class="brand-info">Fecha de Emisión: <strong>${quote.date}</strong></div>
      <div class="brand-info">Válida Hasta: <strong>${quote.validUntil}</strong></div>
    </div>
  </div>

  <div class="info-grid">
    <div>
      <div class="info-label">Cliente / Razón Social</div>
      <div class="info-val-strong">${quote.customerName}</div>
      <div>RFC: ${quote.customerRFC || 'XAXX010101000'}</div>
      <div>Atención Comercial</div>
    </div>
    <div>
      <div class="info-label">Condiciones Comerciales</div>
      <div>Asesor: <strong>${quote.salespersonName}</strong></div>
      <div>Plazo / Pago: <strong>${normalizePaymentTerms(quote.paymentTerms || (quote as any).payment_terms)}</strong></div>
      <div>Tiempo de Entrega: <strong>${quote.deliveryTime || '3 a 5 días hábiles'}</strong></div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 14%;">Código</th>
        <th style="width: 38%;">Descripción Técnica</th>
        <th class="text-center" style="width: 8%;">U.M.</th>
        <th class="text-right" style="width: 8%;">Cant.</th>
        <th class="text-right" style="width: 14%;">P. Unitario</th>
        <th class="text-center" style="width: 6%;">Desc.</th>
        <th class="text-right" style="width: 14%;">Importe</th>
      </tr>
    </thead>
    <tbody>
      ${quote.items.map((it) => `
        <tr>
          <td class="font-mono font-bold">${it.productCode}</td>
          <td>${it.description}</td>
          <td class="text-center">${it.um || 'PZA'}</td>
          <td class="text-right font-bold">${it.quantity}</td>
          <td class="text-right">$${(Number(it.unitPrice) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
          <td class="text-center">${it.discountPct > 0 ? `${it.discountPct}%` : '—'}</td>
          <td class="text-right font-bold">$${(Number(it.subtotal) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals-wrap">
    <div class="totals-box">
      <div class="total-row"><span>Subtotal:</span> <strong>$${(Number(quote.subtotal) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</strong></div>
      <div class="total-row"><span>IVA (16%):</span> <strong>$${(Number(quote.tax) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</strong></div>
      <div class="total-row total-final"><span>Total:</span> <span>$${(Number(quote.total) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span></div>
    </div>
  </div>

  ${quote.notes ? `
    <div class="notes-card">
      <div class="info-label">Notas & Especificaciones Técnicas</div>
      <div>${quote.notes}</div>
    </div>
  ` : ''}

  <div class="footer">
    Documento oficial generado por CONSCORE ERP · Precios expresados en Moneda Nacional más IVA · Sujeto a términos y condiciones generales de suministro.
  </div>
</body>
</html>`;
  };

  // Detect if running inside a sandboxed iframe (e.g. AI Studio preview environment)
  const isSandboxedIframe = (): boolean => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  };

  // Dedicated Document Preparation & Preview Function with visual feedback
  const handleOpenQuoteDocument = (quote: Quote) => {
    setIsPrinting(true);
    showToast('Preparando cotización...', 'info');
    try {
      // 1. Obtener cotización seleccionada y abrir vista previa del documento comercial
      setViewingQuote(quote);
      showToast('Cotización lista.', 'success');
    } catch (e) {
      console.error('Error al generar el documento de cotización:', e);
      showToast('No fue posible generar el documento de cotización.', 'error');
    } finally {
      setIsPrinting(false);
    }
  };

  // Dedicated PDF Export Handler with RLS validation and visual feedback using jspdf-autotable
  const handleDownloadPDF = async (quote: Quote) => {
    if (currentUser) {
      const access = CommercialRLSService.validateAccess(currentUser, 'QUOTE', quote, 'READ');
      if (!access.allowed) {
        showToast('403 ACCESS_DENIED: Solo puedes descargar cotizaciones propias.', 'error');
        return;
      }
    }

    try {
      showToast('Generando documento PDF profesional...', 'info');
      const matchedCustomer = customers.find(
        (c) => c.id === quote.customerId || c.company_name === quote.customerName || c.name === quote.customerName
      );
      await downloadQuotePDF(quote, matchedCustomer, { companyConfig });
      showToast(`Cotización ${quote.folio} descargada en PDF.`, 'success');
    } catch (err) {
      console.error('Error al exportar cotización a PDF:', err);
      showToast('No fue posible generar el documento PDF.', 'error');
    }
  };

  // WhatsApp Sharing Handler (P2-07)
  const handleShareWhatsApp = (quote: Quote) => {
    if (currentUser) {
      const access = CommercialRLSService.validateAccess(currentUser, 'QUOTE', quote, 'READ');
      if (!access.allowed) {
        showToast('403 ACCESS_DENIED: Solo puedes compartir cotizaciones propias.', 'error');
        return;
      }
    }
    const totalFormatted = (Number(quote.total) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 });
    const msg = encodeURIComponent(
      `*COTIZACIÓN FORMAL ${quote.folio} - CONSCORE INDUSTRIAL*\n\n` +
      `Estimado cliente: *${quote.customerName}*\n` +
      `Fecha: ${quote.date} | Vigencia: ${quote.validUntil || '15 días'}\n` +
      `Total: *$${totalFormatted} MXN*\n` +
      `Condiciones de Pago: ${normalizePaymentTerms(quote.paymentTerms || (quote as any).payment_terms)}\n` +
      `Tiempo de Entrega: ${quote.deliveryTime || 'Inmediata'}\n\n` +
      `Para confirmar su pedido o resolver dudas técnicas, favor de responder a este mensaje.`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
    showToast('Abriendo WhatsApp...', 'success');
  };

  // Email Sharing Handler (P2-07)
  const handleShareEmail = (quote: Quote) => {
    if (currentUser) {
      const access = CommercialRLSService.validateAccess(currentUser, 'QUOTE', quote, 'READ');
      if (!access.allowed) {
        showToast('403 ACCESS_DENIED: Solo puedes compartir cotizaciones propias.', 'error');
        return;
      }
    }
    const matchedCustomer = customers.find(
      (c) => c.id === quote.customerId || c.company_name === quote.customerName || c.name === quote.customerName
    );
    const email = matchedCustomer?.email || '';
    const totalFormatted = (Number(quote.total) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 });
    const subject = encodeURIComponent(`Cotización Formal ${quote.folio} - CONSCORE INDUSTRIAL`);
    const body = encodeURIComponent(
      `Estimado(a) ${quote.customerName},\n\n` +
      `Adjuntamos los detalles de su cotización formal folio ${quote.folio} por un total de $${totalFormatted} MXN.\n\n` +
      `• Asesor Comercial: ${quote.salespersonName}\n` +
      `• Vigencia: ${quote.validUntil || '15 días'}\n` +
      `• Condiciones de Pago: ${normalizePaymentTerms(quote.paymentTerms || (quote as any).payment_terms)}\n` +
      `• Tiempo de Entrega: ${quote.deliveryTime || 'Inmediata'}\n\n` +
      `Quedamos atentos a sus comentarios para coordinar el suministro.\n\n` +
      `Atentamente,\nCONSCORE INDUSTRIAL S.A. DE C.V.`
    );
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    showToast('Abriendo cliente de correo...', 'success');
  };

  // Export Quotes to Excel / CSV
  const handleExportQuotes = (format: 'excel' | 'csv') => {
    const dataToExport = filteredQuotes.map((q) => ({
      Folio: q.folio,
      Cliente: q.customerName,
      RFC: q.customerRFC || '',
      Fecha: q.date,
      Vigencia: q.validUntil,
      Vendedor: q.salespersonName,
      Subtotal: Number(q.subtotal) || 0,
      IVA: Number(q.tax) || 0,
      Total: Number(q.total) || 0,
      Estatus: q.status,
      Condicion_Pago: normalizePaymentTerms(q.paymentTerms || (q as any).payment_terms),
    }));

    if (format === 'excel') {
      exportToExcel(dataToExport, 'Cotizaciones', `Cotizaciones_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } else {
      exportToCSV(dataToExport, `Cotizaciones_${new Date().toISOString().slice(0, 10)}.csv`);
    }
    showToast(`Reporte de cotizaciones exportado en ${format.toUpperCase()}.`, 'success');
  };

  // Safe Native Print Handler with iframe sandbox detection
  const handleSafePrint = (quote: Quote) => {
    if (currentUser) {
      const access = CommercialRLSService.validateAccess(currentUser, 'QUOTE', quote, 'READ');
      if (!access.allowed) {
        showToast('403 ACCESS_DENIED: Solo puedes imprimir cotizaciones propias.', 'error');
        return;
      }
    }

    // In sandboxed iframes (e.g. AI Studio container), window.print() is blocked because allow-modals is not set.
    // Instead of failing or triggering console errors, safely fallback to PDF generation.
    if (isSandboxedIframe()) {
      showToast('El visor de AI Studio restringe ventanas de impresión. Descargando archivo PDF oficial...', 'info');
      handleDownloadPDF(quote);
      return;
    }

    try {
      window.print();
      showToast('Cotización lista.', 'success');
    } catch (err) {
      console.warn('Llamada a print() no permitida por el navegador en este contexto:', err);
      showToast('Impresión directa no soportada por el navegador. Descargando archivo PDF oficial...', 'info');
      handleDownloadPDF(quote);
    }
  };

  // Trigger print action from action bar / button with RLS and user feedback
  const handleInitiatePrint = (quote: Quote) => {
    if (currentUser) {
      const access = CommercialRLSService.validateAccess(currentUser, 'QUOTE', quote, 'READ');
      if (!access.allowed) {
        showToast('403 ACCESS_DENIED: Solo puedes imprimir cotizaciones propias.', 'error');
        return;
      }
    }
    handleOpenQuoteDocument(quote);
  };

  // Download HTML / Printable File
  const handleDownloadQuoteHTML = (quote: Quote) => {
    const html = generateQuoteHTML(quote);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cotizacion-${quote.folio}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Cotización ${quote.folio} descargada correctamente.`, 'success');
  };

  // OBSERVACIÓN 16: Financial Approval Action Handlers
  const handleRequestFinancialApproval = async (quote: Quote, notes?: string) => {
    try {
      const res = requestFinancialApproval(quote.id, notes);
      if (res && res.success) {
        showToast(`Solicitud de autorización enviada a Finanzas para ${quote.folio}.`, 'success');
        setRequestNotesModal(null);
        setRequestNotes('');
        if (viewingQuote && viewingQuote.id === quote.id) {
          setViewingQuote((prev) => (prev ? { ...prev, financialApprovalStatus: 'PENDIENTE' } : null));
        }
      } else {
        showToast(res?.error || 'No se pudo registrar la solicitud.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error al solicitar autorización.', 'error');
    }
  };

  const handleApproveFinancial = async (quote: Quote, notes?: string) => {
    try {
      const res = approveFinancialQuote(quote.id, notes);
      if (res && res.success) {
        showToast(`¡Cotización ${quote.folio} autorizada financieramente con éxito! Lista para generar pedido.`, 'success');
        setApprovalNotesModal(null);
        setApprovalNotes('');
        if (viewingQuote && viewingQuote.id === quote.id) {
          setViewingQuote((prev) => (prev ? {
            ...prev,
            financialApprovalStatus: 'AUTORIZADA',
            approvedQuoteVersion: prev.version || 1,
            financialApprovedByName: currentUser?.name || 'Finanzas',
            financialApprovedByRole: currentUser?.role || 'FINANZAS',
            financialApprovedAt: new Date().toISOString(),
          } : null));
        }
      } else {
        showToast(res?.error || 'No fue posible autorizar la cotización.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error al autorizar cotización.', 'error');
    }
  };

  const handleRejectFinancial = async (quote: Quote, reason: string) => {
    if (!reason || !reason.trim()) {
      showToast('El motivo de rechazo es obligatorio para el dictamen.', 'error');
      return;
    }
    try {
      const res = rejectFinancialQuote(quote.id, reason.trim());
      if (res && res.success) {
        showToast(`Cotización ${quote.folio} rechazada financieramente por ${currentUser?.name || 'Finanzas'}.`, 'info');
        setRejectingQuote(null);
        setRejectionReason('');
        if (viewingQuote && viewingQuote.id === quote.id) {
          setViewingQuote((prev) => (prev ? {
            ...prev,
            financialApprovalStatus: 'RECHAZADA',
            financialRejectedByName: currentUser?.name || 'Finanzas',
            financialRejectionReason: reason.trim(),
            financialRejectedAt: new Date().toISOString(),
          } : null));
        }
      } else {
        showToast(res?.error || 'No fue posible registrar el rechazo.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error al rechazar cotización.', 'error');
    }
  };

  // Open modal to confirm convert to order
  const handleOpenConvertToOrderModal = (quote: Quote) => {
    // 1. Validar RLS
    if (currentUser) {
      const access = CommercialRLSService.validateAccess(currentUser, 'QUOTE', quote, 'UPDATE');
      if (!access.allowed) {
        showToast('403 ACCESS_DENIED: No tienes autorización para convertir cotizaciones de otro ejecutivo.', 'error');
        return;
      }
    }

    // 2. Validar estatus
    if (quote.status === 'RECHAZADA' || quote.status === 'VENCIDA' || (quote as any).status === 'CANCELADA') {
      showToast(`Esta cotización aún no puede convertirse en pedido debido a su estatus actual (${quote.status}).`, 'error');
      return;
    }

    // 2.1 OBSERVACIÓN 16: Validar autorización financiera obligatoria
    const finCheck = QuoteFinancialApprovalService.validateForOrderConversion(quote);
    if (!finCheck.allowed) {
      setFinancialBlockNotice({
        quote,
        message: finCheck.error || 'Esta cotización requiere autorización previa de Finanzas antes de poder convertirse en pedido formal.'
      });
      showToast(finCheck.error || 'BLOQUEO: Requiere autorización previa de Finanzas.', 'error');
      return;
    }

    // 3. Validar si ya fue convertida
    const hasExistingOrder =
      quote.convertedToOrderId ||
      (quote as any).converted_to_order_id ||
      orders.some(
        (o) =>
          o.quoteId === quote.id ||
          (quote.folio && (o.quoteFolio === quote.folio || (o as any).quote_number === quote.folio))
      );

    if (hasExistingOrder) {
      const folio = quote.convertedToOrderFolio || quote.converted_to_order_number || 'existente';
      showToast(`Esta cotización ya fue convertida previamente en el Pedido ${folio}.`, 'info');
      return;
    }

    // Abrir modal de confirmación
    setConfirmingQuote(quote);
  };

  // Execute convert to order
  const executeConvertToOrder = async (quote: Quote) => {
    if (isConvertingOrder) return;
    setIsConvertingOrder(true);

    try {
      const res: any = convertQuoteToOrder(quote.id);
      if (res && res.success === false) {
        showToast(res.error || 'No fue posible crear el pedido.', 'error');
        setIsConvertingOrder(false);
        return;
      }

      const folio = res?.orderFolio || res?.folio || 'Generado';
      showToast(`¡Pedido ${folio} generado y stock reservado con éxito!`, 'success');
      setConfirmingQuote(null);
      if (viewingQuote && viewingQuote.id === quote.id) {
        setViewingQuote(null);
      }
    } catch (err: any) {
      console.error('Error al convertir cotización a pedido:', err);
      showToast(err.message || 'Error al convertir cotización a pedido.', 'error');
    } finally {
      setIsConvertingOrder(false);
    }
  };

  // New / Edit Quote Form State
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');

  const filteredScopedCustomers = useMemo(() => {
    if (!customerSearchQuery.trim()) return scopedCustomers;
    const q = customerSearchQuery.trim().toLowerCase();
    return scopedCustomers.filter(
      (c) =>
        (c.businessName && c.businessName.toLowerCase().includes(q)) ||
        (c.code && c.code.toLowerCase().includes(q)) ||
        (c.rfc && c.rfc.toLowerCase().includes(q)) ||
        (c.contactName && c.contactName.toLowerCase().includes(q))
    );
  }, [scopedCustomers, customerSearchQuery]);

  const selectedCustomer = useMemo(
    () => scopedCustomers.find((c) => c.id === selectedCustomerId) || customers.find((c) => c.id === selectedCustomerId),
    [scopedCustomers, customers, selectedCustomerId]
  );

  const [items, setItems] = useState<
    Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      discountPct: number;
    }>
  >([
    {
      productId: products[0]?.id || '',
      quantity: 50,
      unitPrice: products[0]?.price || 420,
      discountPct: 0,
    },
  ]);
  const [paymentTerms, setPaymentTerms] = useState<string>(DEFAULT_PAYMENT_TERMS);
  const [deliveryTime, setDeliveryTime] = useState('3 a 5 días hábiles');
  const [notes, setNotes] = useState('Precios en MXN más IVA. Puestos en obra.');
  // Observación 09: Estado del selector de productos con referencia de stock
  const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false);
  const [expandedWarehouseRows, setExpandedWarehouseRows] = useState<Record<number, boolean>>({});

  // Open New Quote Modal (Observación 08: Toda nueva cotización inicia por default con "PAGO DE CONTADO")
  const handleOpenNewQuote = () => {
    setEditingQuote(null);
    setCustomerSearchQuery('');
    // Observación 05: Solo seleccionar clientes asignados a la cartera del usuario
    const initialCustomer = scopedCustomers[0];
    if (initialCustomer) {
      setSelectedCustomerId(initialCustomer.id);
    } else {
      setSelectedCustomerId('');
    }
    // REGLA OBSERVACIÓN 08: Default canónico "PAGO DE CONTADO" sin importar condiciones previas del cliente
    setPaymentTerms(DEFAULT_PAYMENT_TERMS);
    setDeliveryTime('3 a 5 días hábiles');
    setNotes('Precios en MXN más IVA. Puestos en obra.');
    setItems([
      {
        productId: products[0]?.id || '',
        quantity: 10,
        unitPrice: products[0]?.price || 100,
        discountPct: 0,
      },
    ]);
    setIsNewQuoteOpen(true);
  };

  // Close Modal with Dirty Confirmation (Hotfix 06 - Section 20)
  const handleCloseModal = () => {
    if (editingQuote) {
      const origItems = editingQuote.items || [];
      const isDirty =
        items.length !== origItems.length ||
        items.some((it, i) => {
          const orig = origItems[i];
          return (
            !orig ||
            orig.productId !== it.productId ||
            orig.quantity !== it.quantity ||
            orig.unitPrice !== it.unitPrice ||
            (orig.discountPct || 0) !== (it.discountPct || 0)
          );
        }) ||
        notes !== (editingQuote.notes || '') ||
        paymentTerms !== (editingQuote.paymentTerms ? normalizePaymentTerms(editingQuote.paymentTerms) : (editingQuote as any).payment_terms ? normalizePaymentTerms((editingQuote as any).payment_terms) : DEFAULT_PAYMENT_TERMS) ||
        deliveryTime !== (editingQuote.deliveryTime || '3 a 5 días hábiles');

      if (isDirty && !window.confirm('Existen cambios sin guardar en la cotización. ¿Deseas descartarlos?')) {
        return;
      }
    }
    setIsNewQuoteOpen(false);
    setEditingQuote(null);
  };

  // Open Edit Quote Modal (Hotfix 06 - Section 2 & 14)
  const handleOpenEditQuote = (quote: Quote) => {
    const hasLinkedOrder =
      Boolean(quote.converted_to_order_id) ||
      Boolean(quote.convertedToOrderId) ||
      quote.status === 'CONVERTIDA' ||
      (quote.status as string) === 'CONVERTIDA_A_PEDIDO' ||
      orders.some(
        (o) =>
          o.quoteId === quote.id ||
          (quote.folio && (o.quoteFolio === quote.folio || o.quote_number === quote.folio))
      );

    if (hasLinkedOrder) {
      showToast('Esta cotización ya fue convertida en pedido y está bloqueada para edición.', 'error');
      return;
    }

    if (['CANCELADA', 'VENCIDA', 'RECHAZADA'].includes(quote.status)) {
      showToast(`La cotización se encuentra en estatus ${quote.status} y no puede ser editada.`, 'error');
      return;
    }

    if (currentUser && !isPrivileged) {
      const access = CommercialRLSService.validateAccess(currentUser, 'QUOTE', quote, 'UPDATE');
      if (!access.allowed) {
        showToast('403 ACCESS_DENIED: No tienes permiso para editar cotizaciones de otro ejecutivo.', 'error');
        return;
      }

      // Observación 05 Requirement #13: Validar que el cliente titular siga perteneciendo al vendedor
      const custId = quote.customerId || (quote as any).customer_id;
      const targetCustomer = customers.find((c) => c.id === custId);
      if (targetCustomer) {
        const custCheck = CommercialRLSService.assertCustomerOwnership(currentUser, targetCustomer, 'WRITE');
        if (!custCheck.allowed) {
          showToast('403 ACCESS_DENIED: No puedes modificar esta cotización porque el cliente asignado fue reasignado a otro ejecutivo comercial o está restringido.', 'error');
          return;
        }
      }
    }
    setEditingQuote(quote);
    setSelectedCustomerId(quote.customerId || quote.customer_id);
    setPaymentTerms(quote.paymentTerms ? normalizePaymentTerms(quote.paymentTerms) : (quote as any).payment_terms ? normalizePaymentTerms((quote as any).payment_terms) : DEFAULT_PAYMENT_TERMS);
    setDeliveryTime(quote.deliveryTime || '3 a 5 días hábiles');
    setNotes(quote.notes || '');
    setItems(
      (quote.items || []).map((it) => ({
        productId: it.productId || it.product_id || '',
        quantity: it.quantity,
        unitPrice: it.unitPrice !== undefined ? it.unitPrice : it.unit_price || 0,
        discountPct: it.discountPct !== undefined ? it.discountPct : it.discount || 0,
      }))
    );
    setIsNewQuoteOpen(true);
  };

  // Duplicate / Clone Quote handler (Observación 05 Requirement #12)
  const handleDuplicateQuote = (quote: Quote) => {
    if (currentUser && !isPrivileged) {
      const quoteAccess = CommercialRLSService.validateAccess(currentUser, 'QUOTE', quote, 'READ');
      if (!quoteAccess.allowed) {
        showToast('403 ACCESS_DENIED: No tienes permiso para duplicar una cotización de otro ejecutivo comercial.', 'error');
        return;
      }
      const custId = quote.customerId || (quote as any).customer_id;
      const targetCustomer = customers.find((c) => c.id === custId);
      if (targetCustomer) {
        const custCheck = CommercialRLSService.assertCustomerOwnership(currentUser, targetCustomer, 'WRITE');
        if (!custCheck.allowed) {
          showToast('403 ACCESS_DENIED: No puedes duplicar esta cotización porque el cliente fue reasignado a otro ejecutivo comercial o está restringido.', 'error');
          return;
        }
      }
    }

    if (duplicateQuote) {
      const res = duplicateQuote(quote.id);
      if (res.success && res.quote) {
        showToast(`Cotización duplicada con éxito: ${res.quote.folio || res.quote.quoteNumber}`, 'success');
      } else {
        showToast(res.error || 'Error al duplicar la cotización.', 'error');
      }
    }
  };

  // Customer change handler (Observación 08: Prioridad en nueva cotización es PAGO DE CONTADO salvo acción manual del usuario)
  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    // Nota: El default comercial para cotizaciones se mantiene como "PAGO DE CONTADO" a menos que el usuario decida cambiarlo
  };

  // Live calculation of quote
  const liveCalculation = calculateQuoteMarginAndDiscount(
    items.map((it) => {
      const prod = products.find((p) => p.id === it.productId);
      const subtotal = it.quantity * it.unitPrice * (1 - it.discountPct / 100);
      return {
        id: `QI-${Date.now()}`,
        productId: it.productId,
        productCode: prod?.code || '',
        description: prod?.name || '',
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        discountPct: it.discountPct,
        subtotal,
        unitCost: prod?.cost || 0,
      };
    })
  );

  // Check discount policy against user role (P0-07: 5% max discount for sales executives)
  // Cinco de los ocho roles que se comparaban aquí no existen en UserRole
  // (SUPER_ADMIN, DIRECTOR_GENERAL, ADMIN, GERENTE_SUCURSAL, DIRECTOR_COMERCIAL),
  // así que esas comparaciones eran siempre falsas.
  const ROLES_DESCUENTO_AMPLIADO: UserRole[] = ['ADMINISTRADOR', 'DIRECTOR', 'GERENTE_VENTAS'];
  const isManagerOrAdmin = !!currentUser?.role && ROLES_DESCUENTO_AMPLIADO.includes(currentUser.role);
  const maxAllowedDiscount = companyConfig?.sellerMaxDiscountPercent ?? companyConfig?.maxDiscountSalesperson ?? 5;
  const discountExceeded =
    ((liveCalculation?.avgDiscountPct ?? liveCalculation?.discountPct) || 0) > maxAllowedDiscount;
  const anyItemDiscountExceeded = items.some((it) => (it.discountPct || 0) > maxAllowedDiscount);
  const marginViolated =
    ((liveCalculation?.grossMarginPct ?? liveCalculation?.marginPct) || 0) <
    (companyConfig?.minGrossMarginPct || 25);

  const filteredQuotes = scopedQuotes.filter((q) => {
    const matchSearch =
      searchTerm.trim() === '' ||
      (q.folio || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.customerName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'TODOS' || q.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleAddItem = () => {
    const firstProd = products[0];
    setItems([
      ...items,
      {
        productId: firstProd?.id || '',
        quantity: 10,
        unitPrice: firstProd?.price || 100,
        discountPct: 0,
      },
    ]);
  };

  const handleSelectProductFromModal = (product: Product, quantity: number) => {
    // Si la cotización tiene solo una partida inicial por defecto sin cambios, la reemplazamos
    const isFirstItemDefault =
      items.length === 1 &&
      items[0].productId === products[0]?.id &&
      items[0].quantity === 10 &&
      items[0].discountPct === 0;

    const newItem = {
      productId: product.id,
      quantity: quantity > 0 ? quantity : 1,
      unitPrice: product.price || 100,
      discountPct: 0,
    };

    if (isFirstItemDefault) {
      setItems([newItem]);
    } else {
      setItems([...items, newItem]);
    }
  };

  const toggleRowWarehouse = (index: number) => {
    setExpandedWarehouseRows((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      productId: prodId,
      unitPrice: prod?.price || 100,
    };
    setItems(newItems);
  };

  const handleSaveQuote = (e: React.FormEvent) => {
    e.preventDefault();

    // Hotfix 07: Enforce that sales executive cannot set price below list price
    if (!isManagerOrAdmin) {
      for (const it of items) {
        const prod = products.find((p) => p.id === it.productId);
        const listPrice = prod?.price || 0;
        if (Number(it.unitPrice) < Number(listPrice)) {
          showToast(
            `Regla Comercial: El precio de venta ($${it.unitPrice}) no puede ser menor al precio de lista ($${listPrice}) para ${prod?.name || it.productId}.`,
            'error'
          );
          return;
        }
      }
    }

    // P0-07 & Hotfix 07: Enforce maximum direct discount rule for sales executives
    if ((discountExceeded || anyItemDiscountExceeded) && !isManagerOrAdmin) {
      showToast(
        `Tu límite máximo de descuento es ${maxAllowedDiscount}%.`,
        'error'
      );
      return;
    }

    const customer = customers.find((c) => c.id === selectedCustomerId);
    if (!customer) {
      showToast('Selecciona un cliente válido.', 'error');
      return;
    }

    // P0-03 & Observación 04: Prevent creation of quotes for clients belonging to other sellers
    const customerCheck = isPrivileged ? { allowed: true } : CommercialRLSService.assertCustomerOwnership(currentUser, customer, 'UPDATE');
    if (!customerCheck.allowed) {
      showToast('Acceso Denegado (RLS): No puedes cotizar para un cliente asignado a otro ejecutivo comercial.', 'error');
      return;
    }

    const quoteItems: QuoteItem[] = items.map((it, idx) => {
      const prod = products.find((p) => p.id === it.productId);
      const subtotal = it.quantity * it.unitPrice * (1 - it.discountPct / 100);
      return {
        id: `QI-${Date.now()}-${idx}`,
        productId: it.productId,
        productCode: prod?.code || '',
        description: prod?.name || '',
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        discountPct: it.discountPct,
        subtotal,
        unitCost: prod?.cost || 0,
      };
    });

    const subtotal = quoteItems.reduce((acc, it) => acc + it.subtotal, 0);
    const tax = subtotal * 0.16;
    const total = subtotal + tax;

    // Hotfix 06: Edit existing quote (preserves folio, increments version, creates snapshot)
    if (editingQuote) {
      const res = updateQuote(editingQuote.id, {
        items: quoteItems,
        notes,
        paymentTerms: normalizePaymentTerms(paymentTerms),
        deliveryTime,
        grossMarginPct: liveCalculation?.grossMarginPct ?? 25,
      });

      if (res && !res.success) {
        showToast(res.error || 'Error al actualizar cotización', 'error');
        return;
      }

      setIsNewQuoteOpen(false);
      setEditingQuote(null);
      showToast(`Cotización ${editingQuote.folio} actualizada a versión v${(editingQuote.version || 1) + 1}.`, 'success');
      return;
    }

    // Create New Quote
    addQuote({
      customerId: customer.id,
      customerName: customer.businessName,
      customerRFC: customer.rfc,
      salespersonId: currentUser?.id || 'USR-004',
      salespersonName: currentUser?.name || 'Ejecutivo Comercial',
      salesExecutiveId: CommercialRLSService.resolveSalesExecutiveId(currentUser),
      date: new Date().toISOString().slice(0, 10),
      validUntil: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
      items: quoteItems,
      subtotal,
      tax,
      total,
      grossMarginPct: liveCalculation.grossMarginPct,
      paymentTerms: normalizePaymentTerms(paymentTerms),
      deliveryTime,
      notes,
    });

    setIsNewQuoteOpen(false);
    showToast('Cotización creada exitosamente.', 'success');
  };

  return (
    <div className="space-y-6 relative">
      {/* Visual Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 shadow-xl text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-emerald-950/95 border-emerald-600 text-emerald-200'
                : toast.type === 'error'
                ? 'bg-red-950/95 border-red-600 text-red-200'
                : 'bg-blue-950/95 border-blue-600 text-blue-200'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />}
            {toast.type === 'info' && <Clock className="h-4 w-4 text-blue-400 shrink-0" />}
            <span>{toast.text}</span>
            <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Gestión de Cotizaciones Formales</h2>
            <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-bold text-blue-300 border border-blue-500/30">
              COTIZADOR B2B
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Elaboración de propuestas técnicas, control de márgenes, validación de descuentos y conversión a pedidos
          </p>
        </div>

        <button
          onClick={handleOpenNewQuote}
          className="flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-yellow-300 shadow-md transition-all"
        >
          <Plus className="h-4 w-4" />
          Nueva Cotización
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por folio o cliente..."
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
            <option value="TODOS">Todos los Estatus ({scopedQuotes.length})</option>
            <option value="BORRADOR">Borradores</option>
            <option value="ENVIADA">Enviadas</option>
            <option value="APROBADA">Aprobadas</option>
            <option value="RECHAZADA">Rechazadas</option>
            <option value="VENCIDA">Vencidas</option>
          </select>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExportQuotes('excel')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-slate-800 transition-colors"
            title="Exportar cotizaciones filtradas a Excel"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Excel</span>
          </button>
          <button
            onClick={() => handleExportQuotes('csv')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            title="Exportar cotizaciones filtradas a CSV"
          >
            <Download className="h-3.5 w-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Table of Quotes */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3">Folio</th>
                <th className="px-4 py-3">Cliente Comercial</th>
                <th className="px-4 py-3">Fecha & Vigencia</th>
                <th className="px-4 py-3 text-right">Subtotal</th>
                <th className="px-4 py-3 text-right">Total (+IVA)</th>
                <th className="px-4 py-3 text-center">Margen Bruto</th>
                <th className="px-4 py-3 text-center">Estatus</th>
                <th className="px-4 py-3 text-center">Aut. Finanzas</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-xs text-slate-500">
                    No se encontraron cotizaciones con los filtros actuales.
                  </td>
                </tr>
              ) : (
                filteredQuotes.map((quote) => {
                  const linkedOrder =
                    orders.find(
                      (o) =>
                        o.quoteId === quote.id ||
                        (quote.folio && (o.quoteFolio === quote.folio || (o as any).quote_number === quote.folio))
                    ) ||
                    (quote.convertedToOrderFolio ? { folio: quote.convertedToOrderFolio } : null);

                  const isPendingDiscountApproval =
                    quote.status === 'PENDIENTE_AUTORIZACION' ||
                    quote.discountApprovalStatus === 'PENDIENTE_AUTORIZACION' ||
                    Boolean(
                      (quote.items || []).some(
                        (it: any) =>
                          Number(it.discountPercent || it.discountPct || it.discount || 0) > 5 &&
                          quote.discountApprovalStatus !== 'APROBADO' &&
                          quote.status !== 'APROBADA'
                      )
                    );

                  const isFinancialApproved = QuoteFinancialApprovalService.validateForOrderConversion(quote).allowed;
                  const isConvertible =
                    !linkedOrder &&
                    quote.status !== 'RECHAZADA' &&
                    quote.status !== 'VENCIDA' &&
                    (quote as any).status !== 'CANCELADA' &&
                    !isPendingDiscountApproval &&
                    isFinancialApproved;

                  const userCanAuthorize = QuoteFinancialApprovalService.canUserAuthorize(currentUser, quote).allowed;

                  return (
                    <tr key={quote.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-bold text-yellow-400 text-sm">{quote.folio}</td>

                      <td className="px-4 py-3.5">
                        <span className="font-bold text-white block">{quote.customerName}</span>
                        <span className="text-[11px] text-slate-400">RFC: {quote.customerRFC || 'XAXX010101000'}</span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="text-slate-200 block">{quote.date}</span>
                        <span className="text-[11px] text-slate-500">Vence: {quote.validUntil}</span>
                      </td>

                      <td className="px-4 py-3.5 text-right font-medium text-slate-300">
                        ${(Number(quote.subtotal) || 0).toLocaleString('es-MX')}
                      </td>

                      <td className="px-4 py-3.5 text-right font-bold text-emerald-400 text-sm">
                        ${(Number(quote.total) || 0).toLocaleString('es-MX')}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        {isManagerOrAdmin ? (
                          <span
                            className={`rounded px-2 py-0.5 text-[11px] font-bold ${
                              (quote.grossMarginPct || 30) >= 30
                                ? 'bg-emerald-950 text-emerald-300'
                                : 'bg-amber-950 text-amber-300'
                            }`}
                          >
                            {(quote.grossMarginPct || 30).toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[10px] italic font-medium">Protegido</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            quote.status === 'ACEPTADA'
                              ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                              : quote.status === 'PENDIENTE_AUTORIZACION' || (isPendingDiscountApproval && quote.status !== 'APROBADA')
                              ? 'bg-amber-900/60 text-amber-300 border border-amber-700'
                              : quote.status === 'ENVIADA'
                              ? 'bg-blue-900/60 text-blue-300 border border-blue-700'
                              : quote.status === 'RECHAZADA'
                              ? 'bg-red-900/60 text-red-300 border border-red-700'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {quote.status === 'PENDIENTE_AUTORIZACION' || (isPendingDiscountApproval && quote.status !== 'APROBADA')
                            ? 'PENDIENTE AUTORIZACIÓN'
                            : quote.status}
                        </span>
                      </td>

                      {/* OBSERVACIÓN 16: Estatus de Autorización Financiera */}
                      <td className="px-4 py-3.5 text-center">
                        {quote.financialApprovalStatus === 'AUTORIZADA' ? (
                          <div className="flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-700/70 shadow-xs">
                              <CheckCircle2 className="h-3 w-3" /> AUTORIZADA
                            </span>
                            <span className="text-[9px] text-slate-400 mt-0.5 font-mono">
                              v{quote.approvedQuoteVersion || quote.version || 1} • {quote.financialApprovedByName ? quote.financialApprovedByName.split(' ')[0] : 'Finanzas'}
                            </span>
                          </div>
                        ) : quote.financialApprovalStatus === 'RECHAZADA' ? (
                          <div className="flex flex-col items-center">
                            <span
                              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-rose-950/80 text-rose-400 border border-rose-700/70 shadow-xs cursor-pointer hover:bg-rose-900/60 transition-colors"
                              title={quote.financialApprovalNotes || 'Rechazada por Finanzas (Clic para ver)'}
                              onClick={() => {
                                showToast(`Dictamen Finanzas (${quote.folio}): ${quote.financialApprovalNotes || 'Rechazado sin observaciones adicionales'}`, 'error');
                              }}
                            >
                              <XCircle className="h-3 w-3" /> RECHAZADA
                            </span>
                            <span className="text-[9px] text-rose-300/80 truncate max-w-[115px] mt-0.5" title={quote.financialApprovalNotes}>
                              {quote.financialApprovalNotes || 'Dictamen adverso'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-amber-950/80 text-amber-400 border border-amber-700/70 shadow-xs">
                              <Clock className="h-3 w-3" /> PENDIENTE
                            </span>
                            <span className="text-[9px] text-amber-400/80 mt-0.5">
                              Requiere Dictamen
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* 1. Ver */}
                          <button
                            onClick={() => setViewingQuote(quote)}
                            title="Ver Detalle de Cotización"
                            className="rounded p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* 2. Editar (Hotfix 06: Versionado seguro) */}
                          {['BORRADOR', 'EN_NEGOCIACION', 'ENVIADA', 'PENDIENTE'].includes(quote.status) &&
                            !quote.convertedToOrderId &&
                            !(quote as any).converted_to_order_id && (
                              <button
                                onClick={() => handleOpenEditQuote(quote)}
                                title={`Editar Cotización ${quote.folio} (Preserva folio, genera v${(quote.version || 1) + 1})`}
                                className="rounded p-1.5 text-blue-400 hover:bg-blue-400/20 transition-colors"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            )}

                          {/* Duplicar Cotización (Observación 05: Validación RLS) */}
                          <button
                            onClick={() => handleDuplicateQuote(quote)}
                            title={`Duplicar Cotización ${quote.folio}`}
                            className="rounded p-1.5 text-cyan-400 hover:bg-cyan-400/20 transition-colors"
                          >
                            <Copy className="h-4 w-4" />
                          </button>

                          {/* 3. Descargar PDF (jspdf-autotable) */}
                          <button
                            onClick={() => handleDownloadPDF(quote)}
                            title="Descargar PDF Oficial"
                            className="rounded p-1.5 text-red-400 hover:bg-red-400/20 transition-colors"
                          >
                            <Download className="h-4 w-4" />
                          </button>

                          {/* 4. Imprimir Seguro */}
                          <button
                            onClick={() => handleInitiatePrint(quote)}
                            title="Imprimir"
                            className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                          >
                            <Printer className="h-4 w-4" />
                          </button>

                          {/* 5. WhatsApp Directo (P2-07) */}
                          <button
                            onClick={() => handleShareWhatsApp(quote)}
                            title="Compartir por WhatsApp"
                            className="rounded p-1.5 text-emerald-400 hover:bg-emerald-400/20 transition-colors"
                          >
                            <Share2 className="h-4 w-4" />
                          </button>

                          {/* 6. Correo Directo (P2-07) */}
                          <button
                            onClick={() => handleShareEmail(quote)}
                            title="Enviar por Correo"
                            className="rounded p-1.5 text-sky-400 hover:bg-sky-400/20 transition-colors"
                          >
                            <Mail className="h-4 w-4" />
                          </button>

                          {/* 7. Asistente IA */}
                          <button
                            onClick={() => {
                              const cust = customers.find((c) => c.id === quote.customerId);
                              setAiDraftTarget({ customer: cust, defaultChannel: 'WHATSAPP' });
                            }}
                            title="Redactar mensaje personalizado con IA"
                            className="rounded p-1.5 text-yellow-400 hover:bg-yellow-400/20 transition-colors"
                          >
                            <Sparkles className="h-4 w-4" />
                          </button>

                          {/* OBSERVACIÓN 16: Controles Rápidos de Dictamen Financiero */}
                          {!linkedOrder && (
                            <>
                              {userCanAuthorize && quote.financialApprovalStatus !== 'AUTORIZADA' && (
                                <>
                                  <button
                                    onClick={() => {
                                      setApprovalNotesModal(quote);
                                      setApprovalNotes('');
                                    }}
                                    title="Autorizar Financieramente (Dictamen Favorable)"
                                    className="rounded p-1.5 text-emerald-400 hover:bg-emerald-400/20 transition-colors"
                                  >
                                    <FileCheck className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setRejectingQuote(quote);
                                      setRejectionReason('');
                                    }}
                                    title="Rechazar Financieramente (Dictamen Adverso)"
                                    className="rounded p-1.5 text-rose-400 hover:bg-rose-400/20 transition-colors"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                              {!userCanAuthorize && quote.financialApprovalStatus !== 'AUTORIZADA' && (
                                <button
                                  onClick={() => {
                                    setRequestNotesModal(quote);
                                    setRequestNotes('');
                                  }}
                                  title="Solicitar Autorización a Finanzas"
                                  className="rounded p-1.5 text-amber-400 hover:bg-amber-400/20 transition-colors"
                                >
                                  <Clock className="h-4 w-4" />
                                </button>
                              )}
                            </>
                          )}

                          {/* 8. Crear Pedido o Badge de Pedido Creado (Control Obligatorio Finanzas) */}
                          {linkedOrder ? (
                            <button
                              onClick={() => {
                                if (onNavigateToOrders) {
                                  onNavigateToOrders();
                                } else {
                                  showToast(`Esta cotización ya generó el Pedido ${linkedOrder.folio}.`, 'info');
                                }
                              }}
                              title="Ver Pedido Vinculado"
                              className="flex items-center gap-1 rounded bg-emerald-950/80 border border-emerald-700/60 px-2 py-1 text-[10px] font-bold text-emerald-300 hover:bg-emerald-900/60 transition-colors"
                            >
                              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                              <span>{linkedOrder.folio}</span>
                            </button>
                          ) : isConvertible ? (
                            <button
                              onClick={() => handleOpenConvertToOrderModal(quote)}
                              title="Convertir a Pedido en Firme (Autorización Financiera Vigente)"
                              className="flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-500 shadow-sm transition-all"
                            >
                              <ArrowRight className="h-3.5 w-3.5" />
                              <span>Crear Pedido</span>
                            </button>
                          ) : !isFinancialApproved ? (
                            <button
                              disabled
                              title="Bloqueado: Requiere Autorización de Finanzas antes de crear pedido"
                              className="flex items-center gap-1 rounded bg-slate-800/80 border border-slate-700/80 px-2 py-1 text-[10px] font-bold text-slate-400 opacity-60 cursor-not-allowed shadow-xs"
                            >
                              <ShieldAlert className="h-3.5 w-3.5 text-amber-500/80" />
                              <span>Crear Pedido (Bloqueado)</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic px-1">No convertible</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Creating Order from Quote */}
      {confirmingQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="flex w-full max-w-2xl flex-col rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-md">
                  <FileCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Crear Pedido desde Cotización</h3>
                  <p className="text-xs text-slate-400">
                    Conversión transaccional formal con reserva de inventario en tiempo real
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConfirmingQuote(null)}
                disabled={isConvertingOrder}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Cotización</span>
                  <span className="font-mono text-sm font-bold text-yellow-400">{confirmingQuote.folio}</span>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Total (+IVA)</span>
                  <span className="text-sm font-bold text-emerald-400">
                    ${(Number(confirmingQuote.total) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 col-span-2">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Cliente Comercial</span>
                  <span className="text-xs font-bold text-white block truncate">{confirmingQuote.customerName}</span>
                  <span className="text-[10px] text-slate-400">RFC: {confirmingQuote.customerRFC || 'XAXX010101000'}</span>
                </div>
              </div>

              {/* Items Preview */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Partidas a Reservar en Almacén ({confirmingQuote.items.length})
                </label>
                <div className="rounded-lg border border-slate-800 bg-slate-950 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 border-b border-slate-800 text-[10px] font-bold uppercase text-slate-400">
                      <tr>
                        <th className="px-3 py-2">Código</th>
                        <th className="px-3 py-2">Descripción</th>
                        <th className="px-3 py-2 text-right">Cant.</th>
                        <th className="px-3 py-2 text-right">P. Unitario</th>
                        <th className="px-3 py-2 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {confirmingQuote.items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/40">
                          <td className="px-3 py-2 font-mono font-bold text-slate-300">{it.productCode}</td>
                          <td className="px-3 py-2 text-slate-300 truncate max-w-[200px]">{it.description}</td>
                          <td className="px-3 py-2 text-right font-bold text-white">{it.quantity}</td>
                          <td className="px-3 py-2 text-right text-slate-400">
                            ${(Number(it.unitPrice) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-emerald-400">
                            ${(Number(it.subtotal) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Operational notice */}
              <div className="rounded-lg border border-emerald-900/60 bg-emerald-950/30 p-3.5 flex items-start gap-3 text-xs text-emerald-200">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block">Acción Transaccional Segura</span>
                  <p className="text-[11px] text-emerald-300/80">
                    Al confirmar, se creará el nuevo Pedido formal, se generará la reserva de inventario correspondiente
                    en almacén y se registrará la auditoría de conversión vinculando el Master Transaction ID.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-800 bg-slate-950 px-6 py-4">
              <button
                type="button"
                onClick={() => setConfirmingQuote(null)}
                disabled={isConvertingOrder}
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => executeConvertToOrder(confirmingQuote)}
                disabled={isConvertingOrder}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConvertingOrder ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creando Pedido...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Confirmar y Crear Pedido</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New / Edit Quote Modal */}
      {isNewQuoteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="flex w-full max-w-4xl flex-col rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-400 text-slate-950 shadow-md">
                  <Receipt className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingQuote
                      ? `Editar Cotización ${editingQuote.folio} (v${editingQuote.version || 1} ➔ v${(editingQuote.version || 1) + 1})`
                      : 'Elaborar Cotización Formal'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingQuote
                      ? 'Modificación de partidas y recálculo seguro manteniendo folio e historial de versiones'
                      : 'Cálculo dinámico de margen bruto, visibilidad de stock y validación de políticas comerciales'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                title="Cerrar modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuote} className="flex-1 space-y-4 p-6 overflow-y-auto max-h-[75vh]">
              {/* Customer Selector (Hotfix 06 - Section 7: Bloqueado en modo edición) */}
              {editingQuote ? (
                <div className="rounded-lg border border-slate-700 bg-slate-800/80 p-3.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                        Cliente Comercial (Bloqueado para Edición)
                      </label>
                      <p className="text-sm font-bold text-white mt-0.5">
                        {editingQuote.customerName || customers.find((c) => c.id === selectedCustomerId)?.businessName}
                        <span className="ml-2 font-mono text-xs font-normal text-slate-400">
                          (RFC: {editingQuote.customerRFC || customers.find((c) => c.id === selectedCustomerId)?.rfc || 'RFC S/D'})
                        </span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs rounded px-2.5 py-0.5 bg-blue-950/80 text-blue-300 border border-blue-800 font-mono font-bold">
                        Folio: {editingQuote.folio}
                      </span>
                      <span className="text-[11px] text-slate-300 font-mono">
                        Versión Actual: v{editingQuote.version || 1}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-amber-300/90 font-medium pt-1">
                    * El cliente y el folio permanecen inmutables. Para cotizar a un cliente diferente, elabore una nueva cotización.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">Cliente Comercial</label>
                    <span className="text-[11px] text-slate-400">
                      {isPrivileged ? 'Catálogo global' : 'Cartera asignada (RLS)'} ({filteredScopedCustomers.length} {filteredScopedCustomers.length === 1 ? 'cliente' : 'clientes'})
                    </span>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Buscar por cliente, RFC o código en tu cartera..."
                      value={customerSearchQuery}
                      onChange={(e) => setCustomerSearchQuery(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-8 pr-7 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-yellow-400 focus:outline-none"
                    />
                    {customerSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setCustomerSearchQuery('')}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {filteredScopedCustomers.length === 0 ? (
                    <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-3 text-center text-xs text-red-300">
                      No se encontraron clientes asignados a tu cartera que coincidan con la búsqueda. Recuerda que no es posible cotizar a clientes de otros ejecutivos.
                    </div>
                  ) : (
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => handleCustomerChange(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-yellow-400 focus:outline-none"
                    >
                      {filteredScopedCustomers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.code} — {c.businessName} (RFC: {c.rfc}) {c.creditDays ? `[Crédito ${c.creditDays}d]` : '[Contado]'}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Preloaded Customer Dossier Card (Requirement #18) */}
                  {selectedCustomer && (
                    <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3 text-xs text-slate-300">
                      <div className="flex items-center justify-between font-semibold text-white">
                        <span className="text-yellow-400">{selectedCustomer.businessName}</span>
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 font-mono">
                          RFC: {selectedCustomer.rfc || 'XAXX010101000'}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-1 gap-1 text-[11px] text-slate-400 sm:grid-cols-2">
                        <div>
                          <strong className="text-slate-300">Contacto:</strong> {selectedCustomer.contactName || 'Contacto Comercial'}
                          {selectedCustomer.email ? <span className="ml-1 text-slate-400">({selectedCustomer.email})</span> : null}
                        </div>
                        <div>
                          <strong className="text-slate-300">Teléfono:</strong> {selectedCustomer.phone || 'N/A'}
                        </div>
                        <div className="sm:col-span-2">
                          <strong className="text-slate-300">Dirección:</strong> {selectedCustomer.address || 'Domicilio fiscal registrado'}
                        </div>
                        <div className="sm:col-span-2 flex items-center justify-between pt-1.5 border-t border-slate-800/80 mt-1">
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            ✓ Condición por Defecto: PAGO DE CONTADO
                          </span>
                          {selectedCustomer.creditDays ? (
                            <span className="text-slate-400 text-[10px]">
                              Línea de crédito autorizada: {selectedCustomer.creditDays} días
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[10px]">Sin línea de crédito</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Items Table with Observación 09 Stock Availability Reference */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                      Partidas / Productos
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Disponibilidad en tiempo real: <strong className="text-yellow-400">Físico − Reservado = Disponible</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsProductSelectorOpen(true)}
                      className="flex items-center gap-1.5 rounded-lg bg-yellow-400 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-xs hover:bg-yellow-300 transition-colors"
                      id="btn-open-product-catalog"
                    >
                      <Search className="h-3.5 w-3.5" /> Explorar Catálogo con Stock
                    </button>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
                      id="btn-add-quick-item"
                    >
                      <Plus className="h-3.5 w-3.5" /> Partida Rápida
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {items.map((item, idx) => {
                    const prod = products.find((p) => p.id === item.productId);
                    const lineSubtotal = item.quantity * item.unitPrice * (1 - item.discountPct / 100);
                    const avail = QuoteAvailabilityService.calculateAvailability(prod, item.quantity);
                    const isWarehouseExpanded = Boolean(expandedWarehouseRows[idx]);

                    return (
                      <div
                        key={idx}
                        className="rounded-lg border border-slate-800 bg-slate-950 p-3.5 space-y-3 shadow-xs"
                        id={`quote-item-row-${idx}`}
                      >
                        <div className="flex flex-wrap items-center gap-3">
                          {/* Product */}
                          <div className="flex-1 min-w-[260px]">
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[10px] text-slate-400 uppercase font-semibold">Producto / SKU</label>
                              <button
                                type="button"
                                onClick={() => setIsProductSelectorOpen(true)}
                                className="text-[10px] text-yellow-400 hover:underline flex items-center gap-0.5"
                                title="Abrir selector de catálogo con filtros y stock"
                              >
                                <Search className="h-2.5 w-2.5" /> Ver en Catálogo
                              </button>
                            </div>
                            <select
                              value={item.productId}
                              onChange={(e) => handleProductChange(idx, e.target.value)}
                              className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:border-yellow-400 focus:outline-none"
                              id={`select-product-row-${idx}`}
                            >
                              {products.map((p) => {
                                const pAvail = QuoteAvailabilityService.getAvailableStock(p);
                                const statusShort = pAvail > 0 ? `Disp: ${pAvail} ${p.unit} [EN EXISTENCIA]` : `Disp: 0 ${p.unit} [SIN EXISTENCIA]`;
                                return (
                                  <option key={p.id} value={p.id}>
                                    {p.code} — {p.name} (${p.price} {p.unit}) | {statusShort}
                                  </option>
                                );
                              })}
                            </select>
                          </div>

                          {/* Cantidad */}
                          <div className="w-24">
                            <label className="text-[10px] text-slate-400 uppercase block mb-1 font-semibold">
                              Cant ({prod?.unit || 'PZA'})
                            </label>
                            <input
                              type="number"
                              min="0.1"
                              step="any"
                              value={item.quantity}
                              onChange={(e) => {
                                const newItems = [...items];
                                newItems[idx].quantity = parseFloat(e.target.value) || 0;
                                setItems(newItems);
                              }}
                              className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-right font-bold text-white focus:border-yellow-400 focus:outline-none"
                              id={`input-quantity-row-${idx}`}
                            />
                          </div>

                          {/* Precio Unitario */}
                          <div className="w-28">
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-[10px] text-slate-400 uppercase font-semibold">Precio U. ($)</label>
                              <span className="text-[9px] text-slate-400">Lista: ${prod?.price || 0}</span>
                            </div>
                            <input
                              type="number"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => {
                                const newItems = [...items];
                                newItems[idx].unitPrice = parseFloat(e.target.value) || 0;
                                setItems(newItems);
                              }}
                              className={`w-full rounded border px-2.5 py-1.5 text-xs text-right text-white focus:outline-none ${
                                !isManagerOrAdmin && item.unitPrice < (prod?.price || 0)
                                  ? 'border-red-500 bg-red-950/40 focus:border-red-400'
                                  : 'border-slate-700 bg-slate-900 focus:border-yellow-400'
                              }`}
                              id={`input-price-row-${idx}`}
                            />
                            {!isManagerOrAdmin && item.unitPrice < (prod?.price || 0) && (
                              <span className="text-[9px] text-red-400 font-bold block mt-0.5">
                                &lt; Lista (${prod?.price || 0})
                              </span>
                            )}
                          </div>

                          {/* Descuento % */}
                          <div className="w-20">
                            <label className="text-[10px] text-slate-400 uppercase block mb-1 font-semibold">Desc %</label>
                            <input
                              type="number"
                              min="0"
                              max="50"
                              value={item.discountPct}
                              onChange={(e) => {
                                const newItems = [...items];
                                newItems[idx].discountPct = parseFloat(e.target.value) || 0;
                                setItems(newItems);
                              }}
                              className={`w-full rounded border px-2.5 py-1.5 text-xs text-center font-bold focus:outline-none ${
                                !isManagerOrAdmin && item.discountPct > maxAllowedDiscount
                                  ? 'border-red-500 bg-red-950/40 text-red-300 focus:border-red-400'
                                  : 'border-slate-700 bg-slate-900 text-yellow-400 focus:border-yellow-400'
                              }`}
                              id={`input-discount-row-${idx}`}
                            />
                            {!isManagerOrAdmin && item.discountPct > maxAllowedDiscount && (
                              <span
                                className="text-[9px] text-red-400 font-bold block mt-0.5"
                                title={`Tu límite máximo de descuento es ${maxAllowedDiscount}%.`}
                              >
                                &gt; {maxAllowedDiscount}% Bloqueado
                              </span>
                            )}
                          </div>

                          {/* Importe */}
                          <div className="w-28 text-right">
                            <label className="text-[10px] text-slate-400 uppercase block mb-1 font-semibold">Importe</label>
                            <span className="text-xs font-bold text-emerald-400 block pt-1">
                              ${(Number(lineSubtotal) || 0).toLocaleString('es-MX')}
                            </span>
                          </div>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-slate-500 hover:text-red-400 pt-3"
                            title="Eliminar partida"
                            id={`btn-remove-row-${idx}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* OBSERVACIÓN 09: Referencia de Stock & Estado de Disponibilidad */}
                        <div className="rounded-md border border-slate-800/80 bg-slate-900/60 p-2.5 text-xs space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            {/* Stock Metrics Bar */}
                            <div className="flex items-center gap-3 text-[11px] text-slate-400">
                              <span>
                                Físico: <strong className="text-slate-200">{avail.physicalStock}</strong> {avail.unit}
                              </span>
                              <span className="text-slate-600">·</span>
                              <span>
                                Reservado: <strong className="text-amber-300">{avail.reservedStock}</strong> {avail.unit}
                              </span>
                              <span className="text-slate-600">·</span>
                              <span>
                                Disponible: <strong className={avail.availableStock > 0 ? 'text-emerald-300 font-bold' : 'text-slate-400'}>{avail.availableStock}</strong> {avail.unit}
                              </span>
                            </div>

                            {/* Status Badge */}
                            <div>
                              {avail.status === 'ENTREGA_INMEDIATA' ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/80 border border-emerald-800/70 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                  ENTREGA INMEDIATA
                                </span>
                              ) : avail.status === 'DISPONIBILIDAD_PARCIAL' ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-950/80 border border-amber-800/70 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                                  <AlertTriangle className="h-3 w-3 text-amber-400" />
                                  DISPONIBILIDAD PARCIAL
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-950/80 border border-rose-800/70 px-2.5 py-0.5 text-[10px] font-bold text-rose-300">
                                  <Clock className="h-3 w-3 text-rose-400" />
                                  SIN STOCK DISPONIBLE
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Recommendation & Explanatory text */}
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] pt-1 border-t border-slate-800/50">
                            <span className="text-slate-300">
                              {avail.status === 'ENTREGA_INMEDIATA' ? (
                                <span className="text-emerald-400">
                                  ✓ Stock suficiente para surtido inmediato ({item.quantity} de {avail.availableStock} {avail.unit} disp.)
                                </span>
                              ) : avail.status === 'DISPONIBILIDAD_PARCIAL' ? (
                                <span className="text-amber-300">
                                  ⚠️ Inmediato: <strong>{avail.immediateAvailableQty}</strong> {avail.unit} · Pendiente: <strong>{avail.pendingQty}</strong> {avail.unit} (Validar tiempo de entrega)
                                </span>
                              ) : (
                                <span className="text-rose-300">
                                  ⏱ Sin stock inmediato. Cotizar con tiempo de entrega estimado / Reabastecimiento bajo pedido.
                                </span>
                              )}
                            </span>

                            {/* Warehouses toggle if multiple */}
                            {avail.warehouses && avail.warehouses.length > 0 && (
                              <button
                                type="button"
                                onClick={() => toggleRowWarehouse(idx)}
                                className="text-[10px] text-slate-400 hover:text-slate-200 underline font-medium"
                              >
                                {isWarehouseExpanded ? 'Ocultar almacenes' : `Ver ${avail.warehouses.length} almacén(es)`}
                              </button>
                            )}
                          </div>

                          {/* Expanded Warehouse Breakdown */}
                          {isWarehouseExpanded && avail.warehouses && avail.warehouses.length > 0 && (
                            <div className="mt-2 rounded bg-slate-950/80 p-2 border border-slate-800 space-y-1">
                              <span className="text-[10px] font-semibold text-slate-400 block uppercase">Desglose de Almacenes:</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                                {avail.warehouses.map((wh, wIdx) => (
                                  <div key={wIdx} className="flex justify-between items-center bg-slate-900/60 p-1.5 rounded border border-slate-800/50">
                                    <span className="text-slate-300">{wh.warehouseName}:</span>
                                    <span className="font-mono text-slate-200">
                                      Disp: <strong className="text-emerald-400">{wh.availableStock}</strong> (Fís: {wh.physicalStock}, Res: {wh.reservedStock})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Observación 09: Summary of Quote Availability & Disclaimer Banner */}
                {(() => {
                  const quoteSummary = QuoteAvailabilityService.calculateQuoteAvailabilitySummary(items, products);
                  return (
                    <div className="space-y-2 pt-1">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-slate-400 font-semibold">Balance de Existencias en Cotización:</span>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-950/70 border border-emerald-800/60 px-2 py-0.5 text-[10px] text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" /> {quoteSummary.immediateCount} Entrega Inmediata
                          </span>
                          <span className="inline-flex items-center gap-1 rounded bg-amber-950/70 border border-amber-800/60 px-2 py-0.5 text-[10px] text-amber-300">
                            <AlertTriangle className="h-3 w-3" /> {quoteSummary.partialCount} Disponibilidad Parcial
                          </span>
                          <span className="inline-flex items-center gap-1 rounded bg-rose-950/70 border border-rose-800/60 px-2 py-0.5 text-[10px] text-rose-300">
                            <Clock className="h-3 w-3" /> {quoteSummary.noStockCount} Sin Stock Inmediato
                          </span>
                        </div>
                      </div>

                      {/* Observación 09 - Sección 16: Leyenda Informativa Regulatoria */}
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                        <span className="text-yellow-400 font-bold shrink-0">ℹ️</span>
                        <span>
                          <strong>Aviso Comercial:</strong> Disponibilidad sujeta a confirmación al generar pedido. Una cotización no reserva inventario físico ni afecta el Kardex.
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Commercial Governance & Policy Guard */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-3.5 space-y-2 text-xs">
                  <span className="font-bold text-white block">Gobierno Comercial & Política de Precios</span>
                  {isManagerOrAdmin ? (
                    <div className="flex justify-between text-slate-400">
                      <span>Margen Bruto Calculado:</span>
                      <span
                        className={`font-bold ${
                          marginViolated ? 'text-red-400' : 'text-emerald-400'
                        }`}
                      >
                        {((liveCalculation?.grossMarginPct ?? liveCalculation?.marginPct) || 0).toFixed(1)}% (Mínimo{' '}
                        {companyConfig?.minGrossMarginPct}%)
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-slate-400">
                      <span>Control de Lista:</span>
                      <span className="font-bold text-emerald-400">
                        Precios protegidos (≥ Precio de Lista)
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-400">
                    <span>Descuento Promedio:</span>
                    <span
                      className={`font-bold ${
                        discountExceeded ? 'text-amber-400' : 'text-slate-200'
                      }`}
                    >
                      {((liveCalculation?.avgDiscountPct ?? liveCalculation?.discountPct) || 0).toFixed(1)}% (Máx Vendedor:{' '}
                      {companyConfig?.maxDiscountSalesperson}%)
                    </span>
                  </div>

                  {discountExceeded && (
                    <div className="flex items-center gap-2 text-[11px] text-amber-300 bg-amber-950/40 p-2 rounded border border-amber-800/40">
                      <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                      <span>Descuento elevado: requiere aprobación de Gerencia para autorizarse.</span>
                    </div>
                  )}
                </div>

                {/* Totals Box */}
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-3.5 space-y-1.5 text-xs text-right">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal:</span>
                    <span className="font-bold text-white">
                      ${(Number(liveCalculation.subtotal) || 0).toLocaleString('es-MX')} MXN
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>IVA (16%):</span>
                    <span className="font-bold text-white">
                      ${(Number(liveCalculation.tax) || 0).toLocaleString('es-MX')} MXN
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-black border-t border-slate-800 pt-1.5 text-emerald-400">
                    <span>Total:</span>
                    <span>${(Number(liveCalculation.total) || 0).toLocaleString('es-MX')} MXN</span>
                  </div>
                </div>
              </div>

              {/* Delivery Terms & Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-300">Condiciones de Pago</label>
                    <span className="text-[10px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                      Default: PAGO DE CONTADO
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      list="quote-payment-terms-catalog"
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-yellow-400 focus:outline-none"
                      placeholder="PAGO DE CONTADO"
                    />
                    <datalist id="quote-payment-terms-catalog">
                      {PAYMENT_TERMS_CATALOG.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </datalist>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-300">Tiempo de Entrega</label>
                  <input
                    type="text"
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-yellow-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-lg bg-yellow-400 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-yellow-300 shadow-md"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {editingQuote
                    ? `Guardar Cambios (Generar v${(editingQuote.version || 1) + 1})`
                    : 'Emitir Cotización'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quote Document Viewer / Print Modal */}
      {viewingQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs print:p-0 print:bg-white print:fixed print:inset-0 print:z-[99999]">
          <div className="flex w-full max-w-3xl flex-col rounded-xl border border-slate-700 bg-white text-slate-900 shadow-2xl overflow-hidden max-h-[90vh] printable-document print:border-none print:shadow-none print:max-h-none print:w-full print:max-w-none print:p-6">
            {/* Action Bar in White Document */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100 px-6 py-3 no-print print-hide">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-700" />
                <span className="font-mono text-xs font-bold text-slate-800">COTIZACIÓN {viewingQuote.folio}</span>
              </div>
              <div className="flex items-center gap-2">
                {/* PDF Download */}
                <button
                  type="button"
                  onClick={() => handleDownloadPDF(viewingQuote)}
                  className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-500 shadow-xs transition-colors"
                  title="Descargar documento formal en PDF"
                >
                  <Download className="h-3.5 w-3.5" /> PDF
                </button>

                {/* WhatsApp Direct Share (P2-07) */}
                <button
                  type="button"
                  onClick={() => handleShareWhatsApp(viewingQuote)}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 shadow-xs transition-colors"
                  title="Compartir por WhatsApp con el cliente"
                >
                  <Share2 className="h-3.5 w-3.5" /> WhatsApp
                </button>

                {/* Email Direct Share (P2-07) */}
                <button
                  type="button"
                  onClick={() => handleShareEmail(viewingQuote)}
                  className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-500 shadow-xs transition-colors"
                  title="Enviar por Correo al cliente"
                >
                  <Mail className="h-3.5 w-3.5" /> Correo
                </button>

                {/* Print */}
                <button
                  type="button"
                  onClick={() => handleSafePrint(viewingQuote)}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700 shadow-xs transition-colors"
                  title="Imprimir documento oficial"
                >
                  <Printer className="h-3.5 w-3.5" /> Imprimir
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadQuoteHTML(viewingQuote)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
                  title="Descargar archivo HTML"
                >
                  <FileText className="h-3.5 w-3.5" /> HTML
                </button>

                {/* Hotfix 06: Botón Editar desde el Visor */}
                {!viewingQuote.convertedToOrderId &&
                  !(viewingQuote as any).converted_to_order_id &&
                  viewingQuote.status !== 'CONVERTIDA' &&
                  !['CANCELADA', 'VENCIDA', 'RECHAZADA'].includes(viewingQuote.status) && (
                    <button
                      type="button"
                      onClick={() => {
                        const q = viewingQuote;
                        setViewingQuote(null);
                        handleOpenEditQuote(q);
                      }}
                      className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500 shadow-xs transition-colors"
                      title={`Editar cotización ${viewingQuote.folio} (preserva folio)`}
                    >
                      <Pencil className="h-3.5 w-3.5" /> Editar
                    </button>
                  )}

                {/* Observación 05: Duplicar desde el Visor */}
                <button
                  type="button"
                  onClick={() => {
                    const q = viewingQuote;
                    setViewingQuote(null);
                    handleDuplicateQuote(q);
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
                  title={`Duplicar cotización ${viewingQuote.folio}`}
                >
                  <Copy className="h-3.5 w-3.5 text-cyan-600" /> Duplicar
                </button>

                {/* OBSERVACIÓN 16: Acciones de Finanzas en el Visor */}
                {!viewingQuote.convertedToOrderId &&
                  !(viewingQuote as any).converted_to_order_id &&
                  viewingQuote.status !== 'CONVERTIDA' && (
                    <>
                      {QuoteFinancialApprovalService.canUserAuthorize(currentUser, viewingQuote).allowed &&
                        viewingQuote.financialApprovalStatus !== 'AUTORIZADA' && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setApprovalNotesModal(viewingQuote);
                                setApprovalNotes('');
                              }}
                              className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 shadow-xs transition-colors"
                              title="Emitir Dictamen Favorable de Finanzas"
                            >
                              <FileCheck className="h-3.5 w-3.5" /> Autorizar Finanzas
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRejectingQuote(viewingQuote);
                                setRejectionReason('');
                              }}
                              className="flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-500 shadow-xs transition-colors"
                              title="Emitir Dictamen Adverso de Finanzas"
                            >
                              <XCircle className="h-3.5 w-3.5" /> Rechazar Finanzas
                            </button>
                          </div>
                        )}
                      {!QuoteFinancialApprovalService.canUserAuthorize(currentUser, viewingQuote).allowed &&
                        viewingQuote.financialApprovalStatus !== 'AUTORIZADA' && (
                          <button
                            type="button"
                            onClick={() => {
                              setRequestNotesModal(viewingQuote);
                              setRequestNotes('');
                            }}
                            className="flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-500 shadow-xs transition-colors"
                            title="Enviar solicitud formal a Finanzas"
                          >
                            <Clock className="h-3.5 w-3.5" /> Solicitar Finanzas
                          </button>
                        )}
                    </>
                  )}

                {/* Crear Pedido con Control de Finanzas Obligatorio */}
                {!viewingQuote.convertedToOrderId &&
                  !(viewingQuote as any).converted_to_order_id &&
                  viewingQuote.status !== 'CONVERTIDA' && (
                    QuoteFinancialApprovalService.validateForOrderConversion(viewingQuote).allowed ? (
                      <button
                        type="button"
                        onClick={() => handleOpenConvertToOrderModal(viewingQuote)}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-colors bg-emerald-600 hover:bg-emerald-500"
                        title="Generar pedido formal"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                        <span>Crear Pedido</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-400 bg-slate-800/80 border border-slate-700 cursor-not-allowed opacity-60 shadow-xs"
                        title="Bloqueado: Requiere autorización de Finanzas antes de generar pedido"
                      >
                        <ShieldAlert className="h-3.5 w-3.5 text-amber-500/80" />
                        <span>Crear Pedido (Bloqueado por Finanzas)</span>
                      </button>
                    )
                  )}
                <button
                  type="button"
                  onClick={() => setViewingQuote(null)}
                  className="p-1 text-slate-500 hover:text-slate-900 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Document Content */}
            <div className="flex-1 p-8 space-y-6 overflow-y-auto print:p-0 print:overflow-visible">
              {/* Hotfix 06: Converted / Order Lock Notice */}
              {(Boolean(viewingQuote.convertedToOrderId) ||
                Boolean((viewingQuote as any).converted_to_order_id) ||
                viewingQuote.status === 'CONVERTIDA' ||
                (viewingQuote.status as string) === 'CONVERTIDA_A_PEDIDO') && (
                <div className="rounded-lg bg-amber-50 border border-amber-300 p-3 text-amber-800 text-xs flex items-center gap-2.5 shadow-xs">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span className="font-semibold">
                    Esta cotización ya fue convertida en pedido formal y sus especificaciones se encuentran bloqueadas para edición retroactiva.
                  </span>
                </div>
              )}

              {/* OBSERVACIÓN 16: Dictamen de Finanzas para Cotización → Pedido */}
              <div
                className={`rounded-lg border p-4 text-xs transition-all no-print ${
                  viewingQuote.financialApprovalStatus === 'AUTORIZADA'
                    ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                    : viewingQuote.financialApprovalStatus === 'RECHAZADA'
                    ? 'bg-rose-50/90 border-rose-300 text-rose-950'
                    : 'bg-amber-50/90 border-amber-300 text-amber-950'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2.5">
                    {viewingQuote.financialApprovalStatus === 'AUTORIZADA' ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : viewingQuote.financialApprovalStatus === 'RECHAZADA' ? (
                      <XCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                    ) : (
                      <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold uppercase tracking-wide text-xs">
                          {viewingQuote.financialApprovalStatus === 'AUTORIZADA'
                            ? 'AUTORIZACIÓN FINANCIERA VIGENTE — APTO PARA PEDIDO'
                            : viewingQuote.financialApprovalStatus === 'RECHAZADA'
                            ? 'DICTAMEN FINANCIERO ADVERSO — RECHAZADA PARA PEDIDO'
                            : 'AUTORIZACIÓN DE FINANZAS PENDIENTE (REQUISITO PARA PEDIDO)'}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold ${
                            viewingQuote.financialApprovalStatus === 'AUTORIZADA'
                              ? 'bg-emerald-200 text-emerald-900'
                              : viewingQuote.financialApprovalStatus === 'RECHAZADA'
                              ? 'bg-rose-200 text-rose-900'
                              : 'bg-amber-200 text-amber-900'
                          }`}
                        >
                          {viewingQuote.financialApprovalStatus || 'PENDIENTE'}
                        </span>
                      </div>

                      {viewingQuote.financialApprovalStatus === 'AUTORIZADA' ? (
                        <div className="mt-2 space-y-1 text-slate-700">
                          <p>
                            Dictaminado favorablemente por{' '}
                            <strong>{viewingQuote.financialApprovedByName || 'Finanzas'}</strong> (
                            {viewingQuote.financialApprovedRole || 'FINANZAS'}) el{' '}
                            <span className="font-mono">
                              {viewingQuote.financialApprovedAt
                                ? new Date(viewingQuote.financialApprovedAt).toLocaleString('es-MX')
                                : 'Fecha registrada'}
                            </span>{' '}
                            para la versión <strong>v{viewingQuote.approvedQuoteVersion || viewingQuote.version || 1}</strong>.
                          </p>
                          <div className="grid grid-cols-2 gap-2 mt-2 bg-white/80 p-2.5 rounded border border-emerald-200 font-mono text-[11px]">
                            <div>
                              <span className="text-slate-500 block">Total Avalado:</span>
                              <strong className="text-emerald-900 text-xs">
                                ${(Number(viewingQuote.financialApprovalSnapshot?.total || viewingQuote.total) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                              </strong>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Plazo Avalado:</span>
                              <strong className="text-slate-800 text-xs">
                                {viewingQuote.financialApprovalSnapshot?.paymentTerms || viewingQuote.paymentTerms || 'Contado'}
                              </strong>
                            </div>
                          </div>
                          {viewingQuote.financialApprovalNotes && (
                            <p className="mt-1.5 italic text-slate-600">
                              Notas de Finanzas: &ldquo;{viewingQuote.financialApprovalNotes}&rdquo;
                            </p>
                          )}
                          <p className="text-[10px] text-emerald-700 font-semibold mt-1">
                            * Nota: Si la cotización es modificada posteriormente en sus importes o condiciones de pago, la autorización actual quedará invalidada automáticamente por política de control.
                          </p>
                        </div>
                      ) : viewingQuote.financialApprovalStatus === 'RECHAZADA' ? (
                        <div className="mt-2 space-y-1.5 text-slate-700">
                          <p>
                            Rechazada por <strong>{viewingQuote.financialRejectedByName || 'Finanzas'}</strong> el{' '}
                            <span className="font-mono">
                              {viewingQuote.financialRejectedAt
                                ? new Date(viewingQuote.financialRejectedAt).toLocaleString('es-MX')
                                : 'Fecha registrada'}
                            </span>
                            .
                          </p>
                          <div className="bg-white/90 p-2.5 rounded border border-rose-200 text-rose-950">
                            <span className="font-bold text-rose-800 uppercase block text-[10px]">
                              Motivo del Dictamen de Rechazo:
                            </span>
                            <p className="mt-0.5 font-medium">
                              {viewingQuote.financialApprovalNotes || 'No se especificó motivo detallado.'}
                            </p>
                          </div>
                          <p className="text-[11px] text-slate-600">
                            Para poder convertir a pedido, el asesor debe generar una nueva versión ajustando condiciones comerciales o resolver las observaciones con Finanzas.
                          </p>
                        </div>
                      ) : (
                        <div className="mt-2 space-y-1 text-slate-700">
                          <p>
                            Esta cotización no puede convertirse en Pedido hasta que el área de Finanzas emita dictamen formal de autorización de crédito, precios y condiciones de pago.
                          </p>
                          {viewingQuote.financialRequestedAt && (
                            <p className="text-[11px] text-slate-600">
                              Solicitud ingresada el{' '}
                              <span className="font-mono">
                                {new Date(viewingQuote.financialRequestedAt).toLocaleString('es-MX')}
                              </span>{' '}
                              por {viewingQuote.financialRequestedByName || viewingQuote.salespersonName}.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions inside card */}
                  <div className="shrink-0 flex flex-col gap-1.5">
                    {QuoteFinancialApprovalService.canUserAuthorize(currentUser, viewingQuote).allowed && (
                      <>
                        {viewingQuote.financialApprovalStatus !== 'AUTORIZADA' && (
                          <button
                            type="button"
                            onClick={() => {
                              setApprovalNotesModal(viewingQuote);
                              setApprovalNotes('');
                            }}
                            className="flex items-center justify-center gap-1 rounded bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-500 shadow-xs"
                          >
                            <FileCheck className="h-3.5 w-3.5" />
                            <span>Autorizar</span>
                          </button>
                        )}
                        {viewingQuote.financialApprovalStatus !== 'RECHAZADA' && (
                          <button
                            type="button"
                            onClick={() => {
                              setRejectingQuote(viewingQuote);
                              setRejectionReason('');
                            }}
                            className="flex items-center justify-center gap-1 rounded bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-rose-500 shadow-xs"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Rechazar</span>
                          </button>
                        )}
                      </>
                    )}
                    {!QuoteFinancialApprovalService.canUserAuthorize(currentUser, viewingQuote).allowed &&
                      viewingQuote.financialApprovalStatus !== 'AUTORIZADA' && (
                        <button
                          type="button"
                          onClick={() => {
                            setRequestNotesModal(viewingQuote);
                            setRequestNotes('');
                          }}
                          className="flex items-center justify-center gap-1 rounded bg-amber-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-amber-500 shadow-xs"
                        >
                          <Clock className="h-3.5 w-3.5" />
                          <span>Solicitar Finanzas</span>
                        </button>
                      )}
                  </div>
                </div>
              </div>

              {/* Document Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-950">CONSCORE</h2>
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-600">
                    Aislamiento Térmico & Acústico de Alto Rendimiento
                  </p>
                  <p className="text-xs text-slate-600 mt-1">RFC: CON190408K89</p>
                  <p className="text-xs text-slate-600">Av. Industrial 450, Parque Industrial Querétaro</p>
                  <p className="text-xs text-slate-600">Tel: (442) 290-8800 · contacto@conscore.com.mx</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold uppercase text-slate-500 block">COTIZACIÓN FORMAL</span>
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-xl font-black text-slate-950 font-mono">{viewingQuote.folio}</span>
                    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[11px] font-bold text-blue-800 font-mono">
                      v{viewingQuote.version || 1}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">Fecha de Emisión: <strong>{viewingQuote.date}</strong></p>
                  <p className="text-xs text-slate-600">Válida Hasta: <strong>{viewingQuote.validUntil}</strong></p>
                </div>
              </div>

              {/* Customer Box */}
              {(() => {
                const matchedCustomer = customers.find(
                  (c) => c.id === viewingQuote.customerId || c.company_name === viewingQuote.customerName || c.name === viewingQuote.customerName
                );
                return (
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="font-bold text-slate-500 uppercase block mb-1">Cliente / Razón Social</span>
                      <p className="font-bold text-slate-900 text-sm">{viewingQuote.customerName}</p>
                      <p className="text-slate-600">RFC: {viewingQuote.customerRFC || matchedCustomer?.rfc || matchedCustomer?.tax_id || 'XAXX010101000'}</p>
                      <p className="text-slate-600">Contacto: <strong className="text-slate-800">{matchedCustomer?.contact_name || matchedCustomer?.contactName || 'Atención a Compras'}</strong></p>
                      {(matchedCustomer?.phone || matchedCustomer?.email) && (
                        <p className="text-slate-500 mt-0.5">
                          {matchedCustomer?.phone && `Tel: ${matchedCustomer.phone}`}
                          {matchedCustomer?.phone && matchedCustomer?.email && ' · '}
                          {matchedCustomer?.email && matchedCustomer.email}
                        </p>
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-slate-500 uppercase block mb-1">Condiciones Comerciales</span>
                      <p className="text-slate-700">Asesor: <strong className="text-slate-900">{viewingQuote.salespersonName}</strong></p>
                      <p className="text-slate-700">Plazo / Pago: <strong className="text-slate-900">{normalizePaymentTerms(viewingQuote.paymentTerms || (viewingQuote as any).payment_terms)}</strong></p>
                      <p className="text-slate-700">Tiempo de Entrega: <strong className="text-slate-900">{viewingQuote.deliveryTime || '3 a 5 días hábiles'}</strong></p>
                      <p className="text-slate-700">Moneda: <strong className="text-slate-900">MXN (Pesos Mexicanos)</strong></p>
                    </div>
                  </div>
                );
              })()}

              {/* Items Table */}
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-100 border-b border-slate-200 font-bold uppercase text-slate-700">
                  <tr>
                    <th className="p-2.5">Código</th>
                    <th className="p-2.5">Descripción Técnica</th>
                    <th className="p-2.5 text-center">U.M.</th>
                    <th className="p-2.5 text-right">Cant.</th>
                    <th className="p-2.5 text-right">P. Unitario</th>
                    <th className="p-2.5 text-center">Desc</th>
                    <th className="p-2.5 text-right">Importe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {viewingQuote.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-mono font-bold text-slate-800">{it.productCode}</td>
                      <td className="p-2.5 text-slate-700">{it.description}</td>
                      <td className="p-2.5 text-center text-slate-600">{it.um || 'PZA'}</td>
                      <td className="p-2.5 text-right font-semibold">{it.quantity}</td>
                      <td className="p-2.5 text-right">${(Number(it.unitPrice) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                      <td className="p-2.5 text-center">{it.discountPct > 0 ? `${it.discountPct}%` : '—'}</td>
                      <td className="p-2.5 text-right font-bold text-slate-900">
                        ${(Number(it.subtotal) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end pt-2">
                <div className="w-72 space-y-1.5 text-xs text-right border-t border-slate-200 pt-3">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-bold text-slate-900">
                      ${(Number(viewingQuote.subtotal) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>IVA (16%):</span>
                    <span className="font-bold text-slate-900">
                      ${(Number(viewingQuote.tax) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-black text-slate-950 border-t-2 border-slate-900 pt-1.5">
                    <span>Total:</span>
                    <span>${(Number(viewingQuote.total) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {viewingQuote.notes && (
                <div className="text-[11px] text-slate-600 border-t border-slate-200 pt-4 bg-slate-50 p-3 rounded-lg">
                  <span className="font-bold text-slate-800 uppercase block mb-1">Notas & Especificaciones:</span>
                  <p>{viewingQuote.notes}</p>
                </div>
              )}

              {/* Hotfix 06: Historial de Versiones (Section 10 & 18) */}
              {viewingQuote.versions && viewingQuote.versions.length > 0 && (
                <div className="border-t border-slate-200 pt-4 space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <History className="h-4 w-4 text-blue-600" />
                    Historial de Versiones Anteriores ({viewingQuote.versions.length})
                  </h4>
                  <div className="space-y-2">
                    {viewingQuote.versions.map((ver, idx) => (
                      <div key={ver.id || idx} className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 text-xs">
                        <div className="flex items-center justify-between font-semibold text-slate-800">
                          <span className="font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                            Versión v{ver.version}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {new Date(ver.modifiedAt).toLocaleString('es-MX')}
                          </span>
                        </div>
                        <div className="mt-1.5 text-slate-600 flex items-center justify-between">
                          <span>
                            Modificado por: <strong className="text-slate-800">{ver.modifiedByName || ver.modifiedBy}</strong>
                          </span>
                          <span className="font-bold text-slate-900">
                            ${(Number(ver.snapshot.total) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                          </span>
                        </div>
                        {ver.notes && <p className="mt-1 text-[11px] text-slate-500 italic">Motivo: {ver.notes}</p>}
                        <div className="mt-1.5 text-[11px] text-slate-600 font-mono bg-white p-1.5 rounded border border-slate-200">
                          Partidas ({ver.snapshot.items?.length || 0}):{' '}
                          {ver.snapshot.items?.map((it: any) => `${it.quantity}x ${it.productCode || it.description || it.productName || it.productId}`).join(' · ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="text-center text-[10px] text-slate-400 border-t border-slate-200 pt-4">
                Documento oficial generado por CONSCORE ERP · Precios expresados en Moneda Nacional más IVA · Sujeto a términos y condiciones generales de suministro.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Observación 09: Modal de Selección de Productos con Referencia de Stock */}
      <QuoteProductSelectorModal
        isOpen={isProductSelectorOpen}
        onClose={() => setIsProductSelectorOpen(false)}
        onSelectProduct={handleSelectProductFromModal}
        products={products}
      />

      {/* AI Draft modal */}
      {aiDraftTarget && (
        <AIDraftModal
          isOpen={!!aiDraftTarget}
          target={aiDraftTarget}
          onClose={() => setAiDraftTarget(null)}
        />
      )}

      {/* OBSERVACIÓN 16: Modal de Bloqueo por Falta de Autorización Financiera */}
      {financialBlockNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="flex w-full max-w-lg flex-col rounded-xl border border-amber-500/50 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400">
                    Control de Finanzas Obligatorio
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Cotización {financialBlockNotice.quote.folio} (v{financialBlockNotice.quote.version || 1})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFinancialBlockNotice(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-300">
              <div className="rounded-lg bg-amber-950/40 border border-amber-700/50 p-3.5 text-amber-200">
                <p className="font-semibold text-sm mb-1 text-amber-300">
                  No es posible convertir a Pedido en Firme
                </p>
                <p>{financialBlockNotice.message}</p>
              </div>

              <div className="rounded-lg bg-slate-950/70 border border-slate-800 p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Cliente:</span>
                  <span className="font-bold text-white">{financialBlockNotice.quote.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total a Autorizar:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    ${(Number(financialBlockNotice.quote.total) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Condición de Pago:</span>
                  <span className="font-semibold text-slate-200">{financialBlockNotice.quote.paymentTerms || 'Contado'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Estatus Financiero Actual:</span>
                  <span className={`font-bold uppercase ${
                    financialBlockNotice.quote.financialApprovalStatus === 'RECHAZADA'
                      ? 'text-rose-400'
                      : 'text-amber-400'
                  }`}>
                    {financialBlockNotice.quote.financialApprovalStatus || 'PENDIENTE'}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 italic">
                Regla institucional: Ninguna cotización puede convertirse en pedido sin autorización expresa del departamento de Finanzas para garantizar solvencia crediticia y rentabilidad.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-800 bg-slate-950/60 px-6 py-3">
              <button
                type="button"
                onClick={() => setFinancialBlockNotice(null)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                Cerrar
              </button>

              {QuoteFinancialApprovalService.canUserAuthorize(currentUser, financialBlockNotice.quote).allowed ? (
                <button
                  type="button"
                  onClick={() => {
                    const q = financialBlockNotice.quote;
                    setFinancialBlockNotice(null);
                    setApprovalNotesModal(q);
                    setApprovalNotes('');
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-md"
                >
                  <FileCheck className="h-4 w-4" />
                  <span>Autorizar como Finanzas</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const q = financialBlockNotice.quote;
                    setFinancialBlockNotice(null);
                    setRequestNotesModal(q);
                    setRequestNotes('');
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-500 shadow-md"
                >
                  <Clock className="h-4 w-4" />
                  <span>Solicitar Autorización a Finanzas</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* OBSERVACIÓN 16: Modal para Autorizar Cotización Financieramente */}
      {approvalNotesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="flex w-full max-w-lg flex-col rounded-xl border border-emerald-500/50 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <FileCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400">
                    Dictamen Favorable de Finanzas
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Autorizar {approvalNotesModal.folio} (v{approvalNotesModal.version || 1})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setApprovalNotesModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-300">
              <div className="rounded-lg bg-slate-950/70 border border-slate-800 p-3.5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Cliente:</span>
                  <span className="font-bold text-white">{approvalNotesModal.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Avalado:</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    ${(Number(approvalNotesModal.total) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Condición de Pago:</span>
                  <span className="font-semibold text-slate-200">{approvalNotesModal.paymentTerms || 'Contado'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Margen Bruto:</span>
                  <span className="font-bold text-emerald-400">{(approvalNotesModal.grossMarginPct || 30).toFixed(1)}%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notas de Autorización de Finanzas (Opcional):
                </label>
                <textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Ej. Línea de crédito verificada en buró, autorizada con pago a 30 días según política de cartera."
                  rows={3}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div className="rounded-lg bg-emerald-950/30 border border-emerald-800/40 p-3 text-[11px] text-emerald-300">
                <p className="font-semibold mb-0.5">Control de Inmutabilidad:</p>
                <p>
                  Se capturará un snapshot inmutable de estas condiciones comerciales. Si el asesor modifica posteriormente precios, cantidades o plazos, la cotización regresará automáticamente a estado PENDIENTE.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-800 bg-slate-950/60 px-6 py-3">
              <button
                type="button"
                onClick={() => setApprovalNotesModal(null)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleApproveFinancial(approvalNotesModal, approvalNotes)}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-md"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Confirmar Autorización Financiera</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OBSERVACIÓN 16: Modal para Rechazar Cotización Financieramente */}
      {rejectingQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="flex w-full max-w-lg flex-col rounded-xl border border-rose-500/50 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <XCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-rose-400">
                    Dictamen de Rechazo Financiero
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Rechazar {rejectingQuote.folio} (v{rejectingQuote.version || 1})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRejectingQuote(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-300">
              <div className="rounded-lg bg-slate-950/70 border border-slate-800 p-3 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Cliente:</span>
                  <span className="font-bold text-white">{rejectingQuote.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total:</span>
                  <span className="font-mono font-bold text-slate-200">
                    ${(Number(rejectingQuote.total) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Condiciones Solicitadas:</span>
                  <span className="font-semibold text-slate-300">{rejectingQuote.paymentTerms || 'Contado'}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-rose-300 mb-1">
                  Motivo de Rechazo Financiero <span className="text-rose-400 font-bold">*</span>:
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explique el motivo: ej. El cliente presenta facturas vencidas a más de 60 días; margen inferior a política sin garantía; o se requiere pago anticipado al 100%."
                  rows={4}
                  required
                  className="w-full rounded-lg border border-rose-500/50 bg-slate-950 p-2.5 text-xs text-white placeholder-slate-500 focus:border-rose-400 focus:outline-none"
                />
              </div>

              <div className="rounded-lg bg-rose-950/30 border border-rose-800/40 p-3 text-[11px] text-rose-300">
                <p className="font-semibold mb-0.5">Efecto del Dictamen:</p>
                <p>
                  La cotización quedará con estatus de autorización <strong>RECHAZADA</strong> y no podrá convertirse en pedido. El asesor comercial recibirá este dictamen para emitir una nueva versión o negociar las condiciones con el cliente.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-800 bg-slate-950/60 px-6 py-3">
              <button
                type="button"
                onClick={() => setRejectingQuote(null)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleRejectFinancial(rejectingQuote, rejectionReason)}
                className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 shadow-md"
              >
                <XCircle className="h-4 w-4" />
                <span>Confirmar Dictamen de Rechazo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OBSERVACIÓN 16: Modal para Solicitar Autorización a Finanzas */}
      {requestNotesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="flex w-full max-w-lg flex-col rounded-xl border border-amber-500/50 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400">
                    Solicitar Autorización a Finanzas
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Cotización {requestNotesModal.folio} (v{requestNotesModal.version || 1})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRequestNotesModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-300">
              <div className="rounded-lg bg-slate-950/70 border border-slate-800 p-3 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Cliente:</span>
                  <span className="font-bold text-white">{requestNotesModal.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Monto Total:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    ${(Number(requestNotesModal.total) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Condición Solicitada:</span>
                  <span className="font-semibold text-slate-200">{requestNotesModal.paymentTerms || 'Contado'}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notas o Justificación Comercial para Finanzas (Opcional):
                </label>
                <textarea
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  placeholder="Ej. Cliente estratégico de cuenta clave; solicita crédito a 30 días garantizado con orden de compra."
                  rows={3}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <p className="text-[11px] text-slate-400 italic">
                La solicitud quedará registrada en el sistema y se notificará a los usuarios con rol Finanzas y Administrador para su dictamen.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-800 bg-slate-950/60 px-6 py-3">
              <button
                type="button"
                onClick={() => setRequestNotesModal(null)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleRequestFinancialApproval(requestNotesModal, requestNotes)}
                className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-500 shadow-md"
              >
                <Clock className="h-4 w-4" />
                <span>Enviar Solicitud a Finanzas</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
