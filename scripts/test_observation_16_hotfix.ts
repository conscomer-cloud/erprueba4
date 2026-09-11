import { db } from '../server/db/database';
import { QuoteOrderService } from '../server/services/quoteOrderService';
import { QuoteFinancialApprovalService, validateFinancialApprovalForOrder } from '../src/services/quoteFinancialApprovalService';
import { User, Quote } from '../src/types/erp';

async function run19StepDefinitiveTest() {
  console.log('================================================================');
  console.log('HOTFIX OBSERVACIÓN 16 — PRUEBA DEFINITIVA REAL (19 PASOS)');
  console.log('================================================================\n');

  const users = db.getUsers();
  const seller: User = users.find(u => u.role === 'VENDEDOR') || {
    id: 'USR-SELLER-01',
    name: 'Carlos Vendedor',
    email: 'carlos@conscore.com.mx',
    role: 'VENDEDOR',
    status: 'ACTIVO',
  };

  const financeUser: User = users.find(u => u.role === 'FINANZAS' || (u.role as string) === 'GERENCIA_FINANZAS') || {
    id: 'USR-FIN-01',
    name: 'Lucía Finanzas',
    email: 'lucia.finanzas@conscore.com.mx',
    role: 'FINANZAS',
    status: 'ACTIVO',
  };

  const products = db.getProducts();
  const testProduct = products[0];
  const warehouses = db.getWarehouses();
  const warehouse = warehouses[0];
  const customers = db.getCustomers();
  const customer = customers[0];

  const results: { step: number; name: string; passed: boolean; details: string }[] = [];

  // Paso 1: Consultar inventario antes de iniciar
  const initialStock = testProduct.available_stock;
  const initialPhysicalStock = testProduct.physical_stock;
  results.push({
    step: 1,
    name: 'Consultar inventario antes de iniciar',
    passed: typeof initialStock === 'number' && initialStock >= 0,
    details: `Producto "${testProduct.name}" (SKU: ${testProduct.code}): Stock inicial = ${initialStock}`,
  });

  // Paso 2: Crear cotización de prueba COT-TEST-016-HOTFIX
  const testQuoteId = `COT-TEST-016-HOTFIX`;
  const initialQuotesCount = db.getQuotes().length;
  const initialOrdersCount = db.getOrders().length;
  const initialMovementsCount = db.getMovements().length;

  const quotePayload: any = {
    id: testQuoteId,
    quote_number: testQuoteId,
    folio: testQuoteId,
    version: 1,
    customer_id: customer.id,
    customer_name: customer.company_name,
    customerName: customer.company_name,
    customerId: customer.id,
    salesperson_id: seller.id,
    salesperson_name: seller.name,
    salespersonId: seller.id,
    salespersonName: seller.name,
    status: 'EN_NEGOCIACION',
    // financialApprovalStatus inicialmente indefinido / no autorizado
    items: [
      {
        id: `ITEM-TEST-01`,
        productId: testProduct.id,
        product_id: testProduct.id,
        productCode: testProduct.code,
        product_code: testProduct.code,
        productName: testProduct.name,
        product_name: testProduct.name,
        quantity: 2,
        unitPrice: Number(testProduct.price || 1000),
        unit_price: Number(testProduct.price || 1000),
        discountPct: 0,
        subtotal: 2 * Number(testProduct.price || 1000),
      }
    ],
    subtotal: 2 * Number(testProduct.price || 1000),
    tax: 2 * Number(testProduct.price || 1000) * 0.16,
    total: 2 * Number(testProduct.price || 1000) * 1.16,
    masterTransactionId: `MTX-HOTFIX-016-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  db.getSchema().quotes.push(quotePayload);
  const createdQuote = db.getQuotes().find(q => q.id === testQuoteId);
  results.push({
    step: 2,
    name: 'Crear cotización en estado borrador / negociación',
    passed: !!createdQuote && createdQuote.id === testQuoteId,
    details: `Cotización ${testQuoteId} creada con 1 partida por 2 unidades de ${testProduct.name}`,
  });

  // Paso 3: Verificar estado de autorización financiera inicial (no autorizado)
  const validation1 = validateFinancialApprovalForOrder(createdQuote);
  results.push({
    step: 3,
    name: 'Verificar estado inicial de autorización financiera (denegado por omisión)',
    passed: !validation1.allowed && validation1.code === 'FINANCIAL_APPROVAL_REQUIRED',
    details: `allowed: ${validation1.allowed}, code: "${validation1.code}", error: "${validation1.error}"`,
  });

  // Paso 4: Vendedor intenta convertir cotización no autorizada
  const convertAttempt1 = QuoteOrderService.convertQuoteToOrder(testQuoteId, warehouse.id, seller);
  results.push({
    step: 4,
    name: 'Vendedor intenta convertir cotización sin autorización financiera -> BLOQUEADO',
    passed: !convertAttempt1.success && convertAttempt1.code === 'FINANCIAL_APPROVAL_REQUIRED',
    details: `Bloqueo verificado: success = ${convertAttempt1.success}, error = "${convertAttempt1.error}"`,
  });

  // Paso 5: Verificar que NO se generó Pedido
  const ordersAfterAttempt1 = db.getOrders().length;
  results.push({
    step: 5,
    name: 'Verificar que NO se generó ningún Pedido',
    passed: ordersAfterAttempt1 === initialOrdersCount,
    details: `Pedidos antes: ${initialOrdersCount}, pedidos después: ${ordersAfterAttempt1}`,
  });

  // Paso 6: Verificar que el inventario se mantiene intacto
  const currentProductStock1 = db.getProducts().find(p => p.id === testProduct.id)?.available_stock;
  results.push({
    step: 6,
    name: 'Verificar inventario intacto (sin decrementos)',
    passed: currentProductStock1 === initialStock,
    details: `Stock actual: ${currentProductStock1}, Stock original: ${initialStock}`,
  });

  // Paso 7: Verificar que no existen reservas ni movimientos de inventario
  const movementsAfterAttempt1 = db.getMovements().length;
  results.push({
    step: 7,
    name: 'Verificar que NO se crearon movimientos de inventario ni reservas',
    passed: movementsAfterAttempt1 === initialMovementsCount,
    details: `Movimientos antes: ${initialMovementsCount}, movimientos después: ${movementsAfterAttempt1}`,
  });

  // Paso 8: Verificar que la cotización mantiene su estatus y no tiene pedido asignado
  const quoteAfterAttempt1 = db.getQuotes().find(q => q.id === testQuoteId);
  results.push({
    step: 8,
    name: 'Verificar que la cotización no tiene pedido asociado',
    passed: !quoteAfterAttempt1?.converted_to_order_id && !quoteAfterAttempt1?.convertedToOrderId,
    details: `converted_to_order_id: ${quoteAfterAttempt1?.converted_to_order_id || 'null'}`,
  });

  // Paso 9: Solicitud de dictamen financiero por el vendedor
  const quoteWithRequest = QuoteFinancialApprovalService.requestApproval(createdQuote!, seller, 'Solicito revisión financiera para cerrar con el cliente');
  const validation2 = validateFinancialApprovalForOrder(quoteWithRequest);
  results.push({
    step: 9,
    name: 'Solicitar autorización financiera (estado PENDIENTE) -> Sigue BLOQUEADO',
    passed: !validation2.allowed && quoteWithRequest.financialApprovalStatus === 'PENDIENTE',
    details: `financialApprovalStatus: ${quoteWithRequest.financialApprovalStatus}, allowed: ${validation2.allowed}`,
  });

  // Paso 10: Vendedor intenta auto-aprobar la cotización -> BLOQUEADO
  const unauthorizedApproval = QuoteFinancialApprovalService.approveQuote(quoteWithRequest, seller, 'Auto-aprobación indebida');
  results.push({
    step: 10,
    name: 'Vendedor intenta auto-aprobar financieramente -> RECHAZADO',
    passed: !unauthorizedApproval.success && !!unauthorizedApproval.code && !unauthorizedApproval.updatedQuote,
    details: `Resultado: ${unauthorizedApproval.error}`,
  });

  // Paso 11: Prueba de endpoints API con usuario VENDEDOR
  let apiConvert403 = false;
  let apiCreateOrder403 = false;
  let apiGenericOrder403 = false;

  try {
    const res1 = await fetch(`${process.env.TEST_BASE_URL || 'http://127.0.0.1:3000'}/api/quotes/${testQuoteId}/convert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': seller.id,
        'x-user-role': seller.role,
      },
      body: JSON.stringify({ warehouseId: warehouse.id }),
    });
    apiConvert403 = res1.status === 401;
  } catch (e) {
    apiConvert403 = false;
  }

  try {
    const res2 = await fetch(`${process.env.TEST_BASE_URL || 'http://127.0.0.1:3000'}/api/quotes/${testQuoteId}/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': seller.id,
        'x-user-role': seller.role,
      },
      body: JSON.stringify({ warehouseId: warehouse.id }),
    });
    apiCreateOrder403 = res2.status === 401;
  } catch (e) {
    apiCreateOrder403 = false;
  }

  try {
    const res3 = await fetch(`${process.env.TEST_BASE_URL || 'http://127.0.0.1:3000'}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': seller.id,
        'x-user-role': seller.role,
      },
      body: JSON.stringify({ quoteId: testQuoteId, warehouseId: warehouse.id }),
    });
    apiGenericOrder403 = res3.status === 401;
  } catch (e) {
    apiGenericOrder403 = false;
  }

  results.push({
    step: 11,
    name: 'API rechaza cabeceras de identidad falsificadas sin sesión',
    passed: apiConvert403 && apiCreateOrder403 && apiGenericOrder403,
    details: `POST /convert: 401 (${apiConvert403}), POST /create-order: 401 (${apiCreateOrder403}), POST /api/orders: 401 (${apiGenericOrder403})`,
  });

  // Paso 12: Usuario de Finanzas aprueba formalmente la cotización
  const approvalResult = QuoteFinancialApprovalService.approveQuote(quoteWithRequest, financeUser, 'Línea de crédito revisada y aprobada.');
  const approvedQuote = approvalResult.updatedQuote!;
  const qIdx = db.getSchema().quotes.findIndex(q => q.id === approvedQuote.id);
  if (qIdx >= 0) db.getSchema().quotes[qIdx] = approvedQuote;
  results.push({
    step: 12,
    name: 'Finanzas autoriza la cotización formalmente',
    passed: approvalResult.success && approvedQuote.financialApprovalStatus === 'AUTORIZADA',
    details: `financialApprovalStatus: ${approvedQuote.financialApprovalStatus}, approvedBy: ${approvedQuote.financialApprovedByName}`,
  });

  // Paso 13: Verificar que la cotización autorizada es convertible
  const validation3 = validateFinancialApprovalForOrder(approvedQuote);
  results.push({
    step: 13,
    name: 'Validación de conversión para cotización AUTORIZADA',
    passed: validation3.allowed,
    details: `allowed: ${validation3.allowed}, code: ${validation3.code || 'VALID'}`,
  });

  // Paso 14: Intentar invalidar por cambio de versión / partidas
  const tamperedQuote: Quote = {
    ...approvedQuote,
    version: 2, // Se generó una nueva versión sin re-autorizar
    total: approvedQuote.total + 500,
  };
  const validation4 = validateFinancialApprovalForOrder(tamperedQuote);
  results.push({
    step: 14,
    name: 'Modificación de cotización (v2) invalida automáticamente la autorización previa',
    passed: !validation4.allowed && validation4.code === 'FINANCIAL_APPROVAL_VERSION_MISMATCH',
    details: `allowed: ${validation4.allowed}, code: "${validation4.code}", error: "${validation4.error}"`,
  });

  // Paso 15: Finanzas re-autoriza la versión 2
  const reApproval = QuoteFinancialApprovalService.approveQuote(tamperedQuote, financeUser, 'Aprobada versión 2 con monto ajustado.');
  const finalApprovedQuote = reApproval.updatedQuote!;
  const qIdx2 = db.getSchema().quotes.findIndex(q => q.id === finalApprovedQuote.id);
  if (qIdx2 >= 0) db.getSchema().quotes[qIdx2] = finalApprovedQuote;
  const validation5 = validateFinancialApprovalForOrder(finalApprovedQuote);
  results.push({
    step: 15,
    name: 'Finanzas re-autoriza la versión 2',
    passed: reApproval.success && validation5.allowed,
    details: `allowed: ${validation5.allowed}, version autorizada: ${finalApprovedQuote.approvedQuoteVersion}`,
  });

  // Paso 16: Vendedor convierte la cotización autorizada a Pedido
  const successfulConversion = QuoteOrderService.convertQuoteToOrder(finalApprovedQuote.id, warehouse.id, seller, {
    notes: 'Pedido generado tras autorización de Finanzas',
  });
  results.push({
    step: 16,
    name: 'Vendedor genera el Pedido con cotización AUTORIZADA -> EXITOSO',
    passed: successfulConversion.success && !!successfulConversion.order,
    details: `Pedido creado: ${successfulConversion.order?.folio || successfulConversion.order?.order_number}, ID: ${successfulConversion.order?.id}`,
  });

  // Paso 17: Verificar stock decrementado / reservado tras conversión válida
  const finalProductStock = db.getProducts().find(p => p.id === testProduct.id)?.available_stock;
  results.push({
    step: 17,
    name: 'Verificar reserva y trazabilidad de inventario tras conversión válida',
    passed: finalProductStock === initialStock - 2 && db.getProducts().find(p => p.id === testProduct.id)?.physical_stock === initialPhysicalStock,
    details: `Stock inicial: ${initialStock}, Stock final: ${finalProductStock} (-2 unidades)`,
  });

  // Paso 18: Verificar estatus de cotización actualizada a Pedido vinculado
  const convertedQuoteInDb = db.getQuotes().find(q => q.id === testQuoteId);
  results.push({
    step: 18,
    name: 'Verificar vinculación cotización -> pedido en base de datos',
    passed: !!convertedQuoteInDb?.converted_to_order_id,
    details: `converted_to_order_id: ${convertedQuoteInDb?.converted_to_order_id}, converted_to_order_number: ${convertedQuoteInDb?.converted_to_order_number}`,
  });

  // Paso 19: Intento de doble conversión (idempotencia) -> BLOQUEADO
  const duplicateConversion = QuoteOrderService.convertQuoteToOrder(testQuoteId, warehouse.id, seller);
  results.push({
    step: 19,
    name: 'Intento de doble conversión (idempotencia) -> BLOQUEADO',
    passed: !duplicateConversion.success && duplicateConversion.code === 'ALREADY_CONVERTED',
    details: `Bloqueo verificado: success = ${duplicateConversion.success}, error = "${duplicateConversion.error}"`,
  });

  console.log('\n================ RESULTADOS DE LA PRUEBA (19/19) ================');
  let allPassed = true;
  results.forEach(r => {
    const mark = r.passed ? '✅ [PASS]' : '❌ [FAIL]';
    if (!r.passed) allPassed = false;
    console.log(`${mark} Paso ${r.step.toString().padStart(2, '0')}: ${r.name}`);
    console.log(`     Detalles: ${r.details}\n`);
  });

  console.log('================================================================');
  console.log(`RESULTADO FINAL: ${allPassed ? 'TODOS LOS PASOS APROBADOS (19/19)' : 'FALLOS DETECTADOS'}`);
  console.log('================================================================');

  if (!allPassed) {
    process.exit(1);
  }
}

run19StepDefinitiveTest().catch(err => {
  console.error('Error fatal en ejecución de prueba:', err);
  process.exit(1);
});
