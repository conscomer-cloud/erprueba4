import React, { useState } from 'react';
import {
  Users,
  Search,
  ShieldAlert,
  TrendingUp,
  AlertCircle,
  Clock,
  Sparkles,
  DollarSign,
  Filter,
} from 'lucide-react';
import { CustomerProfitabilityRecord } from '../../types/erp';

interface CustomerProfitabilityManagerProps {
  customers: CustomerProfitabilityRecord[];
  onSelectCustomer?: (customerId: string) => void;
}

export const CustomerProfitabilityManager: React.FC<CustomerProfitabilityManagerProps> = ({
  customers,
  onSelectCustomer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<'ALL' | 'A' | 'B' | 'C' | 'D'>('ALL');
  const [filterRiskOnly, setFilterRiskOnly] = useState(false);

  const filtered = customers.filter((c) => {
    const matchesSearch =
      (c.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.code || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.rfc || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === 'ALL' || c.classification === selectedClass;
    const matchesRisk = !filterRiskOnly || c.creditRiskLevel === 'ALTO' || c.creditRiskLevel === 'CRITICO';
    return matchesSearch && matchesClass && matchesRisk;
  });

  const getHealthBadge = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    if (score >= 60) return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
  };

  const getClassBadge = (cls: string) => {
    switch (cls) {
      case 'A':
        return 'bg-yellow-400 text-slate-950 font-black';
      case 'B':
        return 'bg-blue-500/20 text-blue-300 border border-blue-500/40';
      case 'C':
        return 'bg-slate-800 text-slate-300';
      default:
        return 'bg-rose-950/40 text-rose-300 border border-rose-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls & Metrics */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl backdrop-blur-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-amber-400" />
              Segmento ABCD:
            </span>
            {(['ALL', 'A', 'B', 'C', 'D'] as const).map((cls) => (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  selectedClass === cls
                    ? 'bg-amber-400 text-slate-950 font-black'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                {cls === 'ALL' ? 'Todos los Clientes' : `Clase ${cls}`}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, código o RFC..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-lg border border-slate-800 bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-hidden min-w-[240px]"
              />
            </div>

            <button
              onClick={() => setFilterRiskOnly(!filterRiskOnly)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                filterRiskOnly
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Alto Riesgo Crediticio</span>
            </button>
          </div>
        </div>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((cust) => (
          <div
            key={cust.customerId}
            onClick={() => onSelectCustomer && onSelectCustomer(cust.customerId)}
            className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-md hover:border-amber-400/50 hover:bg-slate-900 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800/80">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-md ${getClassBadge(cust.classification)}`}>
                      Clase {cust.classification}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{cust.code}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-1 leading-snug">{cust.name}</h4>
                  <div className="text-[11px] text-slate-400">{cust.segment}</div>
                </div>

                <div className={`px-2.5 py-1 rounded-lg border text-center shrink-0 ${getHealthBadge(cust.healthScore)}`}>
                  <div className="text-[9px] font-bold uppercase">Health</div>
                  <div className="text-sm font-black">{cust.healthScore}</div>
                </div>
              </div>

              {/* Financial Metrics */}
              <div className="grid grid-cols-2 gap-2.5 my-3.5 text-xs">
                <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800/60">
                  <div className="text-[10px] text-slate-400">Venta Acumulada</div>
                  <div className="font-mono font-bold text-white mt-0.5">
                    ${(Number(cust.salesAccumulated) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800/60">
                  <div className="text-[10px] text-slate-400">Margen Neto</div>
                  <div className="font-mono font-bold text-emerald-400 mt-0.5">
                    ${(Number(cust.netProfit) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}{' '}
                    <span className="text-[10px]">({cust.netMarginPct}%)</span>
                  </div>
                </div>

                <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800/60">
                  <div className="text-[10px] text-slate-400">Saldo Cartera (CXC)</div>
                  <div className="font-mono font-bold text-amber-300 mt-0.5">
                    ${(Number(cust.currentArBalance) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800/60">
                  <div className="text-[10px] text-slate-400">Días Pago / Vencido</div>
                  <div className="font-mono font-bold mt-0.5">
                    <span className="text-slate-300">{cust.averagePaymentDays}d prom</span>
                    {cust.overdueArBalance > 0 && (
                      <span className="text-rose-400 ml-1.5 font-bold">(${(Number(cust.overdueArBalance) || 0).toLocaleString('es-MX')})</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Recommendation */}
            <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-300 flex items-start gap-1.5">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-400 mt-0.5" />
              <span className="leading-tight">{cust.aiRecommendation}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
