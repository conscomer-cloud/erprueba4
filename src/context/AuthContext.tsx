import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, ERPModule, ActionPermission, RolePermissions } from '../types/erp';
import { DEFAULT_ROLE_PERMISSIONS } from '../data/defaultPermissions';
import { INITIAL_USERS } from '../data/initialData';
import { api } from '../services/apiClient';

interface AuthContextType {
  currentUser: User | null;
  currentRole: UserRole;
  users: User[];
  rolePermissions: Record<UserRole, RolePermissions>;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchUser: (userId: string) => Promise<void>;
  switchRole: (role: UserRole) => Promise<void> | void;
  can: (module: ERPModule, action: ActionPermission) => boolean;
  updateRolePermissions: (role: UserRole, module: ERPModule, permissions: ActionPermission[]) => void;
  refreshUsers: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
  refreshSession: () => Promise<User | null>;
  changePassword: (payload: {
    current_password?: string;
    new_password: string;
    confirm_password: string;
  }) => Promise<{ success: boolean; error?: string; message?: string; mustChangePassword?: boolean }>;
  updateCurrentUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initial fallback admin user
const DEFAULT_ADMIN: User = INITIAL_USERS.find((u) => u.role === 'ADMINISTRADOR') || {
  id: 'USR-002',
  name: 'Lic. Claudia Mendoza Ortiz',
  email: 'cmendoza@conscore.com.mx',
  role: 'ADMINISTRADOR',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  department: 'Tecnología & Operaciones',
  status: 'ACTIVO',
  created_at: new Date().toISOString(),
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, RolePermissions>>(() => {
    const saved = localStorage.getItem('conscore_role_permissions');
    const parsed = saved ? JSON.parse(saved) : DEFAULT_ROLE_PERMISSIONS;
    // Strict Segregation of Duties (SoD): Ensure ALMACEN and JEFE_ALMACEN cannot have COMPRAS
    if (parsed?.ALMACEN?.permissions) {
      parsed.ALMACEN.permissions.COMPRAS = [];
    }
    if (parsed?.JEFE_ALMACEN?.permissions) {
      parsed.JEFE_ALMACEN.permissions.COMPRAS = [];
    }
    return parsed;
  });

  const currentRole: UserRole = (currentUser && currentUser.role) ? currentUser.role : 'ADMINISTRADOR';

  // Load session & initial users
  const refreshUsers = async () => {
    try {
      const serverUsers = await api.getUsers();
      if (serverUsers && Array.isArray(serverUsers) && serverUsers.length > 0) {
        setUsers(serverUsers);
      }
    } catch (e) {
      console.warn('Error cargando usuarios del backend, usando fallback local:', e);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      const token = api.getToken();

      // Sin token no hay sesion: se muestra la pantalla de acceso.
      // Nunca se autentica automaticamente con credenciales embebidas.
      if (!token) {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const me = await api.getMe();
        if (me && me.role) {
          setCurrentUser(me);
          setIsAuthenticated(true);
        } else {
          api.setToken(null);
          setIsAuthenticated(false);
        }
      } catch (e) {
        // Token expirado o invalido: se limpia y se pide autenticacion.
        api.setToken(null);
        setCurrentUser(null);
        setIsAuthenticated(false);
      }

      await refreshUsers();
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await api.login(email, pass);
      localStorage.removeItem('conscore_logged_out');
      if (res && res.user && res.user.role) {
        setCurrentUser(res.user);
      }
      setIsAuthenticated(true);
      await refreshUsers();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error de autenticación' };
    }
  };

  const clearSessionCaches = () => {
    try {
      localStorage.removeItem('conscore_customers');
      localStorage.removeItem('conscore_quotes');
      localStorage.removeItem('conscore_orders');
      localStorage.removeItem('conscore_crm_opportunities');
      localStorage.removeItem('conscore_leads');
      localStorage.removeItem('conscore_recent_customers');
    } catch (e) {
      console.warn('Error clearing session storage caches:', e);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      console.warn('Logout API error:', e);
    }
    clearSessionCaches();
    localStorage.setItem('conscore_logged_out', 'true');
    api.setToken(null);
    setIsAuthenticated(false);
    setCurrentUser(null as any);
  };

  /**
   * Suplantacion de usuario. Solo existe en desarrollo, para probar la matriz
   * RBAC sin abrir varias sesiones. En produccion no hace nada: cambiar de
   * usuario exige cerrar sesion y volver a autenticarse.
   *
   * La version anterior iniciaba sesion con una contrasena maestra escrita en
   * el codigo, que terminaba publicada en el bundle del navegador.
   */
  const switchUser = async (userId: string) => {
    if (!import.meta.env.DEV) {
      console.warn('[AUTH] switchUser esta deshabilitado fuera de desarrollo.');
      return;
    }
    const found = users.find(u => u.id === userId);
    if (!found) return;
    clearSessionCaches();
    setCurrentUser(found);
  };

  const switchRole = async (newRole: UserRole) => {
    if (!import.meta.env.DEV) {
      console.warn('[AUTH] switchRole esta deshabilitado fuera de desarrollo.');
      return;
    }
    const targetUser = users.find(u => u.role === newRole);
    if (targetUser) {
      await switchUser(targetUser.id);
    } else {
      setCurrentUser(prev => ({
        ...(prev || DEFAULT_ADMIN),
        role: newRole,
      }));
    }
  };

  // Deny by default evaluator
  const can = (module: ERPModule, action: ActionPermission): boolean => {
    if (currentRole === 'ADMINISTRADOR') return true;

    // Strict Segregation of Duties (SoD): ALMACEN and JEFE_ALMACEN NEVER have access to COMPRAS
    if ((currentRole === 'ALMACEN' || (currentRole as string) === 'JEFE_ALMACEN') && module === 'COMPRAS') {
      return false;
    }

    const roleConfig = rolePermissions?.[currentRole];
    if (!roleConfig || !roleConfig.permissions) return false;
    const allowedActions = roleConfig.permissions[module] || [];
    return Array.isArray(allowedActions) ? allowedActions.includes(action) : false;
  };

  const updateRolePermissions = (
    role: UserRole,
    module: ERPModule,
    permissions: ActionPermission[]
  ) => {
    // Strict Segregation of Duties (SoD): Prevent granting COMPRAS permissions to ALMACEN or JEFE_ALMACEN
    let effectivePermissions = permissions;
    if ((role === 'ALMACEN' || (role as string) === 'JEFE_ALMACEN') && module === 'COMPRAS') {
      effectivePermissions = [];
    }

    setRolePermissions(prev => {
      const existing = prev[role] || DEFAULT_ROLE_PERMISSIONS[role];
      const updated = {
        ...prev,
        [role]: {
          ...existing,
          permissions: {
            ...existing.permissions,
            [module]: effectivePermissions,
          },
        },
      };
      localStorage.setItem('conscore_role_permissions', JSON.stringify(updated));
      return updated;
    });
  };

  const updateCurrentUser = (updates: Partial<User>) => {
    setCurrentUser(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        ...updates,
      };
    });
  };

  const refreshUser = async (): Promise<User | null> => {
    try {
      const me = await api.getMe();
      if (me && me.role) {
        setCurrentUser(me);
        return me;
      }
    } catch (e) {
      console.warn('Error refrescando usuario activo:', e);
    }
    return null;
  };

  const refreshSession = async (): Promise<User | null> => {
    return refreshUser();
  };

  const changePassword = async (payload: {
    current_password?: string;
    new_password: string;
    confirm_password: string;
  }): Promise<{ success: boolean; error?: string; message?: string; mustChangePassword?: boolean }> => {
    try {
      const res = await api.changePassword(payload);
      if (res && res.success) {
        // Atomically update currentUser in React state to ensure mustChangePassword is false
        setCurrentUser(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            ...(res.user || {}),
            mustChangePassword: false,
            must_change_password: false,
          };
        });

        // Also refresh list of users and active user from backend
        await refreshUsers();
        return {
          success: true,
          message: res.message || 'Contraseña actualizada exitosamente',
          mustChangePassword: false,
        };
      }
      return { success: false, error: res?.message || 'Error al cambiar contraseña' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error al actualizar contraseña' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        users,
        rolePermissions,
        isAuthenticated,
        isLoading,
        login,
        logout,
        switchUser,
        switchRole,
        can,
        updateRolePermissions,
        refreshUsers,
        refreshUser,
        refreshSession,
        changePassword,
        updateCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
