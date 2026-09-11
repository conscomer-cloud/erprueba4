/**
 * CONSCORE ERP IA — Quote Product Availability Service
 * OBSERVACIÓN 09: Mostrar Stock Disponible en Cotizaciones
 *
 * Directiva:
 * - Fórmula canónica: availableStock = Math.max(0, physicalStock - reservedStock)
 * - Estados comerciales:
 *   * ENTREGA INMEDIATA (availableStock >= quantityRequested)
 *   * DISPONIBILIDAD PARCIAL (availableStock > 0 && availableStock < quantityRequested)
 *   * SIN STOCK DISPONIBLE (availableStock <= 0)
 *   * Búsqueda inicial (sin cantidad): EN EXISTENCIA / SIN EXISTENCIA
 * - Segregación RLS: El vendedor ve stock disponible pero NUNCA costos ni datos de compra.
 * - Sin reserva ni afectación de inventario durante cotización.
 */

import { Product, User } from '../types/erp';
import { CommercialRLSService } from './commercialRLSService';

export type AvailabilityStatusType =
  | 'ENTREGA_INMEDIATA'
  | 'DISPONIBILIDAD_PARCIAL'
  | 'SIN_STOCK_DISPONIBLE'
  | 'EN_EXISTENCIA'
  | 'SIN_EXISTENCIA';

export interface WarehouseStockDetail {
  warehouseId: string;
  warehouseName: string;
  locationCode?: string;
  physicalStock: number;
  reservedStock: number;
  availableStock: number;
}

export interface ProductAvailabilityResult {
  productId: string;
  sku: string;
  code: string;
  name: string;
  unit: string;
  listPrice: number;
  physicalStock: number;
  reservedStock: number;
  availableStock: number;
  quantityRequested?: number;
  status: AvailabilityStatusType;
  statusLabel: string;
  immediateAvailableQty: number;
  pendingQty: number;
  deliveryRecommendation: string;
  isImmediateDelivery: boolean;
  isPartialDelivery: boolean;
  isNoStock: boolean;
  warehouses?: WarehouseStockDetail[];
}

export class QuoteAvailabilityService {
  /**
   * Extrae y normaliza el stock físico de un producto
   */
  public static getPhysicalStock(product: Partial<Product> | null | undefined): number {
    if (!product) return 0;
    const stock = product.physical_stock ?? product.physicalStock ?? product.stock ?? 0;
    return Math.max(0, Number(stock) || 0);
  }

  /**
   * Extrae y normaliza el stock reservado de un producto
   */
  public static getReservedStock(product: Partial<Product> | null | undefined): number {
    if (!product) return 0;
    const reserved = product.reserved_stock ?? product.reservedStock ?? (product as any).reserved ?? 0;
    return Math.max(0, Number(reserved) || 0);
  }

  /**
   * Calcula el stock disponible comercial real:
   * availableStock = physicalStock - reservedStock
   */
  public static getAvailableStock(product: Partial<Product> | null | undefined): number {
    if (!product) return 0;
    const physical = this.getPhysicalStock(product);
    const reserved = this.getReservedStock(product);
    return Math.max(0, physical - reserved);
  }

