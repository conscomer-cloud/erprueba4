/**
 * Facturación electrónica CFDI 4.0 mediante FiscalAPI.
 *
 * Usa el SDK oficial de Node (`fiscalapi`), no llamadas HTTP crudas: el SDK
 * trae los tipos del CFDI y evita reescribir el contrato de la API.
 *
 * La pieza central de este módulo no es el timbrado, es la validación previa.
 * Cada timbre cuesta y un CFDI mal emitido no se corrige: se cancela y se
 * vuelve a emitir, con el desorden contable que eso arrastra. Por eso ningún
 * pedido llega al SAT sin que antes se revise que trae todo lo que la
 * autoridad exige.
 */

import { FiscalapiClient, type IFiscalapiClient } from 'fiscalapi';
import { db } from '../db/database';

export interface FiscalapiConfig {
  apiUrl: string;
  apiKey: string;
  tenant: string;
  apiVersion: string;
  timeZone: string;
  debug: boolean;
}

/** Estado del CFDI dentro del ERP. */
export type CfdiStatus = 'TIMBRADO' | 'CANCELADO' | 'ERROR';

export interface CfdiRecord {
  id: string;
  orderId: string;
  orderFolio: string;
  customerId: string;
  customerName: string;
  /** Folio fiscal que asigna el SAT. */
  uuid: string;
  /** Identificador de la factura dentro de FiscalAPI. */
  fiscalapiId: string;
  series: string;
  number: string;
  total: number;
  currency: string;
  status: CfdiStatus;
  stampedAt: string;
  stampedByUserId: string;
  stampedByUserName: string;
  environment: 'PRUEBAS' | 'PRODUCCION';
  cancelledAt?: string;
  cancellationReason?: string;
  errorMessage?: string;
}

export interface ValidationIssue {
  /** Dónde está el faltante, para poder llevar al usuario a corregirlo. */
  scope: 'EMISOR' | 'CLIENTE' | 'PEDIDO' | 'PRODUCTO' | 'CONFIGURACION';
  entityId?: string;
  entityName?: string;
  field: string;
  message: string;
}

export interface StampPreview {
  canStamp: boolean;
  issues: ValidationIssue[];
  /** Borrador listo para revisar antes de enviar al SAT. */
  draft: {
    series: string;
    currency: string;
    paymentFormCode: string;
    paymentMethodCode: string;
    expeditionZipCode: string;
    recipient: { tin: string; legalName: string; taxRegimeCode: string; cfdiUseCode: string; zipCode: string };
    items: {
      description: string;
      quantity: number;
      unitPrice: number;
      satProductCode: string;
      satUnitCode: string;
      vatRate: number;
      amount: number;
    }[];
    subtotal: number;
    vat: number;
    total: number;
  } | null;
}

// ---------------------------------------------------------------------------
// Configuración
// ---------------------------------------------------------------------------

export function getFiscalapiConfig(): FiscalapiConfig {
  return {
    // Por defecto apunta al ambiente de pruebas. Pasar a producción es una
    // decisión explícita: en vivo cada timbre se descuenta y los CFDI son
    // documentos fiscales reales.
    apiUrl: process.env.FISCALAPI_URL || 'https://test.fiscalapi.com',
    apiKey: process.env.FISCALAPI_KEY || '',
    tenant: process.env.FISCALAPI_TENANT || '',
    apiVersion: process.env.FISCALAPI_API_VERSION || 'v4',
    timeZone: process.env.FISCALAPI_TIMEZONE || 'America/Mexico_City',
    debug: process.env.FISCALAPI_DEBUG === 'true',
  };
}

export function isFiscalapiConfigured(): boolean {
  const c = getFiscalapiConfig();
  return Boolean(c.apiKey && c.tenant);
}

export function getEnvironment(): 'PRUEBAS' | 'PRODUCCION' {
  return getFiscalapiConfig().apiUrl.includes('live.') ? 'PRODUCCION' : 'PRUEBAS';
}

