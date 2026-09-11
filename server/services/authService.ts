/**
 * @license
 * CONSCORE ERP IA - Authentication & RBAC Service
 *
 * Modelo de sesion:
 *   Token = cstk.<payload base64url>.<firma HMAC-SHA256 base64url>
 *   El payload lleva el id de usuario, la fecha de emision, la de expiracion
 *   y un identificador unico de sesion (jti). Sin la firma correcta el token
 *   se rechaza, asi que no puede fabricarse desde el cliente.
 *
 * El secreto sale de SESSION_SECRET. Si no esta definido se genera uno
 * aleatorio por arranque: la app sigue funcionando, pero las sesiones mueren
 * en cada reinicio y con mas de una instancia no se comparten.
 */

import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { db, verifyPassword } from '../db/database';
import { User, UserRole, ERPModule, ActionPermission } from '../../src/types/erp';
import { eventBus } from './eventBus';

export interface AuthSession {
  token: string;
  user: User;
  expiresAt: number;
  jti: string;
}

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

// Politica de bloqueo por intentos fallidos
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

const SESSION_SECRET = (() => {
  const fromEnv = process.env.SESSION_SECRET;
  if (fromEnv && fromEnv.length >= 32) return fromEnv;
  if (fromEnv) {
    console.warn('[AUTH] SESSION_SECRET tiene menos de 32 caracteres. Se ignora y se genera uno efimero.');
  }
  if (process.env.NODE_ENV === 'production') {
    console.warn(
      '[AUTH] SESSION_SECRET no esta definido en produccion. Se genero un secreto efimero: ' +
      'las sesiones se invalidaran en cada reinicio y no funcionaran con multiples instancias.'
    );
  }
  return crypto.randomBytes(48).toString('hex');
})();

// Sesiones activas en memoria (cache rapida; la firma es la fuente de verdad)
const activeSessions = new Map<string, AuthSession>();

// Sesiones revocadas explicitamente (logout). Se limpian al expirar.
const revokedJti = new Map<string, number>();

// Corte por usuario: cualquier token emitido antes de esta marca queda invalido
// (se usa al cambiar contrasena, desactivar usuario o cambiar de rol).
const userSessionEpoch = new Map<string, number>();

