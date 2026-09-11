import { jsPDF } from 'jspdf';
import { Quote, QuoteItem, Customer } from '../types/erp';
import { normalizePaymentTerms, DEFAULT_PAYMENT_TERMS } from './quotePaymentTermsService';

/**
 * Sanitiza un string para que sea un nombre de archivo válido y seguro.
 */
export function sanitizeFileName(name: string): string {
  if (!name) return '';
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar tildes y diacríticos
    .replace(/[^a-zA-Z0-9_\-\.]/g, '_') // Reemplazar caracteres especiales por guión bajo
    .replace(/_+/g, '_') // Colapsar guiones bajos repetidos
    .replace(/^_+|_+$/g, ''); // Recortar extremos
}

/**
 * Genera el nombre entendible de archivo para la cotización:
 * Ejemplo: Cotizacion_COT-000008_Thermal-Proyectos.pdf
 */
export function getQuotePDFFileName(quote: Quote): string {
  const folio = sanitizeFileName(quote.folio || quote.quote_number || quote.quoteNumber || 'COT-000000');
  let rawCustomer = quote.customerName || quote.customer_name || 'Cliente';
  // Eliminar sufijos societarios comunes para generar nombres limpios acordes al estándar:
  // Ejemplo: "Thermal-Proyectos S.A. de C.V." -> "Thermal-Proyectos"
  rawCustomer = rawCustomer
    .replace(/\b(s\.?a\.?(\s+de\s+c\.?v\.?)?|s\.?\s*de\s*r\.?l\.?(\s+de\s+c\.?v\.?)?|s\.?a\.?p\.?i\.?(\s+de\s+c\.?v\.?)?|s\.?c\.?|de\s+c\.?v\.?)\.?/gi, '')
    .replace(/[\.\s_-]+$/, '')
    .trim();
  const customer = sanitizeFileName(rawCustomer).substring(0, 30);
  return `Cotizacion_${folio}_${customer || 'Comercial'}.pdf`;
}

/**
 * Formatea valores numéricos en formato de moneda mexicana (MXN).
 */