let client: IFiscalapiClient | null = null;

function getClient(): IFiscalapiClient {
  if (!isFiscalapiConfigured()) {
    throw new Error(
      'FiscalAPI no está configurado. Faltan FISCALAPI_KEY y FISCALAPI_TENANT en las variables de entorno.'
    );
  }
  if (!client) {
    const c = getFiscalapiConfig();
    client = FiscalapiClient.create({
      apiUrl: c.apiUrl,
      apiKey: c.apiKey,
      tenant: c.tenant,
      apiVersion: c.apiVersion,
      timeZone: c.timeZone,
      debug: c.debug,
    });
  }
  return client;
}

// ---------------------------------------------------------------------------
// Almacenamiento de CFDI emitidos
// ---------------------------------------------------------------------------

function getStore(): CfdiRecord[] {
  const schema = db.getSchema() as any;
  if (!Array.isArray(schema.cfdi_invoices)) schema.cfdi_invoices = [];
  return schema.cfdi_invoices;
}

export function listCfdi(orderId?: string): CfdiRecord[] {
  const store = getStore();
  const filtrados = orderId ? store.filter((r) => r.orderId === orderId) : store;
  return [...filtrados].sort((a, b) => b.stampedAt.localeCompare(a.stampedAt));
}

/** Un pedido no debe facturarse dos veces sin cancelar el CFDI previo. */
export function findActiveCfdiForOrder(orderId: string): CfdiRecord | undefined {
  return getStore().find((r) => r.orderId === orderId && r.status === 'TIMBRADO');
}

// ---------------------------------------------------------------------------
// Validación previa
// ---------------------------------------------------------------------------

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const RFC_REGEX = /^([A-ZÑ&]{3,4})\d{6}([A-Z\d]{3})$/i;
const CP_REGEX = /^\d{5}$/;

/**
 * Revisa que el pedido tenga todo lo necesario y arma el borrador del CFDI.
 *
 * Devuelve la lista completa de faltantes, no el primero: quien va a corregir
 * el catálogo necesita ver todo de una vez, no descubrirlo error por error.
 */
