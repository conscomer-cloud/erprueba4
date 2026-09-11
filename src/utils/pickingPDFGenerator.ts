import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Picking, PickingItem, Order } from '../types/erp';

export interface PickingPDFOptions {
  companyName?: string;
  watermark?: string;
  fileName?: string;
}

export interface OperationalPickingRow {
  sku: string;
  productName: string;
  unit: string;
  qtyRequested: number;
  qtyToPick: number; // PickingItem.pickedQty real
  location: string;
  existence: number;
  check: string;
  isSubLocation?: boolean;
}

/**
 * Sanitiza el nombre de archivo para el PDF de Picking
 * Formato requerido: Picking_PED-XXXX_PK-YYYY.pdf
 */
export function sanitizePickingFileName(orderFolio?: string, pickingId?: string): string {
  const cleanOrder = (orderFolio || 'PED-0000').replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanPick = (pickingId || 'PK-0000').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `Picking_${cleanOrder}_${cleanPick}.pdf`;
}

/**
 * Aplana las partidas de picking en líneas operativas de almacén.
 * Si un SKU cuenta con múltiples ubicaciones, genera una línea por cada ubicación física.
 */
export function buildOperationalRows(items: PickingItem[]): OperationalPickingRow[] {
  const rows: OperationalPickingRow[] = [];

  for (const item of items) {
    const sku = item.sku || item.productCode || 'SKU-DESC';
    const productName = item.productName || item.description || 'Material Industrial';
    const unit = item.unit || 'PZA';
    const requested = item.qtyRequested ?? item.orderQty ?? 0;
    const picked = item.pickedQty ?? item.qtyPicked ?? requested;

    // Si tiene desglose multi-ubicación
    if (item.locations && item.locations.length > 0) {
      item.locations.forEach((loc, locIdx) => {
        const locLabel = loc.locationCode || `${loc.nave || 'N1'} / ${loc.rack || 'R1'} / ${loc.pasillo || 'P1'}`;
        rows.push({
          sku: locIdx === 0 ? sku : `${sku} (cont.)`,
          productName: locIdx === 0 ? `${productName} [${unit}]` : `↳ ${productName} (Ubicación ${locIdx + 1})`,
          unit,
          qtyRequested: locIdx === 0 ? requested : 0,
          qtyToPick: loc.qtyToTake,
          location: locLabel,
          existence: loc.stockAvailable,
          check: '[   ]',
          isSubLocation: locIdx > 0,
        });
      });
    } else {
      // Línea única
      const locLabel = item.locationLabel || item.location || 'Rack General / Nivel 1';
      rows.push({
        sku,
        productName: `${productName} [${unit}]`,
        unit,
        qtyRequested: requested,
        qtyToPick: picked,
        location: locLabel,
        existence: item.qtyAvailable ?? (item as any).availableQty ?? (item as any).stock ?? 0,
        check: '[   ]',
        isSubLocation: false,
      });
    }
  }

  return rows;
}

/**
 * Genera el documento PDF estructurado de Hoja de Picking Operativo
 * Utiliza jspdf y jspdf-autotable de manera nativa y programática.
 * NO utiliza screenshots, html2canvas ni elementos del navegador.
 */
