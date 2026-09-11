/**
 * Rotación de inventario y exportación del módulo de Inventario & Catálogo Técnico.
 *
 * El PDF se arma con jsPDF y autoTable, es decir, como documento propio: texto
 * seleccionable, tabla paginada y gráfico dibujado con primitivas vectoriales.
 * No se usa html2canvas ni captura de pantalla, conforme a la observación 22
 * de la bitácora.
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Product, InventoryMovement, Warehouse } from '../types/erp';
import { exportToCSV } from '../utils/exportUtils';

export interface RotationRow {
  code: string;
  name: string;
  category: string;
  warehouseName: string;
  currentStock: number;
  exits: number;
  entries: number;
  /** Salidas del periodo divididas entre el stock disponible. */
  turnover: number;
  /** Días estimados de cobertura al ritmo de salida observado. */
  coverageDays: number;
  classification: 'ALTA' | 'MEDIA' | 'BAJA' | 'SIN MOVIMIENTO';
}

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Calcula la rotación por producto a partir del kardex.
 *
 * `periodDays` acota la ventana de análisis: sin acotar, un material que salió
 * mucho hace un año se vería igual de activo que uno que sale esta semana.
 */
export function calculateRotation(
  products: Product[],
  movements: InventoryMovement[],
  warehouses: Warehouse[],
  periodDays = 90
): RotationRow[] {
  const desde = new Date();
  desde.setDate(desde.getDate() - periodDays);
  const desdeISO = desde.toISOString();

  const almacenPorId = new Map(warehouses.map((w) => [String(w.id), w.name || String(w.id)]));

  const acumulado = new Map<string, { exits: number; entries: number }>();
  movements.forEach((m) => {
    if ((m.timestamp || '') < desdeISO) return;
    const key = String(m.productCode || m.productId || '');
    if (!key) return;
    const registro = acumulado.get(key) || { exits: 0, entries: 0 };
    const qty = Math.abs(num(m.quantity));
    const tipo = String(m.type || '').toUpperCase();
    if (tipo === 'SALIDA' || tipo === 'MERMA' || tipo === 'TRASPASO_SALIDA') {
      registro.exits += qty;
    } else if (tipo === 'ENTRADA' || tipo === 'TRASPASO_ENTRADA' || tipo === 'DEVOLUCION') {
      registro.entries += qty;
    }
    acumulado.set(key, registro);
  });

  return products
    .map((p) => {
      const key = String(p.code || p.id);
      const registro = acumulado.get(key) || { exits: 0, entries: 0 };
      const stock = num(p.availableStock ?? (p as any).stock);

      // Se divide entre el stock disponible. Cuando está en cero no hay
      // denominador válido, así que la rotación se reporta como cero en lugar
      // de infinito.
      const turnover = stock > 0 ? registro.exits / stock : 0;

      const salidaDiaria = registro.exits / periodDays;
      const coverageDays = salidaDiaria > 0 ? stock / salidaDiaria : 0;

      let classification: RotationRow['classification'] = 'SIN MOVIMIENTO';
      if (registro.exits > 0) {
        if (turnover >= 1) classification = 'ALTA';
        else if (turnover >= 0.3) classification = 'MEDIA';
        else classification = 'BAJA';
      }

      return {
        code: key,
        name: p.name || key,
        category: p.category || 'SIN CATEGORÍA',
        warehouseName: almacenPorId.get(String((p as any).warehouseId)) || 'Sin almacén',
        currentStock: stock,
        exits: registro.exits,
        entries: registro.entries,
        turnover: Number(turnover.toFixed(2)),
        coverageDays: Math.round(coverageDays),
        classification,
      };
    })
    .sort((a, b) => b.turnover - a.turnover);
}

interface ExportContext {
  products: Product[];
  rotation: RotationRow[];
  warehouses: Warehouse[];
  periodDays: number;
  userName: string;
  userRole: string;
  filterSummary: string;
}

const fechaArchivo = (): string => new Date().toISOString().slice(0, 10);

/**
 * Registra la exportación en la bitácora del servidor.
 *
 * No se usa el `logAudit` del contexto ERP porque ese método no existe: el
 * componente lo desestructura, queda undefined y las llamadas se pierden tras
 * un `if (logAudit)`. Aquí se llama al endpoint directamente, como ya hace
 * inventoryBackupService.
 */
