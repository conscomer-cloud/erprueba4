/**
 * @license
 * CONSCORE ERP IA - Observación 16: Servicio de Autorización Financiera para Cotización -> Pedido
 * 
 * Principio de Control Obligatorio:
 * COTIZACIÓN
 *  ↓
 * PENDIENTE DE AUTORIZACIÓN FINANCIERA
 *  ↓
 * AUTORIZADA POR FINANZAS
 *  ↓
 * CREAR PEDIDO
 * 
 * Sin autorización: NO PEDIDO (Backend Enforcement, RLS, Audit & Idempotency).
 */

import { Quote, User, UserRole } from '../types/erp';

export interface FinancialApprovalValidationResult {
  allowed: boolean;
  error?: string;
  code?: 'FINANCIAL_APPROVAL_REQUIRED' | 'FINANCIAL_APPROVAL_VERSION_MISMATCH' | 'FINANCIAL_APPROVAL_SNAPSHOT_MISMATCH' | 'SELF_APPROVAL_FORBIDDEN' | 'UNAUTHORIZED_ROLE';
}

export class QuoteFinancialApprovalService {
  /**
   * Roles autorizados formalmente para otorgar o revocar autorización financiera
   */
  public static readonly AUTHORIZED_ROLES: UserRole[] = [
    'FINANZAS',
    'ADMINISTRADOR',
    'DIRECTOR',
  ];