// Control de intentos fallidos por identificador + IP
const failedAttempts = new Map<string, { count: number; firstAt: number; lockedUntil: number }>();

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(input: string): Buffer {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4));
  return Buffer.from(input.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

function sign(payload: string): string {
  return b64url(crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest());
}

function safeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function issueToken(userId: string): { token: string; jti: string; expiresAt: number } {
  const now = Date.now();
  const jti = crypto.randomBytes(16).toString('hex');
  const expiresAt = now + SESSION_TTL_MS;
  const payload = b64url(JSON.stringify({ u: userId, i: now, e: expiresAt, j: jti }));
  return { token: `cstk.${payload}.${sign(payload)}`, jti, expiresAt };
}

function verifyToken(token: string): { userId: string; issuedAt: number; expiresAt: number; jti: string } | null {
  if (!token || !token.startsWith('cstk.')) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const payload = parts[1];
  const signature = parts[2];
  if (!safeEquals(signature, sign(payload))) return null;

  try {
    const data = JSON.parse(fromB64url(payload).toString('utf-8'));
    if (!data.u || !data.e || !data.j) return null;
    return { userId: data.u, issuedAt: data.i, expiresAt: data.e, jti: data.j };
  } catch {
    return null;
  }
}

function pruneExpired() {
  const now = Date.now();
  for (const [jti, exp] of revokedJti) {
    if (exp < now) revokedJti.delete(jti);
  }
  for (const [token, session] of activeSessions) {
    if (session.expiresAt < now) activeSessions.delete(token);
  }
  for (const [key, record] of failedAttempts) {
    if (record.lockedUntil < now && now - record.firstAt > ATTEMPT_WINDOW_MS) {
      failedAttempts.delete(key);
    }
  }
}

function sanitizeUser(user: any): User {
  const { password_hash, salt, ...safeUser } = user;
  safeUser.mustChangePassword = Boolean(user.must_change_password || user.mustChangePassword);
  safeUser.must_change_password = safeUser.mustChangePassword;
  return safeUser as User;
}

export class AuthService {
  public static login(
    identifier: string,
    password: string,
    clientIp = '127.0.0.1'
  ): { success: boolean; session?: AuthSession; error?: string; retryAfterSeconds?: number } {
    pruneExpired();

    const cleanId = (identifier || '').trim().toLowerCase();
    const attemptKey = `${cleanId}|${clientIp}`;
    const now = Date.now();

    // 1. Bloqueo temporal por intentos fallidos
    const attempt = failedAttempts.get(attemptKey);
    if (attempt && attempt.lockedUntil > now) {
      const retryAfterSeconds = Math.ceil((attempt.lockedUntil - now) / 1000);
      return {
        success: false,
        error: `Demasiados intentos fallidos. Vuelve a intentar en ${Math.ceil(retryAfterSeconds / 60)} minuto(s).`,
        retryAfterSeconds,
      };
    }

    const registerFailure = () => {
      const current = failedAttempts.get(attemptKey);
      if (!current || now - current.firstAt > ATTEMPT_WINDOW_MS) {
        failedAttempts.set(attemptKey, { count: 1, firstAt: now, lockedUntil: 0 });
        return;
      }
      current.count += 1;
      if (current.count >= MAX_FAILED_ATTEMPTS) {
        current.lockedUntil = now + LOCKOUT_MS;
      }
      failedAttempts.set(attemptKey, current);
    };

    // 2. Busqueda de usuario por correo, usuario o clave de ejecutivo
    const users = db.getUsers();
    const userWithAuth =
      users.find(u => u.email && u.email.trim().toLowerCase() === cleanId) ||
      users.find(u => u.username && u.username.trim().toLowerCase() === cleanId) ||
      users.find(
        u =>
          (u.salesExecutiveId && u.salesExecutiveId.trim().toLowerCase() === cleanId) ||
          (u.sales_executive_id && u.sales_executive_id.trim().toLowerCase() === cleanId)
      );

    // Mensaje generico: no revelamos si el usuario existe o si fallo la contrasena.
    const GENERIC_ERROR = 'Usuario o contraseña incorrectos.';

    if (!userWithAuth) {
      registerFailure();
      // Se compara igual contra un hash falso para no filtrar la existencia del
      // usuario por el tiempo de respuesta.
      verifyPassword(password || '', 'dummy_salt', 'x'.repeat(128));
      console.log('[AUTH_LOGIN]', { identifier: cleanId, ip: clientIp, result: 'REJECTED_USER_NOT_FOUND' });
      return { success: false, error: GENERIC_ERROR };
    }

    if (userWithAuth.status !== 'ACTIVO') {
      registerFailure();
      console.log('[AUTH_LOGIN]', {
        identifier: cleanId,
        ip: clientIp,
        userId: userWithAuth.id,
        result: `REJECTED_USER_${userWithAuth.status}`,
      });
      return {
        success: false,
        error: `La cuenta se encuentra ${String(userWithAuth.status).toLowerCase()}. Contacta al administrador.`,
      };
    }

    if (!userWithAuth.password_hash || !userWithAuth.salt) {
      registerFailure();
      console.error('[AUTH_LOGIN] Usuario sin credenciales almacenadas:', userWithAuth.id);
      return { success: false, error: GENERIC_ERROR };
    }

    const isValid = verifyPassword(password, userWithAuth.salt, userWithAuth.password_hash);

    if (!isValid) {
      registerFailure();
      const remaining = MAX_FAILED_ATTEMPTS - (failedAttempts.get(attemptKey)?.count || 0);
      console.log('[AUTH_LOGIN]', {
        identifier: cleanId,
        ip: clientIp,
        userId: userWithAuth.id,
        result: 'REJECTED_PASSWORD_FAIL',
      });
      db.logAudit({
        user_id: userWithAuth.id,
        user_name: userWithAuth.name,
        user_role: userWithAuth.role,
        module: 'CONFIGURACION',
        action: 'INTENTO_LOGIN_FALLIDO',
        entity_type: 'USER',
        entity_id: userWithAuth.id,
        new_value: `Intento de acceso fallido desde IP ${clientIp}`,
      });
      return {
        success: false,
        error: remaining > 0 && remaining <= 2
          ? `${GENERIC_ERROR} Te quedan ${remaining} intento(s) antes del bloqueo temporal.`
          : GENERIC_ERROR,
      };
    }

    // 3. Autenticacion correcta
    failedAttempts.delete(attemptKey);

    const issued = issueToken(userWithAuth.id);
    const safeUser = sanitizeUser(userWithAuth);
    safeUser.last_login = new Date().toISOString();
    safeUser.lastLogin = safeUser.last_login;

    userWithAuth.last_login = safeUser.last_login;
    db.persist();

    const session: AuthSession = {
      token: issued.token,
      user: safeUser,
      expiresAt: issued.expiresAt,
      jti: issued.jti,
    };
    activeSessions.set(issued.token, session);

    console.log('[AUTH_LOGIN]', {
      identifier: cleanId,
      ip: clientIp,
      userId: safeUser.id,
      role: safeUser.role,
      result: 'ACCEPTED',
    });

    db.logAudit({
      user_id: safeUser.id,
      user_name: safeUser.name,
      user_role: safeUser.role,
      module: 'CONFIGURACION',
      action: 'LOGIN_EXITOSO',
      entity_type: 'SESSION',
      entity_id: issued.jti,
      new_value: `Inicio de sesión exitoso como ${safeUser.role}${safeUser.salesExecutiveId ? ` (${safeUser.salesExecutiveId})` : ''}`,
    });

    eventBus.broadcast('user_logged_in', { userId: safeUser.id, name: safeUser.name, role: safeUser.role });

    return { success: true, session };
  }

  /**
   * Invalida todas las sesiones de un usuario. Se usa al cambiar contrasena,
   * desactivar la cuenta o modificar su rol.
   */
  public static invalidateUserSessions(userId: string) {
    userSessionEpoch.set(userId, Date.now());
    for (const [token, session] of activeSessions.entries()) {
      if (session.user.id === userId) {
        revokedJti.set(session.jti, session.expiresAt);
        activeSessions.delete(token);
      }
    }
  }

  public static updateSessionUser(user: any) {
    const safeUser = sanitizeUser(user);
    for (const session of activeSessions.values()) {
      if (session.user.id === user.id) {
        session.user = { ...session.user, ...safeUser };
      }
    }
  }

  public static logout(token: string, _userId?: string) {
    const claims = verifyToken(token);
    const session = activeSessions.get(token);

    if (session) {
      db.logAudit({
        user_id: session.user.id,
        user_name: session.user.name,
        user_role: session.user.role,
        module: 'CONFIGURACION',
        action: 'LOGOUT',
        entity_type: 'SESSION',
        entity_id: session.jti,
        new_value: 'Cierre voluntario de sesión',
      });
      activeSessions.delete(token);
    }

    if (claims) {
      revokedJti.set(claims.jti, claims.expiresAt);
    }
  }

  public static getSession(token: string): AuthSession | null {
    if (!token) return null;

    const claims = verifyToken(token);
    if (!claims) return null;
    if (Date.now() > claims.expiresAt) {
      activeSessions.delete(token);
      return null;
    }
    if (revokedJti.has(claims.jti)) {
      activeSessions.delete(token);
      return null;
    }

    const epoch = userSessionEpoch.get(claims.userId);
    if (epoch && claims.issuedAt < epoch) {
      activeSessions.delete(token);
      return null;
    }

    const cached = activeSessions.get(token);
    if (cached) return cached;

    // La firma es valida pero la cache se perdio (reinicio del proceso).
    // Reconstruimos la sesion solo si el usuario sigue existiendo y activo.
    const userInDb = db.getUsers().find(u => u.id === claims.userId);
    if (!userInDb || userInDb.status !== 'ACTIVO') return null;

    const restored: AuthSession = {
      token,
      user: sanitizeUser(userInDb),
      expiresAt: claims.expiresAt,
      jti: claims.jti,
    };
    activeSessions.set(token, restored);
    return restored;
  }

  public static checkPermission(role: UserRole, module: ERPModule, action: ActionPermission): boolean {
    if (role === 'ADMINISTRADOR') return true;

    // Segregacion de funciones: almacen nunca accede a Compras
    if ((role === 'ALMACEN' || (role as string) === 'JEFE_ALMACEN') && module === 'COMPRAS') {
      return false;
    }

    const roles = db.getRoles();
    const roleObj = roles.find(r => r.name === role);
    if (!roleObj) return false;

    const rolePerms = db.getRolePermissions().filter(rp => rp.role_id === roleObj.id);
    const permIds = new Set(rolePerms.map(rp => rp.permission_id));

    const normalizedAction =
      action === 'VER' ? 'VIEW' :
      action === 'CREAR' ? 'CREATE' :
      action === 'EDITAR' ? 'EDIT' :
      action === 'ELIMINAR' ? 'DELETE' :
      action === 'AUTORIZAR' ? 'AUTHORIZE' :
      action === 'EXPORTAR' ? 'EXPORT' : action;

    const permission = db.getPermissions().find(p => p.module === module && (p.action === action || p.action === normalizedAction));
    if (!permission) return false;

    return permIds.has(permission.id);
  }
}

// Middleware de autenticacion
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autenticado. Se requiere token de sesión válido.' });
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return res.status(401).json({ error: 'No autenticado. Se requiere token de sesión válido.' });
  }

  const session = AuthService.getSession(token);
  if (!session) {
    return res.status(401).json({ error: 'Tu sesión expiró o no es válida. Inicia sesión nuevamente.' });
  }

  (req as any).user = session.user;
  (req as any).sessionToken = token;
  next();
}

export function requirePermission(module: ERPModule, action: ActionPermission) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as User;
    if (!user) {
      return res.status(401).json({ error: 'No autenticado. Se requiere token de sesión válido.' });
    }

    const hasPermission = AuthService.checkPermission(user.role, module, action);
    if (!hasPermission) {
      db.logAudit({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        module,
        action: 'ACCESO_DENEGADO',
        entity_type: 'PERMISSION',
        entity_id: `${module}_${action}`,
        new_value: `Intento de acción ${action} en ${module} denegado por política RBAC`,
      });

      if (module === 'CONFIGURACION' && (action === 'CREATE' || action === 'EDIT' || action === 'DELETE')) {
        return res.status(403).json({ error: 'No tienes permisos para administrar usuarios.' });
      }

      return res.status(403).json({
        error: `Acceso denegado. Tu rol (${user.role}) no tiene el permiso ${action} en el módulo ${module}.`,
      });
    }

    next();
  };
}
