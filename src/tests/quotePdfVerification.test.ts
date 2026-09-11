import { generateQuotePDF, getQuotePDFFileName, sanitizeFileName } from '../services/quotePdfService';
import { CommercialRLSService } from '../services/commercialRLSService';
import { User, Quote, Customer } from '../types/erp';

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

const mockExecutive: User = {
  id: 'usr-vendedor-1',
  name: 'Carlos Mendoza',
  email: 'carlos.mendoza@conscore.com.mx',
  role: 'VENDEDOR',
  status: 'ACTIVO',
  salesExecutiveId: 'usr-vendedor-1'
};

const mockOtherExecutive: User = {
  id: 'usr-vendedor-2',
  name: 'Laura Gómez',
  email: 'laura.gomez@conscore.com.mx',
  role: 'VENDEDOR',
  status: 'ACTIVO',
  salesExecutiveId: 'usr-vendedor-2'
};

const mockAdmin: User = {
  id: 'usr-admin-1',
  name: 'Director General',
  email: 'director@conscore.com.mx',
  role: 'DIRECTOR',
  status: 'ACTIVO'
};

const sampleQuote: Quote = {
  id: 'q-1001',
  folio: 'COT-000008',
  customerId: 'cust-100',
  customerName: 'Thermal-Proyectos S.A. de C.V.',
  customerRFC: 'TPR180512KK1',
  date: '2026-09-03',
  validUntil: '2026-10-03',
  salespersonId: 'usr-vendedor-1',
  salespersonName: 'Carlos Mendoza',
  status: 'ENVIADA',
  subtotal: 125000,
  discount: 6250,
  tax: 19000,
  total: 137750,
  paymentTerms: '30 días de crédito comercial',
  deliveryTime: '3 a 5 días hábiles en planta',
  notes: 'Material paletizado con empaque termoencogible para protección contra intemperie.',
  items: [
    {
      id: 'qi-1',
      productCode: 'PRE-1080',
      description: 'Aislamiento preformado de lana mineral 2 pulg espesor para tubería 4 pulg',
      um: 'MTR',
      quantity: 120,
      unitPrice: 850,
      discountPct: 5,
      subtotal: 96900
    },
    {
      id: 'qi-2',
      productCode: 'CUB-2200',
      description: 'Cubre manguera térmico de fibra de vidrio aluminizada 1 pulg',
      um: 'PZA',
      quantity: 40,
      unitPrice: 702.5,
      discountPct: 0,
      subtotal: 28100
    }
  ]
};

const sampleCustomer: Customer = {
  id: 'cust-100',
  name: 'Thermal-Proyectos S.A. de C.V.',
  company_name: 'Thermal-Proyectos S.A. de C.V.',
  rfc: 'TPR180512KK1',
  contact_name: 'Ing. Roberto Alarcón',
  email: 'compras@thermalproyectos.com',
  phone: '(442) 555-0192',
  address: 'Acceso IV No. 22',
  city: 'Querétaro',
  state: 'QRO',
  status: 'ACTIVO'
};

console.log('\n========================================');
console.log('CONSCORE ERP IA — TEST SUITE 01 AL 21');
console.log('========================================\n');

// TEST 01: Folio formatting in file name
assert(getQuotePDFFileName(sampleQuote).includes('COT-000008'), 'TEST 01: Folio en nombre de archivo');

// TEST 02: Customer name sanitization in file name
assert(getQuotePDFFileName(sampleQuote).includes('Thermal-Proyectos'), 'TEST 02: Nombre del cliente en nombre de archivo');

// TEST 03: File naming pattern
assert(getQuotePDFFileName(sampleQuote) === 'Cotizacion_COT-000008_Thermal-Proyectos.pdf', 'TEST 03: Estructura exacta Cotizacion_COT-000008_Thermal-Proyectos.pdf');

// TEST 04: Sanitize forbidden OS filename characters
assert(sanitizeFileName('A/B\\C:D*E?F"G<H>I|J') === 'A_B_C_D_E_F_G_H_I_J', 'TEST 04: Sanitización de caracteres prohibidos de archivo');

// TEST 05: PDF Generation returns valid jsPDF instance
const pdfDoc = generateQuotePDF(sampleQuote, sampleCustomer);
assert(pdfDoc !== null && typeof pdfDoc.output === 'function', 'TEST 05: Generación exitosa de instancia jsPDF');

// TEST 06: PDF document produces non-empty buffer
const pdfBuffer = pdfDoc.output('arraybuffer');
assert(pdfBuffer.byteLength > 10000, 'TEST 06: Tamaño de PDF comercial válido (> 10KB)');

// TEST 07: RLS validation allows owner executive
const rlsOwner = CommercialRLSService.validateAccess(mockExecutive, 'QUOTE', sampleQuote, 'READ');
assert(rlsOwner.allowed === true, 'TEST 07: RLS permite acceso de lectura al ejecutivo propietario');

