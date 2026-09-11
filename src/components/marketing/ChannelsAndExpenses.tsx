import React, { useState } from 'react';
import {
  Plus,
  Receipt,
  DollarSign,
  Megaphone,
  Trash2,
  Calendar,
  Building,
  Tag,
  CheckCircle,
  FileText,
  PieChart,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { MarketingChannel, CampaignExpense, ChannelType, ExpenseCategory } from '../../types/erp';

export const ChannelsAndExpenses: React.FC = () => {
  const {
    marketingChannels,
    marketingCampaigns,
    campaignExpenses,
    addMarketingChannel,
    updateMarketingChannel,
    addCampaignExpense,
    deleteCampaignExpense,
  } = useERP();
  const { can, currentUser } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'CHANNELS' | 'EXPENSES'>('EXPENSES');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);

  // Expense form state
  const [expenseForm, setExpenseForm] = useState({
    campaignId: marketingCampaigns[0]?.id || '',
    channelId: marketingChannels[0]?.id || '',
    date: new Date().toISOString().slice(0, 10),
    amount: 15000,
    invoiceNumber: '',
    providerName: '',
    concept: '',
    category: 'PAID_ADS' as ExpenseCategory,
  });

  // Channel form state
  const [channelForm, setChannelForm] = useState({
    code: '',
    name: '',
    type: 'GOOGLE_ADS' as ChannelType,
    status: 'ACTIVO' as 'ACTIVO' | 'INACTIVO' | 'PAUSADO',
    description: '',
    totalBudget: 60000,
    color: '#3B82F6',
  });

  const fmtCurrency = (val: number) => `$${(val || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;

  const handleOpenExpenseModal = () => {
    setExpenseForm({
      campaignId: marketingCampaigns[0]?.id || '',
      channelId: marketingChannels[0]?.id || '',
      date: new Date().toISOString().slice(0, 10),
      amount: 12500,
      invoiceNumber: `FAC-MKT-${Date.now().toString().slice(-5)}`,
      providerName: 'Google México S. de R.L. de C.V.',
      concept: 'Consumo publicitario Google Ads Search Q3',
      category: 'PAID_ADS',
    });
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.amount || expenseForm.amount <= 0) {
      alert('Por favor ingresa un monto válido mayor a 0.');
      return;
    }
    const camp = marketingCampaigns.find(c => c.id === expenseForm.campaignId);
    const ch = marketingChannels.find(c => c.id === expenseForm.channelId || c.id === camp?.channelId);

    addCampaignExpense({
      ...expenseForm,
      campaignName: camp?.name || 'Campaña General',
      channelId: ch?.id || 'MCH-001',
      channelName: ch?.name || 'Canal General',
      authorizedBy: currentUser?.id || 'USR-001',
      authorizedByName: currentUser?.name || 'Dirección General',
    });

    setIsExpenseModalOpen(false);
  };

  const handleOpenChannelModal = () => {
    const nextNum = marketingChannels.length + 1;
    setChannelForm({
      code: `CANAL_00${nextNum}`,
      name: '',
      type: 'OTRO',
      status: 'ACTIVO',
      description: 'Nuevo canal de adquisición industrial B2B',
      totalBudget: 50000,
      color: '#6366F1',
    });
    setIsChannelModalOpen(true);
  };

  const handleSaveChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelForm.name.trim()) {
      alert('Por favor ingresa un nombre para el canal.');
      return;
    }
    addMarketingChannel(channelForm);
    setIsChannelModalOpen(false);
  };

  const handleDeleteExpense = (expense: CampaignExpense) => {
    if (confirm(`¿Eliminar el registro de gasto ${expense.invoiceNumber} por ${fmtCurrency(expense.amount)}?`)) {
      deleteCampaignExpense(expense.id);
    }
  };

  const totalSpentAllExpenses = campaignExpenses.reduce((a, e) => a + (e.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Subtabs Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSubTab('EXPENSES')}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
              activeSubTab === 'EXPENSES'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            Registro de Gastos & Facturas ({campaignExpenses.length})
          </button>
          <button
            onClick={() => setActiveSubTab('CHANNELS')}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
              activeSubTab === 'CHANNELS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            Catálogo de Canales ({marketingChannels.length})
          </button>
        </div>

        {activeSubTab === 'EXPENSES' && can('MARKETING', 'CREAR') && (
          <button
            onClick={handleOpenExpenseModal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700 transition shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Registrar Gasto / Factura
          </button>
        )}

        {activeSubTab === 'CHANNELS' && can('MARKETING', 'CREAR') && (
          <button
            onClick={handleOpenChannelModal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700 transition shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Nuevo Canal
          </button>
        )}
      </div>

      {/* EXPENSES SUBTAB */}
      {activeSubTab === 'EXPENSES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase block">Total Facturado & Ejercido</span>
              <span className="text-xl font-black text-slate-900">{fmtCurrency(totalSpentAllExpenses)}</span>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Todos los gastos imputan directamente al CAC y ROAS de cada campaña.
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-600">
                  <tr>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-3">Factura / Folio</th>
                    <th className="py-3 px-3">Campaña Asignada</th>
                    <th className="py-3 px-3">Canal</th>
                    <th className="py-3 px-3">Proveedor & Concepto</th>
                    <th className="py-3 px-3">Categoría</th>
                    <th className="py-3 px-4 text-right">Monto (MXN)</th>
                    <th className="py-3 px-3">Autorizado Por</th>
                    <th className="py-3 px-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {campaignExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-500">
                        No hay gastos registrados en el sistema.
                      </td>
                    </tr>
                  ) : (
                    campaignExpenses.map(exp => (
                      <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-medium text-slate-700">{exp.date}</td>
                        <td className="py-3.5 px-3 font-mono font-bold text-slate-900">{exp.invoiceNumber}</td>
                        <td className="py-3.5 px-3 font-medium text-blue-700">{exp.campaignName}</td>
                        <td className="py-3.5 px-3">{exp.channelName}</td>
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-slate-900">{exp.providerName}</div>
                          <div className="text-[11px] text-slate-500">{exp.concept}</div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-700">
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-slate-900">
                          {fmtCurrency(exp.amount)}
                        </td>
                        <td className="py-3.5 px-3 text-slate-600 text-[11px]">{exp.authorizedByName}</td>
                        <td className="py-3.5 px-3 text-center">
                          {can('MARKETING', 'ELIMINAR') && (
                            <button
                              onClick={() => handleDeleteExpense(exp)}
                              title="Eliminar Gasto"
                              className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CHANNELS SUBTAB */}
      {activeSubTab === 'CHANNELS' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {marketingChannels.map(ch => (
            <div key={ch.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: ch.color }} />
                    <h3 className="text-sm font-bold text-slate-900">{ch.name}</h3>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      ch.status === 'ACTIVO' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {ch.status}
                  </span>
                </div>

                <div className="mt-3 text-xs text-slate-500">{ch.description}</div>

                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Inversión Total</span>
                    <span className="font-bold text-slate-900">{fmtCurrency(ch.totalSpent)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Venta Atribuida</span>
                    <span className="font-bold text-slate-900">{fmtCurrency(ch.revenueAttributed)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Leads Generados</span>
                    <span className="font-bold text-indigo-700">{ch.leadsGenerated} prospectos</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">ROAS Promedio</span>
                    <span className="font-black text-emerald-700">{ch.roas.toFixed(1)}x</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>CPL Prom.: <b>{fmtCurrency(ch.cplAverage)}</b></span>
                <span>CAC Prom.: <b>{fmtCurrency(ch.cacAverage)}</b></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Registrar Gasto */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Registrar Gasto Publicitario / Factura
            </h3>
            <form onSubmit={handleSaveExpense} className="mt-4 space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  Campaña a Imputar
                </label>
                <select
                  value={expenseForm.campaignId}
                  onChange={e => setExpenseForm({ ...expenseForm, campaignId: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                >
                  {marketingCampaigns.map(camp => (
                    <option key={camp.id} value={camp.id}>
                      {camp.code} - {camp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={expenseForm.date}
                    onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Monto (MXN)</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={expenseForm.amount}
                    onChange={e => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">No. Factura / Folio</label>
                  <input
                    type="text"
                    required
                    value={expenseForm.invoiceNumber}
                    onChange={e => setExpenseForm({ ...expenseForm, invoiceNumber: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs font-mono"
                    placeholder="FAC-99120"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Categoría</label>
                  <select
                    value={expenseForm.category}
                    onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value as ExpenseCategory })}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                  >
                    <option value="PAID_ADS">Publicidad Pagada (Ads)</option>
                    <option value="STAND_EXPO">Stand & Ferias Industriales</option>
                    <option value="DISENO_PRODUCCION">Diseño & Producción Gráfica</option>
                    <option value="HERRAMIENTAS_SAAS">Herramientas & Software SaaS</option>
                    <option value="AGENCIA_EXTERNA">Agencia / Consultoría Externa</option>
                    <option value="OTRO">Otro Gasto de Marketing</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Proveedor</label>
                <input
                  type="text"
                  required
                  value={expenseForm.providerName}
                  onChange={e => setExpenseForm({ ...expenseForm, providerName: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                  placeholder="Ej. Google México, LinkedIn Ireland, Expo Cihac..."
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Concepto / Detalle</label>
                <input
                  type="text"
                  required
                  value={expenseForm.concept}
                  onChange={e => setExpenseForm({ ...expenseForm, concept: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                  placeholder="Consumo del mes de agosto campañas Search..."
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-xs"
                >
                  Registrar Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Nuevo Canal */}
      {isChannelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Nuevo Canal de Marketing
            </h3>
            <form onSubmit={handleSaveChannel} className="mt-4 space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Nombre del Canal</label>
                <input
                  type="text"
                  required
                  value={channelForm.name}
                  onChange={e => setChannelForm({ ...channelForm, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                  placeholder="Ej. YouTube Ads B2B"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Tipo de Canal</label>
                  <select
                    value={channelForm.type}
                    onChange={e => setChannelForm({ ...channelForm, type: e.target.value as ChannelType })}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                  >
                    <option value="GOOGLE_ADS">Google Ads</option>
                    <option value="LINKEDIN_ADS">LinkedIn Ads</option>
                    <option value="META_ADS">Meta (FB / IG)</option>
                    <option value="EMAIL_MARKETING">Email Marketing</option>
                    <option value="FERIA_INDUSTRIAL">Feria Industrial</option>
                    <option value="SEO_ORGANICO">SEO / Orgánico</option>
                    <option value="REFERIDO">Referidos / Alianzas</option>
                    <option value="OUTBOUND_PROSPECTING">Outbound Prospecting</option>
                    <option value="OTRO">Otro Canal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Ppto. Anual Est.</label>
                  <input
                    type="number"
                    min="0"
                    value={channelForm.totalBudget}
                    onChange={e => setChannelForm({ ...channelForm, totalBudget: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Descripción</label>
                <textarea
                  value={channelForm.description}
                  onChange={e => setChannelForm({ ...channelForm, description: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                  rows={3}
                  placeholder="Estrategia y enfoque del canal..."
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsChannelModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-xs"
                >
                  Guardar Canal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
