import React, { useState } from 'react';
import { Lock, KeyRound, AlertCircle, CheckCircle2, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { api } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';

interface ChangePasswordModalProps {
  isOpen: boolean;
  isForced?: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  isForced = false,
  onClose,
  onSuccess,
}) => {
  const { currentUser, changePassword, refreshUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Validation rules
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isPolicySatisfied = hasMinLength && hasUppercase && hasLowercase && hasNumber && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isPolicySatisfied) {
      setErrorMsg('Por favor cumple con todos los requisitos de seguridad antes de continuar.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await changePassword({
        current_password: currentPassword || undefined,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      if (res.success) {
        setSuccessMsg('Contraseña actualizada exitosamente.');
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 500);
      } else {
        setErrorMsg(res.error || 'Error al cambiar la contraseña');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al cambiar la contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="change-password-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
    >
      <div
        id="change-password-modal-card"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <KeyRound className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {isForced ? 'Cambio Obligatorio de Contraseña' : 'Actualizar Contraseña'}
            </h2>
            <p className="text-xs text-slate-500">
              {isForced
                ? 'Por política de seguridad comercial, debes establecer una nueva clave en tu primer acceso.'
                : 'Ingresa una nueva contraseña segura para tu cuenta.'}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div
            id="password-error-banner"
            className="mb-4 flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-800"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div
            id="password-success-banner"
            className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-800"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isForced && (
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Contraseña Actual
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                id="input-current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Ingresa tu contraseña actual"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                required={!isForced}
              />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold uppercase text-slate-600">
                Nueva Contraseña
              </label>
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
              >
                {showPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {showPass ? 'Ocultar' : 'Ver'}
              </button>
            </div>
            <input
              type={showPass ? 'text' : 'password'}
              id="input-new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Confirmar Nueva Contraseña
            </label>
            <input
              type={showPass ? 'text' : 'password'}
              id="input-confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la nueva contraseña"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              required
            />
          </div>

          {/* Validation Checklist */}
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/80 space-y-1.5 text-xs text-slate-600">
            <span className="font-bold text-slate-700 block mb-1">Requisitos de Seguridad:</span>
            <div className={`flex items-center gap-2 ${hasMinLength ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
              <CheckCircle2 className={`h-3.5 w-3.5 ${hasMinLength ? 'text-emerald-600' : 'text-slate-300'}`} />
              <span>Mínimo 8 caracteres ({newPassword.length}/8)</span>
            </div>
            <div className={`flex items-center gap-2 ${hasUppercase ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
              <CheckCircle2 className={`h-3.5 w-3.5 ${hasUppercase ? 'text-emerald-600' : 'text-slate-300'}`} />
              <span>Al menos una letra mayúscula (A-Z)</span>
            </div>
            <div className={`flex items-center gap-2 ${hasLowercase ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
              <CheckCircle2 className={`h-3.5 w-3.5 ${hasLowercase ? 'text-emerald-600' : 'text-slate-300'}`} />
              <span>Al menos una letra minúscula (a-z)</span>
            </div>
            <div className={`flex items-center gap-2 ${hasNumber ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
              <CheckCircle2 className={`h-3.5 w-3.5 ${hasNumber ? 'text-emerald-600' : 'text-slate-300'}`} />
              <span>Al menos un número (0-9)</span>
            </div>
            <div className={`flex items-center gap-2 ${passwordsMatch ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
              <CheckCircle2 className={`h-3.5 w-3.5 ${passwordsMatch ? 'text-emerald-600' : 'text-slate-300'}`} />
              <span>Las contraseñas coinciden</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            {!isForced && (
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              id="btn-submit-new-password"
              disabled={isLoading || !isPolicySatisfied}
              className="flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span>Guardando...</span>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Establecer Nueva Contraseña</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