export function buildStampPreview(orderId: string): StampPreview {
  const issues: ValidationIssue[] = [];

  if (!isFiscalapiConfigured()) {
    issues.push({
      scope: 'CONFIGURACION',
      field: 'FISCALAPI_KEY',
      message: 'No hay credenciales de FiscalAPI. Define FISCALAPI_KEY y FISCALAPI_TENANT antes de timbrar.',
    });
  }

  const order: any = (db.getOrders() || []).find((o: any) => String(o.id) === String(orderId));
  if (!order) {
    issues.push({ scope: 'PEDIDO', entityId: orderId, field: 'id', message: 'El pedido no existe.' });
    return { canStamp: false, issues, draft: null };
  }

  const yaFacturado = findActiveCfdiForOrder(String(order.id));
  if (yaFacturado) {
    issues.push({
      scope: 'PEDIDO',
      entityId: String(order.id),
      field: 'uuid',
      message: `El pedido ya tiene un CFDI vigente (${yaFacturado.uuid}). Cancélalo antes de volver a facturar.`,
    });
  }

  if (String(order.status || '').toUpperCase() === 'CANCELADO') {
    issues.push({ scope: 'PEDIDO', field: 'status', message: 'No se puede facturar un pedido cancelado.' });
  }

  // --- Emisor ---
  // company_config es un objeto de llaves, no una colección de filas.
  const config: any = db.getCompanyConfig() || {};
  const leerConfig = (...claves: string[]): string => {
    for (const k of claves) {
      const v = config[k];
      if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
    }
    return '';
  };

  const issuerTin = (process.env.FISCALAPI_ISSUER_TIN || leerConfig('tax_id', 'rfc')).toUpperCase();
  const issuerLegalName = process.env.FISCALAPI_ISSUER_NAME || leerConfig('company_name', 'razon_social');
  const issuerRegime = process.env.FISCALAPI_ISSUER_REGIME || leerConfig('tax_regime', 'regimen_fiscal');
  const expeditionZipCode = process.env.FISCALAPI_EXPEDITION_ZIP || leerConfig('zip_code', 'codigo_postal');

  if (!RFC_REGEX.test(issuerTin)) {
    issues.push({
      scope: 'EMISOR',
      field: 'rfc',
      message: 'El RFC del emisor no está configurado o no tiene formato válido. Defínelo en FISCALAPI_ISSUER_TIN.',
    });
  }
  if (!issuerLegalName) {
    issues.push({ scope: 'EMISOR', field: 'razonSocial', message: 'Falta la razón social del emisor (FISCALAPI_ISSUER_NAME).' });
  }
  if (!issuerRegime) {
    issues.push({ scope: 'EMISOR', field: 'regimenFiscal', message: 'Falta el régimen fiscal del emisor (FISCALAPI_ISSUER_REGIME). Ej: 601.' });
  }
  if (!CP_REGEX.test(expeditionZipCode)) {
    issues.push({ scope: 'EMISOR', field: 'codigoPostal', message: 'Falta el código postal de expedición a 5 dígitos (FISCALAPI_EXPEDITION_ZIP).' });
  }

  // --- Receptor ---
  const customerId = String(order.customer_id ?? order.customerId ?? '');
  const customer: any = (db.getCustomers() || []).find((c: any) => String(c.id) === customerId);

  let recipient = { tin: '', legalName: '', taxRegimeCode: '', cfdiUseCode: '', zipCode: '' };

  if (!customer) {
    issues.push({ scope: 'CLIENTE', entityId: customerId, field: 'id', message: 'El cliente del pedido no existe en el catálogo.' });
  } else {
    const nombreCliente = customer.company_name || customer.companyName || customer.name || customerId;
    recipient = {
      tin: String(customer.rfc || customer.tax_id || customer.taxId || '').toUpperCase().trim(),
      legalName: String(customer.fiscalLegalName || customer.company_name || customer.companyName || customer.name || '').trim(),
      taxRegimeCode: String(customer.satTaxRegimeCode || ''),
      cfdiUseCode: String(customer.satCfdiUseCode || ''),
      zipCode: String(customer.fiscalZipCode || ''),
    };

    if (!RFC_REGEX.test(recipient.tin)) {
      issues.push({
        scope: 'CLIENTE', entityId: customerId, entityName: nombreCliente, field: 'rfc',
        message: 'El RFC del cliente falta o no tiene formato válido.',
      });
    }
    if (!recipient.legalName) {
      issues.push({
        scope: 'CLIENTE', entityId: customerId, entityName: nombreCliente, field: 'razonSocial',
        message: 'Falta la razón social del cliente tal como aparece en su constancia de situación fiscal.',
      });
    }
    if (!recipient.taxRegimeCode) {
      issues.push({
        scope: 'CLIENTE', entityId: customerId, entityName: nombreCliente, field: 'satTaxRegimeCode',
        message: 'Falta el régimen fiscal del cliente (c_RegimenFiscal). Ej: 601 para persona moral.',
      });
    }
    if (!recipient.cfdiUseCode) {
      issues.push({
        scope: 'CLIENTE', entityId: customerId, entityName: nombreCliente, field: 'satCfdiUseCode',
        message: 'Falta el uso de CFDI (c_UsoCFDI). Ej: G01 para adquisición de mercancías.',
      });
    }
    if (!CP_REGEX.test(recipient.zipCode)) {
      issues.push({
        scope: 'CLIENTE', entityId: customerId, entityName: nombreCliente, field: 'fiscalZipCode',
        message: 'Falta el código postal fiscal del cliente a 5 dígitos. Debe coincidir con su constancia.',
      });
    }
  }

  // --- Conceptos ---
  const productos: any[] = db.getProducts() || [];
  const renglones = order.items || [];

  if (renglones.length === 0) {
    issues.push({ scope: 'PEDIDO', field: 'items', message: 'El pedido no tiene partidas que facturar.' });
  }

  const items = renglones.map((it: any) => {
    const codigo = String(it.product_code ?? it.productCode ?? it.sku ?? '');
    const producto = productos.find((p: any) => String(p.code) === codigo || String(p.id) === String(it.product_id ?? it.productId));
    const nombre = it.product_name || it.productName || producto?.name || codigo;

    const cantidad = num(it.quantity ?? it.quantityOrdered);
    const precio = num(it.unit_price ?? it.unitPrice ?? it.price);

    const satProductCode = String(producto?.satProductCode || '');
    const satUnitCode = String(producto?.satUnitCode || '');
    const vatRate = producto?.vatRate !== undefined ? num(producto.vatRate) : 0.16;

    if (!satProductCode) {
      issues.push({
        scope: 'PRODUCTO', entityId: String(producto?.id || codigo), entityName: nombre, field: 'satProductCode',
        message: `Falta la ClaveProdServ del SAT para ${codigo}. Sin ella el CFDI no se puede timbrar.`,
      });
    }
    if (!satUnitCode) {
      issues.push({
        scope: 'PRODUCTO', entityId: String(producto?.id || codigo), entityName: nombre, field: 'satUnitCode',
        message: `Falta la ClaveUnidad del SAT para ${codigo}. La unidad interna "${producto?.unit || it.unit || ''}" no es una clave válida.`,
      });
    }
    if (cantidad <= 0) {
      issues.push({ scope: 'PEDIDO', entityName: nombre, field: 'quantity', message: `La cantidad de ${codigo} debe ser mayor a cero.` });
    }
    if (precio <= 0) {
      issues.push({ scope: 'PEDIDO', entityName: nombre, field: 'unitPrice', message: `El precio unitario de ${codigo} debe ser mayor a cero.` });
    }

    return {
      description: String(nombre),
      quantity: cantidad,
      unitPrice: precio,
      satProductCode,
      satUnitCode,
      vatRate,
      amount: Math.round(cantidad * precio * 100) / 100,
      taxObjectCode: String(producto?.satTaxObjectCode || '02'),
    };
  });

  const subtotal = Math.round(items.reduce((s: number, i: any) => s + i.amount, 0) * 100) / 100;
  const vat = Math.round(items.reduce((s: number, i: any) => s + i.amount * i.vatRate, 0) * 100) / 100;
  const total = Math.round((subtotal + vat) * 100) / 100;

  // El total calculado debe cuadrar con el del pedido. Una diferencia aquí
  // significa que el ERP y el CFDI dirían cosas distintas del mismo pedido.
  const totalPedido = num(order.total);
  if (totalPedido > 0 && Math.abs(total - totalPedido) > 1) {
    issues.push({
      scope: 'PEDIDO', field: 'total',
      message: `El total calculado para el CFDI (${total.toFixed(2)}) no cuadra con el del pedido (${totalPedido.toFixed(2)}). Revisa descuentos o tasas de IVA antes de timbrar.`,
    });
  }

  return {
    canStamp: issues.length === 0,
    issues,
    draft: {
      series: process.env.FISCALAPI_SERIES || 'A',
      currency: String(order.currency || 'MXN'),
      paymentFormCode: String(order.paymentFormCode || '99'),
      paymentMethodCode: String(order.paymentMethodCode || 'PUE'),
      expeditionZipCode,
      recipient,
      items,
      subtotal,
      vat,
      total,
    },
  };
}