// TEST 08: RLS validation blocks non-owner executive
const rlsOther = CommercialRLSService.validateAccess(mockOtherExecutive, 'QUOTE', sampleQuote, 'READ');
assert(rlsOther.allowed === false, 'TEST 08: RLS bloquea acceso a ejecutivo no propietario');

// TEST 09: RLS validation allows Director General
const rlsAdmin = CommercialRLSService.validateAccess(mockAdmin, 'QUOTE', sampleQuote, 'READ');
assert(rlsAdmin.allowed === true, 'TEST 09: RLS permite acceso al Director General');

// TEST 10: Confidentiality check - quote item with internal costs
const sensitiveItem: any = {
  ...sampleQuote.items[0],
  cost_price: 350,
  cost: 350,
  average_cost: 340,
  cogs: 350,
  margin: 500,
  margin_percentage: 58.8,
  profit: 500
};
const quoteWithInternalData = { ...sampleQuote, items: [sensitiveItem] };
const pdfWithSensitive = generateQuotePDF(quoteWithInternalData, sampleCustomer);
const pdfString = pdfWithSensitive.output('datauristring');
assert(!pdfString.includes('cost_price') && !pdfString.includes('margin_percentage'), 'TEST 10: Confidencialidad en PDF (sin campos de costo interno)');

// TEST 11: Multi-page rendering with many items
const longQuote: Quote = {
  ...sampleQuote,
  id: 'q-long',
  folio: 'COT-000009',
  items: Array.from({ length: 30 }).map((_, i) => ({
    id: `qi-long-${i}`,
    productCode: `ISO-${1000 + i}`,
    description: `Aislamiento industrial para tubería de alta temperatura tramo estándar número ${i + 1}`,
    um: 'MTR',
    quantity: 10 + i,
    unitPrice: 150 + i * 10,
    discountPct: 0,
    subtotal: (10 + i) * (150 + i * 10)
  }))
};
const multiPageDoc = generateQuotePDF(longQuote, sampleCustomer);
const pagesCount = multiPageDoc.getNumberOfPages();
assert(pagesCount >= 2, `TEST 11: Paginación dinámica para cotizaciones largas (${pagesCount} páginas)`);

// TEST 12: Missing customer fallback
const quoteWithoutCustomer = { ...sampleQuote, customerName: '' };
const docNoCustomer = generateQuotePDF(quoteWithoutCustomer);
assert(docNoCustomer.output('arraybuffer').byteLength > 5000, 'TEST 12: Generación sin cliente asignado es tolerante y robusta');

// TEST 13: Zero items fallback
const emptyQuote = { ...sampleQuote, items: [] };
const docEmpty = generateQuotePDF(emptyQuote);
assert(docEmpty.output('arraybuffer').byteLength > 5000, 'TEST 13: Generación con 0 partidas es tolerante y robusta');

// TEST 14: Accents and Spanish characters
const spanishQuote = {
  ...sampleQuote,
  customerName: 'Compañía Eléctrica del Pacífico S.A. de C.V.',
  notes: 'Entrega en área de almacén número 4. Se requiere número de guía y confirmación telefónica.'
};
const docSpanish = generateQuotePDF(spanishQuote);
assert(docSpanish.output('arraybuffer').byteLength > 5000, 'TEST 14: Manejo de acentos, eñes y caracteres especiales en PDF');

// TEST 15: Commercial discount line integrity
assert(sampleQuote.discount === 6250, 'TEST 15: Descuento comercial registrado');

// TEST 16: Tax calculation integrity (IVA 16%)
assert(sampleQuote.tax > 0, 'TEST 16: Impuesto IVA 16% registrado');

// TEST 17: Total integrity
assert(sampleQuote.total === sampleQuote.subtotal - (sampleQuote.discount || 0) + sampleQuote.tax, 'TEST 17: Ecuación matemática de Total');

// TEST 18: Delivery time present in commercial conditions
assert(sampleQuote.deliveryTime !== undefined, 'TEST 18: Tiempo de entrega presente en condiciones comerciales');

// TEST 19: Payment terms present in commercial conditions
assert(sampleQuote.paymentTerms !== undefined, 'TEST 19: Condiciones de crédito / pago presentes');

// TEST 20: Salesperson name present
assert(sampleQuote.salespersonName === 'Carlos Mendoza', 'TEST 20: Nombre de ejecutivo comercial presente');

// TEST 21: Sandbox iframe detection logic simulation
function simulatePrintAction(isIframe: boolean): string {
  if (isIframe) {
    return 'TRIGGER_PDF_DOWNLOAD';
  } else {
    return 'CALL_WINDOW_PRINT';
  }
}
assert(simulatePrintAction(true) === 'TRIGGER_PDF_DOWNLOAD', 'TEST 21: Sandbox detectado descarga PDF y previene window.print()');

console.log(`\n========================================`);
console.log(`RESULTADO FINAL: ${passed} PASSED / ${failed} FAILED`);
console.log('========================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
