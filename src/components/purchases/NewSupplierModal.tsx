import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Supplier } from '../../types/erp';
import { X, Building2, AlertCircle, Plus, Trash2, Mail, Phone, User, CreditCard } from 'lucide-react';

interface NewSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplierToEdit?: Supplier | null;
}

export const NewSupplierModal: React.FC<NewSupplierModalProps> = ({
  isOpen,
  onClose,
  supplierToEdit,
}) => {
  const { createSupplier, updateSupplier } = useERP();

  const [name, setName] = useState(supplierToEdit?.name || '');
  const [legalName, setLegalName] = useState(supplierToEdit?.legal_name || supplierToEdit?.name || '');
  const [rfc, setRfc] = useState(supplierToEdit?.rfc || '');
  const [category, setCategory] = useState(supplierToEdit?.category || 'Aislamiento Térmico');
  const [email, setEmail] = useState(supplierToEdit?.email || '');
  const [phone, setPhone] = useState(supplierToEdit?.phone || '');
  const [address, setAddress] = useState(supplierToEdit?.address || '');
  const [paymentTerms, setPaymentTerms] = useState(supplierToEdit?.payment_terms || 'Crédito 30 días');
  const [creditLimit, setCreditLimit] = useState(supplierToEdit?.credit_limit || 150000);
  const [leadTimeDays, setLeadTimeDays] = useState(supplierToEdit?.lead_time_days || 5);
  const [bankAccount, setBankAccount] = useState(supplierToEdit?.bank_account || '');
  const [bankName, setBankName] = useState(supplierToEdit?.bank_name || 'BBVA Bancomer');
  const [clabe, setClabe] = useState(supplierToEdit?.clabe || '');
  const [currency, setCurrency] = useState(supplierToEdit?.currency || 'MXN');
  const [notes, setNotes] = useState(supplierToEdit?.notes || '');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Ingresa el nombre comercial del proveedor.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (supplierToEdit) {
        const res = await updateSupplier(supplierToEdit.id, {
          name: name.trim(),
          legal_name: legalName.trim(),
          rfc: rfc.trim().toUpperCase(),
          category,
          email: email.trim(),
          phone: phone.trim(),
          address: address.trim(),
          payment_terms: paymentTerms,
          credit_limit: Number(creditLimit),
          lead_time_days: Number(leadTimeDays),
          bank_account: bankAccount.trim(),
          bank_name: bankName.trim(),
          clabe: clabe.trim(),
          currency,
          notes: notes.trim(),
        });
        if (res.success) onClose();
        else setError(res.error || 'No se pudo actualizar el proveedor.');
      } else {
        const res = await createSupplier({
          name: name.trim(),
          legal_name: legalName.trim() || name.trim(),
          rfc: rfc.trim().toUpperCase(),
          category,
          email: email.trim(),
          phone: phone.trim(),
          address: address.trim(),
          payment_terms: paymentTerms,
          credit_limit: Number(creditLimit),
          lead_time_days: Number(leadTimeDays),
          bank_account: bankAccount.trim(),
          bank_name: bankName.trim(),
          clabe: clabe.trim(),
          currency,
          notes: notes.trim(),
          rating: 5.0,
          on_time_delivery_rate: 98,
          quality_compliance_rate: 99,
          status: 'ACTIVO',
        });
        if (res.success) onClose();
        else setError(res.error || 'No se pudo dar de alta el proveedor.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error inesperado al procesar proveedor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {supplierToEdit ? `Editar Proveedor: ${supplierToEdit.name}` : 'Alta de Nuevo Proveedor'}
              </h2>
              <p className="text-xs text-slate-500">
                Condiciones de crédito, tiempos de entrega y catálogo de suministro
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Company Details */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Nombre Comercial *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Owens Corning México"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-hidden"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                RFC Fiscal
              </label>
              <input
                type="text"
                value={rfc}
                onChange={(e) => setRfc(e.target.value)}
                placeholder="OCM850412XYZ"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm uppercase font-mono text-slate-900 focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Razón Social
              </label>
              <input
                type="text"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="Ej. Owens Corning México S. de R.L. de C.V."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Categoría de Suministro
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-hidden"
              >
                <option value="Aislamiento Térmico">Aislamiento Térmico</option>
                <option value="Aislamiento Acústico">Aislamiento Acústico</option>
                <option value="Impermeabilización">Impermeabilización</option>
                <option value="Sujeción y Accesorios">Sujeción y Accesorios</option>
                <option value="Herramientas y EPP">Herramientas y EPP</option>
                <option value="Empaque y Embalaje">Empaque y Embalaje</option>
                <option value="Logística y Fletes">Logística y Fletes</option>
              </select>
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Email de Ventas / Pedidos
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ventas@proveedor.com"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(55) 5555-5555"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Dirección / Planta
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Parque Industrial, Nave 4"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Commercial Terms */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Condiciones Comerciales & Bancarias
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">Plazo de Pago:</label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800"
                >
                  <option value="Contado Inmediato">Contado Inmediato</option>
                  <option value="Crédito 15 días">Crédito 15 días</option>
                  <option value="Crédito 30 días">Crédito 30 días</option>
                  <option value="Crédito 45 días">Crédito 45 días</option>
                  <option value="Crédito 60 días">Crédito 60 días</option>
                  <option value="50% Anticipo / 50% Entrega">50% Anticipo / 50% Entrega</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 mb-1">Límite de Crédito (MXN):</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-right font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 mb-1">Lead Time (Días Entrega):</label>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={leadTimeDays}
                  onChange={(e) => setLeadTimeDays(parseInt(e.target.value, 10) || 1)}
                  className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-right font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 mb-1">Moneda Preferida:</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800"
                >
                  <option value="MXN">MXN - Pesos</option>
                  <option value="USD">USD - Dólares</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-2">
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">Banco:</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="BBVA, Banorte, Santander"
                  className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">Cuenta Bancaria:</label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  placeholder="0123456789"
                  className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs font-mono text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">CLABE Interbancaria (18 dígitos):</label>
                <input
                  type="text"
                  value={clabe}
                  onChange={(e) => setClabe(e.target.value)}
                  placeholder="012180001234567890"
                  maxLength={18}
                  className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs font-mono text-slate-800"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Notas Internas de Negociación
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Descuentos por volumen, persona de contacto de cobranza..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
            >
              {isSubmitting
                ? 'Guardando...'
                : supplierToEdit
                ? 'Actualizar Proveedor'
                : 'Guardar Proveedor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