  /**
   * Valida si una cotización cuenta con autorización financiera válida y vigente
   * para poder ser convertida en Pedido formal de venta.
   * Reglas estrictas Observación 16:
   * 1. Si quote == null -> RECHAZAR
   * 2. Si quote.financialApprovalStatus === undefined -> RECHAZAR
   * 3. Si quote.financialApprovalStatus === null -> RECHAZAR
   * 4. Si quote.financialApprovalStatus === "" -> RECHAZAR
   * 5. Si quote.financialApprovalStatus === "PENDIENTE" -> RECHAZAR
   * 6. Si quote.financialApprovalStatus === "RECHAZADA" -> RECHAZAR
   * 7. Sólo si quote.financialApprovalStatus === "AUTORIZADA" -> CONTINUAR
   * 8. Validar versión autorizada: approvedQuoteVersion === quote.version (si no coincide -> RECHAZAR)
   */
  public static validateForOrderConversion(quote: any): FinancialApprovalValidationResult {
    // Regla 1: quote requerido
    if (!quote) {
      return {
        allowed: false,
        error: 'La cotización requiere autorización de Finanzas antes de generar el pedido.',
        code: 'FINANCIAL_APPROVAL_REQUIRED',
      };
    }

    // Reglas 2, 3, 4, 5, 6, 7: Estado financiero obligatorio
    const status = quote.financialApprovalStatus;
    if (status === undefined || status === null || status === '' || status === 'PENDIENTE') {
      return {
        allowed: false,
        error: 'La cotización requiere autorización de Finanzas antes de generar el pedido.',
        code: 'FINANCIAL_APPROVAL_REQUIRED',
      };
    }

    if (status === 'RECHAZADA') {
      const motive = quote.financialApprovalNotes || quote.financialRejectionReason || 'Sin especificar';
      return {
        allowed: false,
        error: `Cotización rechazada financieramente por ${quote.financialRejectedByName || 'Finanzas'}. Motivo: ${motive}. No puede convertirse en Pedido.`,
        code: 'FINANCIAL_APPROVAL_REQUIRED',
      };
    }

    if (status !== 'AUTORIZADA') {
      return {
        allowed: false,
        error: 'La cotización requiere autorización de Finanzas antes de generar el pedido.',
        code: 'FINANCIAL_APPROVAL_REQUIRED',
      };
    }

    // Regla 8: Snapshot de versión autorizada obligatoria (Snapshot Binding)
    const currentVersion = Number(quote.version) || 1;
    const approvedVersion = quote.approvedQuoteVersion !== undefined && quote.approvedQuoteVersion !== null
      ? Number(quote.approvedQuoteVersion)
      : null;

    if (approvedVersion === null || approvedVersion !== currentVersion) {
      return {
        allowed: false,
        error: `La versión actual de la cotización (v${currentVersion}) difiere de la versión autorizada por Finanzas (${approvedVersion !== null ? `v${approvedVersion}` : 'sin versión registrada'}). Requiere nueva autorización financiera.`,
        code: 'FINANCIAL_APPROVAL_VERSION_MISMATCH',
      };
    }

    // Integridad de Snapshot Financiero (si existe)
    if (quote.financialApprovalSnapshot) {
      const snap = quote.financialApprovalSnapshot;
      if (Math.abs(Number(quote.total || 0) - Number(snap.total || 0)) > 0.05) {
        return {
          allowed: false,
          error: `El importe total ($${Number(quote.total || 0).toLocaleString('es-MX')} MXN) difiere del snapshot autorizado ($${Number(snap.total || 0).toLocaleString('es-MX')} MXN). Requiere reautorización financiera.`,
          code: 'FINANCIAL_APPROVAL_SNAPSHOT_MISMATCH',
        };
      }

      if (snap.paymentTerms && quote.paymentTerms && snap.paymentTerms !== quote.paymentTerms) {
        return {
          allowed: false,
          error: `La condición de pago fue modificada ("${snap.paymentTerms}" ➔ "${quote.paymentTerms}"). Requiere reautorización financiera obligatoria.`,
          code: 'FINANCIAL_APPROVAL_SNAPSHOT_MISMATCH',
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Determina si un usuario tiene facultades para autorizar o rechazar financieramente una cotización,
   * bloqueando terminantemente la autoaprobación por parte del vendedor responsable.
   */
  public static canUserAuthorize(
    user: { id: string; name: string; role?: any },
    quote?: Quote
  ): { allowed: boolean; error?: string; code?: string } {
    if (!user) {
      return { allowed: false, error: 'Usuario no autenticado.', code: 'UNAUTHORIZED_ROLE' };
    }

    const role = (user.role || '').toUpperCase();
    const isAuthorizedRole = this.AUTHORIZED_ROLES.includes(role as UserRole) || role === 'GERENTE_FINANZAS';

    if (!isAuthorizedRole) {
      return {
        allowed: false,
        error: `El rol "${role || 'USUARIO'}" no cuenta con facultades de autorización financiera. Rol requerido: FINANZAS o ADMINISTRADOR.`,
        code: 'UNAUTHORIZED_ROLE',
      };
    }

    // REGLA CRÍTICA 13: AUTOAPROBACIÓN PROHIBIDA
    if (quote) {
      const sellerIds = [
        quote.salespersonId,
        (quote as any).salesperson_id,
        quote.sellerId,
        (quote as any).seller_id,
        (quote as any).salesExecutiveId,
        (quote as any).sales_executive_id,
      ].filter(Boolean);

      const sellerNames = [
        quote.salespersonName,
        (quote as any).salesperson_name,
        quote.sellerName,
        (quote as any).seller_name,
      ].filter(Boolean);

      const isOwnerSeller =
        sellerIds.includes(user.id) ||
        (user.name && sellerNames.some((n) => n.trim().toLowerCase() === user.name.trim().toLowerCase()));

      if (isOwnerSeller && role !== 'ADMINISTRADOR') {
        return {
          allowed: false,
          error: 'AUTOAPROBACIÓN PROHIBIDA: El ejecutivo de ventas que elaboró la cotización no puede autorizarse financieramente a sí mismo.',
          code: 'SELF_APPROVAL_FORBIDDEN',
        };
      }

      // Si el rol es estrictamente VENDEDOR (incluso manipulando IDs)
      if (role === 'VENDEDOR') {
        return {
          allowed: false,
          error: 'AUTOAPROBACIÓN PROHIBIDA: Un usuario con rol VENDEDOR no puede autorizar cotizaciones.',
          code: 'SELF_APPROVAL_FORBIDDEN',
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Ejecuta la autorización formal de Finanzas sobre una cotización
   * NO crea pedido, NO reserva stock, NO genera movimientos en Kardex.
   */
  public static approveQuote(
    quote: Quote,
    user: { id: string; name: string; role?: any },
    notes?: string
  ): { success: boolean; updatedQuote?: Quote; error?: string; code?: string } {
    const authCheck = this.canUserAuthorize(user, quote);
    if (!authCheck.allowed) {
      return { success: false, error: authCheck.error, code: authCheck.code };
    }

    const version = Number(quote.version) || 1;
    const nowISO = new Date().toISOString();

    const snapshot = {
      total: Number(quote.total) || 0,
      subtotal: Number(quote.subtotal) || 0,
      discount: Number(quote.discount) || 0,
      paymentTerms: quote.paymentTerms || '',
      customerId: quote.customerId || (quote as any).customer_id || '',
      version: version,
    };

    const updatedQuote: Quote = {
      ...quote,
      financialApprovalStatus: 'AUTORIZADA',
      financialApprovedBy: user.id,
      financialApprovedByName: user.name,
      financialApprovedAt: nowISO,
      financialApprovedRole: user.role,
      financialApprovalNotes: notes || 'Autorización financiera conforme por Finanzas',
      approvedQuoteVersion: version,
      financialApprovalSnapshot: snapshot,
      updatedAt: nowISO,
      updated_at: nowISO,
    };

    return {
      success: true,
      updatedQuote,
    };
  }

  /**
   * Ejecuta el rechazo de Finanzas sobre una cotización.
   * El motivo de rechazo es ESTRICTAMENTE OBLIGATORIO.
   */
  public static rejectQuote(
    quote: Quote,
    user: { id: string; name: string; role?: any },
    reason: string
  ): { success: boolean; updatedQuote?: Quote; error?: string; code?: string } {
    if (!reason || !reason.trim()) {
      return {
        success: false,
        error: 'El motivo de rechazo es obligatorio para el dictamen de Finanzas.',
        code: 'REJECTION_REASON_REQUIRED' as any,
      };
    }

    const authCheck = this.canUserAuthorize(user, quote);
    if (!authCheck.allowed) {
      return { success: false, error: authCheck.error, code: authCheck.code };
    }

    const nowISO = new Date().toISOString();

    const updatedQuote: Quote = {
      ...quote,
      financialApprovalStatus: 'RECHAZADA',
      financialRejectedBy: user.id,
      financialRejectedByName: user.name,
      financialRejectedAt: nowISO,
      financialApprovalNotes: reason.trim(),
      approvedQuoteVersion: undefined,
      financialApprovalSnapshot: undefined,
      updatedAt: nowISO,
      updated_at: nowISO,
    };

    return {
      success: true,
      updatedQuote,
    };
  }

  /**
   * Solicita autorización financiera formal para una cotización
   */
  public static requestApproval(
    quote: Quote,
    user: { id: string; name: string; role?: any },
    notes?: string
  ): Quote {
    const nowISO = new Date().toISOString();
    return {
      ...quote,
      financialApprovalStatus: 'PENDIENTE',
      financialRequestedBy: user.id,
      financialRequestedByName: user.name,
      financialRequestedAt: nowISO,
      financialApprovalNotes: notes || quote.financialApprovalNotes || 'Solicitud de autorización financiera formal para emisión de pedido',
      approvedQuoteVersion: undefined,
      financialApprovalSnapshot: undefined,
      updatedAt: nowISO,
      updated_at: nowISO,
    };
  }

  /**
   * Detecta si una edición en la cotización debe invalidar la autorización financiera previa.
   * Modificaciones sensibles:
   * - Cantidades de partidas
   * - Precios unitarios
   * - Descuentos
   * - Subtotal o Total
   * - Condición de pago (e.g. CONTADO -> CRÉDITO)
   * - Cliente comercial
   * - Incremento de versión (v1 -> v2)
   */
  public static checkAndInvalidateOnEdit(
    prevQuote: Quote,
    updates: Partial<Quote>
  ): { shouldInvalidate: boolean; reason?: string } {
    if (prevQuote.financialApprovalStatus !== 'AUTORIZADA') {
      return { shouldInvalidate: false };
    }

    // 1. Cambio en condición de pago (Observación #8)
    const newPaymentTerms = updates.paymentTerms || (updates as any).payment_terms;
    if (newPaymentTerms && prevQuote.paymentTerms && newPaymentTerms !== prevQuote.paymentTerms) {
      return {
        shouldInvalidate: true,
        reason: `Condición de pago modificada de "${prevQuote.paymentTerms}" a "${newPaymentTerms}"`,
      };
    }

    // 2. Cambio en Cliente
    const newCust = updates.customerId || (updates as any).customer_id;
    if (newCust && prevQuote.customerId && newCust !== prevQuote.customerId) {
      return {
        shouldInvalidate: true,
        reason: 'Cliente comercial modificado en la cotización',
      };
    }

    // 3. Cambio de partidas (cantidades, precios, descuentos o agregado de partidas)
    if (updates.items && Array.isArray(updates.items)) {
      const prevItems = prevQuote.items || [];
      if (updates.items.length !== prevItems.length) {
        return {
          shouldInvalidate: true,
          reason: 'Número de partidas modificado en la cotización',
        };
      }

      for (const nit of updates.items) {
        const pit = prevItems.find((p: any) =>
          (p.productId && p.productId === (nit.productId || (nit as any).product_id)) ||
          (p.id && p.id === nit.id)
        );

        if (!pit) {
          return { shouldInvalidate: true, reason: 'Partidas de producto modificadas' };
        }

        if (Number(pit.quantity) !== Number(nit.quantity)) {
          return {
            shouldInvalidate: true,
            reason: `Cantidad modificada en partida "${pit.description || pit.productName || pit.productId}" (${pit.quantity} ➔ ${nit.quantity})`,
          };
        }

        const prevPrice = Number(pit.unitPrice || (pit as any).unit_price || (pit as any).salesPrice || 0);
        const newPrice = Number(nit.unitPrice || (nit as any).unit_price || (nit as any).salesPrice || 0);
        if (Math.abs(prevPrice - newPrice) > 0.01) {
          return {
            shouldInvalidate: true,
            reason: `Precio unitario modificado en partida (${prevPrice} ➔ ${newPrice})`,
          };
        }

        const prevDisc = Number(pit.discountPct || pit.discount || (pit as any).discountPercent || 0);
        const newDisc = Number(nit.discountPct || nit.discount || (nit as any).discountPercent || 0);
        if (Math.abs(prevDisc - newDisc) > 0.01) {
          return {
            shouldInvalidate: true,
            reason: `Descuento modificado en partida (${prevDisc}% ➔ ${newDisc}%)`,
          };
        }
      }
    }

    // 4. Cambio en totales
    if (updates.total !== undefined && Math.abs(Number(updates.total) - Number(prevQuote.total)) > 0.05) {
      return {
        shouldInvalidate: true,
        reason: `Monto total modificado ($${Number(prevQuote.total).toLocaleString('es-MX')} ➔ $${Number(updates.total).toLocaleString('es-MX')})`,
      };
    }

    // 5. Cualquier incremento de versión en general invalida autorización previa
    if (updates.version && updates.version !== prevQuote.version) {
      return {
        shouldInvalidate: true,
        reason: `Nueva versión de cotización generada (v${prevQuote.version || 1} ➔ v${updates.version})`,
      };
    }

    return { shouldInvalidate: false };
  }
}

/**
 * Función canónica y centralizada para la validación obligatoria de autorización financiera
 * requerida antes de convertir cualquier cotización a pedido.
 */
export function validateFinancialApprovalForOrder(quote: any): FinancialApprovalValidationResult {
  return QuoteFinancialApprovalService.validateForOrderConversion(quote);
}
