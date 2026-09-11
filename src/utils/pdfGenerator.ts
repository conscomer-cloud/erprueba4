import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Quote, Customer, CompanyConfig, Order } from '../types/erp';
import { normalizePaymentTerms } from '../services/quotePaymentTermsService';

export interface PDFGeneratorOptions {
  companyConfig?: Partial<CompanyConfig> | null;
  logoBase64?: string;
  watermark?: string;
  fileName?: string;
}

/**
 * Formats a numeric currency value to MXN string format
 */
const formatMXN = (amount: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(amount || 0);
};

/**
 * Generates a professional PDF document for a commercial quote (Cotización)
 * utilizing jspdf-autotable with custom corporate logo, dynamic product tables,
 * payment conditions, commercial terms, and signature authorizations.
 */
export async function generateQuotePDF(
  quote: Quote,
  customer?: Customer | null,
  options: PDFGeneratorOptions = {}
): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  const companyName = options.companyConfig?.companyName || options.companyConfig?.businessName || 'CONSCORE INDUSTRIAL S.A. DE C.V.';
  const companyRfc = options.companyConfig?.rfc || 'CIN180425AB9';
  const companyAddress = options.companyConfig?.address || (options.companyConfig as any)?.fiscalAddress || 'Parque Industrial Querétaro, Av. de las Misiones #104, Qro.';
  const companyPhone = options.companyConfig?.phone || '(442) 800-2667';
  const companyEmail = options.companyConfig?.email || (options.companyConfig as any)?.supportEmail || 'ventas@conscore.com.mx';

  let currentY = margin;

  // 1. Header: Logo & Company Identification
  const logo = options.logoBase64 || (options.companyConfig as any)?.logoUrl;
  let logoDrawn = false;

  if (logo && logo.startsWith('data:image')) {
    try {
      doc.addImage(logo, 'PNG', margin, currentY, 40, 15);
      logoDrawn = true;
    } catch {
      logoDrawn = false;
    }
  }

  if (!logoDrawn) {
    // Elegant fallback corporate badge
    doc.setFillColor(30, 58, 138); // Deep Corporate Blue (#1e3a8a)
    doc.roundedRect(margin, currentY, 38, 14, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text('CONSCORE', margin + 4, currentY + 9);
  }

  // Company contact info block (top center/right)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.text(companyName, margin + 44, currentY + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text(`RFC: ${companyRfc}`, margin + 44, currentY + 8);
  doc.text(companyAddress, margin + 44, currentY + 12);
  doc.text(`Tel: ${companyPhone}  |  Email: ${companyEmail}`, margin + 44, currentY + 16);

  // Quote Folio & Status Badge (top right)
  const folioBoxWidth = 52;
  const folioBoxX = pageWidth - margin - folioBoxWidth;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(folioBoxX, currentY, folioBoxWidth, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 58, 138);
  doc.text('COTIZACIÓN', folioBoxX + folioBoxWidth / 2, currentY + 5.5, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(quote.folio || 'COT-SIN-FOLIO', folioBoxX + folioBoxWidth / 2, currentY + 10.5, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  const quoteDate = quote.date || (quote.createdAt ? quote.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10));
  doc.text(`Fecha: ${quoteDate}`, folioBoxX + folioBoxWidth / 2, currentY + 14.5, { align: 'center' });
  const quoteValidity = quote.validUntil || ((quote as any).validityDays ? `${(quote as any).validityDays} días` : '15 días');
  doc.text(`Vigencia: ${quoteValidity}`, folioBoxX + folioBoxWidth / 2, currentY + 18, { align: 'center' });

  currentY += 24;

  // 2. Customer and Executive Details Cards
  const colWidth = (pageWidth - margin * 2 - 4) / 2;

  // Left Card: Customer Details
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, colWidth, 24, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 58, 138);
  doc.text('DATOS DEL CLIENTE', margin + 3, currentY + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  const clientName = customer?.name || customer?.businessName || quote.customerName || 'Cliente General';
  doc.text(clientName.slice(0, 45), margin + 3, currentY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const clientRfc = customer?.rfc || customer?.taxId || (quote as any).customerRFC || 'XAXX010101000';
  const clientContact = customer?.contact_name || customer?.contactName || customer?.email || 'Atención a Compras';
  const clientPhone = customer?.phone || 'No especificado';
  doc.text(`RFC: ${clientRfc}  |  Contacto: ${clientContact}`, margin + 3, currentY + 13.5);
  doc.text(`Tel: ${clientPhone}  |  Ubicación: ${customer?.city || 'México'}`, margin + 3, currentY + 17.5);
  doc.text(`Condición Comercial: ${normalizePaymentTerms(quote.paymentTerms || (quote as any).payment_terms || customer?.paymentTerms)}`, margin + 3, currentY + 21.5);

  // Right Card: Commercial Executive & Currency Info
  const rightCardX = margin + colWidth + 4;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(rightCardX, currentY, colWidth, 24, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 58, 138);
  doc.text('CONDICIONES DE LA COTIZACIÓN', rightCardX + 3, currentY + 4.5);

  const executiveName = (quote as any).salesExecutiveName || quote.salespersonName || quote.sellerName || 'Ejecutivo Comercial';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Ejecutivo Comercial: ${executiveName}`, rightCardX + 3, currentY + 9);
  doc.text(`Moneda: ${(quote as any).currency || 'MXN'}  |  T.C.: $1.00`, rightCardX + 3, currentY + 13.5);
  doc.text(`Tiempo de Entrega: ${quote.deliveryTime || 'Inmediato salvo previa venta'}`, rightCardX + 3, currentY + 17.5);
  doc.text(`Lugar de Entrega: LAB Nuestras Bodegas / Obra Convenida`, rightCardX + 3, currentY + 21.5);

  currentY += 28;

  // 3. Dynamic Products Table using jspdf-autotable
  const tableRows = (quote.items || []).map((item, idx) => {
    const qty = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice || item.price || item.unit_price) || 0;
    const discountPct = Number(item.discountPct || item.discount || 0);
    const subtotal = Number(item.subtotal || qty * unitPrice * (1 - discountPct / 100));

    return [
      String(idx + 1),
      item.productCode || item.sku || 'SKU-GEN',
      item.productName || item.description || 'Producto Técnico',
      qty.toLocaleString('es-MX'),
      item.unit || 'PZA',
      formatMXN(unitPrice),
      discountPct > 0 ? `${discountPct}%` : '-',
      formatMXN(subtotal),
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Código / SKU', 'Descripción del Producto', 'Cant.', 'U.M.', 'P. Unitario', 'Desc.', 'Subtotal']],
    body: tableRows,
    theme: 'striped',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
      font: 'helvetica',
    },
    headStyles: {
      fillColor: [30, 58, 138], // Deep Corporate Blue
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 26, fontStyle: 'bold' },
      2: { halign: 'left' },
      3: { halign: 'right', cellWidth: 16, fontStyle: 'bold' },
      4: { halign: 'center', cellWidth: 14 },
      5: { halign: 'right', cellWidth: 24 },
      6: { halign: 'center', cellWidth: 15 },
      7: { halign: 'right', cellWidth: 28, fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin },
    didDrawPage: (data) => {
      // Header and footer on each page
      const totalPages = doc.getNumberOfPages();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Página ${data.pageNumber} de ${totalPages}  |  ${companyName}  |  Documento confidencial para uso exclusivo del cliente`,
        pageWidth / 2,
        pageHeight - 6,
        { align: 'center' }
      );
    },
  });

  // Calculate position after autotable
  const finalY = (doc as any).lastAutoTable.finalY + 6;

  // 4. Totals and Financial Summary Block
  const totalsBoxWidth = 65;
  const totalsBoxX = pageWidth - margin - totalsBoxWidth;

  const subtotalVal = Number(quote.subtotal) || (quote.items || []).reduce((acc, it) => acc + (Number(it.subtotal) || 0), 0);
  const discountVal = Number(quote.discount) || 0;
  const ivaVal = Number(quote.tax || (quote as any).taxAmount) || subtotalVal * 0.16;
  const grandTotal = Number(quote.total) || subtotalVal + ivaVal;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(totalsBoxX, finalY, totalsBoxWidth, 28, 1.5, 1.5, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  doc.text('Subtotal:', totalsBoxX + 3, finalY + 5.5);
  doc.text(formatMXN(subtotalVal), totalsBoxX + totalsBoxWidth - 3, finalY + 5.5, { align: 'right' });

  if (discountVal > 0) {
    doc.text('Descuento Comercial:', totalsBoxX + 3, finalY + 10.5);
    doc.text(`-${formatMXN(discountVal)}`, totalsBoxX + totalsBoxWidth - 3, finalY + 10.5, { align: 'right' });
  }

  doc.text('I.V.A. (16%):', totalsBoxX + 3, finalY + 15.5);
  doc.text(formatMXN(ivaVal), totalsBoxX + totalsBoxWidth - 3, finalY + 15.5, { align: 'right' });

  // Divider line
  doc.setDrawColor(203, 213, 225);
  doc.line(totalsBoxX + 2, finalY + 19, totalsBoxX + totalsBoxWidth - 2, finalY + 19);

  // Grand Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 58, 138);
  doc.text('TOTAL:', totalsBoxX + 3, finalY + 24.5);
  doc.text(formatMXN(grandTotal), totalsBoxX + totalsBoxWidth - 3, finalY + 24.5, { align: 'right' });

  // Notes & Payment instructions (left of totals)
  const notesWidth = totalsBoxX - margin - 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 58, 138);
  doc.text('TÉRMINOS, CONDICIONES & CUENTAS BANCARIAS', margin, finalY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  const termsText = [
    '• Precios expresados en Pesos Mexicanos (MXN) más IVA.',
    '• Los precios y existencias están sujetos a cambio sin previo aviso.',
    '• Para procesar el pedido se requiere orden de compra formal o confirmación escrita.',
    '• Depósitos y transferencias a nombre de CONSCORE INDUSTRIAL S.A. DE C.V.',
    '  Banco: BBVA  |  Cuenta: 0118239912  |  CLABE Interbancaria: 012680001182399124',
  ];

  let termY = finalY + 9;
  termsText.forEach((t) => {
    doc.text(t, margin, termY);
    termY += 4;
  });

  // 5. Signatures Block
  const sigY = Math.max(finalY + 34, pageHeight - 34);
  const sigWidth = 60;

  // Executive Signature
  doc.setDrawColor(148, 163, 184);
  doc.line(margin + 15, sigY + 12, margin + 15 + sigWidth, sigY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text(executiveName, margin + 15 + sigWidth / 2, sigY + 16, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Por CONSCORE INDUSTRIAL', margin + 15 + sigWidth / 2, sigY + 19, { align: 'center' });

  // Customer Acceptance Signature
  const custSigX = pageWidth - margin - 15 - sigWidth;
  doc.line(custSigX, sigY + 12, custSigX + sigWidth, sigY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Aceptación y Firma del Cliente', custSigX + sigWidth / 2, sigY + 16, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Nombre, Firma y Sello de Autorización', custSigX + sigWidth / 2, sigY + 19, { align: 'center' });

  return doc;
}

/**
 * Downloads the generated Quote PDF file to the browser
 */
export async function downloadQuotePDF(
  quote: Quote,
  customer?: Customer | null,
  options: PDFGeneratorOptions = {}
): Promise<void> {
  const doc = await generateQuotePDF(quote, customer, options);
  const fileName = options.fileName || `${quote.folio || 'Cotizacion'}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}

/**
 * Generates a professional PDF document for an Order / Remisión (Remisión de Embarque)
 * utilizing jspdf-autotable with corporate header, order info, delivery address,
 * dynamic product items table, subtotal/IVA/total, and transport/customer signature lines.
 */
export async function generateOrderPDF(
  order: Order,
  customer?: Customer | null,
  options: PDFGeneratorOptions = {}
): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  const companyName = options.companyConfig?.companyName || options.companyConfig?.businessName || 'CONSCORE INDUSTRIAL S.A. DE C.V.';
  const companyRfc = options.companyConfig?.rfc || 'CIN180425AB9';
  const companyAddress = options.companyConfig?.address || (options.companyConfig as any)?.fiscalAddress || 'Parque Industrial Querétaro, Av. de las Misiones #104, Qro.';
  const companyPhone = options.companyConfig?.phone || '(442) 800-2667';
  const companyEmail = options.companyConfig?.email || (options.companyConfig as any)?.supportEmail || 'ventas@conscore.com.mx';

  let currentY = margin;

  // 1. Header: Logo & Company Identification
  const logo = options.logoBase64 || (options.companyConfig as any)?.logoUrl;
  let logoDrawn = false;

  if (logo && logo.startsWith('data:image')) {
    try {
      doc.addImage(logo, 'PNG', margin, currentY, 40, 15);
      logoDrawn = true;
    } catch {
      logoDrawn = false;
    }
  }

  if (!logoDrawn) {
    // Corporate badge
    doc.setFillColor(30, 58, 138); // Deep Corporate Blue (#1e3a8a)
    doc.roundedRect(margin, currentY, 38, 14, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text('CONSCORE', margin + 4, currentY + 9);
  }

  // Company contact info block (top center/right)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.text(companyName, margin + 44, currentY + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text(`RFC: ${companyRfc}`, margin + 44, currentY + 8);
  doc.text(companyAddress, margin + 44, currentY + 12);
  doc.text(`Tel: ${companyPhone}  |  Email: ${companyEmail}`, margin + 44, currentY + 16);

  // Order Remission Folio & Status Badge (top right)
  const folioBoxWidth = 56;
  const folioBoxX = pageWidth - margin - folioBoxWidth;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(folioBoxX, currentY, folioBoxWidth, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 58, 138);
  doc.text('REMISIÓN DE PEDIDO', folioBoxX + folioBoxWidth / 2, currentY + 5.5, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(order.folio || (order as any).orderNumber || 'PED-SIN-FOLIO', folioBoxX + folioBoxWidth / 2, currentY + 10.5, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  const orderDate = order.date || (order as any).orderDate || (order.createdAt ? order.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10));
  doc.text(`Fecha: ${orderDate}`, folioBoxX + folioBoxWidth / 2, currentY + 14.5, { align: 'center' });
  const quoteRef = order.quoteFolio || 'Venta Directa';
  doc.text(`Cotización: ${quoteRef}`, folioBoxX + folioBoxWidth / 2, currentY + 18, { align: 'center' });

  currentY += 26;

  // 2. Customer and Logistics Information Cards
  const colWidth = (pageWidth - margin * 2 - 4) / 2;

  // Left Card: Customer Details
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, colWidth, 26, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 58, 138);
  doc.text('DATOS DEL CLIENTE / RECEPTOR', margin + 3, currentY + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  const clientName = customer?.name || customer?.company_name || customer?.businessName || order.customerName || 'Cliente General';
  doc.text(clientName.slice(0, 48), margin + 3, currentY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const shippingAddr = order.shippingAddress || (order as any).deliveryAddress || customer?.address || 'Domicilio Fiscal / Obra Convenida';
  doc.text(`Destino: ${shippingAddr.slice(0, 50)}`, margin + 3, currentY + 13.5);
  const promiseDate = order.deliveryDate || (order as any).promisedDate || '3 días hábiles';
  doc.text(`Promesa de Entrega: ${promiseDate}`, margin + 3, currentY + 17.5);
  const clientContact = customer?.contact_name || customer?.contactName || customer?.phone || 'Atención a Almacén / Compras';
  doc.text(`Contacto: ${clientContact}`, margin + 3, currentY + 21.5);

  // Right Card: Logistics & Dispatch Details
  const rightCardX = margin + colWidth + 4;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(rightCardX, currentY, colWidth, 26, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 58, 138);
  doc.text('CONTROL LOGÍSTICO Y SUMINISTRO', rightCardX + 3, currentY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const warehouseName = order.warehouseId || (order as any).warehouseName || 'ALM-01 (Planta Querétaro)';
  doc.text(`Almacén Despachador: ${warehouseName}`, rightCardX + 3, currentY + 9);
  doc.text(`Estatus de Surtido: ${order.status || 'PENDIENTE'}`, rightCardX + 3, currentY + 13.5);
  const seller = (order as any).sellerName || (order as any).salesExecutiveId || 'Ventas CONSCORE';
  doc.text(`Asesor Comercial: ${seller}`, rightCardX + 3, currentY + 17.5);
  doc.text(`Condición: Mercancía Asegurada / Sujeta a Inspección`, rightCardX + 3, currentY + 21.5);

  currentY += 30;

  // 3. Dynamic Products Table using jspdf-autotable
  const tableRows = (order.items || []).map((item, idx) => {
    const qty = Number(item.quantity ?? (item as any).quantityOrdered ?? (item as any).quantityFulfilled ?? 1);
    const unitPrice = Number(item.unitPrice || (item as any).price || 0);
    const subtotal = Number(item.subtotal || qty * unitPrice);

    return [
      String(idx + 1),
      item.productCode || (item as any).sku || 'SKU',
      item.description || (item as any).productName || 'Material Industrial',
      qty.toLocaleString('es-MX'),
      (item as any).unit || 'PZA',
      formatMXN(unitPrice),
      formatMXN(subtotal),
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Código / SKU', 'Descripción del Material', 'Cant.', 'U.M.', 'P. Unitario', 'Importe']],
    body: tableRows,
    theme: 'striped',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
      font: 'helvetica',
    },
    headStyles: {
      fillColor: [30, 58, 138], // Deep Corporate Blue
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 28, fontStyle: 'bold' },
      2: { halign: 'left' },
      3: { halign: 'right', cellWidth: 18, fontStyle: 'bold' },
      4: { halign: 'center', cellWidth: 14 },
      5: { halign: 'right', cellWidth: 26 },
      6: { halign: 'right', cellWidth: 30, fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin },
    didDrawPage: () => {
      const totalPages = doc.getNumberOfPages();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Remisión ${order.folio} · Página ${doc.getCurrentPageInfo().pageNumber} de ${totalPages}`,
        pageWidth / 2,
        pageHeight - 6,
        { align: 'center' }
      );
    },
  });

  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : currentY + 40;

  // 4. Totals Card
  const totalSubtotal = Number(order.subtotal || order.total / 1.16) || 0;
  const totalTax = Number(order.tax || order.total - (order.total / 1.16)) || 0;
  const totalFinal = Number(order.total) || 0;

  const totalsWidth = 65;
  const totalsX = pageWidth - margin - totalsWidth;
  const totalsY = finalY + 4;

  if (totalsY + 45 > pageHeight - 25) {
    doc.addPage();
  }

  const effectiveTotalsY = totalsY + 45 > pageHeight - 25 ? margin + 5 : totalsY;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(totalsX, effectiveTotalsY, totalsWidth, 22, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Subtotal:', totalsX + 3, effectiveTotalsY + 5);
  doc.text('IVA (16%):', totalsX + 3, effectiveTotalsY + 10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Total Facturado:', totalsX + 3, effectiveTotalsY + 16.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text(formatMXN(totalSubtotal), totalsX + totalsWidth - 3, effectiveTotalsY + 5, { align: 'right' });
  doc.text(formatMXN(totalTax), totalsX + totalsWidth - 3, effectiveTotalsY + 10, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 58, 138);
  doc.text(formatMXN(totalFinal), totalsX + totalsWidth - 3, effectiveTotalsY + 16.5, { align: 'right' });

  // 5. Signature Lines for Delivery
  const sigY = effectiveTotalsY + 30;
  const totalSigWidth = pageWidth - margin * 2;
  const singleSigWidth = (totalSigWidth - 20) / 3;

  doc.setDrawColor(148, 163, 184);

  // Sig 1: Warehouse / Embarques
  doc.line(margin, sigY + 12, margin + singleSigWidth, sigY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Almacén y Embarques', margin + singleSigWidth / 2, sigY + 16, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Entrega de Mercancía', margin + singleSigWidth / 2, sigY + 19, { align: 'center' });

  // Sig 2: Transport Operator
  const sig2X = margin + singleSigWidth + 10;
  doc.line(sig2X, sigY + 12, sig2X + singleSigWidth, sigY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Operador / Transporte', sig2X + singleSigWidth / 2, sigY + 16, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Firma y Placas', sig2X + singleSigWidth / 2, sigY + 19, { align: 'center' });

  // Sig 3: Customer Reception
  const sig3X = sig2X + singleSigWidth + 10;
  doc.line(sig3X, sigY + 12, sig3X + singleSigWidth, sigY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Recibe Cliente', sig3X + singleSigWidth / 2, sigY + 16, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Nombre, Firma y Sello', sig3X + singleSigWidth / 2, sigY + 19, { align: 'center' });

  return doc;
}

/**
 * Downloads the generated Order / Remisión PDF file to the browser
 */
export async function downloadOrderPDF(
  order: Order,
  customer?: Customer | null,
  options: PDFGeneratorOptions = {}
): Promise<void> {
  const doc = await generateOrderPDF(order, customer, options);
  const fileName = options.fileName || `Remision_${order.folio || 'Pedido'}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}