  /**
   * Calcula el estado de entrega y desglose de disponibilidad para un producto
   * con o sin cantidad solicitada.
   */
  public static calculateAvailability(
    product: Partial<Product>,
    quantityRequested?: number
  ): ProductAvailabilityResult {
    const physicalStock = this.getPhysicalStock(product);
    const reservedStock = this.getReservedStock(product);
    const availableStock = Math.max(0, physicalStock - reservedStock);

    const sku = (product.sku || product.code || (product as any).id || 'SKU-DESC').toUpperCase();
    const code = product.code || sku;
    const name = product.name || 'Producto sin nombre';
    const unit = product.unit || 'PZA';
    const listPrice = Number(
      product.price ?? product.salePrice ?? product.sale_price ?? product.listPrice ?? product.list_price ?? 0
    );

    // Mapeo opcional de almacenes si existen
    const warehouses: WarehouseStockDetail[] = [];
    if (Array.isArray(product.warehouseLocations) && product.warehouseLocations.length > 0) {
      product.warehouseLocations.forEach((loc) => {
        const whPhys = Math.max(0, loc.stock || 0);
        // Distribución referencial conservadora
        const whRes = Math.min(whPhys, Math.round(reservedStock * (whPhys / (physicalStock || 1))));
        const whAvail = Math.max(0, whPhys - whRes);
        warehouses.push({
          warehouseId: loc.warehouseId || 'WH-01',
          warehouseName: loc.warehouseName || 'Almacén',
          locationCode: loc.locationCode,
          physicalStock: whPhys,
          reservedStock: whRes,
          availableStock: whAvail,
        });
      });
    }

    // Modo búsqueda inicial (sin cantidad capturada aún)
    if (quantityRequested === undefined || quantityRequested === null || quantityRequested <= 0) {
      if (availableStock > 0) {
        return {
          productId: product.id || '',
          sku,
          code,
          name,
          unit,
          listPrice,
          physicalStock,
          reservedStock,
          availableStock,
          quantityRequested: 0,
          status: 'EN_EXISTENCIA',
          statusLabel: 'EN EXISTENCIA',
          immediateAvailableQty: availableStock,
          pendingQty: 0,
          deliveryRecommendation: 'Material con existencia en almacén para cotización.',
          isImmediateDelivery: true,
          isPartialDelivery: false,
          isNoStock: false,
          warehouses,
        };
      } else {
        return {
          productId: product.id || '',
          sku,
          code,
          name,
          unit,
          listPrice,
          physicalStock,
          reservedStock,
          availableStock: 0,
          quantityRequested: 0,
          status: 'SIN_EXISTENCIA',
          statusLabel: 'SIN EXISTENCIA',
          immediateAvailableQty: 0,
          pendingQty: 0,
          deliveryRecommendation: 'Sin existencia disponible. Validar tiempo de entrega / reabastecimiento.',
          isImmediateDelivery: false,
          isPartialDelivery: false,
          isNoStock: true,
          warehouses,
        };
      }
    }

    // Modo cotización con cantidad solicitada (quantityRequested > 0)
    const qty = Math.max(0, Number(quantityRequested) || 0);

    if (availableStock >= qty) {
      // 1. Stock disponible suficiente para surtir todo de inmediato
      return {
        productId: product.id || '',
        sku,
        code,
        name,
        unit,
        listPrice,
        physicalStock,
        reservedStock,
        availableStock,
        quantityRequested: qty,
        status: 'ENTREGA_INMEDIATA',
        statusLabel: 'ENTREGA INMEDIATA',
        immediateAvailableQty: qty,
        pendingQty: 0,
        deliveryRecommendation: 'Entrega inmediata disponible sobre inventario libre en almacén.',
        isImmediateDelivery: true,
        isPartialDelivery: false,
        isNoStock: false,
        warehouses,
      };
    } else if (availableStock > 0) {
      // 2. Disponibilidad parcial: hay una parte pero no todo
      const immediate = availableStock;
      const pending = qty - availableStock;
      return {
        productId: product.id || '',
        sku,
        code,
        name,
        unit,
        listPrice,
        physicalStock,
        reservedStock,
        availableStock,
        quantityRequested: qty,
        status: 'DISPONIBILIDAD_PARCIAL',
        statusLabel: 'DISPONIBILIDAD PARCIAL',
        immediateAvailableQty: immediate,
        pendingQty: pending,
        deliveryRecommendation: `Disponible de inmediato: ${immediate} ${unit}. Saldo pendiente por reabastecer: ${pending} ${unit} (Validar tiempo de entrega).`,
        isImmediateDelivery: false,
        isPartialDelivery: true,
        isNoStock: false,
        warehouses,
      };
    } else {
      // 3. Sin stock disponible (physicalStock <= 0 o todo está reservado)
      return {
        productId: product.id || '',
        sku,
        code,
        name,
        unit,
        listPrice,
        physicalStock,
        reservedStock,
        availableStock: 0,
        quantityRequested: qty,
        status: 'SIN_STOCK_DISPONIBLE',
        statusLabel: 'SIN STOCK DISPONIBLE',
        immediateAvailableQty: 0,
        pendingQty: qty,
        deliveryRecommendation: 'Sin stock disponible. Validar tiempo de entrega / reabastecimiento con compras.',
        isImmediateDelivery: false,
        isPartialDelivery: false,
        isNoStock: true,
        warehouses,
      };
    }
  }

