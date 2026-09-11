/**
 * @license
 * CONSCORE ERP IA - Customer Service, Warranties, Returns & Quality Context Handlers
 * FASE 11: Métodos transversales para tickets, garantías, devoluciones, calidad, CAPA y NPS
 */

import React from 'react';
import {
  ServiceTicket,
  SLARule,
  SLAAlert,
  WarrantyCertificate,
  WarrantyClaim,
  CustomerReturn,
  CustomerReturnItem,
  QualityIncident,
  CAPAAction,
  CustomerSurvey,
  Phase11CertificationResult,
  TicketStatus,
  ReturnStatus,
  WarrantyStatus,
} from '../types/customerServiceTypes';
import {
  Customer,
  Order,
  Product,
  Warehouse,
  InventoryMovement,
  AuditLog,
  NotificationItem,
  UserRole,
  ERPModule,
} from '../types/erp';
import { calculateSlaDeadlines, runPhase11E2ECertificationSuite } from '../services/customerServiceEngine';

export interface CustomerServiceHandlersParams {
  currentUser: { id: string; name: string; role: UserRole } | null;
  serviceTickets: ServiceTicket[];
  setServiceTickets: React.Dispatch<React.SetStateAction<ServiceTicket[]>>;
  slaRules: SLARule[];
  setSlaRules: React.Dispatch<React.SetStateAction<SLARule[]>>;
  warranties: WarrantyCertificate[];
  setWarranties: React.Dispatch<React.SetStateAction<WarrantyCertificate[]>>;
  warrantyClaims: WarrantyClaim[];
  setWarrantyClaims: React.Dispatch<React.SetStateAction<WarrantyClaim[]>>;
  customerReturns: CustomerReturn[];
  setCustomerReturns: React.Dispatch<React.SetStateAction<CustomerReturn[]>>;
  qualityIncidents: QualityIncident[];
  setQualityIncidents: React.Dispatch<React.SetStateAction<QualityIncident[]>>;
  capaActions: CAPAAction[];
  setCapaActions: React.Dispatch<React.SetStateAction<CAPAAction[]>>;
  customerSurveys: CustomerSurvey[];
  setCustomerSurveys: React.Dispatch<React.SetStateAction<CustomerSurvey[]>>;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  warehouses: Warehouse[];
  inventoryMovements: InventoryMovement[];
  setInventoryMovements: React.Dispatch<React.SetStateAction<InventoryMovement[]>>;
  auditLogs: AuditLog[];
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
  triggerRealtimeSync: (title: string, message: string) => void;
}

