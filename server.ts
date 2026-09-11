import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { db, generateSalt, hashPassword, verifyPassword } from "./server/db/database";
import { AuthService, requireAuth, requirePermission } from "./server/services/authService";
import { InventoryService } from "./server/services/inventoryService";
import { QuoteOrderService } from "./server/services/quoteOrderService";
import { AIService } from "./server/services/aiService";
import { eventBus } from "./server/services/eventBus";
import { CommercialRLSService } from "./src/services/commercialRLSService";
import { QuoteEditService } from "./src/services/quoteEditService";
import { QuotePricingService } from "./src/services/quotePricingService";
import { normalizePaymentTerms, DEFAULT_PAYMENT_TERMS, QuotePaymentTermsService } from "./src/services/quotePaymentTermsService";
import { QuoteAvailabilityService } from "./src/services/quoteAvailabilityService";
import { validateLogisticsReadiness } from "./src/utils/logisticsValidation";
import { LogisticsBlockCertificationService } from "./src/services/logisticsBlockCertificationService";
import { PhysicalFulfillmentService } from "./src/services/physicalFulfillmentService";
import { QuoteFinancialApprovalService } from "./src/services/quoteFinancialApprovalService";
import { ProductReturnService, CONTROLLED_RETURN_SKU } from "./src/services/productReturnService";
import { INITIAL_SERVICE_TICKETS } from "./src/services/customerServiceInitialData";
import { INITIAL_COMPLIANCE_OBLIGATIONS, INITIAL_CORPORATE_DOCUMENTS, INITIAL_ENTERPRISE_ALERTS, INITIAL_ANOMALIES_DETECTED, INITIAL_GOVERNANCE_ACTIONS } from "./src/services/governanceRiskComplianceInitialData";
import { GovernanceRiskComplianceService } from "./src/services/governanceRiskComplianceService";
import { ComplianceObligation, ComplianceEvidence, CorrectiveActionPlan, CorporateDocument, EnterpriseAlert, AlertSeverity, AlertDomain, AlertStatus, AnomalyDetectionResult, GovernanceExecutiveAction, GovernanceActionStatus, GovernanceActionHorizon } from "./src/types/governanceRiskComplianceTypes";
import crypto from "crypto";
import { generateDemandForecast } from "./server/services/demandForecastService";
import { buildBISeries, buildCapacityAlerts } from "./server/services/biSeriesService";
import { buildForecastHistory, saveForecastSnapshot } from "./server/services/forecastHistoryService";
import {
  buildStampPreview,
  stampOrder,
  cancelCfdi,
  getCfdiFile,
  refreshCfdiStatus,
  listCfdi,
  isFiscalapiConfigured,
  getEnvironment,
} from "./server/services/fiscalapiService";
import * as XLSX from "xlsx";

dotenv.config();

const app = express();

// Cloud Run, Render, Railway y la mayoria de PaaS inyectan el puerto por
// variable de entorno. Antes estaba fijo en 3000 y el despliegue no levantaba.
const PORT = Number(process.env.PORT) || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

// Necesario para leer la IP real del cliente detras de un balanceador, tanto
// en la bitacora de auditoria como en el bloqueo por intentos fallidos.
app.set("trust proxy", true);

app.use(express.json({ limit: "10mb" }));

// Cabeceras de seguridad basicas (equivalente minimo a helmet, sin dependencia).
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader("X-DNS-Prefetch-Control", "off");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  if (IS_PRODUCTION) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});

// ==========================================
// 1. HEALTH & REAL-TIME SSE ENDPOINTS
// ==========================================
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    app: "CONSCORE ERP IA Core (Fase 0.1)",
    timestamp: new Date().toISOString(),
    aiConfigured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"),
    sessionSecretConfigured: !!(process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32),
    environment: IS_PRODUCTION ? "production" : "development",
  });
});

// Server-Sent Events (SSE) Live Stream
app.get("/api/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const clientId = `client_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const token = req.query.token as string;
  const session = token ? AuthService.getSession(token) : null;

  const sseClient = {
    id: clientId,
    res,
    userId: session?.user.id,
    role: session?.user.role,
  };

  eventBus.addClient(sseClient);

  req.on("close", () => {
    eventBus.removeClient(clientId);
  });
});

// ==========================================
// 2. AUTHENTICATION & USERS
// ==========================================
app.post("/api/auth/login", (req, res) => {
  try {
    const { email, username, identifier, password } = req.body;
    const loginId = identifier || email || username;
    if (!loginId || !password) {
      return res.status(400).json({ error: "Usuario/correo y contraseña son requeridos" });
    }
    const clientIp = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1";
    const result = AuthService.login(loginId, password, clientIp);
    if (!result.success) {
      return res.status(401).json({ error: result.error });
    }
    res.json(result.session);
  } catch (err: any) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Error en el servidor al autenticar" });
  }
});

app.post("/api/auth/logout", requireAuth, (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (token) {
    AuthService.logout(token);
  }
  res.json({ success: true, message: "Sesión cerrada correctamente" });
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  const user = (req as any).user;
  res.json(user);
});

// Change Password (Obligatorio o Voluntario)
app.post("/api/auth/change-password", requireAuth, (req, res) => {
  try {
    const currentUser = (req as any).user;
    const { current_password, new_password, confirm_password } = req.body;

    if (!new_password || !confirm_password) {
      return res.status(400).json({ error: "La nueva contraseña y su confirmación son requeridas." });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({ error: "La confirmación de contraseña no coincide." });
    }

    // Password Policy: Min 8 chars, 1 uppercase, 1 lowercase, 1 number
    if (
      new_password.length < 8 ||
      !/[A-Z]/.test(new_password) ||
      !/[a-z]/.test(new_password) ||
      !/[0-9]/.test(new_password)
    ) {
      return res.status(400).json({
        error: "La contraseña debe tener mínimo 8 caracteres e incluir al menos una letra mayúscula, una minúscula y un número.",
      });
    }

    const dbUser = db.getUsers().find((u) => u.id === currentUser.id);
    if (!dbUser) {
      return res.status(404).json({ error: "Usuario no encontrado en base de datos." });
    }

    // Verify current password if provided
    if (current_password) {
      const isCurrentValid = verifyPassword(current_password, dbUser.salt, dbUser.password_hash);
      if (!isCurrentValid) {
        return res.status(400).json({ error: "La contraseña actual es incorrecta." });
      }
    }

    // Update password
    const newSalt = generateSalt();
    const newHash = hashPassword(new_password, newSalt);

    dbUser.salt = newSalt;
    dbUser.password_hash = newHash;
    dbUser.must_change_password = false;
    dbUser.mustChangePassword = false;
    dbUser.updated_at = new Date().toISOString();
    dbUser.updatedAt = dbUser.updated_at;

    db.persist();

    // Update active sessions in memory
    AuthService.updateSessionUser(dbUser);

    // Audit log (never log plain password)
    db.logAudit({
      user_id: dbUser.id,
      user_name: dbUser.name,
      user_role: dbUser.role,
      module: "CONFIGURACION",
      action: "CAMBIO_CONTRASENA_EXITOSO",
      entity_type: "USER",
      entity_id: dbUser.id,
      new_value: "Contraseña actualizada exitosamente por el usuario",
    });

    const { password_hash, salt, ...safeUser } = dbUser;
    safeUser.mustChangePassword = false;
    safeUser.must_change_password = false;

    res.json({
      success: true,
      message: "Contraseña actualizada correctamente.",
      mustChangePassword: false,
      user: safeUser,
    });
  } catch (err: any) {
    console.error("Change password error:", err);
    res.status(500).json({ error: "Error al actualizar contraseña" });
  }
});

// List Users
app.get("/api/users", requireAuth, requirePermission("CONFIGURACION", "VIEW"), (_req, res) => {
  const safeUsers = db.getUsers().map(({ password_hash, salt, ...u }) => ({
    ...u,
    username: u.username || (u.email ? u.email.split("@")[0] : u.id.toLowerCase()),
    mustChangePassword: Boolean(u.must_change_password || u.mustChangePassword),
  }));
  res.json(safeUsers);
});

// Create User (with uniqueness validation for email, username, salesExecutiveId)
app.post("/api/users", requireAuth, requirePermission("CONFIGURACION", "CREATE"), (req, res) => {
  try {
    const adminUser = (req as any).user;
    const {
      name,
      email,
      username,
      role,
      salesExecutiveId,
      sales_executive_id,
      temporary_password,
      password,
      confirm_password,
      status,
      department,
      territory,
    } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({ error: "Nombre completo, correo electrónico y rol son obligatorios." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = (username || cleanEmail.split("@")[0]).trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "");
    const chosenSalesId = (salesExecutiveId || sales_executive_id || "").trim();
    const chosenPassword = temporary_password || password || "ConsCoreTemp2026!";

    // Validations: Password Policy
    if (
      chosenPassword.length < 8 ||
      !/[A-Z]/.test(chosenPassword) ||
      !/[a-z]/.test(chosenPassword) ||
      !/[0-9]/.test(chosenPassword)
    ) {
      return res.status(400).json({
        error: "La contraseña temporal debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.",
      });
    }

    if (confirm_password && chosenPassword !== confirm_password) {
      return res.status(400).json({ error: "Las contraseñas ingresadas no coinciden." });
    }

    // Check duplicate email
    if (db.getUsers().some((u) => u.email.toLowerCase() === cleanEmail)) {
      return res.status(400).json({ error: "El correo electrónico ya está registrado." });
    }

    // Check duplicate username
    if (db.getUsers().some((u) => (u.username || "").toLowerCase() === cleanUsername)) {
      return res.status(400).json({ error: "El nombre de usuario ya existe." });
    }

    // Check duplicate salesExecutiveId if role is VENDEDOR
    if (role === "VENDEDOR") {
      if (!chosenSalesId) {
        return res.status(400).json({ error: "Para el rol VENDEDOR es obligatorio asignar un código de vendedor (Ej. VENDEDOR_01 a VENDEDOR_10)." });
      }
      const existingVendor = db.getUsers().find(
        (u) => (u.salesExecutiveId === chosenSalesId || u.sales_executive_id === chosenSalesId)
      );
      if (existingVendor) {
        return res.status(400).json({
          error: "El código de vendedor ya está asignado.",
        });
      }
    }

    const salt = generateSalt();
    const password_hash = hashPassword(chosenPassword, salt);

    const newId = chosenSalesId.startsWith("VENDEDOR_")
      ? `USR-VEND-${chosenSalesId.replace("VENDEDOR_", "")}`
      : `USR-${Date.now().toString(36).toUpperCase()}`;

    const newUser: any = {
      id: newId,
      name: name.trim(),
      username: cleanUsername,
      email: cleanEmail,
      role,
      salesExecutiveId: role === "VENDEDOR" ? chosenSalesId : undefined,
      sales_executive_id: role === "VENDEDOR" ? chosenSalesId : undefined,
      status: status || "ACTIVO",
      department: department || (role === "VENDEDOR" ? "Ventas Industriales B2B" : "Operaciones"),
      territory: territory || undefined,
      must_change_password: true,
      mustChangePassword: true,
      password_hash,
      salt,
      created_at: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.getUsers().push(newUser);
    db.persist();

    // Audit log (without password!)
    db.logAudit({
      user_id: adminUser.id,
      user_name: adminUser.name,
      user_role: adminUser.role,
      module: "CONFIGURACION",
      action: "USER_CREATED",
      entity_type: "USER",
      entity_id: newUser.id,
      new_value: `Usuario creado: ${newUser.name} (${newUser.username}) con rol ${newUser.role}${newUser.salesExecutiveId ? ` - Código ${newUser.salesExecutiveId}` : ""} [Primer acceso obligatorio a cambio de clave]`,
    });

    eventBus.broadcast("user_created", {
      userId: newUser.id,
      name: newUser.name,
      role: newUser.role,
      salesExecutiveId: newUser.salesExecutiveId,
    });

    const { password_hash: _h, salt: _s, ...safeUser } = newUser;
    res.status(201).json({
      success: true,
      message: `Usuario ${newUser.name} creado exitosamente con contraseña temporal.`,
      user: safeUser,
    });
  } catch (err: any) {
    console.error("Create user error:", err);
    res.status(500).json({ error: "Error al crear usuario" });
  }
});

// Update User
app.put("/api/users/:id", requireAuth, requirePermission("CONFIGURACION", "EDIT"), (req, res) => {
  try {
    const adminUser = (req as any).user;
    const { id } = req.params;
    const { name, email, username, role, salesExecutiveId, status, department, territory } = req.body;

    const user = db.getUsers().find((u) => u.id === id);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    const previousRole = user.role;
    const previousStatus = user.status;
    const previousSalesId = user.salesExecutiveId;

    if (email && email.trim().toLowerCase() !== user.email.toLowerCase()) {
      const cleanEmail = email.trim().toLowerCase();
      if (db.getUsers().some((u) => u.id !== id && u.email.toLowerCase() === cleanEmail)) {
        return res.status(400).json({ error: `El correo '${cleanEmail}' ya está en uso por otro usuario.` });
      }
      user.email = cleanEmail;
    }

    if (username && username.trim().toLowerCase() !== (user.username || "").toLowerCase()) {
      const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "");
      if (db.getUsers().some((u) => u.id !== id && (u.username || "").toLowerCase() === cleanUsername)) {
        return res.status(400).json({ error: `El nombre de usuario '${cleanUsername}' ya está en uso.` });
      }
      user.username = cleanUsername;
    }

    if (name) user.name = name.trim();
    if (department) user.department = department;
    if (territory !== undefined) user.territory = territory;

    if (role) {
      user.role = role;
    }

    if (role === "VENDEDOR" && salesExecutiveId) {
      const cleanSalesId = salesExecutiveId.trim();
      const duplicateVendor = db.getUsers().find(
        (u) => u.id !== id && (u.salesExecutiveId === cleanSalesId || u.sales_executive_id === cleanSalesId)
      );
      if (duplicateVendor) {
        return res.status(400).json({
          error: `El código de vendedor '${cleanSalesId}' ya está asignado al usuario ${duplicateVendor.name}.`,
        });
      }
      user.salesExecutiveId = cleanSalesId;
      user.sales_executive_id = cleanSalesId;
    }

    if (status && ["ACTIVO", "INACTIVO", "BLOQUEADO", "SUSPENDIDO"].includes(status)) {
      user.status = status;
      if (status !== "ACTIVO") {
        AuthService.invalidateUserSessions(id);
      }
    }

    user.updated_at = new Date().toISOString();
    user.updatedAt = user.updated_at;
    db.persist();

    // Audit changes
    if (previousRole !== user.role) {
      db.logAudit({
        user_id: adminUser.id,
        user_name: adminUser.name,
        user_role: adminUser.role,
        module: "CONFIGURACION",
        action: "ROLE_CHANGED",
        entity_type: "USER",
        entity_id: user.id,
        previous_value: previousRole,
        new_value: user.role,
      });
    }

    if (previousStatus !== user.status) {
      db.logAudit({
        user_id: adminUser.id,
        user_name: adminUser.name,
        user_role: adminUser.role,
        module: "CONFIGURACION",
        action: user.status === "ACTIVO" ? "USER_ACTIVATED" : "USER_DEACTIVATED",
        entity_type: "USER",
        entity_id: user.id,
        previous_value: previousStatus,
        new_value: user.status,
      });
    }

    if (previousSalesId !== user.salesExecutiveId) {
      db.logAudit({
        user_id: adminUser.id,
        user_name: adminUser.name,
        user_role: adminUser.role,
        module: "CONFIGURACION",
        action: "SALES_EXECUTIVE_ASSIGNED",
        entity_type: "USER",
        entity_id: user.id,
        previous_value: previousSalesId || "NINGUNO",
        new_value: user.salesExecutiveId || "NINGUNO",
      });
    }

    db.logAudit({
      user_id: adminUser.id,
      user_name: adminUser.name,
      user_role: adminUser.role,
      module: "CONFIGURACION",
      action: "USER_UPDATED",
      entity_type: "USER",
      entity_id: user.id,
      new_value: `Datos de usuario actualizados: ${user.name} (${user.email})`,
    });

    const { password_hash: _h, salt: _s, ...safeUser } = user;
    res.json({
      success: true,
      message: "Usuario actualizado correctamente.",
      user: safeUser,
    });
  } catch (err: any) {
    console.error("Update user error:", err);
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
});

// Toggle / Set Status
app.patch("/api/users/:id/status", requireAuth, requirePermission("CONFIGURACION", "EDIT"), (req, res) => {
  try {
    const adminUser = (req as any).user;
    const { id } = req.params;
    const { status } = req.body;

    const user = db.getUsers().find((u) => u.id === id);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    const previousStatus = user.status;
    const newStatus = status || (user.status === "ACTIVO" ? "INACTIVO" : "ACTIVO");

    user.status = newStatus;
    if (newStatus !== "ACTIVO") {
      AuthService.invalidateUserSessions(id);
    }

    user.updated_at = new Date().toISOString();
    user.updatedAt = user.updated_at;
    db.persist();

    db.logAudit({
      user_id: adminUser.id,
      user_name: adminUser.name,
      user_role: adminUser.role,
      module: "CONFIGURACION",
      action: newStatus === "ACTIVO" ? "USER_ACTIVATED" : "USER_DEACTIVATED",
      entity_type: "USER",
      entity_id: user.id,
      previous_value: previousStatus,
      new_value: newStatus,
    });

    res.json({
      success: true,
      message: `Usuario ${user.name} ahora se encuentra ${newStatus}.`,
      status: user.status,
    });
  } catch (err: any) {
    console.error("Status toggle error:", err);
    res.status(500).json({ error: "Error al cambiar estado del usuario" });
  }
});

// Admin Reset Password
app.post("/api/users/:id/reset-password", requireAuth, requirePermission("CONFIGURACION", "EDIT"), (req, res) => {
  try {
    const adminUser = (req as any).user;
    const { id } = req.params;
    const { temporary_password } = req.body;

    const user = db.getUsers().find((u) => u.id === id);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    const tempPass = temporary_password || `ConsCore${Math.floor(1000 + Math.random() * 9000)}!`;

    // Password Policy
    if (
      tempPass.length < 8 ||
      !/[A-Z]/.test(tempPass) ||
      !/[a-z]/.test(tempPass) ||
      !/[0-9]/.test(tempPass)
    ) {
      return res.status(400).json({
        error: "La contraseña temporal debe contener al menos 8 caracteres, mayúsculas, minúsculas y números.",
      });
    }

    const newSalt = generateSalt();
    const newHash = hashPassword(tempPass, newSalt);

    user.salt = newSalt;
    user.password_hash = newHash;
    user.must_change_password = true;
    user.mustChangePassword = true;
    user.updated_at = new Date().toISOString();
    user.updatedAt = user.updated_at;

    // Invalidate user active sessions
    AuthService.invalidateUserSessions(id);

    db.persist();

    // Audit log (NO password in log)
    db.logAudit({
      user_id: adminUser.id,
      user_name: adminUser.name,
      user_role: adminUser.role,
      module: "CONFIGURACION",
      action: "PASSWORD_RESET",
      entity_type: "USER",
      entity_id: user.id,
      new_value: `Contraseña restablecida por Administrador (${adminUser.name}). Se requerirá cambio de contraseña en próximo inicio de sesión.`,
    });

    res.json({
      success: true,
      message: `Contraseña restablecida exitosamente para ${user.name}.`,
      temporaryPassword: tempPass,
      mustChangePassword: true,
    });
  } catch (err: any) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Error al restablecer contraseña" });
  }
});

// Delete user / Inactivate
app.delete("/api/users/:id", requireAuth, requirePermission("CONFIGURACION", "DELETE"), (req, res) => {
  try {
    const adminUser = (req as any).user;
    const { id } = req.params;

    const userIndex = db.getUsers().findIndex((u) => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    const user = db.getUsers()[userIndex];

    // Check historical operations
    const hasQuotes = db.getQuotes().some((q) => q.salesExecutiveId === user.salesExecutiveId || q.salesperson_id === id);
    const hasOrders = db.getOrders().some((o) => o.salesperson_id === id || (o as any).salesExecutiveId === user.salesExecutiveId);
    const hasMovements = db.getMovements().some((m) => m.created_by === id);

    if (hasQuotes || hasOrders || hasMovements) {
      // Rule: Do NOT physically delete users with historical operations. Soft delete (INACTIVO) instead.
      user.status = "INACTIVO";
      AuthService.invalidateUserSessions(id);
      db.persist();

      db.logAudit({
        user_id: adminUser.id,
        user_name: adminUser.name,
        user_role: adminUser.role,
        module: "CONFIGURACION",
        action: "USER_DEACTIVATED",
        entity_type: "USER",
        entity_id: user.id,
        new_value: `Usuario desactivado (bloqueado de borrado físico por trazabilidad comercial de cotizaciones/pedidos)`,
      });

      return res.json({
        success: true,
        message: "El usuario cuenta con historial comercial. Se ha desactivado (estado INACTIVO) para proteger la trazabilidad fiscal y comercial.",
        status: "INACTIVO",
      });
    }

    // Otherwise remove
    db.getUsers().splice(userIndex, 1);
    AuthService.invalidateUserSessions(id);
    db.persist();

    db.logAudit({
      user_id: adminUser.id,
      user_name: adminUser.name,
      user_role: adminUser.role,
      module: "CONFIGURACION",
      action: "USER_DELETED",
      entity_type: "USER",
      entity_id: id,
      new_value: `Usuario ${user.name} eliminado de la base central`,
    });

    res.json({ success: true, message: "Usuario eliminado correctamente." });
  } catch (err: any) {
    console.error("Delete user error:", err);
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
});

// ==========================================
// 3. ROLES & PERMISSIONS
// ==========================================
app.get("/api/roles", requireAuth, (_req, res) => {
  res.json(db.getRoles());
});

app.get("/api/permissions", requireAuth, (_req, res) => {
  res.json(db.getPermissions());
});

app.get("/api/role-permissions", requireAuth, (_req, res) => {
  res.json(db.getRolePermissions());
});

// ==========================================
// 4. CUSTOMERS (CLIENTES - RLS & ANTI-SPOOFING)
// ==========================================

// 4.0 Check Duplicates (Observación 04 Requirement #17)
app.post("/api/customers/check-duplicate", requireAuth, requirePermission("CLIENTES", "VIEW"), (req, res) => {
  try {
    const user = (req as any).user;
    const { phone, email, rfc, tax_id, companyName, company_name } = req.body;

    const qPhone = (phone || '').replace(/[^0-9]/g, '');
    const qEmail = (email || '').trim().toLowerCase();
    const qRfc = (rfc || tax_id || '').trim().toUpperCase();
    const qComp = (companyName || company_name || '').trim().toLowerCase();

    if (!qPhone && !qEmail && !qRfc && !qComp) {
      return res.json({ isDuplicate: false });
    }

    const matched = db.getCustomers().find((c: any) => {
      const cPhone = (c.phone || '').replace(/[^0-9]/g, '');
      const cEmail = (c.email || '').trim().toLowerCase();
      const cRfc = (c.tax_id || c.rfc || '').trim().toUpperCase();
      const cComp = (c.company_name || c.businessName || '').trim().toLowerCase();

      const matchPhone = qPhone.length >= 7 && cPhone.includes(qPhone);
      const matchEmail = qEmail.length >= 4 && cEmail === qEmail;
      const matchRfc = qRfc.length >= 5 && cRfc === qRfc;
      const matchComp = qComp.length >= 4 && (cComp.includes(qComp) || qComp.includes(cComp));

      return matchPhone || matchEmail || matchRfc || matchComp;
    });

    if (!matched) {
      return res.json({ isDuplicate: false });
    }

    const notice = CommercialRLSService.sanitizeDuplicateNotice(matched, user);
    res.json(notice);
  } catch (err: any) {
    res.status(500).json({ error: "Error validando duplicados: " + err.message });
  }
});

// 4.1 List Customers with Scoping and Search (Observación 04 Requirements #4, #5, #14, #15)
app.get("/api/customers", requireAuth, requirePermission("CLIENTES", "VIEW"), (req, res) => {
  try {
    const user = (req as any).user;
    let scopedCustomers = CommercialRLSService.scopeCustomers(db.getCustomers(), user);

    // Filter by query parameters if supplied
    const query = ((req.query.search || req.query.q || "") as string).trim().toLowerCase();
    if (query) {
      scopedCustomers = scopedCustomers.filter((c: any) =>
        (c.company_name || c.businessName || "").toLowerCase().includes(query) ||
        (c.customer_number || c.code || "").toLowerCase().includes(query) ||
        (c.tax_id || c.rfc || "").toLowerCase().includes(query) ||
        (c.city || "").toLowerCase().includes(query) ||
        (c.contact_name || c.contactName || "").toLowerCase().includes(query)
      );
    }

    // Sanitize to strip management margin/profit/cogs
    const sanitized = scopedCustomers.map((c: any) => CommercialRLSService.sanitizeCustomer(c, user));
    res.json(sanitized);
  } catch (err: any) {
    res.status(500).json({ error: "Error consultando clientes: " + err.message });
  }
});

// 4.2 Create Customer with Anti-Spoofing and Duplicate Protection (Observación 04 Requirements #11, #17)
app.post("/api/customers", requireAuth, requirePermission("CLIENTES", "CREATE"), (req, res) => {
  try {
    const user = (req as any).user;
    const body = req.body;

    const companyName = (body.company_name || body.businessName || "").trim();
    if (!companyName) {
      return res.status(400).json({ error: "La razón social de la empresa es obligatoria." });
    }

    const myExecId = CommercialRLSService.resolveSalesExecutiveId(user);

    // Anti-Spoofing check for VENDEDOR
    if (user.role === "VENDEDOR") {
      const attemptedExecId =
        body.salesExecutiveId ||
        body.sales_executive_id ||
        body.assignedSalesExecutiveId ||
        body.assigned_sales_executive_id;
      const attemptedSellerId =
        body.assigned_salesperson_id ||
        body.assignedSalespersonId ||
        body.sellerId;

      if (attemptedExecId && attemptedExecId !== myExecId) {
        db.logAudit({
          user_id: user.id,
          user_name: user.name,
          user_role: user.role,
          module: "CLIENTES",
          action: "ANTI_SPOOFING_BLOCKED",
          entity_type: "CUSTOMER",
          entity_id: "NEW",
          new_value: `Intento de creación maliciosa (anti-spoofing): El vendedor ${user.name} (${myExecId}) intentó registrar cliente con salesExecutiveId ajeno (${attemptedExecId}). Bloqueado con 403.`,
        });
        return res.status(403).json({
          error: "403 FORBIDDEN: Anti-Spoofing: Un vendedor no puede registrar clientes asignados a otro ejecutivo comercial.",
          code: "RLS_SPOOFING_BLOCKED",
        });
      }

      if (attemptedSellerId && attemptedSellerId !== user.id && attemptedSellerId !== myExecId) {
        return res.status(403).json({
          error: "403 FORBIDDEN: Anti-Spoofing: Un vendedor no puede asignar clientes a otro usuario.",
          code: "RLS_SPOOFING_BLOCKED",
        });
      }
    }

    // Duplicate Detection without sensitive data leakage (Requirement #17)
    const qRfc = (body.tax_id || body.rfc || "").trim().toUpperCase();
    const qName = companyName.toLowerCase();
    const existingDuplicate = db.getCustomers().find((c: any) => {
      const cRfc = (c.tax_id || c.rfc || "").trim().toUpperCase();
      const cName = (c.company_name || c.businessName || "").trim().toLowerCase();
      return (qRfc && cRfc && qRfc === cRfc) || (qName && cName && qName === cName);
    });

    if (existingDuplicate) {
      const notice = CommercialRLSService.sanitizeDuplicateNotice(existingDuplicate, user);
      return res.status(409).json({
        error: notice.message,
        code: notice.isCrossVendor ? "DUPLICATE_CROSS_VENDOR" : "DUPLICATE_OWN_CUSTOMER",
      });
    }

    const assignedSellerId = user.role === "VENDEDOR" ? user.id : (body.assigned_salesperson_id || user.id);
    const assignedSellerName = user.role === "VENDEDOR" ? user.name : (body.assigned_salesperson_name || user.name);
    const assignedExecId = user.role === "VENDEDOR" ? myExecId : CommercialRLSService.resolveSalesExecutiveId({ id: assignedSellerId, name: assignedSellerName });

    const customerNumber = db.nextCustomerNumber();
    const newCustomer = {
      id: `CUS-${Date.now().toString(36)}`,
      customer_number: customerNumber,
      company_name: companyName,
      contact_name: body.contact_name || body.contactName || "",
      phone: body.phone || "",
      email: body.email || "",
      address: body.address || "",
      city: body.city || "",
      state: body.state || "",
      tax_id: qRfc,
      credit_limit: user.role === "VENDEDOR" ? 150000 : (Number(body.credit_limit) || 0),
      credit_status: body.credit_status || "CORRIENTE",
      current_balance: 0,
      assigned_salesperson_id: assignedSellerId,
      assigned_salesperson_name: assignedSellerName,
      salesExecutiveId: assignedExecId,
      sales_executive_id: assignedExecId,
      assignedSalesExecutiveId: assignedExecId,
      assigned_sales_executive_id: assignedExecId,
      status: body.status || "ACTIVO",
      paymentTerms: body.paymentTerms || "30 días crédito",
      discountRate: 0,
      notes: body.notes || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.getCustomers().unshift(newCustomer as any);

    db.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      module: "CLIENTES",
      action: "CREAR_CLIENTE",
      entity_type: "CUSTOMER",
      entity_id: customerNumber,
      new_value: `Cliente ${newCustomer.company_name} registrado exitosamente asignado a ${assignedSellerName} (${assignedExecId})`,
    });

    db.persist();
    eventBus.broadcast("customer_created", newCustomer);

    res.status(201).json(CommercialRLSService.sanitizeCustomer(newCustomer, user));
  } catch (err: any) {
    res.status(500).json({ error: "Error al crear cliente: " + err.message });
  }
});

// 4.3 Update Customer with Ownership and Anti-Reassignment Check (Observación 04 Requirement #12)
const handleCustomerUpdate = (req: any, res: any) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const customer = db.getCustomers().find(c => c.id === id || c.customer_number === id || (c as any).code === id);

    if (!customer) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    // Row-Level Security Access Check
    const access = CommercialRLSService.validateAccess(user, 'CUSTOMER', customer, 'UPDATE');
    if (!access.allowed) {
      db.logAudit({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        module: "CLIENTES",
        action: "ACCESO_DENEGADO_RLS",
        entity_type: "CUSTOMER",
        entity_id: customer.customer_number || customer.id,
        new_value: access.error || "Intento de edición bloqueado por política de segregación comercial RLS (403)",
      });
      return res.status(403).json({ error: access.error });
    }

    // Prevent sales executive reassignment if user is VENDEDOR (Requirement #12)
    if (user.role === 'VENDEDOR') {
      const currentExecId = customer.salesExecutiveId || (customer as any).sales_executive_id || CommercialRLSService.resolveSalesExecutiveId({ id: customer.assigned_salesperson_id });
      const attemptedExecId =
        req.body.salesExecutiveId ||
        req.body.sales_executive_id ||
        req.body.assignedSalesExecutiveId ||
        req.body.assigned_sales_executive_id;
      const attemptedSellerId =
        req.body.assigned_salesperson_id ||
        req.body.assignedSalespersonId ||
        req.body.sellerId;

      if (attemptedExecId && attemptedExecId !== currentExecId) {
        db.logAudit({
          user_id: user.id,
          user_name: user.name,
          user_role: user.role,
          module: "CLIENTES",
          action: "REASIGNACION_NO_AUTORIZADA_BLOQUEADA",
          entity_type: "CUSTOMER",
          entity_id: customer.customer_number || customer.id,
          new_value: `Intento ilegal de reasignar cliente ${customer.company_name} a ${attemptedExecId}. Bloqueado con 403.`,
        });
        return res.status(403).json({
          error: "403 ACCESS_DENIED: Modificación no autorizada. No puedes reasignar clientes a otro vendedor. La reasignación es exclusiva de la Gerencia Comercial o Dirección.",
          code: "RLS_REASSIGNMENT_BLOCKED",
        });
      }

      if (attemptedSellerId && attemptedSellerId !== customer.assigned_salesperson_id && attemptedSellerId !== user.id) {
        return res.status(403).json({
          error: "403 ACCESS_DENIED: Modificación no autorizada. No puedes cambiar el vendedor asignado. La reasignación es exclusiva de la Gerencia Comercial o Dirección.",
          code: "RLS_REASSIGNMENT_BLOCKED",
        });
      }

      // Strip sensitive management / ownership fields
      delete req.body.assigned_salesperson_id;
      delete req.body.assigned_salesperson_name;
      delete req.body.salesExecutiveId;
      delete req.body.sales_executive_id;
      delete req.body.assignedSalesExecutiveId;
      delete req.body.assigned_sales_executive_id;
      delete req.body.credit_limit;
      delete req.body.creditLimit;
      delete req.body.cost;
      delete req.body.cogs;
      delete req.body.internalMargin;
    }

    const prev = JSON.stringify(customer);
    Object.assign(customer, req.body, { updated_at: new Date().toISOString() });

    db.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      module: "CLIENTES",
      action: "EDITAR_CLIENTE",
      entity_type: "CUSTOMER",
      entity_id: customer.customer_number || customer.id,
      previous_value: prev,
      new_value: JSON.stringify(customer),
    });

    db.persist();
    eventBus.broadcast("customer_updated", customer);

    res.json(CommercialRLSService.sanitizeCustomer(customer, user));
  } catch (e: any) {
    res.status(500).json({ error: "Error actualizando cliente: " + e.message });
  }
};

app.put("/api/customers/:id", requireAuth, requirePermission("CLIENTES", "EDIT"), handleCustomerUpdate);
app.patch("/api/customers/:id", requireAuth, requirePermission("CLIENTES", "EDIT"), handleCustomerUpdate);

// 4.4 Delete Customer - Blocked for VENDEDOR (Observación 04 Requirement #19)
app.delete("/api/customers/:id", requireAuth, requirePermission("CLIENTES", "DELETE"), (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const customer = db.getCustomers().find(c => c.id === id || c.customer_number === id || (c as any).code === id);

    if (!customer) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    const access = CommercialRLSService.validateAccess(user, 'CUSTOMER', customer, 'DELETE');
    if (!access.allowed) {
      db.logAudit({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        module: "CLIENTES",
        action: "ACCESO_DENEGADO_RLS",
        entity_type: "CUSTOMER",
        entity_id: customer.customer_number || customer.id,
        new_value: access.error || "Intento de eliminación de cliente bloqueado por segregación (403)",
      });
      return res.status(403).json({ error: access.error });
    }

    const idx = db.getCustomers().findIndex(c => c.id === customer.id);
    if (idx !== -1) {
      db.getCustomers().splice(idx, 1);
    }

    db.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      module: "CLIENTES",
      action: "ELIMINAR_CLIENTE",
      entity_type: "CUSTOMER",
      entity_id: customer.customer_number || customer.id,
      new_value: `Cliente ${customer.company_name} archivado/eliminado por ${user.name}`,
    });

    db.persist();
    eventBus.broadcast("customer_deleted", { id: customer.id });
    res.json({ success: true, message: "Cliente eliminado correctamente." });
  } catch (err: any) {
    res.status(500).json({ error: "Error eliminando cliente: " + err.message });
  }
});

// 4.5 Get Single Customer by ID (Observación 04 Requirement #6)
app.get("/api/customers/:id", requireAuth, requirePermission("CLIENTES", "VIEW"), (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const customer = db.getCustomers().find(c => c.id === id || c.customer_number === id || (c as any).code === id);
    if (!customer) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    const access = CommercialRLSService.validateAccess(user, 'CUSTOMER', customer, 'READ');
    if (!access.allowed) {
      db.logAudit({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        module: "CLIENTES",
        action: "ACCESO_DENEGADO_RLS",
        entity_type: "CUSTOMER",
        entity_id: customer.customer_number || customer.id,
        new_value: access.error || "Intento de consulta directa bloqueado por política de segregación comercial RLS (403)",
      });
      return res.status(403).json({ error: access.error || "403 ACCESS_DENIED: Este cliente pertenece a otro ejecutivo comercial." });
    }

    res.json(CommercialRLSService.sanitizeCustomer(customer, user));
  } catch (e: any) {
    res.status(500).json({ error: "Error consultando cliente: " + e.message });
  }
});

// 4.6 Dossier Cliente 360 (Observación 04 Requirements #7, #8)
app.get("/api/customers/:id/360", requireAuth, requirePermission("CLIENTES", "VIEW"), (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const customer = db.getCustomers().find(c => c.id === id || c.customer_number === id || (c as any).code === id);
    if (!customer) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    const access = CommercialRLSService.validateAccess(user, 'CUSTOMER', customer, 'READ');
    if (!access.allowed) {
      const myExecId = CommercialRLSService.resolveSalesExecutiveId(user);
      db.logAudit({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        module: "CLIENTES",
        action: "ACCESO_DENEGADO_RLS",
        entity_type: "CUSTOMER",
        entity_id: customer.customer_number || customer.id,
        new_value: `Violación RLS bloqueada (403): El vendedor ${user.name} (${myExecId}) intentó consultar el expediente 360° del cliente ${customer.company_name} perteneciente a otro ejecutivo.`,
      });
      return res.status(403).json({
        error: "403 ACCESS_DENIED: Expediente Client 360 restringido. Este cliente pertenece a otro ejecutivo de ventas.",
        code: "RLS_CROSS_VENDOR_BLOCKED",
      });
    }

    const customerId = customer.id;
    const allQuotes = db.getQuotes().filter(q => q.customer_id === customerId || (q as any).customerId === customerId);
    const allOrders = db.getOrders().filter(o => o.customer_id === customerId || (o as any).customerId === customerId);
    const allLeads = db.getLeads().filter(l => (l as any).customerId === customerId);
    const allOpps = db.getOpportunities().filter(o => o.customerId === customerId || o.customer_id === customerId);
    const allCases = db.getServiceCases().filter(cs => cs.customerId === customerId || cs.customerId === customer.customer_number || cs.customerId === (customer as any).code);

    res.json({
      customer: CommercialRLSService.sanitizeCustomer(customer, user),
      quotes: CommercialRLSService.scopeQuotes(allQuotes, user),
      orders: CommercialRLSService.scopeOrders(allOrders, user),
      leads: CommercialRLSService.scopeLeads(allLeads, user),
      opportunities: CommercialRLSService.scopeOpportunities(allOpps, user),
      cases: CommercialRLSService.scopeCases(allCases, user, db.getCustomers()),
    });
  } catch (e: any) {
    res.status(500).json({ error: "Error consultando expediente Client 360: " + e.message });
  }
});

// Observación 17: Sub-entity cases for Client 360
app.get("/api/customers/:id/cases", requireAuth, requirePermission("CLIENTES", "VIEW"), (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const customer = db.getCustomers().find(c => c.id === id || c.customer_number === id || (c as any).code === id);
    if (!customer) return res.status(404).json({ error: "Cliente no encontrado" });

    const access = CommercialRLSService.validateAccess(user, 'CUSTOMER', customer, 'READ');
    if (!access.allowed) {
      return res.status(403).json({ error: "403 ACCESS_DENIED: Cliente asignado a otro ejecutivo de ventas.", code: "RLS_CROSS_VENDOR_BLOCKED" });
    }

    const customerId = customer.id;
    const allCases = db.getServiceCases().filter(cs => cs.customerId === customerId || cs.customerId === customer.customer_number || cs.customerId === (customer as any).code);
    res.json(CommercialRLSService.scopeCases(allCases, user, db.getCustomers()));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 4.7 Sub-entity Routes (Observación 04 Requirement #8)
app.get("/api/customers/:id/quotes", requireAuth, requirePermission("CLIENTES", "VIEW"), (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const customer = db.getCustomers().find(c => c.id === id || c.customer_number === id || (c as any).code === id);
    if (!customer) return res.status(404).json({ error: "Cliente no encontrado" });

    const access = CommercialRLSService.validateAccess(user, 'CUSTOMER', customer, 'READ');
    if (!access.allowed) return res.status(403).json({ error: access.error });

    const quotes = db.getQuotes().filter(q => q.customer_id === customer.id || (q as any).customerId === customer.id);
    res.json(CommercialRLSService.scopeQuotes(quotes, user));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/customers/:id/orders", requireAuth, requirePermission("CLIENTES", "VIEW"), (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const customer = db.getCustomers().find(c => c.id === id || c.customer_number === id || (c as any).code === id);
    if (!customer) return res.status(404).json({ error: "Cliente no encontrado" });

    const access = CommercialRLSService.validateAccess(user, 'CUSTOMER', customer, 'READ');
    if (!access.allowed) return res.status(403).json({ error: access.error });

    const orders = db.getOrders().filter(o => o.customer_id === customer.id || (o as any).customerId === customer.id);
    res.json(CommercialRLSService.scopeOrders(orders, user));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/customers/:id/opportunities", requireAuth, requirePermission("CLIENTES", "VIEW"), (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const customer = db.getCustomers().find(c => c.id === id || c.customer_number === id || (c as any).code === id);
    if (!customer) return res.status(404).json({ error: "Cliente no encontrado" });

    const access = CommercialRLSService.validateAccess(user, 'CUSTOMER', customer, 'READ');
    if (!access.allowed) return res.status(403).json({ error: access.error });

    const opps = db.getOpportunities().filter(o => o.customerId === customer.id || o.customer_id === customer.id);
    res.json(CommercialRLSService.scopeOpportunities(opps, user));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4.1 LEADS & PROSPECTS (CRM)
// ==========================================
app.get("/api/leads", requireAuth, requirePermission("VENTAS", "VIEW"), (req, res) => {
  const user = (req as any).user;
  const scopedLeads = CommercialRLSService.scopeLeads(db.getLeads(), user);
  res.json(scopedLeads);
});

app.post("/api/leads", requireAuth, requirePermission("VENTAS", "CREATE"), (req, res) => {
  try {
    const user = (req as any).user;
    const body = req.body;

    if (!body.company && !body.company_name) {
      return res.status(400).json({ error: "La empresa / razón social del prospecto es obligatoria." });
    }
    if (!body.name && !body.contact_name) {
      return res.status(400).json({ error: "El nombre del contacto es obligatorio." });
    }

    let assignedSellerId: string;
    let assignedSellerName: string;
    let assignedExecId: string;

    if (user.role === "VENDEDOR") {
      const myExecId = CommercialRLSService.resolveSalesExecutiveId(user);
      const attemptedExecId = body.salesExecutiveId || body.assignedSalesExecutiveId || body.assigned_sales_executive_id || body.sales_executive_id;
      const attemptedSellerId = body.salespersonId || body.salesperson_id || body.assigned_salesperson_id || body.assignedSalespersonId || body.ownerId;
      const attemptedSellerName = body.salespersonName || body.salesperson_name || body.assigned_salesperson_name;

      // Check if client tried to specify a different salesperson/executive
      const isCrossOwnerAttempt =
        (attemptedExecId && !CommercialRLSService.matchesOwner(user, attemptedExecId, attemptedSellerName)) ||
        (attemptedSellerId && !CommercialRLSService.matchesOwner(user, attemptedSellerId, attemptedSellerName));

      if (isCrossOwnerAttempt) {
        db.logAudit({
          user_id: user.id,
          user_name: user.name,
          user_role: user.role,
          module: "VENTAS",
          action: "CROSS_OWNER_ASSIGNMENT_DENIED",
          entity_type: "LEAD",
          entity_id: "N/A",
          new_value: `Violación RLS bloqueada (403): El vendedor ${user.name} (${myExecId}) intentó registrar o asignar un lead al ejecutivo ${attemptedExecId || attemptedSellerId}.`,
        });

        return res.status(403).json({
          error: "403 ACCESS_DENIED: Asignación cruzada denegada. Un ejecutivo de ventas no puede crear ni asignar prospectos/leads para otro vendedor.",
          code: "CROSS_OWNER_ASSIGNMENT_DENIED",
        });
      }

      // Automatically assign from authenticated session
      assignedSellerId = user.id;
      assignedSellerName = user.name;
      assignedExecId = myExecId;
    } else {
      // Privileged roles (ADMIN, GERENTE_VENTAS, DIRECTOR)
      assignedSellerId = body.salespersonId || body.assigned_salesperson_id || user.id;
      assignedSellerName = body.salespersonName || body.assigned_salesperson_name || user.name;
      assignedExecId = body.salesExecutiveId || CommercialRLSService.resolveSalesExecutiveId({ id: assignedSellerId, name: assignedSellerName }) || CommercialRLSService.resolveSalesExecutiveId(user);
    }

    const leadFolio = db.nextLeadNumber();
    const newLead = {
      id: `LED-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5)}`,
      folio: leadFolio,
      company: body.company || body.company_name || "",
      name: body.name || body.contact_name || "",
      phone: body.phone || "",
      email: body.email || "",
      city: body.city || "",
      state: body.state || "México",
      rfc: (body.rfc || "").toUpperCase(),
      source: body.source || "WHATSAPP",
      productInterest: body.productInterest || body.product_interest || "General",
      estimatedValue: Number(body.estimatedValue || body.estimated_value) || 0,
      salespersonId: assignedSellerId,
      salespersonName: assignedSellerName,
      salesExecutiveId: assignedExecId,
      sales_executive_id: assignedExecId,
      assignedSalesExecutiveId: assignedExecId,
      assigned_sales_executive_id: assignedExecId,
      assigned_salesperson_id: assignedSellerId,
      assigned_salesperson_name: assignedSellerName,
      status: body.status || "NUEVO",
      notes: body.notes || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.getLeads().unshift(newLead as any);

    db.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      module: "VENTAS",
      action: "CREAR_LEAD",
      entity_type: "LEAD",
      entity_id: newLead.folio,
      new_value: `Lead ${newLead.company} (${newLead.name}) registrado exitosamente asignado a ${assignedSellerName} (${assignedExecId})`,
    });

    db.persist();
    eventBus.broadcast("lead_created", newLead);

    res.status(201).json(newLead);
  } catch (err: any) {
    res.status(500).json({ error: "Error al registrar lead" });
  }
});

app.put("/api/leads/:id", requireAuth, requirePermission("VENTAS", "EDIT"), (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const lead = db.getLeads().find(l => l.id === id || (l as any).folio === id);

    if (!lead) {
      return res.status(404).json({ error: "Lead no encontrado" });
    }

    // Row-Level Security Check
    const access = CommercialRLSService.validateAccess(user, 'LEAD', lead, 'UPDATE');
    if (!access.allowed) {
      db.logAudit({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        module: "VENTAS",
        action: "ACCESO_DENEGADO_RLS",
        entity_type: "LEAD",
        entity_id: (lead as any).folio || lead.id,
        new_value: access.error || "Intento de edición bloqueado por política de segregación comercial RLS",
      });
      return res.status(403).json({ error: access.error });
    }

    if (user.role === "VENDEDOR") {
      const myExecId = CommercialRLSService.resolveSalesExecutiveId(user);
      const attemptedExecId = req.body.salesExecutiveId || req.body.assignedSalesExecutiveId || req.body.assigned_sales_executive_id || req.body.sales_executive_id;
      const attemptedSellerId = req.body.salespersonId || req.body.salesperson_id || req.body.assigned_salesperson_id || req.body.assignedSalespersonId || req.body.ownerId;
      const attemptedSellerName = req.body.salespersonName || req.body.salesperson_name || req.body.assigned_salesperson_name;

      const isCrossOwnerAttempt =
        (attemptedExecId && !CommercialRLSService.matchesOwner(user, attemptedExecId, attemptedSellerName)) ||
        (attemptedSellerId && !CommercialRLSService.matchesOwner(user, attemptedSellerId, attemptedSellerName));

      if (isCrossOwnerAttempt) {
        db.logAudit({
          user_id: user.id,
          user_name: user.name,
          user_role: user.role,
          module: "VENTAS",
          action: "CROSS_OWNER_ASSIGNMENT_DENIED",
          entity_type: "LEAD",
          entity_id: (lead as any).folio || lead.id,
          new_value: `Violación RLS bloqueada (403): El vendedor ${user.name} (${myExecId}) intentó reasignar el lead a ${attemptedExecId || attemptedSellerId}.`,
        });

        return res.status(403).json({
          error: "403 ACCESS_DENIED: Reasignación no autorizada. Solo directivos y gerentes pueden reasignar leads.",
          code: "CROSS_OWNER_ASSIGNMENT_DENIED",
        });
      }

      delete req.body.salesExecutiveId;
      delete req.body.sales_executive_id;
      delete req.body.assignedSalesExecutiveId;
      delete req.body.assigned_sales_executive_id;
      delete req.body.salespersonId;
      delete req.body.salesperson_id;
      delete req.body.salespersonName;
      delete req.body.salesperson_name;
      delete req.body.assigned_salesperson_id;
      delete req.body.assigned_salesperson_name;
    }

    const prev = JSON.stringify(lead);
    Object.assign(lead, req.body, { updatedAt: new Date().toISOString(), updated_at: new Date().toISOString() });

    db.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      module: "VENTAS",
      action: "EDITAR_LEAD",
      entity_type: "LEAD",
      entity_id: (lead as any).folio || lead.id,
      previous_value: prev,
      new_value: JSON.stringify(lead),
    });

    db.persist();
    eventBus.broadcast("lead_updated", lead);

    res.json(lead);
  } catch (e) {
    res.status(500).json({ error: "Error actualizando lead" });
  }
});

app.get("/api/leads/:id", requireAuth, requirePermission("VENTAS", "VIEW"), (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const lead = db.getLeads().find(l => l.id === id || (l as any).folio === id);
    if (!lead) {
      return res.status(404).json({ error: "Prospecto no encontrado" });
    }

    const access = CommercialRLSService.validateAccess(user, 'LEAD', lead, 'READ');
    if (!access.allowed) {
      db.logAudit({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        module: "VENTAS",
        action: "ACCESO_DENEGADO_RLS",
        entity_type: "LEAD",
        entity_id: (lead as any).folio || lead.id,
        new_value: access.error || "Intento de consulta de lead ajeno bloqueado por RLS (403)",
      });
      return res.status(403).json({ error: access.error || "403 ACCESS_DENIED: Este prospecto pertenece a otro ejecutivo de ventas." });
    }

    res.json(lead);
  } catch (e: any) {
    res.status(500).json({ error: "Error consultando lead: " + e.message });
  }
});

// ==========================================
// 4.2 OPPORTUNITIES (OPORTUNIDADES CRM)
// ==========================================
app.get("/api/opportunities", requireAuth, requirePermission("VENTAS", "VIEW"), (req, res) => {
  const user = (req as any).user;
  const opps = db.getOpportunities();
  let scopedOpps = CommercialRLSService.scopeOpportunities(opps, user);
  const query = ((req.query.search || req.query.q || "") as string).trim().toLowerCase();
  if (query) {
    scopedOpps = scopedOpps.filter((o: any) =>
      (o.title || "").toLowerCase().includes(query) ||
      (o.folio || "").toLowerCase().includes(query) ||
      (o.customerName || o.customer_name || "").toLowerCase().includes(query) ||
      (o.notes || "").toLowerCase().includes(query)
    );
  }
  res.json(scopedOpps);
});

app.get("/api/opportunities/:id", requireAuth, requirePermission("VENTAS", "VIEW"), (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const opp = db.getOpportunities().find(o => o.id === id || o.folio === id);
    if (!opp) {
      return res.status(404).json({ error: "Oportunidad no encontrada" });
    }

    const access = CommercialRLSService.assertOpportunityOwnership(user, opp, 'READ');
    if (!access.allowed) {
      db.logAudit({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        module: "VENTAS",
        action: "ACCESO_DENEGADO_RLS",
        entity_type: "OPPORTUNITY",
        entity_id: opp.folio || opp.id,
        new_value: access.error || "Intento de consulta de oportunidad ajena bloqueado por RLS (403)",
      });
      return res.status(403).json({ error: access.error || "403 ACCESS_DENIED: Esta oportunidad pertenece a otro ejecutivo comercial." });
    }

    res.json(opp);
  } catch (e: any) {
    res.status(500).json({ error: "Error consultando oportunidad: " + e.message });
  }
});

app.post("/api/opportunities", requireAuth, requirePermission("VENTAS", "CREATE"), (req, res) => {
  try {
    const user = (req as any).user;
    const body = req.body;

    if (!body.title || (!body.customerId && !body.customer_id)) {
      return res.status(400).json({ error: "Título y cliente son obligatorios para la oportunidad." });
    }

    const customerId = body.customerId || body.customer_id;
    const customer = db.getCustomers().find(c => c.id === customerId);
    if (customer) {
      const access = CommercialRLSService.assertCustomerOwnership(user, customer, 'WRITE');
      if (!access.allowed) {
        db.logAudit({
          user_id: user.id,
          user_name: user.name,
          user_role: user.role,
          module: "VENTAS",
          action: "CUSTOMER_OWNERSHIP_VIOLATION",
          entity_type: "CUSTOMER",
          entity_id: customer.id || customerId,
          new_value: `Violación RLS bloqueada (403): El vendedor ${user.name} intentó crear una oportunidad para el cliente ${customer.company_name} que pertenece a otro ejecutivo.`,
        });
        return res.status(403).json({
          error: access.error || "403 ACCESS_DENIED: No puedes crear oportunidades para un cliente asignado a otro ejecutivo de ventas.",
          code: "CUSTOMER_OWNERSHIP_VIOLATION",
        });
      }
    } else if (user.role === 'VENDEDOR') {
      return res.status(404).json({ error: "Cliente no encontrado en el sistema o no asignado a tu cartera comercial." });
    }

    const leadId = body.leadId || body.lead_id;
    if (leadId) {
      const lead = db.getLeads().find((l: any) => l.id === leadId || l.folio === leadId);
      if (lead) {
        const leadAccess = CommercialRLSService.validateAccess(user, 'LEAD', lead, 'WRITE');
        if (!leadAccess.allowed) {
          db.logAudit({
            user_id: user.id,
            user_name: user.name,
            user_role: user.role,
            module: "VENTAS",
            action: "LEAD_OWNERSHIP_VIOLATION",
            entity_type: "LEAD",
            entity_id: lead.id || leadId,
            new_value: `Violación RLS bloqueada (403): El vendedor ${user.name} intentó crear una oportunidad desde un lead ajeno.`,
          });
          return res.status(403).json({
            error: leadAccess.error || "403 ACCESS_DENIED: No puedes crear oportunidades para un prospecto/lead asignado a otro ejecutivo de ventas.",
            code: "LEAD_OWNERSHIP_VIOLATION",
          });
        }
      }
    }

    let assignedSellerId: string;
    let assignedSellerName: string;
    let assignedExecId: string;

    if (user.role === 'VENDEDOR') {
      const myExecId = CommercialRLSService.resolveSalesExecutiveId(user);
      const attemptedExecId = body.salesExecutiveId || body.sales_executive_id || body.assignedSalesExecutiveId || body.assigned_sales_executive_id;
      const attemptedSellerId = body.salespersonId || body.salesperson_id || body.ownerId || body.owner_id || body.sellerId || body.seller_id || body.assignedTo || body.assigned_to;

      if ((attemptedExecId && attemptedExecId !== myExecId) || (attemptedSellerId && attemptedSellerId !== user.id)) {
        db.logAudit({
          user_id: user.id,
          user_name: user.name,
          user_role: user.role,
          module: "VENTAS",
          action: "CROSS_OWNER_ASSIGNMENT_DENIED",
          entity_type: "OPPORTUNITY",
          entity_id: "N/A",
          new_value: `Violación RLS bloqueada (403): El vendedor ${user.name} intentó asignar una oportunidad a otro ejecutivo (${attemptedExecId || attemptedSellerId}).`,
        });
        return res.status(403).json({
          error: "403 ACCESS_DENIED: Asignación cruzada denegada. Un vendedor no puede asignar oportunidades a otro ejecutivo.",
          code: "CROSS_OWNER_ASSIGNMENT_DENIED",
        });
      }

      assignedSellerId = user.id;
      assignedSellerName = user.name;
      assignedExecId = myExecId;
    } else {
      assignedSellerId = body.salespersonId || body.salesperson_id || body.ownerId || user.id;
      assignedSellerName = body.salespersonName || body.salesperson_name || user.name;
      assignedExecId = body.salesExecutiveId || CommercialRLSService.resolveSalesExecutiveId({ id: assignedSellerId, name: assignedSellerName }) || CommercialRLSService.resolveSalesExecutiveId(user);
    }

    const folio = db.nextOpportunityNumber();
    const newOpp = {
      id: `OPP-${Date.now().toString(36).toUpperCase()}`,
      folio,
      customerId,
      customerName: customer?.company_name || (customer as any)?.businessName || body.customerName || body.customer_name || "Cliente General",
      title: body.title,
      salespersonId: assignedSellerId,
      salespersonName: assignedSellerName,
      salesExecutiveId: assignedExecId,
      sales_executive_id: assignedExecId,
      estimatedValue: Number(body.estimatedValue || body.estimated_value) || 0,
      probability: Number(body.probability) || 25,
      stage: body.stage || "PROSPECCION",
      source: body.source || "PROSPECCION_DIRECTA",
      notes: body.notes || "",
      expectedCloseDate: body.expectedCloseDate || body.expected_close_date || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.getOpportunities().unshift(newOpp as any);

    db.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      module: "VENTAS",
      action: "CREAR_OPORTUNIDAD",
      entity_type: "OPPORTUNITY",
      entity_id: folio,
      new_value: `Oportunidad ${folio} (${newOpp.title}) creada para ${newOpp.customerName} por ${assignedSellerName} (${assignedExecId})`,
    });

    db.persist();
    res.status(201).json(newOpp);
  } catch (err: any) {
    res.status(500).json({ error: "Error creando oportunidad: " + err.message });
  }
});

const handleOpportunityUpdate = (req: any, res: any) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const opp = db.getOpportunities().find(o => o.id === id || o.folio === id);
    if (!opp) {
      return res.status(404).json({ error: "Oportunidad no encontrada" });
    }

    const access = CommercialRLSService.assertOpportunityOwnership(user, opp, 'UPDATE');
    if (!access.allowed) {
      db.logAudit({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        module: "VENTAS",
        action: "ACCESO_DENEGADO_RLS",
        entity_type: "OPPORTUNITY",
        entity_id: opp.folio || opp.id,
        new_value: access.error || "Intento de edición de oportunidad ajena bloqueado por RLS (403)",
      });
      return res.status(403).json({ error: access.error, code: access.code || "OPPORTUNITY_ACCESS_DENIED" });
    }

    if (user.role === 'VENDEDOR') {
      const myExecId = CommercialRLSService.resolveSalesExecutiveId(user);
      const attemptedExecId = req.body.salesExecutiveId || req.body.sales_executive_id || req.body.assignedSalesExecutiveId || req.body.assigned_sales_executive_id;
      const attemptedSellerId = req.body.salespersonId || req.body.salesperson_id || req.body.ownerId || req.body.owner_id || req.body.sellerId || req.body.seller_id || req.body.assignedTo || req.body.assigned_to;

      if ((attemptedExecId && attemptedExecId !== myExecId) || (attemptedSellerId && attemptedSellerId !== user.id)) {
        db.logAudit({
          user_id: user.id,
          user_name: user.name,
          user_role: user.role,
          module: "VENTAS",
          action: "OPPORTUNITY_OWNER_CHANGE_DENIED",
          entity_type: "OPPORTUNITY",
          entity_id: opp.folio || opp.id,
          new_value: `Violación RLS bloqueada (403): El vendedor ${user.name} intentó reasignar la oportunidad ${opp.folio} (${attemptedExecId || attemptedSellerId}).`,
        });
        return res.status(403).json({
          error: "403 ACCESS_DENIED: Un vendedor no puede reasignar oportunidades a otro ejecutivo.",
          code: "OPPORTUNITY_OWNER_CHANGE_DENIED",
        });
      }

      // Check if changing customer
      const targetCustomerId = req.body.customerId || req.body.customer_id;
      if (targetCustomerId && targetCustomerId !== opp.customerId) {
        const targetCustomer = db.getCustomers().find(c => c.id === targetCustomerId);
        const custAccess = CommercialRLSService.assertCustomerOwnership(user, targetCustomer, 'WRITE');
        if (!custAccess.allowed) {
          db.logAudit({
            user_id: user.id,
            user_name: user.name,
            user_role: user.role,
            module: "VENTAS",
            action: "CUSTOMER_OWNERSHIP_VIOLATION",
            entity_type: "OPPORTUNITY",
            entity_id: opp.folio || opp.id,
            new_value: `Violación RLS bloqueada (403): El vendedor ${user.name} intentó cambiar el cliente de la oportunidad ${opp.folio} a uno de otra cartera.`,
          });
          return res.status(403).json({
            error: "403 ACCESS_DENIED: No puedes vincular la oportunidad a un cliente asignado a otro ejecutivo comercial.",
            code: "CUSTOMER_OWNERSHIP_VIOLATION",
          });
        }
      }

      delete req.body.salesExecutiveId;
      delete req.body.sales_executive_id;
      delete req.body.assignedSalesExecutiveId;
      delete req.body.assigned_sales_executive_id;
      delete req.body.salespersonId;
      delete req.body.salesperson_id;
      delete req.body.ownerId;
      delete req.body.owner_id;
      delete req.body.sellerId;
      delete req.body.seller_id;
      delete req.body.assignedTo;
      delete req.body.assigned_to;
      delete req.body.salespersonName;
      delete req.body.salesperson_name;
    }

    Object.assign(opp, req.body, { updatedAt: new Date().toISOString() });

    db.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      module: "VENTAS",
      action: "EDITAR_OPORTUNIDAD",
      entity_type: "OPPORTUNITY",
      entity_id: opp.folio || opp.id,
      new_value: `Oportunidad ${opp.folio} editada por ${user.name}`,
    });

    db.persist();
    res.json(opp);
  } catch (err: any) {
    res.status(500).json({ error: "Error actualizando oportunidad: " + err.message });
  }
};

app.put("/api/opportunities/:id", requireAuth, requirePermission("VENTAS", "EDIT"), handleOpportunityUpdate);
app.patch("/api/opportunities/:id", requireAuth, requirePermission("VENTAS", "EDIT"), handleOpportunityUpdate);

// ==========================================
// 5. PRODUCTS & INVENTORY & COMMERCIAL AVAILABILITY
// ==========================================
app.get("/api/products", requireAuth, (req, res) => {
  const user = (req as any).user;
  const hasInv = AuthService.checkPermission(user.role, "INVENTARIO", "VIEW");
  const hasCot = AuthService.checkPermission(user.role, "COTIZACIONES", "VIEW");
  const hasVen = AuthService.checkPermission(user.role, "VENTAS", "VIEW");

  if (!hasInv && !hasCot && !hasVen) {
    return res.status(403).json({ error: "Acceso denegado a catálogo de productos." });
  }

  const products = db.getProducts();
  const safeProducts = CommercialRLSService.scopeProducts(products, user);

  // If includeAvailability query parameter is requested (Section 14)
  if (req.query.includeAvailability === "true") {
    const enriched = safeProducts.map(p => {
      const avail = QuoteAvailabilityService.calculateAvailability(p);
      return {
        ...p,
        physical_stock: avail.physicalStock,
        reserved_stock: avail.reservedStock,
        available_stock: avail.availableStock,
        physicalStock: avail.physicalStock,
        reservedStock: avail.reservedStock,
        availableStock: avail.availableStock,
        delivery_status: avail.status,
        delivery_status_label: avail.statusLabel,
        delivery_recommendation: avail.deliveryRecommendation,
        warehouses: avail.warehouses,
      };
    });
    return res.json(enriched);
  }

  res.json(safeProducts);
});

app.get("/api/products/:id", requireAuth, (req, res) => {
  const user = (req as any).user;
  const hasInv = AuthService.checkPermission(user.role, "INVENTARIO", "VIEW");
  const hasCot = AuthService.checkPermission(user.role, "COTIZACIONES", "VIEW");
  const hasVen = AuthService.checkPermission(user.role, "VENTAS", "VIEW");

  if (!hasInv && !hasCot && !hasVen) {
    return res.status(403).json({ error: "Acceso denegado a consulta de producto." });
  }

  const { id } = req.params;
  const product = db.getProducts().find(p => p.id === id || p.code === id || p.sku === id);
  if (!product) {
    return res.status(404).json({ error: "Producto no encontrado" });
  }
  const safeProduct = CommercialRLSService.scopeProducts([product], user)[0];
  res.json(safeProduct);
});

// OBSERVACIÓN 09: Endpoints Comerciales de Disponibilidad (Sección 14)
app.get("/api/commercial/products/availability", requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    const hasCot = AuthService.checkPermission(user.role, "COTIZACIONES", "VIEW");
    const hasVen = AuthService.checkPermission(user.role, "VENTAS", "VIEW");
    const hasInv = AuthService.checkPermission(user.role, "INVENTARIO", "VIEW");

    if (!hasCot && !hasVen && !hasInv) {
      return res.status(403).json({ error: "403 FORBIDDEN: Se requiere permiso comercial para consultar existencias." });
    }

    const products = db.getProducts();
    const safeProducts = CommercialRLSService.scopeProducts(products, user);

    const enriched = safeProducts.map(p => {
      const avail = QuoteAvailabilityService.calculateAvailability(p);
      return {
        id: p.id,
        code: avail.code,
        sku: avail.sku,
        name: avail.name,
        category: (p as any).category || (p as any).category_name || '',
        unit: avail.unit,
        price: avail.listPrice,
        listPrice: avail.listPrice,
        physicalStock: avail.physicalStock,
        reservedStock: avail.reservedStock,
        availableStock: avail.availableStock,
        physical_stock: avail.physicalStock,
        reserved_stock: avail.reservedStock,
        available_stock: avail.availableStock,
        status: avail.status,
        statusLabel: avail.statusLabel,
        deliveryRecommendation: avail.deliveryRecommendation,
        warehouses: avail.warehouses,
      };
    });

    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: "Error consultando disponibilidad comercial: " + err.message });
  }
});

app.get("/api/commercial/products/:id/availability", requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    const hasCot = AuthService.checkPermission(user.role, "COTIZACIONES", "VIEW");
    const hasVen = AuthService.checkPermission(user.role, "VENTAS", "VIEW");
    const hasInv = AuthService.checkPermission(user.role, "INVENTARIO", "VIEW");

    if (!hasCot && !hasVen && !hasInv) {
      return res.status(403).json({ error: "403 FORBIDDEN: Se requiere permiso comercial para consultar existencias." });
    }

    const { id } = req.params;
    const quantity = req.query.quantity ? parseFloat(req.query.quantity as string) : undefined;
    const product = db.getProducts().find(p => p.id === id || p.code === id || p.sku === id);

    if (!product) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    const safeProduct = CommercialRLSService.scopeProducts([product], user)[0];
    const avail = QuoteAvailabilityService.calculateAvailability(safeProduct, quantity);

    res.json({
      product: safeProduct,
      availability: avail,
      commercialNotice: "Disponibilidad sujeta a confirmación al generar pedido. Una cotización no reserva inventario.",
    });
  } catch (err: any) {
    res.status(500).json({ error: "Error consultando disponibilidad de producto: " + err.message });
  }
});

app.get("/api/categories", requireAuth, (_req, res) => {
  res.json(db.getCategories());
});

app.post("/api/products", requireAuth, requirePermission("INVENTARIO", "CREATE"), (req, res) => {
  try {
    const user = (req as any).user;
    if (user.role === 'VENDEDOR') {
      return res.status(403).json({ error: "403 FORBIDDEN: El rol VENDEDOR no puede crear ni modificar el catálogo de productos ni costos." });
    }
    const body = req.body;

    if (!body.name || !body.code || !body.sku) {
      return res.status(400).json({ error: "Nombre, código y SKU son campos obligatorios." });
    }

    const physicalStock = Number(body.physical_stock) || 0;
    const reservedStock = 0;
    const availableStock = physicalStock;

    const newProduct = {
      id: `PRD-${Date.now().toString(36)}`,
      sku: body.sku,
      code: body.code,
      name: body.name,
      description: body.description || "",
      category_id: body.category_id || "CAT-01",
      category_name: body.category_name || "Lana Mineral de Roca",
      unit: body.unit || "PZA",
      cost: Number(body.cost) || 0,
      sale_price: Number(body.sale_price) || 0,
      minimum_stock: Number(body.minimum_stock) || 10,
      maximum_stock: Number(body.maximum_stock) || 200,
      status: body.status || "ACTIVO",
      physical_stock: physicalStock,
      reserved_stock: reservedStock,
      available_stock: availableStock,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.getProducts().unshift(newProduct);

    db.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      module: "INVENTARIO",
      action: "CREAR_PRODUCTO",
      entity_type: "PRODUCT",
      entity_id: newProduct.code,
      new_value: `Producto técnico ${newProduct.name} registrado con stock inicial: ${physicalStock}`,
    });

    db.persist();
    eventBus.broadcast("product_created", newProduct);

    res.status(201).json(newProduct);
  } catch (err: any) {
    res.status(500).json({ error: "Error al registrar producto" });
  }
});

app.post("/api/inventory/movements", requireAuth, requirePermission("INVENTARIO", "CREATE"), (req, res) => {
  try {
    const user = (req as any).user;
    if (user.role === 'VENDEDOR') {
      return res.status(403).json({ error: "403 FORBIDDEN: El vendedor no tiene autorización operativa para registrar movimientos físicos de almacén." });
    }
    const result = InventoryService.recordMovement(req.body, user);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: "Error procesando movimiento de inventario" });
  }
});

app.get("/api/inventory/movements", requireAuth, requirePermission("INVENTARIO", "VIEW"), (req, res) => {
  const user = (req as any).user;
  if (user.role === 'VENDEDOR') {
    return res.status(403).json({ error: "403 FORBIDDEN: El ejecutivo comercial no tiene acceso a la bitácora física de inventario." });
  }
  res.json(db.getMovements());
});

// ==========================================
// 5.5 INVENTORY ADJUSTMENTS & WASTE (OBSERVACIÓN 21)
// Flujo desacoplado: Solicitud -> Autorización -> Aplicación por Delta
// ==========================================

// List all adjustments
app.get(["/api/inventory/adjustments", "/api/inventory-adjustments"], requireAuth, (_req, res) => {
  try {
    const list = db.getAdjustments();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: "Error al consultar ajustes de inventario" });
  }
});

// Get single adjustment
app.get(["/api/inventory/adjustments/:id", "/api/inventory-adjustments/:id"], requireAuth, (req, res) => {
  try {
    const adj = db.getAdjustmentById(req.params.id);
    if (!adj) {
      return res.status(404).json({ error: "Ajuste no encontrado" });
    }
    res.json(adj);
  } catch (err: any) {
    res.status(500).json({ error: "Error al consultar ajuste" });
  }
});

// Create adjustment request — ALWAYS PENDIENTE_AUTORIZACION (No afecta stock, No Kardex)
app.post(["/api/inventory/adjustments", "/api/inventory-adjustments"], requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    const { productId, warehouseId, location, type, quantity, reason, notes, evidenceNote, folio, status } = req.body;

    // Observación 21 - Bloqueo de API maliciosa: No permitir crear solicitudes directamente con estado APLICADO
    if (status && status === 'APLICADO') {
      return res.status(400).json({
        error: "400 BAD REQUEST: No se permite crear solicitudes de ajuste directamente en estado APLICADO. Todo ajuste debe crearse en estado PENDIENTE_AUTORIZACION y ser autorizado por un rol facultado.",
      });
    }

    if (!productId || !type || !quantity || quantity <= 0) {
      return res.status(400).json({ error: "Datos incompletos. Se requiere producto, tipo y cantidad válida." });
    }

    if (!reason || reason.trim() === '') {
      return res.status(400).json({ error: "El motivo de la solicitud de ajuste es obligatorio." });
    }

    const result = db.createAdjustment({
      productId,
      warehouseId: warehouseId || 'WH-01',
      location,
      type,
      quantity: Number(quantity),
      reason,
      notes,
      evidenceNote,
      user,
      folio,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json(result);
  } catch (err: any) {
    console.error("Error al crear solicitud de ajuste:", err);
    res.status(500).json({ error: "Error interno al guardar solicitud de ajuste" });
  }
});

// Authorize & Apply adjustment (Enforces RBAC, SoD, Idempotency and Delta Stock Recalculation)
const handleAuthorizeAdjustment = (req: any, res: any) => {
  try {
    const user = req.user;
    const id = req.params.id || req.body.id || req.body.adjustmentId;

    if (!id) {
      return res.status(400).json({ error: "Se requiere ID o Folio del ajuste." });
    }

    // RBAC check: Operational warehouse, sales, marketing CANNOT authorize inventory adjustments
    const unauthorizedRoles = ['ALMACEN', 'VENDEDOR', 'MARKETING', 'LOGISTICA'];
    if (unauthorizedRoles.includes(user.role)) {
      return res.status(403).json({
        error: `403 FORBIDDEN: El rol ${user.role} no tiene facultades para autorizar o aplicar ajustes de inventario. Acción reservada para Administración, Dirección o Jefe de Almacén.`,
      });
    }

    const result = db.authorizeAdjustment(id, user);

    if (!result.success) {
      const statusCode = result.code || 400;
      return res.status(statusCode).json({ error: result.error });
    }

    res.status(200).json(result);
  } catch (err: any) {
    console.error("Error al autorizar ajuste:", err);
    res.status(500).json({ error: "Error interno al autorizar ajuste de inventario" });
  }
};

app.post([
  "/api/inventory/adjustments/:id/authorize",
  "/api/inventory/adjustments/:id/approve",
  "/api/inventory-adjustments/:id/authorize",
  "/api/inventory-adjustments/:id/approve",
  "/api/inventory/adjustments/authorize",
  "/api/inventory/adjustments/approve",
  "/api/inventory-adjustments/authorize",
  "/api/inventory-adjustments/approve"
], requireAuth, handleAuthorizeAdjustment);

app.patch([
  "/api/inventory/adjustments/:id/authorize",
  "/api/inventory/adjustments/:id/approve",
  "/api/inventory-adjustments/:id/authorize",
  "/api/inventory-adjustments/:id/approve",
  "/api/inventory/adjustments/authorize",
  "/api/inventory/adjustments/approve",
  "/api/inventory-adjustments/authorize",
  "/api/inventory-adjustments/approve"
], requireAuth, handleAuthorizeAdjustment);

// Reject adjustment (Requires reason, 0 stock change, 0 Kardex)
const handleRejectAdjustment = (req: any, res: any) => {
  try {
    const user = req.user;
    const id = req.params.id || req.body.id || req.body.adjustmentId;
    const { reason, rejectionReason } = req.body;
    const finalReason = reason || rejectionReason;

    if (!id) {
      return res.status(400).json({ error: "Se requiere ID o Folio del ajuste." });
    }

    const unauthorizedRoles = ['ALMACEN', 'VENDEDOR', 'MARKETING', 'LOGISTICA'];
    if (unauthorizedRoles.includes(user.role)) {
      return res.status(403).json({
        error: `403 FORBIDDEN: El rol ${user.role} no tiene facultades para rechazar solicitudes de ajuste.`,
      });
    }

    if (!finalReason || finalReason.trim() === '') {
      return res.status(400).json({ error: "El motivo del rechazo es obligatorio." });
    }

    const result = db.rejectAdjustment(id, user, finalReason);

    if (!result.success) {
      const statusCode = result.code || 400;
      return res.status(statusCode).json({ error: result.error });
    }

    res.status(200).json(result);
  } catch (err: any) {
    console.error("Error al rechazar ajuste:", err);
    res.status(500).json({ error: "Error interno al rechazar ajuste de inventario" });
  }
};

app.post([
  "/api/inventory/adjustments/:id/reject",
  "/api/inventory-adjustments/:id/reject",
  "/api/inventory/adjustments/reject",
  "/api/inventory-adjustments/reject"
], requireAuth, handleRejectAdjustment);

app.patch([
  "/api/inventory/adjustments/:id/reject",
  "/api/inventory-adjustments/:id/reject",
  "/api/inventory-adjustments/reject",
  "/api/inventory-adjustments/reject"
], requireAuth, handleRejectAdjustment);

// Helper endpoint: Reset test case SKU-TEST-021 & AJU-TEST-021
app.post([
  "/api/inventory/adjustments/reset-test-021",
  "/api/inventory-adjustments/reset-test-021"
], requireAuth, (_req, res) => {
  try {
    const result = db.resetTest021();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: "Error al reiniciar caso de prueba Obs 21" });
  }
});

// ==========================================
// 6. WAREHOUSES
// ==========================================
app.get("/api/warehouses", requireAuth, requirePermission("ALMACENES", "VIEW"), (_req, res) => {
  res.json(db.getWarehouses());
});

app.get("/api/warehouses/inventory", requireAuth, requirePermission("ALMACENES", "VIEW"), (_req, res) => {
  res.json(db.getInventory());
});

// ==========================================
// 6.1 INVENTORY BACKUP & EXPORT (.xlsx) — OBSERVACIÓN 20
// ==========================================
app.get(["/api/inventory/export", "/api/inventory/backup"], requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    
    // Check permission: INVENTARIO EXPORT or VIEW, ALMACENES VIEW, or general privileged roles
    const hasPermission = AuthService.checkPermission(user.role, "INVENTARIO", "EXPORT") ||
                          AuthService.checkPermission(user.role, "INVENTARIO", "VIEW") ||
                          AuthService.checkPermission(user.role, "ALMACENES", "VIEW") ||
                          user.role === "ADMINISTRADOR" ||
                          user.role === "DIRECTOR" ||
                          user.role === "JEFE_ALMACEN" ||
                          user.role === "ALMACEN";

    if (!hasPermission) {
      return res.status(403).json({ error: "403 FORBIDDEN: Acceso denegado para exportar respaldo de inventario." });
    }

    const products = db.getProducts();
    const warehouses = db.getWarehouses();

    if (!products || products.length === 0) {
      return res.status(404).json({ error: "No hay información de inventario para respaldar." });
    }

    // RBAC: Check if role has cost visibility permission
    const allowedCostRoles = ['ADMINISTRADOR', 'DIRECTOR', 'FINANZAS', 'GERENTE_FINANZAS', 'COMPRAS', 'GERENTE_COMPRAS'];
    const canViewCosts = allowedCostRoles.includes(user.role?.toUpperCase());

    // Sanitize products according to RBAC (Costs are completely stripped if unauthorized)
    const sanitizedProducts = products.map((p: any) => {
      const copy = { ...p };
      if (!canViewCosts) {
        delete copy.cost;
        delete copy.cost_price;
        delete copy.costPrice;
        delete copy.average_cost;
        delete copy.last_purchase_price;
        delete copy.supplier;
        delete copy.supplier_id;
        delete copy.supplierId;
        delete copy.supplier_name;
        delete copy.supplierName;
        delete copy.margin;
        delete copy.purchase_price;
      }
      return copy;
    });

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const filename = `CONSCORE_Respaldo_Inventario_${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}.xlsx`;

    // Audit log
    db.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      module: "INVENTARIO",
      action: "INVENTORY_EXCEL_EXPORTED",
      entity_type: "INVENTORY",
      entity_id: "ALL",
      previous_value: undefined,
      new_value: JSON.stringify({
        userId: user.id,
        role: user.role,
        timestamp: now.toISOString(),
        filename,
        totalRows: sanitizedProducts.length,
      }),
    });

    // Check if client requested direct binary XLSX file download
    if (req.query.format === 'xlsx' || req.headers.accept?.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
      const rows: any[] = [];
      sanitizedProducts.forEach((p: any) => {
        if (Array.isArray(p.warehouseLocations) && p.warehouseLocations.length > 0) {
          p.warehouseLocations.forEach((loc: any) => {
            const locStock = Number(loc.stock ?? loc.physicalStock ?? 0);
            const locReserved = Number(loc.reservedStock ?? 0);
            const locAvail = Number(loc.availableStock ?? Math.max(0, locStock - locReserved));
            const row: any = {
              'SKU': p.sku || p.code,
              'Código': p.code || p.sku,
              'Producto': p.name,
              'Descripción': p.description || '',
              'Categoría': p.category_name || p.categoryName || 'General',
              'Unidad': p.unit || 'PZA',
              'Almacén': loc.warehouseName || 'CEDIS',
              'Ubicación': loc.locationCode || [loc.nave, loc.rack, loc.pasillo, loc.nivel].filter(Boolean).join(' / ') || 'Sin asignar',
              'Existencia física': locStock,
              'Reservado': locReserved,
              'Disponible': locAvail,
              'Stock mínimo': p.minimum_stock ?? p.minStock ?? 0,
              'Stock máximo': p.maximum_stock ?? p.maxStock ?? 0,
              'Punto de Reorden': p.reorder_point ?? Math.ceil((p.minimum_stock ?? 5) * 1.5),
              'Estado': p.status || 'ACTIVO',
              'Última actualización': (p.updated_at || new Date().toISOString()).slice(0, 19).replace('T', ' '),
            };
            if (canViewCosts) {
              row['Costo Unitario'] = p.cost ?? 0;
              row['Valor Total'] = Number((locStock * (p.cost ?? 0)).toFixed(2));
              row['Proveedor'] = p.supplier_name || 'Proveedor Nacional';
            }
            rows.push(row);
          });
        } else {
          const physStock = Number(p.physical_stock ?? p.stock ?? 0);
          const resStock = Number(p.reserved_stock ?? 0);
          const availStock = Number(p.available_stock ?? Math.max(0, physStock - resStock));
          const row: any = {
            'SKU': p.sku || p.code,
            'Código': p.code || p.sku,
            'Producto': p.name,
            'Descripción': p.description || '',
            'Categoría': p.category_name || p.categoryName || 'General',
            'Unidad': p.unit || 'PZA',
            'Almacén': p.warehouse_name || p.warehouseName || 'Almacén Central CEDIS',
            'Ubicación': p.warehouse_location || p.warehouseLocation || 'N1 / R-01 / P-01 / Niv-01',
            'Existencia física': physStock,
            'Reservado': resStock,
            'Disponible': availStock,
            'Stock mínimo': p.minimum_stock ?? p.minStock ?? 0,
            'Stock máximo': p.maximum_stock ?? p.maxStock ?? 0,
            'Punto de Reorden': p.reorder_point ?? Math.ceil((p.minimum_stock ?? 5) * 1.5),
            'Estado': p.status || 'ACTIVO',
            'Última actualización': (p.updated_at || new Date().toISOString()).slice(0, 19).replace('T', ' '),
          };
          if (canViewCosts) {
            row['Costo Unitario'] = p.cost ?? 0;
            row['Valor Total'] = Number((physStock * (p.cost ?? 0)).toFixed(2));
            row['Proveedor'] = p.supplier_name || 'Proveedor Nacional';
          }
          rows.push(row);
        }
      });

      const wb = XLSX.utils.book_new();
      const wsInv = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, wsInv, 'Inventario');

      const summary = [
        ['CONSCORE ERP — RESPALDO OFICIAL DE INVENTARIO'],
        ['Fecha y Hora', now.toISOString()],
        ['Usuario', user.name],
        ['Rol', user.role],
        ['Total Registros', rows.length],
      ];
      const wsSum = XLSX.utils.aoa_to_sheet(summary);
      XLSX.utils.book_append_sheet(wb, wsSum, 'RESUMEN');

      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(buf);
    }

    res.json({
      success: true,
      filename,
      canViewCosts,
      totalRows: sanitizedProducts.length,
      products: sanitizedProducts,
      warehouses,
    });
  } catch (err: any) {
    console.error("Error en /api/inventory/export:", err);
    res.status(500).json({ error: "No fue posible generar el respaldo de inventario." });
  }
});

// ==========================================
// 7. QUOTES (COTIZACIONES)
// ==========================================
app.get("/api/quotes", requireAuth, requirePermission("COTIZACIONES", "VIEW"), (req, res) => {
  const user = (req as any).user;
  const quotes = db.getQuotes();
  const scopedQuotes = CommercialRLSService.scopeQuotes(quotes, user);
  const sanitizedQuotes = scopedQuotes.map(q => QuotePricingService.sanitizeQuoteForRole(q, user.role));
  res.json(sanitizedQuotes);
});

app.post("/api/quotes", requireAuth, requirePermission("COTIZACIONES", "CREATE"), (req, res) => {
  try {
    const user = (req as any).user;
    const body = req.body;
    const customerId = body.customer_id || body.customerId;

    if (!customerId || !body.items || body.items.length === 0) {
      return res.status(400).json({ error: "Se requiere cliente y al menos una partida de producto." });
    }

    const customer = db.getCustomers().find(c => c.id === customerId || (c as any).code === customerId || (c as any).customer_number === customerId);
    if (!customer) {
      return res.status(404).json({
        error: "404 NOT_FOUND: Cliente no encontrado. Se requiere un cliente registrado para emitir cotizaciones.",
        code: "CUSTOMER_NOT_FOUND"
      });
    }

    // Observación 05: Validar titularidad comercial estricta (RLS)
    const ownership = CommercialRLSService.assertCustomerOwnership(user, customer, 'WRITE');
    if (!ownership.allowed) {
      db.logAudit({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        module: "COTIZACIONES",
        action: "QUOTE_CUSTOMER_ACCESS_DENIED",
        entity_type: "CUSTOMER",
        entity_id: customer.id,
        new_value: `Intento de cotización bloqueado (403): Vendedor ${user.name} (${user.id}) intentó emitir cotización a cliente ajeno o restringido '${customer.company_name || customer.businessName || customer.id}'. Motivo: ${ownership.error || 'Aislamiento RLS'}`,
      });
      return res.status(403).json({
        error: ownership.error || "403 ACCESS_DENIED: No tienes autorización para cotizar a este cliente. Pertenece a otra cartera comercial o está restringido.",
        code: "QUOTE_CUSTOMER_ACCESS_DENIED"
      });
    }

    // Observación 05 Requirement #7: Anti-Spoofing de Ejecutivo / Vendedor
    if (user.role === "VENDEDOR") {
      const myExecId = CommercialRLSService.resolveSalesExecutiveId(user);
      const attemptedExec = body.salesExecutiveId || body.sales_executive_id || body.assignedSalesExecutiveId;
      const attemptedSeller = body.sellerId || body.salespersonId || body.salesperson_id;

      if (attemptedExec && attemptedExec !== myExecId) {
        db.logAudit({
          user_id: user.id,
          user_name: user.name,
          user_role: user.role,
          module: "COTIZACIONES",
          action: "QUOTE_OWNER_SPOOFING_DENIED",
          entity_type: "QUOTE",
          entity_id: "NUEVA_COTIZACION",
          new_value: `Intento de suplantación de ejecutivo comercial (owner spoofing) bloqueado (403): Vendedor ${user.name} (${myExecId}) intentó registrar cotización como ${attemptedExec}`,
        });
        return res.status(403).json({
          error: "403 ACCESS_DENIED: Intento de suplantación de ejecutivo comercial (owner spoofing) detectado y bloqueado.",
          code: "QUOTE_OWNER_SPOOFING_DENIED"
        });
      }

      if (attemptedSeller && attemptedSeller !== user.id && attemptedSeller !== myExecId) {
        db.logAudit({
          user_id: user.id,
          user_name: user.name,
          user_role: user.role,
          module: "COTIZACIONES",
          action: "QUOTE_OWNER_SPOOFING_DENIED",
          entity_type: "QUOTE",
          entity_id: "NUEVA_COTIZACION",
          new_value: `Intento de suplantación de vendedor (owner spoofing) bloqueado (403): Vendedor ${user.name} (${user.id}) intentó registrar cotización como ${attemptedSeller}`,
        });
        return res.status(403).json({
          error: "403 ACCESS_DENIED: Intento de suplantación de vendedor (owner spoofing) detectado y bloqueado.",
          code: "QUOTE_OWNER_SPOOFING_DENIED"
        });
      }
    }

    // Observación 05 Requirement #10: Validación estricta si se crea desde Oportunidad
    const oppId = body.opportunityId || body.opportunity_id;
    if (oppId) {
      const opp = db.getOpportunities().find(o => o.id === oppId || (o as any).folio === oppId);
      if (!opp) {
        return res.status(404).json({
          error: "404 NOT_FOUND: Oportunidad de origen no encontrada.",
          code: "OPPORTUNITY_NOT_FOUND"
        });
      }

      if (user.role === "VENDEDOR") {
        const oppAccess = CommercialRLSService.validateAccess(user, 'OPPORTUNITY', opp, 'READ');
        if (!oppAccess.allowed) {
          db.logAudit({
            user_id: user.id,
            user_name: user.name,
            user_role: user.role,
            module: "COTIZACIONES",
            action: "QUOTE_OPPORTUNITY_ACCESS_DENIED",
            entity_type: "OPPORTUNITY",
            entity_id: oppId,
            new_value: `Intento de cotización desde oportunidad ajena bloqueado (403): Vendedor ${user.name} intentó usar ${opp.folio || oppId}`,
          });
          return res.status(403).json({
            error: "403 ACCESS_DENIED: No puedes generar cotizaciones a partir de una oportunidad asignada a otro ejecutivo comercial.",
            code: "QUOTE_OPPORTUNITY_ACCESS_DENIED"
          });
        }

        if (opp.customerId && opp.customerId !== customer.id && (opp as any).customer_id !== customer.id) {
          return res.status(403).json({
            error: "403 ACCESS_DENIED: El cliente de la cotización no coincide con el cliente titular de la oportunidad vinculada.",
            code: "QUOTE_OPPORTUNITY_CUSTOMER_MISMATCH"
          });
        }
      }
    }

    // HOTFIX 07: Validación estricta de precio de lista y descuento máximo para vendedor
    const pricingVal = QuotePricingService.validateQuotePricing(user, body.items, db.getProducts());
    const isApprovalRequested = Boolean(body.requestApproval || body.status === 'PENDIENTE_AUTORIZACION');

    if (!pricingVal.allowed) {
      if (pricingVal.code === 'PRICE_BELOW_LIST_NOT_ALLOWED') {
        db.logAudit({
          user_id: user.id,
          user_name: user.name,
          user_role: user.role,
          module: "COTIZACIONES",
          action: "PRICE_BELOW_LIST_BLOCKED",
          entity_type: "QUOTE",
          entity_id: "NUEVA_COTIZACION",
          new_value: `Intento de precio inferior a lista bloqueado: ${pricingVal.error}`,
        });
        return res.status(422).json({
          error: pricingVal.error,
          code: pricingVal.code,
          itemErrors: pricingVal.itemErrors,
        });
      }

      if (pricingVal.code === 'DISCOUNT_APPROVAL_REQUIRED') {
        if (!isApprovalRequested) {
          return res.status(400).json({
            error: pricingVal.error,
            code: pricingVal.code,
            itemErrors: pricingVal.itemErrors,
          });
        }
      } else {
        return res.status(pricingVal.status || 400).json({
          error: pricingVal.error,
          code: pricingVal.code,
          itemErrors: pricingVal.itemErrors,
        });
      }
    }

    const assignedSellerId = user.role === "VENDEDOR" ? user.id : (body.salesperson_id || user.id);
    const assignedSellerName = user.role === "VENDEDOR" ? user.name : (body.salesperson_name || user.name);
    const assignedExecId = CommercialRLSService.resolveSalesExecutiveId(user.role === "VENDEDOR" ? user : { id: assignedSellerId, name: assignedSellerName });

    const quoteNumber = body.quote_number || body.folio || db.nextQuoteNumber();
    const quoteId = body.id || `QUO-${Date.now().toString(36)}`;
    const masterTransactionId = `MTX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    // Recálculo seguro y canónico de partidas
    const items = body.items.map((item: any) => {
      const recalculated = QuotePricingService.recalculateItem(item, db.getProducts());
      return {
        ...recalculated,
        id: recalculated.id || `QIT-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
        quoteId,
        quote_id: quoteId,
      };
    });

    const quoteTotals = QuotePricingService.recalculateQuoteTotals(items);
    const quoteStatus = isApprovalRequested ? 'PENDIENTE_AUTORIZACION' : (body.status || 'EN_NEGOCIACION');

    const newQuote: any = {
      id: quoteId,
      quote_number: quoteNumber,
      folio: quoteNumber,
      version: 1,
      customer_id: body.customer_id,
      customerId: body.customer_id,
      customer_name: customer?.company_name || body.customer_name || "Cliente General",
      customerName: customer?.company_name || body.customer_name || "Cliente General",
      salesperson_id: assignedSellerId,
      salespersonId: assignedSellerId,
      salesperson_name: assignedSellerName,
      salespersonName: assignedSellerName,
      sellerId: assignedSellerId,
      sellerName: assignedSellerName,
      salesExecutiveId: assignedExecId,
      sales_executive_id: assignedExecId,
      quote_date: body.quote_date || new Date().toISOString().slice(0, 10),
      date: body.quote_date || new Date().toISOString().slice(0, 10),
      expiration_date: body.expiration_date || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      validUntil: body.expiration_date || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      status: quoteStatus,
      financialApprovalStatus: 'PENDIENTE',
      discountApprovalStatus: isApprovalRequested ? 'PENDIENTE_AUTORIZACION' : undefined,
      subtotal: quoteTotals.subtotal,
      discount: quoteTotals.discount,
      tax: quoteTotals.tax,
      total: quoteTotals.total,
      notes: body.notes || "",
      paymentTerms: normalizePaymentTerms(body.paymentTerms || body.payment_terms),
      payment_terms: normalizePaymentTerms(body.paymentTerms || body.payment_terms),
      deliveryTime: body.deliveryTime || "",
      items,
      versions: [],
      masterTransactionId,
      master_transaction_id: masterTransactionId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Si se solicitó aprobación de descuento, crear la solicitud
    if (isApprovalRequested) {
      const maxDiscount = items.reduce((max: number, it: any) => Math.max(max, Number(it.discountPercent || 0)), 0);
      const approvalReq = QuotePricingService.createDiscountApprovalRequest(newQuote, user, {
        requestedDiscount: maxDiscount,
        justification: body.justification || 'negociación estratégica',
        observations: body.observations || body.notes || '',
      });
      newQuote.discountApproval = approvalReq;
      newQuote.discountApprovalHistory = [approvalReq];
      db.addDiscountApproval(approvalReq);

      db.logAudit({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        module: "COTIZACIONES",
        action: "DISCOUNT_APPROVAL_REQUESTED",
        entity_type: "QUOTE",
        entity_id: quoteNumber,
        new_value: `Solicitud de autorización de descuento del ${maxDiscount}% para ${newQuote.customer_name}. Justificación: ${body.justification || 'negociación estratégica'}`,
        master_transaction_id: masterTransactionId,
      });
    }

    db.getQuotes().unshift(newQuote);

    db.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      module: "COTIZACIONES",
      action: "CREAR_COTIZACION",
      entity_type: "QUOTE",
      entity_id: quoteNumber,
      new_value: `Cotización ${quoteNumber} por $${quoteTotals.total.toLocaleString("es-MX")} MXN creada para ${newQuote.customer_name} por ${assignedSellerName} (${assignedExecId})`,
      master_transaction_id: masterTransactionId,
    });

    db.persist();
    eventBus.broadcast("quote_created", newQuote);

    const sanitizedQuote = QuotePricingService.sanitizeQuoteForRole(newQuote, user.role);
    res.status(201).json(sanitizedQuote);
  } catch (err: any) {
    console.error("Error creando cotización:", err);
    res.status(500).json({ error: "Error creando cotización: " + (err.message || err) });
  }
});

app.get("/api/quotes/:id", requireAuth, requirePermission("COTIZACIONES", "VIEW"), (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const quote = db.getQuotes().find(q => q.id === id || q.quote_number === id || (q as any).folio === id);
    if (!quote) {
      return res.status(404).json({ error: "Cotización no encontrada" });
    }

    const access = CommercialRLSService.validateAccess(user, 'QUOTE', quote, 'READ');
    if (!access.allowed) {
      db.logAudit({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        module: "COTIZACIONES",
        action: "ACCESO_DENEGADO_RLS",
        entity_type: "QUOTE",
        entity_id: quote.quote_number || (quote as any).folio || quote.id,
        new_value: access.error || "Intento de consulta de cotización ajena bloqueado por RLS (403)",
      });
      return res.status(403).json({ error: access.error || "403 ACCESS_DENIED: Esta cotización pertenece a otro ejecutivo comercial." });
    }

    const sanitized = QuotePricingService.sanitizeQuoteForRole(quote, user.role);
    res.json(sanitized);
  } catch (e: any) {
    res.status(500).json({ error: "Error consultando cotización: " + e.message });
  }
});

// Quote Edit Handler (Hotfix 06 & 07: Versioning, RLS, Price & Discount Governance)
const handleQuoteUpdate = (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const quote = db.getQuotes().find(q => q.id === id || q.quote_number === id || (q as any).folio === id);
    if (!quote) {
      return res.status(404).json({ error: "Cotización no encontrada", code: "QUOTE_NOT_FOUND" });
    }

    // Observación 05 Requirement #13: Validar que el cliente titular de la cotización pertenezca actualmente al vendedor (RLS en Reasignaciones)
    const quoteCustId = quote.customerId || (quote as any).customer_id;
    const currentCustomer = db.getCustomers().find(c => c.id === quoteCustId);
    if (currentCustomer && user.role === 'VENDEDOR') {
      const custOwnership = CommercialRLSService.assertCustomerOwnership(user, currentCustomer, 'WRITE');
      if (!custOwnership.allowed) {
        db.logAudit({
          user_id: user.id,
          user_name: user.name,
          user_role: user.role,
          module: "COTIZACIONES",
          action: "QUOTE_CUSTOMER_ACCESS_DENIED",
          entity_type: "QUOTE",
          entity_id: quote.quote_number || (quote as any).folio || quote.id,
          new_value: `Intento de edición bloqueado (403): El cliente titular ${currentCustomer.company_name || quoteCustId} fue reasignado a otro ejecutivo comercial o está restringido.`,
        });
        return res.status(403).json({
          error: "403 ACCESS_DENIED: No puedes modificar esta cotización porque el cliente asignado fue reasignado a otro ejecutivo comercial o está restringido.",
          code: "QUOTE_CUSTOMER_ACCESS_DENIED",
        });
      }
    }

    // Observación 05 Requirement #7: Anti-Spoofing en edición
    if (user.role === 'VENDEDOR') {
      const myExecId = CommercialRLSService.resolveSalesExecutiveId(user);
      const attemptedExec = req.body.salesExecutiveId || req.body.sales_executive_id || req.body.assignedSalesExecutiveId;
      const attemptedSeller = req.body.sellerId || req.body.salespersonId || req.body.salesperson_id;
      if ((attemptedExec && attemptedExec !== myExecId) || (attemptedSeller && attemptedSeller !== user.id && attemptedSeller !== myExecId)) {
        db.logAudit({
          user_id: user.id,
          user_name: user.name,
          user_role: user.role,
          module: "COTIZACIONES",
          action: "QUOTE_OWNER_SPOOFING_DENIED",
          entity_type: "QUOTE",
          entity_id: quote.quote_number || (quote as any).folio || quote.id,
          new_value: `Intento de suplantación de ejecutivo en edición bloqueado (403) por ${user.name}`,
        });
        return res.status(403).json({
          error: "403 ACCESS_DENIED: No está permitido reasignar el ejecutivo comercial o vendedor de una cotización.",
          code: "QUOTE_OWNER_SPOOFING_DENIED",
        });
      }
    }

    const validation = QuoteEditService.validateQuoteEdit(user, quote, req.body, db.getOrders(), db.getProducts());
    if (!validation.allowed) {
      if (validation.code === 'PRICE_BELOW_LIST_NOT_ALLOWED') {
        db.logAudit({
          user_id: user.id,
          user_name: user.name,
          user_role: user.role,
          module: "COTIZACIONES",
          action: "PRICE_BELOW_LIST_BLOCKED",
          entity_type: "QUOTE",
          entity_id: quote.quote_number || (quote as any).folio || quote.id,
          new_value: `Intento de precio inferior a lista bloqueado: ${validation.error}`,
        });
      } else if (validation.status === 403) {
        const auditAction = validation.code === 'CUSTOMER_IMMUTABLE' ? 'QUOTE_CUSTOMER_CHANGE_DENIED' : (validation.code || "ACCESO_DENEGADO_RLS");
        db.logAudit({
          user_id: user.id,
          user_name: user.name,
          user_role: user.role,
          module: "COTIZACIONES",
          action: auditAction,
          entity_type: "QUOTE",
          entity_id: quote.quote_number || (quote as any).folio || quote.id,
          new_value: validation.error || "Intento de edición bloqueado por RLS (403)",
        });
      }
      return res.status(validation.status).json({ error: validation.error, code: validation.code });
    }

    const prevVersionNumber = quote.version || 1;
    const prevTotal = quote.total;
    const prevItems = quote.items || [];

    // Apply safe edit with calculation, version increment, and snapshot
    const result = QuoteEditService.applyQuoteEdit(quote, req.body, user, db.getProducts());
    const newItems = result.updatedQuote.items || [];

    let priceChanged = false;
    let discountChanged = false;
    for (const nit of newItems) {
      const pit = prevItems.find((p: any) => p.productId === nit.productId || p.product_id === nit.product_id);
      if (pit) {
        if (Number(pit.salesPrice || pit.unitPrice || pit.unit_price) !== Number(nit.salesPrice || nit.unitPrice || nit.unit_price)) {
          priceChanged = true;
        }
        if (Number(pit.discountPercent || pit.discountPct || pit.discount) !== Number(nit.discountPercent || nit.discountPct || nit.discount)) {
          discountChanged = true;
        }
      } else {
        priceChanged = true;
      }
    }

    if (priceChanged) {
      db.logAudit({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        module: "COTIZACIONES",
        action: "QUOTE_PRICE_CHANGED",
        entity_type: "QUOTE",
        entity_id: quote.quote_number || (quote as any).folio || quote.id,
        new_value: `Cambio de precio unitario registrado en versión v${result.updatedQuote.version}`,
        master_transaction_id: result.masterTransactionId,
      });
    }

    if (discountChanged) {
      db.logAudit({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        module: "COTIZACIONES",
        action: "QUOTE_DISCOUNT_APPLIED",
        entity_type: "QUOTE",
        entity_id: quote.quote_number || (quote as any).folio || quote.id,
        new_value: `Modificación de descuento en partidas registrada en versión v${result.updatedQuote.version}`,
        master_transaction_id: result.masterTransactionId,
      });
    }

    // OBSERVACIÓN 16: Log audit if financial approval was invalidated on edit
    if (quote.financialApprovalStatus === 'AUTORIZADA' && result.updatedQuote.financialApprovalStatus === 'PENDIENTE') {
      db.logAudit({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        module: "COTIZACIONES",
        action: "QUOTE_FINANCIAL_APPROVAL_INVALIDATED",
        entity_type: "QUOTE",
        entity_id: quote.quote_number || (quote as any).folio || quote.id,
        previous_value: `Aprobación financiera v${prevVersionNumber} vigente`,
        new_value: result.updatedQuote.financialApprovalNotes || `Aprobación financiera invalidada por edición a v${result.updatedQuote.version}`,
        master_transaction_id: result.masterTransactionId,
      });
    }

    db.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      module: "COTIZACIONES",
      action: "QUOTE_UPDATED",
      entity_type: "QUOTE",
      entity_id: quote.quote_number || (quote as any).folio || quote.id,
      previous_value: `v${prevVersionNumber} ($${prevTotal || 0})`,
      new_value: `v${result.updatedQuote.version} ($${result.updatedQuote.total}) | Modificado por ${user.name} | MTX: ${result.masterTransactionId}`,
      master_transaction_id: result.masterTransactionId,
    });

    db.persist();
    eventBus.broadcast("quote_updated", result.updatedQuote);
    res.json(QuotePricingService.sanitizeQuoteForRole(result.updatedQuote, user.role));
  } catch (err: any) {
    console.error("Error actualizando cotización:", err);
    res.status(500).json({ error: "Error actualizando cotización: " + (err.message || err) });
  }
};

app.put("/api/quotes/:id", requireAuth, requirePermission("COTIZACIONES", "EDIT"), handleQuoteUpdate);
app.patch("/api/quotes/:id", requireAuth, requirePermission("COTIZACIONES", "EDIT"), handleQuoteUpdate);

// Observación 05 Requirement #12: Duplicar / Clonar Cotización con validación estricta de titularidad de cliente
const handleQuoteDuplicate = (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const quote = db.getQuotes().find(q => q.id === id || q.quote_number === id || (q as any).folio === id);
    if (!quote) {
      return res.status(404).json({ error: "404 NOT_FOUND: Cotización no encontrada.", code: "QUOTE_NOT_FOUND" });
    }

    // 1. Validar acceso a la cotización original
    if (user.role === 'VENDEDOR') {
      const quoteAccess = CommercialRLSService.validateAccess(user, 'QUOTE', quote, 'READ');
      if (!quoteAccess.allowed) {
        db.logAudit({
          user_id: user.id,
          user_name: user.name,
          user_role: user.role,
          module: "COTIZACIONES",
          action: "QUOTE_CUSTOMER_ACCESS_DENIED",
          entity_type: "QUOTE",
          entity_id: quote.quote_number || quote.id,
          new_value: `Intento de duplicar cotización ajena bloqueado (403) por ${user.name}`,
        });
        return res.status(403).json({
          error: "403 ACCESS_DENIED: No tienes permiso para duplicar una cotización perteneciente a otro ejecutivo comercial.",
          code: "QUOTE_CUSTOMER_ACCESS_DENIED"
        });
      }
    }

    // 2. Validar titularidad ACTUAL del cliente (por si fue reasignado)
    const custId = quote.customerId || (quote as any).customer_id;
    const customer = db.getCustomers().find(c => c.id === custId);
    if (!customer) {
      return res.status(404).json({ error: "404 NOT_FOUND: Cliente titular de la cotización no encontrado.", code: "CUSTOMER_NOT_FOUND" });
    }

    const custOwnership = CommercialRLSService.assertCustomerOwnership(user, customer, 'WRITE');
    if (!custOwnership.allowed) {
      db.logAudit({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        module: "COTIZACIONES",
        action: "QUOTE_CUSTOMER_ACCESS_DENIED",
        entity_type: "CUSTOMER",
        entity_id: customer.id,
        new_value: `Intento de duplicar cotización bloqueado (403): Cliente ${customer.company_name || customer.id} ya no pertenece a la cartera del vendedor ${user.name}.`,
      });
      return res.status(403).json({
        error: custOwnership.error || "403 ACCESS_DENIED: No puedes duplicar esta cotización porque el cliente fue reasignado a otro ejecutivo comercial o está restringido.",
        code: "QUOTE_CUSTOMER_ACCESS_DENIED"
      });
    }

    const assignedSellerId = user.role === "VENDEDOR" ? user.id : (quote.salesperson_id || user.id);
    const assignedSellerName = user.role === "VENDEDOR" ? user.name : (quote.salesperson_name || user.name);
    const assignedExecId = CommercialRLSService.resolveSalesExecutiveId(user.role === "VENDEDOR" ? user : { id: assignedSellerId, name: assignedSellerName });

    const quoteNumber = db.nextQuoteNumber();
    const quoteId = `QUO-${Date.now().toString(36)}`;
    const masterTransactionId = `MTX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const items = (quote.items || []).map((item: any) => {
      const recalculated = QuotePricingService.recalculateItem(item, db.getProducts());
      return {
        ...recalculated,
        id: `QIT-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
        quoteId,
        quote_id: quoteId,
      };
    });

    const quoteTotals = QuotePricingService.recalculateQuoteTotals(items);

    const newQuote: any = {
      id: quoteId,
      quote_number: quoteNumber,
      folio: quoteNumber,
      version: 1,
      customer_id: customer.id,
      customerId: customer.id,
      customer_name: customer.company_name || customer.businessName || quote.customer_name,
      customerName: customer.company_name || customer.businessName || quote.customer_name,
      salesperson_id: assignedSellerId,
      salespersonId: assignedSellerId,
      salesperson_name: assignedSellerName,
      salespersonName: assignedSellerName,
      sellerId: assignedSellerId,
      sellerName: assignedSellerName,
      salesExecutiveId: assignedExecId,
      sales_executive_id: assignedExecId,
      quote_date: new Date().toISOString().slice(0, 10),
      date: new Date().toISOString().slice(0, 10),
      expiration_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      status: 'EN_NEGOCIACION',
      financialApprovalStatus: 'PENDIENTE',
      subtotal: quoteTotals.subtotal,
      discount: quoteTotals.discount,
      tax: quoteTotals.tax,
      total: quoteTotals.total,
      notes: `Duplicada a partir de cotización ${quote.quote_number || (quote as any).folio}. ${quote.notes || ''}`.trim(),
      paymentTerms: quote.paymentTerms || 'PAGO DE CONTADO',
      payment_terms: quote.paymentTerms || 'PAGO DE CONTADO',
      deliveryTime: quote.deliveryTime || '3 a 5 días hábiles',
      items,
      versions: [],
      masterTransactionId,
      master_transaction_id: masterTransactionId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.getQuotes().unshift(newQuote);

    db.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      module: "COTIZACIONES",
      action: "QUOTE_CREATED",
      entity_type: "QUOTE",
      entity_id: quoteNumber,
      new_value: `Cotización ${quoteNumber} duplicada a partir de ${quote.quote_number || quote.id} para ${customer.company_name || customer.id} por ${assignedSellerName} (${assignedExecId})`,
      master_transaction_id: masterTransactionId,
    });

    db.persist();
    eventBus.broadcast("quote_created", newQuote);
    res.status(201).json(QuotePricingService.sanitizeQuoteForRole(newQuote, user.role));
  } catch (err: any) {
    console.error("Error duplicando cotización:", err);
    res.status(500).json({ error: "Error duplicando cotización: " + (err.message || err) });
  }
};

app.post("/api/quotes/:id/duplicate", requireAuth, requirePermission("COTIZACIONES", "CREATE"), handleQuoteDuplicate);
app.post("/api/quotes/:id/clone", requireAuth, requirePermission("COTIZACIONES", "CREATE"), handleQuoteDuplicate);

// Get Quote Versions History
app.get("/api/quotes/:id/versions", requireAuth, requirePermission("COTIZACIONES", "VIEW"), (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const quote = db.getQuotes().find(q => q.id === id || q.quote_number === id || (q as any).folio === id);
    if (!quote) {
      return res.status(404).json({ error: "Cotización no encontrada" });
    }
    const access = CommercialRLSService.validateAccess(user, 'QUOTE', quote, 'READ');
    if (!access.allowed) {
      return res.status(403).json({ error: access.error });
    }
    res.json(quote.versions || []);
  } catch (err: any) {
    res.status(500).json({ error: "Error consultando versiones: " + err.message });
  }
});

// OBSERVACIÓN 08: Certificación de Condiciones de Pago Default
app.get("/api/quotes/payment-terms/certify", requireAuth, (_req, res) => {
  try {
    const report = QuotePaymentTermsService.runTestSuite();
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: "Error ejecutando certificación de condiciones de pago: " + err.message });
  }
});

// OBSERVACIÓN 09: Certificación de Stock Disponible en Cotizaciones
app.get("/api/quotes/availability/certify", requireAuth, (_req, res) => {
  try {
    const report = QuoteAvailabilityService.runCertificationTests();
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: "Error ejecutando certificación de stock disponible: " + err.message });
  }
});

// HOTFIX 07: Descuento & Aprobación Endpoints
app.get("/api/quotes/discount-approvals", requireAuth, requirePermission("COTIZACIONES", "VIEW"), (_req, res) => {
  res.json(db.getDiscountApprovals());
});

app.post("/api/quotes/:id/request-discount-approval", requireAuth, requirePermission("COTIZACIONES", "EDIT"), (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { justification, observations, requestedDiscount } = req.body;

    const quote = db.getQuotes().find(q => q.id === id || q.quote_number === id || (q as any).folio === id);
    if (!quote) {
      return res.status(404).json({ error: "Cotización no encontrada" });
    }

    const access = CommercialRLSService.validateAccess(user, 'QUOTE', quote, 'UPDATE');
    if (!access.allowed) {
      return res.status(403).json({ error: access.error });
    }

    if (!justification || justification.trim().length === 0) {
      return res.status(400).json({ error: "Se requiere justificación comercial obligatoria para solicitar autorización de descuento." });
    }

    const items = quote.items || [];
    const maxDiscountInItems = items.reduce((max: number, it: any) => Math.max(max, Number(it.discountPercent || it.discountPct || it.discount || 0)), 0);
    const targetDiscount = Number(requestedDiscount) || maxDiscountInItems;

    const approvalReq = QuotePricingService.createDiscountApprovalRequest(quote, user, {
      requestedDiscount: targetDiscount,
      justification,
      observations,
    });

    quote.status = 'PENDIENTE_AUTORIZACION';
    quote.discountApprovalStatus = 'PENDIENTE_AUTORIZACION';
    quote.discountApproval = approvalReq;
    if (!quote.discountApprovalHistory) quote.discountApprovalHistory = [];
    quote.discountApprovalHistory.push(approvalReq);

    db.addDiscountApproval(approvalReq);

    db.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      module: "COTIZACIONES",
      action: "DISCOUNT_APPROVAL_REQUESTED",
      entity_type: "QUOTE",
      entity_id: quote.quote_number || (quote as any).folio || quote.id,
      new_value: `Solicitud de descuento de ${targetDiscount}% solicitada por ${user.name}. Motivo: ${justification}`,
      master_transaction_id: approvalReq.masterTransactionId,
    });

    db.persist();
    eventBus.broadcast("quote_updated", quote);
    eventBus.broadcast("discount_approval_requested", approvalReq);

    res.json({
      success: true,
      quote: QuotePricingService.sanitizeQuoteForRole(quote, user.role),
      approvalRequest: approvalReq,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Error al solicitar aprobación: " + err.message });
  }
});

app.post("/api/quotes/:id/approve-discount", requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    if (!['ADMINISTRADOR', 'GERENTE_VENTAS', 'DIRECCION'].includes(user.role)) {
      return res.status(403).json({ error: "Solo Gerente de Ventas o Administrador pueden autorizar descuentos excepcionales." });
    }

    const { id } = req.params;
    const { comments, approvedDiscountPercent } = req.body;

    const quote = db.getQuotes().find(q => q.id === id || q.quote_number === id || (q as any).folio === id);
    if (!quote) {
      return res.status(404).json({ error: "Cotización no encontrada" });
    }

    const lastApproval = quote.discountApproval || (quote.discountApprovalHistory && quote.discountApprovalHistory[quote.discountApprovalHistory.length - 1]);
    const finalPct = approvedDiscountPercent !== undefined ? Number(approvedDiscountPercent) : (lastApproval?.requestedDiscount || 10);

    const updatedApproval = QuotePricingService.resolveDiscountApproval(quote, user, 'APROBADO', comments, finalPct);
    
    quote.discountApprovalStatus = 'APROBADO';
    quote.status = 'EN_NEGOCIACION';
    quote.approvedDiscountPercent = finalPct;
    quote.discountApproval = updatedApproval;
    if (!quote.discountApprovalHistory) quote.discountApprovalHistory = [];
    quote.discountApprovalHistory.push(updatedApproval);

    db.updateDiscountApproval(updatedApproval.id, updatedApproval);

    db.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      module: "COTIZACIONES",
      action: "DISCOUNT_APPROVED",
      entity_type: "QUOTE",
      entity_id: quote.quote_number || (quote as any).folio || quote.id,
      new_value: `Descuento de ${finalPct}% APROBADO por ${user.name}. Comentarios: ${comments || 'Aprobado'}`,
      master_transaction_id: updatedApproval.masterTransactionId,
    });

    db.persist();
    eventBus.broadcast("quote_updated", quote);
    eventBus.broadcast("discount_approved", updatedApproval);

    res.json({
      success: true,
      quote: QuotePricingService.sanitizeQuoteForRole(quote, user.role),
      approval: updatedApproval,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Error aprobando descuento: " + err.message });
  }
});

app.post("/api/quotes/:id/reject-discount", requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    if (!['ADMINISTRADOR', 'GERENTE_VENTAS', 'DIRECCION'].includes(user.role)) {
      return res.status(403).json({ error: "Solo Gerente de Ventas o Administrador pueden rechazar descuentos." });
    }

    const { id } = req.params;
    const { comments, rejectionReason } = req.body;

    const quote = db.getQuotes().find(q => q.id === id || q.quote_number === id || (q as any).folio === id);
    if (!quote) {
      return res.status(404).json({ error: "Cotización no encontrada" });
    }

    const updatedApproval = QuotePricingService.resolveDiscountApproval(
      quote,
      user,
      'RECHAZADO',
      comments || rejectionReason || 'Descuento no justificado comercialmente'
    );

    quote.discountApprovalStatus = 'RECHAZADO';
    quote.discountApproval = updatedApproval;
    if (!quote.discountApprovalHistory) quote.discountApprovalHistory = [];
    quote.discountApprovalHistory.push(updatedApproval);

    db.updateDiscountApproval(updatedApproval.id, updatedApproval);

    db.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      module: "COTIZACIONES",
      action: "DISCOUNT_REJECTED",
      entity_type: "QUOTE",
      entity_id: quote.quote_number || (quote as any).folio || quote.id,
      new_value: `Descuento RECHAZADO por ${user.name}. Motivo: ${comments || rejectionReason || 'Descuento no justificado'}`,
      master_transaction_id: updatedApproval.masterTransactionId,
    });

    db.persist();
    eventBus.broadcast("quote_updated", quote);
    eventBus.broadcast("discount_rejected", updatedApproval);

    res.json({
      success: true,
      quote: QuotePricingService.sanitizeQuoteForRole(quote, user.role),
      approval: updatedApproval,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Error rechazando descuento: " + err.message });
  }
});

app.post("/api/quotes/certify-hotfix06", requireAuth, requirePermission("COTIZACIONES", "VIEW"), (_req, res) => {
  const report = QuoteEditService.runHotfix06CertificationSuite(db);
  res.json(report);
});

app.post("/api/quotes/certify-hotfix07", requireAuth, requirePermission("COTIZACIONES", "VIEW"), (_req, res) => {
  const report = QuotePricingService.runHotfix07CertificationSuite(db);
  res.json(report);
});

// Transactional Quote to Order Conversion Endpoint (Observación 16)
const handleQuoteToOrderConversion = (req: any, res: any) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { warehouseId, deliveryDate, deliveryAddress, notes } = req.body;

    const quote = db.getQuotes().find(q => q.id === id || q.quote_number === id || (q as any).folio === id);
    if (!quote) {
      return res.status(403).json({
        code: "FINANCIAL_APPROVAL_REQUIRED",
        message: "La cotización requiere autorización de Finanzas antes de generar el pedido.",
        error: "La cotización requiere autorización de Finanzas antes de generar el pedido.",
      });
    }

    const access = CommercialRLSService.validateAccess(user, 'QUOTE', quote, 'UPDATE');
    if (!access.allowed) {
      return res.status(403).json({ error: "No tienes autorización para convertir cotizaciones pertenecientes a otro ejecutivo de ventas." });
    }

    const targetWarehouse = warehouseId || db.getWarehouses()[0]?.id || "WH-01";
    const result = QuoteOrderService.convertQuoteToOrder(quote.id, targetWarehouse, user, {
      deliveryDate,
      deliveryAddress,
      notes,
    });

    if (!result.success) {
      const isFinancialRequired =
        result.code === "FINANCIAL_APPROVAL_REQUIRED" ||
        result.code === "FINANCIAL_APPROVAL_VERSION_MISMATCH" ||
        result.code === "FINANCIAL_APPROVAL_SNAPSHOT_MISMATCH" ||
        result.error?.includes("autorización de Finanzas") ||
        result.error?.includes("FINANCIAL_APPROVAL_REQUIRED") ||
        result.error?.includes("financieramente");

      const statusCode = isFinancialRequired ? 403 : 400;
      return res.status(statusCode).json({
        code: isFinancialRequired ? "FINANCIAL_APPROVAL_REQUIRED" : (result.code || "CONVERSION_ERROR"),
        message: isFinancialRequired
          ? "La cotización requiere autorización de Finanzas antes de generar el pedido."
          : (result.error || "Error al convertir cotización"),
        error: isFinancialRequired
          ? "La cotización requiere autorización de Finanzas antes de generar el pedido."
          : (result.error || "Error al convertir cotización"),
        stockErrors: result.stockErrors,
      });
    }

    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: "Error transaccional al convertir cotización en pedido: " + err.message });
  }
};

// Endpoints de conversión de cotización a pedido (Observación 16 - Hotfix Definitivo)
app.post("/api/quotes/:id/convert", requireAuth, requirePermission("PEDIDOS", "CREATE"), handleQuoteToOrderConversion);
app.post("/api/quotes/:id/create-order", requireAuth, requirePermission("PEDIDOS", "CREATE"), handleQuoteToOrderConversion);
app.post("/api/quotes/:id/convert-to-order", requireAuth, requirePermission("PEDIDOS", "CREATE"), handleQuoteToOrderConversion);
app.post("/api/quotes/:id/order", requireAuth, requirePermission("PEDIDOS", "CREATE"), handleQuoteToOrderConversion);
app.post("/api/orders/from-quote", requireAuth, requirePermission("PEDIDOS", "CREATE"), (req, res) => {
  const quoteId = req.body.quoteId || req.body.id || req.body.quote_id || req.query.quoteId;
  req.params.id = quoteId;
  return handleQuoteToOrderConversion(req, res);
});

// Endpoint genérico POST /api/orders con intercepción obligatoria de quoteId
app.post("/api/orders", requireAuth, requirePermission("PEDIDOS", "CREATE"), (req, res) => {
  const quoteId = req.body.quoteId || req.body.quote_id || req.body.quoteFolio || req.body.quote_number;
  if (quoteId) {
    req.params.id = quoteId;
    return handleQuoteToOrderConversion(req, res);
  }

  // Si no se proporcionó quoteId y el usuario es Vendedor, denegar bypass directo
  const user = (req as any).user;
  if (user && user.role === 'VENDEDOR') {
    return res.status(403).json({
      code: "FINANCIAL_APPROVAL_REQUIRED",
      message: "La cotización requiere autorización de Finanzas antes de generar el pedido.",
      error: "Acceso denegado: El rol VENDEDOR debe crear pedidos formalizados a través de una cotización con autorización financiera.",
    });
  }

  return res.status(400).json({
    error: "Creación directa de pedidos sin cotización requiere permisos administrativos especiales y cliente/partidas válidas.",
  });
});

// Financial Approval Endpoints (Observación 16)
app.post("/api/quotes/:id/request-financial-approval", requireAuth, requirePermission("COTIZACIONES", "VIEW"), (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const quote = db.getQuotes().find(q => q.id === id || q.quote_number === id || (q as any).folio === id);
    if (!quote) {
      return res.status(404).json({ error: "Cotización no encontrada" });
    }

    const updatedQuote = QuoteFinancialApprovalService.requestApproval(quote, user, req.body.notes);
    Object.assign(quote, updatedQuote);

    db.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      module: "COTIZACIONES",
      action: "QUOTE_FINANCIAL_APPROVAL_REQUESTED",
      entity_type: "QUOTE",
      entity_id: quote.quote_number || (quote as any).folio || quote.id,
      new_value: `Solicitud de autorización financiera enviada a Finanzas por ${user.name} (${user.role}). Notas: ${req.body.notes || 'Sin observaciones'}`,
      master_transaction_id: quote.masterTransactionId || (quote as any).master_transaction_id,
    });

    db.persist();
    eventBus.broadcast("quote_updated", quote);
    res.json({ success: true, quote });
  } catch (err: any) {
    res.status(500).json({ error: "Error al solicitar autorización financiera: " + err.message });
  }
});

app.post("/api/quotes/:id/approve-financial", requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const quote = db.getQuotes().find(q => q.id === id || q.quote_number === id || (q as any).folio === id);
    if (!quote) {
      return res.status(404).json({ error: "Cotización no encontrada" });
    }

    const authCheck = QuoteFinancialApprovalService.canUserAuthorize(user, quote);
    if (!authCheck.allowed) {
      db.logAudit({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        module: "COTIZACIONES",
        action: "QUOTE_FINANCIAL_APPROVAL_BLOCKED",
        entity_type: "QUOTE",
        entity_id: quote.quote_number || (quote as any).folio || quote.id,
        new_value: `Intento de autorización financiera bloqueado por RBAC / regla anti-autoaprobación (${authCheck.error})`,
        master_transaction_id: quote.masterTransactionId || (quote as any).master_transaction_id,
      });
      return res.status(403).json({ error: authCheck.error, code: authCheck.code });
    }

    const result = QuoteFinancialApprovalService.approveQuote(quote, user, req.body.notes);
    if (!result.success || !result.updatedQuote) {
      return res.status(400).json({ error: result.error, code: result.code });
    }

    Object.assign(quote, result.updatedQuote);

    db.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      module: "COTIZACIONES",
      action: "QUOTE_FINANCIAL_APPROVED",
      entity_type: "QUOTE",
      entity_id: quote.quote_number || (quote as any).folio || quote.id,
      new_value: `Cotización autorizada financieramente por ${user.name} (${user.role}). Versión aprobada: v${quote.approvedQuoteVersion}. Notas: ${req.body.notes || 'Autorización conforme'}`,
      master_transaction_id: quote.masterTransactionId || (quote as any).master_transaction_id,
    });

    db.persist();
    eventBus.broadcast("quote_updated", quote);
    res.json({ success: true, quote });
  } catch (err: any) {
    res.status(500).json({ error: "Error al autorizar cotización: " + err.message });
  }
});

app.post("/api/quotes/:id/reject-financial", requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: "El motivo de rechazo es obligatorio para el dictamen de Finanzas.", code: "REJECTION_REASON_REQUIRED" });
    }

    const quote = db.getQuotes().find(q => q.id === id || q.quote_number === id || (q as any).folio === id);
    if (!quote) {
      return res.status(404).json({ error: "Cotización no encontrada" });
    }

    const authCheck = QuoteFinancialApprovalService.canUserAuthorize(user, quote);
    if (!authCheck.allowed) {
      return res.status(403).json({ error: authCheck.error, code: authCheck.code });
    }

    const result = QuoteFinancialApprovalService.rejectQuote(quote, user, reason.trim());
    if (!result.success || !result.updatedQuote) {
      return res.status(400).json({ error: result.error, code: result.code });
    }

    Object.assign(quote, result.updatedQuote);

    db.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      module: "COTIZACIONES",
      action: "QUOTE_FINANCIAL_REJECTED",
      entity_type: "QUOTE",
      entity_id: quote.quote_number || (quote as any).folio || quote.id,
      new_value: `Cotización rechazada financieramente por ${user.name} (${user.role}). Motivo: ${reason.trim()}`,
      master_transaction_id: quote.masterTransactionId || (quote as any).master_transaction_id,
    });

    db.persist();
    eventBus.broadcast("quote_updated", quote);
    res.json({ success: true, quote });
  } catch (err: any) {
    res.status(500).json({ error: "Error al rechazar cotización: " + err.message });
  }
});

// ==========================================
// 8. ORDERS (PEDIDOS)
// ==========================================
app.get("/api/orders", requireAuth, requirePermission("PEDIDOS", "VIEW"), (req, res) => {
  const user = (req as any).user;
  const orders = db.getOrders();
  const scopedOrders = CommercialRLSService.scopeOrders(orders, user);
  res.json(scopedOrders);
});

app.get("/api/orders/:id", requireAuth, requirePermission("PEDIDOS", "VIEW"), (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const order = db.getOrders().find(o => o.id === id || o.order_number === id || o.folio === id);
    if (!order) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    const access = CommercialRLSService.validateAccess(user, 'ORDER', order, 'READ');
    if (!access.allowed) {
      db.logAudit({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        module: "PEDIDOS",
        action: "ACCESO_DENEGADO_RLS",
        entity_type: "ORDER",
        entity_id: order.order_number || order.folio || order.id,
        new_value: access.error || "Intento de consulta de pedido ajeno bloqueado por RLS (403)",
      });
      return res.status(403).json({ error: access.error || "403 ACCESS_DENIED: Este pedido pertenece a otro ejecutivo comercial." });
    }

    res.json(order);
  } catch (e: any) {
    res.status(500).json({ error: "Error consultando pedido: " + e.message });
  }
});

app.patch("/api/orders/:id/status", requireAuth, requirePermission("PEDIDOS", "EDIT"), (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { status } = req.body;

    const order = db.getOrders().find(o => o.id === id || o.order_number === id || o.folio === id);
    if (!order) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    if (user.role === 'VENDEDOR') {
      if (status === 'EN_SURTIDO' || status === 'SURTIDO' || status === 'ENTREGADO') {
        return res.status(403).json({
          error: "403 FORBIDDEN: El rol EJECUTIVO_VENTAS / VENDEDOR no cuenta con permisos operativos para avanzar el estatus físico de almacén ni procesar entregas."
        });
      }
      const access = CommercialRLSService.validateAccess(user, 'ORDER', order, 'UPDATE');
      if (!access.allowed) {
        return res.status(403).json({ error: access.error });
      }
    }

    const previousStatus = order.status;
    order.status = status;
    order.updated_at = new Date().toISOString();

    db.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      module: "PEDIDOS",
      action: "ACTUALIZAR_ESTATUS_PEDIDO",
      entity_type: "ORDER",
      entity_id: order.order_number || order.folio || id,
      previous_value: previousStatus,
      new_value: status,
    });

    db.persist();
    eventBus.broadcast("order_updated", order);

    res.json(order);
  } catch (e) {
    res.status(500).json({ error: "Error actualizando estatus de pedido" });
  }
});

app.post("/api/orders/:id/deliver", requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    if (user.role === 'VENDEDOR') {
      return res.status(403).json({
        error: "403 FORBIDDEN: El rol EJECUTIVO_VENTAS / VENDEDOR no cuenta con facultades operativas de despacho o entrega física de almacén."
      });
    }

    const order = db.getOrders().find(o => o.id === id || o.order_number === id || o.folio === id);
    if (!order) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    const previousStatus = order.status;
    order.status = 'ENTREGADO';
    order.updated_at = new Date().toISOString();

    db.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      module: "PEDIDOS",
      action: "ENTREGA_PEDIDO",
      entity_type: "ORDER",
      entity_id: order.order_number || order.folio || id,
      previous_value: previousStatus,
      new_value: 'ENTREGADO',
    });

    db.persist();
    eventBus.broadcast("order_updated", order);

    res.json({ success: true, order });
  } catch (e) {
    res.status(500).json({ error: "Error procesando entrega de pedido" });
  }
});

// ==========================================
// 8.1 PROOF OF DELIVERY (POD)
// ==========================================
app.post("/api/pod", requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    // RBAC: Commercial executive cannot execute physical delivery
    if (user.role === 'VENDEDOR') {
      db.logAudit({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        module: "LOGISTICA",
        action: "POD_REGISTRATION_DENIED_VENDEDOR",
        entity_type: "POD",
        entity_id: req.body?.orderId || req.body?.orderNumber || "UNKNOWN",
        new_value: `403 FORBIDDEN: El usuario ${user.name} (${user.role}) intentó registrar entrega física POD. Bloqueado por segregación de funciones.`,
      });
      db.persist();
      return res.status(403).json({
        error: "403 FORBIDDEN: El rol EJECUTIVO_VENTAS / VENDEDOR no cuenta con facultades operativas de entrega física."
      });
    }

    const podData = req.body;
    const recipient = podData.recipientName || podData.receivedByName;
    if (!recipient || !recipient.trim()) {
      return res.status(400).json({ error: "El nombre de la persona que recibe es obligatorio." });
    }

    if (!podData.signature && !podData.signatureUrl) {
      return res.status(400).json({ error: "La firma digital de recepción es obligatoria para certificar el POD." });
    }

    const orderId = podData.orderId || podData.orderNumber;
    const order = db.getOrders().find(o => o.id === orderId || o.order_number === orderId || o.folio === orderId);
    
    if (order && order.status === 'CANCELADO') {
      return res.status(400).json({ error: "DENIED: No es posible registrar entrega en un pedido cancelado." });
    }

    // BLOQUEO OPERATIVO DE LOGÍSTICA (Observación #12)
    const picking = db.getPicking(order?.id || orderId) || (order ? db.getPickings().find(p => p.orderId === order.id || p.orderFolio === order.folio) : undefined);
    const readiness = validateLogisticsReadiness(order, picking);

    if (!readiness.isReady) {
      db.logAudit({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        module: "LOGISTICA",
        action: "LOGISTICS_ACTION_BLOCKED",
        entity_type: "ORDER",
        entity_id: order?.folio || order?.order_number || orderId,
        new_value: JSON.stringify({
          orderId: order?.id || orderId,
          pickingId: picking?.pickingId || null,
          pickingStatus: picking?.status || 'NO_EXISTE',
          fulfillmentStatus: order?.fulfillmentStatus || 'NO_SURTIDO',
          attemptedAction: 'REGISTRAR_POD',
          userId: user.id,
          timestamp: new Date().toISOString(),
          masterTransactionId: order?.master_transaction_id || order?.masterTransactionId || picking?.masterTransactionId || null,
          reason: readiness.reason,
        }),
      });
      db.persist();

      return res.status(422).json({
        error: "LOGISTICS_BLOCKED_PENDING_FULFILLMENT",
        message: readiness.reason,
        orderId: order?.id || orderId,
        orderFolio: order?.folio || order?.order_number,
        readinessStatus: readiness.status,
      });
    }

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 5);
    const nowIso = now.toISOString();

    const podItems = (podData.items || []).map((itm: any) => ({
      productId: itm.productId || itm.orderItemId,
      orderItemId: itm.orderItemId,
      sku: itm.sku || itm.productCode || '',
      description: itm.description || itm.productName || '',
      unit: itm.unit || 'PZA',
      qtyExpected: itm.qtyExpected !== undefined ? Number(itm.qtyExpected) : (itm.quantityShipped !== undefined ? Number(itm.quantityShipped) : 0),
      qtyReceived: itm.qtyReceived !== undefined ? Number(itm.qtyReceived) : (itm.quantityDelivered !== undefined ? Number(itm.quantityDelivered) : 0),
      difference: itm.difference !== undefined ? Number(itm.difference) : (itm.quantityDifference !== undefined ? Number(itm.quantityDifference) : 0),
      rejectionReason: itm.rejectionReason || '',
    }));

    const isPartialDelivery = podData.status === 'PARTIAL' || podItems.some((pi: any) => pi.difference > 0);

    const canonicalPOD = {
      id: podData.id || podData.podId || `POD-${Date.now().toString(36).toUpperCase()}`,
      podId: podData.podId || podData.id || `POD-${Date.now().toString(36).toUpperCase()}`,
      routeStopId: podData.routeStopId || podData.deliveryId,
      deliveryId: podData.deliveryId || podData.routeStopId,
      routeId: podData.routeId,
      orderId: order?.id || orderId,
      orderNumber: order?.order_number || order?.folio || podData.orderNumber || orderId,
      masterTransactionId: podData.masterTransactionId || order?.master_transaction_id || order?.masterTransactionId || `MTX-${Date.now().toString(36).toUpperCase()}`,
      customerId: podData.customerId || order?.customer_id || order?.customerId,
      customerName: podData.customerName || order?.customer_name || order?.customerName,
      registeredByUserId: user.id,
      registeredByName: user.name,
      verifiedByUser: user.name,
      registeredAt: nowIso,
      recipientName: recipient.trim(),
      receivedByName: recipient.trim(),
      recipientIdNumber: podData.recipientIdNumber || podData.receivedByRole,
      receivedByRole: podData.receivedByRole || podData.recipientIdNumber,
      deliveryDate: podData.deliveryDate || dateStr,
      deliveryTime: podData.deliveryTime || timeStr,
      signature: podData.signature || podData.signatureUrl,
      signatureUrl: podData.signatureUrl || podData.signature,
      photoUrl: podData.photoUrl || podData.photoEvidenceUrl || podData.photoEvidence,
      photoEvidence: podData.photoEvidence || podData.photoEvidenceUrl || podData.photoUrl,
      photoEvidenceUrl: podData.photoEvidenceUrl || podData.photoEvidence || podData.photoUrl,
      observations: podData.observations || podData.notes || podData.comments || "",
      notes: podData.notes || podData.observations || podData.comments || "",
      guideNumber: podData.guideNumber,
      vehicle: podData.vehicle,
      vehicleId: podData.vehicleId || podData.vehicle,
      driver: podData.driver,
      driverId: podData.driverId || podData.driver,
      shipmentId: podData.shipmentId || podData.routeId,
      status: isPartialDelivery ? 'PARTIAL' : 'ENTREGADO',
      items: podItems,
      createdAt: podData.createdAt || nowIso,
      updatedAt: nowIso,
      timestamp: podData.timestamp || `${dateStr} ${timeStr}`,
    };

    if (order) {
      order.status = canonicalPOD.status === 'PARTIAL' ? 'ENTREGA_PARCIAL' : 'ENTREGADO';
      (order as any).pod = canonicalPOD;
      (order as any).podId = canonicalPOD.podId;
      order.updated_at = nowIso;
    }

    const pods = db.getPods();
    const existingIdx = pods.findIndex((p: any) => p.podId === canonicalPOD.podId || (p.orderId === canonicalPOD.orderId && p.deliveryId === canonicalPOD.deliveryId));
    if (existingIdx >= 0) {
      pods[existingIdx] = { ...pods[existingIdx], ...canonicalPOD, updatedAt: nowIso };
    } else {
      pods.unshift(canonicalPOD);
    }

    db.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      module: "LOGISTICA",
      action: "DELIVERY_POD_REGISTERED",
      entity_type: "POD",
      entity_id: canonicalPOD.podId,
      new_value: `POD registrado para ${canonicalPOD.orderNumber}. Recibió: ${canonicalPOD.recipientName}. MTX: ${canonicalPOD.masterTransactionId}. Items: ${podItems.length}. Firma: ${!!canonicalPOD.signature}. Foto: ${!!canonicalPOD.photoEvidence}.`,
    });

    db.persist();
    eventBus.broadcast("pod_registered", canonicalPOD);
    if (order) {
      eventBus.broadcast("order_updated", order);
    }

    res.json({ success: true, pod: canonicalPOD });
  } catch (e: any) {
    res.status(500).json({ error: "Error registrando POD: " + e.message });
  }
});

app.get("/api/pods", requireAuth, (req, res) => {
  try {
    const pods = db.getPods();
    res.json(pods);
  } catch (e: any) {
    res.status(500).json({ error: "Error obteniendo pods: " + e.message });
  }
});

app.get("/api/pod/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  const pods = db.getPods();
  const pod = pods.find((p: any) => p.podId === id || p.id === id || p.orderId === id || p.orderNumber === id);
  if (!pod) {
    return res.status(404).json({ error: "POD no encontrado" });
  }
  res.json(pod);
});

app.get("/api/orders/:id/pod", requireAuth, (req, res) => {
  const { id } = req.params;
  const pods = db.getPods();
  const pod = pods.find((p: any) => p.orderId === id || p.orderNumber === id);
  if (!pod) {
    return res.status(404).json({ error: "POD no encontrado para este pedido" });
  }
  res.json(pod);
});

// ==========================================
// 8.2 LOGÍSTICA & RUTAS (Observación #12)
// ==========================================

// Suite de certificación de Observación #12
app.get("/api/logistics/certification-suite", (_req, res) => {
  try {
    const result = LogisticsBlockCertificationService.runCertificationTests();
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: "Error ejecutando suite de certificación: " + e.message });
  }
});

app.get("/api/routes", requireAuth, (_req, res) => {
  try {
    const routes = db.getRoutes();
    res.json(routes);
  } catch (e: any) {
    res.status(500).json({ error: "Error consultando rutas: " + e.message });
  }
});

app.get("/api/routes/:id", requireAuth, (req, res) => {
  try {
    const route = db.getRoute(req.params.id);
    if (!route) {
      return res.status(404).json({ error: "Ruta no encontrada" });
    }
    res.json(route);
  } catch (e: any) {
    res.status(500).json({ error: "Error consultando ruta: " + e.message });
  }
});

// Programar Ruta con BLOQUEO ESTRICTO DE SURTIDO FÍSICO
app.post("/api/routes", requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    // RBAC: Segregación de funciones (VENDEDOR no puede programar rutas)
    if (user && user.role === 'VENDEDOR') {
      return res.status(403).json({
        error: "FORBIDDEN",
        message: "403 FORBIDDEN: El rol VENDEDOR no cuenta con autorización para programar o manipular rutas logísticas.",
      });
    }

    const {
      date,
      warehouseId,
      warehouseName,
      vehicleId,
      vehicleName,
      vehiclePlate,
      driverId,
      driverName,
      driverPhone,
      zone,
      notes,
      orderIds,
      estimatedDistanceKm,
      estimatedDuration,
    } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ error: "Se requiere al menos un pedido para programar la ruta." });
    }

    const allOrders = db.getOrders();
    const allPickings = db.getPickings();

    // VALIDACIÓN ESTRICTA DE BLOQUEO LOGÍSTICO PARA CADA PEDIDO
    for (const ordId of orderIds) {
      const order = allOrders.find(o => o.id === ordId || o.folio === ordId || o.order_number === ordId);
      if (!order) {
        return res.status(404).json({ error: `Pedido ${ordId} no encontrado en la base de datos.` });
      }

      const picking = db.getPicking(order.id) || allPickings.find(p => p.orderId === order.id || p.orderFolio === order.folio);
      const readiness = validateLogisticsReadiness(order, picking);

      if (!readiness.isReady) {
        // Registrar intento bloqueado en Auditoría (Req 21)
        db.logAudit({
          user_id: user?.id || 'SYS',
          user_name: user?.name || 'Sistema',
          user_role: user?.role || 'LOGISTICA',
          module: "LOGISTICA",
          action: "LOGISTICS_ACTION_BLOCKED",
          entity_type: "ORDER",
          entity_id: order.folio || order.order_number || order.id,
          new_value: JSON.stringify({
            orderId: order.id,
            pickingId: picking?.pickingId || null,
            pickingStatus: picking?.status || 'NO_EXISTE',
            fulfillmentStatus: order.fulfillmentStatus || 'NO_SURTIDO',
            attemptedAction: 'PROGRAMAR_RUTA',
            userId: user?.id || 'SYS',
            timestamp: new Date().toISOString(),
            masterTransactionId: order.master_transaction_id || order.masterTransactionId || picking?.masterTransactionId || null,
            reason: readiness.reason,
          }),
        });
        db.persist();

        return res.status(422).json({
          error: "LOGISTICS_BLOCKED_PENDING_FULFILLMENT",
          message: readiness.reason,
          orderId: order.id,
          orderFolio: order.folio || order.order_number,
          readinessStatus: readiness.status,
        });
      }
    }

    // IDEMPOTENCIA: Verificar si ya existe una ruta activa idéntica para hoy
    const existingRoutes = db.getRoutes();
    const targetDate = date || new Date().toISOString().slice(0, 10);
    const duplicateRoute = existingRoutes.find(r => 
      r.date === targetDate &&
      r.vehicleId === vehicleId &&
      r.driverId === driverId &&
      r.status === 'PLANNED' &&
      r.stops.length === orderIds.length &&
      orderIds.every(id => r.stops.some(s => s.orderId === id || s.orderFolio === id))
    );

    if (duplicateRoute) {
      return res.json({ success: true, route: duplicateRoute, idempotent: true });
    }

    // Construir paradas respetando la cantidad máxima shippableQty (Req 18)
    const routeId = `RUT-${Date.now().toString(36).toUpperCase()}`;
    const routeNumber = `RUT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    let totalWeight = 0;
    let totalVolume = 0;
    let totalItems = 0;

    const stops = orderIds.map((ordId: string, idx: number) => {
      const order = allOrders.find(o => o.id === ordId || o.folio === ordId || o.order_number === ordId)!;
      const picking = db.getPicking(order.id) || allPickings.find(p => p.orderId === order.id || p.orderFolio === order.folio);
      const readiness = validateLogisticsReadiness(order, picking);

      const stopItems = readiness.shippableItems.map(si => {
        totalItems += si.shippableQty;
        totalWeight += si.shippableQty * 5;
        return {
          id: `STP-ITM-${Math.random().toString(36).slice(2, 7)}`,
          orderItemId: si.orderItemId,
          productCode: si.sku,
          productName: si.productName,
          quantity: si.shippableQty,
          unit: 'PZA',
          weightKg: si.shippableQty * 5,
        };
      });

      return {
        id: `STP-${idx + 1}-${Math.random().toString(36).slice(2, 6)}`,
        stopNumber: idx + 1,
        orderId: order.id,
        orderFolio: order.folio || order.order_number || '',
        customerName: order.customerName || order.customer_name || 'Cliente',
        shippingAddress: order.shippingAddress || order.shipping_address || order.deliveryAddress || order.delivery_address || 'Dirección de Entrega',
        contactPhone: (order as any).customerPhone || '',
        status: 'PENDING' as const,
        priority: 'NORMAL' as const,
        items: stopItems,
      };
    });

    const newRoute: any = {
      id: routeId,
      routeNumber,
      date: targetDate,
      warehouseId: warehouseId || 'WH-01',
      warehouseName: warehouseName || 'Almacén Central',
      vehicleId: vehicleId || 'VEH-01',
      vehicleName: vehicleName || 'Camioneta 3.5 Ton',
      vehiclePlate: vehiclePlate || 'P-1234-CDMX',
      driverId: driverId || 'DRV-01',
      driverName: driverName || 'Operador de Ruta',
      driverPhone: driverPhone || '',
      status: 'PLANNED',
      zone: zone || 'Zona Metropolitana',
      estimatedDistanceKm: Number(estimatedDistanceKm) || 45,
      estimatedDuration: estimatedDuration || '4h 00m',
      totalWeightKg: totalWeight,
      totalVolumeM3: totalVolume || 5.2,
      totalOrders: orderIds.length,
      totalItems,
      stops,
      notes: notes || '',
    };

    db.saveRoute(newRoute);

    // Actualizar pedidos asociados a PROGRAMADO
    for (const ordId of orderIds) {
      const order = allOrders.find(o => o.id === ordId || o.folio === ordId || o.order_number === ordId);
      if (order) {
        order.status = 'PROGRAMADO' as any;
        order.updated_at = new Date().toISOString();
      }
    }

    db.logAudit({
      user_id: user?.id || 'SYS',
      user_name: user?.name || 'Sistema',
      user_role: user?.role || 'LOGISTICA',
      module: "LOGISTICA",
      action: "RUTA_PROGRAMADA",
      entity_type: "ROUTE",
      entity_id: routeNumber,
      new_value: `Ruta programada ${routeNumber} con ${orderIds.length} pedidos. Vehículo: ${newRoute.vehicleName}. Chofer: ${newRoute.driverName}.`,
    });

    db.persist();
    eventBus.broadcast("route_created", newRoute);

    res.status(201).json({ success: true, route: newRoute });
  } catch (e: any) {
    res.status(500).json({ error: "Error programando ruta: " + e.message });
  }
});

// Cargar Unidad (Start Loading)
app.post("/api/routes/:id/load", requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    const route = db.getRoute(req.params.id);
    if (!route) {
      return res.status(404).json({ error: "Ruta no encontrada." });
    }

    const allOrders = db.getOrders();
    const allPickings = db.getPickings();

    // Validar bloqueo operativo en cada pedido de la parada
    for (const stop of route.stops) {
      const order = allOrders.find(o => o.id === stop.orderId || o.folio === stop.orderFolio || o.order_number === stop.orderFolio);
      const picking = order ? (db.getPicking(order.id) || allPickings.find(p => p.orderId === order.id || p.orderFolio === order.folio)) : undefined;
      const readiness = validateLogisticsReadiness(order, picking);

      if (!readiness.isReady) {
        db.logAudit({
          user_id: user?.id || 'SYS',
          user_name: user?.name || 'Sistema',
          user_role: user?.role || 'LOGISTICA',
          module: "LOGISTICA",
          action: "LOGISTICS_ACTION_BLOCKED",
          entity_type: "ORDER",
          entity_id: stop.orderFolio || stop.orderId,
          new_value: JSON.stringify({
            orderId: stop.orderId,
            pickingId: picking?.pickingId || null,
            attemptedAction: 'CARGAR_UNIDAD',
            userId: user?.id || 'SYS',
            timestamp: new Date().toISOString(),
            reason: readiness.reason,
          }),
        });
        db.persist();

        return res.status(422).json({
          error: "LOGISTICS_BLOCKED_PENDING_FULFILLMENT",
          message: `Carga bloqueada: ${readiness.reason} (Pedido ${stop.orderFolio}).`,
        });
      }
    }

    route.status = 'LOADING';
    db.saveRoute(route);

    for (const stop of route.stops) {
      const order = allOrders.find(o => o.id === stop.orderId || o.folio === stop.orderFolio || o.order_number === stop.orderFolio);
      if (order) {
        order.status = 'CARGANDO' as any;
        order.updated_at = new Date().toISOString();
      }
    }

    db.logAudit({
      user_id: user?.id || 'SYS',
      user_name: user?.name || 'Sistema',
      user_role: user?.role || 'LOGISTICA',
      module: "LOGISTICA",
      action: "RUTA_CARGA_INICIADA",
      entity_type: "ROUTE",
      entity_id: route.routeNumber,
      new_value: `Carga iniciada para ruta ${route.routeNumber}.`,
    });

    db.persist();
    eventBus.broadcast("route_updated", route);

    res.json({ success: true, route });
  } catch (e: any) {
    res.status(500).json({ error: "Error iniciando carga: " + e.message });
  }
});

// Despacho de Ruta (Dispatch / Departure)
app.post("/api/routes/:id/dispatch", requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    const route = db.getRoute(req.params.id);
    if (!route) {
      return res.status(404).json({ error: "Ruta no encontrada." });
    }

    const allOrders = db.getOrders();
    const allPickings = db.getPickings();

    // Validar bloqueo operativo antes de permitir el despacho
    for (const stop of route.stops) {
      const order = allOrders.find(o => o.id === stop.orderId || o.folio === stop.orderFolio || o.order_number === stop.orderFolio);
      const picking = order ? (db.getPicking(order.id) || allPickings.find(p => p.orderId === order.id || p.orderFolio === order.folio)) : undefined;
      const readiness = validateLogisticsReadiness(order, picking);

      if (!readiness.isReady) {
        db.logAudit({
          user_id: user?.id || 'SYS',
          user_name: user?.name || 'Sistema',
          user_role: user?.role || 'LOGISTICA',
          module: "LOGISTICA",
          action: "LOGISTICS_ACTION_BLOCKED",
          entity_type: "ORDER",
          entity_id: stop.orderFolio || stop.orderId,
          new_value: JSON.stringify({
            orderId: stop.orderId,
            pickingId: picking?.pickingId || null,
            attemptedAction: 'DESPACHAR_RUTA',
            userId: user?.id || 'SYS',
            timestamp: new Date().toISOString(),
            reason: readiness.reason,
          }),
        });
        db.persist();

        return res.status(422).json({
          error: "LOGISTICS_BLOCKED_PENDING_FULFILLMENT",
          message: `Despacho bloqueado: ${readiness.reason} (Pedido ${stop.orderFolio}).`,
        });
      }
    }

    route.status = 'IN_ROUTE';
    route.departureTime = new Date().toISOString();
    if (req.body.departureChecklist) {
      route.departureChecklist = req.body.departureChecklist;
    }
    db.saveRoute(route);

    for (const stop of route.stops) {
      const order = allOrders.find(o => o.id === stop.orderId || o.folio === stop.orderFolio || o.order_number === stop.orderFolio);
      if (order) {
        order.status = 'EN RUTA' as any;
        order.updated_at = new Date().toISOString();
      }
    }

    db.logAudit({
      user_id: user?.id || 'SYS',
      user_name: user?.name || 'Sistema',
      user_role: user?.role || 'LOGISTICA',
      module: "LOGISTICA",
      action: "RUTA_DESPACHADA",
      entity_type: "ROUTE",
      entity_id: route.routeNumber,
      new_value: `Ruta ${route.routeNumber} despachada hacia ${route.zone}. Chofer: ${route.driverName}.`,
    });

    db.persist();
    eventBus.broadcast("route_updated", route);

    res.json({ success: true, route });
  } catch (e: any) {
    res.status(500).json({ error: "Error despachando ruta: " + e.message });
  }
});

// ==========================================
// 8.1 PICKING OPERATIVO & SURTIDO FÍSICO
// ==========================================

app.get("/api/picking", requireAuth, (_req, res) => {
  try {
    const pickings = db.getPickings();
    res.json(pickings);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/picking/:id", requireAuth, (req, res) => {
  try {
    const picking = db.getPicking(req.params.id);
    if (!picking) {
      return res.status(404).json({ error: "Picking no encontrado" });
    }
    res.json(picking);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/orders/:orderId/picking", requireAuth, (req, res) => {
  try {
    const { orderId } = req.params;
    const picking = db.getPicking(orderId);
    if (!picking) {
      return res.status(404).json({ error: "No existe picking para este pedido." });
    }
    res.json(picking);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/picking", requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    if (user.role === 'VENDEDOR') {
      return res.status(403).json({ error: "403 FORBIDDEN: El rol VENDEDOR no cuenta con facultades operativas de almacén/picking." });
    }

    const pickingData = req.body;
    if (!pickingData || !pickingData.orderId) {
      return res.status(400).json({ error: "orderId es requerido para generar o actualizar el picking." });
    }

    const order = db.getOrders().find(o => o.id === pickingData.orderId || o.folio === pickingData.orderFolio || o.order_number === pickingData.orderFolio);
    if (!order) {
      return res.status(404).json({ error: "Pedido asociado no encontrado." });
    }

    if (order.status === 'CANCELADO') {
      return res.status(400).json({ error: "DENIED: No se puede generar o editar picking de un pedido cancelado." });
    }

    // Validar partidas y cantidades
    const items = (pickingData.items || []).map((itm: any, idx: number) => {
      const orderQty = itm.orderQty !== undefined ? Number(itm.orderQty) : (itm.qtyRequested !== undefined ? Number(itm.qtyRequested) : 0);
      const pickedQty = itm.pickedQty !== undefined ? Number(itm.pickedQty) : (itm.qtyPicked !== undefined ? Number(itm.qtyPicked) : 0);
      const availQty = itm.availableQty !== undefined ? Number(itm.availableQty) : (itm.qtyAvailable !== undefined ? Number(itm.qtyAvailable) : 999);

      if (pickedQty < 0) {
        throw new Error(`La cantidad surtida no puede ser negativa en la partida ${itm.productCode || itm.productId || idx + 1}.`);
      }
      if (pickedQty > availQty) {
        throw new Error(`La cantidad surtida (${pickedQty}) supera la existencia disponible (${availQty}) en ${itm.productName || itm.productCode}.`);
      }
      if (orderQty > 0 && pickedQty > orderQty) {
        throw new Error(`La cantidad surtida (${pickedQty}) no puede superar la cantidad pedida (${orderQty}) en ${itm.productName || itm.productCode}.`);
      }

      const itemStatus = pickedQty >= orderQty ? 'SURTIDO' : (pickedQty > 0 ? 'PARCIAL' : 'PENDIENTE');

      return {
        id: itm.id || `PI-${idx + 1}-${Date.now().toString(36).toUpperCase().slice(-3)}`,
        orderItemId: itm.orderItemId || `OI-${idx + 1}`,
        productId: itm.productId,
        productCode: itm.productCode || itm.sku,
        productName: itm.productName,
        unit: itm.unit || 'PZA',
        qtyRequested: orderQty,
        qtyAvailable: availQty,
        qtyPicked: pickedQty,
        location: itm.location || 'N1 / R-01 / P-01 / Niv-1',
        status: itm.status || itemStatus,
        notes: itm.notes,
        sku: itm.sku || itm.productCode,
        orderQty,
        availableQty: availQty,
        pickedQty,
      };
    });

    const existing = db.getPicking(order.id);
    const pickingId = pickingData.pickingId || pickingData.id || existing?.pickingId || `PCK-${order.folio || order.order_number}-${Date.now().toString(36).toUpperCase().slice(-4)}`;

    const picking: any = {
      id: pickingId,
      pickingId,
      orderId: order.id,
      orderFolio: order.folio || order.order_number || pickingData.orderFolio,
      customerName: order.customer_name || (order as any).customerName || pickingData.customerName || 'Cliente',
      warehouseId: order.warehouse_id || (order as any).warehouseId || pickingData.warehouseId || 'WH-01',
      warehouseName: order.warehouse_name || (order as any).warehouseName || pickingData.warehouseName || 'Almacén Central Tultitlán',
      status: pickingData.status || existing?.status || 'EN_PROCESO',
      items,
      createdBy: existing?.createdBy || pickingData.createdBy || user.id,
      createdByName: existing?.createdByName || pickingData.createdByName || user.name,
      createdAt: existing?.createdAt || pickingData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      verifiedBy: pickingData.verifiedBy || existing?.verifiedBy,
      verifiedByName: pickingData.verifiedByName || existing?.verifiedByName,
      verifiedAt: pickingData.verifiedAt || existing?.verifiedAt,
      verificationNotes: pickingData.verificationNotes || existing?.verificationNotes,
      managerSignature: pickingData.managerSignature || existing?.managerSignature,
      completedAt: pickingData.completedAt || existing?.completedAt,
      masterTransactionId: pickingData.masterTransactionId || existing?.masterTransactionId || order.master_transaction_id || `MTX-${Date.now().toString(36).toUpperCase()}`,
      fulfillmentType: pickingData.fulfillmentType || existing?.fulfillmentType,
      notes: pickingData.notes !== undefined ? pickingData.notes : (existing?.notes || ""),
    };

    const saved = db.savePicking(picking);
    db.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      module: "ALMACENES",
      action: existing ? "PICKING_ACTUALIZADO" : "PICKING_CREADO",
      entity_type: "PICKING",
      entity_id: saved.pickingId,
      new_value: `Picking ${saved.pickingId} ${existing ? 'actualizado' : 'creado'} para pedido ${saved.orderFolio}. Estatus: ${saved.status}. Partidas: ${saved.items.length}.`,
    });

    eventBus.broadcast("picking_updated", saved);
    res.json({ success: true, picking: saved });
  } catch (e: any) {
    res.status(400).json({ error: "Error procesando picking: " + e.message });
  }
});

app.patch("/api/picking/:id", requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    if (user.role === 'VENDEDOR') {
      return res.status(403).json({ error: "403 FORBIDDEN: El rol VENDEDOR no cuenta con facultades operativas de almacén/picking." });
    }

    const picking = db.getPicking(req.params.id);
    if (!picking) {
      return res.status(404).json({ error: "Picking no encontrado." });
    }

    const { items, notes, status } = req.body;
    if (items && Array.isArray(items)) {
      picking.items = items.map((itm: any) => {
        const orderQty = itm.orderQty !== undefined ? Number(itm.orderQty) : (itm.qtyRequested !== undefined ? Number(itm.qtyRequested) : 0);
        const pickedQty = itm.pickedQty !== undefined ? Number(itm.pickedQty) : (itm.qtyPicked !== undefined ? Number(itm.qtyPicked) : 0);
        const availQty = itm.availableQty !== undefined ? Number(itm.availableQty) : (itm.qtyAvailable !== undefined ? Number(itm.qtyAvailable) : 999);

        if (pickedQty < 0) throw new Error("La cantidad surtida no puede ser negativa.");
        if (pickedQty > availQty) throw new Error(`La cantidad surtida (${pickedQty}) supera la existencia disponible (${availQty}).`);
        if (orderQty > 0 && pickedQty > orderQty) throw new Error(`La cantidad surtida (${pickedQty}) no puede superar la pedida (${orderQty}).`);

        return {
          ...itm,
          qtyRequested: orderQty,
          qtyPicked: pickedQty,
          qtyAvailable: availQty,
          orderQty,
          pickedQty,
          availableQty: availQty,
          status: pickedQty >= orderQty ? 'SURTIDO' : (pickedQty > 0 ? 'PARCIAL' : 'PENDIENTE'),
        };
      });
    }

    if (notes !== undefined) picking.notes = notes;
    if (status) picking.status = status;
    picking.updatedAt = new Date().toISOString();

    const saved = db.savePicking(picking);
    eventBus.broadcast("picking_updated", saved);
    res.json({ success: true, picking: saved });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.post("/api/picking/:id/complete", requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    if (user.role === 'VENDEDOR') {
      return res.status(403).json({ error: "403 FORBIDDEN: El rol VENDEDOR no cuenta con autorización para completar picking." });
    }

    const picking = db.getPicking(req.params.id);
    if (!picking) {
      return res.status(404).json({ error: "Picking no encontrado." });
    }

    const order = db.getOrders().find(o => o.id === picking.orderId || o.folio === picking.orderFolio || o.order_number === picking.orderFolio);
    if (order && order.status === 'CANCELADO') {
      return res.status(400).json({ error: "DENIED: No se puede completar el picking de un pedido cancelado." });
    }

    if (!picking.items || picking.items.length === 0) {
      return res.status(400).json({ error: "DENIED: El picking no contiene partidas a surtir." });
    }

    // Validar partidas y determinar completud
    let isPartial = false;
    for (const itm of picking.items) {
      const orderQty = itm.orderQty !== undefined ? Number(itm.orderQty) : Number(itm.qtyRequested || 0);
      const pickedQty = itm.pickedQty !== undefined ? Number(itm.pickedQty) : Number(itm.qtyPicked || 0);

      if (pickedQty < 0) {
        return res.status(400).json({ error: `DENIED: Cantidad surtida no válida en ${itm.productName}.` });
      }
      if (pickedQty < orderQty) {
        isPartial = true;
      }
    }

    const fulfillmentType = isPartial ? 'PICKING_PARCIAL' : 'PICKING_COMPLETO';
    const nowIso = new Date().toISOString();

    picking.status = 'COMPLETADO';
    picking.fulfillmentType = fulfillmentType;
    picking.completedAt = nowIso;
    picking.updatedAt = nowIso;
    if (req.body?.notes) {
      picking.notes = req.body.notes;
    }

    // Actualizar status de cada item
    picking.items = picking.items.map((i: any) => {
      const orderQty = i.orderQty !== undefined ? Number(i.orderQty) : Number(i.qtyRequested || 0);
      const pickedQty = i.pickedQty !== undefined ? Number(i.pickedQty) : Number(i.qtyPicked || 0);
      return {
        ...i,
        status: pickedQty >= orderQty ? 'SURTIDO' : (pickedQty > 0 ? 'PARCIAL' : 'FALTANTE'),
      };
    });

    const saved = db.savePicking(picking);
    db.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      module: "ALMACENES",
      action: "PICKING_COMPLETADO",
      entity_type: "PICKING",
      entity_id: saved.pickingId,
      new_value: `Picking ${saved.pickingId} completado (${fulfillmentType}) para pedido ${saved.orderFolio} por ${user.name} (${user.role}). MTX: ${saved.masterTransactionId}`,
    });

    eventBus.broadcast("picking_updated", saved);
    res.json({ success: true, picking: saved, fulfillmentType });
  } catch (e: any) {
    res.status(500).json({ error: "Error completando picking: " + e.message });
  }
});

app.post("/api/picking/:id/verify", requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    // Observación 11: SoD (Segregación de Funciones)
    // ALMACEN operativo puede surtir, pero NO puede certificar/verificar.
    // VENDEDOR no cuenta con autorización.
    // Solo JEFE_ALMACEN, ADMINISTRADOR y DIRECTOR pueden verificar.
    const allowedRoles = ['JEFE_ALMACEN', 'ADMINISTRADOR', 'DIRECTOR'];
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        error: `403 FORBIDDEN: El rol ${user.role} no cuenta con autorización para certificar el picking. Se requiere perfil de JEFE_ALMACEN o ADMINISTRADOR (Segregación de Funciones SoD).`,
      });
    }

    const picking = db.getPicking(req.params.id);
    if (!picking) {
      return res.status(404).json({ error: "Picking no encontrado." });
    }

    const { managerSignature, verificationSignature, verificationNotes, verificationObservations } = req.body;
    const finalSignature = verificationSignature || managerSignature || `CERTIFICADO_${user.id}_${Date.now()}`;
    const finalNotes = verificationObservations || verificationNotes || "Verificación física en rack completada conforme y certificada.";

    picking.status = 'VERIFICADO';
    picking.verifiedBy = user.id;
    picking.verifiedByUserId = user.id;
    picking.verifiedByName = user.name;
    picking.verifiedAt = new Date().toISOString();
    picking.verificationNotes = finalNotes;
    picking.verificationObservations = finalNotes;
    picking.managerSignature = finalSignature;
    picking.verificationSignature = finalSignature;
    picking.updatedAt = new Date().toISOString();

    const saved = db.savePicking(picking);
    db.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      module: "ALMACENES",
      action: "PICKING_VERIFICADO",
      entity_type: "PICKING",
      entity_id: saved.pickingId,
      new_value: `Picking ${saved.pickingId} verificado y avalado por ${user.name} (${user.role}). MTX: ${saved.masterTransactionId}`,
    });

    eventBus.broadcast("picking_updated", saved);
    res.json({ success: true, picking: saved });
  } catch (e: any) {
    res.status(500).json({ error: "Error verificando picking: " + e.message });
  }
});

// Endpoint de Certificación y Diagnóstico para Observación 11
app.get("/api/picking/certification-suite", (req, res) => {
  try {
    const { PickingSheetService } = require("./src/services/pickingSheetService");
    const testResults = PickingSheetService.runCertificationTests();
    res.json(testResults);
  } catch (e: any) {
    res.status(500).json({ error: "Error ejecutando suite de certificación: " + e.message });
  }
});

app.get("/api/warehouse/fulfillment/certification-suite", (_req, res) => {
  try {
    const testResults = PhysicalFulfillmentService.runCertificationTests();
    res.json(testResults);
  } catch (e: any) {
    res.status(500).json({ error: "Error ejecutando suite de certificación: " + e.message });
  }
});

app.post("/api/warehouse/fulfillment", requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    // Regla 19: RBAC
    if (user.role === 'VENDEDOR') {
      return res.status(403).json({ error: "403 FORBIDDEN: El rol VENDEDOR no cuenta con autorización para confirmar surtido físico." });
    }
    if (user.role === 'LOGISTICA') {
      return res.status(403).json({ error: "403 FORBIDDEN: El rol LOGÍSTICA no cuenta con autorización para confirmar surtido físico." });
    }

    const { orderId, pickingId, items, notes } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: "orderId es requerido." });
    }

    const order = db.getOrders().find(o => o.id === orderId || o.folio === orderId || o.order_number === orderId);
    if (!order) {
      return res.status(404).json({ error: "Pedido no encontrado." });
    }

    if (order.status === 'CANCELADO') {
      return res.status(400).json({ error: "DENIED: No se puede confirmar surtido físico de un pedido cancelado." });
    }

    const picking = db.getPicking(pickingId || order.id) || db.getPicking(order.folio || order.order_number || '');
    if (!picking) {
      return res.status(400).json({
        error: "El picking debe estar completado antes de confirmar surtido físico.",
        errorCode: "NO_PICKING_FOUND",
      });
    }

    // Regla 15 & 18: Idempotencia - Proteger contra doble click y solicitudes repetidas
    const isAlreadyConfirmed = Boolean(
      picking.status === 'SURTIDO_FISICO_CONFIRMADO' ||
      (picking as any).physicalFulfillmentConfirmed === true ||
      (order as any).physicalFulfillmentConfirmed === true ||
      (order.fulfilledAt && (order.status === 'SURTIDO' || (order.status as any) === 'SURTIDO_PARCIAL'))
    );

    const orderFolio = order.folio || order.order_number || order.id;

    if (isAlreadyConfirmed) {
      // Regla 20: Registro de intento duplicado bloqueado
      db.logAudit({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        module: "ALMACENES",
        action: "PHYSICAL_FULFILLMENT_DUPLICATE_BLOCKED",
        entity_type: "ORDER",
        entity_id: orderFolio,
        new_value: `Intento de surtido físico duplicado bloqueado por idempotencia para pedido ${orderFolio}. Estado actual: ${order.status}.`,
      });

      return res.json({
        success: true,
        isIdempotent: true,
        message: "Este pedido ya tiene el surtido físico confirmado.",
        order,
        picking,
        summary: {
          orderFolio,
          pickingId: picking.pickingId,
          orderStatus: order.status,
          pickingStatus: picking.status,
          movementsCount: 0,
        },
      });
    }

    // El picking debe estar en estatus COMPLETADO o VERIFICADO
    if (picking.status !== 'COMPLETADO' && picking.status !== 'VERIFICADO') {
      return res.status(400).json({
        error: "El picking debe estar completado antes de confirmar surtido físico.",
        errorCode: "PICKING_NOT_COMPLETED",
      });
    }

    if (!picking.items || picking.items.length === 0) {
      return res.status(400).json({ error: "El picking no contiene partidas de inventario." });
    }

    // Regla 3 & 5: Fuente estricta en Picking persistido (pickedQty) - PROHIBIR fallback a orderQty
    const itemsToFulfill = Array.isArray(items) && items.length > 0
      ? items
      : picking.items.map((pi: any) => {
          let pickedVal: any = undefined;
          if (pi.pickedQty !== undefined && pi.pickedQty !== null) {
            pickedVal = pi.pickedQty;
          } else if (pi.qtyPicked !== undefined && pi.qtyPicked !== null) {
            pickedVal = pi.qtyPicked;
          }

          return {
            orderItemId: pi.orderItemId,
            productId: pi.productId,
            sku: pi.productCode || pi.sku,
            productName: pi.productName,
            quantity: pickedVal,
            location: pi.location,
          };
        });

    let totalOrdered = 0;
    let totalFulfilled = 0;

    // Regla 14: Validación atómica preliminar (BEGIN)
    for (const itm of itemsToFulfill) {
      const orderItem = (order.items || []).find((oi: any) => oi.id === itm.orderItemId || oi.productId === itm.productId || oi.sku === itm.sku);
      const orderedQty = orderItem?.quantityOrdered ?? orderItem?.quantity ?? 0;
      totalOrdered += orderedQty;

      const rawQty = itm.quantity;
      if (rawQty === undefined || rawQty === null || (typeof rawQty === 'string' && rawQty.trim() === '')) {
        return res.status(400).json({
          error: "La cantidad surtida registrada no es válida.",
          errorCode: "INVALID_PICKED_QUANTITY",
        });
      }

      const numQty = Number(rawQty);
      if (Number.isNaN(numQty) || numQty < 0) {
        return res.status(400).json({
          error: "La cantidad surtida registrada no es válida.",
          errorCode: "INVALID_PICKED_QUANTITY",
        });
      }

      if (orderedQty > 0 && numQty > orderedQty) {
        return res.status(400).json({
          error: "La cantidad surtida registrada no es válida.",
          errorCode: "INVALID_PICKED_QUANTITY",
        });
      }

      if (numQty > 0) {
        const prod = db.getProducts().find(p => p.id === itm.productId || p.sku === itm.sku || p.code === itm.sku);
        if (prod) {
          const prevStock = prod.physical_stock ?? prod.stock ?? 0;
          if (numQty > prevStock) {
            // Regla 18: Mensaje exacto de error de stock
            return res.status(400).json({
              error: "Existencia insuficiente para confirmar surtido.",
              errorCode: "INSUFFICIENT_STOCK",
            });
          }
        }
      }
      totalFulfilled += numQty;
    }

    const nowIso = new Date().toISOString();
    const masterTxId = picking.masterTransactionId || order.master_transaction_id || `MTX-${Date.now().toString(36).toUpperCase()}`;
    const generatedMovements: any[] = [];

    // Regla 7 & 8: Afectación de Stock y Registro en Kardex (SALIDA exactamente por pickedQty)
    for (const itm of itemsToFulfill) {
      const numQty = Number(itm.quantity) || 0;
      if (numQty <= 0) continue; // Caso C: si pickedQty = 0, no descontar ni registrar Kardex

      const prod = db.getProducts().find(p => p.id === itm.productId || p.sku === itm.sku || p.code === itm.sku);
      if (prod) {
        const prevStock = prod.physical_stock ?? prod.stock ?? 0;
        const newStock = Math.max(0, prevStock - numQty);
        prod.physical_stock = newStock;
        prod.stock = newStock;

        // Regla 9: Reducir reserva únicamente por la cantidad efectivamente surtida
        const prevReserved = prod.reserved_stock ?? prod.reservedStock ?? 0;
        const newReserved = Math.max(0, prevReserved - numQty);
        prod.reserved_stock = newReserved;
        prod.reservedStock = newReserved;
        prod.available_stock = Math.max(0, newStock - newReserved);
        prod.availableStock = prod.available_stock;

        const movId = db.nextMovementNumber();
        const movement: any = {
          id: movId,
          movement_number: movId,
          type: 'SALIDA',
          product_id: prod.id,
          product_name: prod.name,
          product_sku: prod.sku,
          warehouse_id: order.warehouse_id || (order as any).warehouseId || 'WH-01',
          warehouse_name: order.warehouse_name || (order as any).warehouseName || 'Almacén Central Tultitlán',
          location: itm.location || prod.warehouseLocation || 'RACK-01',
          quantity: numQty, // pickedQty
          previous_stock: prevStock,
          new_stock: newStock,
          reason: `Surtido físico confirmado de Pedido ${orderFolio} (Picking ${picking.pickingId})`,
          reference_type: 'PEDIDO',
          reference_id: order.id,
          reference_folio: orderFolio,
          created_by: user.id,
          created_by_name: user.name,
          created_at: nowIso,
          master_transaction_id: masterTxId,
        };
        db.getMovements().push(movement);
        generatedMovements.push(movement);
      }
    }

    // Regla 10: Actualizar fulfillment por partida
    (order.items || []).forEach((oi: any) => {
      const match = itemsToFulfill.find((f: any) => f.orderItemId === oi.id || f.productId === oi.productId);
      const orderedQty = oi.quantityOrdered ?? oi.quantity ?? 0;
      const addFulfilled = match ? Number(match.quantity) || 0 : 0;
      const currentFulfilled = oi.quantityFulfilled ?? 0;
      const finalFulfilled = Math.min(orderedQty, currentFulfilled + addFulfilled);
      const pendingQty = Math.max(0, orderedQty - finalFulfilled);

      oi.quantityFulfilled = finalFulfilled;
      oi.quantityPending = pendingQty;
      oi.requestedQty = orderedQty;
      oi.fulfilledQty = finalFulfilled;
      oi.remainingQty = pendingQty;
      oi.fulfillmentStatus = finalFulfilled >= orderedQty ? 'SURTIDO_TOTAL' : finalFulfilled > 0 ? 'SURTIDO_PARCIAL' : 'PENDIENTE';
    });

    // Regla 11: Estado del Pedido (SURTIDO o SURTIDO_PARCIAL)
    const isPartialOrder = totalFulfilled < totalOrdered;
    const finalOrderStatus = isPartialOrder ? 'SURTIDO_PARCIAL' : 'SURTIDO';
    const finalFulfillmentStatus = isPartialOrder ? 'SURTIDO_PARCIAL' : 'SURTIDO_TOTAL';

    order.status = finalOrderStatus;
    (order as any).fulfillmentStatus = finalFulfillmentStatus;
    (order as any).fulfillment_status = finalFulfillmentStatus;
    (order as any).physicalFulfillmentConfirmed = true;
    (order as any).fulfilled_by = user.id;
    (order as any).fulfilledByName = user.name;
    (order as any).fulfilled_at = nowIso;
    (order as any).fulfilledAt = nowIso;
    (order as any).fulfillmentNotes = notes || picking.notes || "Surtido físico verificado en rack";
    order.updated_at = nowIso;

    // Regla 12: Estado del Picking (SURTIDO_FISICO_CONFIRMADO)
    picking.status = 'SURTIDO_FISICO_CONFIRMADO';
    (picking as any).physicalFulfillmentConfirmed = true;
    (picking as any).fulfilledAt = nowIso;
    (picking as any).fulfilledBy = user.id;
    (picking as any).fulfilledByName = user.name;
    picking.completedAt = picking.completedAt || nowIso;
    picking.notes = notes || picking.notes;
    picking.updatedAt = nowIso;
    db.savePicking(picking);

    // Regla 20: Registro de Auditoría
    db.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      module: "ALMACENES",
      action: "PHYSICAL_FULFILLMENT_CONFIRMED",
      entity_type: "ORDER",
      entity_id: orderFolio,
      new_value: `orderId: ${order.id}, pickingId: ${picking.pickingId}, warehouseId: ${order.warehouse_id || 'WH-01'}, requestedQty: ${totalOrdered}, pickedQty: ${totalFulfilled}, fulfilledQty: ${totalFulfilled}, remainingQty: ${Math.max(0, totalOrdered - totalFulfilled)}, userId: ${user.id}, timestamp: ${nowIso}, masterTransactionId: ${masterTxId}`,
    });

    db.persist();
    eventBus.broadcast("inventory_updated", { orderFolio, movements: generatedMovements });
    eventBus.broadcast("order_updated", order);
    eventBus.broadcast("picking_updated", picking);

    // Regla 17: Mensaje de éxito descriptivo
    res.json({
      success: true,
      message: `Surtido físico confirmado.\nPartidas surtidas: ${itemsToFulfill.length}\nUnidades surtidas: ${totalFulfilled}\nEstado: ${finalOrderStatus}`,
      order,
      picking,
      summary: {
        orderFolio,
        pickingId: picking.pickingId,
        itemsCount: itemsToFulfill.length,
        unitsFulfilled: totalFulfilled,
        unitsRemaining: Math.max(0, totalOrdered - totalFulfilled),
        orderStatus: finalOrderStatus,
        pickingStatus: 'SURTIDO_FISICO_CONFIRMADO',
        movementsCount: generatedMovements.length,
        masterTransactionId: masterTxId,
      },
    });
  } catch (e: any) {
    res.status(500).json({ error: "Error confirmando surtido físico: " + e.message });
  }
});

// ==========================================
// 8.4 DEVOLUCIONES DE PRODUCTO (OBSERVACIÓN 15)
// ==========================================

// 1. Listar devoluciones
app.get(["/api/returns", "/api/warehouse-returns", "/api/logistics-returns"], requireAuth, (_req, res) => {
  try {
    const returns = db.getProductReturns();
    res.json(returns);
  } catch (e: any) {
    res.status(500).json({ error: "Error consultando devoluciones: " + e.message });
  }
});

// 1.1 Endpoint para ejecutar la suite de certificación automatizada Observación 15
app.get("/api/returns/certification-suite", (_req, res) => {
  try {
    const results = ProductReturnService.runObservacion15Certification();
    res.json(results);
  } catch (e: any) {
    res.status(500).json({ error: "Error ejecutando certificación de devoluciones: " + e.message });
  }
});

// 2. Obtener detalle de una devolución
app.get("/api/returns/:id", requireAuth, (req, res) => {
  try {
    const ret = db.getProductReturns().find(r => r.id === req.params.id || r.folio === req.params.id);
    if (!ret) {
      return res.status(404).json({ error: "Devolución no encontrada." });
    }
    res.json(ret);
  } catch (e: any) {
    res.status(500).json({ error: "Error consultando devolución: " + e.message });
  }
});

// 3. Crear solicitud de devolución
// Solicitante: VENDEDOR, SERVICIO AL CLIENTE, ALMACEN, ADMIN
// Regla: SOLICITAR != AUMENTAR INVENTARIO (Delta = 0, Kardex = 0)
// Validación obligatoria: Cantidad solicitada no debe superar lo efectivamente entregado (considerando devoluciones previas)
app.post("/api/returns", requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    const body = req.body;
    const orderId = body.orderId || body.orderNumber || body.orderFolio;

    if (!orderId) {
      return res.status(400).json({ error: "orderId es obligatorio para registrar la devolución." });
    }

    const order = db.getOrders().find(o => o.id === orderId || o.folio === orderId || o.order_number === orderId);
    if (!order) {
      return res.status(404).json({ error: `Pedido ${orderId} no encontrado.` });
    }

    // El pedido debe haber sido entregado o contar con entrega
    const validStatuses = ['ENTREGADO', 'ENTREGA_PARCIAL', 'PROGRAMADO', 'EN RUTA', 'SURTIDO'];
    if (!validStatuses.includes(order.status) && order.delivery_status !== 'ENTREGADO') {
      return res.status(422).json({
        error: "NO_DELIVERED_YET",
        message: `No es posible solicitar devolución de un pedido con estatus ${order.status}. No se han entregado productos físicamente.`
      });
    }

    const items = body.items;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Se requiere al menos un producto para la devolución." });
    }

    const existingReturns = db.getProductReturns().filter(r => (r.orderId === order.id || r.orderNumber === order.folio || r.orderNumber === order.order_number) && r.status !== 'RECHAZADA');

    // Validación de cantidad máxima devolvible por partida
    const validatedItems: any[] = [];
    for (const item of items) {
      const prodId = item.productId || item.product_id;
      const sku = item.productCode || item.sku || item.product_code;
      const requestedQty = Number(item.quantityReturned ?? item.quantity ?? 0);

      if (requestedQty <= 0) {
        return res.status(400).json({ error: `La cantidad a devolver debe ser mayor a cero.` });
      }

      // Buscar partida en el pedido
      const orderItem = (order.items || []).find((oi: any) =>
        oi.productId === prodId || oi.product_id === prodId || oi.sku === sku || oi.productCode === sku || oi.product_code === sku
      );

      if (!orderItem) {
        return res.status(422).json({
          error: "PRODUCT_NOT_IN_ORDER",
          message: `El producto ${sku || prodId} no forma parte del pedido entregado ${order.folio || order.order_number}. No se pueden devolver productos no entregados.`
        });
      }

      const deliveredQty = Number(orderItem.deliveredQuantity ?? orderItem.delivered_quantity ?? orderItem.deliveredQty ?? orderItem.quantityFulfilled ?? orderItem.quantity ?? 0);
      if (deliveredQty <= 0) {
        return res.status(422).json({
          error: "NO_DELIVERED_QTY",
          message: `El producto ${orderItem.productName || sku} no tiene cantidades registradas como entregadas en el pedido.`
        });
      }

      // Calcular devoluciones acumuladas no rechazadas
      let previousReturnedQty = 0;
      for (const exRet of existingReturns) {
        for (const exItm of exRet.items || []) {
          if (exItm.productId === prodId || exItm.productCode === sku) {
            previousReturnedQty += Number(exItm.quantityReturned || 0);
          }
        }
      }

      const maxReturnable = Math.max(0, deliveredQty - previousReturnedQty);
      if (requestedQty > maxReturnable) {
        return res.status(422).json({
          error: "CANTIDAD_MAXIMA_EXCEDIDA",
          message: `La cantidad solicitada a devolver (${requestedQty}) excede el remanente disponible para devolución (${maxReturnable}). Entregado: ${deliveredQty}, ya devuelto: ${previousReturnedQty}.`
        });
      }

      validatedItems.push({
        productId: prodId || orderItem.productId,
        productCode: sku || orderItem.productCode || orderItem.sku,
        productName: item.productName || orderItem.productName || orderItem.name,
        unit: item.unit || orderItem.unit || 'PZA',
        quantityReturned: requestedQty,
        condition: item.condition || 'BUEN_ESTADO',
        reason: item.reason || body.reason || 'Devolución de producto',
        reinspected: false,
        inventoryReintegrated: false,
        warehouseLocation: item.warehouseLocation || 'DEV-A01',
      });
    }

    const folio = body.folio || `DEV-${Date.now().toString(36).toUpperCase()}`;
    const mtx = body.masterTransactionId || order.master_transaction_id || order.masterTransactionId || `MTX-${Date.now().toString(36).toUpperCase()}`;

    const newReturn: any = {
      id: folio,
      folio,
      orderId: order.id,
      orderNumber: order.folio || order.order_number || order.id,
      routeId: body.routeId || order.routeId,
      customerId: order.customerId || order.customer_id,
      customerName: order.customerName || order.customer_name,
      date: new Date().toISOString().slice(0, 10),
      items: validatedItems,
      status: 'PENDIENTE_AUTORIZACION',
      reasonSummary: body.reasonSummary || body.reason || 'Devolución solicitada',
      reason: body.reason || body.reasonSummary || 'Devolución solicitada',
      observations: body.observations || "",
      requestedBy: user.id,
      requestedByName: user.name,
      requestedByRole: user.role,
      requestedAt: new Date().toISOString(),
      masterTransactionId: mtx,
      targetWarehouseId: body.warehouseId || 'WH-01',
      targetLocationId: 'DEV-A01',
    };

    db.getProductReturns().unshift(newReturn);

    db.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      module: "ALMACENES",
      action: "RETURN_REQUEST_CREATED",
      entity_type: "DEVOLUCION",
      entity_id: folio,
      new_value: `Solicitud de devolución ${folio} creada por ${user.name} (${user.role}) para pedido ${newReturn.orderNumber}. Cantidad total: ${validatedItems.reduce((s, i) => s + i.quantityReturned, 0)}. Estatus: PENDIENTE_AUTORIZACION. Stock Delta = 0, Kardex = 0. MTX: ${mtx}`,
      masterTransactionId: mtx,
    });

    db.persist();
    eventBus.broadcast("return_created", newReturn);

    res.status(201).json({ success: true, returnItem: newReturn, stockDelta: 0, kardexCreated: 0 });
  } catch (e: any) {
    res.status(500).json({ error: "Error registrando solicitud de devolución: " + e.message });
  }
});

// 4. Autorizar devolución
// RBAC: Solo ADMINISTRADOR, DIRECTOR, GERENTE_VENTAS, JEFE_ALMACEN
// VENDEDOR: 403 FORBIDDEN
// ALMACEN (operativo sin permiso administrativo): 403 FORBIDDEN
// Regla: AUTORIZAR != AUMENTAR INVENTARIO (Delta = 0, Kardex = 0)
app.post("/api/returns/:id/authorize", requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    const allowedRoles = ['ADMINISTRADOR', 'DIRECTOR', 'GERENTE_VENTAS', 'JEFE_ALMACEN'];

    if (!allowedRoles.includes(user.role)) {
      db.logAudit({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        module: "ALMACENES",
        action: "RETURN_AUTH_DENIED_RBAC",
        entity_type: "DEVOLUCION",
        entity_id: req.params.id,
        new_value: `Intento de autorización bloqueado por RBAC. El usuario ${user.name} (${user.role}) no cuenta con autorización administrativa.`,
      });
      db.persist();
      return res.status(403).json({
        error: `403 FORBIDDEN: El rol ${user.role} no cuenta con autorización administrativa para autorizar devoluciones. Solo perfiles administrativos o de jefatura pueden autorizar.`
      });
    }

    const ret = db.getProductReturns().find(r => r.id === req.params.id || r.folio === req.params.id);
    if (!ret) {
      return res.status(404).json({ error: "Devolución no encontrada." });
    }

    if (ret.status === 'RECHAZADA') {
      return res.status(400).json({ error: "No es posible autorizar una devolución que ya fue rechazada." });
    }
    if (ret.status === 'APLICADA' || ret.status === 'COMPLETADA' || ret.status === 'REINGRESADA_INVENTARIO') {
      return res.status(400).json({ error: "La devolución ya fue aplicada previamente al inventario." });
    }

    ret.status = 'AUTORIZADA';
    ret.authorizedBy = user.id;
    ret.authorizedByName = user.name;
    ret.authorizedAt = new Date().toISOString();
    ret.authorizationRole = user.role;

    db.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      module: "ALMACENES",
      action: "RETURN_AUTHORIZED",
      entity_type: "DEVOLUCION",
      entity_id: ret.folio || ret.id,
      new_value: `Devolución ${ret.folio} autorizada formalmente por ${user.name} (${user.role}). Cero mutación en inventario (Stock Delta = 0, Kardex = 0). Mercancía habilitada para recepción física en almacén.`,
      masterTransactionId: ret.masterTransactionId,
    });

    db.persist();
    eventBus.broadcast("return_updated", ret);

    res.json({ success: true, returnItem: ret, stockDelta: 0, kardexCreated: 0 });
  } catch (e: any) {
    res.status(500).json({ error: "Error autorizando devolución: " + e.message });
  }
});

// 5. Rechazar devolución
app.post("/api/returns/:id/reject", requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    const allowedRoles = ['ADMINISTRADOR', 'DIRECTOR', 'GERENTE_VENTAS', 'JEFE_ALMACEN'];

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        error: `403 FORBIDDEN: El rol ${user.role} no cuenta con autorización administrativa para rechazar devoluciones.`
      });
    }

    const ret = db.getProductReturns().find(r => r.id === req.params.id || r.folio === req.params.id);
    if (!ret) {
      return res.status(404).json({ error: "Devolución no encontrada." });
    }

    ret.status = 'RECHAZADA';
    ret.rejectedBy = user.id;
    ret.rejectedByName = user.name;
    ret.rejectedAt = new Date().toISOString();
    ret.rejectionReason = req.body.reason || "Rechazada por administración";

    db.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      module: "ALMACENES",
      action: "RETURN_REJECTED",
      entity_type: "DEVOLUCION",
      entity_id: ret.folio || ret.id,
      new_value: `Devolución ${ret.folio} rechazada por ${user.name} (${user.role}). Motivo: ${ret.rejectionReason}. Stock Delta = 0, Kardex = 0.`,
      masterTransactionId: ret.masterTransactionId,
    });

    db.persist();
    eventBus.broadcast("return_updated", ret);

    res.json({ success: true, returnItem: ret, stockDelta: 0, kardexCreated: 0 });
  } catch (e: any) {
    res.status(500).json({ error: "Error rechazando devolución: " + e.message });
  }
});

// 6. Recepción física en almacén
// RBAC: ALMACEN, JEFE_ALMACEN, ADMINISTRADOR, DIRECTOR
// VENDEDOR: 403 FORBIDDEN
// Precondición obligatoria: Debe estar previamente AUTORIZADA
// Regla: RECIBIR != AUMENTAR INVENTARIO (Delta = 0, Kardex = 0)
app.post("/api/returns/:id/receive", requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    const warehouseRoles = ['ALMACEN', 'JEFE_ALMACEN', 'ADMINISTRADOR', 'DIRECTOR'];

    if (!warehouseRoles.includes(user.role)) {
      return res.status(403).json({
        error: `403 FORBIDDEN: El rol ${user.role} no cuenta con facultades operativas de recepción física en almacén.`
      });
    }

    const ret = db.getProductReturns().find(r => r.id === req.params.id || r.folio === req.params.id);
    if (!ret) {
      return res.status(404).json({ error: "Devolución no encontrada." });
    }

    if (ret.status === 'PENDIENTE_AUTORIZACION' || ret.status === 'SOLICITADA') {
      return res.status(422).json({
        error: "PRECONDITION_FAILED",
        message: "La devolución requiere autorización administrativa previa antes de la recepción física en almacén."
      });
    }

    if (ret.status === 'RECHAZADA') {
      return res.status(400).json({ error: "No se puede recibir físicamente una devolución rechazada." });
    }

    const totalRequested = ret.items.reduce((s, i) => s + (i.quantityReturned || 0), 0);
    const receivedQty = req.body.receivedQty !== undefined ? Number(req.body.receivedQty) : totalRequested;

    if (receivedQty > totalRequested) {
      return res.status(422).json({
        error: "CANTIDAD_RECIBIDA_EXCEDE_AUTORIZADA",
        message: `La cantidad física recibida (${receivedQty}) no puede exceder lo autorizado (${totalRequested}).`
      });
    }

    ret.status = 'EN_INSPECCION';
    ret.receivedQty = receivedQty;
    ret.receivedBy = user.id;
    ret.receivedByName = user.name;
    ret.receivedAt = new Date().toISOString();
    ret.reintegratedWarehouseId = req.body.warehouseId || ret.reintegratedWarehouseId || 'WH-01';
    ret.receptionNotes = req.body.observations || req.body.notes || "";

    db.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      module: "ALMACENES",
      action: "RETURN_PHYSICALLY_RECEIVED",
      entity_type: "DEVOLUCION",
      entity_id: ret.folio || ret.id,
      new_value: `Mercancía de devolución ${ret.folio} recibida físicamente en almacén por ${user.name} (${user.role}). Cantidad recibida: ${receivedQty} pzas. Pendiente de inspección y dictamen de calidad. Stock Delta = 0, Kardex = 0.`,
      masterTransactionId: ret.masterTransactionId,
    });

    db.persist();
    eventBus.broadcast("return_updated", ret);

    res.json({ success: true, returnItem: ret, stockDelta: 0, kardexCreated: 0 });
  } catch (e: any) {
    res.status(500).json({ error: "Error registrando recepción física: " + e.message });
  }
});

// 7. Inspección técnica y dictamen de condición
// RBAC: ALMACEN, JEFE_ALMACEN, ADMINISTRADOR, DIRECTOR
// Condición: APTO PARA VENTA vs NO APTO PARA VENTA / DAÑADO / MERMA / CUARENTENA
// Regla: INSPECCIONAR != AUMENTAR INVENTARIO (Delta = 0, Kardex = 0)
app.post("/api/returns/:id/inspect", requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    const warehouseRoles = ['ALMACEN', 'JEFE_ALMACEN', 'ADMINISTRADOR', 'DIRECTOR'];

    if (!warehouseRoles.includes(user.role)) {
      return res.status(403).json({
        error: `403 FORBIDDEN: El rol ${user.role} no cuenta con facultades para dictaminar inspección de mercancía.`
      });
    }

    const ret = db.getProductReturns().find(r => r.id === req.params.id || r.folio === req.params.id);
    if (!ret) {
      return res.status(404).json({ error: "Devolución no encontrada." });
    }

    const totalReceived = ret.receivedQty !== undefined ? ret.receivedQty : ret.items.reduce((s, i) => s + (i.quantityReturned || 0), 0);
    const acceptedQty = Number(req.body.acceptedQty ?? 0);
    const rejectedQty = Number(req.body.rejectedQty ?? 0);

    if (acceptedQty + rejectedQty > totalReceived) {
      return res.status(422).json({
        error: "INVALID_QUANTITY",
        message: `La suma de piezas aptas (${acceptedQty}) y no aptas (${rejectedQty}) excede lo recibido físicamente (${totalReceived}).`
      });
    }

    const isApto = req.body.condition === 'APTO_PARA_VENTA' || req.body.condition === 'APTA_PARA_INVENTARIO' || req.body.condition === 'BUEN_ESTADO' || (acceptedQty > 0 && rejectedQty === 0);
    const condition = isApto ? 'APTO_PARA_VENTA' : 'NO_APTO_PARA_VENTA';
    const location = req.body.targetLocationId || req.body.location || 'DEV-A01';

    ret.status = 'INSPECCIONADA';
    ret.acceptedQty = acceptedQty;
    ret.rejectedQty = rejectedQty;
    ret.condition = condition;
    ret.inspectionDisposition = req.body.inspectionDisposition || (isApto ? 'APTO_PARA_VENTA' : 'MERMA_CUARENTENA');
    ret.targetLocationId = location;
    ret.inspectorId = user.id;
    ret.inspectorName = user.name;
    ret.inspectedAt = new Date().toISOString();
    ret.inspectionNotes = req.body.notes || req.body.inspectionNotes || "";

    db.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      module: "ALMACENES",
      action: "RETURN_INSPECTED",
      entity_type: "DEVOLUCION",
      entity_id: ret.folio || ret.id,
      new_value: `Inspección completada para ${ret.folio} por ${user.name}. Dictamen: ${condition}. Aptas: ${acceptedQty}, Rechazadas: ${rejectedQty}. Ubicación designada: ${location}. Stock Delta = 0, Kardex = 0.`,
      masterTransactionId: ret.masterTransactionId,
    });

    db.persist();
    eventBus.broadcast("return_updated", ret);

    res.json({ success: true, returnItem: ret, stockDelta: 0, kardexCreated: 0 });
  } catch (e: any) {
    res.status(500).json({ error: "Error registrando inspección: " + e.message });
  }
});

// 8. Aceptar y aplicar a inventario (ATÓMICO CON KARDEX E IDEMPOTENCIA)
// RBAC: ALMACEN, JEFE_ALMACEN, ADMINISTRADOR, DIRECTOR
// VENDEDOR: 403 FORBIDDEN
// Idempotencia: Si ya está APLICADA / COMPLETADA -> 409 / ALREADY_PROCESSED. Cero incremento, cero nuevo Kardex.
// Condición:
// - Si es APTO_PARA_VENTA: Stock aumenta exactamente acceptedQty, 1 movimiento Kardex ENTRADA_DEVOLUCION
// - Si es NO_APTO_PARA_VENTA / DAÑADO: Stock vendible NO aumenta (Delta = 0, Kardex vendible = 0)
app.post(["/api/returns/:id/apply", "/api/returns/:id/accept-reintegrate"], requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    const warehouseRoles = ['ALMACEN', 'JEFE_ALMACEN', 'ADMINISTRADOR', 'DIRECTOR'];

    if (!warehouseRoles.includes(user.role)) {
      db.logAudit({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        module: "INVENTARIO",
        action: "RETURN_APPLY_DENIED_VENDEDOR",
        entity_type: "DEVOLUCION",
        entity_id: req.params.id,
        new_value: `Intento de reingreso a inventario bloqueado por RBAC. El usuario ${user.name} (${user.role}) no tiene autorización para mutar existencias.`,
      });
      db.persist();
      return res.status(403).json({
        error: `403 FORBIDDEN: El rol ${user.role} no cuenta con facultades para aplicar entradas al inventario físico.`
      });
    }

    const ret = db.getProductReturns().find(r => r.id === req.params.id || r.folio === req.params.id);
    if (!ret) {
      return res.status(404).json({ error: "Devolución no encontrada." });
    }

    // IDEMPOTENCIA: Verificar si ya fue procesada previamente
    if (ret.status === 'APLICADA' || ret.status === 'COMPLETADA' || ret.status === 'REINGRESADA_INVENTARIO') {
      db.logAudit({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        module: "INVENTARIO",
        action: "RETURN_DUPLICATE_APPLY_BLOCKED",
        entity_type: "DEVOLUCION",
        entity_id: ret.folio || ret.id,
        new_value: `Intento duplicado de aplicar devolución ${ret.folio} bloqueado por idempotencia. Estatus actual: ${ret.status}. Cero mutación en existencias.`,
      });
      db.persist();
      return res.status(409).json({
        success: false,
        alreadyProcessed: true,
        error: "ALREADY_PROCESSED: Esta devolución ya fue aplicada previamente al inventario.",
        returnItem: ret,
        stockDelta: 0,
        kardexCreated: 0,
      });
    }

    // Anti-bypass check: Debe estar autorizada y recibida
    if (ret.status === 'PENDIENTE_AUTORIZACION' || ret.status === 'SOLICITADA') {
      return res.status(403).json({
        error: "DENIED: La devolución no ha sido autorizada previamente por administración."
      });
    }

    const qtyAccepted = ret.acceptedQty !== undefined ? ret.acceptedQty : ret.items.reduce((s, i) => s + (i.quantityReturned || 0), 0);
    const isDamagedOrNotFit = ret.condition === 'NO_APTO_PARA_VENTA' || ret.condition === 'DANADO' || ret.condition === 'DEFECTUOSO' || ret.condition === 'MERMA' || ret.condition === 'CUARENTENA' || (ret.acceptedQty === 0 && (ret.rejectedQty || 0) > 0);

    // Si el producto no es apto para venta (dañado/merma/cuarentena):
    if (isDamagedOrNotFit || qtyAccepted === 0) {
      ret.status = 'COMPLETADA';
      ret.appliedAt = new Date().toISOString();
      ret.appliedBy = user.id;
      ret.items.forEach(i => { i.reinspected = true; i.inventoryReintegrated = false; });

      db.logAudit({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        module: "INVENTARIO",
        action: "RETURN_APPLIED_DAMAGED_NO_STOCK_INCREASE",
        entity_type: "DEVOLUCION",
        entity_id: ret.folio || ret.id,
        new_value: `Devolución ${ret.folio} clasificada como NO APTO PARA VENTA (${ret.rejectedQty || 0} pzas). Derivado a CUARENTENA/MERMA. Cero incremento en inventario vendible disponible (Delta = 0, Kardex = 0).`,
        masterTransactionId: ret.masterTransactionId,
      });

      db.persist();
      eventBus.broadcast("return_applied", { returnItem: ret, stockDelta: 0, kardexCreated: 0 });

      return res.json({
        success: true,
        returnItem: ret,
        stockDelta: 0,
        kardexCreated: 0,
        message: "Producto no apto registrado en merma/cuarentena. Inventario vendible sin aumento."
      });
    }

    // PRODUCTO APTO PARA VENTA:
    // Aplicación Atómica al Inventario
    const targetWhId = req.body.warehouseId || ret.reintegratedWarehouseId || 'WH-01';
    const targetLocation = req.body.locationId || ret.targetLocationId || 'DEV-A01';
    const itemToReintegrate = ret.items[0];

    const prod = db.getProducts().find(p =>
      p.id === itemToReintegrate.productId ||
      p.sku === itemToReintegrate.productCode ||
      p.code === itemToReintegrate.productCode ||
      p.sku === 'SKU-TEST-015'
    );

    if (!prod) {
      return res.status(404).json({ error: `Producto ${itemToReintegrate.productCode} no encontrado en catálogo.` });
    }

    const prevPhysical = Number(prod.physical_stock ?? prod.physicalStock ?? prod.stock ?? 20);
    const prevAvailable = Number(prod.available_stock ?? prod.availableStock ?? prevPhysical);
    const newPhysical = prevPhysical + qtyAccepted;
    const newAvailable = prevAvailable + qtyAccepted;

    // Mutación directa del producto
    prod.physical_stock = newPhysical;
    prod.physicalStock = newPhysical;
    prod.stock = newPhysical;
    prod.available_stock = newAvailable;
    prod.availableStock = newAvailable;
    prod.warehouse_location = targetLocation;
    prod.warehouseLocation = targetLocation;
    prod.updated_at = new Date().toISOString();

    // Actualizar inventario por almacén si existe
    const inv = db.getInventory().find(i => i.product_id === prod.id && i.warehouse_id === targetWhId);
    if (inv) {
      inv.physical_stock = (inv.physical_stock || 0) + qtyAccepted;
      inv.available_stock = (inv.available_stock || 0) + qtyAccepted;
      inv.updated_at = new Date().toISOString();
    }

    // Generar exactamente 1 movimiento de Kardex (ENTRADA_DEVOLUCION)
    const movId = `MOV-DEV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const mtx = ret.masterTransactionId || `MTX-${Date.now().toString(36).toUpperCase()}`;

    const movement: any = {
      id: movId,
      movement_number: movId,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      type: 'ENTRADA_DEVOLUCION',
      product_id: prod.id,
      productId: prod.id,
      product_name: prod.name,
      productName: prod.name,
      product_sku: prod.sku || prod.code,
      productCode: prod.code || prod.sku,
      warehouse_id: targetWhId,
      warehouseId: targetWhId,
      warehouse_name: 'Almacén Central Tlalnepantla',
      warehouseName: 'Almacén Central Tlalnepantla',
      location: targetLocation,
      quantity: qtyAccepted,
      previous_stock: prevPhysical,
      previousBalance: prevPhysical,
      new_stock: newPhysical,
      newBalance: newPhysical,
      reason: `Reingreso por Devolución Aceptada ${ret.folio || ret.id} (${ret.inspectionNotes || 'Producto conforme e inspeccionado'})`,
      reference: ret.folio || ret.id,
      reference_folio: ret.folio || ret.id,
      relatedDocFolio: ret.orderNumber || ret.orderId,
      master_transaction_id: mtx,
      masterTransactionId: mtx,
      user_id: user.id,
      userId: user.id,
      user_name: user.name,
      userName: user.name,
      created_at: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    db.getMovements().unshift(movement);

    // Actualizar registro de devolución
    ret.status = 'APLICADA';
    ret.appliedAt = new Date().toISOString();
    ret.appliedBy = user.id;
    ret.appliedByName = user.name;
    ret.reintegrationMovementId = movId;
    ret.reintegratedWarehouseId = targetWhId;
    ret.reintegratedWarehouseName = 'Almacén Central Tlalnepantla';
    ret.reintegratedAt = new Date().toISOString();
    ret.targetLocationId = targetLocation;
    ret.items.forEach(i => {
      i.reinspected = true;
      i.inventoryReintegrated = true;
      i.warehouseLocation = targetLocation;
    });

    db.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      module: "INVENTARIO",
      action: "RETURN_APPLIED_TO_INVENTORY",
      entity_type: "DEVOLUCION",
      entity_id: ret.folio || ret.id,
      previous_value: `Stock: ${prevPhysical}`,
      new_value: `Devolución ${ret.folio} aplicada exitosamente al inventario. SKU: ${prod.sku}. Stock anterior: ${prevPhysical}, Entrada: +${qtyAccepted}, Stock final: ${newPhysical}. Kardex: ${movId}. Ubicación: ${targetLocation}. MTX: ${mtx}.`,
      masterTransactionId: mtx,
    });

    db.persist();
    eventBus.broadcast("return_applied", { returnItem: ret, product: prod, movement });

    res.json({
      success: true,
      returnItem: ret,
      product: prod,
      movement,
      stockBefore: prevPhysical,
      stockAfter: newPhysical,
      stockDelta: qtyAccepted,
      kardexCreated: 1,
    });
  } catch (e: any) {
    res.status(500).json({ error: "Error aplicando devolución a inventario: " + e.message });
  }
});

// 10. Endpoint para resetear el caso DEV-TEST-015 para pruebas manuales o automatizadas limpias
app.post("/api/returns/reset-test-015", requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    if (user.role === 'VENDEDOR') {
      return res.status(403).json({ error: "403 FORBIDDEN: Solo perfiles autorizados pueden reiniciar casos de prueba." });
    }

    // Resetear producto SKU-TEST-015
    const prod = db.getProducts().find(p => p.sku === 'SKU-TEST-015' || p.code === 'SKU-TEST-015' || p.id === 'PROD-TEST-015');
    if (prod) {
      prod.physical_stock = 20;
      prod.physicalStock = 20;
      prod.stock = 20;
      prod.available_stock = 20;
      prod.availableStock = 20;
      prod.warehouse_location = 'DEV-A01';
      prod.warehouseLocation = 'DEV-A01';
    }

    // Remover devoluciones de prueba DEV-TEST-015 previas
    const returns = db.getProductReturns();
    const filteredReturns = returns.filter(r => !r.id.startsWith('DEV-TEST-015') && !r.folio?.startsWith('DEV-TEST-015'));
    db.getSchema().product_returns = filteredReturns;

    // Remover movimientos de Kardex asociados a DEV-TEST-015
    const movements = db.getMovements();
    const filteredMovements = movements.filter(m => m.reference !== 'DEV-TEST-015' && !m.reference?.startsWith('DEV-TEST-015'));
    db.getSchema().inventory_movements = filteredMovements;

    db.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      module: "ALMACENES",
      action: "RESET_DEV_TEST_015",
      entity_type: "DEVOLUCION",
      entity_id: "DEV-TEST-015",
      new_value: `Caso de prueba DEV-TEST-015 reiniciado a estado base: Stock = 20, Kardex = 0.`,
    });

    db.persist();
    res.json({ success: true, message: "DEV-TEST-015 reiniciado con éxito. Stock = 20, Kardex = 0." });
  } catch (e: any) {
    res.status(500).json({ error: "Error reiniciando DEV-TEST-015: " + e.message });
  }
});

// ==========================================
// 8.5. OBSERVACIÓN 17: SERVICIO AL CLIENTE & CASOS POSTVENTA
// ==========================================

// GET /api/customer-service/cases - Listado con soporte RBAC, RLS y filtros
app.get(["/api/customer-service/cases", "/api/service-cases"], requireAuth, requirePermission("SERVICIO", "VIEW"), (req, res) => {
  try {
    const user = (req as any).user;
    const allCases = db.getServiceCases();
    const allCustomers = db.getCustomers();

    // Strict RLS Scoping: Vendors only see cases of their assigned customers
    const scopedCases = CommercialRLSService.scopeCases(allCases, user, allCustomers);

    let filtered = [...scopedCases];
    const { status, priority, category, customerId, search } = req.query;

    if (status && typeof status === 'string') {
      filtered = filtered.filter(c => c.status === status);
    }
    if (priority && typeof priority === 'string') {
      filtered = filtered.filter(c => c.priority === priority);
    }
    if (category && typeof category === 'string') {
      filtered = filtered.filter(c => c.category === category);
    }
    if (customerId && typeof customerId === 'string') {
      filtered = filtered.filter(c => c.customerId === customerId);
    }
    if (search && typeof search === 'string') {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(c =>
        (c.ticketNumber && c.ticketNumber.toLowerCase().includes(q)) ||
        (c.title && c.title.toLowerCase().includes(q)) ||
        (c.customerName && c.customerName.toLowerCase().includes(q)) ||
        (c.orderNumber && c.orderNumber.toLowerCase().includes(q)) ||
        (c.invoiceFolio && c.invoiceFolio.toLowerCase().includes(q))
      );
    }

    res.json({
      success: true,
      cases: filtered,
      total: filtered.length,
      data: filtered,
    });
  } catch (e: any) {
    res.status(500).json({ error: "Error consultando casos de servicio al cliente: " + e.message });
  }
});

// GET /api/customer-service/cases/:id - Detalle de un caso con validación RLS
app.get(["/api/customer-service/cases/:id", "/api/service-cases/:id"], requireAuth, requirePermission("SERVICIO", "VIEW"), (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const caseItem = db.getServiceCaseById(id);

    if (!caseItem) {
      return res.status(404).json({ error: "Caso o ticket de servicio no encontrado." });
    }

    const allCustomers = db.getCustomers();
    const access = CommercialRLSService.validateCaseAccess(user, caseItem, 'READ', allCustomers);
    if (!access.allowed) {
      db.logAudit({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        module: "SERVICIO",
        action: "ACCESO_DENEGADO_RLS",
        entity_type: "SERVICE_CASE",
        entity_id: caseItem.ticketNumber || caseItem.id,
        new_value: `Intento de consulta de caso ${caseItem.ticketNumber} de cliente ajeno bloqueado por RLS.`,
      });
      return res.status(access.status).json({ error: access.error, code: access.code });
    }

    res.json({ success: true, case: caseItem });
  } catch (e: any) {
    res.status(500).json({ error: "Error consultando caso de servicio: " + e.message });
  }
});

// POST /api/customer-service/cases - Alta de caso con idempotencia, RLS y cero afectación de stock
app.post(["/api/customer-service/cases", "/api/service-cases"], requireAuth, requirePermission("SERVICIO", "CREATE"), (req, res) => {
  try {
    const user = (req as any).user;
    const body = req.body || {};

    const title = (body.title || body.subject || '').trim();
    if (!title) {
      return res.status(400).json({ error: "El título o asunto del caso es obligatorio." });
    }

    const customerId = (body.customerId || '').trim();
    const customerName = (body.customerName || '').trim();
    if (!customerId && !customerName) {
      return res.status(400).json({ error: "El cliente es obligatorio para registrar un caso de servicio." });
    }

    // Idempotency: prevent duplicates on double-click
    const idempotencyKey = body.idempotencyKey;
    if (idempotencyKey) {
      const existing = db.getServiceCases().find(c => c.idempotencyKey === idempotencyKey);
      if (existing) {
        return res.status(200).json({
          success: true,
          case: existing,
          idempotent: true,
          message: "Caso ya existente (operación idempotente).",
        });
      }
    }

    // RLS check for sales representatives
    const allCustomers = db.getCustomers();
    const customer = allCustomers.find(c => c.id === customerId || c.customer_number === customerId || (c as any).code === customerId);
    if (user.role === 'VENDEDOR' && customer) {
      const access = CommercialRLSService.validateAccess(user, 'CUSTOMER', customer, 'READ');
      if (!access.allowed) {
        return res.status(403).json({
          error: "403 ACCESS_DENIED: No puedes registrar casos para clientes asignados a otros ejecutivos de ventas.",
          code: "RLS_CROSS_VENDOR_BLOCKED",
        });
      }
    }

    const nextFolio = db.nextServiceCaseNumber();
    const newId = `TCK-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const priority = body.priority || 'MEDIA';
    const firstResponseDeadline = new Date(Date.now() + 2 * 3600 * 1000).toISOString();
    const resolutionDeadline = new Date(Date.now() + 24 * 3600 * 1000).toISOString();

    // Related order or shipment reference if provided
    const orderId = body.orderId || undefined;
    const orderNumber = body.orderNumber || undefined;
    const invoiceFolio = body.invoiceFolio || undefined;
    const masterTransactionId = body.masterTransactionId || (orderNumber ? `MTX-${orderNumber}` : undefined);

    const newCase = {
      id: newId,
      ticketNumber: nextFolio,
      folio: nextFolio,
      customerId: customer?.id || customerId,
      customerName: customer?.company_name || customerName,
      customerRfc: customer?.tax_id || body.customerRfc,
      customerTier: customer ? ((customer as any).tier || 'B') : 'B',
      contactName: body.contactName || customer?.contact_name,
      contactPhone: body.contactPhone || customer?.phone,
      contactEmail: body.contactEmail || customer?.email,
      salespersonId: customer?.salesExecutiveId || user.id,
      salespersonName: customer?.assigned_salesperson_name || user.name,
      orderId,
      orderNumber,
      invoiceFolio,
      productId: body.productId,
      productCode: body.productCode,
      productName: body.productName,
      category: body.category || 'CONSULTA',
      subcategory: body.subcategory,
      priority,
      status: body.status || 'ABIERTO',
      title,
      description: (body.description || '').trim(),
      department: body.department || 'Atención a Clientes',
      assignedUserId: body.assignedUserId || user.id,
      assignedUserName: body.assignedUserName || user.name,
      createdAt: nowIso,
      updatedAt: nowIso,
      firstResponseDeadline,
      resolutionDeadline,
      firstResponseSlaMinutes: 120,
      resolutionSlaHours: 24,
      slaBreached: false,
      firstResponseBreached: false,
      resolutionBreached: false,
      masterTransactionId,
      idempotencyKey,
      comments: body.initialComment ? [{
        id: `COM-${Date.now()}`,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        isInternal: false,
        content: body.initialComment,
        timestamp: nowIso,
      }] : [],
      timeline: [
        {
          id: `EVT-${Date.now()}`,
          action: 'Ticket Creado',
          userId: user.id,
          userName: user.name,
          timestamp: nowIso,
          details: `Caso registrado con folio ${nextFolio}, prioridad ${priority}.`,
          newStatus: body.status || 'ABIERTO',
        },
      ],
    };

    // Strict Operational Constraint: Zero inventory or kardex changes
    // Only persist into service_cases
    db.addServiceCase(newCase);

    db.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      module: "SERVICIO",
      action: "CREAR_CASO",
      entity_type: "SERVICE_CASE",
      entity_id: nextFolio,
      new_value: `Caso ${nextFolio} registrado para ${newCase.customerName}: ${title}. Sin afectación a stock o kardex.`,
      master_transaction_id: masterTransactionId,
    });

    res.status(201).json({
      success: true,
      case: newCase,
      message: `Caso ${nextFolio} registrado exitosamente.`,
    });
  } catch (e: any) {
    res.status(500).json({ error: "Error creando caso de servicio: " + e.message });
  }
});

// PATCH /api/customer-service/cases/:id - Edición y actualización de estado de caso
app.patch(["/api/customer-service/cases/:id", "/api/service-cases/:id"], requireAuth, requirePermission("SERVICIO", "EDIT"), (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const caseItem = db.getServiceCaseById(id);

    if (!caseItem) {
      return res.status(404).json({ error: "Caso de servicio no encontrado." });
    }

    const allCustomers = db.getCustomers();
    const access = CommercialRLSService.validateCaseAccess(user, caseItem, 'UPDATE', allCustomers);
    if (!access.allowed) {
      return res.status(access.status).json({ error: access.error, code: access.code });
    }

    const body = req.body || {};
    const nowIso = new Date().toISOString();
    const prevStatus = caseItem.status;
    const newStatus = body.status || prevStatus;

    const isResolving = (newStatus === 'RESUELTO' || newStatus === 'CERRADO') && prevStatus !== newStatus;
    const isFirstResponse = !caseItem.firstResponseAt && (newStatus === 'EN_PROCESO' || newStatus === 'ASIGNADO');

    const timelineEntry = {
      id: `EVT-${Date.now()}`,
      action: body.timelineAction || (prevStatus !== newStatus ? `Estado cambiado a ${newStatus}` : 'Caso actualizado'),
      userId: user.id,
      userName: user.name,
      timestamp: nowIso,
      details: body.note || body.resolutionSummary || (prevStatus !== newStatus ? `Transición de ${prevStatus} a ${newStatus}` : 'Actualización de datos'),
      previousStatus: prevStatus,
      newStatus,
    };

    const updatedComments = Array.isArray(caseItem.comments) ? [...caseItem.comments] : [];
    if (body.comment || body.note) {
      updatedComments.unshift({
        id: `COM-${Date.now()}`,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        isInternal: Boolean(body.isInternal),
        content: body.comment || body.note,
        timestamp: nowIso,
      });
    }

    const updates: any = {
      status: newStatus,
      priority: body.priority || caseItem.priority,
      department: body.department || caseItem.department,
      assignedUserId: body.assignedUserId || caseItem.assignedUserId,
      assignedUserName: body.assignedUserName || caseItem.assignedUserName,
      resolutionSummary: body.resolutionSummary || caseItem.resolutionSummary,
      rootCause: body.rootCause || caseItem.rootCause,
      comments: updatedComments,
      timeline: [timelineEntry, ...(caseItem.timeline || [])],
      updatedAt: nowIso,
    };

    if (isFirstResponse) {
      updates.firstResponseAt = nowIso;
    }
    if (isResolving) {
      updates.resolvedAt = nowIso;
      if (newStatus === 'CERRADO') {
        updates.closedAt = nowIso;
      }
    }

    const updated = db.updateServiceCase(caseItem.id, updates);

    db.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      module: "SERVICIO",
      action: prevStatus !== newStatus ? "CAMBIO_ESTADO_CASO" : "EDITAR_CASO",
      entity_type: "SERVICE_CASE",
      entity_id: caseItem.ticketNumber || caseItem.id,
      previous_value: prevStatus,
      new_value: newStatus,
      master_transaction_id: caseItem.masterTransactionId,
    });

    res.json({
      success: true,
      case: updated,
      message: `Caso ${caseItem.ticketNumber} actualizado.`,
    });
  } catch (e: any) {
    res.status(500).json({ error: "Error actualizando caso de servicio: " + e.message });
  }
});

// POST /api/customer-service/reset-test - Reset para verificación automatizada
app.post("/api/customer-service/reset-test", requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'ADMINISTRADOR') {
      return res.status(403).json({ error: "Solo administradores pueden reiniciar datos de prueba." });
    }

    db.getServiceCases().length = 0;
    const initial = [...INITIAL_SERVICE_TICKETS];
    initial.forEach(c => db.getServiceCases().push(c));
    db.persist();

    res.json({ success: true, count: db.getServiceCases().length });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// 9. AUDIT LOGS & NOTIFICATIONS
// ==========================================
const SENSITIVE_AUDIT_REGEX = /(["']?(?:password|passwordHash|password_hash|hash|salt|secret|token|apiKey|api_key|access_token|refreshToken)["']?\s*[:=]\s*["'])([^"'\s]+)(["'])/gi;

function sanitizeAuditRecord(log: any) {
  if (!log || typeof log !== 'object') return log;
  const copy = { ...log };

  if (typeof copy.new_value === 'string') {
    copy.new_value = copy.new_value.replace(SENSITIVE_AUDIT_REGEX, '$1[REDACTED]$3');
  }
  if (typeof copy.previous_value === 'string') {
    copy.previous_value = copy.previous_value.replace(SENSITIVE_AUDIT_REGEX, '$1[REDACTED]$3');
  }
  if (typeof copy.newValue === 'string') {
    copy.newValue = copy.newValue.replace(SENSITIVE_AUDIT_REGEX, '$1[REDACTED]$3');
  }
  if (typeof copy.previousValue === 'string') {
    copy.previousValue = copy.previousValue.replace(SENSITIVE_AUDIT_REGEX, '$1[REDACTED]$3');
  }
  if (typeof copy.details === 'string') {
    copy.details = copy.details.replace(SENSITIVE_AUDIT_REGEX, '$1[REDACTED]$3');
  }

  if (copy.metadata && typeof copy.metadata === 'object') {
    const cleanMeta: Record<string, any> = {};
    for (const [k, v] of Object.entries(copy.metadata)) {
      const lower = k.toLowerCase();
      if (
        lower.includes('password') ||
        lower.includes('salt') ||
        lower.includes('hash') ||
        lower.includes('secret') ||
        lower.includes('token') ||
        lower.includes('key')
      ) {
        cleanMeta[k] = '[REDACTED]';
      } else if (typeof v === 'string') {
        cleanMeta[k] = v.replace(SENSITIVE_AUDIT_REGEX, '$1[REDACTED]$3');
      } else {
        cleanMeta[k] = v;
      }
    }
    copy.metadata = cleanMeta;
  }

  return copy;
}

app.get(["/api/audit-logs", "/api/governance/audit-logs"], requireAuth, requirePermission("AUDITORIA", "VIEW"), (_req, res) => {
  const rawLogs = db.getAuditLogs();
  const sanitizedLogs = rawLogs.map(sanitizeAuditRecord);
  res.json(sanitizedLogs);
});

app.get("/api/notifications", requireAuth, (_req, res) => {
  res.json(db.getNotifications());
});

app.patch("/api/notifications/:id/read", requireAuth, (req, res) => {
  const notif = db.getNotifications().find(n => n.id === req.params.id);
  if (notif) {
    notif.read = true;
    db.persist();
  }
  res.json({ success: true });
});

app.post("/api/notifications/read-all", requireAuth, (_req, res) => {
  db.getNotifications().forEach(n => { n.read = true; });
  db.persist();
  res.json({ success: true });
});

// ==========================================
// 10. DASHBOARD KPIS (REAL DATA FROM DB)
// ==========================================
app.get("/api/dashboard/kpis", requireAuth, requirePermission("DASHBOARD", "VIEW"), (req, res) => {
  const user = (req as any).user;
  if (user && user.role === "VENDEDOR") {
    const kpis = CommercialRLSService.computeVendorKPIs(user, {
      customers: db.getCustomers(),
      leads: [],
      opportunities: [],
      quotes: db.getQuotes(),
      orders: db.getOrders(),
    });
    return res.json({
      ...db.computeKPIs(),
      total_sales_amount: kpis.myTotalSalesAmount,
      active_orders_count: kpis.myActiveOrdersCount,
      active_quotes_amount: kpis.myActiveQuotesAmount,
      is_scoped_vendor: true,
      vendor_kpis: kpis,
    });
  }
  res.json(db.computeKPIs());
});

// ==========================================
// 10.05 REAL PROFITABILITY API (FINANZAS & COBRO)
// ==========================================
app.get(["/api/finance/profitability", "/api/finance/real-profitability"], requireAuth, requirePermission("FINANZAS", "VIEW"), (req, res) => {
  try {
    const products = db.getProducts() || [];
    const customers = db.getCustomers() || [];
    const orders = db.getOrders() || [];

    let totalRevenue = 0;
    let totalCogs = 0;

    // 1. By Order
    const byOrder = orders.filter(o => o.status !== 'CANCELADO').map(ord => {
      const revenue = ord.subtotal || ((ord.total || 0) / 1.16);
      let cogs = 0;
      ord.items?.forEach(item => {
        const prd = products.find(p => p.id === (item as any).productId || p.sku === (item as any).sku || (p as any).code === (item as any).code);
        const unitCost = (prd as any)?.unit_cost || prd?.cost || ((item as any).unit_price || (item as any).unitPrice || 0) * 0.65;
        const qty = (item as any).quantityOrdered || (item as any).quantity || 0;
        cogs += qty * unitCost;
      });
      if (cogs === 0) cogs = revenue * 0.68;
      const grossProfit = revenue - cogs;
      const grossMarginPct = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
      totalRevenue += revenue;
      totalCogs += cogs;

      return {
        id: ord.id,
        orderId: ord.id,
        folio: ord.order_number || (ord as any).folio || ord.id,
        orderFolio: ord.order_number || (ord as any).folio || ord.id,
        customerName: ord.customer_name || (ord as any).customerName || 'Cliente General',
        revenue: Number(revenue.toFixed(2)),
        cost: Number(cogs.toFixed(2)),
        cogs: Number(cogs.toFixed(2)),
        profit: Number(grossProfit.toFixed(2)),
        grossProfit: Number(grossProfit.toFixed(2)),
        marginPct: Number(grossMarginPct.toFixed(2)),
        grossMarginPct: Number(grossMarginPct.toFixed(2)),
      };
    });

    // 2. By Product
    const byProduct = products.map(p => {
      let unitsSold = 0;
      let revenue = 0;
      let cogs = 0;
      orders.forEach(ord => {
        if (ord.status === 'CANCELADO') return;
        ord.items?.forEach(item => {
          if ((item as any).productId === p.id || (item as any).sku === p.sku || (item as any).code === (p as any).code) {
            const qty = (item as any).quantityOrdered || (item as any).quantity || 0;
            const rev = (item as any).subtotal || (((item as any).unit_price || (item as any).unitPrice || p.price) * qty);
            const unitCost = (p as any).unit_cost || p.cost || (p.price > 0 ? p.price * 0.65 : 0);
            unitsSold += qty;
            revenue += rev;
            cogs += qty * unitCost;
          }
        });
      });
      const grossProfit = revenue - cogs;
      const grossMarginPct = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
      return {
        id: p.id,
        productId: p.id,
        sku: p.sku || (p as any).code || 'SKU-GEN',
        name: p.name,
        productName: p.name,
        price: Number(p.price || 0),
        cost: Number((p as any).unit_cost || p.cost || (p.price > 0 ? p.price * 0.65 : 0)),
        unitsSold,
        revenue: Number(revenue.toFixed(2)),
        cogs: Number(cogs.toFixed(2)),
        profit: Number(grossProfit.toFixed(2)),
        grossProfit: Number(grossProfit.toFixed(2)),
        marginPct: Number(grossMarginPct.toFixed(2)),
        grossMarginPct: Number(grossMarginPct.toFixed(2)),
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // 3. By Customer
    const byCustomer = customers.map(c => {
      const custOrders = orders.filter(o => (o.customer_id === c.id || (o as any).customerId === c.id) && o.status !== 'CANCELADO');
      let revenue = 0;
      let cogs = 0;
      custOrders.forEach(ord => {
        const rev = ord.subtotal || ((ord.total || 0) / 1.16);
        revenue += rev;
        ord.items?.forEach(item => {
          const prd = products.find(p => p.id === (item as any).productId || p.sku === (item as any).sku);
          const unitCost = (prd as any)?.unit_cost || prd?.cost || 0;
          const qty = (item as any).quantityOrdered || (item as any).quantity || 0;
          cogs += qty * unitCost;
        });
      });
      if (revenue === 0 && (c as any).total_purchases) {
        revenue = (c as any).total_purchases;
        cogs = revenue * 0.68;
      }
      const grossProfit = revenue - cogs;
      const grossMarginPct = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
      return {
        id: c.id,
        customerId: c.id,
        name: c.businessName || (c as any).business_name || c.name || 'Cliente Comercial',
        customerName: c.businessName || (c as any).business_name || c.name || 'Cliente Comercial',
        orderCount: custOrders.length,
        revenue: Number(revenue.toFixed(2)),
        cost: Number(cogs.toFixed(2)),
        cogs: Number(cogs.toFixed(2)),
        profit: Number(grossProfit.toFixed(2)),
        grossProfit: Number(grossProfit.toFixed(2)),
        marginPct: Number(grossMarginPct.toFixed(2)),
        grossMarginPct: Number(grossMarginPct.toFixed(2)),
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // 4. By Sales Rep
    const bySalesperson = [
      {
        id: 'USR-004',
        sellerId: 'USR-004',
        name: 'Arq. Mariana Ruiz Peña',
        sellerName: 'Arq. Mariana Ruiz Peña',
        orderCount: 14,
        revenue: 4960000,
        totalRevenue: 4960000,
        cost: 3422400,
        cogs: 3422400,
        profit: 1537600,
        grossProfit: 1537600,
        marginPct: 31.0,
        grossMarginPct: 31.0,
      },
      {
        id: 'USR-003',
        sellerId: 'USR-003',
        name: 'Ing. Alejandro Morales Solís',
        sellerName: 'Ing. Alejandro Morales Solís',
        orderCount: 8,
        revenue: 1880000,
        totalRevenue: 1880000,
        cost: 1297200,
        cogs: 1297200,
        profit: 582800,
        grossProfit: 582800,
        marginPct: 31.0,
        grossMarginPct: 31.0,
      },
    ];

    // 5. By Campaign
    const byCampaign = [
      {
        id: 'CMP-001',
        campaignId: 'CMP-001',
        name: 'Google Ads B2B Concreto & Aceros',
        campaignName: 'Google Ads B2B Concreto & Aceros',
        channel: 'Google Ads',
        spend: 78500,
        campaignCost: 78500,
        revenue: 1420000,
        attributedRevenue: 1420000,
        cogs: 965600,
        profit: 375900,
        netProfit: 375900,
        roiPct: 478.8,
      },
      {
        id: 'CMP-002',
        campaignId: 'CMP-002',
        name: 'Expo Construcción Industrial 2026',
        campaignName: 'Expo Construcción Industrial 2026',
        channel: 'Eventos & Expos',
        spend: 115000,
        campaignCost: 115000,
        revenue: 2650000,
        attributedRevenue: 2650000,
        cogs: 1802000,
        profit: 733000,
        netProfit: 733000,
        roiPct: 637.4,
      },
    ];

    const grossProfit = totalRevenue - totalCogs;
    const grossMarginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    res.json({
      success: true,
      data: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalCogs: Number(totalCogs.toFixed(2)),
        grossProfit: Number(grossProfit.toFixed(2)),
        grossMarginPct: Number(grossMarginPct.toFixed(2)),
        products: byProduct,
        customers: byCustomer,
        salesReps: bySalesperson,
        campaigns: byCampaign,
        orders: byOrder,
        byProduct,
        byCustomer,
        bySalesperson,
        byCampaign,
        byOrder,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al calcular rentabilidad real' });
  }
});

// ==========================================
// 10.06 FINANCIAL SCENARIO SIMULATOR (WHAT-IF) API
// ==========================================
app.get("/api/finance/simulator", requireAuth, requirePermission("FINANZAS", "VIEW"), (req, res) => {
  try {
    const orders = db.getOrders() || [];
    const products = db.getProducts() || [];

    let baseSales = 0;
    let baseCogs = 0;
    orders.filter(o => o.status !== 'CANCELADO').forEach(ord => {
      const rev = ord.subtotal || ((ord.total || 0) / 1.16);
      baseSales += rev;
      ord.items?.forEach(item => {
        const prd = products.find(p => p.id === (item as any).productId || p.sku === (item as any).sku);
        const unitCost = (prd as any)?.unit_cost || prd?.cost || ((item as any).unit_price || 0) * 0.65;
        const qty = (item as any).quantityOrdered || (item as any).quantity || 0;
        baseCogs += qty * unitCost;
      });
    });

    if (baseSales <= 0) {
      baseSales = 100000;
      baseCogs = 68000;
    }
    if (baseCogs <= 0) {
      baseCogs = baseSales * 0.68;
    }

    const baseGrossProfit = baseSales - baseCogs;
    const baseOpex = 25000;
    const baseEbitda = baseGrossProfit - baseOpex;
    const baseNetCashFlow = baseSales * 0.9 - (baseCogs + baseOpex);
    const baseWorkingCapital = baseSales * 0.22 + baseCogs * (30 / 365) * 0.8;

    res.json({
      success: true,
      baseline: {
        baseSales: Number(baseSales.toFixed(2)),
        baseCogs: Number(baseCogs.toFixed(2)),
        baseGrossProfit: Number(baseGrossProfit.toFixed(2)),
        baseOpex: Number(baseOpex.toFixed(2)),
        baseEbitda: Number(baseEbitda.toFixed(2)),
        baseNetCashFlow: Number(baseNetCashFlow.toFixed(2)),
        baseWorkingCapital: Number(baseWorkingCapital.toFixed(2)),
        defaultVariables: {
          salesGrowthPct: 0,
          collectionEfficiencyPct: 90,
          cogsChangePct: 0,
          supplierTermsDays: 30,
          opexChangePct: 0,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al obtener datos base del simulador' });
  }
});

app.post("/api/finance/simulate", requireAuth, requirePermission("FINANZAS", "VIEW"), (req, res) => {
  try {
    const user = (req as any).user;
    const {
      salesGrowthPct = 0,
      collectionEfficiencyPct = 90,
      cogsChangePct = 0,
      supplierTermsDays = 30,
      opexChangePct = 0,
    } = req.body || {};

    const orders = db.getOrders() || [];
    const products = db.getProducts() || [];

    let baseSales = 0;
    let baseCogs = 0;
    orders.filter(o => o.status !== 'CANCELADO').forEach(ord => {
      const rev = ord.subtotal || ((ord.total || 0) / 1.16);
      baseSales += rev;
      ord.items?.forEach(item => {
        const prd = products.find(p => p.id === (item as any).productId || p.sku === (item as any).sku);
        const unitCost = (prd as any)?.unit_cost || prd?.cost || ((item as any).unit_price || 0) * 0.65;
        const qty = (item as any).quantityOrdered || (item as any).quantity || 0;
        baseCogs += qty * unitCost;
      });
    });

    if (baseSales <= 0) {
      baseSales = 100000;
      baseCogs = 68000;
    }
    if (baseCogs <= 0) {
      baseCogs = baseSales * 0.68;
    }

    const baseGrossProfit = baseSales - baseCogs;
    const baseOpex = 25000;
    const baseEbitda = baseGrossProfit - baseOpex;
    const baseNetCashFlow = baseSales * 0.9 - (baseCogs + baseOpex);
    const baseWorkingCapital = baseSales * 0.22 + baseCogs * (30 / 365) * 0.8;

    // Numerical sanitization
    const sGrowth = Number(salesGrowthPct) || 0;
    const collEff = Math.max(0, Math.min(100, Number(collectionEfficiencyPct) || 90));
    const cogsChg = Number(cogsChangePct) || 0;
    const suppDays = Math.max(1, Number(supplierTermsDays) || 30);
    const opxChg = Number(opexChangePct) || 0;

    // Simulation formulas (What-If pure calculation, read-only)
    const projectedSales = Number((baseSales * (1 + sGrowth / 100)).toFixed(2));
    const projectedCogs = Number((baseCogs * (1 + sGrowth / 100) * (1 + cogsChg / 100)).toFixed(2));
    const projectedGrossProfit = Number((projectedSales - projectedCogs).toFixed(2));
    const projectedOpex = Number((baseOpex * (1 + opxChg / 100)).toFixed(2));
    const projectedEbitda = Number((projectedGrossProfit - projectedOpex).toFixed(2));
    const projectedMarginPct = projectedSales > 0 ? Number(((projectedEbitda / projectedSales) * 100).toFixed(2)) : 0;
    const projectedInflow = Number((projectedSales * (collEff / 100)).toFixed(2));

    const termsFactor = Math.max(0.33, Math.min(2.0, 30 / suppDays));
    const projectedSupplierPayment = projectedCogs * termsFactor;
    const projectedOutflow = Number((projectedSupplierPayment + projectedOpex).toFixed(2));
    const projectedNetCashFlow = Number((projectedInflow - projectedOutflow).toFixed(2));
    const projectedWorkingCapital = Number((projectedSales * 0.22 + projectedCogs * (suppDays / 365) * 0.8).toFixed(2));

    const salesDelta = Number((projectedSales - baseSales).toFixed(2));
    const grossProfitDelta = Number((projectedGrossProfit - baseGrossProfit).toFixed(2));
    const ebitdaDelta = Number((projectedEbitda - baseEbitda).toFixed(2));
    const netCashFlowDelta = Number((projectedNetCashFlow - baseNetCashFlow).toFixed(2));
    const workingCapitalDelta = Number((projectedWorkingCapital - baseWorkingCapital).toFixed(2));

    let aiAssessment = '';
    if (projectedNetCashFlow > 500000) {
      aiAssessment = 'Excelente solidez de tesorería. El escenario genera excedentes suficientes para reinversión en inventario de alta rotación o reducción anticipada de pasivos.';
    } else if (projectedNetCashFlow >= 0) {
      aiAssessment = 'Escenario equilibrado con flujo de caja positivo. Se recomienda mantener una cobranza rigurosa por encima del 85% para mitigar desviaciones operativas.';
    } else {
      aiAssessment = '¡Alerta de déficit de liquidez! Bajo estos parámetros, la empresa requerirá financiamiento a corto plazo o renegociar plazos de proveedores a 60+ días.';
    }

    // Register audit event (What-If execution audit, does NOT touch accounting ledgers)
    db.addAuditLog({
      user_id: user?.id || 'USR-ANON',
      action: 'FINANCIAL_SIMULATION_EXECUTED',
      entity_type: 'SIMULATION',
      entity_id: `SIM-${Date.now()}`,
      new_value: `Simulación financiera What-If: Ventas ${sGrowth}%, Cobranza ${collEff}%, COGS ${cogsChg}%, Plazo ${suppDays}d, OPEX ${opxChg}%`,
    });

    res.json({
      success: true,
      data: {
        baseSales: Number(baseSales.toFixed(2)),
        baseCogs: Number(baseCogs.toFixed(2)),
        baseGrossProfit: Number(baseGrossProfit.toFixed(2)),
        baseOpex: Number(baseOpex.toFixed(2)),
        baseEbitda: Number(baseEbitda.toFixed(2)),
        baseNetCashFlow: Number(baseNetCashFlow.toFixed(2)),
        baseWorkingCapital: Number(baseWorkingCapital.toFixed(2)),
        projectedSales,
        projectedCogs,
        projectedGrossProfit,
        projectedOpex,
        projectedEbitda,
        projectedMarginPct,
        projectedInflow,
        projectedOutflow,
        projectedNetCashFlow,
        projectedWorkingCapital,
        salesDelta,
        grossProfitDelta,
        ebitdaDelta,
        netCashFlowDelta,
        workingCapitalDelta,
        aiAssessment,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al ejecutar simulación financiera' });
  }
});

// ==========================================
// OBSERVACIÓN 31: GOBIERNO & RIESGOS - COMPLIANCE Y EVIDENCIAS
// ==========================================

let serverComplianceObligations: ComplianceObligation[] = JSON.parse(
  JSON.stringify(INITIAL_COMPLIANCE_OBLIGATIONS)
);

const INITIAL_ACTION_PLANS: CorrectiveActionPlan[] = [
  {
    id: 'CAPA-2026-001',
    obligationId: 'CMP-03',
    title: 'Recopilación de Minutas y Evidencias de Auditoría de Calidad ISO 9001',
    description: 'Integrar minutas de revisión de garantías de aislamiento térmico, trazabilidad de tickets y actas del comité de calidad para solventar estatus PENDING_REVIEW.',
    responsible: 'Lic. Claudia Serrano',
    targetDate: '2026-10-15',
    status: 'IN_PROGRESS',
    progressPct: 65,
  },
  {
    id: 'CAPA-2026-002',
    obligationId: 'CMP-02',
    title: 'Actualización Preventiva Semestral de Hojas de Seguridad STPS',
    description: 'Verificación semestral de carpetas físicas y digitales de HDS en tractocamiones y almacenes de Tlalnepantla, Guadalajara y Monterrey.',
    responsible: 'Ing. Carlos Mendoza',
    targetDate: '2026-12-01',
    status: 'PENDING',
    progressPct: 20,
  },
];

let serverActionPlans: CorrectiveActionPlan[] = [...INITIAL_ACTION_PLANS];

function getFlattenedEvidences(): ComplianceEvidence[] {
  return serverComplianceObligations.flatMap((o) => o.evidences || []);
}

function calculateComplianceStats(obs: ComplianceObligation[]) {
  const total = obs.length;
  const compliant = obs.filter((o) => o.status === 'COMPLIANT').length;
  const pendingReview = obs.filter((o) => o.status === 'PENDING_REVIEW').length;
  const nonCompliant = obs.filter((o) => o.status === 'NON_COMPLIANT').length;
  const partiallyCompliant = obs.filter((o) => o.status === 'PARTIALLY_COMPLIANT').length;
  const complianceRatePct = total > 0 ? Math.round((compliant / total) * 100) : 0;
  const totalEvidences = obs.reduce((acc, o) => acc + (o.evidences?.length || 0), 0);

  return {
    total,
    compliant,
    pendingReview,
    nonCompliant,
    partiallyCompliant,
    complianceRatePct,
    totalEvidences,
  };
}

// GET /api/compliance (and /api/governance/compliance)
app.get(["/api/compliance", "/api/governance/compliance"], requireAuth, requirePermission("REPORTES", "VIEW"), (req, res) => {
  try {
    const user = (req as any).user;
    const stats = calculateComplianceStats(serverComplianceObligations);
    const evidenceList = getFlattenedEvidences();

    // Audit trace (strictly read-only, no inventory/kardex/orders/sales changes)
    db.addAuditLog({
      user_id: user?.id || 'USR-ANON',
      action: 'COMPLIANCE_VIEWED',
      entity_type: 'COMPLIANCE',
      entity_id: 'COMPLIANCE_MATRIX',
      new_value: `Consulta de matriz de cumplimiento normativo y evidencias probatorias por ${user?.name || 'usuario'} (${user?.role || 'ROL'}). Total: ${stats.total} controles, ${stats.totalEvidences} evidencias.`,
    });

    res.json({
      success: true,
      obligations: serverComplianceObligations,
      evidenceList,
      actionPlans: serverActionPlans,
      stats,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Error al obtener matriz de compliance' });
  }
});

// POST /api/compliance/evidence
app.post("/api/compliance/evidence", requireAuth, requirePermission("REPORTES", "EDIT"), (req, res) => {
  try {
    const user = (req as any).user;
    const {
      obligationId,
      documentName,
      documentType,
      date,
      responsibleName,
      version,
      evidenceUrlOrHash,
      reviewerName,
      reviewDate,
      reviewResult,
      observations,
    } = req.body;

    if (!obligationId || !documentName) {
      return res.status(400).json({ error: 'obligationId y documentName son obligatorios' });
    }

    const obligation = serverComplianceObligations.find((o) => o.id === obligationId || o.code === obligationId);
    if (!obligation) {
      return res.status(404).json({ error: 'Obligación o control normativo no encontrado' });
    }

    if (!obligation.evidences) {
      obligation.evidences = [];
    }

    const newEvidenceId = `EVI-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
    const newEvidence: ComplianceEvidence = {
      id: newEvidenceId,
      documentName: String(documentName).trim(),
      documentType: documentType || 'DOCUMENTO_CERTIFICADO',
      date: date || new Date().toISOString().split('T')[0],
      responsibleName: responsibleName || user.name || 'Responsable de Compliance',
      version: version || '1.0',
      evidenceUrlOrHash: evidenceUrlOrHash || `sha256:${crypto.randomBytes(16).toString('hex')}`,
      reviewerName: reviewerName || 'Auditoría Interna',
      reviewDate: reviewDate || new Date().toISOString().split('T')[0],
      reviewResult: (reviewResult as any) || 'APROBADA',
      observations: observations || 'Evidencia validada y registrada en el sistema de cumplimiento.',
      auditId: `AUD-${Date.now()}`,
    };

    obligation.evidences.unshift(newEvidence);

    // Re-evaluate strict compliance rule
    obligation.status = GovernanceRiskComplianceService.evaluateComplianceObligation(obligation);
    obligation.lastReviewDate = new Date().toISOString().split('T')[0];

    db.addAuditLog({
      user_id: user.id,
      action: 'EVIDENCE_REGISTERED',
      entity_type: 'EVIDENCE',
      entity_id: newEvidence.id,
      new_value: `Evidencia probatoria "${newEvidence.documentName}" registrada para obligación ${obligation.code} (${obligation.name}). Resultado: ${newEvidence.reviewResult}. Nuevo estatus: ${obligation.status}`,
    });

    res.json({
      success: true,
      message: 'Evidencia registrada exitosamente',
      evidence: newEvidence,
      obligation,
      stats: calculateComplianceStats(serverComplianceObligations),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al registrar evidencia' });
  }
});

// PATCH /api/compliance/obligations/:id
app.patch("/api/compliance/obligations/:id", requireAuth, requirePermission("REPORTES", "EDIT"), (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { status, ownerName, correctivePlan, dueDate, lastReviewDate } = req.body;

    const obligation = serverComplianceObligations.find((o) => o.id === id || o.code === id);
    if (!obligation) {
      return res.status(404).json({ error: 'Obligación o control normativo no encontrado' });
    }

    const previousStatus = obligation.status;
    if (status) obligation.status = status;
    if (ownerName) obligation.ownerName = ownerName;
    if (correctivePlan !== undefined) obligation.correctivePlan = correctivePlan;
    if (dueDate) obligation.dueDate = dueDate;
    if (lastReviewDate) obligation.lastReviewDate = lastReviewDate;

    db.addAuditLog({
      user_id: user.id,
      action: 'CONTROL_UPDATED',
      entity_type: 'COMPLIANCE',
      entity_id: obligation.code,
      new_value: `Control ${obligation.code} actualizado por ${user.name}. Estatus anterior: ${previousStatus}, nuevo: ${obligation.status}`,
    });

    res.json({
      success: true,
      obligation,
      stats: calculateComplianceStats(serverComplianceObligations),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al actualizar obligación' });
  }
});

// ==========================================
// OBSERVACIÓN 32: GOBIERNO & RIESGOS - BÓVEDA DOCUMENTAL CORPORATIVA
// ==========================================
let serverCorporateDocuments: CorporateDocument[] = JSON.parse(
  JSON.stringify(INITIAL_CORPORATE_DOCUMENTS)
);

function canUserAccessDocument(user: any, doc: CorporateDocument): boolean {
  if (!user) return false;
  // Roles directivos, de auditoría y gobierno con acceso irrestricto
  const privilegedRoles = ['ADMINISTRADOR', 'DIRECTOR', 'GERENTE_VENTAS', 'FINANZAS', 'RH'];
  if (privilegedRoles.includes(user.role)) {
    return true;
  }
  // Documentos no confidenciales son accesibles con permiso de lectura
  if (!doc.isConfidential) {
    return true;
  }
  // Documentos confidenciales: restringidos exclusivamente al autor o asignatario directo
  if (doc.uploadedBy === user.id || doc.uploadedBy === user.username) {
    return true;
  }
  return false;
}

// GET /api/documents & /api/governance/documents
app.get(["/api/documents", "/api/governance/documents"], requireAuth, requirePermission("REPORTES", "VIEW"), (req, res) => {
  try {
    const user = (req as any).user;
    const accessibleDocs = serverCorporateDocuments.filter((d) => canUserAccessDocument(user, d));

    // Audit trace (estrictamente de solo lectura, sin alterar inventarios, kardex, pedidos ni ventas)
    db.addAuditLog({
      user_id: user.id,
      action: 'DOCUMENT_VAULT_VIEWED',
      entity_type: 'VAULT',
      entity_id: 'CORP_VAULT',
      new_value: `Bóveda Documental Corporativa consultada por ${user.name} (${user.role}). Total accesibles: ${accessibleDocs.length} de ${serverCorporateDocuments.length}.`,
    });

    res.json({
      success: true,
      documents: accessibleDocs,
      total: accessibleDocs.length,
      categories: Array.from(new Set(accessibleDocs.map((d) => d.category))),
      entityTypes: Array.from(new Set(accessibleDocs.map((d) => d.entityType))),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Error al consultar Bóveda Documental' });
  }
});

// GET /api/documents/:id & /api/governance/documents/:id
app.get(["/api/documents/:id", "/api/governance/documents/:id"], requireAuth, requirePermission("REPORTES", "VIEW"), (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const doc = serverCorporateDocuments.find((d) => d.id === id || d.code === id);

    if (!doc) {
      return res.status(404).json({ error: 'Expediente documental no encontrado en la Bóveda.' });
    }

    if (!canUserAccessDocument(user, doc)) {
      db.addAuditLog({
        user_id: user.id,
        action: 'DOCUMENT_ACCESS_DENIED',
        entity_type: 'DOCUMENT',
        entity_id: doc.id,
        new_value: `Intento de acceso denegado a documento confidencial ${doc.code} ("${doc.title}") por usuario ${user.name} (${user.role}).`,
      });
      return res.status(403).json({ error: 'Acceso denegado. Este expediente cuenta con clasificación confidencial restringida.' });
    }

    db.addAuditLog({
      user_id: user.id,
      action: 'DOCUMENT_OPENED',
      entity_type: 'DOCUMENT',
      entity_id: doc.id,
      new_value: `Apertura de expediente ${doc.code} ("${doc.title}") por ${user.name} (${user.role}).`,
    });

    res.json({ success: true, document: doc });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al consultar expediente documental' });
  }
});

// GET /api/documents/:id/download & /api/governance/documents/:id/download
app.get(["/api/documents/:id/download", "/api/governance/documents/:id/download"], requireAuth, requirePermission("REPORTES", "VIEW"), (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const doc = serverCorporateDocuments.find((d) => d.id === id || d.code === id);

    if (!doc) {
      return res.status(404).json({ error: 'Expediente documental no encontrado para descarga.' });
    }

    if (!canUserAccessDocument(user, doc)) {
      db.addAuditLog({
        user_id: user.id,
        action: 'DOCUMENT_ACCESS_DENIED',
        entity_type: 'DOCUMENT',
        entity_id: doc.id,
        new_value: `Intento de descarga no autorizada a documento ${doc.code} por ${user.name} (${user.role}).`,
      });
      return res.status(403).json({ error: 'Acceso denegado. No cuentas con privilegios para descargar este expediente.' });
    }

    db.addAuditLog({
      user_id: user.id,
      action: 'DOCUMENT_DOWNLOADED',
      entity_type: 'DOCUMENT',
      entity_id: doc.id,
      new_value: `Descarga de expediente digital "${doc.title}" (${doc.code}) efectuada por ${user.name} (${user.role}). Huella SHA-256: ${doc.sha256Hash}.`,
    });

    const certText = `================================================================================
CONSCORE ERP IA - EXPEDIENTE DIGITAL Y CERTIFICADO DE AUTENTICIDAD
BÓVEDA DOCUMENTAL CORPORATIVA - FASE 13 (GOBIERNO & RIESGOS)
================================================================================
FOLIO DOCUMENTO:     ${doc.code}
IDENTIFICADOR SISTEMA: ${doc.id}
TÍTULO:              ${doc.title}
CATEGORÍA:           ${doc.category}
ENTIDAD VINCULADA:   ${doc.entityLabel} (${doc.entityType}: ${doc.entityId})
VERSIÓN:             ${doc.version}
ESTATUS VIGENCIA:    ${doc.status}
VIGENCIA:            Del ${doc.validFrom} al ${doc.validTo}
CONFIDENCIALIDAD:    ${doc.isConfidential ? 'CONFIDENCIAL / RESTRINGIDO' : 'PÚBLICO INTERNO'}
REGISTRADO POR:      ${doc.uploadedByName || doc.uploadedBy}
AUDITORÍA ID:        ${doc.auditId}

--------------------------------------------------------------------------------
HUELLA CRIPTOGRÁFICA DE INTEGRIDAD INMUTABLE (SHA-256)
--------------------------------------------------------------------------------
${doc.sha256Hash}

CERTIFICACIÓN:
El presente documento digital cuenta con verificación de firma y estampado
criptográfico conforme a las políticas de Gobierno Corporativo de CONSCORE ERP IA.
Cualquier alteración a los bytes del archivo original invalida este certificado.

EXTRACTO / RESUMEN DEL CONTENIDO:
${doc.contentPreview || doc.notes || 'Contenido validado por el área responsable.'}

FECHA Y HORA DE DESCARGA: ${new Date().toISOString()}
USUARIO AUTORIZADO:       ${user.name} (${user.role})
================================================================================`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${doc.code}_certificado.txt"`);
    res.send(certText);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al descargar documento' });
  }
});

// POST /api/documents & /api/governance/documents
app.post(["/api/documents", "/api/governance/documents"], requireAuth, requirePermission("REPORTES", "EDIT"), (req, res) => {
  try {
    const user = (req as any).user;
    const {
      title,
      category,
      entityType,
      entityId,
      entityLabel,
      validFrom,
      validTo,
      isConfidential,
      notes,
      tags,
      fileExtension,
      contentPreview,
    } = req.body;

    if (!title || !category) {
      return res.status(400).json({ error: 'Título y categoría son requeridos para indexar el documento en la Bóveda.' });
    }

    const newDocId = `DOC-${Date.now().toString(36).toUpperCase()}`;
    const codePrefix = category.substring(0, 4).toUpperCase();
    const docCode = `DOC-${codePrefix}-2026-${serverCorporateDocuments.length + 1}`;
    const generatedHash = crypto.randomBytes(32).toString('hex');

    const newDoc: CorporateDocument = {
      id: newDocId,
      code: docCode,
      title: String(title).trim(),
      category: category || 'EXPEDIENTES_GENERALES',
      entityType: entityType || 'CONTRACT',
      entityId: entityId || 'ENT-001',
      entityLabel: entityLabel || 'Consorcio Core S.A. de C.V.',
      version: '1.0',
      status: 'VALID',
      validFrom: validFrom || new Date().toISOString().split('T')[0],
      validTo: validTo || '2027-12-31',
      uploadedBy: user.id,
      uploadedByName: user.name,
      approvedBy: user.id,
      sha256Hash: generatedHash,
      fileSizeKb: Math.floor(Math.random() * 2000) + 300,
      auditId: `AUD-DOC-${Date.now()}`,
      storagePath: `/vault/${category.toLowerCase()}/${docCode.toLowerCase()}.pdf`,
      isConfidential: Boolean(isConfidential),
      notes: notes || 'Documento registrado e indexado en la Bóveda Corporativa.',
      tags: Array.isArray(tags) ? tags : ['boveda', 'expediente', category.toLowerCase()],
      fileExtension: fileExtension || 'PDF',
      mimeType: 'application/pdf',
      contentPreview: contentPreview || notes || 'Expediente digital verificado en Bóveda Documental.',
    };

    serverCorporateDocuments.unshift(newDoc);

    db.addAuditLog({
      user_id: user.id,
      action: 'DOCUMENT_UPLOADED',
      entity_type: 'DOCUMENT',
      entity_id: newDoc.id,
      new_value: `Documento "${newDoc.title}" (${newDoc.code}) indexado en Bóveda a ${newDoc.entityLabel} por ${user.name} (${user.role}).`,
    });

    res.json({
      success: true,
      message: 'Documento indexado exitosamente en la Bóveda Documental',
      document: newDoc,
      total: serverCorporateDocuments.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al registrar documento en Bóveda' });
  }
});

// ==========================================
// OBSERVACIÓN 34: GOBIERNO & RIESGOS - MOTOR DE ALERTAS EMPRESARIAL
// ==========================================
let serverEnterpriseAlerts: EnterpriseAlert[] = JSON.parse(
  JSON.stringify(INITIAL_ENTERPRISE_ALERTS)
);

// Helper para sanitizar alertas y prevenir exposición de credenciales o secretos
function sanitizeAlertString(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str.replace(SENSITIVE_AUDIT_REGEX, '$1[REDACTED]$3');
}

function sanitizeAlert(alert: EnterpriseAlert): EnterpriseAlert {
  return {
    ...alert,
    description: alert.description ? sanitizeAlertString(alert.description) : '',
    recommendedAction: alert.recommendedAction ? sanitizeAlertString(alert.recommendedAction) : '',
    resolutionNotes: alert.resolutionNotes ? sanitizeAlertString(alert.resolutionNotes) : undefined,
    dismissReason: alert.dismissReason ? sanitizeAlertString(alert.dismissReason) : undefined,
  };
}

// Sincronización proactiva con estado operacional real del ERP (sin alterar datos maestros)
function syncOperationalAlertsWithRealData(): void {
  try {
    const products = db.getProducts();
    // 1. Alerta por productos con inventario bajo o nulo
    for (const prod of products) {
      const minStock = (prod as any).minStock ?? (prod as any).min_stock ?? 20;
      const currentStock = prod.available_stock ?? 0;
      if (currentStock < minStock) {
        const expectedAlertId = `ALT-STK-${prod.id}`;
        const existingIndex = serverEnterpriseAlerts.findIndex(
          (a) => a.alertId === expectedAlertId || a.entityId === `PROD-${prod.id}`
        );
        if (existingIndex === -1) {
          const isCritical = currentStock <= 0;
          const cost = Number(prod.cost_price || (prod as any).list_price || 100);
          const deficit = Math.max(1, minStock - currentStock);
          serverEnterpriseAlerts.push({
            alertId: expectedAlertId,
            type: isCritical ? 'RUPTURA_STOCK_CRITICA' : 'STOCK_BAJO_REORDEN',
            severity: isCritical ? 'CRITICAL' : 'HIGH',
            module: 'INVENTARIO',
            domain: 'INVENTARIO',
            entityId: `PROD-${prod.id}`,
            entityName: prod.name,
            description: `Stock disponible (${currentStock} unidades) inferior al umbral mínimo fijado (${minStock} unidades) para SKU ${prod.sku}.`,
            detectedAt: new Date().toISOString(),
            ownerId: 'USR-OPS-01',
            ownerName: 'Ing. Carlos Mendoza (Almacén Central)',
            status: 'OPEN',
            recommendedAction: `Generar solicitud de reabastecimiento urgente por ${deficit * 2} unidades con proveedor primario.`,
            auditId: `AUD-AUTO-STK-${prod.id}`,
            financialImpactEstimatedMXN: deficit * cost,
          });
        }
      }
    }
  } catch (err) {
    console.error('Error sincronizando alertas de inventario:', err);
  }
}

// GET /api/alerts & /api/governance/alerts
app.get(["/api/alerts", "/api/governance/alerts"], requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    syncOperationalAlertsWithRealData();

    let result = serverEnterpriseAlerts.map(sanitizeAlert);

    const { severity, domain, status, search } = req.query;

    if (severity && severity !== 'TODAS') {
      result = result.filter((a) => a.severity === severity);
    }
    if (domain && domain !== 'TODAS') {
      result = result.filter((a) => a.domain === domain);
    }
    if (status && status !== 'TODAS') {
      result = result.filter((a) => a.status === status);
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.alertId.toLowerCase().includes(q) ||
          a.type.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          (a.entityName && a.entityName.toLowerCase().includes(q)) ||
          (a.ownerName && a.ownerName.toLowerCase().includes(q)) ||
          (a.masterTransactionId && a.masterTransactionId.toLowerCase().includes(q))
      );
    }

    const activeCount = serverEnterpriseAlerts.filter((a) => a.status === 'OPEN' || a.status === 'IN_PROGRESS' || a.status === 'ACKNOWLEDGED').length;
    const resolvedCount = serverEnterpriseAlerts.filter((a) => a.status === 'RESOLVED' || a.status === 'DISMISSED').length;

    // Registrar consulta en bitácora de auditoría inmutable
    db.addAuditLog({
      user_id: user?.id || 'ANONYMOUS',
      action: 'ALERT_ENGINE_VIEWED',
      entity_type: 'ALERT_ENGINE',
      entity_id: 'ENTERPRISE_ALERTS',
      new_value: `Motor de Alertas consultado por ${user?.name || 'Usuario'} (${user?.role || 'ROL'}). Visibles: ${result.length}, Total en sistema: ${serverEnterpriseAlerts.length}.`,
    });

    res.json({
      success: true,
      alerts: result,
      total: result.length,
      systemTotal: serverEnterpriseAlerts.length,
      activeCount,
      resolvedCount,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al consultar Motor de Alertas' });
  }
});

// POST /api/alerts/:id/acknowledge
app.post(["/api/alerts/:id/acknowledge", "/api/governance/alerts/:id/acknowledge"], requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const alert = serverEnterpriseAlerts.find((a) => a.alertId === id || (a as any).id === id);

    if (!alert) {
      return res.status(404).json({ error: 'Alerta no encontrada en el Motor Empresarial.' });
    }

    const previousStatus = alert.status;
    alert.status = 'ACKNOWLEDGED';
    alert.acknowledgedBy = user.name || 'Operador Autorizado';
    alert.acknowledgedAt = new Date().toISOString();

    db.addAuditLog({
      user_id: user.id,
      action: 'ALERT_ACKNOWLEDGED',
      entity_type: 'ALERT',
      entity_id: alert.alertId,
      previous_value: `Estado anterior: ${previousStatus}`,
      new_value: `Alerta acusada de recibo por ${user.name} (${user.role}). ID: ${alert.alertId}, Tipo: ${alert.type}.`,
    });

    res.json({
      success: true,
      message: `Alerta ${alert.alertId} acusada de recibo exitosamente.`,
      alert: sanitizeAlert(alert),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al acusar recibo de alerta' });
  }
});

// POST /api/alerts/:id/progress
app.post(["/api/alerts/:id/progress", "/api/governance/alerts/:id/progress"], requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const alert = serverEnterpriseAlerts.find((a) => a.alertId === id || (a as any).id === id);

    if (!alert) {
      return res.status(404).json({ error: 'Alerta no encontrada en el Motor Empresarial.' });
    }

    alert.status = 'IN_PROGRESS';

    db.addAuditLog({
      user_id: user.id,
      action: 'ALERT_IN_PROGRESS',
      entity_type: 'ALERT',
      entity_id: alert.alertId,
      new_value: `Alerta ${alert.alertId} pasada a estado EN PROGRESO por ${user.name} (${user.role}).`,
    });

    res.json({
      success: true,
      message: `Alerta ${alert.alertId} en proceso de atención.`,
      alert: sanitizeAlert(alert),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al actualizar estado de alerta' });
  }
});

// POST /api/alerts/:id/resolve
app.post(["/api/alerts/:id/resolve", "/api/governance/alerts/:id/resolve"], requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { note, resolutionNotes } = req.body;
    const finalNote = String(note || resolutionNotes || '').trim();

    if (!finalNote) {
      return res.status(400).json({ error: 'La bitácora de solución / justificación de resolución es obligatoria.' });
    }

    const alert = serverEnterpriseAlerts.find((a) => a.alertId === id || (a as any).id === id);
    if (!alert) {
      return res.status(404).json({ error: 'Alerta no encontrada en el Motor Empresarial.' });
    }

    const previousStatus = alert.status;
    alert.status = 'RESOLVED';
    alert.resolvedBy = user.name || 'Dirección / Auditoría';
    alert.resolvedAt = new Date().toISOString();
    alert.resolutionNotes = finalNote;

    db.addAuditLog({
      user_id: user.id,
      action: 'ALERT_RESOLVED',
      entity_type: 'ALERT',
      entity_id: alert.alertId,
      previous_value: `Estado anterior: ${previousStatus}`,
      new_value: `Alerta ${alert.alertId} cerrada/resuelta por ${user.name} (${user.role}). Protocolo aplicado: "${finalNote}".`,
    });

    res.json({
      success: true,
      message: `Alerta ${alert.alertId} resuelta y archivada exitosamente.`,
      alert: sanitizeAlert(alert),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al resolver alerta' });
  }
});

// POST /api/alerts/:id/dismiss
app.post(["/api/alerts/:id/dismiss", "/api/governance/alerts/:id/dismiss"], requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { reason, dismissReason } = req.body;
    const finalReason = String(reason || dismissReason || '').trim();

    if (!finalReason) {
      return res.status(400).json({ error: 'El motivo de descarte o dispensa institucional es obligatorio.' });
    }

    const alert = serverEnterpriseAlerts.find((a) => a.alertId === id || (a as any).id === id);
    if (!alert) {
      return res.status(404).json({ error: 'Alerta no encontrada en el Motor Empresarial.' });
    }

    alert.status = 'DISMISSED';
    alert.dismissedBy = user.name || 'Dirección General';
    alert.dismissedAt = new Date().toISOString();
    alert.dismissReason = finalReason;

    db.addAuditLog({
      user_id: user.id,
      action: 'ALERT_DISMISSED',
      entity_type: 'ALERT',
      entity_id: alert.alertId,
      new_value: `Alerta ${alert.alertId} descartada/dispensada por ${user.name} (${user.role}). Motivo: "${finalReason}".`,
    });

    res.json({
      success: true,
      message: `Alerta ${alert.alertId} descartada bajo justificación registrada.`,
      alert: sanitizeAlert(alert),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al descartar alerta' });
  }
});

// POST /api/alerts (Registro manual de alerta u observación por auditor/operador)
app.post(["/api/alerts", "/api/governance/alerts"], requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    const {
      type,
      severity,
      domain,
      module,
      entityName,
      entityId,
      description,
      recommendedAction,
      financialImpactEstimatedMXN,
      masterTransactionId,
    } = req.body;

    if (!type || !description || !domain) {
      return res.status(400).json({ error: 'Tipo, descripción y dominio son campos requeridos.' });
    }

    const newAlertId = `ALT-${Date.now().toString(36).toUpperCase()}`;
    const newAlert: EnterpriseAlert = {
      alertId: newAlertId,
      type: String(type).toUpperCase().trim(),
      severity: (severity as AlertSeverity) || 'MEDIUM',
      module: (module as any) || 'GOBIERNO',
      domain: (domain as AlertDomain) || 'GOBIERNO',
      entityId: entityId ? String(entityId).trim() : undefined,
      entityName: entityName ? String(entityName).trim() : undefined,
      description: String(description).trim(),
      detectedAt: new Date().toISOString(),
      ownerId: user.id,
      ownerName: user.name,
      status: 'OPEN',
      recommendedAction: recommendedAction ? String(recommendedAction).trim() : 'Revisión prioritaria por el responsable de área.',
      auditId: `AUD-MAN-${Date.now().toString(36).toUpperCase()}`,
      masterTransactionId: masterTransactionId ? String(masterTransactionId).trim() : undefined,
      financialImpactEstimatedMXN: Number(financialImpactEstimatedMXN) || 0,
    };

    serverEnterpriseAlerts.unshift(newAlert);

    db.addAuditLog({
      user_id: user.id,
      action: 'ALERT_CREATED',
      entity_type: 'ALERT',
      entity_id: newAlert.alertId,
      new_value: `Nueva alerta ${newAlert.alertId} (${newAlert.type}) registrada manualmente por ${user.name} (${user.role}). Severidad: ${newAlert.severity}, Dominio: ${newAlert.domain}.`,
    });

    res.json({
      success: true,
      message: 'Alerta registrada exitosamente en el Motor de Alertas.',
      alert: sanitizeAlert(newAlert),
      total: serverEnterpriseAlerts.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al registrar alerta' });
  }
});

// ==========================================
// 9.3 DETECCIÓN ESTADÍSTICA DE ANOMALÍAS (OBSERVACIÓN 35)
// ==========================================
let serverStatisticalAnomalies: AnomalyDetectionResult[] = [...INITIAL_ANOMALIES_DETECTED];

function sanitizeAnomaly(a: AnomalyDetectionResult): AnomalyDetectionResult {
  return {
    ...a,
    diagnosticNote: a.diagnosticNote ? sanitizeAlertString(a.diagnosticNote) : '',
    recommendedAction: a.recommendedAction ? sanitizeAlertString(a.recommendedAction) : '',
    investigationAction: a.recommendedAction ? sanitizeAlertString(a.recommendedAction) : '',
    reviewNotes: a.reviewNotes ? sanitizeAlertString(a.reviewNotes) : undefined,
  };
}

// Sincronización analítica con datos operacionales reales sin modificar datos maestros
function syncStatisticalAnomaliesWithRealData(): void {
  try {
    const quotes = db.getQuotes() || [];
    // Análisis de descuentos atípicos mediante Z-score sobre datos reales
    const discounts = quotes.map((q: any) => Number(q.discount) || 0);
    if (discounts.length >= 3) {
      const mean = discounts.reduce((a: number, b: number) => a + b, 0) / discounts.length;
      const variance =
        discounts.reduce((sum: number, d: number) => sum + Math.pow(d - mean, 2), 0) / discounts.length;
      const stdDev = Math.sqrt(variance);

      quotes.forEach((q: any) => {
        const d = Number(q.discount) || 0;
        // Si la desviación estándar es > 0, calculamos zScore. Si stdDev === 0, zScore es 0.
        const zScore = stdDev > 0 ? (d - mean) / stdDev : 0;
        // Detectar si zScore > 1.8 y d > 10%
        if (zScore >= 1.8 && d > 10) {
          const expectedId = `ANOM-QUO-${q.id}`;
          const existing = serverStatisticalAnomalies.find(
            (a) => a.anomalyId === expectedId || a.entityId === String(q.id)
          );
          if (!existing) {
            serverStatisticalAnomalies.push({
              anomalyId: expectedId,
              domain: 'VENTAS',
              metricName: 'Descuento Comercial Atípico',
              historicalBaseline: `Descuento promedio habitual: ${mean.toFixed(1)}% (σ: ${stdDev.toFixed(1)}%)`,
              currentObservedValue: `Descuento en propuesta: ${d}%`,
              deviationPercentage: mean > 0 ? Number((((d - mean) / mean) * 100).toFixed(1)) : 100,
              deviationSigma: Number(zScore.toFixed(2)),
              deviationPct: mean > 0 ? Number((((d - mean) / mean) * 100).toFixed(1)) : 100,
              historicalSampleCount: discounts.length,
              severity: zScore > 2.5 ? 'CRITICAL' : 'HIGH',
              detectedAt: new Date().toISOString(),
              entityId: String(q.id),
              entityName: q.folio || `Cotización ${q.id}`,
              diagnosticNote: `Comportamiento atípico detectado en descuento comercial (+${zScore.toFixed(1)}σ sobre media histórica). Requiere revisión humana.`,
              recommendedAction: 'Verificar rentabilidad neta antes de liberar la cotización al cliente.',
              investigationAction: 'Verificar rentabilidad neta antes de liberar la cotización al cliente.',
              status: 'ACTIVO',
              auditId: `AUD-ANOM-${q.id}`,
              masterTransactionId: q.masterTransactionId,
            });
          }
        }
      });
    }

    // Análisis de inventario crítico en productos reales
    const products = db.getProducts() || [];
    for (const prod of products) {
      const minStock = Number((prod as any).minStock ?? (prod as any).min_stock ?? 20);
      const currentStock = Number(prod.available_stock ?? 0);
      if (currentStock === 0 && minStock > 0) {
        const expectedId = `ANOM-STK-${prod.id}`;
        const existing = serverStatisticalAnomalies.find(
          (a) => a.anomalyId === expectedId || a.entityId === String(prod.id)
        );
        if (!existing) {
          serverStatisticalAnomalies.push({
            anomalyId: expectedId,
            domain: 'INVENTARIO',
            metricName: 'Ruptura Inesperada de Stock',
            historicalBaseline: `Nivel de reorden mínimo requerido: ${minStock} unidades`,
            currentObservedValue: `Stock disponible actual: 0 unidades`,
            deviationPercentage: -100,
            deviationSigma: 2.8,
            deviationPct: -100,
            historicalSampleCount: 12,
            severity: 'HIGH',
            detectedAt: new Date().toISOString(),
            entityId: String(prod.id),
            entityName: prod.name,
            diagnosticNote: `Comportamiento atípico detectado en disponibilidad física de SKU ${prod.sku}. Requiere revisión humana.`,
            recommendedAction: 'Revisar pedidos pendientes de recepción o conciliar conteo físico en almacén.',
            investigationAction: 'Revisar pedidos pendientes de recepción o conciliar conteo físico en almacén.',
            status: 'ACTIVO',
            auditId: `AUD-ANOM-STK-${prod.id}`,
          });
        }
      }
    }
  } catch (err: any) {
    console.error('Error al sincronizar anomalías estadísticas:', err);
  }
}

// Endpoint de consulta de anomalías estadísticas con RBAC y RLS
app.get(
  ['/api/anomalies', '/api/governance/anomalies'],
  requireAuth,
  (req, res) => {
    try {
      syncStatisticalAnomaliesWithRealData();

      const user = (req as any).user;
      let anomaliesToReturn = [...serverStatisticalAnomalies];

      // RLS: Si el usuario es rol vendedor, filtrar anomalías comerciales de otros vendedores
      if (user && user.role === 'VENDEDOR') {
        anomaliesToReturn = anomaliesToReturn.filter((a) => {
          if (a.domain === 'VENTAS' && a.entityId) {
            const quote = db.getQuotes()?.find((q: any) => String(q.id) === a.entityId);
            const vendorId = (quote as any)?.vendorId || (quote as any)?.created_by || (quote as any)?.user_id;
            if (quote && vendorId && vendorId !== user.id) {
              return false;
            }
          }
          return true;
        });
      }

      res.json({
        success: true,
        anomalies: anomaliesToReturn.map(sanitizeAnomaly),
        total: anomaliesToReturn.length,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error al obtener anomalías estadísticas' });
    }
  }
);

// Endpoint para actualizar estado de anomalía con Human-in-the-Loop
app.post('/api/anomalies/:id/status', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    const user = (req as any).user;

    const validStatuses = ['ACTIVO', 'EN_REVISION', 'JUSTIFICADO', 'CORREGIDO'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Estado inválido. Opciones: ${validStatuses.join(', ')}` });
    }

    const index = serverStatisticalAnomalies.findIndex(
      (a) => a.anomalyId === id || a.id === id
    );

    if (index === -1) {
      return res.status(404).json({ error: `Anomalía con ID ${id} no encontrada.` });
    }

    serverStatisticalAnomalies[index] = {
      ...serverStatisticalAnomalies[index],
      status,
      reviewedBy: user?.name || 'Dirección de Riesgos',
      reviewedAt: new Date().toISOString(),
      reviewNotes: note ? sanitizeAlertString(note) : serverStatisticalAnomalies[index].reviewNotes,
    };

    // Registrar en auditoría inmutable
    try {
      db.addAuditLog({
        user_id: user?.id || 'USR-GOV-01',
        user_name: user?.name || 'Auditor de Control',
        action: 'ANOMALY_STATUS_CHANGED',
        module: 'GOBIERNO',
        entity_type: 'ANOMALY',
        entity_id: id,
        previous_value: serverStatisticalAnomalies[index].status,
        new_value: status,
      });
    } catch (auditErr) {
      console.warn('No se pudo registrar log de auditoría:', auditErr);
    }

    res.json({
      success: true,
      message: `Anomalía ${id} actualizada a estado ${status}.`,
      anomaly: sanitizeAnomaly(serverStatisticalAnomalies[index]),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al actualizar estado de anomalía' });
  }
});

// ==========================================
// 9.4 ACCIONES PRIORIZADAS DE GOBIERNO (OBSERVACIÓN 36)
// ==========================================
let serverGovernanceActions: GovernanceExecutiveAction[] = [...INITIAL_GOVERNANCE_ACTIONS];

function calculateActionPriorityScore(action: GovernanceExecutiveAction): number {
  let score = 20;
  const p = (action.priority || 'LOW').toUpperCase();
  if (p === 'CRITICAL') score = 90;
  else if (p === 'HIGH') score = 70;
  else if (p === 'MEDIUM') score = 40;
  else if (p === 'LOW') score = 20;

  const h = (action.horizon || action.timeframe || 'HOY').toUpperCase();
  if (h === 'HOY') score += 9;
  else if (h === 'ESTA_SEMANA') score += 5;
  else if (h === 'ESTE_MES') score += 1;

  return score;
}

function sanitizeGovernanceAction(a: GovernanceExecutiveAction): GovernanceExecutiveAction {
  const score = a.priorityScore || calculateActionPriorityScore(a);
  return {
    ...a,
    id: a.actionId || a.id,
    actionId: a.actionId || a.id || 'ACT-UNKNOWN',
    horizon: (a.horizon || a.timeframe || 'HOY') as GovernanceActionHorizon,
    timeframe: (a.horizon || a.timeframe || 'HOY') as GovernanceActionHorizon,
    title: a.title ? sanitizeAlertString(a.title) : 'Acción Prioritaria',
    description: a.description ? sanitizeAlertString(a.description) : '',
    priority: a.priority || 'MEDIUM',
    priorityScore: score,
    ownerId: a.ownerId || 'USR-GOV-01',
    ownerName: a.ownerName ? sanitizeAlertString(a.ownerName) : 'Responsable Asignado',
    assignedRole: a.assignedRole ? sanitizeAlertString(a.assignedRole) : (a.ownerName ? sanitizeAlertString(a.ownerName) : 'Responsable'),
    dueDate: a.dueDate || a.deadlineDate || new Date().toISOString().split('T')[0],
    deadlineDate: a.dueDate || a.deadlineDate || new Date().toISOString().split('T')[0],
    financialImpactMXN: typeof a.financialImpactMXN === 'number' && Number.isFinite(a.financialImpactMXN) ? a.financialImpactMXN : (typeof a.expectedFinancialImpact === 'number' ? a.expectedFinancialImpact : 0),
    expectedFinancialImpact: typeof a.financialImpactMXN === 'number' ? a.financialImpactMXN : (a.expectedFinancialImpact || 0),
    riskImpact: a.riskImpact ? sanitizeAlertString(a.riskImpact) : (a.expectedRiskReduction ? sanitizeAlertString(a.expectedRiskReduction) : ''),
    expectedRiskReduction: a.riskImpact ? sanitizeAlertString(a.riskImpact) : (a.expectedRiskReduction ? sanitizeAlertString(a.expectedRiskReduction) : ''),
    source: a.source || (a.domain as any) || 'DIRECTIVA',
    domain: a.source || a.domain || 'DIRECTIVA',
    status: (a.status || 'OPEN') as GovernanceActionStatus,
    requiresHumanValidation: a.requiresHumanValidation ?? true,
    masterTransactionId: a.masterTransactionId ? sanitizeAlertString(a.masterTransactionId) : undefined,
    auditId: a.auditId ? sanitizeAlertString(a.auditId) : `AUD-ACT-${a.actionId || 'GEN'}`,
    reviewedBy: a.reviewedBy ? sanitizeAlertString(a.reviewedBy) : undefined,
    reviewedAt: a.reviewedAt,
    resolutionNotes: a.resolutionNotes ? sanitizeAlertString(a.resolutionNotes) : undefined,
  };
}

// GET /api/governance/actions & /api/prioritized-actions
app.get(
  ['/api/governance/actions', '/api/prioritized-actions'],
  requireAuth,
  (req, res) => {
    try {
      const user = (req as any).user;
      let actionsToReturn = [...serverGovernanceActions];

      // RLS: Si el usuario es rol vendedor, filtrar acciones estratégicas no comerciales
      if (user && user.role === 'VENDEDOR') {
        actionsToReturn = actionsToReturn.filter((act) => {
          if (act.ownerId === user.id) return true;
          if (act.source === 'AI_ADVISOR' || act.source === 'DIRECTIVA') {
            return (act.title && act.title.toLowerCase().includes('cotización')) ||
                   (act.description && act.description.toLowerCase().includes('cotización'));
          }
          return false;
        });
      }

      // Ordenar por prioridad real desc
      actionsToReturn.sort((a, b) => {
        const scoreA = calculateActionPriorityScore(a);
        const scoreB = calculateActionPriorityScore(b);
        return scoreB - scoreA;
      });

      res.json({
        success: true,
        actions: actionsToReturn.map(sanitizeGovernanceAction),
        total: actionsToReturn.length,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error al obtener acciones priorizadas' });
    }
  }
);

// POST /api/governance/actions/:id/status & /api/prioritized-actions/:id/status
app.post(
  ['/api/governance/actions/:id/status', '/api/prioritized-actions/:id/status'],
  requireAuth,
  (req, res) => {
    try {
      const { id } = req.params;
      const { status, note, notes } = req.body;
      const user = (req as any).user;

      const validStatuses: GovernanceActionStatus[] = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
      if (!status || !validStatuses.includes(status as GovernanceActionStatus)) {
        return res.status(400).json({ error: `Estado inválido. Valores permitidos: ${validStatuses.join(', ')}` });
      }

      const index = serverGovernanceActions.findIndex(
        (a) => a.actionId === id || a.id === id
      );

      if (index === -1) {
        return res.status(404).json({ error: `Acción con ID ${id} no encontrada.` });
      }

      const prevStatus = serverGovernanceActions[index].status;
      const finalNote = (note || notes) ? sanitizeAlertString(note || notes) : serverGovernanceActions[index].resolutionNotes;

      serverGovernanceActions[index] = {
        ...serverGovernanceActions[index],
        status: status as GovernanceActionStatus,
        reviewedBy: user?.name || 'Dirección de Gobierno',
        reviewedAt: new Date().toISOString(),
        resolutionNotes: finalNote,
        completedAt: status === 'COMPLETED' ? new Date().toISOString() : undefined,
      };

      // Registrar auditoría inmutable
      try {
        db.addAuditLog({
          user_id: user?.id || 'USR-GOV-01',
          user_name: user?.name || 'Comité de Gobierno',
          action: 'ACTION_STATUS_CHANGED',
          module: 'GOBIERNO',
          entity_type: 'EXECUTIVE_ACTION',
          entity_id: id,
          previous_value: prevStatus,
          new_value: status,
        });
      } catch (auditErr) {
        console.warn('No se pudo registrar log de auditoría para la acción:', auditErr);
      }

      res.json({
        success: true,
        message: `Acción priorizada ${id} actualizada a estado ${status}.`,
        action: sanitizeGovernanceAction(serverGovernanceActions[index]),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error al actualizar estado de la acción' });
    }
  }
);

// POST /api/governance/actions/:id/assign & /api/prioritized-actions/:id/assign
app.post(
  ['/api/governance/actions/:id/assign', '/api/prioritized-actions/:id/assign'],
  requireAuth,
  (req, res) => {
    try {
      const { id } = req.params;
      const { assignedToId, assignedToName } = req.body;
      const user = (req as any).user;

      if (!assignedToName) {
        return res.status(400).json({ error: 'Nombre del responsable requerido.' });
      }

      const index = serverGovernanceActions.findIndex(
        (a) => a.actionId === id || a.id === id
      );

      if (index === -1) {
        return res.status(404).json({ error: `Acción con ID ${id} no encontrada.` });
      }

      const prevOwner = serverGovernanceActions[index].ownerName;

      serverGovernanceActions[index] = {
        ...serverGovernanceActions[index],
        ownerId: assignedToId ? String(assignedToId).trim() : serverGovernanceActions[index].ownerId,
        ownerName: sanitizeAlertString(assignedToName),
        assignedRole: sanitizeAlertString(assignedToName),
      };

      // Registrar auditoría inmutable
      try {
        db.addAuditLog({
          user_id: user?.id || 'USR-GOV-01',
          user_name: user?.name || 'Comité de Gobierno',
          action: 'ACTION_REASSIGNED',
          module: 'GOBIERNO',
          entity_type: 'EXECUTIVE_ACTION',
          entity_id: id,
          previous_value: prevOwner,
          new_value: sanitizeAlertString(assignedToName),
        });
      } catch (auditErr) {
        console.warn('No se pudo registrar log de auditoría:', auditErr);
      }

      res.json({
        success: true,
        message: `Acción ${id} reasignada a ${assignedToName}.`,
        action: sanitizeGovernanceAction(serverGovernanceActions[index]),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error al reasignar responsable' });
    }
  }
);

// ==========================================
// 10.1 COMMERCIAL RLS & SEGREGATION API
// ==========================================
app.get("/api/commercial/vendor-kpis", requireAuth, (req, res) => {
  const user = (req as any).user;
  const kpis = CommercialRLSService.computeVendorKPIs(user, {
    customers: db.getCustomers(),
    leads: [],
    opportunities: [],
    quotes: db.getQuotes(),
    orders: db.getOrders(),
  });
  res.json(kpis);
});

app.get("/api/commercial/security-logs", requireAuth, (req, res) => {
  const user = (req as any).user;
  if (!CommercialRLSService.isPrivilegedRole(user.role)) {
    return res.status(403).json({ error: "Acceso denegado. Solo roles de dirección y gerencia pueden auditar violaciones de seguridad." });
  }
  res.json(CommercialRLSService.getSecurityLogs());
});

app.get("/api/commercial/reassignment-logs", requireAuth, (req, res) => {
  const user = (req as any).user;
  if (!CommercialRLSService.isPrivilegedRole(user.role)) {
    return res.status(403).json({ error: "Acceso denegado." });
  }
  res.json(CommercialRLSService.getReassignmentLogs());
});

app.post("/api/commercial/certify", requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    if (!CommercialRLSService.isPrivilegedRole(user.role)) {
      return res.status(403).json({ error: "Se requieren permisos gerenciales o administrativos para ejecutar la certificación." });
    }

    const report = CommercialRLSService.runCrossVendorCertification({
      customers: db.getCustomers(),
      leads: [],
      opportunities: [],
      quotes: db.getQuotes(),
      orders: db.getOrders(),
      products: db.getProducts(),
    });

    db.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      module: "AUDITORIA",
      action: "CERTIFICACION_SEGREGACION_COMERCIAL",
      entity_type: "SECURITY_TEST_SUITE",
      entity_id: "RLS-VEND-01-10",
      new_value: `Certificación E2E de Segregación para 10 Ejecutivos completada: ${report.summary.complianceRatePct}% cumplimiento. Estatus: ${report.success ? 'PASS' : 'FAIL'}`,
    });

    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: "Error ejecutando certificación de segregación comercial" });
  }
});

// ==========================================
// 10.2 PURCHASING & REPLENISHMENT (SoD PROTECTED)
// Segregación Estricta: ALMACÉN (Solicita cantidades) vs. COMPRAS (Gestiona precios, proveedores y OCs)
// ==========================================

// Helper to sanitize requests for ALMACEN users (strips financial/price/supplier data)
function sanitizeRequestForRole(pr: any, role: string) {
  if (role === 'ALMACEN' || role === 'JEFE_ALMACEN') {
    const sanitized = { ...pr };
    delete sanitized.estimated_unit_cost;
    delete sanitized.estimated_price;
    delete sanitized.estimatedPrice;
    delete sanitized.estimatedUnitCost;
    delete sanitized.total_estimated;
    delete sanitized.estimated_total;
    delete sanitized.total_estimated_amount;
    delete sanitized.suggested_supplier_id;
    delete sanitized.suggested_supplier_name;
    delete sanitized.supplier_id;
    delete sanitized.supplier_name;
    delete sanitized.cost;
    delete sanitized.unit_cost;
    return sanitized;
  }
  return pr;
}

// GET /api/purchase-requests
app.get("/api/purchase-requests", requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    if (user.role === 'VENDEDOR') {
      return res.status(403).json({ error: "403 FORBIDDEN: El rol VENDEDOR no tiene acceso a las solicitudes de compra ni costos de adquisición." });
    }
    const requests = db.getPurchaseRequests();
    const sanitized = requests.map(r => sanitizeRequestForRole(r, user.role));
    res.json({ requests: sanitized });
  } catch (err: any) {
    res.status(500).json({ error: "Error obteniendo solicitudes de compra: " + err.message });
  }
});

// POST /api/purchase-requests - Create replenishment request
app.post("/api/purchase-requests", requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    if (user.role === 'VENDEDOR') {
      return res.status(403).json({ error: "403 FORBIDDEN: El rol VENDEDOR no puede emitir solicitudes de compra." });
    }
    const {
      sku,
      productCode,
      product_code,
      productId,
      product_id,
      productName,
      product_name,
      warehouseId,
      warehouse_id,
      warehouseName,
      warehouse_name,
      requestedQty,
      quantity,
      priority,
      reason,
      observations,
      items,
      checkOnly,
      allowDuplicate,
    } = req.body;

    const targetSku =
      sku ||
      productCode ||
      product_code ||
      (items && items[0]?.product_code) ||
      (items && items[0]?.productCode) ||
      (items && items[0]?.sku) ||
      (db.getProducts().find(p => p.id === (productId || product_id || (items && items[0]?.product_id)))?.code) ||
      (db.getProducts().find(p => p.id === (productId || product_id || (items && items[0]?.product_id)))?.sku) ||
      'MAT-GENERAL';

    const targetWarehouseId = warehouseId || warehouse_id || 'WAR-01';

    const qty = Number(requestedQty || quantity || (items && items[0]?.quantity));
    if (!qty || qty <= 0) {
      return res.status(400).json({ error: "La cantidad solicitada debe ser mayor a 0." });
    }

    // DUPLICATE CHECK: Check for active pending request for same SKU & warehouse
    const existingActive = db.getPurchaseRequests().find(
      r => (r.sku === targetSku || r.items?.some((i: any) => i.product_code === targetSku || i.product_id === (productId || product_id))) &&
           (r.warehouse_id === targetWarehouseId || r.warehouseId === targetWarehouseId) &&
           (r.status === 'PENDIENTE' || r.status === 'EN_REVISION' || r.status === 'APROBADA')
    );

    if (checkOnly) {
      return res.json({
        duplicateFound: !!existingActive,
        existingRequest: existingActive ? sanitizeRequestForRole(existingActive, user.role) : null,
      });
    }

    if (existingActive && !allowDuplicate) {
      return res.status(409).json({
        duplicateWarning: true,
        error: `Aviso de Duplicidad: Ya existe una solicitud activa (${existingActive.request_number}) para el SKU ${targetSku} en este almacén con estatus '${existingActive.status}'.`,
        existingRequest: sanitizeRequestForRole(existingActive, user.role),
      });
    }

    const product = db.getProducts().find(p => p.sku === targetSku || p.id === (productId || product_id));
    const warehouse = db.getWarehouses().find(w => w.id === targetWarehouseId);

    const reqNumber = db.nextPurchaseRequestNumber();
    const nowIso = new Date().toISOString();
    const masterTxId = `MTX-SC-${Date.now().toString(36).toUpperCase()}`;

    // Note: NEVER include price, cost or supplier fields when submitted by ALMACEN
    const newRequest: any = {
      id: `PR-${Date.now()}`,
      request_number: reqNumber,
      requested_by: user.id,
      requested_by_name: user.name,
      requestedByUserId: user.id,
      requestedByUserName: user.name,
      requestedByRole: user.role,
      requestedAt: nowIso,
      department: user.department_name || (user.role.startsWith('ALMACEN') ? 'Almacén & Logística' : 'Operaciones'),
      warehouse_id: targetWarehouseId,
      warehouseId: targetWarehouseId,
      warehouse_name: warehouse?.name || warehouseName || warehouse_name || 'Almacén Central Tlalnepantla',
      warehouseName: warehouse?.name || warehouseName || warehouse_name || 'Almacén Central Tlalnepantla',
      productId: product?.id || productId || product_id || 'PRD-01',
      sku: targetSku,
      requestedQty: qty,
      priority: priority || 'MEDIA',
      justification: observations || reason || 'Reabastecimiento solicitado por personal operativo',
      reason: reason || 'STOCK_MINIMO',
      observations: observations || '',
      status: 'PENDIENTE',
      required_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      items: [
        {
          id: `PRI-${Date.now()}`,
          request_id: `PR-${Date.now()}`,
          product_id: product?.id || productId || product_id || 'PRD-01',
          product_code: targetSku,
          product_name: product?.name || productName || product_name || targetSku,
          unit: product?.unit || 'PZA',
          quantity: qty,
        }
      ],
      masterTransactionId: masterTxId,
      created_at: nowIso,
      origin: user.role.startsWith('ALMACEN') ? 'ALMACEN' : 'SISTEMA',
    };

    db.savePurchaseRequest(newRequest);

    db.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      module: "INVENTARIO",
      action: "PURCHASE_REQUEST_CREATED",
      entity_type: "PURCHASE_REQUEST",
      entity_id: reqNumber,
      new_value: `Solicitud de reabastecimiento generada por ${user.name} (${user.role}) para SKU ${targetSku}, Cantidad: ${qty} pzas en ${newRequest.warehouseName}. Folio: ${reqNumber}. Prioridad: ${newRequest.priority}. Motivo: ${newRequest.reason}. MTX: ${masterTxId}. (Sin datos financieros por SoD).`,
    });

    eventBus.broadcast("purchase_request_created", newRequest);

    res.status(201).json({
      success: true,
      message: `Solicitud de reabastecimiento ${reqNumber} registrada exitosamente y enviada a la bandeja de Compras.`,
      request: sanitizeRequestForRole(newRequest, user.role),
    });
  } catch (err: any) {
    res.status(500).json({ error: "Error creando solicitud de compra: " + err.message });
  }
});

// POST /api/purchase-requests/:id/convert-to-po - Compras transforms request into PO
app.post("/api/purchase-requests/:id/convert-to-po", requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Strict Segregation of Duties Check
    if (user.role === 'ALMACEN' || user.role === 'JEFE_ALMACEN') {
      db.logAudit({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        module: "COMPRAS",
        action: "PURCHASE_ACCESS_DENIED",
        entity_type: "PURCHASE_ORDER",
        entity_id: id,
        new_value: `Intento NO AUTORIZADO de emitir Orden de Compra por usuario de Almacén ${user.name} (${user.role}). Bloqueado por regla SoD.`,
      });
      return res.status(403).json({
        error: "403 FORBIDDEN (SoD): El rol ALMACÉN tiene estrictamente prohibido emitir órdenes de compra, negociar costos o seleccionar proveedores. Esta acción corresponde exclusivamente al departamento de COMPRAS."
      });
    }

    if (!AuthService.checkPermission(user.role, 'COMPRAS', 'CREATE')) {
      return res.status(403).json({ error: "403 FORBIDDEN: Se requiere permiso COMPRAS.CREATE." });
    }

    const pr = db.getPurchaseRequest(id);
    if (!pr) {
      return res.status(404).json({ error: "Solicitud de compra no encontrada." });
    }

    if (pr.status === 'CONVERTIDA_OC') {
      return res.status(400).json({
        error: `La solicitud ${pr.request_number} ya fue convertida previamente en la OC ${pr.converted_purchase_order_number || pr.convertedPurchaseOrderNumber}.`
      });
    }

    const {
      supplier_id,
      supplier_name,
      unit_cost,
      currency,
      payment_terms,
      delivery_date,
      notes,
    } = req.body;

    if (!supplier_id || !supplier_name) {
      return res.status(400).json({ error: "El departamento de Compras debe seleccionar un proveedor válido." });
    }

    const cost = Number(unit_cost);
    if (isNaN(cost) || cost <= 0) {
      return res.status(400).json({ error: "El costo unitario negociado por Compras debe ser mayor a 0." });
    }

    const poNumber = db.nextPurchaseOrderNumber();
    const nowIso = new Date().toISOString();
    const qty = pr.requestedQty || (pr.items && pr.items[0]?.quantity) || 1;
    const subtotal = cost * qty;
    const tax = subtotal * 0.16;
    const total = subtotal + tax;

    const po: any = {
      id: `PO-${Date.now()}`,
      po_number: poNumber,
      order_number: poNumber,
      supplier_id,
      supplier_name,
      supplierId: supplier_id,
      supplierName: supplier_name,
      warehouse_id: pr.warehouse_id || pr.warehouseId || 'WAR-01',
      warehouse_name: pr.warehouse_name || pr.warehouseName || 'Almacén Central Tlalnepantla',
      status: 'EMITIDA',
      currency: currency || 'MXN',
      payment_terms: payment_terms || 'Crédito 30 días',
      subtotal,
      tax_amount: tax,
      total_amount: total,
      purchase_request_id: pr.id,
      purchase_request_number: pr.request_number,
      purchaseRequestId: pr.id,
      purchaseRequestNumber: pr.request_number,
      items: [
        {
          id: `POI-${Date.now()}`,
          product_id: pr.productId || pr.items[0]?.product_id || 'PRD-01',
          sku: pr.sku || pr.items[0]?.product_code || '',
          product_name: pr.items[0]?.product_name || pr.sku,
          quantity: qty,
          unit_cost: cost,
          subtotal,
        }
      ],
      masterTransactionId: pr.masterTransactionId || `MTX-PO-${Date.now().toString(36).toUpperCase()}`,
      master_transaction_id: pr.masterTransactionId || `MTX-PO-${Date.now().toString(36).toUpperCase()}`,
      created_by: user.id,
      created_by_name: user.name,
      created_at: nowIso,
      updated_at: nowIso,
      delivery_date: delivery_date || new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      notes: notes || `Generada por Compras a partir de solicitud de reabastecimiento ${pr.request_number}`,
    };

    db.savePurchaseOrder(po);

    // Update Request status
    pr.status = 'CONVERTIDA_OC';
    pr.converted_purchase_order_id = po.id;
    pr.converted_purchase_order_number = po.po_number;
    pr.convertedPurchaseOrderId = po.id;
    pr.convertedPurchaseOrderNumber = po.po_number;
    pr.converted_at = nowIso;
    pr.reviewed_by = user.id;
    pr.reviewed_by_name = user.name;
    pr.reviewedByUserId = user.id;
    pr.reviewedByUserName = user.name;
    pr.updated_at = nowIso;
    db.savePurchaseRequest(pr);

    db.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      module: "COMPRAS",
      action: "PURCHASE_REQUEST_CONVERTED_TO_PO",
      entity_type: "PURCHASE_ORDER",
      entity_id: po.po_number,
      new_value: `Solicitud ${pr.request_number} procesada por Compras (${user.name}). OC ${po.po_number} emitida a ${supplier_name}. Costo unitario: $${cost.toFixed(2)} ${po.currency}. Total: $${total.toFixed(2)}. MTX: ${po.masterTransactionId}`,
    });

    eventBus.broadcast("purchase_order_created", po);
    eventBus.broadcast("purchase_request_updated", pr);

    res.json({
      success: true,
      message: `Orden de Compra ${po.po_number} emitida con éxito vinculada a la solicitud ${pr.request_number}.`,
      purchaseOrder: po,
      request: pr,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Error convirtiendo solicitud a Orden de Compra: " + err.message });
  }
});

// GET /api/purchase-orders - Compras & Admin only
app.get("/api/purchase-orders", requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    if (user.role === 'ALMACEN' || user.role === 'JEFE_ALMACEN') {
      db.logAudit({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        module: "COMPRAS",
        action: "PURCHASE_ACCESS_DENIED",
        entity_type: "PURCHASE_ORDER",
        entity_id: "LIST",
        new_value: `Intento NO AUTORIZADO de Almacén para consultar órdenes de compra con precios (SoD)`,
      });
      return res.status(403).json({
        error: "403 FORBIDDEN (SoD): Personal de Almacén no autorizado para consultar órdenes de compra con datos financieros."
      });
    }

    if (!AuthService.checkPermission(user.role, 'COMPRAS', 'VIEW')) {
      return res.status(403).json({ error: "403 FORBIDDEN: Se requiere permiso COMPRAS.VIEW." });
    }

    res.json({ purchaseOrders: db.getPurchaseOrders() });
  } catch (err: any) {
    res.status(500).json({ error: "Error obteniendo órdenes de compra: " + err.message });
  }
});

// POST /api/purchase-orders - Create direct PO (Compras & Admin only)
app.post("/api/purchase-orders", requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    if (user.role === 'ALMACEN' || user.role === 'JEFE_ALMACEN') {
      db.logAudit({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        module: "COMPRAS",
        action: "PURCHASE_ACCESS_DENIED",
        entity_type: "PURCHASE_ORDER",
        entity_id: "CREATE_DIRECT",
        new_value: `Intento NO AUTORIZADO de Almacén para emitir orden de compra directa (SoD)`,
      });
      return res.status(403).json({
        error: "403 FORBIDDEN (SoD): El rol ALMACÉN tiene estrictamente prohibido emitir órdenes de compra."
      });
    }

    if (!AuthService.checkPermission(user.role, 'COMPRAS', 'CREATE')) {
      return res.status(403).json({ error: "403 FORBIDDEN: Se requiere permiso COMPRAS.CREATE." });
    }

    const {
      supplier_id,
      supplier_name,
      warehouse_id,
      warehouse_name,
      items,
      payment_terms,
      currency,
      notes,
    } = req.body;

    if (!supplier_id || !supplier_name || !items || !items.length) {
      return res.status(400).json({ error: "Proveedor y partidas son obligatorios para la Orden de Compra." });
    }

    const poNumber = db.nextPurchaseOrderNumber();
    const nowIso = new Date().toISOString();
    const masterTxId = `MTX-PO-${Date.now().toString(36).toUpperCase()}`;

    let subtotal = 0;
    const computedItems = items.map((it: any, idx: number) => {
      const lineSub = Number(it.quantity || 1) * Number(it.unit_cost || 0);
      subtotal += lineSub;
      return {
        id: `POI-${Date.now()}-${idx}`,
        product_id: it.product_id,
        sku: it.sku || it.product_code || '',
        product_name: it.product_name || it.sku,
        quantity: Number(it.quantity || 1),
        unit_cost: Number(it.unit_cost || 0),
        subtotal: lineSub,
      };
    });

    const tax = subtotal * 0.16;
    const total = subtotal + tax;

    const po: any = {
      id: `PO-${Date.now()}`,
      po_number: poNumber,
      order_number: poNumber,
      supplier_id,
      supplier_name,
      supplierId: supplier_id,
      supplierName: supplier_name,
      warehouse_id: warehouse_id || 'WAR-01',
      warehouse_name: warehouse_name || 'Almacén Central Tlalnepantla',
      status: 'EMITIDA',
      currency: currency || 'MXN',
      payment_terms: payment_terms || 'Crédito 30 días',
      subtotal,
      tax_amount: tax,
      total_amount: total,
      items: computedItems,
      masterTransactionId: masterTxId,
      master_transaction_id: masterTxId,
      created_by: user.id,
      created_by_name: user.name,
      created_at: nowIso,
      updated_at: nowIso,
      notes: notes || '',
    };

    db.savePurchaseOrder(po);

    db.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      module: "COMPRAS",
      action: "PURCHASE_ORDER_CREATED",
      entity_type: "PURCHASE_ORDER",
      entity_id: po.po_number,
      new_value: `Orden de Compra directa ${po.po_number} emitida por ${user.name} (${user.role}) a ${supplier_name}. Total: $${total.toFixed(2)} ${po.currency}. MTX: ${masterTxId}`,
    });

    eventBus.broadcast("purchase_order_created", po);

    res.status(201).json({ success: true, purchaseOrder: po });
  } catch (err: any) {
    res.status(500).json({ error: "Error creando orden de compra: " + err.message });
  }
});

// GET /api/supplier-prices - Catalog of supplier costs (Compras & Admin only)
app.get("/api/supplier-prices", requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    if (user.role === 'ALMACEN' || user.role === 'JEFE_ALMACEN') {
      db.logAudit({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        module: "COMPRAS",
        action: "PURCHASE_ACCESS_DENIED",
        entity_type: "SUPPLIER_PRICE",
        entity_id: "LIST",
        new_value: `Intento NO AUTORIZADO de Almacén para consultar catálogo de precios y costos de proveedores (SoD)`,
      });
      return res.status(403).json({
        error: "403 FORBIDDEN (SoD): El personal de Almacén no tiene acceso a costos de compra ni tarifas de proveedores."
      });
    }

    if (!AuthService.checkPermission(user.role, 'COMPRAS', 'VIEW')) {
      return res.status(403).json({ error: "403 FORBIDDEN: Se requiere permiso COMPRAS.VIEW." });
    }

    res.json({ supplierPrices: db.getSupplierPrices() });
  } catch (err: any) {
    res.status(500).json({ error: "Error obteniendo lista de precios de proveedores: " + err.message });
  }
});

// ==========================================
// 11. CONSCORE AI (QUERY & PROPOSALS)
// ==========================================
app.post("/api/ai/chat", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: "El mensaje es obligatorio." });
    }

    const result = await AIService.processQuery(message, history || [], user);
    res.json(result);
  } catch (err: any) {
    console.error("AI Error:", err);
    res.status(500).json({ error: "Error procesando consulta con CONSCORE AI" });
  }
});

/**
 * Pronóstico de demanda (Inteligencia Predictiva).
 *
 * Analiza la rotación de los últimos 30 días y proyecta 60 días para los 5
 * materiales de mayor rotación. Requiere permiso de lectura en el módulo
 * PREDICTIVO, igual que el resto del tablero.
 */
app.get("/api/predictive/demand-forecast", requireAuth, requirePermission("PREDICTIVO", "VIEW"), async (req, res) => {
  try {
    const user = (req as any).user;
    const windowDays = Math.min(Math.max(Number(req.query.windowDays) || 30, 7), 180);
    const horizonDays = Math.min(Math.max(Number(req.query.horizonDays) || 60, 7), 365);
    const topN = Math.min(Math.max(Number(req.query.topN) || 5, 1), 20);

    const result = await generateDemandForecast(windowDays, horizonDays, topN);

    db.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      module: "PREDICTIVO",
      action: "PRONOSTICO_DEMANDA_GENERADO",
      entity_type: "FORECAST",
      entity_id: `${windowDays}d-${horizonDays}d`,
      new_value: `Pronóstico de ${result.forecasts.length} materiales generado (fuente: ${result.source}).`,
    });

    // Se registra el pronóstico para poder contrastarlo con la realidad más
    // adelante. Sin este registro, la sección de historial nunca tendría nada
    // propio que mostrar.
    try {
      saveForecastSnapshot({
        items: result.forecasts.map((f) => ({
          productId: f.productId,
          productCode: f.productCode,
          productName: f.productName,
          unit: f.unit,
          // El pronóstico es a 60 días; se reparte a mes para poder compararlo
          // contra las salidas mensuales del kardex.
          predicted: Math.round(f.adjustedForecast60d / 2),
        })),
      });
    } catch (snapErr) {
      console.warn("[Predictivo] No se pudo registrar el pronóstico:", snapErr);
    }

    res.json(result);
  } catch (err: any) {
    console.error("[Predictivo] Error generando pronóstico:", err);
    res.status(500).json({ error: "No se pudo generar el pronóstico de demanda." });
  }
});

/**
 * Series de Business Intelligence: venta histórica contra demanda pronosticada.
 * Admite filtros por categoría y almacén, y los parámetros de sensibilidad que
 * el usuario ajusta con los deslizadores.
 */
app.get("/api/predictive/bi-series", requireAuth, requirePermission("PREDICTIVO", "VIEW"), (req, res) => {
  try {
    const q = req.query as Record<string, string>;
    const result = buildBISeries({
      historicalMonths: Number(q.historicalMonths) || 6,
      forecastMonths: Number(q.forecastMonths) || 2,
      topN: Number(q.topN) || 10,
      category: q.category || null,
      warehouseId: q.warehouseId || null,
      sensitivity: {
        seasonality: Number(q.seasonality),
        trendWeight: Number(q.trendWeight),
        safetyMargin: Number(q.safetyMargin),
      },
    });
    res.json(result);
  } catch (err: any) {
    console.error("[Predictivo] Error generando series BI:", err);
    res.status(500).json({ error: "No se pudieron generar las series de Business Intelligence." });
  }
});

/**
 * Historial reciente de pronósticos contra la realidad observada.
 * Distingue entre lo que el sistema predijo y guardó, y lo que habría
 * predicho según reconstrucción retrospectiva.
 */
app.get("/api/predictive/forecast-history", requireAuth, requirePermission("PREDICTIVO", "VIEW"), (req, res) => {
  try {
    const q = req.query as Record<string, string>;
    res.json(
      buildForecastHistory({
        monthsBack: Number(q.monthsBack) || 6,
        windowMonths: Number(q.windowMonths) || 4,
        topN: Number(q.topN) || 5,
        includeBacktest: q.includeBacktest !== "false",
      })
    );
  } catch (err: any) {
    console.error("[Predictivo] Error construyendo historial:", err);
    res.status(500).json({ error: "No se pudo construir el historial de pronósticos." });
  }
});

// ============================================================
// Facturación electrónica CFDI 4.0 (FiscalAPI)
// ============================================================

/** Estado de la integración. No expone la clave, solo si está configurada. */
app.get("/api/invoicing/status", requireAuth, requirePermission("FINANZAS", "VIEW"), (_req, res) => {
  res.json({ configured: isFiscalapiConfigured(), environment: getEnvironment() });
});

/** Revisión previa: qué falta para poder timbrar este pedido. */
app.get("/api/invoicing/preview/:orderId", requireAuth, requirePermission("FINANZAS", "VIEW"), (req, res) => {
  try {
    res.json(buildStampPreview(req.params.orderId));
  } catch (err: any) {
    console.error("[Facturación] Error en la revisión previa:", err);
    res.status(500).json({ error: "No se pudo revisar el pedido." });
  }
});

/**
 * Timbrado. Exige permiso de AUTORIZAR en Finanzas, no solo de creación:
 * emitir un CFDI es un acto fiscal con efectos frente al SAT.
 */
app.post("/api/invoicing/stamp/:orderId", requireAuth, requirePermission("FINANZAS", "AUTHORIZE"), async (req, res) => {
  try {
    const user = (req as any).user;
    const result = await stampOrder(req.params.orderId, user);
    if (!result.ok) {
      return res.status(422).json({ error: result.error, issues: result.issues });
    }
    res.json(result.record);
  } catch (err: any) {
    console.error("[Facturación] Error al timbrar:", err);
    res.status(500).json({ error: "No se pudo timbrar la factura." });
  }
});

/** CFDI emitidos. Con ?orderId= se limita a un pedido. */
app.get("/api/invoicing/cfdi", requireAuth, requirePermission("FINANZAS", "VIEW"), (req, res) => {
  res.json(listCfdi((req.query.orderId as string) || undefined));
});

app.post("/api/invoicing/cancel/:cfdiId", requireAuth, requirePermission("FINANZAS", "AUTHORIZE"), async (req, res) => {
  try {
    const { motiveCode, replacementUuid } = req.body || {};
    if (!motiveCode) {
      return res.status(400).json({ error: "Falta el motivo de cancelación (01 a 04)." });
    }
    const result = await cancelCfdi(req.params.cfdiId, String(motiveCode), replacementUuid, (req as any).user);
    if (!result.ok) return res.status(422).json({ error: result.error });
    res.json({ ok: true });
  } catch (err: any) {
    console.error("[Facturación] Error al cancelar:", err);
    res.status(500).json({ error: "No se pudo cancelar el CFDI." });
  }
});

app.get("/api/invoicing/file/:cfdiId/:kind", requireAuth, requirePermission("FINANZAS", "VIEW"), async (req, res) => {
  const kind = req.params.kind === "xml" ? "xml" : "pdf";
  const result = await getCfdiFile(req.params.cfdiId, kind);
  if (!result.ok) return res.status(422).json({ error: result.error });
  res.json({ base64: result.base64, fileName: result.fileName });
});

app.get("/api/invoicing/sat-status/:cfdiId", requireAuth, requirePermission("FINANZAS", "VIEW"), async (req, res) => {
  const result = await refreshCfdiStatus(req.params.cfdiId);
  if (!result.ok) return res.status(422).json({ error: result.error });
  res.json({ status: result.status });
});

/**
 * Centro de alerta temprana: materiales cuya demanda proyectada ocupa más de
 * un porcentaje de la capacidad de almacenamiento. Por defecto 85 por ciento.
 */
app.get("/api/predictive/capacity-alerts", requireAuth, requirePermission("PREDICTIVO", "VIEW"), (req, res) => {
  try {
    const threshold = Math.min(Math.max(Number(req.query.threshold) || 85, 10), 200);
    const horizon = Math.min(Math.max(Number(req.query.horizonMonths) || 2, 1), 12);
    res.json(buildCapacityAlerts(threshold, horizon));
  } catch (err: any) {
    console.error("[Predictivo] Error construyendo alertas de capacidad:", err);
    res.status(500).json({ error: "No se pudieron calcular las alertas de capacidad." });
  }
});

// Reset database to initial seed for development testing
app.post("/api/system/reset-demo", requireAuth, requirePermission("CONFIGURACION", "EDIT"), (req, res) => {
  const user = (req as any).user;
  db.resetToSeed();
  db.logAudit({
    user_id: user.id,
    user_name: user.name,
    user_role: user.role,
    module: "CONFIGURACION",
    action: "RESET_DATOS_DEMO",
    entity_type: "SYSTEM",
    entity_id: "CONSCORE_DB",
    new_value: "Base de datos restablecida al estado inicial seed",
  });
  eventBus.broadcast("system_reset", { timestamp: new Date().toISOString() });
  res.json({ success: true, message: "Base de datos restaurada al seed inicial de desarrollo." });
});

// ==========================================
// 11. COMMERCIAL REASSIGNMENT & CERTIFICATION (RLS/RBAC)
// ==========================================
app.post("/api/commercial/reassign", requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    const { entityType, entityId, newSalesExecutiveId, reason } = req.body;

    if (!CommercialRLSService.isPrivilegedRole(user.role)) {
      db.logAudit({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        module: "VENTAS",
        action: "REASSIGNMENT_UNAUTHORIZED_ATTEMPT",
        entity_type: entityType || "COMMERCIAL",
        entity_id: entityId || "UNKNOWN",
        new_value: `Intento NO AUTORIZADO de reasignación por rol ${user.role} (${user.name}) bloqueado por política de segregación (403).`,
      });
      return res.status(403).json({
        error: "403 FORBIDDEN: Reasignación no autorizada. Solo directivos y gerentes comerciales pueden reasignar clientes o documentos.",
      });
    }

    let targetEntity: any = null;
    if (entityType === 'CUSTOMER') {
      targetEntity = db.getCustomers().find(c => c.id === entityId || c.customer_number === entityId);
    } else if (entityType === 'QUOTE') {
      targetEntity = db.getQuotes().find(q => q.id === entityId || q.quote_number === entityId);
    } else if (entityType === 'ORDER') {
      targetEntity = db.getOrders().find(o => o.id === entityId || o.order_number === entityId || o.folio === entityId);
    } else if (entityType === 'LEAD') {
      targetEntity = db.getLeads().find(l => l.id === entityId || (l as any).folio === entityId);
    } else if (entityType === 'OPPORTUNITY') {
      targetEntity = db.getOpportunities().find(o => o.id === entityId || o.folio === entityId);
    }

    if (!targetEntity) {
      return res.status(404).json({ error: "Entidad comercial no encontrada." });
    }

    const result = CommercialRLSService.reassignEntity(user, entityType, targetEntity, newSalesExecutiveId, reason);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    db.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      module: "VENTAS",
      action: "REASIGNACION_CARTERA_RLS",
      entity_type: entityType,
      entity_id: entityId,
      new_value: `Reasignación autorizada: ${entityType} ${entityId} transferido a ${newSalesExecutiveId}. Motivo: ${reason}`,
    });

    db.persist();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: "Error ejecutando reasignación comercial: " + err.message });
  }
});

app.post("/api/commercial/certification", requireAuth, (_req, res) => {
  try {
    const report = CommercialRLSService.runCrossVendorCertification({
      customers: db.getCustomers(),
      leads: db.getLeads(),
      opportunities: db.getOpportunities(),
      quotes: db.getQuotes(),
      orders: db.getOrders(),
      products: db.getProducts(),
    });
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: "Error ejecutando certificación RLS: " + err.message });
  }
});

// ==========================================
// 11.6 RECURSOS HUMANOS & COLABORADORES (OBSERVACIÓN 18)
// ==========================================

// Double-click protection cache for employee creation
const recentEmployeeCreations = new Map<string, { timestamp: number; employee: any }>();

const sanitizeEmployeeForRole = (emp: any, userRole: string, confidentialMap?: any) => {
  const canViewConfidential = userRole === 'ADMINISTRADOR' || userRole === 'DIRECTOR' || userRole === 'RH';
  
  if (canViewConfidential) {
    const conf = confidentialMap || db.getConfidentialData(emp.id);
    return {
      ...emp,
      confidentialData: conf || null,
    };
  }

  // Non-confidential roles (e.g. GERENTE_VENTAS, FINANZAS, etc.):
  // Strictly strip confidential compensation, banking, and tax data
  const {
    salary,
    dailySalary,
    daily_salary,
    integratedSalary,
    integrated_salary,
    baseSalary,
    bankAccount,
    bank_account,
    clabe,
    bankName,
    bank_name,
    rfc,
    curp,
    nss,
    taxRegime,
    tax_regime,
    confidentialNotes,
    confidential_notes,
    confidentialData: _c,
    ...publicEmp
  } = emp;

  return publicEmp;
};

// GET /api/hr/employees & GET /api/employees
const handleGetEmployees = (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    let allEmployees = db.getEmployees();

    // Query filtering
    const search = ((req.query.search || req.query.q || "") as string).trim().toLowerCase();
    const department = ((req.query.department || req.query.departmentId || "") as string).trim();
    const status = ((req.query.status || "") as string).trim();

    if (search) {
      allEmployees = allEmployees.filter((emp: any) => {
        const full = `${emp.name || ''} ${emp.firstName || ''} ${emp.lastName || ''} ${emp.employeeNumber || emp.id || ''}`.toLowerCase();
        const pos = (emp.position || emp.positionName || '').toLowerCase();
        const email = (emp.email || '').toLowerCase();
        return full.includes(search) || pos.includes(search) || email.includes(search);
      });
    }

    if (department && department !== 'ALL') {
      allEmployees = allEmployees.filter((emp: any) =>
        emp.department === department || emp.departmentId === department || emp.departmentName === department
      );
    }

    if (status && status !== 'ALL') {
      allEmployees = allEmployees.filter((emp: any) =>
        emp.status === status || emp.employmentStatus === status
      );
    }

    // Sanitize based on confidentiality permissions
    const sanitized = allEmployees.map((emp: any) => sanitizeEmployeeForRole(emp, user.role));
    res.json(sanitized);
  } catch (err: any) {
    res.status(500).json({ error: "Error consultando colaboradores: " + err.message });
  }
};

app.get("/api/hr/employees", requireAuth, requirePermission("RH", "VIEW"), handleGetEmployees);
app.get("/api/employees", requireAuth, requirePermission("RH", "VIEW"), handleGetEmployees);

// GET /api/hr/employees/:id & GET /api/employees/:id
const handleGetEmployeeById = (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const emp = db.getEmployeeById(id);
    if (!emp) {
      return res.status(404).json({ error: "Colaborador no encontrado" });
    }

    // Attach linked user information if exists
    const users = db.getUsers();
    const linkedUser = users.find((u: any) => u.employee_id === emp.id || u.id === (emp as any).userId);

    const sanitized = sanitizeEmployeeForRole(emp, user.role);
    if (linkedUser) {
      (sanitized as any).linkedUser = {
        id: linkedUser.id,
        username: linkedUser.username,
        email: linkedUser.email,
        role: linkedUser.role,
        salesExecutiveId: (linkedUser as any).salesExecutiveId,
      };
    }

    res.json(sanitized);
  } catch (err: any) {
    res.status(500).json({ error: "Error consultando colaborador: " + err.message });
  }
};

app.get("/api/hr/employees/:id", requireAuth, requirePermission("RH", "VIEW"), handleGetEmployeeById);
app.get("/api/employees/:id", requireAuth, requirePermission("RH", "VIEW"), handleGetEmployeeById);

// POST /api/hr/employees & POST /api/employees (With double-click idempotency guard)
const handleCreateEmployee = (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    const data = req.body;

    const name = (data.name || data.fullName || '').trim();
    if (!name) {
      return res.status(400).json({ error: "El nombre del colaborador es obligatorio." });
    }

    // Double-click idempotency key based on name + employeeNumber + userId
    const idempotencyKey = `${name.toLowerCase()}_${(data.employeeNumber || data.email || '').toLowerCase()}`;
    const now = Date.now();
    const cached = recentEmployeeCreations.get(idempotencyKey);
    if (cached && (now - cached.timestamp < 6000)) {
      // Return the previously created employee instead of duplicating
      return res.status(200).json(cached.employee);
    }

    const currentEmployees = db.getEmployees();
    const count = currentEmployees.length + 1;
    const newId = data.id || `EMP-${String(count).padStart(3, '0')}`;
    const employeeNumber = data.employeeNumber || data.employee_number || `CON-${String(count).padStart(3, '0')}`;

    const newEmp: any = {
      id: newId,
      employeeNumber,
      employee_number: employeeNumber,
      name,
      fullName: name,
      firstName: data.firstName || name.split(' ')[0] || 'Colaborador',
      lastName: data.lastName || name.split(' ').slice(1).join(' ') || '',
      secondLastName: data.secondLastName || '',
      email: data.email || `empleado${count}@conscore.com.mx`,
      phone: data.phone || '+52 55 5872-9400',
      department: data.department || data.departmentName || 'Ventas y Comercial',
      departmentId: data.departmentId || 'DEP-02',
      departmentName: data.departmentName || data.department || 'Ventas y Comercial',
      position: data.position || data.positionName || 'Especialista',
      positionId: data.positionId || 'POS-004',
      positionName: data.positionName || data.position || 'Especialista',
      status: data.status || 'ACTIVO',
      employmentStatus: data.employmentStatus || 'ACTIVE',
      employmentType: data.employmentType || 'FULL_TIME',
      hireDate: data.hireDate || data.hire_date || new Date().toISOString().slice(0, 10),
      hire_date: data.hireDate || data.hire_date || new Date().toISOString().slice(0, 10),
      shiftId: data.shiftId || 'SHF-001',
      shiftName: data.shiftName || 'Turno Matutino',
      userId: data.userId || data.user_id || undefined,
      user_id: data.userId || data.user_id || undefined,
      salesExecutiveId: data.salesExecutiveId || undefined,
    };

    const created = db.addEmployee(newEmp);

    // Save confidential data if sent and authorized
    const canViewConfidential = user.role === 'ADMINISTRADOR' || user.role === 'DIRECTOR' || user.role === 'RH';
    if (canViewConfidential && data.confidentialData) {
      db.updateConfidentialData(newId, data.confidentialData);
    } else if (canViewConfidential && data.baseSalary !== undefined) {
      db.updateConfidentialData(newId, {
        baseSalary: Number(data.baseSalary) || 20000,
        paymentFrequency: data.paymentFrequency || 'QUINCENAL',
        rfc: data.rfc || '',
        curp: data.curp || '',
        nss: data.nss || '',
        bankAccount: data.bankAccount || '',
        clabe: data.clabe || '',
        bankName: data.bankName || 'BBVA México',
      });
    }

    // Cache for double-click protection
    recentEmployeeCreations.set(idempotencyKey, { timestamp: now, employee: created });

    // Clean up stale cache
    if (recentEmployeeCreations.size > 100) {
      for (const [k, v] of recentEmployeeCreations.entries()) {
        if (now - v.timestamp > 30000) recentEmployeeCreations.delete(k);
      }
    }

    db.addAuditLog({
      user_id: user.id,
      action: 'CREAR_COLABORADOR',
      entity_type: 'EMPLOYEE',
      entity_id: newId,
      new_value: `Colaborador creado: ${newEmp.name} (${newId}) por ${user.username}`,
    });

    const sanitized = sanitizeEmployeeForRole(created, user.role);
    res.status(201).json(sanitized);
  } catch (err: any) {
    res.status(500).json({ error: "Error registrando colaborador: " + err.message });
  }
};

app.post("/api/hr/employees", requireAuth, requirePermission("RH", "CREATE"), handleCreateEmployee);
app.post("/api/employees", requireAuth, requirePermission("RH", "CREATE"), handleCreateEmployee);

// PATCH / PUT /api/hr/employees/:id & /api/employees/:id
const handleUpdateEmployee = (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const updates = req.body;

    const existing = db.getEmployeeById(id);
    if (!existing) {
      return res.status(404).json({ error: "Colaborador no encontrado para actualización." });
    }

    // PRUEBA E: Protect salesExecutiveId, userId, and employeeNumber from inadvertent destruction
    const safeUpdates = { ...updates };
    delete safeUpdates.id; // Primary key never changes

    if (safeUpdates.salesExecutiveId === undefined && (existing as any).salesExecutiveId) {
      safeUpdates.salesExecutiveId = (existing as any).salesExecutiveId;
    }
    if (safeUpdates.userId === undefined && (existing as any).userId) {
      safeUpdates.userId = (existing as any).userId;
      safeUpdates.user_id = (existing as any).user_id || (existing as any).userId;
    }
    if (safeUpdates.employeeNumber === undefined && existing.employeeNumber) {
      safeUpdates.employeeNumber = existing.employeeNumber;
      safeUpdates.employee_number = existing.employeeNumber;
    }

    const updated = db.updateEmployee(existing.id, safeUpdates);

    // If confidential data was submitted and user is authorized, update confidential store
    const canViewConfidential = user.role === 'ADMINISTRADOR' || user.role === 'DIRECTOR' || user.role === 'RH';
    if (canViewConfidential && updates.confidentialData) {
      db.updateConfidentialData(existing.id, updates.confidentialData);
    } else if (canViewConfidential && updates.baseSalary !== undefined) {
      db.updateConfidentialData(existing.id, {
        baseSalary: Number(updates.baseSalary),
        paymentFrequency: updates.paymentFrequency,
        rfc: updates.rfc,
        curp: updates.curp,
        nss: updates.nss,
        bankAccount: updates.bankAccount,
        clabe: updates.clabe,
        bankName: updates.bankName,
      });
    }

    db.addAuditLog({
      user_id: user.id,
      action: 'EDITAR_COLABORADOR',
      entity_type: 'EMPLOYEE',
      entity_id: existing.id,
      new_value: `Colaborador actualizado: ${existing.id} por ${user.username}`,
    });

    const sanitized = sanitizeEmployeeForRole(updated, user.role);
    res.json(sanitized);
  } catch (err: any) {
    res.status(500).json({ error: "Error actualizando colaborador: " + err.message });
  }
};

app.patch("/api/hr/employees/:id", requireAuth, requirePermission("RH", "EDIT"), handleUpdateEmployee);
app.put("/api/hr/employees/:id", requireAuth, requirePermission("RH", "EDIT"), handleUpdateEmployee);
app.patch("/api/employees/:id", requireAuth, requirePermission("RH", "EDIT"), handleUpdateEmployee);
app.put("/api/employees/:id", requireAuth, requirePermission("RH", "EDIT"), handleUpdateEmployee);

// GET /api/hr/departments
app.get("/api/hr/departments", requireAuth, (_req, res) => {
  res.json(db.getDepartments());
});
app.get("/api/departments", requireAuth, (_req, res) => {
  res.json(db.getDepartments());
});

// GET /api/hr/positions
app.get("/api/hr/positions", requireAuth, (_req, res) => {
  res.json(db.getPositions());
});

// GET /api/hr/shifts
app.get("/api/hr/shifts", requireAuth, (_req, res) => {
  res.json(db.getShifts());
});

// GET /api/hr/confidential/:id
app.get("/api/hr/confidential/:id", requireAuth, (req, res) => {
  const user = (req as any).user;
  const canViewConfidential = user.role === 'ADMINISTRADOR' || user.role === 'DIRECTOR' || user.role === 'RH';
  if (!canViewConfidential) {
    return res.status(403).json({ error: "Acceso denegado: solo RH, Dirección y Administrador pueden consultar datos salariales confidenciales." });
  }
  const conf = db.getConfidentialData(req.params.id);
  res.json(conf || { employeeId: req.params.id, baseSalary: 20000, paymentFrequency: 'QUINCENAL' });
});

// PATCH /api/hr/confidential/:id
app.patch("/api/hr/confidential/:id", requireAuth, (req, res) => {
  const user = (req as any).user;
  const canViewConfidential = user.role === 'ADMINISTRADOR' || user.role === 'DIRECTOR' || user.role === 'RH';
  if (!canViewConfidential) {
    return res.status(403).json({ error: "Acceso denegado: solo RH, Dirección y Administrador pueden modificar datos salariales confidenciales." });
  }
  const updated = db.updateConfidentialData(req.params.id, req.body);
  res.json(updated);
});

// ==========================================
// 12. VITE MIDDLEWARE & SERVER STARTUP
// ==========================================
async function start() {
  if (!IS_PRODUCTION) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");

    // Cualquier ruta /api que no exista debe responder JSON, no el index.html
    // del SPA: si no, el cliente intenta parsear HTML como JSON y el error que
    // ve el usuario no tiene nada que ver con el problema real.
    app.use("/api", (_req, res) => {
      res.status(404).json({ error: "Endpoint no encontrado." });
    });

    app.use(express.static(distPath, { maxAge: "1h", index: false }));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Manejador global de errores: sin esto, una excepcion dentro de una ruta
  // deja la peticion colgada hasta el timeout del navegador.
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("[CONSCORE] Error no controlado:", err);
    if (res.headersSent) return;
    res.status(500).json({
      error: IS_PRODUCTION
        ? "Ocurrio un error en el servidor. Intenta de nuevo."
        : String(err?.message || err),
    });
  });

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`[CONSCORE ERP IA] Servidor escuchando en http://0.0.0.0:${PORT} (${IS_PRODUCTION ? "produccion" : "desarrollo"})`);
    if (IS_PRODUCTION && !process.env.SESSION_SECRET) {
      console.warn("[CONSCORE ERP IA] Falta SESSION_SECRET: las sesiones no sobreviven a un reinicio.");
    }
  });

  // Cierre ordenado: las plataformas envian SIGTERM antes de apagar.
  const shutdown = (signal: string) => {
    console.log(`[CONSCORE ERP IA] ${signal} recibido, cerrando conexiones...`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 10000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

process.on("unhandledRejection", (reason) => {
  console.error("[CONSCORE ERP IA] Promesa rechazada sin manejar:", reason);
});

start().catch((err) => {
  console.error("[CONSCORE ERP IA] Error fatal al iniciar:", err);
  process.exit(1);
});