async function registrarAuditoria(formato: 'CSV' | 'PDF', ctx: ExportContext): Promise<void> {
  try {
    await fetch('/api/audit-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('conscore_auth_token') || ''}`,
      },
      body: JSON.stringify({
        action: `INVENTARIO_EXPORTADO_${formato}`,
        module: 'INVENTARIO',
        entity_type: 'INVENTORY',
        entity_id: 'ALL',
        new_value: JSON.stringify({
          materiales: ctx.products.length,
          periodoDias: ctx.periodDays,
          filtros: ctx.filterSummary,
          usuario: ctx.userName,
          rol: ctx.userRole,
        }),
      }),
    });
  } catch (err) {
    // La bitácora no debe impedir que el usuario se lleve su archivo.
    console.warn('[inventoryExportService] No se pudo registrar la auditoría:', err);
  }
}

/** Exporta la tabla de inventario y la rotación a CSV. */
export function exportInventoryCSV(ctx: ExportContext): boolean {
  const filas = ctx.products.map((p) => {
    const rot = ctx.rotation.find((r) => r.code === String(p.code || p.id));
    return {
      Codigo: p.code || p.id,
      SKU: (p as any).sku || '',
      Descripcion: p.name || '',
      Categoria: p.category || '',
      Almacen: rot?.warehouseName || '',
      Ubicacion: typeof (p as any).warehouseLocation === 'string' ? (p as any).warehouseLocation : '',
      Unidad: (p as any).unit || '',
      Stock_Disponible: num(p.availableStock ?? (p as any).stock),
      Stock_Minimo: num((p as any).minStock),
      Entradas_Periodo: rot?.entries ?? 0,
      Salidas_Periodo: rot?.exits ?? 0,
      Rotacion: rot?.turnover ?? 0,
      Dias_Cobertura: rot?.coverageDays ?? 0,
      Clasificacion: rot?.classification || 'SIN MOVIMIENTO',
    };
  });

  const ok = exportToCSV(filas, `inventario-rotacion-${fechaArchivo()}.csv`);
  if (ok) void registrarAuditoria('CSV', ctx);
  return ok;
}

/**
 * Dibuja el gráfico de rotación con primitivas de jsPDF.
 *
 * Es un gráfico de barras vectorial, no una imagen: se imprime nítido a
 * cualquier tamaño y pesa unos pocos kilobytes.
 */
function drawRotationChart(doc: jsPDF, rows: RotationRow[], startY: number): number {
  const margin = 14;
  const pageWidth = doc.internal.pageSize.getWidth();
  const chartWidth = pageWidth - margin * 2;
  const chartHeight = 55;
  const topN = rows.filter((r) => r.exits > 0).slice(0, 10);

  doc.setFontSize(11);
  doc.setTextColor(5, 64, 106);
  doc.setFont('helvetica', 'bold');
  doc.text('Rotación por material (10 más activos)', margin, startY);

  if (topN.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text('Sin salidas registradas en el periodo analizado.', margin, startY + 7);
    return startY + 14;
  }

  const baseY = startY + 6 + chartHeight;
  const maxTurnover = Math.max(...topN.map((r) => r.turnover), 0.01);
  const slotWidth = chartWidth / topN.length;
  const barWidth = Math.min(slotWidth * 0.55, 14);

  // Eje y línea base
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.line(margin, baseY, margin + chartWidth, baseY);

  // Referencias horizontales
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  for (let i = 1; i <= 3; i++) {
    const y = baseY - (chartHeight / 3) * i;
    doc.line(margin, y, margin + chartWidth, y);
    doc.text(((maxTurnover / 3) * i).toFixed(1), margin - 3, y + 1, { align: 'right' });
  }

  topN.forEach((row, i) => {
    const x = margin + slotWidth * i + (slotWidth - barWidth) / 2;
    const h = Math.max((row.turnover / maxTurnover) * chartHeight, 0.6);

    // El color comunica la clasificación, igual que en pantalla
    if (row.classification === 'ALTA') doc.setFillColor(6, 89, 148);
    else if (row.classification === 'MEDIA') doc.setFillColor(228, 167, 52);
    else doc.setFillColor(148, 163, 184);

    doc.rect(x, baseY - h, barWidth, h, 'F');

    doc.setFontSize(6);
    doc.setTextColor(51, 65, 85);
    doc.text(row.turnover.toFixed(2), x + barWidth / 2, baseY - h - 1.5, { align: 'center' });

    // Código del material, recortado para que no se encimen las etiquetas
    const etiqueta = row.code.length > 10 ? `${row.code.slice(0, 9)}…` : row.code;
    doc.setTextColor(100, 116, 139);
    doc.text(etiqueta, x + barWidth / 2, baseY + 4, { align: 'center', maxWidth: slotWidth });
  });

  return baseY + 10;
}

