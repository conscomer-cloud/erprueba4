import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Shield,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Building2,
  Zap,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DEMO_LOGIN_ENABLED } from '../../config/environment';

/**
 * Cuentas incluidas en los datos iniciales. La lista anterior ofrecía
 * director@ y finanzas@, que no existen en el seed: esos dos botones
 * siempre respondían "usuario no encontrado".
 */
const DEMO_ACCOUNTS = [
  { email: 'admin@conscore.com.mx', label: 'Administrador', tone: 'text-white' },
  { email: 'laura.salinas@conscore.com.mx', label: 'Gerencia Ventas', tone: 'text-blue-300' },
  { email: 'vendedor01@conscore.com.mx', label: 'Ejecutivo 01', tone: 'text-emerald-400' },
  { email: 'vendedor02@conscore.com.mx', label: 'Ejecutivo 02', tone: 'text-emerald-400' },
  { email: 'almacen@conscore.com.mx', label: 'Almacén', tone: 'text-amber-400' },
  { email: 'compras@conscore.com.mx', label: 'Compras', tone: 'text-cyan-400' },
  { email: 'rh@conscore.com.mx', label: 'Recursos Humanos', tone: 'text-indigo-300' },
  { email: 'roberto.fuentes@conscore.com.mx', label: 'Servicio al Cliente', tone: 'text-rose-300' },
];

interface LoginViewProps {
  onSuccess?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess }) => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!identifier.trim() || !password) {
      setErrorMsg('Por favor ingresa tu correo/usuario y contraseña.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(identifier.trim(), password);
      if (!res.success) {
        setErrorMsg(res.error || 'Credenciales incorrectas o usuario inactivo.');
      } else {
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error en el servidor al autenticar.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (userEmail: string) => {
    const userPass = import.meta.env.VITE_DEMO_PASSWORD || '';
    if (!userPass) {
      setErrorMsg('Define VITE_DEMO_PASSWORD para usar los accesos de demostración.');
      return;
    }
    setIdentifier(userEmail);
    setPassword(userPass);
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const res = await login(userEmail, userPass);
      if (!res.success) {
        setErrorMsg(res.error || 'Error al autenticar');
      } else {
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al autenticar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 selection:bg-blue-600 selection:text-white">
      {/* Background Subtle Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Main Card */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8 shadow-2xl backdrop-blur-md">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/20 mb-4">
              <Building2 className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">CONSCORE ERP IA</h1>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Plataforma de Gestión Empresarial Integral & Seguridad RLS
            </p>
          </div>

          {errorMsg && (
            <div
              id="login-error-banner"
              className="mb-6 flex items-start gap-2.5 rounded-xl bg-rose-950/80 border border-rose-800/80 p-3 text-xs text-rose-300 animate-in fade-in"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Correo Electrónico o Usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  id="login-identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="ejemplo@conscore.com.mx o username"
                  className="w-full rounded-xl bg-slate-950/80 border border-slate-700 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  <span>{showPassword ? 'Ocultar' : 'Ver'}</span>
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="login-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl bg-slate-950/80 border border-slate-700 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              id="btn-login-submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <span>Autenticando sesión...</span>
              ) : (
                <>
                  <span>Iniciar Sesión Segura</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Accesos de demostración. Ocultos en producción: mostraban en
              pantalla las cuentas del sistema y entraban con una contraseña
              escrita en el código, que terminaba publicada en el bundle. */}
          {DEMO_LOGIN_ENABLED && (
            <div className="mt-8 pt-6 border-t border-slate-800">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-3">
                <Zap className="h-3.5 w-3.5" />
                <span>Acceso rápido de demostración</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-left">
                {DEMO_ACCOUNTS.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => handleQuickLogin(account.email)}
                    className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-left transition-colors group cursor-pointer"
                  >
                    <div className={`text-[11px] font-bold ${account.tone}`}>{account.label}</div>
                    <div className="text-[10px] text-slate-400 truncate">{account.email}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Security Footer */}
          <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <Shield className="h-3.5 w-3.5 text-blue-500" />
            <span>Sesión firmada · Acceso por rol</span>
          </div>
        </div>
      </div>
    </div>
  );
};