// ---------------------------------------------------------------------------
// Timbrado
// ---------------------------------------------------------------------------

export async function stampOrder(
  orderId: string,
  user: { id: string; name: string; role: string }
): Promise<{ ok: boolean; record?: CfdiRecord; issues?: ValidationIssue[]; error?: string }> {
  const preview = buildStampPreview(orderId);
  if (!preview.canStamp || !preview.draft) {
    return { ok: false, issues: preview.issues, error: 'El pedido no cumple los requisitos para timbrar.' };
  }

  const order: any = (db.getOrders() || []).find((o: any) => String(o.id) === String(orderId));
  const customer: any = (db.getCustomers() || []).find(
    (c: any) => String(c.id) === String(order.customer_id ?? order.customerId)
  );
  const d = preview.draft;

  const invoice: any = {
    versionCode: '4.0',
    series: d.series,
    date: new Date().toISOString(),
    currencyCode: d.currency,
    typeCode: 'I', // Ingreso
    expeditionZipCode: d.expeditionZipCode,
    exportCode: '01', // No aplica exportación
    paymentFormCode: d.paymentFormCode,
    paymentMethodCode: d.paymentMethodCode,
    issuer: {
      tin: process.env.FISCALAPI_ISSUER_TIN,
      legalName: process.env.FISCALAPI_ISSUER_NAME,
      taxRegimeCode: process.env.FISCALAPI_ISSUER_REGIME,
    },
    recipient: {
      tin: d.recipient.tin,
      legalName: d.recipient.legalName,
      taxRegimeCode: d.recipient.taxRegimeCode,
      cfdiUseCode: d.recipient.cfdiUseCode,
      zipCode: d.recipient.zipCode,
      email: customer?.billingEmail || customer?.email || undefined,
    },
    items: d.items.map((i: any) => ({
      itemCode: i.satProductCode,
      quantity: i.quantity,
      unitOfMeasurementCode: i.satUnitCode,
      description: i.description,
      unitPrice: i.unitPrice,
      taxObjectCode: i.taxObjectCode || '02',
      itemTaxes:
        i.vatRate > 0
          ? [{ taxCode: '002', taxTypeCode: 'Tasa', taxRate: i.vatRate, taxFlagCode: 'T' }]
          : [{ taxCode: '002', taxTypeCode: 'Tasa', taxRate: 0, taxFlagCode: 'T' }],
    })),
  };

  try {
    const api = getClient();
    const response = await api.invoices.create(invoice);

    if (!response.succeeded || !response.data) {
      const detalle =
        (response as any).details?.errors ||
        (response as any).validationErrors ||
        response.message ||
        'FiscalAPI rechazó la factura sin detallar el motivo.';
      return { ok: false, error: typeof detalle === 'string' ? detalle : JSON.stringify(detalle) };
    }

    const data: any = response.data;
    const record: CfdiRecord = {
      id: `CFDI-${Date.now().toString(36).toUpperCase()}`,
      orderId: String(order.id),
      orderFolio: String(order.folio ?? order.order_number ?? order.orderNumber ?? order.id),
      customerId: String(customer?.id || ''),
      customerName: d.recipient.legalName,
      uuid: String(data.uuid || ''),
      fiscalapiId: String(data.id || ''),
      series: String(data.series || d.series),
      number: String(data.number ?? data.consecutive ?? ''),
      total: num(data.total ?? d.total),
      currency: d.currency,
      status: 'TIMBRADO',
      stampedAt: new Date().toISOString(),
      stampedByUserId: user.id,
      stampedByUserName: user.name,
      environment: getEnvironment(),
    };

    getStore().push(record);
    db.persist();

    db.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role as any,
      module: 'FINANZAS',
      action: 'CFDI_TIMBRADO',
      entity_type: 'ORDER',
      entity_id: record.orderId,
      new_value: `CFDI ${record.uuid} timbrado por ${record.total} ${record.currency} (${record.environment}).`,
    });

    return { ok: true, record };
  } catch (err: any) {
    console.error('[FiscalAPI] Error al timbrar:', err);
    return { ok: false, error: err?.message || 'No se pudo conectar con FiscalAPI.' };
  }
}