export async function generatePickingSheetPDF(
  picking: Picking,
  order?: Partial<Order> | null,
  options: PickingPDFOptions = {}
): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let currentY = margin;

  // 1. ENCABEZADO PRINCIPAL SIMPLIFICADO
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, currentY, pageWidth - margin * 2, 2, 'F');
  currentY += 6;

  // Título Institucional y Documento
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(options.companyName || 'CONSCORE INDUSTRIAL · OPERACIÓN DE ALMACÉN', margin, currentY);

  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('HOJA DE PICKING OPERATIVO', margin, currentY + 6);

  // Folio y Picking Box (Esquina Superior Derecha)
  const boxWidth = 65;
  const boxHeight = 16;
  const boxX = pageWidth - margin - boxWidth;
  const boxY = currentY - 2;

  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('PICKING ID:', boxX + 4, boxY + 5);
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(picking.pickingId || picking.id || 'PK-0000', boxX + 26, boxY + 5);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('PEDIDO:', boxX + 4, boxY + 11);
  doc.setFontSize(10);
  doc.setTextColor(29, 78, 216); // blue-700
  doc.text(picking.orderFolio || order?.folio || (order as any)?.order_number || 'PED-0000', boxX + 26, boxY + 11);

  currentY += 16;

  // Metadata Grid Operativo
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 16, 2, 2, 'FD');

  const colWidth = (pageWidth - margin * 2) / 4;
  const metaY = currentY + 5;

  // Almacén
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('ALMACÉN:', margin + 4, metaY);
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  const whName = picking.warehouseName || (order as any)?.warehouseName || 'Almacén Central Tultitlán';
  doc.text(whName.length > 28 ? whName.substring(0, 28) + '...' : whName, margin + 4, metaY + 5);

  // Fecha
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('FECHA DE EMISIÓN:', margin + colWidth + 4, metaY);
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  const issueDate = picking.createdAt ? new Date(picking.createdAt).toLocaleDateString('es-MX') : new Date().toLocaleDateString('es-MX');
  doc.text(issueDate, margin + colWidth + 4, metaY + 5);

  // Responsable de Surtido
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('RESPONSABLE SURTIDO:', margin + colWidth * 2 + 4, metaY);
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  const pickerName = picking.createdByName || 'Operador de Almacén';
  doc.text(pickerName.length > 22 ? pickerName.substring(0, 22) + '...' : pickerName, margin + colWidth * 2 + 4, metaY + 5);

  // Estado del Picking
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('ESTADO DEL PICKING:', margin + colWidth * 3 + 4, metaY);

  const isVerified = picking.status === 'VERIFICADO';
  const isCompleted = picking.status === 'COMPLETADO';
  const isFulfilled = (order as any)?.status === 'SURTIDO' || (order as any)?.fulfillmentStatus === 'SURTIDO';

  let statusText = 'EN PROCESO';
  if (isVerified) statusText = 'VERIFICADO';
  else if (isFulfilled) statusText = 'SURTIDO FÍSICO';
  else if (isCompleted) statusText = 'COMPLETADO';

  doc.setFontSize(9);
  if (isVerified) {
    doc.setTextColor(16, 185, 129); // emerald-600
  } else if (isFulfilled) {
    doc.setTextColor(37, 99, 235); // blue-600
  } else if (isCompleted) {
    doc.setTextColor(124, 58, 237); // purple-600
  } else {
    doc.setTextColor(217, 119, 6); // amber-600
  }
  doc.text(statusText, margin + colWidth * 3 + 4, metaY + 5);

  currentY += 20;

  // Fila secundaria: Cliente (nombre corto) y Master Transaction ID
  const custName = picking.customerName || order?.customerName || 'Cliente B2B';
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text(`Cliente: `, margin, currentY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(custName.length > 40 ? custName.substring(0, 40) + '...' : custName, margin + 14, currentY);

  if (picking.masterTransactionId) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    const mtxText = `MTX: ${picking.masterTransactionId}`;
    doc.text(mtxText, pageWidth - margin - doc.getTextWidth(mtxText), currentY);
  }

  currentY += 4;

  // 2. TABLA PRINCIPAL DE PARTIDAS OPERATIVAS
  const operationalRows = buildOperationalRows(picking.items || []);

  const tableBody = operationalRows.map((row) => [
    row.sku,
    row.productName,
    row.qtyRequested > 0 ? row.qtyRequested.toLocaleString('es-MX') : '—',
    row.qtyToPick.toLocaleString('es-MX'),
    row.location,
    row.existence.toLocaleString('es-MX'),
    row.check,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [[
      'SKU',
      'PRODUCTO',
      'SOLICITADA',
      'A SURTIR',
      'UBICACIÓN',
      'EXISTENCIA',
      'CHECK',
    ]],
    body: tableBody,
    theme: 'grid',
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 8.5,
      cellPadding: 2.8,
      textColor: [15, 23, 42],
      lineColor: [203, 213, 225],
      lineWidth: 0.15,
      font: 'helvetica',
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [51, 65, 85],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 26, fontStyle: 'bold', halign: 'left' }, // SKU
      1: { cellWidth: 'auto', halign: 'left' },                 // PRODUCTO
      2: { cellWidth: 22, halign: 'right' },                   // SOLICITADA
      3: { cellWidth: 22, halign: 'right', fontStyle: 'bold' },// A SURTIR
      4: { cellWidth: 36, halign: 'left' },                    // UBICACIÓN
      5: { cellWidth: 22, halign: 'right' },                   // EXISTENCIA
      6: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },// CHECK
    },
    didDrawPage: (data) => {
      // Footer en cada página
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Hoja de Picking Operativo · Folio: ${picking.orderFolio || 'PED'} · Documento oficial de almacén`,
        margin,
        pageHeight - 6
      );
      doc.text(
        `Página ${data.pageNumber}`,
        pageWidth - margin - 15,
        pageHeight - 6
      );
    },
  });

  // Posición después de la tabla
  let finalY = (doc as any).lastAutoTable?.finalY || currentY + 60;

  // Si queda poco espacio para la firma, agregar página
  if (finalY > pageHeight - 55) {
    doc.addPage();
    finalY = margin + 10;
  } else {
    finalY += 8;
  }

  // 3. SECCIÓN DE OBSERVACIONES
  const notesText = picking.notes || (order as any)?.notes || '';
  if (notesText) {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('OBSERVACIONES DE SURTIDO:', margin, finalY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    const splitNotes = doc.splitTextToSize(notesText, pageWidth - margin * 2);
    doc.text(splitNotes, margin, finalY + 4);
    finalY += 4 + splitNotes.length * 3.5 + 4;
  }

  // 4. SECCIÓN DE VERIFICACIÓN JEFE DE ALMACÉN
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.4);
  doc.line(margin, finalY, pageWidth - margin, finalY);
  finalY += 5;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('VERIFICACIÓN JEFE DE ALMACÉN', margin, finalY);

  if (isVerified) {
    doc.setFontSize(8.5);
    doc.setTextColor(16, 185, 129);
    doc.text('● CERTIFICADO Y VERIFICADO', margin + 70, finalY);
  } else {
    doc.setFontSize(8.5);
    doc.setTextColor(217, 119, 6);
    doc.text('○ PENDIENTE DE VERIFICACIÓN', margin + 70, finalY);
  }

  finalY += 6;

  // Cuadro de Verificación y Firma
  const certBoxWidth = pageWidth - margin * 2;
  const certBoxHeight = 32;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, finalY, certBoxWidth, certBoxHeight, 2, 2, 'FD');

  const halfWidth = certBoxWidth / 2;

  // Lado Izquierdo: Datos de Verificación
  const vName = picking.verifiedByName || 'Mtro. Fernando Garza';
  const vDate = picking.verifiedAt ? new Date(picking.verifiedAt).toLocaleDateString('es-MX') : '____/____/________';
  const vTime = picking.verifiedAt ? new Date(picking.verifiedAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '____:____';
  const vObs = picking.verificationObservations || picking.verificationNotes || 'Verificación física en rack completada conforme y certificada.';

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);

  doc.text('Nombre:', margin + 4, finalY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(isVerified ? vName : '____________________________________', margin + 20, finalY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Fecha:', margin + 4, finalY + 12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(vDate, margin + 20, finalY + 12);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Hora:', margin + 48, finalY + 12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(vTime, margin + 58, finalY + 12);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Observaciones:', margin + 4, finalY + 18);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  const obsLines = isVerified
    ? doc.splitTextToSize(vObs, halfWidth - 10)
    : ['__________________________________________________'];
  doc.text(obsLines, margin + 4, finalY + 23);

  // Lado Derecho: Firma
  const sigX = margin + halfWidth + 8;
  const sigY = finalY + 4;
  const sigWidth = halfWidth - 16;
  const sigHeight = 18;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Firma de Verificación:', sigX, finalY + 6);

  const rawSig = picking.verificationSignature || picking.managerSignature;

  if (isVerified && rawSig) {
    if (rawSig.startsWith('data:image')) {
      try {
        doc.addImage(rawSig, 'PNG', sigX + 4, sigY + 3, sigWidth - 8, sigHeight - 2);
      } catch {
        doc.setFont('courier', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(16, 185, 129);
        doc.text(`[FIRMA DIGITAL CERTIFICADA]\n${rawSig.substring(0, 32)}...`, sigX + 4, sigY + 10);
      }
    } else {
      // Sello digital con hash
      doc.setFillColor(236, 253, 245);
      doc.setDrawColor(110, 231, 183);
      doc.roundedRect(sigX + 2, sigY + 3, sigWidth - 4, sigHeight - 2, 1.5, 1.5, 'FD');
      doc.setFont('courier', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(6, 95, 70);
      doc.text(`✓ FIRMADO DIGITALMENTE`, sigX + 6, sigY + 8);
      doc.setFontSize(6.5);
      doc.setTextColor(4, 120, 87);
      doc.text(`ID: ${rawSig.substring(0, 24)}`, sigX + 6, sigY + 13);
    }
  } else {
    // Línea para firma manual
    doc.setDrawColor(100, 116, 139);
    doc.line(sigX + 4, finalY + 22, sigX + sigWidth, finalY + 22);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Firma manual del Jefe de Almacén', sigX + 10, finalY + 26);
  }

  return doc;
}
