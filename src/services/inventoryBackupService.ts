import * as XLSX from 'xlsx';
import { Product, Warehouse, User, UserRole } from '../types/erp';

/**
 * OBSERVACIÓN 20 — RESPALDO OFICIAL DE INVENTARIO EN EXCEL (.xlsx)
 * 
 * Reglas de negocio críticas:
 * 1. Formato estricto: Microsoft Excel (.xlsx) con MIME application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
 * 2. NO JSON: No genera, ni descarga archivos .json.
 * 3. Hoja 1: 'INVENTARIO' (registros operativos detallados).
 *    Hoja 2: 'RESUMEN' (totales ejecutivos y metadatos de auditoría).
 * 4. Multialmacén: Una fila por SKU + almacén + ubicación (no consolidar incorrectamente ubicaciones distintas).
 * 5. RBAC estricto para costos:
 *    - Roles autorizados (ADMINISTRADOR, DIRECTOR, FINANZAS, COMPRAS): Ven costo unitario, valor total, proveedor.
 *    - Roles operativos (ALMACEN, JEFE_ALMACEN, VENDEDOR, LOGISTICA): Las columnas de costos/precios/proveedor NO existen en el archivo.
 * 6. Protección contra inyección de fórmulas: Valores que comiencen con [=+@-] son sanitizados.
 * 7. Operación 100% READ ONLY: No altera inventarios, reservas ni genera movimientos de Kardex.
 */

/** Roles con autorización expresa para visualizar costos financieros y márgenes de compra */
const ROLES_CON_PERMISO_COSTOS: string[] = [
  'ADMINISTRADOR',
  'DIRECTOR',
  'FINANZAS',
  'GERENTE_FINANZAS',
  'COMPRAS',
  'GERENTE_COMPRAS',
];

/**
 * Verifica si el rol del usuario tiene permiso de visualizar costos en el inventario.
 */
export function canUserViewInventoryCosts(role?: string | UserRole): boolean {
  if (!role) return false;
  return ROLES_CON_PERMISO_COSTOS.includes(role.toUpperCase());
}

/**
 * Sanitiza valores de celda para prevenir Excel Formula Injection (CSV/Excel Injection).
 * Si un texto inicia con '=', '+', '-', o '@', se antepone un apóstrofe para forzar modo texto.
 */