// ---------------------------------------------------------------------------
// Cancelación, PDF, XML y estatus
// ---------------------------------------------------------------------------

export async function cancelCfdi(
  cfdiId: string,
  motiveCode: string,
  replacementUuid: string | undefined,
  user: { id: string; name: string; role: string }
): Promise<{ ok: boolean; error?: string }> {
  const record = getStore().find((r) => r.id === cfdiId);
  if (!record) return { ok: false, error: 'No se encontró el CFDI.' };
  if (record.status === 'CANCELADO') return { ok: false, error: 'El CFDI ya está cancelado.' };

  // El motivo 01 exige indicar el folio del comprobante que lo sustituye.
  if (motiveCode === '01' && !replacementUuid) {
    return { ok: false, error: 'El motivo 01 requiere el folio fiscal del CFDI que sustituye a este.' };
  }

  try {
    const api = getClient();
    const response = await api.invoices.cancel({
      id: record.fiscalapiId,
      motive: motiveCode,
      replacementUuid,
    } as any);

    if (!response.succeeded) {
      return { ok: false, error: response.message || 'El SAT rechazó la cancelación.' };
    }

    record.status = 'CANCELADO';
    record.cancelledAt = new Date().toISOString();
    record.cancellationReason = motiveCode;
    db.persist();

    db.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role as any,
      module: 'FINANZAS',
      action: 'CFDI_CANCELADO',
      entity_type: 'ORDER',
      entity_id: record.orderId,
      new_value: `CFDI ${record.uuid} cancelado con motivo ${motiveCode}.`,
    });

    return { ok: true };
  } catch (err: any) {
    console.error('[FiscalAPI] Error al cancelar:', err);
    return { ok: false, error: err?.message || 'No se pudo conectar con FiscalAPI.' };
  }
}