  /**
   * Resumen global de disponibilidad para una lista de partidas de cotización
   */
  public static calculateQuoteAvailabilitySummary(
    items: Array<{ productId: string; quantity: number }>,
    products: Product[]
  ): {
    totalItems: number;
    immediateCount: number;
    partialCount: number;
    noStockCount: number;
    overallStatus: 'ENTREGA_INMEDIATA' | 'DISPONIBILIDAD_PARCIAL' | 'SIN_STOCK_DISPONIBLE';
    overallStatusLabel: string;
    hasBackorderRisk: boolean;
  } {
    let immediateCount = 0;
    let partialCount = 0;
    let noStockCount = 0;

    items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) {
        noStockCount++;
        return;
      }
      const res = this.calculateAvailability(prod, item.quantity);
      if (res.status === 'ENTREGA_INMEDIATA') {
        immediateCount++;
      } else if (res.status === 'DISPONIBILIDAD_PARCIAL') {
        partialCount++;
      } else {
        noStockCount++;
      }
    });

    const total = items.length;
    let overallStatus: 'ENTREGA_INMEDIATA' | 'DISPONIBILIDAD_PARCIAL' | 'SIN_STOCK_DISPONIBLE' = 'ENTREGA_INMEDIATA';
    let overallStatusLabel = 'ENTREGA INMEDIATA (100% DISPONIBLE)';

    if (noStockCount > 0 && immediateCount === 0 && partialCount === 0) {
      overallStatus = 'SIN_STOCK_DISPONIBLE';
      overallStatusLabel = 'SIN STOCK INMEDIATO (REQUIERE REABASTECIMIENTO)';
    } else if (partialCount > 0 || noStockCount > 0) {
      overallStatus = 'DISPONIBILIDAD_PARCIAL';
      overallStatusLabel = 'DISPONIBILIDAD PARCIAL (VALIDAR TIEMPOS DE ENTREGA)';
    }

    return {
      totalItems: total,
      immediateCount,
      partialCount,
      noStockCount,
      overallStatus,
      overallStatusLabel,
      hasBackorderRisk: partialCount > 0 || noStockCount > 0,
    };
  }

  /**
   * Suite de certificación técnica y funcional obligatoria (Observación 09)
   */
  public static runCertificationTests(): {
    passed: boolean;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    results: Array<{
      testId: string;
      name: string;
      expected: string;
      actual: string;
      passed: boolean;
      details?: string;
    }>;
  } {
    const results: Array<{
      testId: string;
      name: string;
      expected: string;
      actual: string;
      passed: boolean;
      details?: string;
    }> = [];

    // Test 1: Caso A - Stock suficiente
    const caseAProd: Partial<Product> = {
      id: 'TEST-A',
      code: 'PROD-A',
      sku: 'SKU-A',
      name: 'Aislante Térmico Alfa',
      stock: 50,
      reservedStock: 0,
      price: 100,
    };
    const resA = this.calculateAvailability(caseAProd, 10);
    const passA = resA.status === 'ENTREGA_INMEDIATA' && resA.availableStock === 50 && resA.immediateAvailableQty === 10 && resA.pendingQty === 0;
    results.push({
      testId: 'TEST_01_CASE_A',
      name: 'Caso A: Stock suficiente (50 disp, 10 solicitados)',
      expected: 'ENTREGA INMEDIATA, Inmediato: 10, Pendiente: 0',
      actual: `${resA.statusLabel}, Inmediato: ${resA.immediateAvailableQty}, Pendiente: ${resA.pendingQty}`,
      passed: passA,
    });

    // Test 2: Caso B - Stock parcial simple
    const caseBProd: Partial<Product> = {
      id: 'TEST-B',
      code: 'PROD-B',
      sku: 'SKU-B',
      name: 'Cañuela Rígida Beta',
      stock: 10,
      reservedStock: 0,
      price: 150,
    };
    const resB = this.calculateAvailability(caseBProd, 15);
    const passB = resB.status === 'DISPONIBILIDAD_PARCIAL' && resB.availableStock === 10 && resB.immediateAvailableQty === 10 && resB.pendingQty === 5;
    results.push({
      testId: 'TEST_02_CASE_B',
      name: 'Caso B: Stock parcial simple (10 disp, 15 solicitados)',
      expected: 'DISPONIBILIDAD PARCIAL, Inmediato: 10, Pendiente: 5',
      actual: `${resB.statusLabel}, Inmediato: ${resB.immediateAvailableQty}, Pendiente: ${resB.pendingQty}`,
      passed: passB,
    });

    // Test 3: Caso C - Sin stock disponible
    const caseCProd: Partial<Product> = {
      id: 'TEST-C',
      code: 'PROD-C',
      sku: 'SKU-C',
      name: 'Panel Acústico Gamma',
      stock: 0,
      reservedStock: 0,
      price: 200,
    };
    const resC = this.calculateAvailability(caseCProd, 5);
    const passC = resC.status === 'SIN_STOCK_DISPONIBLE' && resC.availableStock === 0 && resC.pendingQty === 5;
    results.push({
      testId: 'TEST_03_CASE_C',
      name: 'Caso C: Sin stock (0 disp, 5 solicitados)',
      expected: 'SIN STOCK DISPONIBLE, Inmediato: 0, Pendiente: 5',
      actual: `${resC.statusLabel}, Inmediato: ${resC.immediateAvailableQty}, Pendiente: ${resC.pendingQty}`,
      passed: passC,
    });

    // Test 4: Caso D (PRUEBA DEFINITIVA) - Stock físico 20, Reservado 18, Solicitado 5
    // ¡CRÍTICO! availableStock = 20 - 18 = 2. Como 2 < 5, DEBE ser DISPONIBILIDAD PARCIAL.
    // NUNCA DEBE MOSTRAR ENTREGA INMEDIATA
    const caseDProd: Partial<Product> = {
      id: 'TEST-D-CRITICAL',
      code: 'PROD-D',
      sku: 'SKU-D',
      name: 'Lana Mineral Especial',
      physical_stock: 20,
      reserved_stock: 18,
      stock: 20,
      reservedStock: 18,
      price: 300,
    };
    const resD = this.calculateAvailability(caseDProd, 5);
    const passD =
      resD.availableStock === 2 &&
      resD.status === 'DISPONIBILIDAD_PARCIAL' &&
      resD.immediateAvailableQty === 2 &&
      resD.pendingQty === 3;
    results.push({
      testId: 'TEST_04_CASE_D_DEFINITIVE',
      name: 'Caso D (Prueba Definitiva): Físico 20, Reservado 18, Solicitado 5',
      expected: 'Disponible: 2, DISPONIBILIDAD PARCIAL, Inmediato: 2, Pendiente: 3 (NUNCA ENTREGA INMEDIATA)',
      actual: `Disponible: ${resD.availableStock}, ${resD.statusLabel}, Inmediato: ${resD.immediateAvailableQty}, Pendiente: ${resD.pendingQty}`,
      passed: passD,
      details: passD
        ? 'Aprobado: El sistema restó estrictamente las reservas y no se confundió con el stock físico.'
        : 'FALLA CRÍTICA: Se calculó sobre stock físico o se otorgó entrega inmediata errónea.',
    });

    // Test 5: Búsqueda en catálogo sin cantidad especificada - Con stock
    const resSearchExist = this.calculateAvailability(caseAProd, undefined);
    const passSearchExist = resSearchExist.status === 'EN_EXISTENCIA' && resSearchExist.availableStock === 50;
    results.push({
      testId: 'TEST_05_SEARCH_IN_STOCK',
      name: 'Selector de Catálogo: Producto con existencia (sin cantidad especificada)',
      expected: 'EN EXISTENCIA, Disponible: 50',
      actual: `${resSearchExist.statusLabel}, Disponible: ${resSearchExist.availableStock}`,
      passed: passSearchExist,
    });

    // Test 6: Búsqueda en catálogo sin cantidad especificada - Sin stock
    const resSearchNoStock = this.calculateAvailability(caseCProd, undefined);
    const passSearchNoStock = resSearchNoStock.status === 'SIN_EXISTENCIA' && resSearchNoStock.availableStock === 0;
    results.push({
      testId: 'TEST_06_SEARCH_OUT_OF_STOCK',
      name: 'Selector de Catálogo: Producto sin existencia (sin cantidad especificada)',
      expected: 'SIN EXISTENCIA, Disponible: 0',
      actual: `${resSearchNoStock.statusLabel}, Disponible: ${resSearchNoStock.availableStock}`,
      passed: passSearchNoStock,
    });

    // Test 7: Segregación RLS para VENDEDOR (Sin filtración de costos ni proveedores)
    const rawVendorProd: Product = {
      id: 'PROD-SENSITIVE',
      code: 'AIS-999',
      sku: 'AIS-999',
      name: 'Aislante Industrial Clasificado',
      unit: 'M2',
      cost: 150,
      costPrice: 150,
      price: 250,
      salePrice: 250,
      stock: 40,
      reservedStock: 10,
      supplier: 'Proveedor Confidencial SA de CV',
      supplierCost: 140,
    } as any;
    const vendorUser: Partial<User> = {
      id: 'USR-VEND-01',
      role: 'VENDEDOR',
      name: 'Vendedor Demo',
    };
    const scopedProducts = CommercialRLSService.scopeProducts([rawVendorProd], vendorUser);
    const safeProd = scopedProducts[0];
    const isCostMasked =
      safeProd &&
      (safeProd as any).cost === undefined &&
      (safeProd as any).costPrice === undefined &&
      (safeProd as any).cost_price === undefined &&
      (safeProd as any).supplier === undefined &&
      (safeProd as any).supplierCost === undefined;
    const hasAvailableData = safeProd && (safeProd.stock === 40 || safeProd.physical_stock === 40);

    results.push({
      testId: 'TEST_07_RLS_VENDOR_MASKING',
      name: 'RLS Comercial: Mascaramiento estricto de costos de compra para rol VENDEDOR',
      expected: 'Costo de compra y proveedor suprimidos, stock comercial visible',
      actual: isCostMasked && hasAvailableData ? 'Costos sanitizados al 100% y stock preservado' : 'Fuga de datos de costo detectada',
      passed: Boolean(isCostMasked && hasAvailableData),
    });

    // Test 8: No mutación de inventario ni reservas en Cotizaciones
    const stockBefore = caseDProd.stock;
    const reservedBefore = caseDProd.reservedStock;
    // Ejecución de cálculo
    this.calculateAvailability(caseDProd, 5);
    const stockAfter = caseDProd.stock;
    const reservedAfter = caseDProd.reservedStock;
    const noMutation = stockBefore === stockAfter && reservedBefore === reservedAfter;
    results.push({
      testId: 'TEST_08_NO_STOCK_MUTATION',
      name: 'Integridad Operativa: Cotización no reserva ni decrementa inventario',
      expected: 'Stock físico y reservado permanecen inmutables al cotizar',
      actual: noMutation ? 'Inmutabilidad confirmada' : 'Error: Mutación detectada',
      passed: noMutation,
    });

    const passedTests = results.filter((r) => r.passed).length;
    const failedTests = results.length - passedTests;

    return {
      passed: failedTests === 0,
      totalTests: results.length,
      passedTests,
      failedTests,
      results,
    };
  }
}