function formatCurrency(val: number | undefined): string {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Genera un documento PDF comercial formal para la cotización seleccionada.
 * ESTRICTA CONFIDENCIALIDAD COMERCIAL:
 * No incluye precios de costo, costos promedios, márgenes brutos, utilidades ni comisiones.
 */
export function generateQuotePDF(quote: Quote, customer?: Customer): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter', // 215.9mm x 279.4mm
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 14;
  const marginRight = 14;
  const contentWidth = pageWidth - marginLeft - marginRight;

  let currentY = 14;

  // ==========================================
  // 1. ENCABEZADO CORPORATIVO CONSCORE
  // ==========================================
  // Logo Box / Brand Banner
  doc.setFillColor(15, 23, 42); // #0F172A Slate 900
  doc.rect(marginLeft, currentY, 56, 20, 'F');

  // Accent line
  doc.setFillColor(217, 119, 6); // #D97706 Amber 600
  doc.rect(marginLeft, currentY + 18.5, 56, 1.5, 'F');

  // Logo Brand Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('CONSCORE', marginLeft + 5, currentY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(251, 191, 36); // Amber 400
  doc.text('ERP · AISLAMIENTOS INDUSTRIALES', marginLeft + 5, currentY + 14);

  // Corporate Info (Under logo)
  doc.setTextColor(71, 85, 105); // Slate 600
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  const compLines = [
    'CONSCORE S.A. DE C.V. · RFC: CON190408K89',
    'Av. Industrial 450, Parque Industrial Querétaro, C.P. 76220',
    'Tel: (442) 290-8800 · contacto@conscore.com.mx · www.conscore.com.mx',
  ];
  let compY = currentY + 24;
  compLines.forEach((line) => {
    doc.text(line, marginLeft, compY);
    compY += 3.8;
  });

  // Right Header: Quotation Folio & Dates
  const rightX = pageWidth - marginRight;
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('COTIZACIÓN COMERCIAL FORMAL', rightX, currentY + 4, { align: 'right' });

  const folio = quote.folio || quote.quote_number || quote.quoteNumber || 'COT-000000';
  const versionStr = quote.version ? ` · v${quote.version}` : '';
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(`${folio}${versionStr}`, rightX, currentY + 11, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const emissionDate = quote.date || quote.quote_date || quote.quoteDate || new Date().toISOString().split('T')[0];
  const validUntil = quote.validUntil || quote.expiration_date || quote.expirationDate || '30 días naturales';

  doc.text(`Fecha de Emisión: `, rightX - 32, currentY + 18, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${emissionDate}`, rightX, currentY + 18, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Válida Hasta: `, rightX - 32, currentY + 23, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${validUntil}`, rightX, currentY + 23, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Estatus Comercial: `, rightX - 32, currentY + 28, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  const statusStr = String(quote.status || '');
  const isApproved = statusStr === 'ACEPTADA' || statusStr === 'APROBADA';
  const statusColor = isApproved ? [16, 185, 129] : [37, 99, 235];
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.text(`${quote.status || 'VIGENTE'}`, rightX, currentY + 28, { align: 'right' });

  currentY = Math.max(compY, currentY + 32) + 4;

  // Horizontal divider
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setLineWidth(0.4);
  doc.line(marginLeft, currentY, rightX, currentY);
  currentY += 4;

  // ==========================================
  // 2. DATOS DEL CLIENTE Y CONDICIONES COMERCIALES
  // ==========================================
  const colWidth = (contentWidth - 6) / 2;
  const col1X = marginLeft;
  const col2X = marginLeft + colWidth + 6;
  const boxHeight = 34;

  // Box 1: Cliente
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(col1X, currentY, colWidth, boxHeight, 1.5, 1.5, 'FD');

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('DATOS DEL CLIENTE / RECEPTOR', col1X + 4, currentY + 5.5);

  const customerName = quote.customerName || quote.customer_name || customer?.company_name || customer?.name || 'Cliente';
  const customerRFC = quote.customerRFC || quote.customer_rfc || customer?.rfc || customer?.tax_id || 'XAXX010101000';
  const contactName = customer?.contact_name || customer?.contactName || 'Atención a Compras';
  const phone = customer?.phone || 'No especificado';
  const email = customer?.email || 'No especificado';

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const truncatedCustomer = customerName.length > 42 ? customerName.substring(0, 40) + '...' : customerName;
  doc.text(truncatedCustomer, col1X + 4, currentY + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`RFC: ${customerRFC}`, col1X + 4, currentY + 16);
  doc.text(`Contacto: ${contactName}`, col1X + 4, currentY + 20.5);
  doc.text(`Teléfono: ${phone}`, col1X + 4, currentY + 25);
  doc.text(`Correo: ${email}`, col1X + 4, currentY + 29.5);

  // Box 2: Condiciones Comerciales
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(col2X, currentY, colWidth, boxHeight, 1.5, 1.5, 'FD');

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('CONDICIONES COMERCIALES', col2X + 4, currentY + 5.5);

  const salesperson = quote.salespersonName || quote.salesperson_name || quote.sellerName || 'Ejecutivo Comercial CONSCORE';
  const paymentTerms = normalizePaymentTerms(quote.paymentTerms || (quote as any).payment_terms);
  const deliveryTime = quote.deliveryTime || (quote.deliveryTimeDays ? `${quote.deliveryTimeDays} días hábiles` : '3 a 5 días hábiles');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);

  doc.text('Asesor Comercial:', col2X + 4, currentY + 11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(salesperson, col2X + 32, currentY + 11);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Plazo / Forma de Pago:', col2X + 4, currentY + 16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(paymentTerms, col2X + 37, currentY + 16);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Tiempo de Entrega:', col2X + 4, currentY + 20.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(deliveryTime, col2X + 33, currentY + 20.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Lugar de Entrega:', col2X + 4, currentY + 25);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('LAB Planta / Destino acordado', col2X + 31, currentY + 25);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Moneda:', col2X + 4, currentY + 29.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('MXN (Pesos Mexicanos)', col2X + 18, currentY + 29.5);

  currentY += boxHeight + 5;

  // ==========================================
  // 3. TABLA DE PARTIDAS TÉCNICAS
  // ==========================================
  // Column definitions:
  // Part (8mm), Código (24mm), Descripción (72mm), U.M. (12mm), Cant. (14mm), P. Unit. (26mm), Desc. (10mm), Importe (22mm)
  const cols = [
    { label: '#', width: 7, align: 'center' as const },
    { label: 'CÓDIGO', width: 23, align: 'left' as const },
    { label: 'DESCRIPCIÓN TÉCNICA', width: 75, align: 'left' as const },
    { label: 'U.M.', width: 12, align: 'center' as const },
    { label: 'CANT.', width: 15, align: 'right' as const },
    { label: 'P. UNITARIO', width: 23, align: 'right' as const },
    { label: 'DESC.', width: 11, align: 'center' as const },
    { label: 'IMPORTE', width: 22, align: 'right' as const },
  ];

  // Table Header
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(marginLeft, currentY, contentWidth, 7, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);

  let curX = marginLeft;
  cols.forEach((col) => {
    let textX = curX + 1.5;
    if (col.align === 'center') textX = curX + col.width / 2;
    if (col.align === 'right') textX = curX + col.width - 1.5;
    doc.text(col.label, textX, currentY + 4.8, { align: col.align });
    curX += col.width;
  });

  currentY += 7;

  // Table Body Rows
  const items: QuoteItem[] = quote.items || [];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  items.forEach((item, index) => {
    // Check if new page is needed
    if (currentY > pageHeight - 55) {
      doc.addPage('letter', 'portrait');
      currentY = 16;
      // Re-print header
      doc.setFillColor(15, 23, 42);
      doc.rect(marginLeft, currentY, contentWidth, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      let rX = marginLeft;
      cols.forEach((col) => {
        let tX = rX + 1.5;
        if (col.align === 'center') tX = rX + col.width / 2;
        if (col.align === 'right') tX = rX + col.width - 1.5;
        doc.text(col.label, tX, currentY + 4.8, { align: col.align });
        rX += col.width;
      });
      currentY += 7;
    }

    const isEven = index % 2 === 0;
    const descText = item.description || item.productName || item.product_name || 'Partida técnica';
    const splitDesc = doc.splitTextToSize(descText, cols[2].width - 3);
    const rowHeight = Math.max(6.5, splitDesc.length * 3.6 + 2.5);

    // Row background
    if (!isEven) {
      doc.setFillColor(248, 250, 252);
      doc.rect(marginLeft, currentY, contentWidth, rowHeight, 'F');
    }

    // Row border bottom
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.2);
    doc.line(marginLeft, currentY + rowHeight, rightX, currentY + rowHeight);

    const code = item.productCode || item.product_code || item.sku || 'N/A';
    const um = item.um || item.unit || 'PZA';
    const qty = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice ?? item.unit_price ?? item.price ?? 0);
    const discountPct = Number(item.discountPct ?? item.discount ?? 0);
    const subtotal = Number(item.subtotal) || (qty * unitPrice * (1 - discountPct / 100));

    let rowX = marginLeft;
    doc.setTextColor(15, 23, 42);

    // 0: Index
    doc.setFont('helvetica', 'normal');
    doc.text(String(index + 1), rowX + cols[0].width / 2, currentY + 4.2, { align: 'center' });
    rowX += cols[0].width;

    // 1: Code
    doc.setFont('helvetica', 'bold');
    doc.text(code, rowX + 1.5, currentY + 4.2);
    rowX += cols[1].width;

    // 2: Description
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(splitDesc, rowX + 1.5, currentY + 4.2);
    rowX += cols[2].width;

    // 3: U.M.
    doc.setTextColor(71, 85, 105);
    doc.text(um, rowX + cols[3].width / 2, currentY + 4.2, { align: 'center' });
    rowX += cols[3].width;

    // 4: Quantity
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(qty.toLocaleString('es-MX'), rowX + cols[4].width - 1.5, currentY + 4.2, { align: 'right' });
    rowX += cols[4].width;

    // 5: Unit Price
    doc.setFont('helvetica', 'normal');
    doc.text(formatCurrency(unitPrice), rowX + cols[5].width - 1.5, currentY + 4.2, { align: 'right' });
    rowX += cols[5].width;

    // 6: Discount
    doc.text(discountPct > 0 ? `${discountPct}%` : '—', rowX + cols[6].width / 2, currentY + 4.2, { align: 'center' });
    rowX += cols[6].width;

    // 7: Subtotal
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(subtotal), rowX + cols[7].width - 1.5, currentY + 4.2, { align: 'right' });

    currentY += rowHeight;
  });

  // Table bottom border
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(marginLeft, currentY, rightX, currentY);
  currentY += 4;

  // ==========================================
  // 4. TOTALES Y RESUMEN FINANCIERO (DERECHA)
  // ==========================================
  if (currentY > pageHeight - 48) {
    doc.addPage('letter', 'portrait');
    currentY = 16;
  }

  const totalsBoxWidth = 72;
  const totalsBoxX = rightX - totalsBoxWidth;

  const subtotalVal = Number(quote.subtotal) || 0;
  const discountVal = Number(quote.discount) || 0;
  const taxVal = Number(quote.tax) || 0;
  const totalVal = Number(quote.total) || 0;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(totalsBoxX, currentY, totalsBoxWidth, discountVal > 0 ? 27 : 22, 1.5, 1.5, 'FD');

  let totY = currentY + 5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  // Subtotal
  doc.text('Subtotal:', totalsBoxX + 4, totY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatCurrency(subtotalVal), rightX - 4, totY, { align: 'right' });
  totY += 4.5;

  // Discount (if any)
  if (discountVal > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Descuento Comercial:', totalsBoxX + 4, totY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    doc.text(`-${formatCurrency(discountVal)}`, rightX - 4, totY, { align: 'right' });
    totY += 4.5;
  }

  // IVA
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('I.V.A. (16%):', totalsBoxX + 4, totY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatCurrency(taxVal), rightX - 4, totY, { align: 'right' });
  totY += 5.5;

  // Total Bar
  doc.setFillColor(15, 23, 42);
  doc.rect(totalsBoxX, totY - 3.5, totalsBoxWidth, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL COTIZADO:', totalsBoxX + 4, totY + 1.2);
  doc.text(`${formatCurrency(totalVal)} MXN`, rightX - 4, totY + 1.2, { align: 'right' });

  // Notes on left side of totals
  if (quote.notes) {
    const notesBoxWidth = contentWidth - totalsBoxWidth - 6;
    doc.setFillColor(254, 252, 232); // Amber 50
    doc.setDrawColor(254, 240, 138); // Amber 200
    doc.roundedRect(marginLeft, currentY, notesBoxWidth, discountVal > 0 ? 27 : 22, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(180, 83, 9); // Amber 700
    doc.text('OBSERVACIONES / ESPECIFICACIONES:', marginLeft + 3, currentY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(51, 65, 85);
    const splitNotes = doc.splitTextToSize(quote.notes, notesBoxWidth - 6);
    doc.text(splitNotes.slice(0, 4), marginLeft + 3, currentY + 9.5);
  }

  currentY += (discountVal > 0 ? 30 : 25);

  // ==========================================
  // 5. TÉRMINOS COMERCIALES Y ACEPTACIÓN
  // ==========================================
  if (currentY > pageHeight - 38) {
    doc.addPage('letter', 'portrait');
    currentY = 16;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('TÉRMINOS Y CONDICIONES GENERALES DE SUMINISTRO', marginLeft, currentY);
  currentY += 3.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  const terms = [
    '1. Precios cotizados en Moneda Nacional (MXN) más 16% de I.V.A., sujetos a la vigencia estipulada.',
    '2. La presente cotización no representa reserva de inventario hasta la confirmación de la Orden de Compra.',
    '3. Tiempos de entrega calculados a partir de la confirmación formal del pedido y recepción de anticipo si aplica.',
    '4. Todo flete o maniobra especial no contemplada explícitamente se cotizará por separado.',
  ];
  terms.forEach((t) => {
    doc.text(t, marginLeft, currentY);
    currentY += 3.2;
  });

  // ==========================================
  // 6. PIE DE PÁGINA (PAGINACIÓN Y AVISO LEGAL)
  // ==========================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(marginLeft, pageHeight - 11, rightX, pageHeight - 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text(
      'Documento comercial oficial generado por CONSCORE ERP · Sujeto a términos de contratación · Documento para cliente.',
      marginLeft,
      pageHeight - 7
    );
    doc.text(`Página ${i} de ${totalPages}`, rightX, pageHeight - 7, { align: 'right' });
  }

  return doc;
}

/**
 * Exporta y descarga directamente la cotización en formato PDF.
 * Compatible con sandbox de iframes y navegadores de escritorio/móvil.
 */
export function exportQuoteToPDF(quote: Quote, customer?: Customer): { success: boolean; fileName: string; error?: string } {
  try {
    const doc = generateQuotePDF(quote, customer);
    const fileName = getQuotePDFFileName(quote);
    doc.save(fileName);
    return { success: true, fileName };
  } catch (err) {
    console.error('Error al exportar cotización a PDF:', err);
    return {
      success: false,
      fileName: '',
      error: err instanceof Error ? err.message : 'Error desconocido al generar PDF',
    };
  }
}