export function sanitizeExcelCellValue(val: any): any {
  if (val === null || val === undefined) return '';
  if (typeof val === 'number' || typeof val === 'boolean') return val;
  const str = String(val);
  if (/^[=+@-]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

/**
 * Genera el nombre canónico del archivo de respaldo:
 * CONSCORE_Respaldo_Inventario_YYYY-MM-DD_HH-mm.xlsx
 */
export function generateInventoryBackupFilename(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = date.getFullYear();
  const MM = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const HH = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `CONSCORE_Respaldo_Inventario_${yyyy}-${MM}-${dd}_${HH}-${mm}.xlsx`;
}

export interface InventoryExportOptions {
  products: Product[];
  warehouses?: Warehouse[];
  currentUser: {
    id: string;
    name: string;
    role: string | UserRole;
  };
  scopeWarehouseId?: string;
  scopeWarehouseName?: string;
  onAuditLog?: (entry: {
    action: string;
    module: string;
    entityType: string;
    entityId: string;
    details: Record<string, any>;
  }) => void;
}

export interface InventoryExportResult {
  success: boolean;
  filename?: string;
  totalRows?: number;
  totalUnits?: number;
  canViewCosts?: boolean;
  error?: string;
}

/**
 * Ejecuta la generación y descarga directa del respaldo de inventario en Excel (.xlsx)
 */
export async function downloadInventoryExcelBackup(
  options: InventoryExportOptions
): Promise<InventoryExportResult> {
  try {
    const {
      products,
      warehouses = [],
      currentUser,
      scopeWarehouseId = 'TODOS',
      scopeWarehouseName,
      onAuditLog,
    } = options;

    // 1. Validación de existencia de datos
    if (!products || !Array.isArray(products) || products.length === 0) {
      return {
        success: false,
        error: 'No hay información de inventario para exportar.',
      };
    }

    // 2. Validación de RBAC para costos
    const canViewCosts = canUserViewInventoryCosts(currentUser.role);

    // Mapa de almacenes para resolución de nombres
    const warehouseMap = new Map<string, string>();
    warehouses.forEach((w) => {
      if (w.id && w.name) warehouseMap.set(w.id, w.name);
    });

    // 3. Construcción de registros operativos para la HOJA 1 ('INVENTARIO')
    // Se expanden existencias multialmacén para que cada almacén y ubicación física tenga su propia fila
    const inventoryRows: Record<string, any>[] = [];

    let totalPhysicalUnits = 0;
    let totalReservedUnits = 0;
    let totalAvailableUnits = 0;
    let totalValuation = 0;
    let criticalStockCount = 0;
    const uniqueSkus = new Set<string>();

    for (const product of products) {
      const sku = product.sku || product.code || product.id || 'SIN-SKU';
      const code = product.code || product.sku || '';
      const name = product.name || 'Sin nombre';
      const description = product.description || '';
      const category = (product as any).categoryName || (product as any).category_name || product.category || 'General';
      const unit = product.unit || 'PZA';
      const status = product.status || (product.active !== false ? 'ACTIVO' : 'INACTIVO');
      const minStock = Number(product.minStock ?? (product as any).minimum_stock ?? (product as any).minimumStock ?? 0);
      const maxStock = Number(product.maxStock ?? (product as any).maximum_stock ?? (product as any).maximumStock ?? 0);
      const reorderPoint = Number((product as any).reorderPoint ?? (product as any).reorder_point ?? Math.ceil(minStock * 1.5));
      const cost = Number(product.cost ?? (product as any).cost_price ?? (product as any).costPrice ?? 0);
      const supplierName = (product as any).supplierName || (product as any).supplier_name || product.supplierId || 'Proveedor Nacional';
      const updatedAtStr = (product as any).updated_at || (product as any).updatedAt || new Date().toISOString();
      const formattedDate = updatedAtStr.slice(0, 19).replace('T', ' ');

      uniqueSkus.add(sku);

      // Verificación de stock crítico a nivel producto
      const totalProdPhysical = Number((product as any).physicalStock ?? (product as any).physical_stock ?? product.stock ?? 0);
      if (totalProdPhysical <= minStock) {
        criticalStockCount++;
      }

      // Caso A: El producto tiene desglose explícito multialmacén en warehouseLocations
      const hasMultiLocations = Array.isArray(product.warehouseLocations) && product.warehouseLocations.length > 0;

      if (hasMultiLocations && product.warehouseLocations) {
        for (const loc of product.warehouseLocations) {
          const locWhName = loc.warehouseName || warehouseMap.get(loc.warehouseId) || 'CEDIS';
          
          // Si hay filtro por almacén específico y no coincide, omitir
          if (scopeWarehouseId !== 'TODOS' && loc.warehouseId !== scopeWarehouseId) {
            continue;
          }

          const locStock = Number(loc.stock ?? (loc as any).physicalStock ?? 0);
          const locReserved = Number((loc as any).reservedStock ?? 0);
          const locAvailable = Number((loc as any).availableStock ?? Math.max(0, locStock - locReserved));
          const locCode = loc.locationCode || [loc.nave, loc.rack, loc.pasillo, loc.nivel].filter(Boolean).join(' / ') || 'Sin asignar';

          totalPhysicalUnits += locStock;
          totalReservedUnits += locReserved;
          totalAvailableUnits += locAvailable;
          if (canViewCosts) {
            totalValuation += locStock * cost;
          }

          const rowData: Record<string, any> = {
            'SKU': sanitizeExcelCellValue(sku),
            'Código': sanitizeExcelCellValue(code),
            'Producto': sanitizeExcelCellValue(name),
            'Descripción': sanitizeExcelCellValue(description),
            'Categoría': sanitizeExcelCellValue(category),
            'Unidad': sanitizeExcelCellValue(unit),
            'Almacén': sanitizeExcelCellValue(locWhName),
            'Ubicación': sanitizeExcelCellValue(locCode),
            'Existencia física': locStock,
            'Reservado': locReserved,
            'Disponible': locAvailable,
            'Stock mínimo': minStock,
            'Stock máximo': maxStock,
            'Punto de Reorden': reorderPoint,
            'Estado': sanitizeExcelCellValue(status),
            'Última actualización': sanitizeExcelCellValue(formattedDate),
          };

          if (canViewCosts) {
            rowData['Costo Unitario'] = cost;
            rowData['Valor Total'] = Number((locStock * cost).toFixed(2));
            rowData['Proveedor'] = sanitizeExcelCellValue(supplierName);
          }

          inventoryRows.push(rowData);
        }
      } else {
        // Caso B: Producto estándar o con ubicación única
        const whId = product.warehouseId || (product as any).warehouse_id || 'WH-01';
        
        if (scopeWarehouseId !== 'TODOS' && whId !== scopeWarehouseId) {
          continue;
        }

        const whName = (product as any).warehouseName || (product as any).warehouse_name || warehouseMap.get(whId) || 'Almacén Central CEDIS';
        const rawLoc = product.warehouseLocation || (product as any).warehouse_location;
        const locString = typeof rawLoc === 'string' ? rawLoc : 'N1 / R-01 / P-01 / Niv-01';

        const physStock = Number((product as any).physicalStock ?? (product as any).physical_stock ?? product.stock ?? 0);
        const resStock = Number((product as any).reservedStock ?? (product as any).reserved_stock ?? 0);
        const availStock = Number((product as any).availableStock ?? (product as any).available_stock ?? Math.max(0, physStock - resStock));

        totalPhysicalUnits += physStock;
        totalReservedUnits += resStock;
        totalAvailableUnits += availStock;
        if (canViewCosts) {
          totalValuation += physStock * cost;
        }

        const rowData: Record<string, any> = {
          'SKU': sanitizeExcelCellValue(sku),
          'Código': sanitizeExcelCellValue(code),
          'Producto': sanitizeExcelCellValue(name),
          'Descripción': sanitizeExcelCellValue(description),
          'Categoría': sanitizeExcelCellValue(category),
          'Unidad': sanitizeExcelCellValue(unit),
          'Almacén': sanitizeExcelCellValue(whName),
          'Ubicación': sanitizeExcelCellValue(locString),
          'Existencia física': physStock,
          'Reservado': resStock,
          'Disponible': availStock,
          'Stock mínimo': minStock,
          'Stock máximo': maxStock,
          'Punto de Reorden': reorderPoint,
          'Estado': sanitizeExcelCellValue(status),
          'Última actualización': sanitizeExcelCellValue(formattedDate),
        };

        if (canViewCosts) {
          rowData['Costo Unitario'] = cost;
          rowData['Valor Total'] = Number((physStock * cost).toFixed(2));
          rowData['Proveedor'] = sanitizeExcelCellValue(supplierName);
        }

        inventoryRows.push(rowData);
      }
    }

    if (inventoryRows.length === 0) {
      return {
        success: false,
        error: 'No se encontraron registros de inventario bajo el alcance especificado.',
      };
    }

    // 4. Construcción de HOJA 2 ('RESUMEN')
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const backupDateFormatted = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const summaryData: (string | number)[][] = [
      ['CONSCORE ERP — RESPALDO OFICIAL DE INVENTARIO'],
      ['Sistema de Gestión Integral de Materiales y Aislamientos Industriales'],
      [''],
      ['PARÁMETRO DE AUDITORÍA', 'VALOR REGISTRADO'],
      ['Fecha y Hora del Respaldo', backupDateFormatted],
      ['Generado Por (Usuario)', sanitizeExcelCellValue(currentUser.name || currentUser.id)],
      ['Rol del Operador', sanitizeExcelCellValue(currentUser.role)],
      ['Alcance de Almacenes', sanitizeExcelCellValue(scopeWarehouseName || (scopeWarehouseId === 'TODOS' ? 'Todos los Almacenes y CEDIS' : scopeWarehouseId))],
      ['Seguridad RBAC (Costos)', canViewCosts ? 'INCLUIDO (Privilegiado)' : 'RESTRINGIDO (Sin visualización de costos)'],
      [''],
      ['MÉTRICA OPERATIVA', 'CANTIDAD'],
      ['Total de SKUs Únicos', uniqueSkus.size],
      ['Total de Registros Físicos / Ubicaciones', inventoryRows.length],
      ['Total de Unidades en Stock Físico', totalPhysicalUnits],
      ['Total de Unidades Reservadas', totalReservedUnits],
      ['Total de Unidades Disponibles', totalAvailableUnits],
      ['SKUs con Nivel de Stock Crítico (<= Mínimo)', criticalStockCount],
    ];

    if (canViewCosts) {
      summaryData.push(['Valorización Total del Inventario ($ MXN)', Number(totalValuation.toFixed(2))]);
    }

    // 5. Creación del Libro de Trabajo con SheetJS
    const workbook = XLSX.utils.book_new();

    // Hoja 1: INVENTARIO
    const inventorySheet = XLSX.utils.json_to_sheet(inventoryRows);
    
    // Configuración de anchos de columna para legibilidad óptima
    const colWidths: { wch: number }[] = [
      { wch: 18 }, // SKU
      { wch: 16 }, // Código
      { wch: 38 }, // Producto
      { wch: 45 }, // Descripción
      { wch: 24 }, // Categoría
      { wch: 12 }, // Unidad
      { wch: 28 }, // Almacén
      { wch: 24 }, // Ubicación
      { wch: 14 }, // Stock Físico
      { wch: 14 }, // Reservado
      { wch: 14 }, // Disponible
      { wch: 14 }, // Stock Mínimo
      { wch: 14 }, // Stock Máximo
      { wch: 16 }, // Punto de Reorden
      { wch: 14 }, // Estado
      { wch: 20 }, // Última Actualización
    ];

    if (canViewCosts) {
      colWidths.push(
        { wch: 16 }, // Costo Unitario
        { wch: 18 }, // Valor Total
        { wch: 32 }  // Proveedor
      );
    }
    inventorySheet['!cols'] = colWidths;

    // Hoja 2: RESUMEN
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet['!cols'] = [
      { wch: 44 }, // Métrica / Parámetro
      { wch: 40 }, // Valor
    ];

    XLSX.utils.book_append_sheet(workbook, inventorySheet, 'Inventario');
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

    // 6. Generación del binario .xlsx real
    const filename = generateInventoryBackupFilename(now);
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    // 7. Descarga en el navegador
    const downloadUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = downloadUrl;
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(downloadUrl);

    // 8. Trazabilidad y Auditoría
    if (onAuditLog) {
      try {
        onAuditLog({
          action: 'INVENTORY_EXCEL_EXPORTED',
          module: 'INVENTARIO',
          entityType: 'INVENTORY',
          entityId: 'ALL',
          details: {
            userId: currentUser.id,
            role: currentUser.role,
            timestamp: now.toISOString(),
            filename,
            totalRows: inventoryRows.length,
          },
        });
      } catch (auditErr) {
        console.warn('[downloadInventoryExcelBackup] No se pudo registrar auditoría local:', auditErr);
      }
    }

    // Registrar en backend si es posible
    try {
      fetch('/api/audit-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('conscore_auth_token') || ''}`,
        },
        body: JSON.stringify({
          action: 'INVENTORY_EXCEL_EXPORTED',
          module: 'INVENTARIO',
          entity_type: 'INVENTORY',
          entity_id: 'ALL',
          new_value: JSON.stringify({
            userId: currentUser.id,
            role: currentUser.role,
            timestamp: now.toISOString(),
            filename,
            totalRows: inventoryRows.length,
          }),
        }),
      }).catch(() => {});
    } catch {
      // Ignorar errores silenciosos en post de auditoría remota
    }

    return {
      success: true,
      filename,
      totalRows: inventoryRows.length,
      totalUnits: totalPhysicalUnits,
      canViewCosts,
    };
  } catch (err: any) {
    console.error('[downloadInventoryExcelBackup] Error al generar respaldo Excel:', err);
    return {
      success: false,
      error: err?.message || 'No fue posible generar el respaldo de inventario.',
    };
  }
}
