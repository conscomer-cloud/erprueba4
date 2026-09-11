/**
 * Verifica la revisión previa al timbrado.
 *
 * No se timbra nada: no hay credenciales ni debe haberlas en una prueba
 * automática. Lo que se comprueba es que ningún pedido incompleto llegue a
 * consumir un timbre.
 *
 *   npx tsx scripts/verificar-facturacion.ts
 */

import { buildStampPreview, isFiscalapiConfigured, getEnvironment } from '../server/services/fiscalapiService';
import { db } from '../server/db/database';

let fallos = 0;
const check = (nombre: string, ok: boolean, detalle = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FALLA'} ${nombre}${detalle ? ` — ${detalle}` : ''}`);
  if (!ok) fallos++;
};

const tieneFalta = (issues: any[], campo: string) => issues.some((i) => i.field === campo);

console.log('\n=== Configuración ===');
check('sin credenciales se reporta no configurado', !isFiscalapiConfigured());
check('por defecto apunta a pruebas, no a producción', getEnvironment() === 'PRUEBAS', getEnvironment());

// --- Escenario: catálogo sin datos fiscales (el estado actual del ERP) ---
const orders: any[] = db.getOrders();
const customers: any[] = db.getCustomers();
const products: any[] = db.getProducts();

if (orders.length === 0) {
  console.error('El seed no tiene pedidos para probar.');
  process.exit(1);
}

const pedido = orders[0];

console.log('\n=== Pedido con el catálogo tal como está hoy ===');
const p1 = buildStampPreview(String(pedido.id));
check('no se permite timbrar', !p1.canStamp);
check('se reportan varios faltantes, no solo el primero', p1.issues.length > 1, `${p1.issues.length} faltantes`);
check('avisa que FiscalAPI no está configurado', tieneFalta(p1.issues, 'FISCALAPI_KEY'));
check('detecta la falta de ClaveProdServ', tieneFalta(p1.issues, 'satProductCode'));
check('detecta la falta de ClaveUnidad', tieneFalta(p1.issues, 'satUnitCode'));
check('detecta la falta de régimen fiscal del cliente', tieneFalta(p1.issues, 'satTaxRegimeCode'));
check('detecta la falta de uso de CFDI', tieneFalta(p1.issues, 'satCfdiUseCode'));
check('detecta la falta de código postal fiscal', tieneFalta(p1.issues, 'fiscalZipCode'));
check('devuelve un borrador aunque falten datos', p1.draft !== null, 'permite revisar antes de corregir');
check('los faltantes traen el nombre de la entidad',
  p1.issues.filter((i) => i.scope === 'PRODUCTO').every((i) => !!i.entityName));

console.log('\n=== Se completan los datos fiscales ===');
process.env.FISCALAPI_ISSUER_TIN = 'IEG130930AP4';
process.env.FISCALAPI_ISSUER_NAME = 'CONSCOMER SA DE CV';
process.env.FISCALAPI_ISSUER_REGIME = '601';
process.env.FISCALAPI_EXPEDITION_ZIP = '42850';

const cliente = customers.find((c: any) => String(c.id) === String(pedido.customer_id ?? pedido.customerId));
if (cliente) {
  cliente.rfc = 'XAXX010101000';
  cliente.satTaxRegimeCode = '601';
  cliente.satCfdiUseCode = 'G01';
  cliente.fiscalZipCode = '06600';
  cliente.fiscalLegalName = 'CLIENTE DE PRUEBA SA DE CV';
}
products.forEach((p: any) => {
  p.satProductCode = '30111500';
  p.satUnitCode = 'H87';
  p.vatRate = 0.16;
});

const p2 = buildStampPreview(String(pedido.id));
const restantes = p2.issues.filter((i) => i.scope !== 'CONFIGURACION' && i.field !== 'total');
check('desaparecen los faltantes de catálogo', restantes.length === 0,
  restantes.length ? restantes.map((i) => i.field).join(', ') : 'ninguno');
check('el borrador arma los conceptos', (p2.draft?.items.length || 0) > 0, `${p2.draft?.items.length} concepto(s)`);
check('calcula IVA al 16 por ciento',
  Math.abs((p2.draft?.vat || 0) - (p2.draft?.subtotal || 0) * 0.16) < 0.02,
  `subtotal ${p2.draft?.subtotal} · IVA ${p2.draft?.vat}`);
check('el total es subtotal más IVA',
  Math.abs((p2.draft?.total || 0) - ((p2.draft?.subtotal || 0) + (p2.draft?.vat || 0))) < 0.02);

console.log('\n=== RFC inválido ===');
if (cliente) {
  cliente.rfc = 'ESTO-NO-ES-RFC';
  const p3 = buildStampPreview(String(pedido.id));
  check('rechaza un RFC con formato inválido', tieneFalta(p3.issues, 'rfc'));
  cliente.rfc = 'XAXX010101000';
}

console.log('\n=== Código postal inválido ===');
if (cliente) {
  cliente.fiscalZipCode = '123';
  const p4 = buildStampPreview(String(pedido.id));
  check('rechaza un CP que no tiene 5 dígitos', tieneFalta(p4.issues, 'fiscalZipCode'));
  cliente.fiscalZipCode = '06600';
}

console.log('\n=== El total del CFDI debe cuadrar con el del pedido ===');
const totalOriginal = pedido.total;
pedido.total = 999999;
const p5 = buildStampPreview(String(pedido.id));
check('detecta descuadre entre el CFDI y el pedido', tieneFalta(p5.issues, 'total'));
pedido.total = totalOriginal;

console.log('\n=== Doble facturación ===');
const schema: any = db.getSchema();
schema.cfdi_invoices = [
  {
    id: 'CFDI-TEST', orderId: String(pedido.id), orderFolio: 'X', customerId: '', customerName: '',
    uuid: 'AAAA-BBBB-CCCC-DDDD', fiscalapiId: 'x', series: 'A', number: '1', total: 100,
    currency: 'MXN', status: 'TIMBRADO', stampedAt: new Date().toISOString(),
    stampedByUserId: 'u', stampedByUserName: 'u', environment: 'PRUEBAS',
  },
];
const p6 = buildStampPreview(String(pedido.id));
check('bloquea facturar un pedido que ya tiene CFDI vigente', tieneFalta(p6.issues, 'uuid'));
check('el mensaje incluye el folio fiscal existente',
  p6.issues.some((i) => i.message.includes('AAAA-BBBB-CCCC-DDDD')));

schema.cfdi_invoices = [];

console.log('\n=== Pedido inexistente ===');
const p7 = buildStampPreview('NO-EXISTE');
check('no revienta con un id inválido', p7.canStamp === false && p7.draft === null);

console.log(`\n${fallos === 0 ? 'Todas las comprobaciones pasan' : `${fallos} comprobación(es) fallan`}.`);
process.exit(fallos === 0 ? 0 : 1);