export async function getCfdiFile(
  cfdiId: string,
  kind: 'pdf' | 'xml'
): Promise<{ ok: boolean; base64?: string; fileName?: string; error?: string }> {
  const record = getStore().find((r) => r.id === cfdiId);
  if (!record) return { ok: false, error: 'No se encontró el CFDI.' };

  try {
    const api = getClient();
    const response =
      kind === 'pdf'
        ? await api.invoices.getPdf({ invoiceId: record.fiscalapiId } as any)
        : await api.invoices.getXml(record.fiscalapiId);

    if (!response.succeeded || !response.data) {
      return { ok: false, error: response.message || `FiscalAPI no devolvió el ${kind.toUpperCase()}.` };
    }

    const data: any = response.data;
    return {
      ok: true,
      base64: data.base64File || data.base64 || data.content,
      fileName: data.fileName || `${record.uuid}.${kind}`,
    };
  } catch (err: any) {
    console.error(`[FiscalAPI] Error obteniendo ${kind}:`, err);
    return { ok: false, error: err?.message || 'No se pudo conectar con FiscalAPI.' };
  }
}

export async function refreshCfdiStatus(cfdiId: string): Promise<{ ok: boolean; status?: string; error?: string }> {
  const record = getStore().find((r) => r.id === cfdiId);
  if (!record) return { ok: false, error: 'No se encontró el CFDI.' };

  try {
    const api = getClient();
    const response = await api.invoices.getStatus({ id: record.fiscalapiId } as any);
    if (!response.succeeded || !response.data) {
      return { ok: false, error: response.message || 'El SAT no devolvió el estatus.' };
    }

    const estatus = String((response.data as any).status || (response.data as any).estado || '');

    // Si el SAT reporta cancelado y el ERP no lo sabía, se sincroniza: puede
    // haberse cancelado desde el portal del SAT o desde FiscalAPI.
    if (/cancel/i.test(estatus) && record.status !== 'CANCELADO') {
      record.status = 'CANCELADO';
      record.cancelledAt = new Date().toISOString();
      record.cancellationReason = 'Detectado en consulta al SAT';
      db.persist();
    }

    return { ok: true, status: estatus };
  } catch (err: any) {
    console.error('[FiscalAPI] Error consultando estatus:', err);
    return { ok: false, error: err?.message || 'No se pudo conectar con FiscalAPI.' };
  }
}