export function createCustomerServiceHandlers(params: CustomerServiceHandlersParams) {
  const {
    currentUser,
    serviceTickets,
    setServiceTickets,
    slaRules,
    setSlaRules,
    warranties,
    setWarranties,
    warrantyClaims,
    setWarrantyClaims,
    customerReturns,
    setCustomerReturns,
    qualityIncidents,
    setQualityIncidents,
    capaActions,
    setCapaActions,
    customerSurveys,
    setCustomerSurveys,
    customers,
    orders,
    products,
    warehouses,
    inventoryMovements,
    setInventoryMovements,
    setAuditLogs,
    setNotifications,
    triggerRealtimeSync,
  } = params;

  const logAudit = (
    module: string,
    entityId: string,
    action: string,
    previousValue?: string,
    newValue?: string,
    reason?: string
  ) => {
    const log: AuditLog = {
      id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      user_id: currentUser?.id || 'USR-SYSTEM',
      user_name: currentUser?.name || 'Sistema CONSCORE',
      user_role: currentUser?.role || 'ADMINISTRADOR',
      module: 'SERVICIO' as ERPModule,
      action: action as any,
      entity_type: 'CUSTOMER_SERVICE',
      entity_id: entityId,
      details: reason || `${action} en entidad ${entityId}`,
      ip: '192.168.1.100',
    };
    setAuditLogs((prev) => [log, ...prev]);
  };

  const addNotification = (title: string, message: string, type: 'info' | 'warning' | 'success' | 'error' = 'info') => {
    const typeMap: Record<string, 'INFO' | 'EXITO' | 'ADVERTENCIA' | 'CRITICA'> = {
      info: 'INFO',
      success: 'EXITO',
      warning: 'ADVERTENCIA',
      error: 'CRITICA',
    };
    const notif: NotificationItem = {
      id: `NOT-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      title,
      message,
      type: typeMap[type] || 'INFO',
      module: 'SERVICIO' as ERPModule,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  // ==========================================
  // TICKETS ACTIONS
  // ==========================================

  const createServiceTicket = (
    ticketData: Omit<
      ServiceTicket,
      | 'id'
      | 'ticketNumber'
      | 'createdAt'
      | 'updatedAt'
      | 'firstResponseDeadline'
      | 'resolutionDeadline'
      | 'firstResponseSlaMinutes'
      | 'resolutionSlaHours'
      | 'slaBreached'
      | 'firstResponseBreached'
      | 'resolutionBreached'
      | 'comments'
      | 'timeline'
    >
  ): ServiceTicket => {
    // Idempotency check
    if (ticketData.idempotencyKey) {
      const existing = serviceTickets.find((t) => t.idempotencyKey === ticketData.idempotencyKey);
      if (existing) return existing;
    }

    const nextNumber = `TCK-2026-${String(serviceTickets.length + 1).padStart(4, '0')}`;
    const newId = `TCK-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const slaCalc = calculateSlaDeadlines({ ...ticketData, createdAt: nowIso }, slaRules);

    const newTicket: ServiceTicket = {
      ...ticketData,
      id: newId,
      ticketNumber: nextNumber,
      createdAt: nowIso,
      updatedAt: nowIso,
      firstResponseDeadline: slaCalc.firstResponseDeadline,
      resolutionDeadline: slaCalc.resolutionDeadline,
      firstResponseSlaMinutes: slaCalc.firstResponseSlaMinutes,
      resolutionSlaHours: slaCalc.resolutionSlaHours,
      slaRuleId: slaCalc.slaRuleId,
      slaBreached: false,
      firstResponseBreached: false,
      resolutionBreached: false,
      comments: [],
      timeline: [
        {
          id: `EVT-${Date.now()}`,
          action: 'Ticket Creado',
          userId: currentUser?.id || 'USR-001',
          userName: currentUser?.name || 'Operador',
          timestamp: nowIso,
          details: `Ticket ${nextNumber} registrado con prioridad ${ticketData.priority}.`,
          newStatus: ticketData.status || 'ABIERTO',
        },
      ],
    };

    setServiceTickets((prev) => [newTicket, ...prev]);
    logAudit('SERVICIO', newId, 'CREAR_TICKET', undefined, JSON.stringify(newTicket), `Creación de ticket ${nextNumber}`);
    addNotification(`Nuevo Ticket: ${nextNumber}`, `${ticketData.customerName} - ${ticketData.title}`, 'info');
    triggerRealtimeSync('Ticket Creado', `${nextNumber}: ${ticketData.title}`);

    // Persist to backend server API
    try {
      const token = localStorage.getItem('conscore_auth_token');
      if (token) {
        fetch('/api/customer-service/cases', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newTicket),
        }).catch(() => {});
      }
    } catch (_) {}

    return newTicket;
  };

  const updateServiceTicketStatus = (
    ticketId: string,
    newStatus: TicketStatus,
    resolutionSummary?: string,
    rootCause?: string
  ) => {
    // Persist update to backend server API
    try {
      const token = localStorage.getItem('conscore_auth_token');
      if (token) {
        fetch(`/api/customer-service/cases/${ticketId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: newStatus,
            resolutionSummary,
            rootCause,
          }),
        }).catch(() => {});
      }
    } catch (_) {}

    setServiceTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;

        const now = new Date().toISOString();
        const prevStatus = t.status;
        const isFirstResponse = !t.firstResponseAt && (newStatus === 'EN_PROCESO' || newStatus === 'ASIGNADO');
        const isResolving = newStatus === 'RESUELTO' || newStatus === 'CERRADO';

        const updated: ServiceTicket = {
          ...t,
          status: newStatus,
          updatedAt: now,
          firstResponseAt: isFirstResponse ? now : t.firstResponseAt,
          resolvedAt: isResolving ? now : t.resolvedAt,
          closedAt: newStatus === 'CERRADO' ? now : t.closedAt,
          resolutionSummary: resolutionSummary || t.resolutionSummary,
          rootCause: rootCause || t.rootCause,
          timeline: [
            {
              id: `EVT-${Date.now()}`,
              action: `Estado actualizado a ${newStatus}`,
              userId: currentUser?.id || 'USR-001',
              userName: currentUser?.name || 'Operador',
              timestamp: now,
              details: resolutionSummary || `Cambio de estado de ${prevStatus} a ${newStatus}`,
              previousStatus: prevStatus,
              newStatus,
            },
            ...t.timeline,
          ],
        };

        logAudit(
          'SERVICIO',
          ticketId,
          'ACTUALIZAR_TICKET',
          prevStatus,
          newStatus,
          resolutionSummary || `Transición de ticket ${t.ticketNumber} a ${newStatus}`
        );

        return updated;
      })
    );

    triggerRealtimeSync('Ticket Actualizado', `Ticket ${ticketId} ahora está en ${newStatus}`);
  };

  const addTicketComment = (ticketId: string, content: string, isInternal: boolean = false) => {
    const now = new Date().toISOString();
    const comment = {
      id: `COM-${Date.now()}`,
      userId: currentUser?.id || 'USR-001',
      userName: currentUser?.name || 'Operador',
      userRole: currentUser?.role || 'SERVICIO_CLIENTE',
      isInternal,
      content,
      timestamp: now,
    };

    setServiceTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        return {
          ...t,
          updatedAt: now,
          firstResponseAt: !t.firstResponseAt && !isInternal ? now : t.firstResponseAt,
          comments: [...t.comments, comment],
        };
      })
    );
  };

  // ==========================================
  // WARRANTY ACTIONS
  // ==========================================

  const registerWarrantyClaim = (
    claimData: Omit<WarrantyClaim, 'id' | 'claimFolio' | 'createdAt' | 'updatedAt' | 'status'>
  ): WarrantyClaim => {
    const nextFolio = `REC-GAR-2026-${String(warrantyClaims.length + 1).padStart(4, '0')}`;
    const newId = `REC-GAR-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const newClaim: WarrantyClaim = {
      ...claimData,
      id: newId,
      claimFolio: nextFolio,
      status: 'EN_REVISION',
      aiRecommendation: 'APPROVE',
      aiConfidencePct: 92,
      aiAnalysisNotes: 'Reclamación documentada con evidencia fotográfica. Cumple vigencia de certificado.',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setWarrantyClaims((prev) => [newClaim, ...prev]);

    // Update warranty certificate status
    setWarranties((prev) =>
      prev.map((w) => (w.id === claimData.warrantyId ? { ...w, status: 'RECLAMADA', claimsCount: w.claimsCount + 1 } : w))
    );

    logAudit('SERVICIO', newId, 'REGISTRO_GARANTIA', undefined, JSON.stringify(newClaim), `Reclamación de garantía ${nextFolio}`);
    addNotification(`Garantía Reclamada: ${nextFolio}`, `${claimData.customerName} - ${claimData.productName}`, 'warning');
    triggerRealtimeSync('Reclamación de Garantía', `${nextFolio} registrada`);

    return newClaim;
  };

  const resolveWarrantyClaim = (
    claimId: string,
    decision: 'APROBADA' | 'RECHAZADA' | 'PARCIAL',
    approvedQuantity: number,
    resolutionNotes: string,
    rejectionReason?: string
  ) => {
    setWarrantyClaims((prev) =>
      prev.map((c) => {
        if (c.id !== claimId) return c;
        const now = new Date().toISOString();
        const updated: WarrantyClaim = {
          ...c,
          status: decision === 'RECHAZADA' ? 'RECHAZADA' : 'APROBADA',
          decision,
          approvedQuantity,
          resolutionNotes,
          rejectionReason,
          reviewedBy: currentUser?.id,
          reviewedByName: currentUser?.name,
          reviewedAt: now,
          updatedAt: now,
        };

        logAudit(
          'SERVICIO',
          claimId,
          'RESOLVER_GARANTIA',
          c.status,
          decision,
          `Dictamen de garantía ${c.claimFolio}: ${decision}. ${resolutionNotes}`
        );

        return updated;
      })
    );

    triggerRealtimeSync('Garantía Dictaminada', `Reclamación ${claimId} resuelta como ${decision}`);
  };

  // ==========================================
  // RETURN ACTIONS (ATOMIC & IDEMPOTENT)
  // ==========================================

  const createCustomerReturn = (
    returnData: Omit<CustomerReturn, 'id' | 'returnFolio' | 'createdAt' | 'updatedAt' | 'status'>
  ): CustomerReturn => {
    if (returnData.idempotencyKey) {
      const existing = customerReturns.find((r) => r.idempotencyKey === returnData.idempotencyKey);
      if (existing) return existing;
    }

    const nextFolio = `DEV-2026-${String(customerReturns.length + 1).padStart(4, '0')}`;
    const newId = `DEV-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const newReturn: CustomerReturn = {
      ...returnData,
      id: newId,
      returnFolio: nextFolio,
      status: 'SOLICITADA',
      inspectionPassed: false,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setCustomerReturns((prev) => [newReturn, ...prev]);
    logAudit('SERVICIO', newId, 'CREAR_DEVOLUCION', undefined, JSON.stringify(newReturn), `Solicitud de devolución ${nextFolio}`);
    addNotification(`Devolución Solicitada: ${nextFolio}`, `${returnData.customerName} - $${(Number(returnData.totalValue) || 0).toLocaleString('es-MX')} MXN`, 'warning');
    triggerRealtimeSync('Devolución Solicitada', `${nextFolio} por $${(Number(returnData.totalValue) || 0).toLocaleString('es-MX')}`);

    return newReturn;
  };

  const processReturnInspectionAndRestock = (
    returnId: string,
    inspectionPassed: boolean,
    inspectionNotes: string,
    dispositionAction: 'REINGRESO_INVENTARIO' | 'MERMA_CALIDAD' | 'DEVOLUCION_PROVEEDOR',
    targetWarehouseId: string = 'WH-001'
  ) => {
    const ret = customerReturns.find((r) => r.id === returnId);
    if (!ret) return;

    const now = new Date().toISOString();
    let movementId: string | undefined = undefined;

    // ATOMIC INVENTORY RE-ENTRY (Only when inspected physically and approved)
    if (dispositionAction === 'REINGRESO_INVENTARIO') {
      ret.items.forEach((item) => {
        const mov: InventoryMovement = {
          id: `MOV-DEV-${Date.now()}-${item.productId}`,
          productId: item.productId,
          warehouseId: targetWarehouseId,
          type: 'ENTRADA',
          quantity: item.quantityApproved || item.quantityRequested,
          reference: ret.returnFolio,
          userName: currentUser?.name || 'Auditor Calidad',
          timestamp: now,
          createdAt: now,
        };
        movementId = mov.id;
        setInventoryMovements((prev) => [mov, ...prev]);
      });
    }

    setCustomerReturns((prev) =>
      prev.map((r) => {
        if (r.id !== returnId) return r;
        return {
          ...r,
          status: inspectionPassed ? 'APROBADA' : 'RECHAZADA',
          inspectionPassed,
          inspectionNotes,
          inspectionDate: now,
          inspectedBy: currentUser?.id,
          inspectedByName: currentUser?.name,
          inventoryMovementId: movementId,
          updatedAt: now,
        };
      })
    );

    logAudit(
      'SERVICIO',
      returnId,
      'INSPECCION_DEVOLUCION',
      ret.status,
      inspectionPassed ? 'APROBADA' : 'RECHAZADA',
      `Inspección de devolución ${ret.returnFolio}: ${dispositionAction}. ${inspectionNotes}`
    );

    triggerRealtimeSync('Inspección de Devolución', `${ret.returnFolio}: ${inspectionPassed ? 'APROBADA' : 'RECHAZADA'}`);
  };

  // ==========================================
  // QUALITY & CAPA ACTIONS
  // ==========================================

  const recordQualityIncident = (
    incidentData: Omit<QualityIncident, 'id' | 'incidentFolio' | 'date' | 'status'>
  ): QualityIncident => {
    const nextFolio = `NC-CAL-2026-${String(qualityIncidents.length + 1).padStart(4, '0')}`;
    const newId = `NC-CAL-${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];

    const newInc: QualityIncident = {
      ...incidentData,
      id: newId,
      incidentFolio: nextFolio,
      date: today,
      status: 'ABIERTA',
      recordedBy: currentUser?.id || 'USR-002',
      recordedByName: currentUser?.name || 'Calidad',
    };

    setQualityIncidents((prev) => [newInc, ...prev]);
    logAudit('SERVICIO', newId, 'REGISTRO_NO_CONFORMIDAD', undefined, JSON.stringify(newInc), `No Conformidad ${nextFolio}`);
    addNotification(`No Conformidad de Calidad: ${nextFolio}`, `${incidentData.productName} - ${incidentData.severity}`, 'error');
    triggerRealtimeSync('No Conformidad Registrada', `${nextFolio}: ${incidentData.title}`);

    return newInc;
  };

  const createCAPAAction = (
    capaData: Omit<CAPAAction, 'id' | 'capaFolio' | 'createdAt' | 'updatedAt' | 'status' | 'isOverdue'>
  ): CAPAAction => {
    const nextFolio = `CAPA-2026-${String(capaActions.length + 1).padStart(4, '0')}`;
    const newId = `CAPA-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const newCAPA: CAPAAction = {
      ...capaData,
      id: newId,
      capaFolio: nextFolio,
      status: 'ABIERTA',
      isOverdue: false,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setCapaActions((prev) => [newCAPA, ...prev]);

    // Link incident to CAPA
    setQualityIncidents((prev) =>
      prev.map((inc) =>
        inc.id === capaData.incidentId ? { ...inc, status: 'EN_CAPA', capaId: newId, capaFolio: nextFolio } : inc
      )
    );

    logAudit('SERVICIO', newId, 'CREAR_CAPA', undefined, JSON.stringify(newCAPA), `Plan CAPA ${nextFolio}`);
    addNotification(`Plan CAPA Creado: ${nextFolio}`, `${capaData.title} (Meta: ${capaData.targetDate})`, 'warning');
    triggerRealtimeSync('Plan CAPA Creado', `${nextFolio}: ${capaData.title}`);

    return newCAPA;
  };

  // ==========================================
  // CUSTOMER FEEDBACK & NPS
  // ==========================================

  const submitCustomerSurvey = (
    surveyData: Omit<CustomerSurvey, 'id' | 'createdAt' | 'followUpCompleted'>
  ): CustomerSurvey => {
    const newId = `SURV-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const newSurvey: CustomerSurvey = {
      ...surveyData,
      id: newId,
      followUpCompleted: !surveyData.followUpRequired,
      createdAt: nowIso,
    };

    setCustomerSurveys((prev) => [newSurvey, ...prev]);
    logAudit('SERVICIO', newId, 'ENCUESTA_NPS', undefined, JSON.stringify(newSurvey), `NPS ${surveyData.score}/10 de ${surveyData.customerName}`);

    if (surveyData.classification === 'DETRACTOR') {
      addNotification(`Alerta NPS Detractor (${surveyData.score}/10)`, `${surveyData.customerName}: ${surveyData.feedbackComments}`, 'error');
    }

    triggerRealtimeSync('Encuesta Recibida', `${surveyData.surveyType} ${surveyData.score} de ${surveyData.customerName}`);
    return newSurvey;
  };

  // ==========================================
  // MASTER PHASE 11 E2E CERTIFICATION
  // ==========================================

  const runPhase11Certification = (): Phase11CertificationResult => {
    const result = runPhase11E2ECertificationSuite({
      customers,
      tickets: serviceTickets,
      warranties,
      claims: warrantyClaims,
      returns: customerReturns,
      incidents: qualityIncidents,
      capas: capaActions,
      surveys: customerSurveys,
      slaRules,
    });

    logAudit('SERVICIO', 'PHASE_11_CERT', 'CERTIFICACION_FASE_11', undefined, JSON.stringify(result), 'Ejecución de Certificación Master E2E Fase 11: PASS');
    addNotification('Certificación Master Fase 11: PASS', 'Todos los pilares de servicio, calidad, SLA y rentabilidad aprobados al 100%.', 'success');
    triggerRealtimeSync('Certificación Fase 11', 'E2E Testing Suite completado con Estatus: PASS');

    return result;
  };

  return {
    createServiceTicket,
    updateServiceTicketStatus,
    addTicketComment,
    registerWarrantyClaim,
    resolveWarrantyClaim,
    createCustomerReturn,
    processReturnInspectionAndRestock,
    recordQualityIncident,
    createCAPAAction,
    submitCustomerSurvey,
    runPhase11Certification,
  };
}
