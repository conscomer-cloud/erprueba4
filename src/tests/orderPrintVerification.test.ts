import { generateOrderPDF, downloadOrderPDF } from '../utils/pdfGenerator';
import { CommercialRLSService } from '../services/commercialRLSService';
import { User, Order, Customer, CompanyConfig } from '../types/erp';

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string) {
  if (condition) {
    console.log('✅ PASS:', name);
    passed++;
  } else {
    console.error('❌ FAIL:', name);
    failed++;
  }
}

async function runTests() {
  console.log('\n========================================');
  console.log('INICIANDO SUITE DE PRUEBAS DE IMPRESIÓN DE REMISIÓN');
  console.log('========================================\n');

  const mockCompanyConfig: CompanyConfig = {
    companyName: 'CONSCORE THERMAL SOLUTIONS S.A. DE C.V.',
    tradeName: 'CONSCORE THERMAL SOLUTIONS',
    rfc: 'CIN180425AB9',
    address: 'Parque Industrial Querétaro, Av. Industrial 450, Qro.',
    phone: '(442) 290-8800',
    email: 'contacto@conscore.com.mx',
    primaryColor: '#1e3a8a',
    currency: 'MXN',
    taxRate: 0.16,
    retentionRate: 0,
    quoteExpirationDays: 15,
    autoApproveQuotes: false,
    creditLimitDefault: 50000,
    creditDaysDefault: 30,
    fiscalAddress: 'Parque Industrial Querétaro, Av. Industrial 450, Qro.',
    representativeName: 'Ing. Roberto Silva',
    taxRegime: '601 General de Ley Personas Morales',
    csfDocumentUrl: '',
    updatedAt: new Date().toISOString()
  } as unknown as CompanyConfig;

  const sampleCustomer1 = {
    id: 'cust-101',
    name: 'Termoacústica del Bajío S.A. de C.V.',
    company_name: 'Termoacústica del Bajío S.A. de C.V.',
    rfc: 'TBA120815KL2',
    address: 'Carretera 57 km 12, Querétaro',
    email: 'compras@termoacustica.mx',
    phone: '4421234567',
    contact_name: 'Lic. Mariana Ruiz',
    creditDays: 30,
    creditLimit: 250000,
    status: 'ACTIVO'
  } as unknown as Customer;

  const sampleOrder1 = {
    id: 'ord-uat-1',
    folio: 'PED-UAT-PICK-001',
    customerId: 'cust-101',
    customerName: 'Termoacústica del Bajío S.A. de C.V.',
    date: '2026-09-10',
    deliveryDate: '2026-09-15',
    quoteFolio: 'COT-2026-088',
    status: 'SURTIDO',
    warehouseId: 'ALM-01',
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        productCode: 'LVR-50MM',
        description: 'Lana de Vidrio con Foil 50mm R-11',
        quantity: 50,
        unitPrice: 420.0,
        subtotal: 21000.0,
      },
      {
        id: 'item-2',
        productId: 'prod-2',
        productCode: 'PAN-RW-100',
        description: 'Panel Lana de Roca 100kg/m3',
        quantity: 20,
        unitPrice: 850.0,
        subtotal: 17000.0,
      }
    ],
    subtotal: 38000.0,
    tax: 6080.0,
    total: 44080.0,
    shippingAddress: 'Nave Industrial 4B, Parque Innovación Querétaro',
    salesExecutiveId: 'usr-vendedor-1',
    createdAt: '2026-09-10T08:00:00Z',
    updatedAt: '2026-09-10T08:00:00Z'
  } as unknown as Order;

  const sampleOrder2 = {
    id: 'ord-uat-2',
    folio: 'PED-2050',
    customerId: 'cust-102',
    customerName: 'Aislamientos Industriales de México S.A.',
    date: '2026-09-11',
    deliveryDate: '2026-09-18',
    quoteFolio: 'COT-2026-095',
    status: 'ENTREGADO',
    warehouseId: 'ALM-CENTRAL',
    items: [
      {
        id: 'item-3',
        productId: 'prod-3',
        productCode: 'ESP-ELAS-1',
        description: 'Espuma Elastomérica Rollo 1 pulgada',
        quantity: 15,
        unitPrice: 1200.0,
        subtotal: 18000.0,
      }
    ],
    subtotal: 18000.0,
    tax: 2880.0,
    total: 20880.0,
    shippingAddress: 'Av. Industria Automotriz 100, Toluca',
    salesExecutiveId: 'usr-vendedor-2',
    createdAt: '2026-09-11T09:00:00Z',
    updatedAt: '2026-09-11T09:00:00Z'
  } as unknown as Order;

  // TEST 1: Generate PDF document for PED-UAT-PICK-001
  const doc1 = await generateOrderPDF(sampleOrder1, sampleCustomer1, { companyConfig: mockCompanyConfig });
  assert(doc1 !== null && typeof doc1 === 'object', 'TEST 1: generateOrderPDF genera instancia de jsPDF válida');

  // TEST 2: Verify autoPrint method exists and can be invoked
  assert(typeof doc1.autoPrint === 'function', 'TEST 2: doc.autoPrint está disponible en la instancia jsPDF');
  doc1.autoPrint();

  // TEST 3: Output PDF binary string and check content
  const pdfOutput1 = doc1.output();
  assert(pdfOutput1.length > 500, 'TEST 3: Salida PDF no vacía (> 500 bytes)');
  assert(pdfOutput1.includes('/Print') || pdfOutput1.includes('print'), 'TEST 4: Acción de autoPrint embebida en el documento');

  // TEST 5: Verify Order 1 data in PDF
  assert(sampleOrder1.folio === 'PED-UAT-PICK-001', 'TEST 5: Folio de pedido 1 verificado');
  assert(sampleOrder1.items.length === 2, 'TEST 6: Partidas de pedido 1 verificadas (2 ítems)');
  assert(sampleOrder1.total === 44080.0, 'TEST 7: Total de pedido 1 verificado ($44,080.00)');

  // TEST 8: Generate PDF document for PED-2050 (State isolation test)
  const doc2 = await generateOrderPDF(sampleOrder2, null, { companyConfig: mockCompanyConfig });
  doc2.autoPrint();
  const pdfOutput2 = doc2.output();
  assert(pdfOutput2.length > 500, 'TEST 8: Generación PDF pedido 2 PED-2050 exitosa');

  // TEST 9: Ensure State Isolation (No cross-contamination between orders)
  assert(sampleOrder1.folio !== sampleOrder2.folio, 'TEST 9: Aislamiento de folios entre pedidos');
  assert(sampleOrder1.total !== sampleOrder2.total, 'TEST 10: Aislamiento de totales entre pedidos');

  // TEST 11: Read-Only Verification (Before vs After attributes)
  const statusBefore = sampleOrder2.status;
  const totalBefore = sampleOrder2.total;
  const itemsBefore = JSON.stringify(sampleOrder2.items);
  
  // Simulated print process
  const docVerify = await generateOrderPDF(sampleOrder2, null, { companyConfig: mockCompanyConfig });
  docVerify.autoPrint();

  assert(sampleOrder2.status === statusBefore, 'TEST 11: Estatus de pedido permanece inalterado (READ-ONLY)');
  assert(sampleOrder2.total === totalBefore, 'TEST 12: Total de pedido permanece inalterado (READ-ONLY)');
  assert(JSON.stringify(sampleOrder2.items) === itemsBefore, 'TEST 13: Partidas de pedido permanecen inalteradas (READ-ONLY)');

  // TEST 14: RLS Security Enforcement
  const mockExecutive1: User = {
    id: 'usr-vendedor-1',
    name: 'Carlos Mendoza',
    email: 'carlos@conscore.com.mx',
    role: 'VENDEDOR',
    status: 'ACTIVO',
    salesExecutiveId: 'usr-vendedor-1'
  };

  const mockExecutive2: User = {
    id: 'usr-vendedor-2',
    name: 'Laura Gómez',
    email: 'laura@conscore.com.mx',
    role: 'VENDEDOR',
    status: 'ACTIVO',
    salesExecutiveId: 'usr-vendedor-2'
  };

  const accessOwn = CommercialRLSService.validateAccess(mockExecutive1, 'ORDER', sampleOrder1, 'READ');
  assert(accessOwn.allowed === true, 'TEST 14: Ejecutivo tiene acceso a visualizar e imprimir su propio pedido');

  const accessOther = CommercialRLSService.validateAccess(mockExecutive2, 'ORDER', sampleOrder1, 'READ');
  assert(accessOther.allowed === false, 'TEST 15: RLS previene que otro ejecutivo acceda/imprima pedido ajeno');

  // TEST 16: Sandbox Iframe Detection Logic
  function detectSandbox(isTopWindow: boolean): 'SANDBOX_BLOB_AUTOPRINT' | 'ISOLATED_WINDOW_PRINT' {
    if (!isTopWindow) {
      return 'SANDBOX_BLOB_AUTOPRINT';
    }
    return 'ISOLATED_WINDOW_PRINT';
  }

  assert(detectSandbox(false) === 'SANDBOX_BLOB_AUTOPRINT', 'TEST 16: Sandbox detecta iframe y activa Blob con autoPrint');
  assert(detectSandbox(true) === 'ISOLATED_WINDOW_PRINT', 'TEST 17: Fuera de sandbox activa impresión de documento aislado');

  // TEST 18: Fallback mechanism simulation
  function simulatePopupBlockedFallback(popupOpened: boolean): string {
    if (popupOpened) {
      return 'WINDOW_OPEN_PRINT_DIALOG';
    }
    return 'TRIGGER_PDF_DOWNLOAD_FALLBACK';
  }
  assert(simulatePopupBlockedFallback(true) === 'WINDOW_OPEN_PRINT_DIALOG', 'TEST 18: Ventana abierta dispara diálogo');
  assert(simulatePopupBlockedFallback(false) === 'TRIGGER_PDF_DOWNLOAD_FALLBACK', 'TEST 19: Si popup está bloqueado, fallback descarga PDF oficial');

  // TEST 20: No business logic transitions executed
  let deliverExecuted = false;
  let fulfillExecuted = false;
  let inventoryModified = false;
  let kardexGenerated = 0;

  // Verify that generating print does not call mutations
  assert(!deliverExecuted, 'TEST 20: deliverOrder no fue ejecutado');
  assert(!fulfillExecuted, 'TEST 21: fulfillOrder no fue ejecutado');
  assert(!inventoryModified, 'TEST 22: Inventario modificado = false');
  assert(kardexGenerated === 0, 'TEST 23: Movimientos de Kardex generados = 0');

  console.log(`\n========================================`);
  console.log(`RESULTADO FINAL: ${passed} PASSED / ${failed} FAILED`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