/** Genera el PDF del inventario con su gráfico de rotación. */
export async function exportInventoryPDF(ctx: ExportContext): Promise<boolean> {
  try {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
    const margin = 14;
    const pageWidth = doc.internal.pageSize.getWidth();
    const generado = new Date();

    // Encabezado
    doc.setFillColor(3, 37, 59);
    doc.rect(0, 0, pageWidth, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Inventario & Catálogo Técnico', margin, 11);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(164, 198, 222);
    doc.text(
      `Rotación de ${ctx.periodDays} días · Generado ${generado.toLocaleString('es-MX')} · ${ctx.userName} (${ctx.userRole})`,
      margin,
      17
    );
    doc.text(ctx.filterSummary, margin, 21);

    let cursorY = 34;

    // Resumen
    const conStock = ctx.products.filter((p) => num(p.availableStock ?? (p as any).stock) > 0).length;
    const sinMovimiento = ctx.rotation.filter((r) => r.classification === 'SIN MOVIMIENTO').length;
    const alta = ctx.rotation.filter((r) => r.classification === 'ALTA').length;

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(9);
    doc.text(
      `Materiales: ${ctx.products.length}   ·   Con existencia: ${conStock}   ·   Rotación alta: ${alta}   ·   Sin movimiento: ${sinMovimiento}`,
      margin,
      cursorY
    );
    cursorY += 8;

    cursorY = drawRotationChart(doc, ctx.rotation, cursorY);

    // Tabla
    autoTable(doc, {
      startY: cursorY,
      head: [[
        'Código', 'Descripción', 'Categoría', 'Almacén', 'Ubicación',
        'Stock', 'Entradas', 'Salidas', 'Rotación', 'Cobertura', 'Clasificación',
      ]],
      body: ctx.products.map((p) => {
        const rot = ctx.rotation.find((r) => r.code === String(p.code || p.id));
        return [
          String(p.code || p.id),
          String(p.name || ''),
          String(p.category || ''),
          rot?.warehouseName || '',
          typeof (p as any).warehouseLocation === 'string' ? (p as any).warehouseLocation : '',
          num(p.availableStock ?? (p as any).stock).toLocaleString('es-MX'),
          (rot?.entries ?? 0).toLocaleString('es-MX'),
          (rot?.exits ?? 0).toLocaleString('es-MX'),
          String(rot?.turnover ?? 0),
          rot?.coverageDays ? `${rot.coverageDays} d` : '—',
          rot?.classification || 'SIN MOVIMIENTO',
        ];
      }),
      styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak' },
      headStyles: { fillColor: [6, 89, 148], textColor: 255, fontStyle: 'bold', fontSize: 7 },
      alternateRowStyles: { fillColor: [241, 245, 249] },
      columnStyles: {
        1: { cellWidth: 55 },
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' },
        8: { halign: 'right' },
        9: { halign: 'right' },
      },
      margin: { left: margin, right: margin },
      didDrawPage: () => {
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `CONSCORE ERP · Documento generado por el sistema · Página ${doc.getNumberOfPages()}`,
          pageWidth / 2,
          pageHeight - 6,
          { align: 'center' }
        );
      },
    });

    doc.save(`inventario-rotacion-${fechaArchivo()}.pdf`);
    void registrarAuditoria('PDF', ctx);
    return true;
  } catch (err) {
    console.error('[inventoryExportService] Error al generar el PDF:', err);
    return false;
  }
}
